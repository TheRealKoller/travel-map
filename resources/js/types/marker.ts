import L from 'leaflet';

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
    marker: L.Marker;
    isSaved: boolean; // Track if marker is persisted in database
}
