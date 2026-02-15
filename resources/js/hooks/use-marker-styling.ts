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
    selectedAvailableMarkerId: string | null;
    tours: Tour[];
    onMarkerUpdated: (markerId: string, marker: mapboxgl.Marker) => void;
    onMarkerClick: (markerId: string) => void;
}

export function useMarkerStyling({
    mapInstance,
    markers,
    selectedMarkerId,
    selectedTourId,
    selectedAvailableMarkerId,
    tours,
    onMarkerUpdated,
    onMarkerClick,
}: UseMarkerStylingOptions) {
    const previousSelectedMarkerRef = useRef<string | null>(null);
    const previousSelectedAvailableMarkerRef = useRef<string | null>(null);
    const previousTourStateRef = useRef<{
        id: number | null;
        key: string | null;
    }>({ id: null, key: null });
    const markersRef = useRef<MarkerData[]>(markers);
    const onMarkerUpdatedRef = useRef(onMarkerUpdated);
    const onMarkerClickRef = useRef(onMarkerClick);

    // Keep markersRef in sync with markers prop
    useEffect(() => {
        markersRef.current = markers;
    }, [markers]);

    // Keep callback refs in sync to avoid stale closures in interaction handlers
    useEffect(() => {
        onMarkerUpdatedRef.current = onMarkerUpdated;
    }, [onMarkerUpdated]);

    useEffect(() => {
        onMarkerClickRef.current = onMarkerClick;
    }, [onMarkerClick]);

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

            // Blue ring for selected available marker (not in tour, but selected)
            const hasBlueRing =
                selectedAvailableMarkerId === markerData.id &&
                !isInSelectedTour;

            const el = createMarkerElement({
                type: markerData.type,
                isHighlighted,
                isTemporary: !markerData.isSaved,
                isGreyedOut,
                hasBlueRing,
            });

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
                onMarkerClickRef.current(markerData.id);
            });

            onMarkerUpdatedRef.current(markerData.id, newMarker);
        };

        const tourChanged =
            previousTourStateRef.current.id !== selectedTourId ||
            previousTourStateRef.current.key !== tourKey;
        const selectionChanged =
            previousSelectedMarkerRef.current !== selectedMarkerId;
        const availableMarkerChanged =
            previousSelectedAvailableMarkerRef.current !==
            selectedAvailableMarkerId;

        // If nothing relevant changed, skip
        if (!tourChanged && !selectionChanged && !availableMarkerChanged) {
            return;
        }

        if (tourChanged) {
            // Rebuild all markers to update grey state; highlight handled below
            currentMarkers.forEach((marker) => {
                const isHighlighted = marker.id === selectedMarkerId;
                rebuildMarker(marker, isHighlighted);
            });
        } else {
            // Track which markers we've already rebuilt to avoid duplicates
            const rebuiltMarkerIds = new Set<string>();

            // Handle selection changes
            if (selectionChanged) {
                if (previousSelectedMarkerRef.current) {
                    const prevMarker = currentMarkers.find(
                        (m) => m.id === previousSelectedMarkerRef.current,
                    );
                    if (prevMarker) {
                        rebuildMarker(prevMarker, false);
                        rebuiltMarkerIds.add(prevMarker.id);
                    }
                }

                if (selectedMarkerId) {
                    const selectedMarker = currentMarkers.find(
                        (m) => m.id === selectedMarkerId,
                    );
                    if (selectedMarker) {
                        rebuildMarker(selectedMarker, true);
                        rebuiltMarkerIds.add(selectedMarker.id);
                    }
                }
            }

            // Handle available marker selection changes
            if (availableMarkerChanged) {
                if (previousSelectedAvailableMarkerRef.current) {
                    const prevAvailableMarker = currentMarkers.find(
                        (m) =>
                            m.id === previousSelectedAvailableMarkerRef.current,
                    );
                    if (
                        prevAvailableMarker &&
                        !rebuiltMarkerIds.has(prevAvailableMarker.id)
                    ) {
                        const isHighlighted =
                            prevAvailableMarker.id === selectedMarkerId;
                        rebuildMarker(prevAvailableMarker, isHighlighted);
                        rebuiltMarkerIds.add(prevAvailableMarker.id);
                    }
                }

                if (selectedAvailableMarkerId) {
                    const availableMarker = currentMarkers.find(
                        (m) => m.id === selectedAvailableMarkerId,
                    );
                    if (
                        availableMarker &&
                        !rebuiltMarkerIds.has(availableMarker.id)
                    ) {
                        const isHighlighted =
                            availableMarker.id === selectedMarkerId;
                        rebuildMarker(availableMarker, isHighlighted);
                        rebuiltMarkerIds.add(availableMarker.id);
                    }
                }
            }
        }

        previousSelectedMarkerRef.current = selectedMarkerId;
        previousSelectedAvailableMarkerRef.current = selectedAvailableMarkerId;
        previousTourStateRef.current = { id: selectedTourId, key: tourKey };
    }, [
        selectedMarkerId,
        selectedAvailableMarkerId,
        selectedTourId,
        tours,
        mapInstance,
        onMarkerClick,
        onMarkerUpdated,
    ]);
}
