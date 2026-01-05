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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Protect Laravel Boost browser logs endpoint with authentication
        // This prevents unauthorized access to the logging endpoint
        $this->app->booted(function () {
            $route = Route::getRoutes()->getByName('boost.browser-logs');
            if ($route) {
                $route->middleware('auth');
            }
        });
    }
}
