import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useState } from 'react';

interface MapSearchBoxProps {
    mapInstance: mapboxgl.Map | null;
    onRetrieve: (result: SearchBoxRetrieveResponse) => void;
    accessToken: string;
    /**
     * ISO 3166 alpha-2 country codes to restrict search results
     * Examples: ['DE'], ['DE', 'AT', 'CH'], ['US', 'CA']
     * If not provided, searches globally
     */
    countries?: string[];
    /**
     * Types of results to return (e.g., 'place', 'poi', 'address')
     * Defaults to all types if not specified
     */
    types?: string[];
    /**
     * Bounding box to restrict search results [west, south, east, north]
     * If provided, this takes precedence over countries and proximity
     */
    bbox?: [number, number, number, number];
}

/**
 * SearchBox component that integrates Mapbox SearchBox with bounding box filtering
 * based on the trip's saved viewport settings
 */
export function MapSearchBox({
    mapInstance,
    onRetrieve,
    accessToken,
    countries,
    types,
    bbox: initialBbox,
}: MapSearchBoxProps) {
    const [bbox, setBbox] = useState<[number, number, number, number] | null>(
        initialBbox || null,
    );

    // Update bbox when initialBbox prop changes (when trip changes)
    useEffect(() => {
        if (initialBbox && initialBbox.every((val) => isFinite(val))) {
            setBbox(initialBbox);
        } else {
            setBbox(null);
        }
    }, [initialBbox]);

    // Early return if no access token
    if (!accessToken) {
        return null;
    }

    return (
        <div
            className="absolute top-2 left-2 z-10 w-80"
            data-testid="map-geocoder"
        >
            <SearchBox
                accessToken={accessToken}
                options={{
                    language: 'en,de',
                    bbox: bbox || undefined,
                    country: countries?.join(','),
                    types: types?.join(','),
                }}
                placeholder="Search for places..."
                onRetrieve={onRetrieve}
                theme={{
                    variables: {
                        fontFamily: 'inherit',
                        unit: '14px',
                        borderRadius: '8px',
                    },
                }}
            />
        </div>
    );
}
