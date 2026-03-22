<?php

namespace App\Services;

class ChangelogService
{
    /**
     * Parse the CHANGELOG.md and return all releases as a structured array.
     *
     * @return array<int, array{version: string, date: string, sections: array<string, list<string>>}>
     */
    public function getAllReleases(): array
    {
        $changelogPath = base_path('CHANGELOG.md');

        if (! file_exists($changelogPath)) {
            return [];
        }

        $content = file_get_contents($changelogPath);

        if ($content === false) {
            return [];
        }

        return $this->parseChangelog($content);
    }

    /**
     * Get releases that are newer than the given version.
     * Returns only the latest release when $sinceVersion is null (new user),
     * to avoid overwhelming them with the full history.
     *
     * @return array<int, array{version: string, date: string, sections: array<string, list<string>>}>
     */
    public function getReleasesSince(?string $sinceVersion): array
    {
        $releases = $this->getAllReleases();

        if ($sinceVersion === null) {
            // New user: show only the latest release to avoid overwhelming them
            return array_slice($releases, 0, 1);
        }

        $newerReleases = [];

        foreach ($releases as $release) {
            if (version_compare($release['version'], $sinceVersion, '>')) {
                $newerReleases[] = $release;
            }
        }

        return $newerReleases;
    }

    /**
     * Parse a CHANGELOG.md string in "Keep a Changelog" format.
     *
     * @return array<int, array{version: string, date: string, sections: array<string, list<string>>}>
     */
    private function parseChangelog(string $content): array
    {
        $releases = [];
        $lines = explode("\n", $content);

        $currentRelease = null;
        $currentSection = null;

        foreach ($lines as $line) {
            // Match release headers: ## [v1.2.3] - 2026-01-15
            if (preg_match('/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/', $line, $matches)) {
                if ($currentRelease !== null) {
                    $releases[] = $currentRelease;
                }

                $currentRelease = [
                    'version' => ltrim($matches[1], 'v'),
                    'date' => $matches[2],
                    'sections' => [],
                ];
                $currentSection = null;

                continue;
            }

            if ($currentRelease === null) {
                continue;
            }

            // Match section headers: ### Added / ### Fixed / etc.
            if (preg_match('/^### (.+)$/', $line, $matches)) {
                $currentSection = $matches[1];
                $currentRelease['sections'][$currentSection] = [];

                continue;
            }

            // Match list items under a section
            if ($currentSection !== null && preg_match('/^[-*] (.+)$/', $line, $matches)) {
                $currentRelease['sections'][$currentSection][] = $matches[1];
            }
        }

        if ($currentRelease !== null) {
            $releases[] = $currentRelease;
        }

        return $releases;
    }
}
