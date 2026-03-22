<?php

namespace App\Http\Controllers;

use App\Services\ChangelogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChangelogController extends Controller
{
    public function __construct(
        private readonly ChangelogService $changelogService
    ) {}

    /**
     * Display the full changelog page.
     */
    public function index(): Response
    {
        return Inertia::render('changelog', [
            'releases' => $this->changelogService->getAllReleases(),
        ]);
    }

    /**
     * Acknowledge the current version so the modal does not appear again.
     */
    public function acknowledge(Request $request): JsonResponse
    {
        $currentVersion = config('app.version');

        if ($currentVersion && $request->user()) {
            $request->user()->update(['last_seen_version' => $currentVersion]);
        }

        return response()->json(['acknowledged' => true]);
    }
}
