import InvitationDialog from '@/components/invitation-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { useTrips } from '@/hooks/use-trips';
import AppLayout from '@/layouts/app-layout';
import { COUNTRIES } from '@/lib/countries';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    FileDown,
    FileText,
    Minimize2,
    MoreVertical,
    Pencil,
    Plus,
    Sparkles,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Select trip',
        href: '/trips',
    },
];

export default function TripsIndex() {
    const { trips } = useTrips();
    const { t } = useTranslation();
    const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
    const [selectedTripForInvitation, setSelectedTripForInvitation] = useState<{
        id: number;
        name: string;
    } | null>(null);

    const handleSelectTrip = (tripId: number) => {
        router.visit(`/map/${tripId}`);
    };

    const handleEditTrip = (e: React.MouseEvent, tripId: number) => {
        e.stopPropagation();
        router.visit(`/trips/${tripId}/edit`);
    };

    const handleExportPdf = (
        e: React.MouseEvent,
        tripId: number,
        template: string = 'modern',
    ) => {
        e.stopPropagation();
        // Open PDF in a new tab with selected template
        window.open(
            `/trips/${tripId}/export-pdf?template=${template}`,
            '_blank',
        );
    };

    const handleInvite = (
        e: React.MouseEvent,
        tripId: number,
        tripName: string,
    ) => {
        e.stopPropagation();
        setSelectedTripForInvitation({ id: tripId, name: tripName });
        setInvitationDialogOpen(true);
    };

    const handleCreateTrip = () => {
        router.visit('/trips/create');
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
                        <div
                            key={trip.id}
                            className="group relative flex flex-col overflow-hidden rounded-xl border-2 border-sidebar-border bg-card shadow-md transition-all hover:border-sidebar-border hover:shadow-xl dark:border-sidebar-border"
                        >
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            data-testid={`trip-actions-${trip.id}`}
                                            className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-muted-foreground backdrop-blur-sm transition-all hover:bg-background hover:text-foreground"
                                            aria-label="Trip actions"
                                        >
                                            <MoreVertical className="size-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            data-testid={`invite-button-${trip.id}`}
                                            onClick={(e) =>
                                                handleInvite(
                                                    e,
                                                    trip.id,
                                                    trip.name,
                                                )
                                            }
                                        >
                                            <UserPlus className="mr-2 size-4" />
                                            {t('trips.invite_users')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger
                                                data-testid={`export-pdf-button-${trip.id}`}
                                            >
                                                <FileDown className="mr-2 size-4" />
                                                {t('trips.export_pdf')}
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent>
                                                <DropdownMenuItem
                                                    data-testid={`export-pdf-modern-${trip.id}`}
                                                    onClick={(e) =>
                                                        handleExportPdf(
                                                            e,
                                                            trip.id,
                                                            'modern',
                                                        )
                                                    }
                                                >
                                                    <Sparkles className="mr-2 size-4" />
                                                    Modern Travel Brochure
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    data-testid={`export-pdf-professional-${trip.id}`}
                                                    onClick={(e) =>
                                                        handleExportPdf(
                                                            e,
                                                            trip.id,
                                                            'professional',
                                                        )
                                                    }
                                                >
                                                    <FileText className="mr-2 size-4" />
                                                    Professional Document
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    data-testid={`export-pdf-minimalist-${trip.id}`}
                                                    onClick={(e) =>
                                                        handleExportPdf(
                                                            e,
                                                            trip.id,
                                                            'minimalist',
                                                        )
                                                    }
                                                >
                                                    <Minimize2 className="mr-2 size-4" />
                                                    Minimalist Elegant
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    data-testid={`export-pdf-compact-${trip.id}`}
                                                    onClick={(e) =>
                                                        handleExportPdf(
                                                            e,
                                                            trip.id,
                                                            'compact',
                                                        )
                                                    }
                                                >
                                                    <FileDown className="mr-2 size-4" />
                                                    Compact Overview
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuItem
                                            data-testid={`edit-trip-button-${trip.id}`}
                                            onClick={(e) =>
                                                handleEditTrip(e, trip.id)
                                            }
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            {t('trips.edit_trip')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Cover Image */}
                            <button
                                data-testid={`trip-tile-${trip.id}`}
                                onClick={() => handleSelectTrip(trip.id)}
                                className="flex flex-1 flex-col"
                            >
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
                                    {(trip.planned_start_year ||
                                        trip.planned_end_year ||
                                        trip.planned_duration_days) && (
                                        <div className="mt-2 space-y-1 rounded-md border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                                            {(trip.planned_start_year ||
                                                trip.planned_end_year) && (
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">
                                                        Period:{' '}
                                                    </span>
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
                                                </div>
                                            )}
                                            {trip.planned_duration_days && (
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    <span className="font-medium">
                                                        Duration:{' '}
                                                    </span>
                                                    {trip.planned_duration_days}{' '}
                                                    {trip.planned_duration_days ===
                                                    1
                                                        ? 'day'
                                                        : 'days'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Map Viewport Placeholder */}
                                {trip.viewport_static_image_url ? (
                                    <div className="relative aspect-[4/3] w-full border-t border-sidebar-border/70 bg-muted/50 dark:border-sidebar-border">
                                        <img
                                            src={trip.viewport_static_image_url}
                                            alt="Map preview"
                                            className="size-full object-cover"
                                        />
                                    </div>
                                ) : null}
                            </button>
                        </div>
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

                {/* Invitation Dialog */}
                {selectedTripForInvitation && (
                    <InvitationDialog
                        tripId={selectedTripForInvitation.id}
                        tripName={selectedTripForInvitation.name}
                        isOpen={invitationDialogOpen}
                        onClose={() => setInvitationDialogOpen(false)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
