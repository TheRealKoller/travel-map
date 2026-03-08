import type mapboxgl from 'mapbox-gl';

export enum MarkerType {
    Restaurant = 'restaurant',
    PointOfInterest = 'point of interest',
    Question = 'question',
    Tip = 'tip',
    Hotel = 'hotel',
    Museum = 'museum',
    Ruin = 'ruin',
    TempleChurch = 'temple/church',
    FestivalParty = 'festival/party',
    Leisure = 'leisure',
    Sightseeing = 'sightseeing',
    NaturalAttraction = 'natural attraction',
    City = 'city',
    Village = 'village',
    Region = 'region',
    Haltestelle = 'haltestelle',
}

/**
 * Frontend-normalized marker data shape (camelCase fields), without a live Mapbox instance.
 * Use this type for marker data after mapping/parsing backend responses or before preparing
 * payloads to send, not as the raw backend DTO shape.
 */
export interface MarkerApiData {
    id: string; // UUID - same as database ID
    lat: number;
    lng: number;
    name: string;
    type: MarkerType;
    notes: string;
    url: string;
    imageUrl: string | null;
    isUnesco: boolean;
    aiEnriched: boolean;
    estimatedHours: number | null;
    isSaved: boolean; // Track if marker is persisted in database
    position?: number; // Position in tour (when part of a tour)
}

/**
 * Runtime marker state — extends the API shape with a live Mapbox marker instance.
 * Use this type within the map UI where the Mapbox instance is available.
 */
export interface MarkerData extends MarkerApiData {
    marker: mapboxgl.Marker;
}
