import { Route } from '@/types/route';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface UseRoutesOptions {
    mapInstance: mapboxgl.Map | null;
    selectedTripId: number | null;
    selectedTourId: number | null;
}

export function useRoutes({ mapInstance, selectedTripId, selectedTourId }: UseRoutesOptions) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const routeLayerIdsRef = useRef<Map<number, string>>(new Map());

    // Load routes from database when trip changes
    useEffect(() => {
        const loadRoutes = async () => {
            if (!selectedTripId || !mapInstance) return;

            try {
                const response = await axios.get('/routes', {
                    params: { trip_id: selectedTripId },
                });
                const dbRoutes = response.data;
                setRoutes(dbRoutes);
            } catch (error) {
                console.error('Failed to load routes:', error);
            }
        };

        loadRoutes();
    }, [selectedTripId, mapInstance]);

    // Render routes on map - filter by tour if one is selected
    useEffect(() => {
        if (!mapInstance) return;

        // Clear existing route layers
        routeLayerIdsRef.current.forEach((layerId) => {
            if (mapInstance.getLayer(layerId)) {
                mapInstance.removeLayer(layerId);
            }
            if (mapInstance.getSource(layerId)) {
                mapInstance.removeSource(layerId);
            }
        });
        routeLayerIdsRef.current.clear();

        // Filter routes by selected tour (if a tour is selected)
        const visibleRoutes = selectedTourId !== null
            ? routes.filter((route) => route.tour_id === selectedTourId)
            : routes;

        // Render each route as a line layer
        visibleRoutes.forEach((route) => {
            const layerId = `route-${route.id}`;

            // Determine color based on transport mode
            let color = '#3388ff'; // Default blue
            if (route.transport_mode.value === 'driving-car') {
                color = '#e74c3c'; // Red for car
            } else if (route.transport_mode.value === 'cycling-regular') {
                color = '#f39c12'; // Orange for bike
            } else if (route.transport_mode.value === 'foot-walking') {
                color = '#27ae60'; // Green for walking
            } else if (route.transport_mode.value === 'public-transport') {
                color = '#3498db'; // Blue for public transport
            }

            // Add source for the route
            mapInstance.addSource(layerId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {
                        startName: route.start_marker.name,
                        endName: route.end_marker.name,
                        mode: route.transport_mode.label,
                        distance: route.distance.km.toFixed(2),
                        duration: Math.round(route.duration.minutes),
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: route.geometry, // Already in [lng, lat] format
                    },
                },
            });

            // Add layer for the route
            mapInstance.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 4,
                    'line-opacity': 0.7,
                },
            });

            // Add popup on click
            mapInstance.on('click', layerId, (e) => {
                if (e.features && e.features[0] && e.features[0].properties) {
                    const props = e.features[0].properties;
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(
                            `<strong>${props.startName} → ${props.endName}</strong><br>` +
                                `Mode: ${props.mode}<br>` +
                                `Distance: ${props.distance} km<br>` +
                                `Duration: ${props.duration} min`,
                        )
                        .addTo(mapInstance);
                }
            });

            // Change cursor on hover
            mapInstance.on('mouseenter', layerId, () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
            });

            mapInstance.on('mouseleave', layerId, () => {
                mapInstance.getCanvas().style.cursor = 'crosshair';
            });

            routeLayerIdsRef.current.set(route.id, layerId);
        });
    }, [routes, mapInstance, selectedTourId]);

    return {
        routes,
        setRoutes,
    } as const;
}
