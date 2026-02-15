/**
 * Utility functions for route calculations
 */

import { Route } from '@/types/route';
import { Tour } from '@/types/tour';

/**
 * Calculate average speed from distance and duration
 */
export function calculateAverageSpeed(
    distanceKm: number,
    durationMinutes: number,
): string {
    // Validate inputs
    if (durationMinutes <= 0 || distanceKm < 0) return '0 km/h';
    const durationHours = durationMinutes / 60;
    const speed = distanceKm / durationHours;
    return `${speed.toFixed(1)} km/h`;
}

/**
 * Get filtered routes based on tour selection
 * Only shows routes between consecutive markers in the tour
 */
export function getFilteredRoutes(
    routes: Route[],
    tourId: number | null | undefined,
    tours: Tour[],
): Route[] {
    if (!tourId) return routes;

    const tour = tours.find((t) => t.id === tourId);
    if (!tour || !tour.markers) return routes;

    // Get marker IDs in tour order
    const tourMarkerIds = tour.markers.map((m) => m.id);

    return routes.filter((route) => {
        const startIndex = tourMarkerIds.indexOf(route.start_marker.id);
        const endIndex = tourMarkerIds.indexOf(route.end_marker.id);

        // Both markers must be in the tour
        if (startIndex === -1 || endIndex === -1) return false;

        // Only show routes between consecutive markers
        return Math.abs(endIndex - startIndex) === 1;
    });
}
