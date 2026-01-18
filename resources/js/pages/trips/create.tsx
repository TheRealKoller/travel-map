import AlertError from '@/components/alert-error';
import DeleteTripDialog from '@/components/delete-trip-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ViewportMapPicker } from '@/components/viewport-map-picker';
import AppLayout from '@/layouts/app-layout';
import { COUNTRIES } from '@/lib/countries';
import {
    destroy as tripsDestroy,
    fetchImage as tripsFetchImage,
    store as tripsStore,
    update as tripsUpdate,
} from '@/routes/trips';
import { type BreadcrumbItem, type Trip } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateTripProps {
    trip?: Trip;
}

export default function CreateTrip({ trip }: CreateTripProps) {
    const isEditMode = !!trip;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Trips',
            href: '/trips',
        },
        {
            title: isEditMode ? 'Edit trip' : 'Create trip',
            href: isEditMode ? `/trips/${trip.id}/edit` : '/trips/create',
        },
    ];

    const [name, setName] = useState(trip?.name || '');
    const [country, setCountry] = useState<string>(trip?.country || '');
    const [imageUrl, setImageUrl] = useState<string | null>(
        trip?.image_url || null,
    );
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [viewport, setViewport] = useState<{
        latitude: number;
        longitude: number;
        zoom: number;
    } | null>(
        trip?.viewport_latitude &&
            trip?.viewport_longitude &&
            trip?.viewport_zoom
            ? {
                  latitude: trip.viewport_latitude,
                  longitude: trip.viewport_longitude,
                  zoom: trip.viewport_zoom,
              }
            : null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Auto-fetch image when both name and country are available
    useEffect(() => {
        // Only auto-fetch if:
        // 1. We're in edit mode OR both name and country are provided
        // 2. No image is currently set
        // 3. Not already loading an image
        if (
            name.trim() &&
            country &&
            !imageUrl &&
            !isLoadingImage &&
            isEditMode &&
            trip
        ) {
            const fetchImage = async () => {
                setIsLoadingImage(true);
                try {
                    const response = await fetch(tripsFetchImage.url(trip.id), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.trip?.image_url) {
                            setImageUrl(data.trip.image_url);
                        }
                    }
                    // Silently fail if no image found
                } catch (error) {
                    console.error('Failed to fetch image:', error);
                } finally {
                    setIsLoadingImage(false);
                }
            };

            fetchImage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount for edit mode

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const tripData: {
                name: string;
                country: string | null;
                image_url?: string | null;
                viewport_latitude?: number | null;
                viewport_longitude?: number | null;
                viewport_zoom?: number | null;
            } = {
                name: name.trim(),
                country: country || null,
                image_url: imageUrl,
                viewport_latitude: viewport?.latitude ?? null,
                viewport_longitude: viewport?.longitude ?? null,
                viewport_zoom: viewport?.zoom ?? null,
            };

            if (isEditMode) {
                // Update existing trip
                const response = await fetch(tripsUpdate.url(trip.id), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(tripData),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || 'Failed to update trip',
                    );
                }

                // Navigate to trips overview after successful update
                router.visit('/trips');
            } else {
                // Create new trip
                const response = await fetch(tripsStore.url(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(tripData),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.message || 'Failed to create trip',
                    );
                }

                const createdTrip = await response.json();

                // Navigate to map with the newly created trip
                router.visit(`/map/${createdTrip.id}`);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : isEditMode
                      ? 'Failed to update trip'
                      : 'Failed to create trip';
            setError(errorMessage);
            console.error(
                isEditMode
                    ? 'Failed to update trip:'
                    : 'Failed to create trip:',
                error,
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.visit('/trips');
    };

    const handleDelete = async () => {
        if (!trip) return;

        try {
            const response = await fetch(tripsDestroy.url(trip.id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to delete trip');
            }

            // Navigate to trips overview after successful deletion
            router.visit('/trips');
        } catch (error) {
            console.error('Failed to delete trip:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to delete trip',
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditMode ? 'Edit trip' : 'Create trip'} />
            <div className="flex h-full flex-1 items-center justify-center p-4">
                <div className="w-full max-w-2xl space-y-6 rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {isEditMode ? 'Edit trip' : 'Create new trip'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isEditMode
                                ? 'Update the details of your trip'
                                : 'Fill in the details to create your trip'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <AlertError
                                errors={[error]}
                                title={
                                    isEditMode
                                        ? 'Failed to update trip'
                                        : 'Failed to create trip'
                                }
                            />
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    data-testid="trip-name-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Summer 2024, Japan Trip"
                                    disabled={isSubmitting}
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={country}
                                    onValueChange={setCountry}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger
                                        id="country"
                                        data-testid="trip-country-select"
                                    >
                                        <SelectValue placeholder="Select a country..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map((c) => (
                                            <SelectItem
                                                key={c.code}
                                                value={c.code}
                                            >
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Search results will be filtered to this
                                    country
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Image</Label>
                                <div
                                    className="relative aspect-video w-full overflow-hidden rounded-lg border border-sidebar-border/70 bg-muted dark:border-sidebar-border"
                                    data-testid="trip-image-preview"
                                >
                                    {isLoadingImage ? (
                                        <div className="flex size-full items-center justify-center">
                                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                Loading image...
                                            </span>
                                        </div>
                                    ) : imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={name || 'Trip image'}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full flex-col items-center justify-center gap-2">
                                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                                            <ImageIcon className="relative size-12 text-muted-foreground/50" />
                                            <p className="relative text-sm text-muted-foreground">
                                                {name && country
                                                    ? 'Image will be loaded automatically'
                                                    : 'Add name and country to load image'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Images are automatically fetched from
                                    Unsplash when you provide both trip name and
                                    country
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Viewport</Label>
                                <ViewportMapPicker
                                    searchQuery={name}
                                    country={country}
                                    initialViewport={viewport ?? undefined}
                                    onViewportChange={setViewport}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The map will automatically search for the
                                    trip name. Adjust the view to show the
                                    desired area.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            {isEditMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isSubmitting}
                                    data-testid="delete-trip-button"
                                >
                                    Delete trip
                                </Button>
                            )}
                            <div className="ml-auto flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    data-testid="cancel-button"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !name.trim()}
                                    data-testid="save-button"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {isEditMode && trip && (
                <DeleteTripDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={handleDelete}
                    tripName={trip.name}
                />
            )}
        </AppLayout>
    );
}
