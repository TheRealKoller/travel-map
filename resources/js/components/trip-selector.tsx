import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Trip } from '@/types/trip';
import { Plus } from 'lucide-react';

interface TripSelectorProps {
    trips: Trip[];
    selectedTripId: number | null;
    onSelectTrip: (tripId: number) => void;
    onCreateTrip: () => void;
}

export default function TripSelector({
    trips,
    selectedTripId,
    onSelectTrip,
    onCreateTrip,
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
                                {trip.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
