<?php

namespace App\Http\Controllers;

use App\Http\Requests\FetchTripImageRequest;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Models\Trip;
use App\Services\TripPdfExportService;
use App\Services\UnsplashService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class TripController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly UnsplashService $unsplashService,
        private readonly TripPdfExportService $tripPdfExportService
    ) {}

    public function index(Request $request): JsonResponse|Response
    {
        $user = auth()->user();

        // Get all accessible trips (both owned and shared) in a single query
        $trips = $user->allAccessibleTrips()
            ->orderBy('created_at', 'asc')
            ->get();

        // If this is an API request (has Accept: application/json), return JSON
        if ($request->expectsJson()) {
            return response()->json($trips);
        }

        // Otherwise, return the Inertia page
        return Inertia::render('trips/index');
    }

    public function create(): Response
    {
        return Inertia::render('trips/create');
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $trip = auth()->user()->trips()->create($validated);

        // Auto-fetch image if both name and country are provided and no image_url yet
        $this->unsplashService->autoFetchTripImage($trip);

        return response()->json($trip->fresh(), 201);
    }

    public function edit(Trip $trip): Response
    {
        $this->authorize('update', $trip);

        return Inertia::render('trips/create', [
            'trip' => $trip,
        ]);
    }

    public function show(Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        return response()->json($trip);
    }

    public function update(UpdateTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('update', $trip);

        $validated = $request->validated();

        $trip->update($validated);

        // Auto-fetch image if both name and country are provided and no image_url yet
        $this->unsplashService->autoFetchTripImage($trip);

        return response()->json($trip->fresh());
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->authorize('delete', $trip);

        $trip->delete();

        return response()->json(null, 204);
    }

    /**
     * Export a trip as PDF.
     * Generates a PDF document with trip information including name, title image, map viewport, and markers overview.
     */
    public function exportPdf(Request $request, Trip $trip): HttpResponse
    {
        $this->authorize('view', $trip);

        // Get template from query parameter, default to 'modern'
        $template = $request->query('template', 'modern');

        // Validate template
        $validTemplates = ['modern', 'professional', 'minimalist', 'compact'];
        if (! in_array($template, $validTemplates)) {
            $template = 'modern';
        }

        return $this->tripPdfExportService->generatePdf($trip, $template);
    }

    /**
     * Fetch an Unsplash image for a trip.
     * This endpoint is called when the user clicks on the image placeholder.
     */
    public function fetchImage(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $photoData = $this->unsplashService->getPhotoForTrip($trip->name, $trip->country);

        if (! $photoData) {
            throw new \App\Exceptions\BusinessLogicException('No image found for this trip', 404);
        }

        // Track the download to increment view count
        if (isset($photoData['download_location'])) {
            $this->unsplashService->trackDownload($photoData['download_location']);
        }

        // Update the trip with the image URL and download location (hotlinked from Unsplash)
        $trip->update([
            'image_url' => $photoData['urls']['regular'] ?? null,
            'unsplash_download_location' => $photoData['download_location'] ?? null,
        ]);

        return response()->json([
            'photo' => $photoData,
            'trip' => $trip->fresh(),
        ]);
    }

    /**
     * Fetch multiple Unsplash images for a trip without persisting them.
     * Used to preview/refresh images before saving a trip.
     */
    public function fetchImagePreview(FetchTripImageRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $photos = $this->unsplashService->getMultiplePhotosForTrip(
            $validated['name'],
            $validated['country'] ?? null,
            10
        );

        if (empty($photos)) {
            throw new \App\Exceptions\BusinessLogicException('No images found for this trip', 404);
        }

        return response()->json([
            'photos' => $photos,
        ]);
    }

    /**
     * Generate or refresh the invitation token for a trip.
     */
    public function generateInvitationToken(Trip $trip): JsonResponse
    {
        $this->authorize('update', $trip);

        $token = $trip->generateInvitationToken();

        return response()->json([
            'token' => $token,
            'url' => $trip->getInvitationUrl(),
        ]);
    }

    /**
     * Show the trip preview page using the invitation token.
     * This page is accessible to authenticated users only.
     */
    public function showPreview(string $token): Response
    {
        $trip = Trip::where('invitation_token', $token)->firstOrFail();

        // Load the trip with its markers
        $trip->load(['markers']);

        // Check if user is already a collaborator or owner
        $isCollaborator = $trip->hasAccess(auth()->user());

        return Inertia::render('trips/preview', [
            'trip' => $trip,
            'isCollaborator' => $isCollaborator,
        ]);
    }

    /**
     * Join a trip using the invitation token.
     * Adds the authenticated user as a collaborator to the trip.
     */
    public function joinTrip(string $token): JsonResponse
    {
        $trip = Trip::where('invitation_token', $token)->firstOrFail();
        $user = auth()->user();

        // Check if user is already the owner
        if ($trip->isOwner($user)) {
            throw new \App\Exceptions\BusinessLogicException('You are already the owner of this trip', 400);
        }

        // Check if user is already a collaborator
        if ($trip->sharedUsers()->where('user_id', $user->id)->exists()) {
            throw new \App\Exceptions\BusinessLogicException('You are already a collaborator on this trip', 400);
        }

        // Add user as collaborator with 'editor' role
        $trip->sharedUsers()->attach($user->id, ['collaboration_role' => 'editor']);

        return response()->json([
            'message' => 'Successfully joined the trip',
            'trip' => $trip,
        ]);
    }
}
