import { createMarkerElement } from '@/lib/marker-utils';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface UseMarkerStylingOptions {
    mapInstance: mapboxgl.Map | null;
    markers: MarkerData[];
    selectedMarkerId: string | null;
    selectedTourId: number | null;
    tours: Tour[];
    onMarkerUpdated: (markerId: string, marker: mapboxgl.Marker) => void;
    onMarkerClick: (markerId: string) => void;
}

export function useMarkerStyling({
    mapInstance,
    markers,
    selectedMarkerId,
    selectedTourId,
    tours,
    onMarkerUpdated,
    onMarkerClick,
}: UseMarkerStylingOptions) {
    const previousSelectedMarkerRef = useRef<string | null>(null);
    const previousTourStateRef = useRef<{
        id: number | null;
        key: string | null;
    }>({ id: null, key: null });
    const markersRef = useRef<MarkerData[]>(markers);

    // Keep markersRef in sync with markers prop
    useEffect(() => {
        markersRef.current = markers;
    }, [markers]);

    useEffect(() => {
        if (!mapInstance) return;

        const currentMarkers = markersRef.current;

        const selectedTour = selectedTourId
            ? tours.find((t) => t.id === selectedTourId) || null
            : null;
        const tourMarkerIds = selectedTour
            ? new Set(selectedTour.markers?.map((m) => m.id) || [])
            : null;
        const tourKey = tourMarkerIds
            ? Array.from(tourMarkerIds).sort().join(',')
            : null;

        const rebuildMarker = (
            markerData: MarkerData,
            isHighlighted: boolean,
        ) => {
            const isInSelectedTour = tourMarkerIds
                ? tourMarkerIds.has(markerData.id)
                : true;

            // If no tour selected, nothing is greyed out
            const isGreyedOut = tourMarkerIds ? !isInSelectedTour : false;

            const el = createMarkerElement(
                markerData.type,
                isHighlighted,
                !markerData.isSaved,
                isGreyedOut,
            );

            const [lng, lat] = [markerData.lng, markerData.lat];
            const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                markerData.name || 'Unnamed Location',
            );

            // Remove old marker and recreate
            markerData.marker.remove();
            const newMarker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(mapInstance);

            el.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation();
                onMarkerClick(markerData.id);
            });

            onMarkerUpdated(markerData.id, newMarker);
        };

        const tourChanged =
            previousTourStateRef.current.id !== selectedTourId ||
            previousTourStateRef.current.key !== tourKey;
        const selectionChanged =
            previousSelectedMarkerRef.current !== selectedMarkerId;

        // If nothing relevant changed, skip
        if (!tourChanged && !selectionChanged) {
            return;
        }

        if (tourChanged) {
            // Rebuild all markers to update grey state; highlight handled below
            currentMarkers.forEach((marker) => {
                const isHighlighted = marker.id === selectedMarkerId;
                rebuildMarker(marker, isHighlighted);
            });
        } else {
            // Only selection changed: update previous and current
            if (previousSelectedMarkerRef.current) {
                const prevMarker = currentMarkers.find(
                    (m) => m.id === previousSelectedMarkerRef.current,
                );
                if (prevMarker) {
                    rebuildMarker(prevMarker, false);
                }
            }

            if (selectedMarkerId) {
                const selectedMarker = currentMarkers.find(
                    (m) => m.id === selectedMarkerId,
                );
                if (selectedMarker) {
                    rebuildMarker(selectedMarker, true);
                }
            }
        }

        previousSelectedMarkerRef.current = selectedMarkerId;
        previousTourStateRef.current = { id: selectedTourId, key: tourKey };
    }, [
        selectedMarkerId,
        selectedTourId,
        tours,
        mapInstance,
        onMarkerClick,
        onMarkerUpdated,
    ]);
}
