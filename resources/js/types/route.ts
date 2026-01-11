export type TransportMode =
    | 'driving-car'
    | 'cycling-regular'
    | 'foot-walking'
    | 'public-transport';

export interface RouteMarker {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

export interface Route {
    id: number;
    trip_id: number;
    start_marker: RouteMarker;
    end_marker: RouteMarker;
    transport_mode: {
        value: TransportMode;
        label: string;
    };
    distance: {
        meters: number;
        km: number;
    };
    duration: {
        seconds: number;
        minutes: number;
    };
    geometry: [number, number][]; // GeoJSON coordinates [lng, lat]
    warning: string | null;
    created_at: string;
    updated_at: string;
}
