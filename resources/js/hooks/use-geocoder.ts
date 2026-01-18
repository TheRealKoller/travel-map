import { createMarkerElement } from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import { SearchBoxRetrieveResponse } from '@mapbox/search-js-core';
import mapboxgl from 'mapbox-gl';
import { useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UseGeocoderOptions {
    mapInstance: mapboxgl.Map | null;
    onMarkerCreated: (marker: MarkerData) => void;
    onMarkerSelected: (markerId: string) => void;
}

/**
 * Hook to manage search result markers and conversions
 * This hook provides callbacks for the SearchBox component
 */
export function useGeocoder({
    mapInstance,
    onMarkerCreated,
    onMarkerSelected,
}: UseGeocoderOptions) {
    const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);

    /**
     * Handle search result selection from SearchBox
     */
    const handleSearchResult = useCallback(
        (result: SearchBoxRetrieveResponse) => {
            if (!mapInstance) return;

            const coordinates = result.features[0]?.geometry.coordinates;
            const properties = result.features[0]?.properties;

            if (!coordinates || coordinates.length < 2) return;

            const [lng, lat] = coordinates;
            const placeName =
                properties?.name ||
                properties?.full_address ||
                'Searched Location';

            // Remove previous search marker if exists
            if (searchMarkerRef.current) {
                searchMarkerRef.current.remove();
            }

            // Create a temporary highlight marker with yellow color
            const el = document.createElement('div');
            el.innerHTML = `
                <div class="mapbox-marker mapbox-marker--search">
                    <div class="mapbox-marker__icon">
                        <i class="fa fa-search"></i>
                    </div>
                </div>
            `;

            // Add temporary marker to highlight search result
            const searchMarker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(mapInstance);

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<strong>${placeName}</strong><br><small>Click on this marker to add it permanently</small>`,
            );
            searchMarker.setPopup(popup);
            popup.addTo(mapInstance);

            // Add click handler to convert temporary marker to permanent
            el.addEventListener('click', () => {
                // Remove the temporary marker
                searchMarker.remove();
                searchMarkerRef.current = null;

                // Create permanent marker
                const defaultType = MarkerType.PointOfInterest;
                const markerEl = createMarkerElement(defaultType);

                const marker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(mapInstance);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: placeName,
                    type: defaultType,
                    notes: '',
                    url: '',
                    imageUrl: null,
                    isUnesco: false,
                    aiEnriched: false,
                    marker: marker,
                    isSaved: false, // Mark as unsaved
                };

                // Add popup to marker
                const markerPopup = new mapboxgl.Popup({ offset: 25 }).setText(
                    placeName,
                );
                marker.setPopup(markerPopup);

                // Add click handler to permanent marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    onMarkerSelected(markerId);
                });

                onMarkerCreated(markerData);
                onMarkerSelected(markerId);
            });

            searchMarkerRef.current = searchMarker;

            // Center and zoom to the location
            mapInstance.flyTo({ center: [lng, lat], zoom: 16 });
        },
        [mapInstance, onMarkerCreated, onMarkerSelected],
    );

    return {
        searchMarkerRef,
        handleSearchResult,
    } as const;
}
