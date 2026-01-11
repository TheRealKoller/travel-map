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
}

export interface MarkerData {
    id: string; // UUID - same as database ID
    lat: number;
    lng: number;
    name: string;
    type: MarkerType;
    notes: string;
    url: string;
    isUnesco: boolean;
    marker: mapboxgl.Marker;
    isSaved: boolean; // Track if marker is persisted in database
    position?: number; // Position in tour (when part of a tour)
}
