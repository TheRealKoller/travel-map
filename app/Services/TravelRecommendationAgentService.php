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
     * @param  string  $language  The language for the response ('de' or 'en')
     * @return array{success: bool, recommendation?: string, error?: string}
     */
    public function getTravelRecommendations(string $context, array $data, string $language = 'de'): array
    {
        try {
            $prompt = $this->buildRecommendationPrompt($context, $data, $language);

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
                    'context' => $context,
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'data_marker_count' => count($data['markers'] ?? []),
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
                Log::warning('No content received from Travel Recommendation Agent', [
                    'context' => $context,
                    'data_marker_count' => count($data['markers'] ?? []),
                    'response' => $result,
                ]);

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
                'data_marker_count' => count($data['markers'] ?? []),
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
     * Build the prompt for travel recommendations.
     */
    private function buildRecommendationPrompt(string $context, array $data, string $language): string
    {
        $prompts = $this->getLanguagePrompts($language);

        $prompt = "{$prompts['intro']}\n\n";

        switch ($context) {
            case 'trip':
                $prompt .= "{$prompts['trip_context']}\n";
                $prompt .= "{$prompts['trip_name']}: {$data['trip_name']}\n\n";
                $prompt .= "{$prompts['markers_in_trip']}:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} ({$prompts['coordinates']}: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\n{$prompts['trip_question']}\n";
                break;

            case 'tour':
                $prompt .= "{$prompts['tour_context']}\n";
                $prompt .= "{$prompts['trip_name']}: {$data['trip_name']}\n";
                $prompt .= "{$prompts['tour_name']}: {$data['tour_name']}\n\n";
                $prompt .= "{$prompts['markers_in_tour']}:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} ({$prompts['coordinates']}: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\n{$prompts['tour_question']}\n";
                break;

            case 'map_view':
                $prompt .= "{$prompts['map_context']}\n";
                $prompt .= "{$prompts['trip_name']}: {$data['trip_name']}\n";
                $prompt .= "{$prompts['map_area']}: {$prompts['north']} {$data['bounds']['north']}, {$prompts['south']} {$data['bounds']['south']}, {$prompts['east']} {$data['bounds']['east']}, {$prompts['west']} {$data['bounds']['west']}\n\n";
                $prompt .= "{$prompts['visible_markers']}:\n";
                foreach ($data['markers'] as $marker) {
                    $prompt .= "- {$marker['name']} ({$prompts['coordinates']}: {$marker['latitude']}, {$marker['longitude']})\n";
                }
                $prompt .= "\n{$prompts['map_question']}\n";
                break;
        }

        $prompt .= "\n{$prompts['answer_requirements']}\n";

        return $prompt;
    }

    /**
     * Get language-specific prompt texts.
     */
    private function getLanguagePrompts(string $language): array
    {
        return match ($language) {
            'de' => [
                'intro' => 'Du bist ein hilfreicher Reiseberater. Gib mir Empfehlungen in einem informellen, freundlichen Ton auf Deutsch.',
                'trip_context' => 'Kontext: Gesamte Reise',
                'tour_context' => 'Kontext: Ausgewählte Tour',
                'map_context' => 'Kontext: Aktueller Kartenausschnitt',
                'trip_name' => 'Reisename',
                'tour_name' => 'Tourname',
                'map_area' => 'Kartenbereich',
                'coordinates' => 'Koordinaten',
                'north' => 'Nord',
                'south' => 'Süd',
                'east' => 'Ost',
                'west' => 'West',
                'markers_in_trip' => 'Marker in dieser Reise',
                'markers_in_tour' => 'Marker in dieser Tour',
                'visible_markers' => 'Sichtbare Marker',
                'trip_question' => 'Bitte gib mir Empfehlungen für diese Reise. Was sollte ich mir ansehen? Welche Sehenswürdigkeiten sind empfehlenswert? Gibt es besondere Dinge zu beachten?',
                'tour_question' => 'Bitte gib mir Empfehlungen für diese Tour. Was kann ich in dieser Route erleben? Welche Highlights gibt es? Was sollte ich beachten?',
                'map_question' => 'Bitte gib mir Empfehlungen für diesen Bereich. Was gibt es hier zu entdecken? Welche Sehenswürdigkeiten sind interessant? Was sollte man in dieser Gegend wissen?',
                'answer_requirements' => "Deine Antwort sollte:\n- Informell und freundlich sein\n- Auf Deutsch verfasst sein\n- Konkrete Vorschläge und Empfehlungen enthalten\n- Sehenswürdigkeiten und Besonderheiten nennen\n- Praktische Tipps geben",
            ],
            'en' => [
                'intro' => 'You are a helpful travel advisor. Give me recommendations in an informal, friendly tone in English.',
                'trip_context' => 'Context: Entire trip',
                'tour_context' => 'Context: Selected tour',
                'map_context' => 'Context: Current map view',
                'trip_name' => 'Trip name',
                'tour_name' => 'Tour name',
                'map_area' => 'Map area',
                'coordinates' => 'Coordinates',
                'north' => 'North',
                'south' => 'South',
                'east' => 'East',
                'west' => 'West',
                'markers_in_trip' => 'Markers in this trip',
                'markers_in_tour' => 'Markers in this tour',
                'visible_markers' => 'Visible markers',
                'trip_question' => 'Please give me recommendations for this trip. What should I see? Which attractions are recommended? Are there any special things to consider?',
                'tour_question' => 'Please give me recommendations for this tour. What can I experience on this route? What are the highlights? What should I pay attention to?',
                'map_question' => 'Please give me recommendations for this area. What is there to discover? Which sights are interesting? What should you know about this region?',
                'answer_requirements' => "Your answer should:\n- Be informal and friendly\n- Be written in English\n- Contain concrete suggestions and recommendations\n- Mention attractions and special features\n- Provide practical tips",
            ],
            default => [
                'intro' => 'Du bist ein hilfreicher Reiseberater. Gib mir Empfehlungen in einem informellen, freundlichen Ton auf Deutsch.',
                'trip_context' => 'Kontext: Gesamte Reise',
                'tour_context' => 'Kontext: Ausgewählte Tour',
                'map_context' => 'Kontext: Aktueller Kartenausschnitt',
                'trip_name' => 'Reisename',
                'tour_name' => 'Tourname',
                'map_area' => 'Kartenbereich',
                'coordinates' => 'Koordinaten',
                'north' => 'Nord',
                'south' => 'Süd',
                'east' => 'Ost',
                'west' => 'West',
                'markers_in_trip' => 'Marker in dieser Reise',
                'markers_in_tour' => 'Marker in dieser Tour',
                'visible_markers' => 'Sichtbare Marker',
                'trip_question' => 'Bitte gib mir Empfehlungen für diese Reise. Was sollte ich mir ansehen? Welche Sehenswürdigkeiten sind empfehlenswert? Gibt es besondere Dinge zu beachten?',
                'tour_question' => 'Bitte gib mir Empfehlungen für diese Tour. Was kann ich in dieser Route erleben? Welche Highlights gibt es? Was sollte ich beachten?',
                'map_question' => 'Bitte gib mir Empfehlungen für diesen Bereich. Was gibt es hier zu entdecken? Welche Sehenswürdigkeiten sind interessant? Was sollte man in dieser Gegend wissen?',
                'answer_requirements' => "Deine Antwort sollte:\n- Informell und freundlich sein\n- Auf Deutsch verfasst sein\n- Konkrete Vorschläge und Empfehlungen enthalten\n- Sehenswürdigkeiten und Besonderheiten nennen\n- Praktische Tipps geben",
            ],
        };
    }
}
