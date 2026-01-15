import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import { Bot, Map, MapPin, Route } from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface AiRecommendationsPanelProps {
    tripId: number | null;
    tripName: string | null;
    selectedTourId: number | null;
    tours: Tour[];
    markers: MarkerData[];
    mapBounds: MapBounds | null;
}

export function AiRecommendationsPanel({
    tripId,
    tripName,
    selectedTourId,
    tours,
    markers,
    mapBounds,
}: AiRecommendationsPanelProps) {
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Configure marked for secure rendering
    useEffect(() => {
        marked.setOptions({
            breaks: true, // Convert line breaks to <br>
            gfm: true, // GitHub Flavored Markdown
        });
    }, []);

    // Parse markdown to HTML
    const renderedRecommendation = useMemo(() => {
        if (!recommendation) return null;
        return marked.parse(recommendation) as string;
    }, [recommendation]);

    const handleGetRecommendation = async (context: string) => {
        if (!tripId || !tripName) {
            setError('Bitte wähle zuerst eine Reise aus.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setRecommendation(null);

        try {
            const requestData: {
                trip_name: string;
                markers: Array<{ name: string; latitude: number; longitude: number }>;
                tour_name?: string;
                bounds?: MapBounds;
            } = {
                trip_name: tripName,
                markers: markers.map((m) => ({
                    name: m.name,
                    latitude: m.lat,
                    longitude: m.lng,
                })),
            };

            if (context === 'tour') {
                if (!selectedTourId) {
                    setError('Bitte wähle zuerst eine Tour aus.');
                    setIsLoading(false);
                    return;
                }

                const selectedTour = tours.find((t) => t.id === selectedTourId);
                if (!selectedTour) {
                    setError('Tour nicht gefunden.');
                    setIsLoading(false);
                    return;
                }

                requestData.tour_name = selectedTour.name;
                // Get markers for the tour
                const tourMarkerIds =
                    selectedTour.markers?.map((m) => m.id) || [];
                requestData.markers = markers
                    .filter((m) => tourMarkerIds.includes(m.id))
                    .map((m) => ({
                        name: m.name,
                        latitude: m.lat,
                        longitude: m.lng,
                    }));
            } else if (context === 'map_view') {
                if (!mapBounds) {
                    setError('Kartenbereich konnte nicht ermittelt werden.');
                    setIsLoading(false);
                    return;
                }

                requestData.bounds = mapBounds;
                // Filter markers to only include those within the current map bounds
                requestData.markers = markers
                    .filter((m) => {
                        const isWithinBounds =
                            m.lat >= mapBounds.south &&
                            m.lat <= mapBounds.north &&
                            m.lng >= mapBounds.west &&
                            m.lng <= mapBounds.east;
                        return isWithinBounds;
                    })
                    .map((m) => ({
                        name: m.name,
                        latitude: m.lat,
                        longitude: m.lng,
                    }));
            }

            const response = await fetch('/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    context,
                    data: requestData,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setRecommendation(result.recommendation);
            } else {
                setError(result.error || 'Ein Fehler ist aufgetreten.');
            }
        } catch {
            setError('Verbindung zum Server fehlgeschlagen.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full gap-2 py-2" data-testid="ai-recommendations-panel">
            <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 py-0">
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI-Empfehlungen
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                    <Button
                        onClick={() => handleGetRecommendation('trip')}
                        disabled={isLoading || !tripId}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="recommend-trip-button"
                    >
                        <MapPin className="h-4 w-4" />
                        Empfehlungen für Reise
                    </Button>
                    <Button
                        onClick={() => handleGetRecommendation('tour')}
                        disabled={isLoading || !tripId || !selectedTourId}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="recommend-tour-button"
                    >
                        <Route className="h-4 w-4" />
                        Empfehlungen für Tour
                    </Button>
                    <Button
                        onClick={() => handleGetRecommendation('map_view')}
                        disabled={isLoading || !tripId || !mapBounds}
                        variant="outline"
                        className="flex items-center gap-2"
                        data-testid="recommend-map-view-button"
                    >
                        <Map className="h-4 w-4" />
                        Empfehlungen für Kartenausschnitt
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">

                <div
                    className="min-h-[160px] max-h-[250px] overflow-y-auto rounded-lg border bg-gray-50 p-2"
                    data-testid="recommendation-output"
                >
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Spinner className="h-8 w-8" />
                            <span className="ml-2 text-gray-600">
                                Empfehlungen werden geladen...
                            </span>
                        </div>
                    )}

                    {error && (
                        <div
                            className="rounded-lg bg-red-50 p-4 text-red-700"
                            data-testid="recommendation-error"
                        >
                            {error}
                        </div>
                    )}

                    {recommendation && !isLoading && (
                        <div
                            className="markdown-output"
                            data-testid="recommendation-text"
                            dangerouslySetInnerHTML={{
                                __html: renderedRecommendation || '',
                            }}
                        />
                    )}

                    {!isLoading && !error && !recommendation && (
                        <div className="py-8 text-center text-gray-500">
                            Wähle einen Button oben, um Empfehlungen zu
                            erhalten.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
