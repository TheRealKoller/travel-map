import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/map-constants';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

export function useMapInstance() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
    const [, setMapInitialized] = useState(false);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Get Mapbox access token from environment variable (vite exposes as import.meta.env)
        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

        if (!mapboxToken) {
            console.warn(
                'Mapbox access token not found. Using public demo token (not for production).',
            );
        }

        mapboxgl.accessToken =
            mapboxToken ||
            'pk.eyJ1IjoidHJhdmVsLW1hcC1kZW1vIiwiYSI6ImNtMTBhYmMxMjAwMDAya3M0MXl2ZHFyZWEifQ.demo';

        // Initialize the map
        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/standard',
            center: [DEFAULT_MAP_CENTER[1], DEFAULT_MAP_CENTER[0]], // [lng, lat]
            zoom: DEFAULT_MAP_ZOOM,
            config: {
                basemap: {
                    colorPlaceLabelHighlight: 'red',
                    colorPlaceLabelSelect: 'blue',
                },
            },
        });
        mapInstanceRef.current = map;
        setMapInitialized(true);

        // Set crosshair cursor
        map.getCanvas().style.cursor = 'crosshair';

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return {
        mapRef,
        // eslint-disable-next-line react-hooks/refs
        mapInstance: mapInstanceRef.current,
    } as const;
}
