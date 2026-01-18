import { Trip } from '@/types/trip';

/**
 * Calculate a bounding box from a center point and zoom level
 * Returns [west, south, east, north] format for Mapbox, or undefined if invalid
 */
export function calculateBoundingBoxFromViewport(
    latitude: number,
    longitude: number,
    zoom: number,
): [number, number, number, number] | undefined {
    // Validate inputs - must be finite numbers
    if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(zoom)) {
        return undefined;
    }

    // Validate latitude range (-90 to 90)
    if (latitude < -90 || latitude > 90) {
        return undefined;
    }

    // Validate longitude range (-180 to 180)
    if (longitude < -180 || longitude > 180) {
        return undefined;
    }

    // Validate zoom level (0 to 22 for Mapbox)
    if (zoom < 0 || zoom > 22) {
        return undefined;
    }

    // Approximate degrees per pixel at different zoom levels
    const metersPerPixel =
        (156543.03392 * Math.cos((latitude * Math.PI) / 180)) /
        Math.pow(2, zoom);

    // Assume a typical viewport size (can be adjusted)
    const viewportWidthMeters = metersPerPixel * 800; // ~800px width
    const viewportHeightMeters = metersPerPixel * 600; // ~600px height

    // Convert meters to degrees (approximate)
    const latDelta = viewportHeightMeters / 111320 / 2; // 1 degree latitude ≈ 111.32km
    const cosLat = Math.cos((latitude * Math.PI) / 180);
    
    // Avoid division by zero at poles
    if (Math.abs(cosLat) < 0.0001) {
        return undefined;
    }
    
    const lngDelta = viewportWidthMeters / (111320 * cosLat) / 2;

    const west = longitude - lngDelta;
    const south = latitude - latDelta;
    const east = longitude + lngDelta;
    const north = latitude + latDelta;

    // Validate results
    if (
        !isFinite(west) ||
        !isFinite(south) ||
        !isFinite(east) ||
        !isFinite(north)
    ) {
        return undefined;
    }

    return [west, south, east, north];
}

/**
 * Get bounding box from a Trip's viewport settings
 * Returns undefined if viewport is not set
 */
export function getBoundingBoxFromTrip(
    trip: Trip | null | undefined,
): [number, number, number, number] | undefined {
    if (
        !trip ||
        trip.viewport_latitude === null ||
        trip.viewport_longitude === null ||
        trip.viewport_zoom === null
    ) {
        return undefined;
    }

    return calculateBoundingBoxFromViewport(
        trip.viewport_latitude,
        trip.viewport_longitude,
        trip.viewport_zoom,
    );
}
