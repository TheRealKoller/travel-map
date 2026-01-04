<?php

namespace Database\Factories;

use App\Enums\TransportMode;
use App\Models\Marker;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Route>
 */
class RouteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Sample route geometry (Berlin to Munich as example)
        $geometry = [
            [13.4050, 52.5200], // Berlin
            [13.5, 52.0],
            [12.5, 51.0],
            [11.5, 50.0],
            [11.5758, 48.1351], // Munich
        ];

        return [
            'trip_id' => Trip::factory(),
            'start_marker_id' => Marker::factory(),
            'end_marker_id' => Marker::factory(),
            'transport_mode' => fake()->randomElement(TransportMode::cases()),
            'distance' => fake()->numberBetween(1000, 500000), // 1km - 500km in meters
            'duration' => fake()->numberBetween(300, 36000), // 5min - 10h in seconds
            'geometry' => $geometry,
        ];
    }
}
