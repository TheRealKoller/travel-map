import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';

interface UseTourLinesOptions {
    mapInstance: mapboxgl.Map | null;
    selectedTourId: number | null;
    tours: Tour[];
    markers: MarkerData[];
}

/**
 * Create a curved path between two points using a quadratic Bezier curve
 * The curve's control point is offset perpendicular to the line between start and end
 */
function createCurvedLine(
    start: [number, number],
    end: [number, number],
): [number, number][] {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;

    // Calculate the midpoint
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;

    // Calculate the perpendicular offset for the curve
    const dx = endLng - startLng;
    const dy = endLat - startLat;

    // Create a curve offset (perpendicular to the line)
    // Using a smaller offset for subtler curves
    const offsetRatio = 0.15; // 15% of distance
    const offsetLng = -dy * offsetRatio;
    const offsetLat = dx * offsetRatio;

    // Control point for the quadratic bezier curve
    const controlLng = midLng + offsetLng;
    const controlLat = midLat + offsetLat;

    // Generate points along the bezier curve
    const points: [number, number][] = [];
    const segments = 20; // Number of segments for smooth curve

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const t2 = t * t;
        const mt = 1 - t;
        const mt2 = mt * mt;

        // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
        const lng = mt2 * startLng + 2 * mt * t * controlLng + t2 * endLng;
        const lat = mt2 * startLat + 2 * mt * t * controlLat + t2 * endLat;

        points.push([lng, lat]);
    }

    return points;
}

export function useTourLines({
    mapInstance,
    selectedTourId,
    tours,
    markers,
}: UseTourLinesOptions) {
    const lineLayerIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!mapInstance) return;

        // Clean up existing tour line layers
        // Note: Mapbox GL JS automatically removes event listeners when layers are removed
        lineLayerIdsRef.current.forEach((layerId) => {
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
        lineLayerIdsRef.current.clear();

        // If no tour is selected, don't render any lines
        if (selectedTourId === null) return;

        // Find the selected tour
        const selectedTour = tours.find((t) => t.id === selectedTourId);
        if (!selectedTour || !selectedTour.markers) return;

        // Get the tour markers in order, with their full data from the markers array
        const tourMarkers = selectedTour.markers
            .map((tourMarker) =>
                markers.find((marker) => marker.id === tourMarker.id),
            )
            .filter((marker): marker is MarkerData => marker !== undefined);

        // Draw lines between consecutive markers
        for (let i = 0; i < tourMarkers.length - 1; i++) {
            const startMarker = tourMarkers[i];
            const endMarker = tourMarkers[i + 1];

            const lineId = `tour-line-${selectedTourId}-${i}`;

            // Create curved line coordinates
            const curvedCoordinates = createCurvedLine(
                [startMarker.lng, startMarker.lat],
                [endMarker.lng, endMarker.lat],
            );

            // Add source for the line
            mapInstance.addSource(lineId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {
                        startName: startMarker.name,
                        endName: endMarker.name,
                        tourId: selectedTourId,
                        segmentIndex: i,
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: curvedCoordinates,
                    },
                },
            });

            // Add base line layer (always visible)
            mapInstance.addLayer({
                id: lineId,
                type: 'line',
                source: lineId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#2563eb', // Blue color
                    'line-width': 3,
                    'line-opacity': 0.6,
                },
            });

            // Add hover highlight layer (only visible on hover)
            mapInstance.addLayer({
                id: `${lineId}-hover`,
                type: 'line',
                source: lineId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': '#1d4ed8', // Darker blue for hover
                    'line-width': 5,
                    'line-opacity': 0,
                },
            });

            // Add hover interactions
            mapInstance.on('mouseenter', lineId, () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
                // Show the hover layer
                mapInstance.setPaintProperty(
                    `${lineId}-hover`,
                    'line-opacity',
                    0.8,
                );
            });

            mapInstance.on('mouseleave', lineId, () => {
                mapInstance.getCanvas().style.cursor = 'crosshair';
                // Hide the hover layer
                mapInstance.setPaintProperty(
                    `${lineId}-hover`,
                    'line-opacity',
                    0,
                );
            });

            lineLayerIdsRef.current.add(lineId);
        }
    }, [mapInstance, selectedTourId, tours, markers]);

    return null;
}
