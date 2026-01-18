<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register MapboxPlacesService with access token from config
        $this->app->singleton(\App\Services\MapboxPlacesService::class, function ($app) {
            $accessToken = config('services.mapbox.access_token');

            return new \App\Services\MapboxPlacesService(
                accessToken: $accessToken ?: null
            );
        });

        // Register MarkerEnrichmentAgentService with API credentials from config
        $this->app->singleton(\App\Services\MarkerEnrichmentAgentService::class, function ($app) {
            return new \App\Services\MarkerEnrichmentAgentService(
                apiKey: config('services.lechat.api_key'),
                agentId: config('services.lechat.marker_enrichment_agent_id')
            );
        });

        // Register TravelRecommendationAgentService with API credentials from config
        $this->app->singleton(\App\Services\TravelRecommendationAgentService::class, function ($app) {
            return new \App\Services\TravelRecommendationAgentService(
                apiKey: config('services.lechat.api_key'),
                agentId: config('services.lechat.travel_recommendation_agent_id')
            );
        });

        // Register UnsplashService with API credentials from config
        $this->app->singleton(\App\Services\UnsplashService::class, function ($app) {
            return new \App\Services\UnsplashService(
                accessKey: config('services.unsplash.access_key'),
                utmSource: config('services.unsplash.utm_source')
            );
        });

        // Register MapboxStaticImageService with access token from config
        $this->app->singleton(\App\Services\MapboxStaticImageService::class, function ($app) {
            $accessToken = config('services.mapbox.access_token');

            return new \App\Services\MapboxStaticImageService(
                accessToken: $accessToken ?: null
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Protect Laravel Boost browser logs endpoint with authentication
        // Laravel Boost (dev dependency) provides a browser logging endpoint that should
        // be protected to prevent unauthorized access if accidentally enabled in production.
        // The route name is defined by the Boost package as 'boost.browser-logs'.
        $this->app->booted(function () {
            $boostRouteName = 'boost.browser-logs';
            $route = Route::getRoutes()->getByName($boostRouteName);

            if ($route) {
                $route->middleware('auth');
            }
        });
    }
}
