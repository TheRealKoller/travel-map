/**
 * Component for selecting alternative public transport routes.
 * Allows the user to pick an alternative and adopt it as the primary route.
 */

import { Button } from '@/components/ui/button';
import { formatDurationFromSeconds } from '@/lib/route-formatting';
import { cn } from '@/lib/utils';
import { type AlternativeRoute } from '@/types/route';
import { Check } from 'lucide-react';

interface AlternativeRoutesListProps {
    alternatives: AlternativeRoute[] | null;
    selectedIndex: number | null;
    isAdopting: boolean;
    onSelect: (index: number) => void;
    onAdopt: () => void;
}

export function AlternativeRoutesList({
    alternatives,
    selectedIndex,
    isAdopting,
    onSelect,
    onAdopt,
}: AlternativeRoutesListProps) {
    if (!alternatives || alternatives.length === 0) return null;

    return (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/50 p-3">
            <h5 className="text-sm font-semibold">
                Alternative routes ({alternatives.length})
            </h5>
            <div className="space-y-2">
                {alternatives.map((alt, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSelect(index)}
                        className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-md border p-2 text-xs transition-colors',
                            selectedIndex === index
                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                                : 'border-transparent bg-background hover:border-muted-foreground/30 hover:bg-muted',
                        )}
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
                            {selectedIndex === index && (
                                <Check className="h-3 w-3 text-blue-500" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {selectedIndex !== null && (
                <Button
                    size="sm"
                    className="mt-2 w-full"
                    disabled={isAdopting}
                    onClick={onAdopt}
                >
                    {isAdopting ? 'Adopting...' : 'Adopt this route'}
                </Button>
            )}
        </div>
    );
}
