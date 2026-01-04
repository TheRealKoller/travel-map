import { MarkerData } from './marker';

export interface Tour {
    id: number;
    name: string;
    trip_id: number;
    parent_tour_id: number | null;
    position: number;
    created_at: string;
    updated_at: string;
    markers?: MarkerData[];
    sub_tours?: Tour[];
}
