import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trip } from '@/types/trip';
import { router } from '@inertiajs/react';
import {
    Image,
    Loader2,
    MapPin,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

interface TripSelectorProps {
    trips: Trip[];
    selectedTripId: number | null;
    onSelectTrip: (tripId: number) => void;
    onCreateTrip: () => void;
    onRenameTrip?: (tripId: number) => void;
    onDeleteTrip?: (tripId: number) => void;
    onSetViewport?: (tripId: number) => void;
    onTripImageFetched?: (tripId: number, imageUrl: string) => void;
}

export default function TripSelector({
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
    onRenameTrip,
    onDeleteTrip,
    onSetViewport,
    onTripImageFetched,
}: TripSelectorProps) {
    const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());

    const handleFetchImage = async (
        tripId: number,
        event: React.MouseEvent,
    ) => {
        event.stopPropagation();

        if (loadingImages.has(tripId)) return;

        setLoadingImages((prev) => new Set(prev).add(tripId));

        try {
            const response = await fetch(`/trips/${tripId}/fetch-image`, {
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
                if (onTripImageFetched && data.trip?.image_url) {
                    onTripImageFetched(tripId, data.trip.image_url);
                }
            }
        } catch (error) {
            console.error('Failed to fetch image:', error);
        } finally {
            setLoadingImages((prev) => {
                const next = new Set(prev);
                next.delete(tripId);
                return next;
            });
        }
    };

    return (
        <div className="flex flex-col gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
                <Select
                    value={
                        selectedTripId !== null ? String(selectedTripId) : ''
                    }
                    onValueChange={(value) => {
                        if (value) onSelectTrip(Number(value));
                    }}
                    disabled={trips.length === 0}
                >
                    <SelectTrigger className="flex-1">
                        <SelectValue
                            placeholder={
                                trips.length === 0
                                    ? 'No trips yet'
                                    : 'Select a trip'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {trips.map((trip) => (
                            <SelectItem
                                key={trip.id}
                                value={trip.id.toString()}
                            >
                                <div className="flex items-center gap-2">
                                    {trip.image_url ? (
                                        <img
                                            src={trip.image_url}
                                            alt={trip.name}
                                            className="h-8 w-8 rounded object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <button
                                            onClick={(e) =>
                                                handleFetchImage(trip.id, e)
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded bg-gray-200 transition-colors hover:bg-gray-300"
                                            title="Click to load image"
                                            disabled={loadingImages.has(
                                                trip.id,
                                            )}
                                        >
                                            {loadingImages.has(trip.id) ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                            ) : (
                                                <Image className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    )}
                                    <span>{trip.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedTripId !== null && onRenameTrip && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                title="Trip options"
                                data-testid="trip-options-menu"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onRenameTrip(selectedTripId)}
                                data-testid="rename-trip-option"
                            >
                                <Pencil className="h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            {onSetViewport && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onSetViewport(selectedTripId)
                                    }
                                    data-testid="set-viewport-option"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Set map viewport
                                </DropdownMenuItem>
                            )}
                            {onDeleteTrip && (
                                <DropdownMenuItem
                                    onClick={() => onDeleteTrip(selectedTripId)}
                                    data-testid="delete-trip-option"
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete trip
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <Button
                    onClick={() => router.visit('/trips/create')}
                    size="icon"
                    variant="outline"
                    title="Create new trip"
                    data-testid="create-trip-button"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
