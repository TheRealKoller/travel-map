import { MarkerData } from './marker';

export interface Tour {
    id: number;
    name: string;
    trip_id: number;
    created_at: string;
    updated_at: string;
    markers?: MarkerData[];
}
