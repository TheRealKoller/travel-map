<?php

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
    Route::get('/markers', [App\Http\Controllers\MarkerController::class, 'index'])->name('markers.index');
    Route::post('/markers', [App\Http\Controllers\MarkerController::class, 'store'])->name('markers.store');
    Route::put('/markers/{marker}', [App\Http\Controllers\MarkerController::class, 'update'])->name('markers.update');
    Route::delete('/markers/{marker}', [App\Http\Controllers\MarkerController::class, 'destroy'])->name('markers.destroy');
});

require __DIR__.'/settings.php';
