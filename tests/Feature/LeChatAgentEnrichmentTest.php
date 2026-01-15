<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->user = User::factory()->create();

    // Set test configuration for Marker Enrichment Agent
    Config::set('services.lechat.api_key', 'test-api-key');
    Config::set('services.lechat.marker_enrichment_agent_id', 'test-marker-agent-id');
    Config::set('services.lechat.travel_recommendation_agent_id', 'test-travel-agent-id');
});

it('requires authentication to enrich a marker', function () {
    $response = postJson('/markers/enrich', [
        'name' => 'Eiffel Tower',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
    ]);

    $response->assertUnauthorized();
});

it('validates required fields for marker enrichment', function () {
    actingAs($this->user);

    $response = postJson('/markers/enrich', []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'latitude', 'longitude']);
});

it('validates latitude and longitude ranges', function () {
    actingAs($this->user);

    $response = postJson('/markers/enrich', [
        'name' => 'Test Location',
        'latitude' => 100, // Invalid
        'longitude' => 200, // Invalid
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['latitude', 'longitude']);
});

it('successfully enriches marker with valid data', function () {
    actingAs($this->user);

    // Mock the HTTP response from Le Chat API with German text
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'type' => 'sightseeing',
                            'is_unesco' => false,
                            'notes' => 'Der Eiffelturm ist ein ikonisches Eisenfachwerkgerüst in Paris.',
                            'url' => 'https://www.toureiffel.paris/de',
                        ]),
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/markers/enrich', [
        'name' => 'Eiffel Tower',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
    ]);

    $response->assertSuccessful();
    $response->assertJson([
        'success' => true,
        'data' => [
            'type' => 'sightseeing',
            'is_unesco' => false,
            'notes' => 'Der Eiffelturm ist ein ikonisches Eisenfachwerkgerüst in Paris.',
            'url' => 'https://www.toureiffel.paris/de',
        ],
    ]);

    // Verify the HTTP request was made
    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.mistral.ai/v1/agents/completions' &&
            $request->hasHeader('Authorization') &&
            $request->hasHeader('Content-Type', 'application/json');
    });
});

it('handles Le Chat API errors gracefully', function () {
    actingAs($this->user);

    // Mock API failure
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([], 500),
    ]);

    $response = postJson('/markers/enrich', [
        'name' => 'Test Location',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
    ]);

    $response->assertStatus(500);
    $response->assertJson([
        'success' => false,
    ]);
});

it('handles invalid JSON responses from the agent', function () {
    actingAs($this->user);

    // Mock API response with invalid JSON
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => 'This is not valid JSON',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/markers/enrich', [
        'name' => 'Test Location',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
    ]);

    $response->assertStatus(500);
    $response->assertJson([
        'success' => false,
        'error' => 'Failed to parse agent response',
    ]);
});

it('extracts JSON from markdown code blocks', function () {
    actingAs($this->user);

    // Mock API response with JSON wrapped in markdown with German text
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => "```json\n".json_encode([
                            'type' => 'museum',
                            'is_unesco' => true,
                            'notes' => 'Der Louvre ist das größte Kunstmuseum der Welt.',
                            'url' => 'https://www.louvre.fr/de',
                        ])."\n```",
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/markers/enrich', [
        'name' => 'Louvre Museum',
        'latitude' => 48.8606,
        'longitude' => 2.3376,
    ]);

    $response->assertSuccessful();
    $response->assertJson([
        'success' => true,
        'data' => [
            'type' => 'museum',
            'is_unesco' => true,
        ],
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

    $response = postJson('/markers/enrich', [
        'name' => 'Test Location',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
    ]);

    $response->assertStatus(500);
    $response->assertJson([
        'success' => false,
        'error' => 'No content received from agent',
    ]);
});
