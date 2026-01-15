<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MarkerEnrichmentAgentService
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $agentId,
    ) {}

    /**
     * Enrich marker information using Le Chat Agent.
     *
     * @param  string  $markerName  The name/location to enrich
     * @param  float  $latitude  The latitude coordinate
     * @param  float  $longitude  The longitude coordinate
     * @return array{success: bool, data?: array{type?: string, is_unesco?: bool, notes?: string, url?: string}, error?: string}
     */
    public function enrichMarkerInfo(string $markerName, float $latitude, float $longitude): array
    {
        try {
            $prompt = $this->buildPrompt($markerName, $latitude, $longitude);

            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.mistral.ai/v1/agents/completions', [
                    'agent_id' => $this->agentId,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                ]);

            if (! $response->successful()) {
                Log::error('Marker Enrichment Agent API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to connect to Marker Enrichment Agent API',
                ];
            }

            $result = $response->json();

            // Extract content from agent response
            $content = $result['choices'][0]['message']['content'] ?? null;

            if (! $content) {
                return [
                    'success' => false,
                    'error' => 'No content received from agent',
                ];
            }

            // Parse JSON from agent response
            $enrichedData = $this->parseAgentResponse($content);

            if (! $enrichedData) {
                return [
                    'success' => false,
                    'error' => 'Failed to parse agent response',
                ];
            }

            return [
                'success' => true,
                'data' => $enrichedData,
            ];
        } catch (\Exception $e) {
            Log::error('Marker Enrichment Agent enrichment failed', [
                'marker_name' => $markerName,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build the prompt for the Marker Enrichment Agent.
     */
    private function buildPrompt(string $markerName, float $latitude, float $longitude): string
    {
        return <<<PROMPT
Analyze the following location and provide enriched information in JSON format:

Location Name: {$markerName}
Coordinates: {$latitude}, {$longitude}

Please provide the following information in valid JSON format:
{
  "type": "one of: restaurant, point_of_interest, hotel, museum, ruin, temple_church, sightseeing, natural_attraction, city, village, region, question, tip, festival_party, leisure",
  "is_unesco": true or false (whether this is a UNESCO World Heritage Site),
  "notes": "Interesting facts, historical context, and useful information about this location IN GERMAN LANGUAGE",
  "url": "Official website or relevant link (prefer German language websites if available, otherwise international sites)"
}

Rules:
- Return ONLY valid JSON, no additional text
- If a field cannot be determined, use null
- For type, choose the most appropriate category
- For notes, provide 2-3 sentences of relevant information IN GERMAN (Deutsch)
- Write natural, fluent German text in the notes field
- For url, prefer German language official websites when available, otherwise international sites
- If a German Wikipedia page exists, prefer it over the English version

PROMPT;
    }

    /**
     * Parse the JSON response from the agent.
     *
     * @return array{type?: string, is_unesco?: bool, notes?: string, url?: string}|null
     */
    private function parseAgentResponse(string $content): ?array
    {
        // Try to extract JSON from markdown code blocks if present
        if (preg_match('/```json\s*(\{.*?\})\s*```/s', $content, $matches)) {
            $content = $matches[1];
        } elseif (preg_match('/```\s*(\{.*?\})\s*```/s', $content, $matches)) {
            $content = $matches[1];
        }

        // Clean up any remaining non-JSON text
        $content = trim($content);
        if (str_starts_with($content, '{')) {
            $endPos = strrpos($content, '}');
            if ($endPos !== false) {
                $content = substr($content, 0, $endPos + 1);
            }
        }

        try {
            $data = json_decode($content, true, 512, JSON_THROW_ON_ERROR);

            // Validate and sanitize the response
            return [
                'type' => isset($data['type']) ? (string) $data['type'] : null,
                'is_unesco' => isset($data['is_unesco']) ? (bool) $data['is_unesco'] : null,
                'notes' => isset($data['notes']) ? (string) $data['notes'] : null,
                'url' => isset($data['url']) ? (string) $data['url'] : null,
            ];
        } catch (\JsonException $e) {
            Log::error('Failed to parse agent JSON response', [
                'content' => $content,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
