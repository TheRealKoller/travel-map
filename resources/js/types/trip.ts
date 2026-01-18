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
    created_at: string;
    updated_at: string;
}
