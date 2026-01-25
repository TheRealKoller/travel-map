import { createMarkerElement } from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseMarkersOptions {
    mapInstance: mapboxgl.Map | null;
    selectedTripId: number | null;
    selectedTourId: number | null;
    onMarkerClick: (markerId: string) => void;
    onMarkerSaved?: () => void;
}

export function useMarkers({
    mapInstance,
    selectedTripId,
    selectedTourId,
    onMarkerClick,
    onMarkerSaved,
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
                        image_url: string | null;
                        is_unesco: boolean;
                        ai_enriched: boolean;
                        estimated_hours: number | null;
                    }) => {
                        // Saved markers use isTemporary=false (default z-index)
                        const el = createMarkerElement(
                            dbMarker.type,
                            false,
                            false,
                        );

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
                            imageUrl: dbMarker.image_url || null,
                            isUnesco: dbMarker.is_unesco || false,
                            aiEnriched: dbMarker.ai_enriched || false,
                            estimatedHours: dbMarker.estimated_hours ?? null,
                            marker: marker,
                            isSaved: true,
                        };
                    },
                );

                setMarkers(loadedMarkers);
                setSelectedMarkerId(null);
            } catch (error) {
                console.error('Failed to load markers:', error);
                toast.error('Failed to load markers. Please refresh the page.');
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
            estimatedHours: number | null,
        ) => {
            try {
                // Get current markers from state
                const currentMarkers = markers;
                const markerToSave = currentMarkers.find((m) => m.id === id);

                if (!markerToSave) {
                    console.error('Marker not found:', id);
                    toast.error('Marker not found. Please try again.');
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
                        estimated_hours: estimatedHours,
                    });
                } else {
                    // Create new marker in database
                    const payload: Record<string, unknown> = {
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
                        estimated_hours: estimatedHours,
                    };

                    // If a tour is selected, attach the marker to it
                    if (selectedTourId !== null) {
                        payload.tour_id = selectedTourId;
                    }

                    await axios.post('/markers', payload);
                }

                // Update local state - all in one batch to avoid stale references
                setMarkers((prev) => {
                    const marker = prev.find((m) => m.id === id);
                    if (!marker) {
                        console.error(
                            '[handleSaveMarker] marker not found in state during save',
                            { id },
                        );
                        return prev;
                    }

                    // Just update the state, don't recreate the marker on the map
                    // The marker is already on the map (either from addMarker or from highlighting)
                    // We just need to update the marker's data and popup
                    const mapboxMarker = marker.marker;

                    if (mapInstance && mapboxMarker) {
                        // Update the popup text
                        const popup = new mapboxgl.Popup({
                            offset: 25,
                        }).setText(name || 'Unnamed Location');
                        mapboxMarker.setPopup(popup);

                        // If type changed, we need to rebuild the marker element
                        if (type !== marker.type) {
                            // Saved marker (not temporary)
                            const el = createMarkerElement(type, false, false);
                            el.addEventListener('click', (clickEvent) => {
                                clickEvent.stopPropagation();
                                onMarkerClick(id);
                            });

                            // Remove old marker and create new one
                            mapboxMarker.remove();
                            const newMarker = new mapboxgl.Marker(el)
                                .setLngLat([marker.lng, marker.lat])
                                .setPopup(popup)
                                .addTo(mapInstance);

                            return prev.map((m) =>
                                m.id === id
                                    ? {
                                          ...m,
                                          name,
                                          type,
                                          notes,
                                          url,
                                          isUnesco,
                                          aiEnriched,
                                          estimatedHours,
                                          isSaved: true,
                                          marker: newMarker,
                                      }
                                    : m,
                            );
                        }
                    }

                    // Just update the marker data without touching the map
                    return prev.map((m) =>
                        m.id === id
                            ? {
                                  ...m,
                                  name,
                                  type,
                                  notes,
                                  url,
                                  isUnesco,
                                  aiEnriched,
                                  estimatedHours,
                                  isSaved: true,
                              }
                            : m,
                    );
                });

                // If marker was just created (not updated) and added to a tour, notify parent
                if (
                    !markerToSave.isSaved &&
                    selectedTourId !== null &&
                    onMarkerSaved
                ) {
                    onMarkerSaved();
                }

                // Close the form
                setSelectedMarkerId(null);
            } catch (error) {
                console.error('Failed to save marker:', error);
                toast.error('Failed to save marker. Please try again.');
            }
        },
        [
            markers,
            selectedTripId,
            mapInstance,
            onMarkerClick,
            selectedTourId,
            onMarkerSaved,
        ],
    );

    const handleDeleteMarker = useCallback(
        async (id: string) => {
            try {
                // First call API to delete from database
                await axios.delete(`/markers/${id}`);

                // Remove from map and state in one operation
                setMarkers((prev) => {
                    const marker = prev.find((m) => m.id === id);
                    if (marker) {
                        const mapboxMarker = marker.marker;
                        if (mapboxMarker) {
                            mapboxMarker.remove();
                        }
                    }
                    return prev.filter((m) => m.id !== id);
                });

                // Clear selection if deleted marker was selected
                if (selectedMarkerId === id) {
                    setSelectedMarkerId(null);
                }
            } catch (error) {
                console.error('Failed to delete marker:', error);
                toast.error('Failed to delete marker. Please try again.');

                // Re-add marker to map if deletion failed
                setMarkers((prev) => {
                    const deletedMarker = markers.find((m) => m.id === id);
                    if (deletedMarker && mapInstance) {
                        deletedMarker.marker.addTo(mapInstance);
                        return [...prev, deletedMarker];
                    }
                    return prev;
                });
            }
        },
        [selectedMarkerId, mapInstance, markers],
    );

    const handleCloseForm = useCallback(() => {
        // If closing an unsaved marker, remove it from the map and state
        if (selectedMarkerId) {
            setMarkers((prev) => {
                const marker = prev.find((m) => m.id === selectedMarkerId);
                if (marker && !marker.isSaved) {
                    // Remove marker from map
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                    // Remove from state
                    return prev.filter((m) => m.id !== selectedMarkerId);
                }
                return prev;
            });
        }
        setSelectedMarkerId(null);
    }, [selectedMarkerId]);

    const addMarker = useCallback((markerData: MarkerData) => {
        setMarkers((prev) => {
            // Check if marker already exists
            const exists = prev.find((m) => m.id === markerData.id);
            if (exists) {
                console.warn('[markers] addMarker: marker already exists', {
                    id: markerData.id,
                });
                return prev;
            }

            // If adding a new temporary marker, remove any existing temporary markers first
            if (!markerData.isSaved) {
                // Separate saved and unsaved markers in a single pass
                const savedMarkers: MarkerData[] = [];
                const unsavedMarkers: MarkerData[] = [];

                prev.forEach((m) => {
                    if (m.isSaved) {
                        savedMarkers.push(m);
                    } else {
                        unsavedMarkers.push(m);
                    }
                });

                // Remove all existing unsaved markers from map
                unsavedMarkers.forEach((m) => {
                    const mapboxMarker = m.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                });

                // Return state without unsaved markers, plus the new marker
                return [...savedMarkers, markerData];
            }

            return [...prev, markerData];
        });
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
