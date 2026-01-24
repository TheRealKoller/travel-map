import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { COUNTRIES } from '@/lib/countries';
import { type BreadcrumbItem, type PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef } from 'react';

interface Marker {
    id: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    notes: string | null;
    url: string | null;
    image_url: string | null;
    is_unesco: boolean;
}

interface Trip {
    id: number;
    name: string;
    country: string | null;
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
    markers: Marker[];
}

interface TripPreviewProps extends PageProps {
    trip: Trip;
    isCollaborator: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trip preview',
        href: '#',
    },
];

export default function TripPreview({
    trip,
    isCollaborator,
}: TripPreviewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);

    const handleJoinTrip = () => {
        // Extract token from current URL
        const pathParts = window.location.pathname.split('/');
        const token = pathParts[pathParts.length - 1];

        router.post(
            `/trips/preview/${token}/join`,
            {},
            {
                onSuccess: () => {
                    router.visit('/trips');
                },
                onError: (errors) => {
                    console.error('Failed to join trip:', errors);
                },
            },
        );
    };

    const getCountryName = (countryCode: string | null): string | null => {
        if (!countryCode) return null;
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return country?.name || null;
    };

    const formatPlannedPeriod = (
        year: number | null | undefined,
        month: number | null | undefined,
        day: number | null | undefined,
    ): string => {
        if (!year) return '';

        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];

        if (day && month) {
            return `${monthNames[month - 1]} ${day}, ${year}`;
        } else if (month) {
            return `${monthNames[month - 1]} ${year}`;
        } else {
            return year.toString();
        }
    };

    const addMarkersToMap = useCallback(
        (map: mapboxgl.Map) => {
            trip.markers.forEach((marker) => {
                // Create a custom marker element
                const el = document.createElement('div');
                el.className = 'custom-marker';
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.backgroundColor = '#3b82f6';
                el.style.borderRadius = '50%';
                el.style.border = '2px solid white';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                el.style.cursor = 'default';

                // Create and add the marker
                new mapboxgl.Marker(el)
                    .setLngLat([marker.longitude, marker.latitude])
                    .setPopup(
                        new mapboxgl.Popup({ offset: 25 }).setHTML(
                            `<h3 style="font-weight: bold; margin-bottom: 4px;">${marker.name}</h3>
                        <p style="color: #666; font-size: 12px;">${marker.type}</p>`,
                        ),
                    )
                    .addTo(map);
            });
        },
        [trip.markers],
    );

    useEffect(() => {
        if (!mapRef.current) return;

        // Get Mapbox token from environment variables
        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

        if (!mapboxToken) {
            console.error('Mapbox token not found');
            return;
        }

        mapboxgl.accessToken = mapboxToken;

        // Determine the initial center and zoom
        let center: [number, number];
        let zoom: number;

        if (
            trip.viewport_latitude &&
            trip.viewport_longitude &&
            trip.viewport_zoom
        ) {
            // Use trip's saved viewport
            center = [trip.viewport_longitude, trip.viewport_latitude];
            zoom = trip.viewport_zoom;
        } else if (trip.markers.length > 0) {
            // Calculate bounds from markers
            const bounds = new mapboxgl.LngLatBounds();
            trip.markers.forEach((marker) => {
                bounds.extend([marker.longitude, marker.latitude]);
            });

            // Create map first to fit bounds
            const map = new mapboxgl.Map({
                container: mapRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                bounds: bounds,
                fitBoundsOptions: { padding: 50 },
                interactive: true,
            });

            mapInstance.current = map;

            // Add markers after map loads
            map.on('load', () => {
                addMarkersToMap(map);
            });

            return () => {
                map.remove();
            };
        } else {
            // Default center (Europe)
            center = [13.4, 52.52];
            zoom = 4;
        }

        // Create the map
        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center,
            zoom: zoom,
            interactive: true,
        });

        mapInstance.current = map;

        // Add markers when map loads
        map.on('load', () => {
            addMarkersToMap(map);
        });

        return () => {
            map.remove();
        };
    }, [trip, addMarkersToMap]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${trip.name} - Preview`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold">
                                {trip.name}
                            </h1>
                            <p className="mt-2 text-muted-foreground">
                                {isCollaborator
                                    ? 'You have access to this trip'
                                    : 'Trip preview - View only'}
                            </p>
                        </div>
                        {!isCollaborator && (
                            <Button
                                onClick={handleJoinTrip}
                                size="lg"
                                data-testid="join-trip-button"
                            >
                                Join trip
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Trip Information Card */}
                    <div className="flex flex-col overflow-hidden rounded-xl border-2 border-sidebar-border bg-card shadow-md">
                        {/* Cover Image */}
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                            {trip.image_url ? (
                                <img
                                    src={trip.image_url}
                                    alt={trip.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center">
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                </div>
                            )}
                        </div>

                        {/* Trip Details */}
                        <div className="flex flex-1 flex-col gap-3 p-6">
                            <h2 className="text-2xl font-semibold">
                                {trip.name}
                            </h2>
                            {trip.country && (
                                <p className="text-muted-foreground">
                                    {getCountryName(trip.country)}
                                </p>
                            )}

                            {(trip.planned_start_year ||
                                trip.planned_end_year ||
                                trip.planned_duration_days) && (
                                <div className="mt-2 space-y-2 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                                    {(trip.planned_start_year ||
                                        trip.planned_end_year) && (
                                        <div>
                                            <span className="font-medium">
                                                Period:{' '}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {formatPlannedPeriod(
                                                    trip.planned_start_year,
                                                    trip.planned_start_month,
                                                    trip.planned_start_day,
                                                )}
                                                {trip.planned_end_year && (
                                                    <>
                                                        {' → '}
                                                        {formatPlannedPeriod(
                                                            trip.planned_end_year,
                                                            trip.planned_end_month,
                                                            trip.planned_end_day,
                                                        )}
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {trip.planned_duration_days && (
                                        <div>
                                            <span className="font-medium">
                                                Duration:{' '}
                                            </span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {trip.planned_duration_days}{' '}
                                                {trip.planned_duration_days ===
                                                1
                                                    ? 'day'
                                                    : 'days'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-2">
                                <span className="font-medium">Markers: </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {trip.markers.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Map Preview */}
                    <div className="relative flex flex-col overflow-hidden rounded-xl border-2 border-sidebar-border bg-card shadow-md">
                        <div className="border-b border-sidebar-border p-4">
                            <h2 className="text-lg font-semibold">
                                Map preview
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {trip.markers.length === 0
                                    ? 'No markers in this trip'
                                    : `Showing ${trip.markers.length} ${trip.markers.length === 1 ? 'marker' : 'markers'}`}
                            </p>
                        </div>
                        <div
                            ref={mapRef}
                            className="h-[600px] w-full flex-1"
                            data-testid="trip-preview-map"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
