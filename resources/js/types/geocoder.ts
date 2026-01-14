/**
 * Type definitions for geocoder functionality
 */

/**
 * Result from Mapbox geocoder search
 */
export interface GeocodeResult {
    center: [number, number];
    place_name: string;
}

/**
 * Place type option for filtering searches
 */
export interface PlaceType {
    value: string;
    label: string;
}

/**
 * Search result from OpenStreetMap/Overpass API
 */
export interface SearchResult {
    lat: number;
    lon: number;
    name?: string;
    name_en?: string;
    name_int?: string;
    type?: string;
    website?: string;
    description?: string;
    fee?: string;
    opening_hours?: string;
    address?: {
        street?: string;
        housenumber?: string;
        postcode?: string;
        city?: string;
        country?: string;
    };
}
