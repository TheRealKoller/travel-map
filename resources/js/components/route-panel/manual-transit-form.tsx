/**
 * Form for manually entering public transport route segments.
 * Builds a TransitDetails object compatible with the existing TransitDetailsView component.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TransitDetails, TransitStep } from '@/types/route';
import {
    ArrowDown,
    ArrowUp,
    Bus,
    PersonStanding,
    Plus,
    Ship,
    Train,
    TrainFront,
    TramFront,
    Trash2,
} from 'lucide-react';
import { useId } from 'react';

type VehicleType = 'TRAIN' | 'BUS' | 'TRAM' | 'SUBWAY' | 'FERRY' | 'WALK';

interface ManualSegment {
    id: string;
    travel_mode: 'TRANSIT' | 'WALK';
    vehicle_type: VehicleType;
    departure_stop: string;
    arrival_stop: string;
    line_name: string;
    line_short_name: string;
    departure_time: string;
    arrival_time: string;
    num_stops: string;
    duration_minutes: string;
    distance_km: string;
}

interface ManualTransitFormProps {
    value: ManualSegment[];
    onChange: (segments: ManualSegment[]) => void;
    departureTime: string;
    arrivalTime: string;
    onDepartureTimeChange: (value: string) => void;
    onArrivalTimeChange: (value: string) => void;
}

const vehicleOptions: {
    value: VehicleType;
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: 'TRAIN', label: 'Train', icon: <Train className="h-4 w-4" /> },
    { value: 'BUS', label: 'Bus', icon: <Bus className="h-4 w-4" /> },
    { value: 'TRAM', label: 'Tram', icon: <TramFront className="h-4 w-4" /> },
    {
        value: 'SUBWAY',
        label: 'Subway / Metro',
        icon: <TrainFront className="h-4 w-4" />,
    },
    { value: 'FERRY', label: 'Ferry', icon: <Ship className="h-4 w-4" /> },
    {
        value: 'WALK',
        label: 'Walk',
        icon: <PersonStanding className="h-4 w-4" />,
    },
];

function createEmptySegment(): ManualSegment {
    return {
        id: crypto.randomUUID(),
        travel_mode: 'TRANSIT',
        vehicle_type: 'TRAIN',
        departure_stop: '',
        arrival_stop: '',
        line_name: '',
        line_short_name: '',
        departure_time: '',
        arrival_time: '',
        num_stops: '',
        duration_minutes: '',
        distance_km: '',
    };
}

/**
 * Convert internal ManualSegment list to the TransitDetails structure expected by the backend.
 */
export function buildTransitDetails(
    segments: ManualSegment[],
    departureTime: string,
    arrivalTime: string,
): TransitDetails {
    const steps: TransitStep[] = segments.map((seg) => {
        const durationSeconds = seg.duration_minutes
            ? Math.round(parseFloat(seg.duration_minutes) * 60)
            : 0;
        const distanceMeters = seg.distance_km
            ? Math.round(parseFloat(seg.distance_km) * 1000)
            : 0;

        if (seg.travel_mode === 'WALK' || seg.vehicle_type === 'WALK') {
            return {
                travel_mode: 'WALK',
                distance: distanceMeters,
                duration: durationSeconds,
            };
        }

        return {
            travel_mode: 'TRANSIT',
            distance: distanceMeters,
            duration: durationSeconds,
            transit: {
                departure_stop: {
                    name: seg.departure_stop || null,
                    location: null,
                },
                arrival_stop: {
                    name: seg.arrival_stop || null,
                    location: null,
                },
                line: {
                    name: seg.line_name || null,
                    short_name: seg.line_short_name || null,
                    color: null,
                    vehicle_type: seg.vehicle_type,
                },
                departure_time: seg.departure_time
                    ? Math.floor(
                          new Date(
                              `1970-01-01T${seg.departure_time}:00`,
                          ).getTime() / 1000,
                      )
                    : null,
                arrival_time: seg.arrival_time
                    ? Math.floor(
                          new Date(
                              `1970-01-01T${seg.arrival_time}:00`,
                          ).getTime() / 1000,
                      )
                    : null,
                num_stops: seg.num_stops ? parseInt(seg.num_stops, 10) : 0,
                headsign: null,
            },
        };
    });

    return {
        steps,
        departure_time: departureTime || null,
        arrival_time: arrivalTime || null,
        start_address: null,
        end_address: null,
    };
}

export function ManualTransitForm({
    value,
    onChange,
    departureTime,
    arrivalTime,
    onDepartureTimeChange,
    onArrivalTimeChange,
}: ManualTransitFormProps) {
    const baseId = useId();

    const updateSegment = (index: number, patch: Partial<ManualSegment>) => {
        const updated = value.map((seg, i) => {
            if (i !== index) {
                return seg;
            }
            const merged = { ...seg, ...patch };
            // Keep travel_mode in sync with vehicle_type
            if (patch.vehicle_type) {
                merged.travel_mode =
                    patch.vehicle_type === 'WALK' ? 'WALK' : 'TRANSIT';
            }
            return merged;
        });
        onChange(updated);
    };

    const addSegment = () => {
        onChange([...value, createEmptySegment()]);
    };

    const removeSegment = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const moveSegment = (index: number, direction: 'up' | 'down') => {
        const newSegments = [...value];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newSegments.length) {
            return;
        }
        [newSegments[index], newSegments[targetIndex]] = [
            newSegments[targetIndex],
            newSegments[index],
        ];
        onChange(newSegments);
    };

    return (
        <div className="space-y-4">
            {/* Overall departure / arrival times */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label htmlFor={`${baseId}-dep`} className="text-xs">
                        Departure time
                    </Label>
                    <Input
                        id={`${baseId}-dep`}
                        type="time"
                        value={departureTime}
                        onChange={(e) => onDepartureTimeChange(e.target.value)}
                        className="h-8 text-xs"
                        data-testid="manual-departure-time"
                    />
                </div>
                <div>
                    <Label htmlFor={`${baseId}-arr`} className="text-xs">
                        Arrival time
                    </Label>
                    <Input
                        id={`${baseId}-arr`}
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => onArrivalTimeChange(e.target.value)}
                        className="h-8 text-xs"
                        data-testid="manual-arrival-time"
                    />
                </div>
            </div>

            {/* Segment list */}
            {value.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                    No segments yet. Add a transit or walk segment below.
                </p>
            )}

            {value.map((seg, index) => {
                const isWalk = seg.vehicle_type === 'WALK';
                return (
                    <div
                        key={seg.id}
                        className="space-y-2 rounded-md border p-3"
                        data-testid={`manual-segment-${index}`}
                    >
                        {/* Segment header */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">
                                Segment {index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === 0}
                                    onClick={() => moveSegment(index, 'up')}
                                    className="h-6 w-6"
                                    data-testid={`segment-move-up-${index}`}
                                >
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === value.length - 1}
                                    onClick={() => moveSegment(index, 'down')}
                                    className="h-6 w-6"
                                    data-testid={`segment-move-down-${index}`}
                                >
                                    <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSegment(index)}
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    data-testid={`segment-remove-${index}`}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Vehicle type */}
                        <div>
                            <Label
                                htmlFor={`${baseId}-seg-${seg.id}-vehicle-type`}
                                className="text-xs"
                            >
                                Type
                            </Label>
                            <Select
                                value={seg.vehicle_type}
                                onValueChange={(v) =>
                                    updateSegment(index, {
                                        vehicle_type: v as VehicleType,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id={`${baseId}-seg-${seg.id}-vehicle-type`}
                                    className="h-8 text-xs"
                                    data-testid={`segment-vehicle-type-${index}`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicleOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            <div className="flex items-center gap-2">
                                                {opt.icon}
                                                <span>{opt.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!isWalk && (
                            <>
                                {/* Line name */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-line-short`}
                                            className="text-xs"
                                        >
                                            Line / Number
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-line-short`}
                                            value={seg.line_short_name}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    line_short_name:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="ICE 123"
                                            className="h-8 text-xs"
                                            data-testid={`segment-line-short-${index}`}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-line-name`}
                                            className="text-xs"
                                        >
                                            Line name (opt.)
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-line-name`}
                                            value={seg.line_name}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    line_name: e.target.value,
                                                })
                                            }
                                            placeholder="InterCityExpress"
                                            className="h-8 text-xs"
                                            data-testid={`segment-line-name-${index}`}
                                        />
                                    </div>
                                </div>

                                {/* Stops */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-dep-stop`}
                                            className="text-xs"
                                        >
                                            Departure stop
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-dep-stop`}
                                            value={seg.departure_stop}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    departure_stop:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="Berlin Hbf"
                                            className="h-8 text-xs"
                                            data-testid={`segment-dep-stop-${index}`}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-arr-stop`}
                                            className="text-xs"
                                        >
                                            Arrival stop
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-arr-stop`}
                                            value={seg.arrival_stop}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    arrival_stop:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="München Hbf"
                                            className="h-8 text-xs"
                                            data-testid={`segment-arr-stop-${index}`}
                                        />
                                    </div>
                                </div>

                                {/* Times */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-dep-time`}
                                            className="text-xs"
                                        >
                                            Departs at
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-dep-time`}
                                            type="time"
                                            value={seg.departure_time}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    departure_time:
                                                        e.target.value,
                                                })
                                            }
                                            className="h-8 text-xs"
                                            data-testid={`segment-dep-time-${index}`}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor={`${baseId}-seg-${seg.id}-arr-time`}
                                            className="text-xs"
                                        >
                                            Arrives at
                                        </Label>
                                        <Input
                                            id={`${baseId}-seg-${seg.id}-arr-time`}
                                            type="time"
                                            value={seg.arrival_time}
                                            onChange={(e) =>
                                                updateSegment(index, {
                                                    arrival_time:
                                                        e.target.value,
                                                })
                                            }
                                            className="h-8 text-xs"
                                            data-testid={`segment-arr-time-${index}`}
                                        />
                                    </div>
                                </div>

                                {/* Stops count */}
                                <div>
                                    <Label
                                        htmlFor={`${baseId}-seg-${seg.id}-num-stops`}
                                        className="text-xs"
                                    >
                                        Intermediate stops (opt.)
                                    </Label>
                                    <Input
                                        id={`${baseId}-seg-${seg.id}-num-stops`}
                                        type="number"
                                        min="0"
                                        value={seg.num_stops}
                                        onChange={(e) =>
                                            updateSegment(index, {
                                                num_stops: e.target.value,
                                            })
                                        }
                                        placeholder="0"
                                        className="h-8 text-xs"
                                        data-testid={`segment-num-stops-${index}`}
                                    />
                                </div>
                            </>
                        )}

                        {/* Duration + distance (both modes) */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label
                                    htmlFor={`${baseId}-seg-${seg.id}-duration`}
                                    className="text-xs"
                                >
                                    Duration (min, opt.)
                                </Label>
                                <Input
                                    id={`${baseId}-seg-${seg.id}-duration`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={seg.duration_minutes}
                                    onChange={(e) =>
                                        updateSegment(index, {
                                            duration_minutes: e.target.value,
                                        })
                                    }
                                    placeholder="60"
                                    className="h-8 text-xs"
                                    data-testid={`segment-duration-${index}`}
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor={`${baseId}-seg-${seg.id}-distance`}
                                    className="text-xs"
                                >
                                    Distance (km, opt.)
                                </Label>
                                <Input
                                    id={`${baseId}-seg-${seg.id}-distance`}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={seg.distance_km}
                                    onChange={(e) =>
                                        updateSegment(index, {
                                            distance_km: e.target.value,
                                        })
                                    }
                                    placeholder="500"
                                    className="h-8 text-xs"
                                    data-testid={`segment-distance-${index}`}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSegment}
                className="w-full"
                data-testid="add-segment"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add segment
            </Button>
        </div>
    );
}
