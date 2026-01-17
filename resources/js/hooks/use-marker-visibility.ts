import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import { useEffect } from 'react';

interface UseMarkerVisibilityOptions {
    mapInstance: mapboxgl.Map | null;
    markers: MarkerData[];
    selectedTourId: number | null;
    tours: Tour[];
}

export function useMarkerVisibility({
    mapInstance,
    markers,
    selectedTourId,
    tours,
}: UseMarkerVisibilityOptions) {
    // Filter markers visibility based on selected tour
    useEffect(() => {
        if (!mapInstance) return;

        if (selectedTourId === null) {
            // Show all markers when no tour is selected
            markers.forEach((marker) => {
                const mapboxMarker = marker.marker;
                if (mapboxMarker && mapInstance) {
                    mapboxMarker.addTo(mapInstance);
                }
            });
        } else {
            // Find the selected tour
            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (selectedTour) {
                // Get marker IDs that belong to the selected tour
                const tourMarkerIds = new Set(
                    selectedTour.markers?.map((m) => m.id) || [],
                );

                // Show/hide markers based on whether they belong to the tour
                markers.forEach((marker) => {
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        if (tourMarkerIds.has(marker.id)) {
                            // Show marker if it belongs to the tour
                            if (mapInstance) {
                                mapboxMarker.addTo(mapInstance);
                            }
                        } else {
                            // Hide marker if it doesn't belong to the tour
                            mapboxMarker.remove();
                        }
                    }
                });
            } else {
                // Tour not found, hide all markers

                markers.forEach((marker) => {
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                });
            }
        }
    }, [selectedTourId, markers, tours, mapInstance]);
}
