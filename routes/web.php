<?php

use App\Http\Controllers\MarkerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('map');
})->middleware(['auth', 'verified'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Marker routes
    Route::get('/markers', [MarkerController::class, 'index'])->name('markers.index');
    Route::post('/markers', [MarkerController::class, 'store'])->name('markers.store');
    Route::put('/markers/{marker}', [MarkerController::class, 'update'])->name('markers.update');
    Route::delete('/markers/{marker}', [MarkerController::class, 'destroy'])->name('markers.destroy');
});

require __DIR__.'/settings.php';
