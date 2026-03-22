<?php

namespace App\Http\Middleware;

use App\Services\ChangelogService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        private readonly ChangelogService $changelogService
    ) {}

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        // Get language from cookie with whitelist validation
        $language = $request->cookie('language', 'de');
        $validLanguages = ['de', 'en'];
        $language = in_array($language, $validLanguages, true) ? $language : 'de';

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'csrf_token' => csrf_token(),
            'language' => $language,
            'changelog' => $this->buildChangelogProp($request),
        ];
    }

    /**
     * Build the changelog shared prop.
     *
     * Returns new releases since last_seen_version when a newer version is deployed,
     * or null when there is nothing new to show.
     *
     * @return array{newReleases: list<array{version: string, date: string, sections: array<string, list<string>>}>}|null
     */
    private function buildChangelogProp(Request $request): ?array
    {
        $user = $request->user();
        $currentVersion = config('app.version');

        // No app version configured or user not authenticated – nothing to show
        if (! $currentVersion || ! $user) {
            return null;
        }

        $lastSeenVersion = $user->last_seen_version;

        // Current version already seen – no modal needed
        if ($lastSeenVersion === $currentVersion) {
            return null;
        }

        $newReleases = $this->changelogService->getReleasesSince($lastSeenVersion);

        if (empty($newReleases)) {
            return null;
        }

        // Filter out releases that are ahead of the currently deployed version,
        // e.g. when the changelog in the repo is ahead of the latest deployment.
        $normalizedCurrentVersion = ltrim((string) $currentVersion, 'vV');

        $newReleases = array_values(array_filter(
            $newReleases,
            static fn (array $release): bool => isset($release['version']) &&
                version_compare(ltrim($release['version'], 'vV'), $normalizedCurrentVersion, '<=')
        ));

        if (empty($newReleases)) {
            return null;
        }

        return ['newReleases' => $newReleases];
    }
}
