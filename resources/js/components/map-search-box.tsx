import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import { SearchBox } from '@mapbox/search-js-react';
import mapboxgl from 'mapbox-gl';
import { useEffect, useState } from 'react';

interface MapSearchBoxProps {
    mapInstance: mapboxgl.Map | null;
    onRetrieve: (result: SearchBoxRetrieveResponse) => void;
    accessToken: string;
}

/**
 * SearchBox component that integrates Mapbox SearchBox with proximity filtering
 * based on the current map viewport
 */
export function MapSearchBox({
    mapInstance,
    onRetrieve,
    accessToken,
}: MapSearchBoxProps) {
    const [proximity, setProximity] = useState<{
        lng: number;
        lat: number;
    } | null>(null);

    // Update proximity based on map center whenever map moves
    useEffect(() => {
        if (!mapInstance) return;

        const updateProximity = () => {
            const center = mapInstance.getCenter();
            setProximity({
                lng: center.lng,
                lat: center.lat,
            });
        };

        // Set initial proximity
        updateProximity();

        // Update proximity when map moves
        mapInstance.on('moveend', updateProximity);

        return () => {
            mapInstance.off('moveend', updateProximity);
        };
    }, [mapInstance]);

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
                    proximity: proximity || undefined,
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
