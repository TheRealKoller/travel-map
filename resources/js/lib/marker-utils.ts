/**
 * Utility functions for marker management and display
 */

import { MarkerType } from '@/types/marker';

/**
 * Get SVG string for marker type icon (Lucide icons)
 * @param type - The marker type
 * @returns SVG string for the icon
 */
export const getIconSvgForType = (type: MarkerType): string => {
    const svgIcons: Record<MarkerType, string> = {
        [MarkerType.Restaurant]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
        [MarkerType.Hotel]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 22v-6.57"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg>',
        [MarkerType.Question]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
        [MarkerType.Tip]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
        [MarkerType.PointOfInterest]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
        [MarkerType.Museum]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>',
        [MarkerType.Ruin]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
        [MarkerType.TempleChurch]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/></svg>',
        [MarkerType.FestivalParty]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>',
        [MarkerType.Leisure]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 22V5l5-3 5 3v17l-5-3z"/><path d="M7 8h10"/></svg>',
        [MarkerType.Sightseeing]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
        [MarkerType.NaturalAttraction]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
        [MarkerType.City]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>',
        [MarkerType.Village]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
        [MarkerType.Region]: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>',
    };
    return svgIcons[type] || svgIcons[MarkerType.PointOfInterest];
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
 * @param isTemporary - Whether this is a temporary (unsaved) marker with highest z-index
 * @returns HTML div element configured as a marker
 * @note All variables (typeClass, highlightClass, temporaryClass, iconSvg) are derived from controlled enums
 *       and internal functions, ensuring no XSS vulnerability from user input
 */
export const createMarkerElement = (
    type: MarkerType,
    isHighlighted = false,
    isTemporary = false,
): HTMLDivElement => {
    const el = document.createElement('div');
    const typeClass = getMarkerTypeClass(type);
    const highlightClass = isHighlighted ? 'mapbox-marker--highlighted' : '';
    const temporaryClass = isTemporary ? 'mapbox-marker--temporary' : '';
    const iconSvg = getIconSvgForType(type);

    el.innerHTML = `
        <div class="mapbox-marker ${typeClass} ${highlightClass} ${temporaryClass}">
            <div class="mapbox-marker__icon">
                ${iconSvg}
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
