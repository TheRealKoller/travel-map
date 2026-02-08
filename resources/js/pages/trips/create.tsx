import '@/../../resources/css/markdown-preview.css';
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
import 'easymde/dist/easymde.min.css';
import { ChevronLeft, ChevronRight, ImageIcon, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';

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
    const [photos, setPhotos] = useState<
        Array<{ id: string; urls: { regular: string } }>
    >([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
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

    // Planned period and duration state
    const [plannedStartYear, setPlannedStartYear] = useState<string>(
        trip?.planned_start_year?.toString() || '',
    );
    const [plannedStartMonth, setPlannedStartMonth] = useState<string>(
        trip?.planned_start_month?.toString() || '',
    );
    const [plannedStartDay, setPlannedStartDay] = useState<string>(
        trip?.planned_start_day?.toString() || '',
    );
    const [plannedEndYear, setPlannedEndYear] = useState<string>(
        trip?.planned_end_year?.toString() || '',
    );
    const [plannedEndMonth, setPlannedEndMonth] = useState<string>(
        trip?.planned_end_month?.toString() || '',
    );
    const [plannedEndDay, setPlannedEndDay] = useState<string>(
        trip?.planned_end_day?.toString() || '',
    );
    const [plannedDurationDays, setPlannedDurationDays] = useState<string>(
        trip?.planned_duration_days?.toString() || '',
    );
    const [notes, setNotes] = useState<string>(trip?.notes || '');

    // Auto-fetch image when both name and country are available
    useEffect(() => {
        // Auto-fetch image when editing existing trips without images.
        // This effect runs ONCE on component mount (not on user input changes).
        // For new trips, the backend auto-fetches images on save if name+country are provided.
        // Only auto-fetch if:
        // 1. We're in edit mode (existing trip)
        // 2. Trip has both name and country
        // 3. No image is currently set
        // 4. Not already loading an image
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
    }, []); // Empty deps: run once on mount, not on every keystroke

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
                planned_start_year?: number | null;
                planned_start_month?: number | null;
                planned_start_day?: number | null;
                planned_end_year?: number | null;
                planned_end_month?: number | null;
                planned_end_day?: number | null;
                planned_duration_days?: number | null;
                notes?: string | null;
            } = {
                name: name.trim(),
                country: country || null,
                image_url: imageUrl,
                viewport_latitude: viewport?.latitude ?? null,
                viewport_longitude: viewport?.longitude ?? null,
                viewport_zoom: viewport?.zoom ?? null,
                planned_start_year: plannedStartYear
                    ? parseInt(plannedStartYear, 10)
                    : null,
                planned_start_month: plannedStartMonth
                    ? parseInt(plannedStartMonth, 10)
                    : null,
                planned_start_day: plannedStartDay
                    ? parseInt(plannedStartDay, 10)
                    : null,
                planned_end_year: plannedEndYear
                    ? parseInt(plannedEndYear, 10)
                    : null,
                planned_end_month: plannedEndMonth
                    ? parseInt(plannedEndMonth, 10)
                    : null,
                planned_end_day: plannedEndDay
                    ? parseInt(plannedEndDay, 10)
                    : null,
                planned_duration_days: plannedDurationDays
                    ? parseInt(plannedDurationDays, 10)
                    : null,
                notes: notes || null,
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

    const handleRefreshImage = async () => {
        if (!name.trim() || isLoadingImage) return;

        setIsLoadingImage(true);
        setError(null);

        try {
            const response = await fetch('/trips/fetch-image-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    country: country || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to load images');
            }

            const data = await response.json();

            if (data.photos && data.photos.length > 0) {
                setPhotos(data.photos);
                setCurrentPhotoIndex(0);
                setImageUrl(data.photos[0].urls.regular);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load images';
            setError(errorMessage);
            console.error('Failed to refresh trip image:', error);
        } finally {
            setIsLoadingImage(false);
        }
    };

    const handlePreviousPhoto = () => {
        if (photos.length === 0) return;
        const newIndex =
            currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
        setCurrentPhotoIndex(newIndex);
        setImageUrl(photos[newIndex].urls.regular);
    };

    const handleNextPhoto = () => {
        if (photos.length === 0) return;
        const newIndex =
            currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
        setCurrentPhotoIndex(newIndex);
        setImageUrl(photos[newIndex].urls.regular);
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

    // Configure marked once globally
    if (
        typeof window !== 'undefined' &&
        !(window as unknown as Record<string, unknown>).__markedConfigured
    ) {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        (window as unknown as Record<string, unknown>).__markedConfigured =
            true;
    }

    // Define mdeOptions for SimpleMDE editor
    const mdeOptions = useMemo(() => {
        type ToolbarButton =
            | 'bold'
            | 'italic'
            | 'heading'
            | '|'
            | 'quote'
            | 'unordered-list'
            | 'ordered-list'
            | 'link'
            | 'image'
            | 'preview'
            | 'guide';

        return {
            spellChecker: false,
            placeholder: 'Add notes about this trip (Markdown supported)...',
            status: false,
            previewRender: (text: string) => {
                return marked.parse(text) as string;
            },
            toolbar: [
                'bold',
                'italic',
                'heading',
                '|',
                'quote',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                'image',
                '|',
                'preview',
                '|',
                'guide',
            ] as ToolbarButton[],
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditMode ? 'Edit trip' : 'Create trip'} />
            <div className="flex h-full flex-1 items-start justify-center p-4">
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

                            {/* Planned Period Section */}
                            <div className="space-y-3 rounded-md border border-gray-200 p-3">
                                <Label className="text-sm font-medium text-gray-700">
                                    Planned period (optional)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Specify when you plan to travel. You can
                                    enter year only, year and month, or full
                                    date.
                                </p>

                                {/* Start Date */}
                                <div>
                                    <Label className="mb-1 block text-xs font-medium text-gray-600">
                                        From
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={plannedStartYear}
                                            onChange={(e) =>
                                                setPlannedStartYear(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Year"
                                            min="1000"
                                            max="9999"
                                            className="w-24"
                                            data-testid="planned-start-year"
                                        />
                                        <Input
                                            type="number"
                                            value={plannedStartMonth}
                                            onChange={(e) =>
                                                setPlannedStartMonth(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Month"
                                            min="1"
                                            max="12"
                                            className="w-20"
                                            data-testid="planned-start-month"
                                        />
                                        <Input
                                            type="number"
                                            value={plannedStartDay}
                                            onChange={(e) =>
                                                setPlannedStartDay(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Day"
                                            min="1"
                                            max="31"
                                            className="w-20"
                                            data-testid="planned-start-day"
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div>
                                    <Label className="mb-1 block text-xs font-medium text-gray-600">
                                        To
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={plannedEndYear}
                                            onChange={(e) =>
                                                setPlannedEndYear(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Year"
                                            min="1000"
                                            max="9999"
                                            className="w-24"
                                            data-testid="planned-end-year"
                                        />
                                        <Input
                                            type="number"
                                            value={plannedEndMonth}
                                            onChange={(e) =>
                                                setPlannedEndMonth(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Month"
                                            min="1"
                                            max="12"
                                            className="w-20"
                                            data-testid="planned-end-month"
                                        />
                                        <Input
                                            type="number"
                                            value={plannedEndDay}
                                            onChange={(e) =>
                                                setPlannedEndDay(e.target.value)
                                            }
                                            placeholder="Day"
                                            min="1"
                                            max="31"
                                            className="w-20"
                                            data-testid="planned-end-day"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Planned Duration */}
                            <div className="space-y-2">
                                <Label htmlFor="planned-duration">
                                    Planned duration (optional)
                                </Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="planned-duration"
                                        type="number"
                                        value={plannedDurationDays}
                                        onChange={(e) =>
                                            setPlannedDurationDays(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Number of days"
                                        min="1"
                                        max="9999"
                                        className="w-32"
                                        data-testid="planned-duration-days"
                                    />
                                    <span className="text-sm text-gray-600">
                                        days
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    The duration doesn't need to match the
                                    planned period
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
                                                Loading images...
                                            </span>
                                        </div>
                                    ) : imageUrl ? (
                                        <>
                                            <img
                                                src={imageUrl}
                                                alt={name || 'Trip image'}
                                                className="size-full object-cover"
                                            />
                                            {photos.length > 1 && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute top-1/2 left-2 -translate-y-1/2 opacity-80 hover:opacity-100"
                                                        onClick={
                                                            handlePreviousPhoto
                                                        }
                                                        data-testid="previous-photo-button"
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute top-1/2 right-2 -translate-y-1/2 opacity-80 hover:opacity-100"
                                                        onClick={
                                                            handleNextPhoto
                                                        }
                                                        data-testid="next-photo-button"
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                                                        {currentPhotoIndex + 1}{' '}
                                                        / {photos.length}
                                                    </div>
                                                </>
                                            )}
                                        </>
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
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Click the button to load new Unsplash
                                        images
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleRefreshImage}
                                        disabled={
                                            isLoadingImage || !name.trim()
                                        }
                                        data-testid="refresh-trip-image-button"
                                    >
                                        {isLoadingImage
                                            ? 'Loading images...'
                                            : 'Load new images'}
                                    </Button>
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

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <SimpleMDE
                                    id="notes"
                                    value={notes}
                                    onChange={setNotes}
                                    options={mdeOptions}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Add notes about your trip. Markdown is
                                    supported for formatting.
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
