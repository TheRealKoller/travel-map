export interface Trip {
    id: number;
    name: string;
    country: string | null;
    user_id: number;
    image_url: string | null;
    viewport_latitude: number | null;
    viewport_longitude: number | null;
    viewport_zoom: number | null;
    viewport_static_image_url: string | null;
    planned_start_year?: number | null;
    planned_start_month?: number | null;
    planned_start_day?: number | null;
    planned_end_year?: number | null;
    planned_end_month?: number | null;
    planned_end_day?: number | null;
    planned_duration_days?: number | null;
    created_at: string;
    updated_at: string;
}
