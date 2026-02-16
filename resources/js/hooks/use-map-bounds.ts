import { Trip } from '@/types/trip';
import mapboxgl from 'mapbox-gl';
import { useEffect, useState } from 'react';

interface UseMapBoundsProps {
    mapInstance: mapboxgl.Map | null;
    selectedTripId: number | null;
    trips: Trip[];
    onSetViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<void>;
}

interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

interface UseMapBoundsReturn {
    mapBounds: MapBounds | null;
}

/**
 * Custom hook for managing map viewport bounds and persistence
 * Handles viewport updates and trip switching
 */
export function useMapBounds({
    mapInstance,
    selectedTripId,
    trips,
    onSetViewport,
}: UseMapBoundsProps): UseMapBoundsReturn {
    // State for map bounds (for AI recommendations)
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

    // Update map bounds for AI recommendations
    useEffect(() => {
        if (!mapInstance) return;

        const updateBounds = () => {
            const bounds = mapInstance.getBounds();
            if (!bounds) return;
            setMapBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        };

        // Update immediately
        updateBounds();

        // Update on moveend
        mapInstance.on('moveend', updateBounds);

        return () => {
            mapInstance.off('moveend', updateBounds);
        };
    }, [mapInstance]);

    // Listen for custom event to set viewport (triggered by trip notes modal)
    useEffect(() => {
        if (!mapInstance || !onSetViewport) return;

        const handleSetViewportEvent = (event: CustomEvent) => {
            const { tripId, viewport } = event.detail;
            onSetViewport(tripId, viewport);
        };

        window.addEventListener(
            'trip:set-viewport',
            handleSetViewportEvent as EventListener,
        );

        return () => {
            window.removeEventListener(
                'trip:set-viewport',
                handleSetViewportEvent as EventListener,
            );
        };
    }, [mapInstance, onSetViewport]);

    // Apply saved viewport when switching trips
    useEffect(() => {
        if (!mapInstance || !selectedTripId) return;

        const trip = trips.find((t) => t.id === selectedTripId);
        if (
            trip &&
            trip.viewport_latitude !== null &&
            trip.viewport_longitude !== null &&
            trip.viewport_zoom !== null &&
            !isNaN(trip.viewport_latitude) &&
            !isNaN(trip.viewport_longitude) &&
            !isNaN(trip.viewport_zoom)
        ) {
            mapInstance.flyTo({
                center: [trip.viewport_longitude, trip.viewport_latitude],
                zoom: trip.viewport_zoom,
                essential: true,
            });
        }
    }, [selectedTripId, mapInstance, trips]);

    return {
        mapBounds,
    };
}
