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

        // Get number of lines to show (default: 100, max: 1000)
        $lineCount = min($request->input('lines', 100), 1000);

        // Read last N lines efficiently using tail command
        $lines = $this->readLastLines($logPath, $lineCount);

        // Parse log entries
        $logs = $this->parseLogEntries($lines);

        return Inertia::render('Logs/Index', [
            'logs' => $logs,
            'totalLines' => count($logs),
        ]);
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

        // Get all log files
        $files = array_filter(
            scandir($logsDirectory, SCANDIR_SORT_DESCENDING) ?: [],
            fn ($file) => str_ends_with($file, '.log') && $file !== '.' && $file !== '..'
        );

        if (empty($files)) {
            return null;
        }

        // Return the first file (most recent due to SCANDIR_SORT_DESCENDING)
        return $logsDirectory . DIRECTORY_SEPARATOR . reset($files);
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

                // Start new entry
                $currentEntry = [
                    'timestamp' => $matches[1],
                    'environment' => $matches[2],
                    'level' => $matches[3],
                    'message' => $matches[4],
                    'stacktrace' => [],
                ];
            } elseif ($currentEntry !== null && ! empty(trim($line))) {
                // Add to stacktrace of current entry (only non-empty lines)
                $currentEntry['stacktrace'][] = $line;
            }
        }

        // Add last entry
        if ($currentEntry !== null) {
            $entries[] = $currentEntry;
        }

        return $entries;
    }
}
