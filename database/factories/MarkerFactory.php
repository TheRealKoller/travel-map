<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Marker>
 */
class MarkerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => fake()->uuid(),
            'name' => fake()->words(3, true),
            'type' => fake()->randomElement(['restaurant', 'hotel', 'point of interest', 'tip', 'question', 'museum', 'ruin', 'temple/church', 'festival/party', 'leisure', 'sightseeing', 'natural attraction', 'city', 'village', 'region']),
            'notes' => fake()->optional()->paragraph(),
            'url' => fake()->optional()->url(),
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'is_unesco' => fake()->boolean(10), // 10% chance of being UNESCO
            'user_id' => \App\Models\User::factory(),
            'trip_id' => \App\Models\Trip::factory(),
        ];
    }
}
