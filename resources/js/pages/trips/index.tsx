import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { useTrips } from '@/hooks/use-trips';
import AppLayout from '@/layouts/app-layout';
import { COUNTRIES } from '@/lib/countries';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Select trip',
        href: '/trips',
    },
];

export default function TripsIndex() {
    const { trips } = useTrips();

    const handleSelectTrip = (tripId: number) => {
        router.visit(`/map/${tripId}`);
    };

    const handleCreateTrip = () => {
        router.visit('/trips/create');
    };

    const getCountryName = (countryCode: string | null): string | null => {
        if (!countryCode) return null;
        const country = COUNTRIES.find((c) => c.code === countryCode);
        return country?.name || null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Select trip" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-semibold">Select a trip</h1>
                    <p className="mt-2 text-muted-foreground">
                        Choose a trip to view or create a new one
                    </p>
                </div>

                <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {trips.map((trip) => (
                        <button
                            key={trip.id}
                            data-testid={`trip-tile-${trip.id}`}
                            onClick={() => handleSelectTrip(trip.id)}
                            className="group relative flex flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-card transition-all hover:border-sidebar-border hover:shadow-lg dark:border-sidebar-border"
                        >
                            {/* Cover Image */}
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                {trip.image_url ? (
                                    <img
                                        src={trip.image_url}
                                        alt={trip.name}
                                        className="size-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center">
                                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                    </div>
                                )}
                            </div>

                            {/* Trip Info */}
                            <div className="flex flex-1 flex-col gap-2 p-4">
                                <h2
                                    className="text-lg font-semibold"
                                    data-testid={`trip-name-${trip.id}`}
                                >
                                    {trip.name}
                                </h2>
                                {trip.country && (
                                    <p
                                        className="text-sm text-muted-foreground"
                                        data-testid={`trip-country-${trip.id}`}
                                    >
                                        {getCountryName(trip.country)}
                                    </p>
                                )}
                            </div>

                            {/* Map Viewport Placeholder */}
                            <div className="relative h-24 w-full border-t border-sidebar-border/70 bg-muted/50 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                        Map preview
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Create New Trip Tile */}
                    <button
                        data-testid="create-trip-tile"
                        onClick={handleCreateTrip}
                        className="group relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-sidebar-border/70 bg-card/50 transition-all hover:border-sidebar-border hover:bg-card hover:shadow-lg dark:border-sidebar-border"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                                <Plus className="size-10" />
                            </div>
                            <span className="text-lg font-medium">
                                Create new trip
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
