import {
    createMarkerElement,
    getMarkerTypeFromOSMType,
} from '@/lib/marker-utils';
import { SearchResult } from '@/types/geocoder';
import { MarkerData } from '@/types/marker';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UseSearchResultsOptions {
    mapInstance: mapboxgl.Map | null;
    onMarkerCreated: (marker: MarkerData) => void;
    onMarkerSelected: (markerId: string) => void;
}

export function useSearchResults({
    mapInstance,
    onMarkerCreated,
    onMarkerSelected,
}: UseSearchResultsOptions) {
    const [searchResults] = useState<SearchResult[]>([]);
    const searchResultMarkersRef = useRef<mapboxgl.Marker[]>([]);

    // Display blue circles for search results
    useEffect(() => {
        if (!mapInstance) return;

        // Remove existing result markers
        searchResultMarkersRef.current.forEach((marker) => {
            marker.remove();
        });
        searchResultMarkersRef.current = [];

        // Add new markers for search results
        if (searchResults.length > 0) {
            const resultMarkers = searchResults.map((result) => {
                // Create a custom blue circle marker element
                const el = document.createElement('div');
                el.className = 'search-result-marker';

                // Create the marker
                const marker = new mapboxgl.Marker(el).setLngLat([
                    result.lon,
                    result.lat,
                ]);

                // Add tooltip with priority: English name > International name > Local name
                const displayName =
                    result.name_en || result.name_int || result.name;
                if (displayName) {
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                        displayName,
                    );
                    marker.setPopup(popup);
                }

                // Add click handler to create a marker from search result
                el.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    // Get the name with priority: English > International > Local
                    const markerName =
                        result.name_en || result.name_int || result.name || '';

                    // Get the appropriate marker type based on OSM type
                    const markerType = getMarkerTypeFromOSMType(result.type);

                    // Create the marker element - created from search result but becomes temporary until saved
                    const markerEl = createMarkerElement(
                        markerType,
                        false,
                        true,
                    );

                    // Create the marker
                    const newMarker = new mapboxgl.Marker(markerEl)
                        .setLngLat([result.lon, result.lat])
                        .addTo(mapInstance);

                    const markerId = uuidv4();
                    const markerData: MarkerData = {
                        id: markerId,
                        lat: result.lat,
                        lng: result.lon,
                        name: markerName,
                        type: markerType,
                        notes: '',
                        url: '',
                        imageUrl: null,
                        isUnesco: false,
                        aiEnriched: false,
                        marker: newMarker,
                        isSaved: false,
                    };

                    // Add popup to marker
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                        markerName || 'Unnamed Location',
                    );
                    newMarker.setPopup(popup);

                    // Add click handler to marker
                    markerEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        onMarkerSelected(markerId);
                    });

                    // Notify parent component about the new marker
                    onMarkerCreated(markerData);
                    onMarkerSelected(markerId);

                    // Remove the blue circle marker since we've created a marker from it
                    marker.remove();
                });

                marker.addTo(mapInstance);
                return marker;
            });

            searchResultMarkersRef.current = resultMarkers;
        }
    }, [searchResults, mapInstance, onMarkerCreated, onMarkerSelected]);

    return {
        searchResults,
        searchResultMarkersRef,
    } as const;
}
