import { Waypoint } from '@/types/route';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface UseWaypointModeOptions {
    mapInstance: mapboxgl.Map | null;
}

export function useWaypointMode({ mapInstance }: UseWaypointModeOptions) {
    const [isWaypointMode, setIsWaypointMode] = useState(false);
    const [pendingWaypoints, setPendingWaypoints] = useState<Waypoint[]>([]);
    const isWaypointModeRef = useRef(false);

    useEffect(() => {
        if (!mapInstance) return;
        isWaypointModeRef.current = isWaypointMode;

        if (isWaypointMode) {
            mapInstance.getCanvas().style.cursor = 'crosshair';
        } else {
            mapInstance.getCanvas().style.cursor = '';
        }
    }, [isWaypointMode, mapInstance]);

    const addWaypoint = (waypoint: Waypoint) => {
        setPendingWaypoints((prev) => [...prev, waypoint]);
    };

    const removeWaypoint = (index: number) => {
        setPendingWaypoints((prev) => prev.filter((_, i) => i !== index));
    };

    const clearWaypoints = () => {
        setPendingWaypoints([]);
    };

    const exitWaypointMode = () => {
        setIsWaypointMode(false);
    };

    return {
        isWaypointMode,
        setIsWaypointMode,
        isWaypointModeRef,
        pendingWaypoints,
        addWaypoint,
        removeWaypoint,
        clearWaypoints,
        exitWaypointMode,
    } as const;
}
