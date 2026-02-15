/**
 * Component for displaying alternative public transport routes
 * Shows list of alternative route options with distance, duration and transfers
 */

import { formatDurationFromSeconds } from '@/lib/route-formatting';
import { AlternativeRoute } from '@/types/route';

interface AlternativeRoutesListProps {
    alternatives: AlternativeRoute[] | null;
}

export function AlternativeRoutesList({
    alternatives,
}: AlternativeRoutesListProps) {
    if (!alternatives || alternatives.length === 0) return null;

    return (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/50 p-3">
            <h5 className="text-sm font-semibold">
                Alternative routes ({alternatives.length})
            </h5>
            <div className="space-y-2">
                {alternatives.map((alt, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between rounded-md bg-background p-2 text-xs"
                    >
                        <span className="font-medium">Option {index + 2}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{(alt.distance / 1000).toFixed(2)} km</span>
                            <span>•</span>
                            <span>
                                {formatDurationFromSeconds(alt.duration)}
                            </span>
                            <span>•</span>
                            <span>
                                {alt.num_transfers}{' '}
                                {alt.num_transfers === 1
                                    ? 'transfer'
                                    : 'transfers'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
