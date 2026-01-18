import { MapSearchBox } from '@/components/map-search-box';
import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ViewportMapPickerProps {
    /**
     * Trip name to search for
     */
    searchQuery?: string;
    /**
     * ISO 3166 alpha-2 country code to restrict search
     */
    country?: string;
    /**
     * Initial viewport if editing an existing trip
     */
    initialViewport?: {
        latitude: number;
        longitude: number;
        zoom: number;
    };
    /**
     * Callback when viewport changes
     */
    onViewportChange?: (viewport: {
        latitude: number;
        longitude: number;
        zoom: number;
    }) => void;
}

/**
 * Component for selecting a map viewport when creating/editing a trip.
 * Shows a simplified map with countries, regions, and cities.
 * Auto-searches when a trip name is provided.
 */
export function ViewportMapPicker({
    searchQuery,
    country,
    initialViewport,
    onViewportChange,
}: ViewportMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const searchBoxRef = useRef<{ search: (query: string) => void } | null>(
        null,
    );
    const lastSearchQueryRef = useRef<string>('');

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

        if (!mapboxToken) {
            console.warn('Mapbox access token not found.');
            return;
        }

        mapboxgl.accessToken = mapboxToken;

        // Initialize with simplified style showing only countries, regions, and cities
        const map = new mapboxgl.Map({
            container: mapRef.current,
            // Use streets-v12 style which can be simplified to show only places
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialViewport
                ? [initialViewport.longitude, initialViewport.latitude]
                : [8.5417, 47.3769], // Default to Zurich, Switzerland
            zoom: initialViewport?.zoom ?? 4,
        });

        mapInstanceRef.current = map;

        // Wait for map to load before simplifying
        map.on('load', () => {
            // Hide road and other detail layers to show only places
            const layersToHide = [
                'road-label',
                'road-simple',
                'road-street',
                'road-secondary-tertiary',
                'road-primary',
                'road-motorway-trunk',
                'bridge-simple',
                'bridge-street',
                'bridge-secondary-tertiary',
                'bridge-primary',
                'bridge-motorway-trunk',
                'tunnel-simple',
                'tunnel-street',
                'tunnel-secondary-tertiary',
                'tunnel-primary',
                'tunnel-motorway-trunk',
                'ferry',
                'ferry-auto',
            ];

            layersToHide.forEach((layerId) => {
                if (map.getLayer(layerId)) {
                    map.setLayoutProperty(layerId, 'visibility', 'none');
                }
            });

            setMapInitialized(true);
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Track viewport changes
        const handleMoveEnd = () => {
            if (!onViewportChange) return;

            const center = map.getCenter();
            const zoom = map.getZoom();

            onViewportChange({
                latitude: center.lat,
                longitude: center.lng,
                zoom: zoom,
            });
        };

        map.on('moveend', handleMoveEnd);

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [initialViewport, onViewportChange]);

    // Handle search result selection
    const handleSearchResult = useCallback(
        (result: SearchBoxRetrieveResponse) => {
            const map = mapInstanceRef.current;
            if (!map || !result.features || result.features.length === 0)
                return;

            const feature = result.features[0];
            const coordinates = feature.geometry.coordinates;

            if (!coordinates || coordinates.length < 2) return;

            const [lng, lat] = coordinates;
            const bbox = feature.properties?.bbox;

            // If we have a bounding box, fit to it to show the entire area
            if (bbox && Array.isArray(bbox) && bbox.length === 4) {
                map.fitBounds(
                    [
                        [bbox[0], bbox[1]], // southwest
                        [bbox[2], bbox[3]], // northeast
                    ],
                    {
                        padding: 50,
                        maxZoom: 12, // Don't zoom in too close for large areas
                        duration: 1000,
                    },
                );
            } else {
                // Otherwise, just fly to the location
                map.flyTo({
                    center: [lng, lat],
                    zoom: 10,
                    duration: 1000,
                });
            }
        },
        [],
    );

    // Auto-search when searchQuery changes
    useEffect(() => {
        if (
            !mapInitialized ||
            !searchQuery ||
            searchQuery.trim() === '' ||
            searchQuery === lastSearchQueryRef.current
        ) {
            return;
        }

        lastSearchQueryRef.current = searchQuery;

        // Use Mapbox Geocoding API for auto-search
        const performSearch = async () => {
            try {
                const mapboxToken =
                    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
                if (!mapboxToken) return;

                const searchTypes = 'country,region,place';
                const countryParam = country ? `&country=${country}` : '';
                const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchQuery)}&types=${searchTypes}${countryParam}&access_token=${mapboxToken}`;

                const response = await fetch(url);
                if (!response.ok) return;

                const data = await response.json();

                if (data.features && data.features.length > 0) {
                    // Simulate SearchBoxRetrieveResponse
                    handleSearchResult({
                        features: data.features,
                    } as SearchBoxRetrieveResponse);
                }
            } catch (error) {
                console.error('Auto-search failed:', error);
            }
        };

        // Debounce the search
        const timeoutId = setTimeout(performSearch, 500);
        return () => clearTimeout(timeoutId);
    }, [
        searchQuery,
        country,
        mapInitialized,
        handleSearchResult,
        lastSearchQueryRef,
    ]);

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    return (
        <div
            className="relative h-64 overflow-hidden rounded-lg border border-input"
            data-testid="viewport-map-picker"
        >
            <div ref={mapRef} className="h-full w-full" />
            {mapInitialized && (
                <MapSearchBox
                    onRetrieve={handleSearchResult}
                    accessToken={accessToken}
                    countries={country ? [country] : undefined}
                    types={['country', 'region', 'place']}
                />
            )}
        </div>
    );
}
