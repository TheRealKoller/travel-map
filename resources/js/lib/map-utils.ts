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
    console.log('[calculateBoundingBoxFromViewport] Input:', { latitude, longitude, zoom });
    
    // Convert to numbers to handle string inputs from database
    latitude = Number(latitude);
    longitude = Number(longitude);
    zoom = Number(zoom);
    
    console.log('[calculateBoundingBoxFromViewport] After Number conversion:', { latitude, longitude, zoom });
    
    // Validate inputs - must be finite numbers
    if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(zoom)) {
        console.log('[calculateBoundingBoxFromViewport] Invalid: inputs not finite');
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
        console.log('[calculateBoundingBoxFromViewport] Invalid: bbox values not finite', { west, south, east, north });
        return undefined;
    }

    const bbox: [number, number, number, number] = [west, south, east, north];
    console.log('[calculateBoundingBoxFromViewport] Success:', bbox);
    return bbox;
}

/**
 * Get bounding box from a Trip's viewport settings
 * Returns undefined if viewport is not set
 */
export function getBoundingBoxFromTrip(
    trip: Trip | null | undefined,
): [number, number, number, number] | undefined {
    console.log('[getBoundingBoxFromTrip] Trip:', trip);
    
    if (
        !trip ||
        trip.viewport_latitude === null ||
        trip.viewport_longitude === null ||
        trip.viewport_zoom === null
    ) {
        console.log('[getBoundingBoxFromTrip] Trip viewport not set or null');
        return undefined;
    }

    console.log('[getBoundingBoxFromTrip] Viewport values:', {
        latitude: trip.viewport_latitude,
        longitude: trip.viewport_longitude,
        zoom: trip.viewport_zoom,
        types: {
            latitude: typeof trip.viewport_latitude,
            longitude: typeof trip.viewport_longitude,
            zoom: typeof trip.viewport_zoom,
        }
    });

    const bbox = calculateBoundingBoxFromViewport(
        trip.viewport_latitude,
        trip.viewport_longitude,
        trip.viewport_zoom,
    );
    
    console.log('[getBoundingBoxFromTrip] Result bbox:', bbox);
    return bbox;
}
