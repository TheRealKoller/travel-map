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
     * @param  string  $language  The language for the response ('de' or 'en')
     * @return array{success: bool, data?: array{type?: string, is_unesco?: bool, notes?: string, url?: string, estimated_hours?: float}, error?: string}
     */
    public function enrichMarkerInfo(string $markerName, float $latitude, float $longitude, string $language = 'de'): array
    {
        try {
            $prompt = $this->buildPrompt($markerName, $latitude, $longitude, $language);

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
                    'marker_name' => $markerName,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
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
                Log::warning('No content received from Marker Enrichment Agent', [
                    'marker_name' => $markerName,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'response' => $result,
                ]);

                return [
                    'success' => false,
                    'error' => 'No content received from agent',
                ];
            }

            // Parse JSON from agent response
            $enrichedData = $this->parseAgentResponse($content);

            if (! $enrichedData) {
                Log::error('Failed to parse Marker Enrichment Agent response', [
                    'marker_name' => $markerName,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'content' => $content,
                ]);

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
                'latitude' => $latitude,
                'longitude' => $longitude,
                'error' => $e->getMessage(),
                'exception' => $e,
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
    private function buildPrompt(string $markerName, float $latitude, float $longitude, string $language): string
    {
        $languageInstructions = $this->getLanguageInstructions($language);

        return <<<PROMPT
Analyze the following location and provide enriched information in JSON format:

Location Name: {$markerName}
Coordinates: {$latitude}, {$longitude}

Please provide the following information in valid JSON format:
{
  "type": "one of: restaurant, point_of_interest, hotel, museum, ruin, temple_church, sightseeing, natural_attraction, city, village, region, question, tip, festival_party, leisure",
  "is_unesco": true or false (whether this is a UNESCO World Heritage Site),
  "notes": "Interesting facts, historical context, and useful information about this location IN {$languageInstructions['language_name']}",
  "url": "Official website or relevant link (prefer {$languageInstructions['language_name']} websites if available, otherwise international sites)",
  "estimated_hours": number (estimated time in hours to experience this location, e.g., 1.5 for a restaurant meal, 2 for a museum visit, 0.5 for a quick view)
}

Rules:
- Return ONLY valid JSON, no additional text
- If a field cannot be determined, use null
- For type, choose the most appropriate category
- For notes, provide 2-3 sentences of relevant information IN {$languageInstructions['language_name']} ({$languageInstructions['native_name']})
- Write natural, fluent {$languageInstructions['language_name']} text in the notes field
- For url, prefer {$languageInstructions['language_name']} official websites when available, otherwise international sites
- If a {$languageInstructions['language_name']} Wikipedia page exists, prefer it over other language versions
- For estimated_hours, provide a reasonable time estimation in hours (can use decimals like 0.5, 1.5, 2.5)
  * Restaurants: 1-2 hours typically
  * Museums: 1-3 hours depending on size
  * Quick viewpoints/monuments: 0.25-0.5 hours
  * Cities/regions: 4-8 hours for a day visit
  * Natural attractions: 1-4 hours depending on trails/activities
  * Hotels: not applicable, use null

PROMPT;
    }

    /**
     * Get language-specific instructions for the prompt.
     *
     * @return array{language_name: string, native_name: string}
     */
    private function getLanguageInstructions(string $language): array
    {
        return match ($language) {
            'de' => [
                'language_name' => 'GERMAN LANGUAGE',
                'native_name' => 'Deutsch',
            ],
            'en' => [
                'language_name' => 'ENGLISH LANGUAGE',
                'native_name' => 'English',
            ],
            default => [
                'language_name' => 'GERMAN LANGUAGE',
                'native_name' => 'Deutsch',
            ],
        };
    }

    /**
     * Parse the JSON response from the agent.
     *
     * @return array{type?: string, is_unesco?: bool, notes?: string, url?: string, estimated_hours?: float}|null
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
                'estimated_hours' => isset($data['estimated_hours']) ? (float) $data['estimated_hours'] : null,
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
