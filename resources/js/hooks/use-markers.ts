import { createMarkerElement } from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useState } from 'react';

interface UseMarkersOptions {
    mapInstance: mapboxgl.Map | null;
    selectedTripId: number | null;
    onMarkerClick: (markerId: string) => void;
}

export function useMarkers({
    mapInstance,
    selectedTripId,
    onMarkerClick,
}: UseMarkersOptions) {
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
        null,
    );

    // Load markers from database when trip changes
    useEffect(() => {
        const loadMarkers = async () => {
            if (!selectedTripId || !mapInstance) return;

            try {
                const response = await axios.get('/markers', {
                    params: { trip_id: selectedTripId },
                });
                const dbMarkers = response.data;

                // Clear existing markers from map
                markers.forEach((m) => {
                    const mapboxMarker = m.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                });

                const loadedMarkers: MarkerData[] = dbMarkers.map(
                    (dbMarker: {
                        id: string;
                        latitude: number;
                        longitude: number;
                        name: string;
                        type: MarkerType;
                        notes: string;
                        url: string;
                        is_unesco: boolean;
                        ai_enriched: boolean;
                    }) => {
                        const el = createMarkerElement(dbMarker.type);

                        const marker = new mapboxgl.Marker(el)
                            .setLngLat([dbMarker.longitude, dbMarker.latitude])
                            .addTo(mapInstance);

                        const popup = new mapboxgl.Popup({
                            offset: 25,
                        }).setText(dbMarker.name || 'Unnamed Location');
                        marker.setPopup(popup);

                        el.addEventListener('click', (e) => {
                            e.stopPropagation();
                            onMarkerClick(dbMarker.id);
                        });

                        return {
                            id: dbMarker.id,
                            lat: dbMarker.latitude,
                            lng: dbMarker.longitude,
                            name: dbMarker.name,
                            type: dbMarker.type,
                            notes: dbMarker.notes || '',
                            url: dbMarker.url || '',
                            isUnesco: dbMarker.is_unesco || false,
                            aiEnriched: dbMarker.ai_enriched || false,
                            marker: marker,
                            isSaved: true,
                        };
                    },
                );

                setMarkers(loadedMarkers);
                setSelectedMarkerId(null);
            } catch (error) {
                console.error('Failed to load markers:', error);
                alert('Failed to load markers. Please refresh the page.');
            }
        };

        loadMarkers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTripId, mapInstance]);

    const handleSaveMarker = useCallback(
        async (
            id: string,
            name: string,
            type: MarkerType,
            notes: string,
            url: string,
            isUnesco: boolean,
            aiEnriched: boolean,
        ) => {
            try {
                const markerToSave = markers.find((m) => m.id === id);
                if (!markerToSave) {
                    console.error('Marker not found');
                    return;
                }

                if (markerToSave.isSaved) {
                    // Update existing marker in database
                    await axios.put(`/markers/${id}`, {
                        name,
                        type,
                        notes,
                        url,
                        is_unesco: isUnesco,
                        ai_enriched: aiEnriched,
                    });
                } else {
                    // Create new marker in database
                    await axios.post('/markers', {
                        id: id,
                        name: name,
                        type: type,
                        notes: notes,
                        url: url,
                        latitude: markerToSave.lat,
                        longitude: markerToSave.lng,
                        trip_id: selectedTripId,
                        is_unesco: isUnesco,
                        ai_enriched: aiEnriched,
                    });
                }

                // Update local state - mark as saved
                setMarkers((prev) =>
                    prev.map((m) =>
                        m.id === id
                            ? {
                                  ...m,
                                  name,
                                  type,
                                  notes,
                                  url,
                                  isUnesco,
                                  aiEnriched,
                                  isSaved: true,
                              }
                            : m,
                    ),
                );

                // Update marker popup and icon
                const marker = markers.find((m) => m.id === id);
                if (marker && mapInstance) {
                    const mapboxMarker = marker.marker;
                    const [lng, lat] = [marker.lng, marker.lat];
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                        name || 'Unnamed Location',
                    );
                    mapboxMarker.setPopup(popup);

                    // Update marker icon if type changed
                    const el = createMarkerElement(type);
                    el.addEventListener('click', () => {
                        onMarkerClick(id);
                    });

                    // Remove and recreate marker with new element
                    mapboxMarker.remove();
                    const newMarker = new mapboxgl.Marker(el)
                        .setLngLat([lng, lat])
                        .setPopup(popup)
                        .addTo(mapInstance);

                    // Update the marker reference in state
                    setMarkers((prev) =>
                        prev.map((m) =>
                            m.id === id ? { ...m, marker: newMarker } : m,
                        ),
                    );
                }

                // Close the form
                setSelectedMarkerId(null);
            } catch (error) {
                console.error('Failed to save marker:', error);
                alert('Failed to save marker. Please try again.');
            }
        },
        [markers, selectedTripId, mapInstance, onMarkerClick],
    );

    const handleDeleteMarker = useCallback(
        async (id: string) => {
            try {
                // First, get the marker and remove it from map before API call
                const marker = markers.find((m) => m.id === id);
                if (marker) {
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                }

                // Then call API
                await axios.delete(`/markers/${id}`);

                // Remove from state
                setMarkers((prev) => prev.filter((m) => m.id !== id));

                // Clear selection if deleted marker was selected
                if (selectedMarkerId === id) {
                    setSelectedMarkerId(null);
                }
            } catch (error) {
                console.error('Failed to delete marker:', error);
                alert('Failed to delete marker. Please try again.');

                // Re-add marker to map if deletion failed
                const marker = markers.find((m) => m.id === id);
                if (marker && mapInstance) {
                    marker.marker.addTo(mapInstance);
                }
            }
        },
        [markers, selectedMarkerId, mapInstance],
    );

    const handleCloseForm = useCallback(() => {
        // If closing an unsaved marker, remove it from the map and state
        if (selectedMarkerId) {
            const marker = markers.find((m) => m.id === selectedMarkerId);
            if (marker && !marker.isSaved) {
                // Remove marker from map
                const mapboxMarker = marker.marker;
                if (mapboxMarker) {
                    mapboxMarker.remove();
                }
                // Remove from state
                setMarkers((prev) =>
                    prev.filter((m) => m.id !== selectedMarkerId),
                );
            }
        }
        setSelectedMarkerId(null);
    }, [selectedMarkerId, markers]);

    const addMarker = useCallback((marker: MarkerData) => {
        setMarkers((prev) => [...prev, marker]);
    }, []);

    const updateMarkerReference = useCallback(
        (markerId: string, newMarker: mapboxgl.Marker) => {
            setMarkers((prev) =>
                prev.map((m) =>
                    m.id === markerId ? { ...m, marker: newMarker } : m,
                ),
            );
        },
        [],
    );

    return {
        markers,
        setMarkers,
        selectedMarkerId,
        setSelectedMarkerId,
        handleSaveMarker,
        handleDeleteMarker,
        handleCloseForm,
        addMarker,
        updateMarkerReference,
    } as const;
}
