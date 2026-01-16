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
import { Image, MoreHorizontal, Pencil, Plus } from 'lucide-react';

interface TripSelectorProps {
    trips: Trip[];
    selectedTripId: number | null;
    onSelectTrip: (tripId: number) => void;
    onCreateTrip: () => void;
    onRenameTrip?: (tripId: number) => void;
}

export default function TripSelector({
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
    onRenameTrip,
}: TripSelectorProps) {
    return (
        <div className="flex flex-col gap-2 px-2 py-2">
            <div className="flex items-center gap-2">
                <Select
                    value={selectedTripId?.toString()}
                    onValueChange={(value) => onSelectTrip(Number(value))}
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
                                        <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                                            <Image className="h-4 w-4 text-gray-400" />
                                        </div>
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
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onRenameTrip(selectedTripId)}
                            >
                                <Pencil className="h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <Button
                    onClick={onCreateTrip}
                    size="icon"
                    variant="outline"
                    title="Create new trip"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
