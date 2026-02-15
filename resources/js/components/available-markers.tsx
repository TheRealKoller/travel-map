import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Icon } from '@/components/ui/icon';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { cn } from '@/lib/utils';
import { MarkerData } from '@/types/marker';
import { ChevronDown, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface AvailableMarkersProps {
    /** All markers that can be added to the tour (including those already in tour) */
    availableMarkers: MarkerData[];
    /** ID of the currently selected available marker (for blue ring highlight) */
    selectedAvailableMarkerId: string | null;
    /** Callback when an available marker is clicked to select it */
    onSelectAvailableMarker: (markerId: string | null) => void;
    /** Callback when the [+] button is clicked to add marker to tour */
    onAddMarkerToTour: (markerId: string) => void;
    /** Function to get how many times a marker is in the current tour */
    getMarkerCountInTour: (markerId: string) => number;
}

export function AvailableMarkers({
    availableMarkers,
    selectedAvailableMarkerId,
    onSelectAvailableMarker,
    onAddMarkerToTour,
    getMarkerCountInTour,
}: AvailableMarkersProps) {
    const [isOpen, setIsOpen] = useState(true);
    const selectedMarkerRef = useRef<HTMLLIElement>(null);

    // Auto-scroll to selected marker when it changes
    useEffect(() => {
        if (selectedAvailableMarkerId && selectedMarkerRef.current) {
            selectedMarkerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [selectedAvailableMarkerId]);

    if (availableMarkers.length === 0) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Available Markers ({availableMarkers.length})
                    </h4>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-gray-500 transition-transform dark:text-gray-400',
                            !isOpen && '-rotate-90',
                        )}
                    />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                        <ul className="space-y-1 p-3">
                            {availableMarkers.map((marker) => {
                                const isSelected =
                                    selectedAvailableMarkerId === marker.id;
                                return (
                                    <li
                                        key={marker.id}
                                        ref={
                                            isSelected
                                                ? selectedMarkerRef
                                                : null
                                        }
                                    >
                                        <div
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded bg-gray-50 p-2 text-xs transition-all hover:bg-gray-100 sm:p-2 sm:text-sm dark:bg-gray-800 dark:hover:bg-gray-700',
                                                isSelected &&
                                                    'ring-2 ring-blue-500 dark:ring-blue-400',
                                            )}
                                            onClick={() =>
                                                onSelectAvailableMarker(
                                                    isSelected
                                                        ? null
                                                        : marker.id,
                                                )
                                            }
                                        >
                                            <Icon
                                                iconNode={getMarkerTypeIcon(
                                                    marker.type,
                                                )}
                                                className="h-3.5 w-3.5 flex-shrink-0 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate leading-snug font-medium text-gray-900 dark:text-gray-100">
                                                    {marker.name ||
                                                        'Unnamed Location'}
                                                </div>
                                                {(() => {
                                                    const count =
                                                        getMarkerCountInTour(
                                                            marker.id,
                                                        );
                                                    return (
                                                        count > 0 && (
                                                            <Badge
                                                                variant="outline"
                                                                className="mt-0.5 border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                                            >
                                                                {count}x in tour
                                                            </Badge>
                                                        )
                                                    );
                                                })()}
                                                {marker.estimatedHours && (
                                                    <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                                                        ~{marker.estimatedHours}
                                                        h
                                                    </div>
                                                )}
                                            </div>
                                            {marker.isUnesco && (
                                                <Icon
                                                    iconNode={UnescoIcon}
                                                    className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 sm:h-4 sm:w-4"
                                                />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 flex-shrink-0 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 sm:h-11 sm:w-11 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddMarkerToTour(
                                                        marker.id,
                                                    );
                                                }}
                                                title="Add to tour"
                                                data-testid={`add-marker-to-tour-${marker.id}`}
                                            >
                                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
