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
            return new \App\Services\MapboxPlacesService(
                accessToken: config('services.mapbox.access_token')
            );
        });

        // Register LeChatAgentService with API credentials from config
        $this->app->singleton(\App\Services\LeChatAgentService::class, function ($app) {
            return new \App\Services\LeChatAgentService(
                apiKey: config('services.lechat.api_key'),
                agentId: config('services.lechat.agent_id')
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
