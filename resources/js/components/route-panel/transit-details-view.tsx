/**
 * Component for displaying public transport transit details
 * Shows itinerary with transit steps, stops, and walking segments
 */

import { formatDurationFromSeconds, formatTime } from '@/lib/route-formatting';
import { getVehicleIcon } from '@/lib/transport-utils';
import { TransitDetails } from '@/types/route';
import { ArrowRight, Clock, MapPin, PersonStanding } from 'lucide-react';

interface TransitDetailsViewProps {
    transitDetails: TransitDetails | null;
}

export function TransitDetailsView({
    transitDetails,
}: TransitDetailsViewProps) {
    if (!transitDetails || !transitDetails.steps) return null;

    return (
        <div className="mt-3 space-y-3 rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold">Transit itinerary</h5>
                {transitDetails.departure_time &&
                    transitDetails.arrival_time && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                                {transitDetails.departure_time} →{' '}
                                {transitDetails.arrival_time}
                            </span>
                        </div>
                    )}
            </div>

            <div className="space-y-2">
                {transitDetails.steps.map((step, index) => {
                    if (step.travel_mode === 'TRANSIT' && step.transit) {
                        const transit = step.transit;
                        return (
                            <div
                                key={index}
                                className="rounded-md border bg-background p-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex-shrink-0 rounded-full p-2"
                                        style={{
                                            backgroundColor: transit.line.color
                                                ? `#${transit.line.color}`
                                                : '#3b82f6',
                                            color: '#ffffff',
                                        }}
                                    >
                                        {getVehicleIcon(
                                            transit.line.vehicle_type,
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {transit.line.short_name ||
                                                    transit.line.name ||
                                                    'Transit'}
                                            </span>
                                            {transit.headsign && (
                                                <span className="text-xs text-muted-foreground">
                                                    → {transit.headsign}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-1 text-xs">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-600" />
                                                <div>
                                                    <div className="font-medium">
                                                        {transit.departure_stop
                                                            .name ||
                                                            'Departure Stop'}
                                                    </div>
                                                    {transit.departure_time && (
                                                        <div className="text-muted-foreground">
                                                            Departs at:{' '}
                                                            {formatTime(
                                                                transit.departure_time,
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pl-5 text-muted-foreground">
                                                <ArrowRight className="h-3 w-3" />
                                                <span>
                                                    {transit.num_stops}{' '}
                                                    {transit.num_stops === 1
                                                        ? 'stop'
                                                        : 'stops'}{' '}
                                                    •{' '}
                                                    {formatDurationFromSeconds(
                                                        step.duration,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-600" />
                                                <div>
                                                    <div className="font-medium">
                                                        {transit.arrival_stop
                                                            .name ||
                                                            'Arrival Stop'}
                                                    </div>
                                                    {transit.arrival_time && (
                                                        <div className="text-muted-foreground">
                                                            Arrives at:{' '}
                                                            {formatTime(
                                                                transit.arrival_time,
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    } else if (step.travel_mode === 'WALK') {
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2 rounded-md bg-background/50 p-2 text-xs"
                            >
                                <PersonStanding className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                    Walk for{' '}
                                    {formatDurationFromSeconds(step.duration)} (
                                    {(step.distance / 1000).toFixed(2)} km)
                                </span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
