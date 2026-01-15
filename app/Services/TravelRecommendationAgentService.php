<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TravelRecommendationAgentService
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $agentId,
    ) {}

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
                Log::error('Travel Recommendation Agent API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'success' => false,
                    'error' => 'Failed to connect to Travel Recommendation Agent API',
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
            Log::error('Travel Recommendation Agent recommendation failed', [
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
}
