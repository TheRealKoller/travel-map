<?php

namespace Database\Seeders;

use App\Models\Marker;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TestMarkerSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();
        if (! $user) {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        $trip = $user->trips()->first();
        if (! $trip) {
            $trip = $user->trips()->create([
                'name' => 'Paris Test Trip',
                'viewport_latitude' => 48.8566,
                'viewport_longitude' => 2.3522,
                'viewport_zoom' => 12,
            ]);
        }

        $markers = [
            ['type' => 'restaurant', 'lat' => 48.8584, 'lng' => 2.2945, 'name' => 'Restaurant Test'],
            ['type' => 'hotel', 'lat' => 48.8606, 'lng' => 2.3376, 'name' => 'Hotel Test'],
            ['type' => 'museum', 'lat' => 48.8550, 'lng' => 2.3400, 'name' => 'Museum Test'],
            ['type' => 'sightseeing', 'lat' => 48.8530, 'lng' => 2.3499, 'name' => 'Sightseeing Test'],
            ['type' => 'point of interest', 'lat' => 48.8500, 'lng' => 2.3600, 'name' => 'POI Test'],
            ['type' => 'question', 'lat' => 48.8520, 'lng' => 2.3700, 'name' => 'Question Test'],
            ['type' => 'tip', 'lat' => 48.8540, 'lng' => 2.3800, 'name' => 'Tip Test'],
            ['type' => 'temple/church', 'lat' => 48.8560, 'lng' => 2.3450, 'name' => 'Church Test'],
            ['type' => 'natural attraction', 'lat' => 48.8480, 'lng' => 2.3550, 'name' => 'Nature Test'],
        ];

        foreach ($markers as $m) {
            Marker::create([
                'id' => Str::uuid(),
                'name' => $m['name'],
                'type' => $m['type'],
                'latitude' => $m['lat'],
                'longitude' => $m['lng'],
                'notes' => 'Test marker',
                'trip_id' => $trip->id,
                'user_id' => $user->id,
            ]);
        }

        $this->command->info('Test data created successfully!');
        $this->command->info('Login: test@example.com / password');
        $this->command->info("Trip ID: {$trip->id}");
    }
}
