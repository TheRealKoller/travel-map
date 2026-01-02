import L from 'leaflet';

export enum MarkerType {
    Restaurant = 'restaurant',
    PointOfInterest = 'point of interest',
    Question = 'question',
    Tip = 'tip',
    Hotel = 'hotel',
    Museum = 'museum',
    Ruin = 'ruin',
    UnescoWorldHeritage = 'unesco world heritage',
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
    marker: L.Marker;
    isSaved: boolean; // Track if marker is persisted in database
}
