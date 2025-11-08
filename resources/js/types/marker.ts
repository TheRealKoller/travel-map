import L from 'leaflet';

export enum MarkerType {
    Restaurant = 'restaurant',
    PointOfInterest = 'point of interest',
    Question = 'question',
    Tip = 'tip',
    Hotel = 'hotel',
}

export interface MarkerData {
    id: string;
    dbId?: number; // Database ID
    lat: number;
    lng: number;
    name: string;
    type: MarkerType;
    marker: L.Marker;
}
