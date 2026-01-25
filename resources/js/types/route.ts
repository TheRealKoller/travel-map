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

export interface TransitStop {
    name: string | null;
    location: {
        latLng: {
            latitude: number;
            longitude: number;
        };
    } | null;
}

export interface TransitLine {
    name: string | null;
    short_name: string | null;
    color: string | null;
    vehicle_type: string | null;
}

export interface TransitStepDetails {
    departure_stop: TransitStop;
    arrival_stop: TransitStop;
    line: TransitLine;
    departure_time: number | null;
    arrival_time: number | null;
    num_stops: number;
    headsign: string | null;
}

export interface TransitStep {
    travel_mode: string;
    distance: number;
    duration: number;
    transit?: TransitStepDetails;
}

export interface TransitDetails {
    steps: TransitStep[];
    departure_time: string | null;
    arrival_time: string | null;
    start_address: string | null;
    end_address: string | null;
}

export interface AlternativeRoute {
    distance: number;
    duration: number;
    num_transfers: number;
}

export interface Route {
    id: number;
    trip_id: number;
    tour_id: number | null;
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
    transit_details: TransitDetails | null;
    alternatives: AlternativeRoute[] | null;
    warning: string | null;
    created_at: string;
    updated_at: string;
}
