<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LeChatAgentService
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
                Log::error('Le Chat Agent API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to connect to Le Chat Agent API',
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
            Log::error('Le Chat Agent enrichment failed', [
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
     * Build the prompt for the Le Chat Agent.
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
     * Get travel recommendations using Le Chat Agent.
     *
     * @param  string  $context  The context type: 'trip', 'tour', or 'map_view'
     * @param  array  $data  The context data (trip name, markers, coordinates, etc.)
     * @return array{success: bool, recommendation?: string, error?: string}
     */
    public function getTravelRecommendations(string $context, array $data): array
    {
        try {
            $prompt = $this->buildRecommendationPrompt($context, $data);

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
                Log::error('Le Chat Agent API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to connect to Le Chat Agent API',
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

            return [
                'success' => true,
                'recommendation' => $content,
            ];
        } catch (\Exception $e) {
            Log::error('Le Chat Agent recommendation failed', [
                'context' => $context,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build the prompt for travel recommendations.
     */
    private function buildRecommendationPrompt(string $context, array $data): string
    {
        $prompt = "Du bist ein hilfreicher Reiseberater. Gib mir Empfehlungen in einem informellen, freundlichen Ton auf Deutsch.\n\n";

        switch ($context) {
            case 'trip':
                $prompt .= "Kontext: Gesamte Reise\n";
                $prompt .= "Reisename: {$data['trip_name']}\n\n";
                $prompt .= "Marker in dieser Reise:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} (Koordinaten: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\nBitte gib mir Empfehlungen für diese Reise. Was sollte ich mir ansehen? Welche Sehenswürdigkeiten sind empfehlenswert? Gibt es besondere Dinge zu beachten?\n";
                break;

            case 'tour':
                $prompt .= "Kontext: Ausgewählte Tour\n";
                $prompt .= "Reisename: {$data['trip_name']}\n";
                $prompt .= "Tourname: {$data['tour_name']}\n\n";
                $prompt .= "Marker in dieser Tour:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} (Koordinaten: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\nBitte gib mir Empfehlungen für diese Tour. Was kann ich in dieser Route erleben? Welche Highlights gibt es? Was sollte ich beachten?\n";
                break;

            case 'map_view':
                $prompt .= "Kontext: Aktueller Kartenausschnitt\n";
                $prompt .= "Reisename: {$data['trip_name']}\n";
                $prompt .= "Kartenbereich: Nord {$data['bounds']['north']}, Süd {$data['bounds']['south']}, Ost {$data['bounds']['east']}, West {$data['bounds']['west']}\n\n";
                $prompt .= "Sichtbare Marker:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} (Koordinaten: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\nBitte gib mir Empfehlungen für diesen Bereich. Was gibt es hier zu entdecken? Welche Sehenswürdigkeiten sind interessant? Was sollte man in dieser Gegend wissen?\n";
                break;
        }

        $prompt .= "\nDeine Antwort sollte:\n";
        $prompt .= "- Informell und freundlich sein\n";
        $prompt .= "- Auf Deutsch verfasst sein\n";
        $prompt .= "- Konkrete Vorschläge und Empfehlungen enthalten\n";
        $prompt .= "- Sehenswürdigkeiten und Besonderheiten nennen\n";
        $prompt .= "- Praktische Tipps geben\n";

        return $prompt;
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
