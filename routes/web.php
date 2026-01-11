<?php

use App\Http\Controllers\MapboxController;
use App\Http\Controllers\MarkerController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\TourController;
use App\Http\Controllers\TripController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Rap2hpoutre\LaravelLogViewer\LogViewerController;

Route::get('/', function () {
    return Inertia::render('map');
})->middleware(['auth', 'verified'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Trip routes
    Route::get('/trips', [TripController::class, 'index'])->name('trips.index');
    Route::post('/trips', [TripController::class, 'store'])->name('trips.store');
    Route::get('/trips/{trip}', [TripController::class, 'show'])->name('trips.show');
    Route::put('/trips/{trip}', [TripController::class, 'update'])->name('trips.update');
    Route::delete('/trips/{trip}', [TripController::class, 'destroy'])->name('trips.destroy');

    // Tour routes
    Route::get('/tours', [TourController::class, 'index'])->name('tours.index');
    Route::post('/tours', [TourController::class, 'store'])->name('tours.store');
    Route::get('/tours/{tour}', [TourController::class, 'show'])->name('tours.show');
    Route::put('/tours/{tour}', [TourController::class, 'update'])->name('tours.update');
    Route::delete('/tours/{tour}', [TourController::class, 'destroy'])->name('tours.destroy');
    Route::post('/tours/{tour}/markers', [TourController::class, 'attachMarker'])->name('tours.markers.attach');
    Route::delete('/tours/{tour}/markers', [TourController::class, 'detachMarker'])->name('tours.markers.detach');
    Route::put('/tours/{tour}/markers/reorder', [TourController::class, 'reorderMarkers'])->name('tours.markers.reorder');

    // Marker routes
    Route::get('/markers', [MarkerController::class, 'index'])->name('markers.index');
    Route::post('/markers', [MarkerController::class, 'store'])->name('markers.store');
    Route::put('/markers/{marker}', [MarkerController::class, 'update'])->name('markers.update');
    Route::delete('/markers/{marker}', [MarkerController::class, 'destroy'])->name('markers.destroy');
    Route::post('/markers/search-nearby', [MarkerController::class, 'searchNearby'])->name('markers.search-nearby');
    Route::get('/markers/place-types', [MarkerController::class, 'placeTypes'])->name('markers.place-types');

    // Route routes
    Route::get('/routes', [RouteController::class, 'index'])->name('routes.index');
    Route::post('/routes', [RouteController::class, 'store'])->name('routes.store');
    Route::get('/routes/{route}', [RouteController::class, 'show'])->name('routes.show');
    Route::delete('/routes/{route}', [RouteController::class, 'destroy'])->name('routes.destroy');

    // Mapbox routes
    Route::get('/mapbox/usage', [MapboxController::class, 'usage'])->name('mapbox.usage');

    // Log Viewer - only accessible to authenticated and verified users
    Route::get('logs', [LogViewerController::class, 'index'])->name('logs');
});

require __DIR__.'/settings.php';
