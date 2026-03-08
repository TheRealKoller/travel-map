import mapboxgl from 'mapbox-gl';

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
 * Pure API response shape — no live Mapbox instances.
 * Use this type for data received from or sent to the backend.
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
