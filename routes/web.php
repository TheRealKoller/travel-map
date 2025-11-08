<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return '
        <!DOCTYPE html>
        <html>
        <head>
            <title>Japanleisegluppe</title>
        </head>
        <body>
            <h1>Japanleisegluppe</h1>
            <div id="map"></div>
        </body>
        </html>
    ';
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
