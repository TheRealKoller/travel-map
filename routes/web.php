<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return '
        <!DOCTYPE html>
        <html>
        <head>
            <title>Travelmap</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                }
                #map {
                    height: 600px;
                    width: 100%;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <h1>Travelmap</h1>
            <div id="map"></div>
            
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                // Initialize the map centered on Japan
                var map = L.map("map").setView([36.2048, 138.2529], 6);
                
                // Add OpenStreetMap tiles
                L.tileLayer("https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png", {
                    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
                    maxZoom: 19
                }).addTo(map);
                
                // Add a sample marker
                L.marker([35.6762, 139.6503]).addTo(map)
                    .bindPopup("Tokyo")
                    .openPopup();
            </script>
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
