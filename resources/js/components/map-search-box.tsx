git import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import { SearchBox } from '@mapbox/search-js-react';
import { useMemo } from 'react';

interface MapSearchBoxProps {
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
    onRetrieve,
    accessToken,
    countries,
    types,
    bbox,
}: MapSearchBoxProps) {
    // Validate and memoize bbox to avoid unnecessary re-renders
    const validatedBbox = useMemo(() => {
        if (bbox && bbox.every((val) => isFinite(val))) {
            return bbox;
        }
        return undefined;
    }, [bbox]);

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
                    language: 'de,en',
                    bbox: validatedBbox,
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
