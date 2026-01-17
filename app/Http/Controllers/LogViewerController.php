<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class LogViewerController extends Controller
{
    /**
     * Display the application logs.
     */
    public function index(Request $request): Response
    {
        $logPath = $this->getLatestLogFile();

        // Check if log file exists
        if (! $logPath || ! File::exists($logPath)) {
            return Inertia::render('Logs/Index', [
                'logs' => [],
                'totalLines' => 0,
                'message' => 'No log files found in storage/logs/',
            ]);
        }

        // Get number of entries to show (default: 50, max: 200)
        $entryCount = min($request->input('entries', 50), 200);

        try {
            // Read more lines to ensure we capture enough log entries
            // (since entries can have long stacktraces)
            $lines = $this->readLastLines($logPath, 2000);

            // Parse log entries
            $allLogs = $this->parseLogEntries($lines);

            // Take only the last N entries
            $logs = array_slice($allLogs, -$entryCount);

            return Inertia::render('Logs/Index', [
                'logs' => $logs,
                'totalLines' => count($logs),
            ]);
        } catch (\Exception $e) {
            // If parsing fails, return error message
            return Inertia::render('Logs/Index', [
                'logs' => [],
                'totalLines' => 0,
                'message' => 'Error reading logs: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Get the latest log file (supports daily logging with date-based filenames).
     */
    private function getLatestLogFile(): ?string
    {
        $logsDirectory = storage_path('logs');

        if (! is_dir($logsDirectory)) {
            return null;
        }

        // Get all Laravel log files (exclude browser.log and other non-Laravel logs)
        $files = glob($logsDirectory.DIRECTORY_SEPARATOR.'laravel*.log');

        if (empty($files)) {
            return null;
        }

        // Sort by modification time (newest first)
        usort($files, function ($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        // Return the most recently modified file
        return $files[0];
    }

    /**
     * Read last N lines from a file efficiently.
     */
    private function readLastLines(string $filePath, int $lines): array
    {
        // For Windows, use Get-Content with -Tail
        if (PHP_OS_FAMILY === 'Windows') {
            $command = sprintf(
                'powershell -NoProfile -Command "Get-Content -Path \'%s\' -Tail %d"',
                $filePath,
                $lines
            );
        } else {
            // For Unix-like systems, use tail
            $command = sprintf('tail -n %d %s', $lines, escapeshellarg($filePath));
        }

        $output = [];
        exec($command, $output);

        return array_reverse($output);
    }

    /**
     * Parse log entries from lines.
     */
    private function parseLogEntries(array $lines): array
    {
        $entries = [];
        $currentEntry = null;

        foreach ($lines as $line) {
            // Skip empty lines
            if (trim($line) === '') {
                continue;
            }

            // Check if line starts a new log entry
            if (preg_match('/^\[([\d\-: ]+)\] (\w+)\.(\w+): (.*)$/', $line, $matches)) {
                // Save previous entry if exists
                if ($currentEntry !== null) {
                    $entries[] = $currentEntry;
                }

                // Truncate very long messages to prevent JSON serialization issues
                $message = $matches[4];
                if (strlen($message) > 300) {
                    $message = substr($message, 0, 300).' ... (truncated)';
                }

                // Start new entry
                $currentEntry = [
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => $matches[3],
                    'message' => $message,
                    'stacktrace' => [],
                ];
            } elseif ($currentEntry !== null && ! empty(trim($line))) {
                // Limit stacktrace lines per entry (max 20 lines)
                if (count($currentEntry['stacktrace']) < 20) {
                    // Truncate long stacktrace lines
                    $truncatedLine = strlen($line) > 200 ? substr($line, 0, 200).' ...' : $line;
                    $currentEntry['stacktrace'][] = $truncatedLine;
                }
            }
        }

        // Add last entry
        if ($currentEntry !== null) {
            $entries[] = $currentEntry;
        }

        return $entries;
    }
}
