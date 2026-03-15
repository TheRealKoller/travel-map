export interface TripOwner {
    id: number;
    name: string;
}

export interface Collaborator {
    id: number;
    name: string;
    email: string;
    collaboration_role: 'owner' | 'editor';
    created_at: string;
}

export interface Trip {
    id: number;
    name: string;
    country: string | null;
    user_id: number;
    owner?: TripOwner;
    image_url: string | null;
    viewport_latitude: number | null;
    viewport_longitude: number | null;
    viewport_zoom: number | null;
    viewport_static_image_url: string | null;
    invitation_token: string | null;
    planned_start_year?: number | null;
    planned_start_month?: number | null;
    planned_start_day?: number | null;
    planned_end_year?: number | null;
    planned_end_month?: number | null;
    planned_end_day?: number | null;
    planned_duration_days?: number | null;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}
