import { createMarkerElement } from '@/lib/marker-utils';
import { GeocodeResult } from '@/types/geocoder';
import { MarkerData, MarkerType } from '@/types/marker';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface UseGeocoderOptions {
    mapInstance: mapboxgl.Map | null;
    onMarkerCreated: (marker: MarkerData) => void;
    onMarkerSelected: (markerId: string) => void;
}

export function useGeocoder({
    mapInstance,
    onMarkerCreated,
    onMarkerSelected,
}: UseGeocoderOptions) {
    const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);

    useEffect(() => {
        if (!mapInstance) return;

        // Add geocoder search control
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken || '',
            mapboxgl: mapboxgl as never,
            marker: false, // We'll handle markers ourselves
            placeholder: 'Search for places...',
        });

        mapInstance.addControl(geocoder, 'top-left');

        // Add data-testid for E2E testing
        // Use MutationObserver to watch for when the geocoder is added to the DOM
        const addTestIdToGeocoder = () => {
            const geocoderElement = document.querySelector(
                '.mapboxgl-ctrl-geocoder',
            );
            if (geocoderElement) {
                geocoderElement.setAttribute('data-testid', 'map-geocoder');
                return true;
            }
            return false;
        };

        // Try immediately first
        if (!addTestIdToGeocoder()) {
            // If not found, set up MutationObserver
            const observer = new MutationObserver(() => {
                if (addTestIdToGeocoder()) {
                    observer.disconnect();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            // Fallback timeout to disconnect observer after 5 seconds
            setTimeout(() => observer.disconnect(), 5000);
        }

        // Handle geocoder result
        geocoder.on('result', (e: { result: GeocodeResult }) => {
            const [lng, lat] = e.result.center;
            const placeName = e.result.place_name || 'Searched Location';

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
                    isUnesco: false,
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
        });
    }, [mapInstance, onMarkerCreated, onMarkerSelected]);

    return {
        searchMarkerRef,
    } as const;
}
