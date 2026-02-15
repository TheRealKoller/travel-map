/**
 * Marker type constants and utilities
 */

import { MarkerType } from '@/types/marker';

/**
 * Human-readable labels for marker types
 */
export const MARKER_TYPE_LABELS: Record<MarkerType, string> = {
    [MarkerType.Restaurant]: 'Restaurant',
    [MarkerType.PointOfInterest]: 'Point of Interest',
    [MarkerType.Question]: 'Question',
    [MarkerType.Tip]: 'Tip',
    [MarkerType.Hotel]: 'Hotel',
    [MarkerType.Museum]: 'Museum',
    [MarkerType.Ruin]: 'Ruin',
    [MarkerType.TempleChurch]: 'Temple/Church',
    [MarkerType.FestivalParty]: 'Festival/Party',
    [MarkerType.Leisure]: 'Leisure',
    [MarkerType.Sightseeing]: 'Sightseeing',
    [MarkerType.NaturalAttraction]: 'Natural Attraction',
    [MarkerType.City]: 'City',
    [MarkerType.Village]: 'Village',
    [MarkerType.Region]: 'Region',
    [MarkerType.Haltestelle]: 'Haltestelle',
};

/**
 * Mapping from API type strings to MarkerType enum values
 * Used when processing enrichment data from backend
 */
export const API_TYPE_TO_MARKER_TYPE: Record<string, MarkerType> = {
    restaurant: MarkerType.Restaurant,
    point_of_interest: MarkerType.PointOfInterest,
    hotel: MarkerType.Hotel,
    museum: MarkerType.Museum,
    ruin: MarkerType.Ruin,
    temple_church: MarkerType.TempleChurch,
    sightseeing: MarkerType.Sightseeing,
    natural_attraction: MarkerType.NaturalAttraction,
    city: MarkerType.City,
    village: MarkerType.Village,
    region: MarkerType.Region,
    question: MarkerType.Question,
    tip: MarkerType.Tip,
    festival_party: MarkerType.FestivalParty,
    leisure: MarkerType.Leisure,
    haltestelle: MarkerType.Haltestelle,
};

/**
 * Get human-readable label for a marker type
 */
export function getMarkerTypeLabel(type: MarkerType): string {
    return MARKER_TYPE_LABELS[type] || type;
}

/**
 * Get all marker type options for form selects
 */
export function getMarkerTypeOptions(): Array<{
    value: MarkerType;
    label: string;
}> {
    return Object.entries(MARKER_TYPE_LABELS).map(([value, label]) => ({
        value: value as MarkerType,
        label,
    }));
}
