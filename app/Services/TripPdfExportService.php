<?php

namespace App\Services;

use App\Models\Trip;
use App\Support\ImageHelper;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use League\CommonMark\CommonMarkConverter;
use League\CommonMark\Exception\CommonMarkException;

class TripPdfExportService
{
    public function __construct(
        private readonly UnsplashService $unsplashService,
        private readonly MapboxStaticImageService $mapboxStaticImageService
    ) {}

    /**
     * Generate a PDF document for a trip.
     * Includes trip information, maps, markers, tours, and routes.
     */
    public function generatePdf(Trip $trip): HttpResponse
    {
        // Track trip image download as per Unsplash guidelines
        $this->trackTripImageDownload($trip);

        // Load markers for the trip
        $markers = $trip->markers()->get(['latitude', 'longitude'])->toArray();

        // Generate static image URL for markers overview if markers exist
        $markersOverviewUrl = null;
        if (! empty($markers)) {
            $markersOverviewUrl = $this->mapboxStaticImageService->generateStaticImageWithMarkers(
                markers: $markers,
                width: 800,
                height: 600,
                padding: 50
            );
        }

        // Load tours with their markers and routes
        $tours = $trip->tours()->with(['markers', 'routes'])->get();

        // Generate tour data with static maps
        $toursData = $this->prepareToursData($tours);

        // Convert external URLs to base64 data URIs for DomPDF compatibility
        $viewportImageUrl = $trip->viewport_static_image_url ? ImageHelper::convertToBase64($trip->viewport_static_image_url) : null;
        $markersOverviewBase64 = $markersOverviewUrl ? ImageHelper::convertToBase64($markersOverviewUrl) : null;
        $tripImageBase64 = $trip->image_url ? ImageHelper::convertToBase64($trip->image_url) : null;

        // Convert trip notes from Markdown to HTML if they exist
        $tripNotesHtml = $trip->notes ? $this->convertMarkdownToHtml($trip->notes) : null;

        // Build table of contents
        $tableOfContents = $this->buildTableOfContents($toursData, count($markers));

        // Calculate summary statistics
        $summaryStats = $this->calculateSummaryStats($trip, $toursData, $tours);

        // Generate consistent timestamp for the entire PDF
        $generatedAt = now();

        $pdf = Pdf::loadView('trip-pdf', [
            'trip' => $trip,
            'tripImageUrl' => $tripImageBase64,
            'tripNotesHtml' => $tripNotesHtml,
            'viewportImageUrl' => $viewportImageUrl,
            'markersOverviewUrl' => $markersOverviewBase64,
            'markersCount' => count($markers),
            'tours' => $toursData,
            'tableOfContents' => $tableOfContents,
            'summaryStats' => $summaryStats,
            'generatedAt' => $generatedAt,
        ]);

        // Generate a safe filename from the trip name
        $filename = preg_replace('/[^A-Za-z0-9_\-]/', '_', $trip->name).'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Track trip image download for Unsplash attribution.
     */
    private function trackTripImageDownload(Trip $trip): void
    {
        if ($trip->unsplash_download_location) {
            try {
                $this->unsplashService->trackDownload($trip->unsplash_download_location);
            } catch (\Exception $e) {
                Log::warning('Failed to track trip image download', [
                    'trip_id' => $trip->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Build table of contents data structure.
     * Creates a simplified TOC without page numbers (DomPDF limitation).
     *
     * @param  array  $toursData  Array of tours with markers
     * @param  int  $markersCount  Total number of markers
     * @return array Table of contents data
     */
    private function buildTableOfContents(array $toursData, int $markersCount): array
    {
        $toc = [
            'hasOverview' => $markersCount > 0,
            'tours' => [],
        ];

        foreach ($toursData as $tour) {
            $tourEntry = [
                'name' => $tour['name'],
                'markerCount' => count($tour['markers']),
                'estimatedDurationHours' => $tour['estimated_duration_hours'],
                'markers' => [],
            ];

            foreach ($tour['markers'] as $marker) {
                $tourEntry['markers'][] = [
                    'name' => $marker['name'],
                    'type' => $marker['type'],
                    'isUnesco' => $marker['is_unesco'],
                ];
            }

            $toc['tours'][] = $tourEntry;
        }

        return $toc;
    }

    /**
     * Calculate trip summary statistics.
     * Computes total locations, tours, duration, distance, UNESCO sites, and marker type distribution.
     *
     * @param  Trip  $trip  The trip instance
     * @param  array  $toursData  Prepared tours data array
     * @return array Summary statistics
     */
    private function calculateSummaryStats(Trip $trip, array $toursData, $tours): array
    {
        $totalLocations = 0;
        $totalDuration = 0.0;
        $totalDistance = 0.0;
        $unescoCount = 0;
        $markerTypes = [];
        $tourBreakdown = [];

        foreach ($toursData as $tour) {
            $tourLocationCount = count($tour['markers']);
            $totalLocations += $tourLocationCount;

            $tourDuration = (float) ($tour['estimated_duration_hours'] ?? 0);
            $totalDuration += $tourDuration;

            // Calculate distance for this tour
            $tourDistance = 0.0;
            $tourModel = $tours->firstWhere('id', $tour['id']);
            if ($tourModel) {
                foreach ($tourModel->routes as $route) {
                    if (! empty($route->distance)) {
                        $routeDistanceKm = $route->distance_in_km;
                        $tourDistance += $routeDistanceKm;
                        $totalDistance += $routeDistanceKm;
                    }
                }
            }

            // Tour breakdown
            $tourBreakdown[] = [
                'name' => $tour['name'],
                'markerCount' => $tourLocationCount,
                'duration' => $tourDuration,
                'distance' => $tourDistance,
            ];

            // Process markers
            foreach ($tour['markers'] as $marker) {
                // Count UNESCO sites
                if ($marker['is_unesco']) {
                    $unescoCount++;
                }

                // Count marker types
                $type = $marker['type'] ?? 'other';
                if (! isset($markerTypes[$type])) {
                    $markerTypes[$type] = 0;
                }
                $markerTypes[$type]++;
            }
        }

        // Sort marker types by count (descending)
        arsort($markerTypes);

        // Convert marker types to distribution array with percentages
        $markerTypeDistribution = [];
        foreach ($markerTypes as $type => $count) {
            $percentage = $totalLocations > 0 ? (int) round(($count / $totalLocations) * 100) : 0;
            $markerTypeDistribution[] = [
                'type' => $type,
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        return [
            'totalLocations' => $totalLocations,
            'totalTours' => count($toursData),
            'totalDuration' => $totalDuration,
            'totalDistance' => $totalDistance,
            'unescoCount' => $unescoCount,
            'tourBreakdown' => $tourBreakdown,
            'markerTypeDistribution' => $markerTypeDistribution,
        ];
    }

    /**
     * Prepare tour data with markers, routes, and static maps.
     */
    private function prepareToursData(\Illuminate\Database\Eloquent\Collection $tours): array
    {
        $toursData = [];

        foreach ($tours as $tour) {
            $tourMarkers = $tour->markers->map(function ($marker) {
                // Track marker image download as per Unsplash guidelines
                if ($marker->unsplash_download_location) {
                    try {
                        $this->unsplashService->trackDownload($marker->unsplash_download_location);
                    } catch (\Exception $e) {
                        Log::warning('Failed to track marker image download', [
                            'marker_id' => $marker->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                // Convert marker image to base64 for PDF
                $markerImageBase64 = null;
                if ($marker->image_url) {
                    $markerImageBase64 = ImageHelper::convertToBase64($marker->image_url);
                }

                return [
                    'id' => $marker->id,
                    'name' => $marker->name,
                    'type' => $marker->type,
                    'latitude' => $marker->latitude,
                    'longitude' => $marker->longitude,
                    'notes' => $marker->notes,
                    'notes_html' => $marker->notes ? $this->convertMarkdownToHtml($marker->notes) : null,
                    'url' => $marker->url,
                    'is_unesco' => $marker->is_unesco,
                    'estimated_hours' => $marker->estimated_hours,
                    'qr_code' => $marker->url ? $this->generateQrCode($marker->url) : null,
                    'image_base64' => $markerImageBase64,
                ];
            })->toArray();

            $tourRoutes = $tour->routes->map(function ($route) {
                return [
                    'geometry' => $route->geometry,
                    'distance' => $route->distance,
                    'duration' => $route->duration,
                ];
            })->toArray();

            // Generate static map for this tour
            $tourMapBase64 = $this->generateTourMap($tour, $tourMarkers, $tourRoutes);

            $toursData[] = [
                'id' => $tour->id,
                'name' => $tour->name,
                'markers' => $tourMarkers,
                'mapUrl' => $tourMapBase64,
                'estimated_duration_hours' => $tour->estimated_duration_hours,
            ];
        }

        return $toursData;
    }

    /**
     * Generate a static map for a tour with markers and routes.
     *
     * @return string|null Base64 encoded map image or null if generation fails
     */
    private function generateTourMap($tour, array $tourMarkers, array $tourRoutes): ?string
    {
        $tourMapBase64 = null;

        if (! empty($tourMarkers)) {
            try {
                $tourMapUrl = null;

                if (! empty($tourRoutes)) {
                    // Generate map with both markers and routes
                    $tourMapUrl = $this->mapboxStaticImageService->generateStaticImageWithMarkersAndRoutes(
                        markers: $tourMarkers,
                        routes: $tourRoutes,
                        width: 800,
                        height: 600,
                        padding: 20
                    );
                } else {
                    // Generate map with only markers
                    $tourMapUrl = $this->mapboxStaticImageService->generateStaticImageWithMarkers(
                        markers: $tourMarkers,
                        width: 800,
                        height: 600,
                        padding: 20
                    );
                }

                if ($tourMapUrl) {
                    Log::info('Generated tour map URL', ['tour' => $tour->name, 'url_length' => strlen($tourMapUrl)]);
                    $tourMapBase64 = ImageHelper::convertToBase64($tourMapUrl);
                    if (! $tourMapBase64) {
                        Log::warning('Failed to convert tour map to base64', ['tour' => $tour->name]);
                    }
                } else {
                    Log::warning('Tour map URL is null', ['tour' => $tour->name]);
                }
            } catch (\Exception $e) {
                Log::error('Error generating tour map', [
                    'tour' => $tour->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $tourMapBase64;
    }

    /**
     * Convert Markdown text to HTML.
     *
     * @param  string  $markdown  The Markdown text to convert
     * @return string The converted HTML
     */
    private function convertMarkdownToHtml(string $markdown): string
    {
        try {
            $converter = new CommonMarkConverter([
                'html_input' => 'strip',
                'allow_unsafe_links' => false,
            ]);

            return $converter->convert($markdown)->getContent();
        } catch (CommonMarkException $e) {
            Log::warning('Failed to convert Markdown to HTML', [
                'error' => $e->getMessage(),
            ]);

            // Return plain text as fallback
            return htmlspecialchars($markdown);
        }
    }

    /**
     * Generate a QR code for a given URL.
     * Returns an SVG data URI that can be embedded directly in the PDF.
     *
     * @param  string  $url  The URL to encode in the QR code
     * @return string The SVG data URI
     */
    private function generateQrCode(string $url): string
    {
        try {
            $renderer = new ImageRenderer(
                new RendererStyle(200, 0),
                new SvgImageBackEnd
            );
            $writer = new Writer($renderer);
            $qrCodeSvg = $writer->writeString($url);

            // Convert SVG to data URI
            return 'data:image/svg+xml;base64,'.base64_encode($qrCodeSvg);
        } catch (\Exception $e) {
            Log::error('Error generating QR code', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return '';
        }
    }
}
