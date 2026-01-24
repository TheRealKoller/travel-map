import {
    ensureVectorLayerOrder,
    getFirstSymbolLayerId,
} from '@/lib/map-layers';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';

interface UseRoutesOptions {
    mapInstance: mapboxgl.Map | null;
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    expandedRoutes: Set<number>;
    highlightedRouteId?: number | null;
    onRouteClick?: (routeId: number) => void;
}

export function useRoutes({
    mapInstance,
    selectedTripId,
    selectedTourId,
    tours,
    expandedRoutes,
    highlightedRouteId,
    onRouteClick,
}: UseRoutesOptions) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const routeLayerIdsRef = useRef<Map<number, string>>(new Map());
    const onRouteClickRef = useRef(onRouteClick); // Store callback in ref to avoid re-rendering

    // Update ref when callback changes
    useEffect(() => {
        onRouteClickRef.current = onRouteClick;
    }, [onRouteClick]);

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
        if (!mapInstance) {
            return;
        }

        // Clear existing route layers
        routeLayerIdsRef.current.forEach((layerId) => {
            if (mapInstance.getLayer(layerId)) {
                mapInstance.removeLayer(layerId);
            }
            if (mapInstance.getLayer(`${layerId}-hover`)) {
                mapInstance.removeLayer(`${layerId}-hover`);
            }
            if (mapInstance.getSource(layerId)) {
                mapInstance.removeSource(layerId);
            }
        });
        routeLayerIdsRef.current.clear();

        // Filter routes by selected tour (if a tour is selected)
        // If no tour is selected, only show expanded routes
        let visibleRoutes: Route[];

        if (selectedTourId !== null) {
            // Find the selected tour
            const selectedTour = tours.find((t) => t.id === selectedTourId);

            if (selectedTour && selectedTour.markers) {
                // Create a set of valid consecutive marker pairs in the current tour order
                const validPairs = new Set<string>();
                const tourMarkerIds = selectedTour.markers.map((m) => m.id);

                for (let i = 0; i < tourMarkerIds.length - 1; i++) {
                    const startId = tourMarkerIds[i];
                    const endId = tourMarkerIds[i + 1];
                    // Create a unique key for this pair
                    validPairs.add(`${startId}-${endId}`);
                }

                // Filter routes: only show routes that match consecutive markers in the tour
                visibleRoutes = routes.filter((route) => {
                    // Only show routes belonging to this tour
                    if (route.tour_id !== selectedTourId) return false;

                    // Check if this route matches a consecutive pair in the tour
                    const pairKey = `${route.start_marker.id}-${route.end_marker.id}`;
                    return validPairs.has(pairKey);
                });
            } else {
                // If tour not found or has no markers, show no routes
                visibleRoutes = [];
            }
        } else {
            // No tour selected, show only expanded routes
            visibleRoutes = routes.filter((route) =>
                expandedRoutes.has(route.id),
            );
        }

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

            // Check if this route is highlighted
            const isHighlighted = highlightedRouteId === route.id;

            // Get first symbol layer to insert route layers below labels
            const beforeLayerId = getFirstSymbolLayerId(mapInstance);

            // Add base layer for the route
            mapInstance.addLayer(
                {
                    id: layerId,
                    type: 'line',
                    source: layerId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': color,
                        'line-width': isHighlighted ? 5 : 3,
                        'line-opacity': isHighlighted ? 0.9 : 0.6,
                    },
                },
                beforeLayerId,
            );

            // Add hover highlight layer
            mapInstance.addLayer(
                {
                    id: `${layerId}-hover`,
                    type: 'line',
                    source: layerId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': color,
                        'line-width': 5,
                        'line-opacity': 0,
                    },
                },
                beforeLayerId,
            );

            // Add popup on click
            mapInstance.on('click', layerId, (e) => {
                // Prevent event from propagating to map click handler
                e.originalEvent.stopPropagation();

                // Call the onRouteClick callback via ref if provided
                if (onRouteClickRef.current) {
                    onRouteClickRef.current(route.id);
                }

                // Show popup with route information
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

            // Add hover interactions
            mapInstance.on('mouseenter', layerId, () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
                // Show the hover layer
                mapInstance.setPaintProperty(
                    `${layerId}-hover`,
                    'line-opacity',
                    0.8,
                );
            });

            mapInstance.on('mouseleave', layerId, () => {
                mapInstance.getCanvas().style.cursor = 'crosshair';
                // Hide the hover layer
                mapInstance.setPaintProperty(
                    `${layerId}-hover`,
                    'line-opacity',
                    0,
                );
            });

            routeLayerIdsRef.current.set(route.id, layerId);
        });

        // Ensure proper layer ordering after adding all routes
        ensureVectorLayerOrder(mapInstance);
    }, [
        routes,
        mapInstance,
        selectedTourId,
        tours,
        expandedRoutes,
        highlightedRouteId,
    ]);

    return {
        routes,
        setRoutes,
    } as const;
}
