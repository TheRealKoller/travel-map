<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Set test configuration for Travel Recommendation Agent
    Config::set('services.lechat.api_key', 'test-api-key');
    Config::set('services.lechat.marker_enrichment_agent_id', 'test-marker-agent-id');
    Config::set('services.lechat.travel_recommendation_agent_id', 'test-travel-agent-id');
});

it('requires authentication to get recommendations', function () {
    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'trip_name' => 'Test Trip',
            'markers' => [],
        ],
    ]);

    $response->assertUnauthorized();
});

it('validates required fields for recommendations', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['context', 'data']);
});

it('validates context field is one of allowed values', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', [
        'context' => 'invalid_context',
        'data' => [
            'trip_name' => 'Test Trip',
            'markers' => [],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['context']);
});

it('validates trip_name is required', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'markers' => [],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['data.trip_name']);
});

it('validates markers array is required', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'trip_name' => 'Test Trip',
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['data.markers']);
});

it('successfully gets recommendations for trip context', function () {
    actingAs($this->user);

    // Mock the HTTP response from Le Chat API
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'Das sind tolle Empfehlungen für deine Reise! Du solltest unbedingt den Eiffelturm besuchen...',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'trip_name' => 'Paris Trip',
            'markers' => [
                [
                    'name' => 'Eiffel Tower',
                    'latitude' => 48.8584,
                    'longitude' => 2.2945,
                ],
            ],
        ],
    ]);

    $response->assertSuccessful();
    $response->assertJson([
        'success' => true,
        'recommendation' => 'Das sind tolle Empfehlungen für deine Reise! Du solltest unbedingt den Eiffelturm besuchen...',
    ]);
});

it('successfully gets recommendations for tour context', function () {
    actingAs($this->user);

    // Mock the HTTP response from Le Chat API
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'Für diese Tour empfehle ich dir, früh morgens zu starten...',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/recommendations', [
        'context' => 'tour',
        'data' => [
            'trip_name' => 'Paris Trip',
            'tour_name' => 'City Center Tour',
            'markers' => [
                [
                    'name' => 'Louvre Museum',
                    'latitude' => 48.8606,
                    'longitude' => 2.3376,
                ],
            ],
        ],
    ]);

    $response->assertSuccessful();
    $response->assertJson([
        'success' => true,
    ]);
});

it('successfully gets recommendations for map view context', function () {
    actingAs($this->user);

    // Mock the HTTP response from Le Chat API
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'In diesem Bereich gibt es viele interessante Orte...',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/recommendations', [
        'context' => 'map_view',
        'data' => [
            'trip_name' => 'Paris Trip',
            'bounds' => [
                'north' => 48.9,
                'south' => 48.8,
                'east' => 2.4,
                'west' => 2.2,
            ],
            'markers' => [
                [
                    'name' => 'Notre-Dame',
                    'latitude' => 48.853,
                    'longitude' => 2.3499,
                ],
            ],
        ],
    ]);

    $response->assertSuccessful();
    $response->assertJson([
        'success' => true,
    ]);
});

it('requires tour_name for tour context', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', [
        'context' => 'tour',
        'data' => [
            'trip_name' => 'Paris Trip',
            'markers' => [
                [
                    'name' => 'Test Marker',
                    'latitude' => 48.8584,
                    'longitude' => 2.2945,
                ],
            ],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
        'error' => 'tour_name is required for tour context',
    ]);
});

it('requires bounds for map_view context', function () {
    actingAs($this->user);

    $response = postJson('/recommendations', [
        'context' => 'map_view',
        'data' => [
            'trip_name' => 'Paris Trip',
            'markers' => [
                [
                    'name' => 'Test Marker',
                    'latitude' => 48.8584,
                    'longitude' => 2.2945,
                ],
            ],
        ],
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
        'error' => 'bounds is required for map_view context',
    ]);
});

it('handles Le Chat API errors gracefully', function () {
    actingAs($this->user);

    // Mock API failure
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([], 500),
    ]);

    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'trip_name' => 'Test Trip',
            'markers' => [
                [
                    'name' => 'Test Marker',
                    'latitude' => 48.8584,
                    'longitude' => 2.2945,
                ],
            ],
        ],
    ]);

    $response->assertStatus(500);
    $response->assertJson([
        'success' => false,
    ]);
});

it('handles missing content in agent response', function () {
    actingAs($this->user);

    // Mock API response without content
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/recommendations', [
        'context' => 'trip',
        'data' => [
            'trip_name' => 'Test Trip',
            'markers' => [
                [
                    'name' => 'Test Marker',
                    'latitude' => 48.8584,
                    'longitude' => 2.2945,
                ],
            ],
        ],
    ]);

    $response->assertStatus(500);
    $response->assertJson([
        'success' => false,
        'error' => 'No content received from agent',
    ]);
});
