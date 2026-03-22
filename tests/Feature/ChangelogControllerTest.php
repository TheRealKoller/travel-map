<?php

use App\Models\User;
use App\Services\ChangelogService;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

// ────────────────────────────────────────────────────
// GET /changelog
// ────────────────────────────────────────────────────

it('shows the changelog page for authenticated users', function () {
    $response = $this->actingAs($this->user)->get('/changelog');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('changelog')
        ->has('releases')
    );
});

it('redirects unauthenticated users away from the changelog page', function () {
    $response = $this->get('/changelog');

    $response->assertRedirect('/login');
});

// ────────────────────────────────────────────────────
// POST /changelog/acknowledge
// ────────────────────────────────────────────────────

it('sets last_seen_version to the current app version on acknowledge', function () {
    Config::set('app.version', 'v1.2.3');

    $response = $this->actingAs($this->user)->postJson('/changelog/acknowledge');

    $response->assertOk()
        ->assertJson(['acknowledged' => true]);

    $this->assertDatabaseHas('users', [
        'id' => $this->user->id,
        'last_seen_version' => 'v1.2.3',
    ]);
});

it('returns acknowledged true even when no version is configured', function () {
    Config::set('app.version', null);

    $response = $this->actingAs($this->user)->postJson('/changelog/acknowledge');

    $response->assertOk()
        ->assertJson(['acknowledged' => true]);

    // last_seen_version should remain unchanged
    $this->assertDatabaseHas('users', [
        'id' => $this->user->id,
        'last_seen_version' => null,
    ]);
});

it('requires authentication to acknowledge changelog', function () {
    $response = $this->postJson('/changelog/acknowledge');

    $response->assertUnauthorized();
});

// ────────────────────────────────────────────────────
// ChangelogService: CHANGELOG.md parsing
// ────────────────────────────────────────────────────

it('parses all releases from CHANGELOG.md', function () {
    $service = app(ChangelogService::class);

    $releases = $service->getAllReleases();

    expect($releases)->toBeArray();
    // The real CHANGELOG.md has at least one release
    expect($releases)->not->toBeEmpty();
    expect($releases[0])->toHaveKeys(['version', 'date', 'sections']);
});

it('returns only the latest release for a new user (no last_seen_version)', function () {
    $service = app(ChangelogService::class);

    $releases = $service->getReleasesSince(null);

    // New user: only 1 release (the latest)
    expect($releases)->toHaveCount(1);
});

it('returns releases newer than the given version', function () {
    $service = app(ChangelogService::class);
    $allReleases = $service->getAllReleases();

    if (count($allReleases) < 2) {
        $this->markTestSkipped('Need at least 2 releases in CHANGELOG.md');
    }

    // Use the oldest release version as baseline
    $oldestVersion = end($allReleases)['version'];

    $newReleases = $service->getReleasesSince($oldestVersion);

    expect($newReleases)->not->toBeEmpty();
    foreach ($newReleases as $release) {
        expect(version_compare($release['version'], $oldestVersion, '>'))->toBeTrue();
    }
});

it('returns empty array when already on the latest version', function () {
    $service = app(ChangelogService::class);
    $allReleases = $service->getAllReleases();

    if (empty($allReleases)) {
        $this->markTestSkipped('No releases in CHANGELOG.md');
    }

    $latestVersion = $allReleases[0]['version'];

    $releases = $service->getReleasesSince($latestVersion);

    expect($releases)->toBeEmpty();
});

// ────────────────────────────────────────────────────
// Inertia shared prop: changelog
// ────────────────────────────────────────────────────

it('shares null changelog prop when app version is not set', function () {
    Config::set('app.version', null);

    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('changelog', null)
    );
});

it('shares null changelog prop when user has already seen the current version', function () {
    Config::set('app.version', 'v1.0.0');
    $this->user->update(['last_seen_version' => 'v1.0.0']);

    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('changelog', null)
    );
});

it('shares changelog prop with new releases when a newer version is deployed', function () {
    $service = app(ChangelogService::class);
    $allReleases = $service->getAllReleases();

    if (count($allReleases) < 2) {
        $this->markTestSkipped('Need at least 2 releases in CHANGELOG.md');
    }

    // Set app version to the latest release
    $latestVersion = $allReleases[0]['version'];
    $olderVersion = $allReleases[count($allReleases) - 1]['version'];

    Config::set('app.version', $latestVersion);
    $this->user->update(['last_seen_version' => $olderVersion]);

    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('changelog')
        ->has('changelog.newReleases')
        ->where('changelog.newReleases.0.version', $latestVersion)
    );
});

it('shares changelog prop with latest release for new users without last_seen_version', function () {
    $service = app(ChangelogService::class);
    $allReleases = $service->getAllReleases();

    if (empty($allReleases)) {
        $this->markTestSkipped('No releases in CHANGELOG.md');
    }

    $latestVersion = $allReleases[0]['version'];
    Config::set('app.version', $latestVersion);

    // New user: last_seen_version is null
    $this->user->update(['last_seen_version' => null]);

    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('changelog')
        ->has('changelog.newReleases')
        ->where('changelog.newReleases.0.version', $latestVersion)
    );
});
