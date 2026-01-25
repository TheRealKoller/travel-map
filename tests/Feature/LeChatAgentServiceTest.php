<?php

use App\Services\MarkerEnrichmentAgentService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    $this->service = new MarkerEnrichmentAgentService(
        apiKey: 'test-api-key',
        agentId: 'test-agent-id'
    );
});

it('builds the correct prompt with location data for German language', function () {
    $reflection = new ReflectionClass($this->service);
    $method = $reflection->getMethod('buildPrompt');
    $method->setAccessible(true);

    $prompt = $method->invoke($this->service, 'Eiffel Tower', 48.8584, 2.2945, 'de');

    expect($prompt)
        ->toContain('Eiffel Tower')
        ->toContain('48.8584')
        ->toContain('2.2945')
        ->toContain('JSON format')
        ->toContain('is_unesco')
        ->toContain('IN GERMAN')
        ->toContain('GERMAN LANGUAGE')
        ->toContain('Deutsch');
});

it('builds the correct prompt with location data for English language', function () {
    $reflection = new ReflectionClass($this->service);
    $method = $reflection->getMethod('buildPrompt');
    $method->setAccessible(true);

    $prompt = $method->invoke($this->service, 'Eiffel Tower', 48.8584, 2.2945, 'en');

    expect($prompt)
        ->toContain('Eiffel Tower')
        ->toContain('48.8584')
        ->toContain('2.2945')
        ->toContain('JSON format')
        ->toContain('is_unesco')
        ->toContain('IN ENGLISH')
        ->toContain('ENGLISH LANGUAGE')
        ->toContain('English');
});

it('successfully enriches marker info with valid API response', function () {
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'type' => 'museum',
                            'is_unesco' => true,
                            'notes' => 'Testnotizen auf Deutsch',
                            'url' => 'https://example.com/de',
                        ]),
                    ],
                ],
            ],
        ], 200),
    ]);

    $result = $this->service->enrichMarkerInfo('Test Museum', 48.8584, 2.2945);

    expect($result)->toBe([
        'success' => true,
        'data' => [
            'type' => 'museum',
            'is_unesco' => true,
            'notes' => 'Testnotizen auf Deutsch',
            'url' => 'https://example.com/de',
            'estimated_hours' => null,
        ],
    ]);
});

it('parses JSON wrapped in markdown code blocks', function () {
    $reflection = new ReflectionClass($this->service);
    $method = $reflection->getMethod('parseAgentResponse');
    $method->setAccessible(true);

    $content = "```json\n".json_encode([
        'type' => 'hotel',
        'is_unesco' => false,
        'notes' => 'Deutschsprachige Testnotizen',
        'url' => 'https://test.com/de',
    ])."\n```";

    $result = $method->invoke($this->service, $content);

    expect($result)->toBe([
        'type' => 'hotel',
        'is_unesco' => false,
        'notes' => 'Deutschsprachige Testnotizen',
        'url' => 'https://test.com/de',
        'estimated_hours' => null,
    ]);
});

it('parses JSON wrapped in generic code blocks', function () {
    $reflection = new ReflectionClass($this->service);
    $method = $reflection->getMethod('parseAgentResponse');
    $method->setAccessible(true);

    $content = "```\n".json_encode([
        'type' => 'restaurant',
        'is_unesco' => false,
        'notes' => 'Test',
        'url' => null,
    ])."\n```";

    $result = $method->invoke($this->service, $content);

    expect($result)->toBe([
        'type' => 'restaurant',
        'is_unesco' => false,
        'notes' => 'Test',
        'url' => null,
        'estimated_hours' => null,
    ]);
});

it('returns null for invalid JSON', function () {
    Log::shouldReceive('error')->once();

    $reflection = new ReflectionClass($this->service);
    $method = $reflection->getMethod('parseAgentResponse');
    $method->setAccessible(true);

    $result = $method->invoke($this->service, 'This is not valid JSON');

    expect($result)->toBeNull();
});

it('handles API connection failures', function () {
    Log::shouldReceive('error')->once();

    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([], 500),
    ]);

    $result = $this->service->enrichMarkerInfo('Test', 48.8584, 2.2945);

    expect($result)->toMatchArray([
        'success' => false,
        'error' => 'Failed to connect to Marker Enrichment Agent API',
    ]);
});

it('handles API timeout', function () {
    Log::shouldReceive('error')->once();

    Http::fake(function () {
        throw new \Illuminate\Http\Client\ConnectionException('Connection timeout');
    });

    $result = $this->service->enrichMarkerInfo('Test', 48.8584, 2.2945);

    expect($result)->toMatchArray([
        'success' => false,
    ]);
});

it('sends correct headers and payload to API', function () {
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => '{"type":"museum","is_unesco":true,"notes":"Test","url":null}',
                    ],
                ],
            ],
        ], 200),
    ]);

    $this->service->enrichMarkerInfo('Test Location', 48.8584, 2.2945);

    Http::assertSent(function ($request) {
        return $request->url() === 'https://api.mistral.ai/v1/agents/completions' &&
            $request->hasHeader('Authorization', 'Bearer test-api-key') &&
            $request->hasHeader('Content-Type', 'application/json') &&
            $request['agent_id'] === 'test-agent-id' &&
            isset($request['messages'][0]['role']) &&
            $request['messages'][0]['role'] === 'user';
    });
});

it('sanitizes and validates response fields', function () {
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'type' => 'museum', // Valid type
                            'is_unesco' => 'yes', // Will be cast to bool (true)
                            'notes' => 'Test notes',
                            'url' => 'https://example.com',
                        ]),
                    ],
                ],
            ],
        ], 200),
    ]);

    $result = $this->service->enrichMarkerInfo('Test', 48.8584, 2.2945);

    expect($result['success'])->toBeTrue();
    expect($result['data']['type'])->toBeString();
    expect($result['data']['is_unesco'])->toBeBool();
    expect($result['data']['notes'])->toBeString();
    expect($result['data']['url'])->toBeString();
});

it('handles missing optional fields in response', function () {
    Http::fake([
        'api.mistral.ai/v1/agents/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'type' => 'hotel',
                            // Missing other fields
                        ]),
                    ],
                ],
            ],
        ], 200),
    ]);

    $result = $this->service->enrichMarkerInfo('Test', 48.8584, 2.2945);

    expect($result['success'])->toBeTrue();
    expect($result['data']['type'])->toBe('hotel');
    expect($result['data']['is_unesco'])->toBeNull();
    expect($result['data']['notes'])->toBeNull();
    expect($result['data']['url'])->toBeNull();
    expect($result['data']['estimated_hours'])->toBeNull();
});
