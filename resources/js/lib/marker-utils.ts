/**
 * Utility functions for marker management and display
 */

import { MarkerType } from '@/types/marker';

/**
 * Get FontAwesome icon name based on marker type
 * @param type - The marker type
 * @returns FontAwesome icon class name (e.g., 'fa-utensils')
 */
export const getIconForType = (type: MarkerType): string => {
    switch (type) {
        case MarkerType.Restaurant:
            return 'fa-utensils';
        case MarkerType.Hotel:
            return 'fa-bed';
        case MarkerType.Question:
            return 'fa-question';
        case MarkerType.Tip:
            return 'fa-lightbulb';
        case MarkerType.PointOfInterest:
            return 'fa-map-pin';
        case MarkerType.Museum:
            return 'fa-landmark';
        case MarkerType.Ruin:
            return 'fa-monument';
        case MarkerType.TempleChurch:
            return 'fa-church';
        case MarkerType.FestivalParty:
            return 'fa-champagne-glasses';
        case MarkerType.Leisure:
            return 'fa-bicycle';
        case MarkerType.Sightseeing:
            return 'fa-camera';
        case MarkerType.NaturalAttraction:
            return 'fa-mountain';
        case MarkerType.City:
            return 'fa-city';
        case MarkerType.Village:
            return 'fa-home';
        case MarkerType.Region:
            return 'fa-map';
        default:
            return 'fa-map-pin';
    }
};

/**
 * Get CSS class for marker type styling
 * @param type - The marker type
 * @returns CSS class name for the marker type
 */
export const getMarkerTypeClass = (type: MarkerType): string => {
    const typeMap: Record<MarkerType, string> = {
        [MarkerType.Restaurant]: 'mapbox-marker--restaurant',
        [MarkerType.Hotel]: 'mapbox-marker--hotel',
        [MarkerType.Question]: 'mapbox-marker--question',
        [MarkerType.Tip]: 'mapbox-marker--tip',
        [MarkerType.PointOfInterest]: 'mapbox-marker--point-of-interest',
        [MarkerType.Museum]: 'mapbox-marker--museum',
        [MarkerType.Ruin]: 'mapbox-marker--ruin',
        [MarkerType.TempleChurch]: 'mapbox-marker--temple-church',
        [MarkerType.FestivalParty]: 'mapbox-marker--festival-party',
        [MarkerType.Leisure]: 'mapbox-marker--leisure',
        [MarkerType.Sightseeing]: 'mapbox-marker--sightseeing',
        [MarkerType.NaturalAttraction]: 'mapbox-marker--natural-attraction',
        [MarkerType.City]: 'mapbox-marker--city',
        [MarkerType.Village]: 'mapbox-marker--village',
        [MarkerType.Region]: 'mapbox-marker--region',
    };
    return typeMap[type] || 'mapbox-marker--point-of-interest';
};

/**
 * Create a custom marker element for Mapbox GL
 * @param type - The marker type
 * @param isHighlighted - Whether the marker should be highlighted
 * @returns HTML div element configured as a marker
 */
export const createMarkerElement = (
    type: MarkerType,
    isHighlighted = false,
): HTMLDivElement => {
    const el = document.createElement('div');
    const typeClass = getMarkerTypeClass(type);
    const highlightClass = isHighlighted ? 'mapbox-marker--highlighted' : '';
    const icon = getIconForType(type);

    el.innerHTML = `
        <div class="mapbox-marker ${typeClass} ${highlightClass}">
            <div class="mapbox-marker__icon">
                <i class="fa ${icon}"></i>
            </div>
        </div>
    `;

    return el;
};

/**
 * Map OpenStreetMap place type to MarkerType
 * @param osmType - The OSM place type (e.g., 'restaurant', 'hotel')
 * @returns Corresponding MarkerType
 */
export const getMarkerTypeFromOSMType = (osmType?: string): MarkerType => {
    if (!osmType) {
        return MarkerType.PointOfInterest;
    }

    // Convert to lowercase for case-insensitive matching
    const type = osmType.toLowerCase();

    // Restaurant category
    if (
        type === 'restaurant' ||
        type === 'cafe' ||
        type === 'bar' ||
        type === 'pub' ||
        type === 'fast_food'
    ) {
        return MarkerType.Restaurant;
    }

    // Hotel category
    if (
        type === 'hotel' ||
        type === 'guest_house' ||
        type === 'hostel' ||
        type === 'motel'
    ) {
        return MarkerType.Hotel;
    }

    // Museum category
    if (type === 'museum' || type === 'gallery') {
        return MarkerType.Museum;
    }

    // Ruin category
    if (type === 'ruins' || type === 'archaeological_site') {
        return MarkerType.Ruin;
    }

    // Temple/Church category
    if (
        type === 'place_of_worship' ||
        type === 'church' ||
        type === 'temple' ||
        type === 'mosque' ||
        type === 'shrine'
    ) {
        return MarkerType.TempleChurch;
    }

    // Festival/Party category
    if (
        type === 'nightclub' ||
        type === 'theatre' ||
        type === 'cinema' ||
        type === 'arts_centre'
    ) {
        return MarkerType.FestivalParty;
    }

    // Leisure category
    if (
        type === 'park' ||
        type === 'garden' ||
        type === 'playground' ||
        type === 'sports_centre' ||
        type === 'swimming_pool' ||
        type === 'beach' ||
        type === 'marina'
    ) {
        return MarkerType.Leisure;
    }

    // Sightseeing category
    if (
        type === 'attraction' ||
        type === 'viewpoint' ||
        type === 'monument' ||
        type === 'memorial' ||
        type === 'castle' ||
        type === 'artwork' ||
        type === 'zoo' ||
        type === 'theme_park'
    ) {
        return MarkerType.Sightseeing;
    }

    // Default to Point of Interest for anything else
    return MarkerType.PointOfInterest;
};

/**
 * Map Mapbox POI class to MarkerType
 * Uses the same logic as OSM type mapping
 * @param mapboxClass - The Mapbox POI class
 * @returns Corresponding MarkerType
 */
export const getMarkerTypeFromMapboxClass = (
    mapboxClass?: string,
): MarkerType => {
    if (!mapboxClass) {
        return MarkerType.PointOfInterest;
    }

    // Use the same logic as OSM types
    return getMarkerTypeFromOSMType(mapboxClass);
};
