import { createMarkerElement } from '@/lib/marker-utils';
import { MarkerData } from '@/types/marker';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface UseMarkerHighlightOptions {
    mapInstance: mapboxgl.Map | null;
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onMarkerUpdated: (markerId: string, marker: mapboxgl.Marker) => void;
    onMarkerClick: (markerId: string) => void;
}

export function useMarkerHighlight({
    mapInstance,
    markers,
    selectedMarkerId,
    onMarkerUpdated,
    onMarkerClick,
}: UseMarkerHighlightOptions) {
    const previousSelectedMarkerRef = useRef<string | null>(null);
    const markersRef = useRef<MarkerData[]>(markers);

    // Keep markersRef in sync with markers prop
    useEffect(() => {
        markersRef.current = markers;
    }, [markers]);

    // Highlight selected marker effect
    useEffect(() => {
        if (!mapInstance) return;

        const currentMarkers = markersRef.current;

        // Restore previous marker to its original appearance
        if (previousSelectedMarkerRef.current) {
            const prevMarker = currentMarkers.find(
                (m) => m.id === previousSelectedMarkerRef.current,
            );
            if (prevMarker) {
                const mapboxMarker = prevMarker.marker;
                const [lng, lat] = [prevMarker.lng, prevMarker.lat];
                const el = createMarkerElement(prevMarker.type, false);

                // Remove and recreate marker with new element
                mapboxMarker.remove();
                const newMarker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                    prevMarker.name || 'Unnamed Location',
                );
                newMarker.setPopup(popup);

                el.addEventListener('click', (clickEvent) => {
                    clickEvent.stopPropagation();
                    onMarkerClick(prevMarker.id);
                });

                // Update the marker reference
                onMarkerUpdated(prevMarker.id, newMarker);
            }
        }

        // Highlight the currently selected marker
        if (selectedMarkerId) {
            const selectedMarker = currentMarkers.find(
                (m) => m.id === selectedMarkerId,
            );
            if (selectedMarker) {
                const mapboxMarker = selectedMarker.marker;
                const [lng, lat] = [selectedMarker.lng, selectedMarker.lat];
                const el = createMarkerElement(selectedMarker.type, true);

                // Remove and recreate marker with new element
                mapboxMarker.remove();
                const newMarker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                    selectedMarker.name || 'Unnamed Location',
                );
                newMarker.setPopup(popup);

                el.addEventListener('click', (clickEvent) => {
                    clickEvent.stopPropagation();
                    onMarkerClick(selectedMarker.id);
                });

                // Update the marker reference
                onMarkerUpdated(selectedMarker.id, newMarker);
            } else {
                // Selected marker not found in current markers
            }
        }

        // Update the ref for the next iteration
        previousSelectedMarkerRef.current = selectedMarkerId;
        // Only depend on selectedMarkerId and mapInstance
        // markers are accessed via ref to avoid infinite loops
    }, [selectedMarkerId, mapInstance, onMarkerUpdated, onMarkerClick]);
}
