import { AvailableMarkers } from '@/components/available-markers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { formatDuration } from '@/lib/utils';
import { MarkerData } from '@/types/marker';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    Plus,
    Route as RouteIcon,
    Trash2,
} from 'lucide-react';
import { useMemo } from 'react';

interface TourPanelProps {
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    markers: MarkerData[];
    routes: Route[];
    onMoveMarkerUp?: (markerId: string) => void;
    onMoveMarkerDown?: (markerId: string) => void;
    onRemoveMarkerFromTour?: (markerId: string) => void;
    onRequestRoute?: (startMarkerId: string, endMarkerId: string) => void;
    selectedAvailableMarkerId?: string | null;
    onSelectAvailableMarker?: (markerId: string | null) => void;
    onAddMarkerToTour?: (markerId: string) => void;
}

interface TourTabProps {
    tour: Tour;
    markerCount: number;
}

function TourTab({ tour, markerCount }: TourTabProps) {
    return (
        <div className="inline-flex" style={{ minHeight: '40px' }}>
            <TabsTrigger value={tour.id.toString()} data-testid="tour-tab">
                <span className="truncate">{tour.name}</span>
                {markerCount > 0 && (
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        ({markerCount})
                    </span>
                )}
                {tour.estimated_duration_hours !== undefined &&
                    tour.estimated_duration_hours > 0 && (
                        <span className="ml-1 text-xs whitespace-nowrap text-blue-600 dark:text-blue-400">
                            {formatDuration(tour.estimated_duration_hours)}
                        </span>
                    )}
            </TabsTrigger>
        </div>
    );
}

interface MarkerItemProps {
    marker: MarkerData;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onRemove?: () => void;
}

function MarkerItem({
    marker,
    index,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    onRemove,
}: MarkerItemProps) {
    return (
        <div className="rounded bg-gray-50 p-2 text-xs sm:p-2 sm:text-sm dark:bg-gray-800">
            <div className="flex items-start gap-2 sm:gap-2">
                <div className="flex flex-shrink-0 flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-30 sm:h-11 sm:w-11 dark:text-gray-500 dark:hover:text-blue-400"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        title="Move up"
                        data-testid="move-marker-up"
                    >
                        <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-30 sm:h-11 sm:w-11 dark:text-gray-500 dark:hover:text-blue-400"
                        onClick={onMoveDown}
                        disabled={isLast}
                        title="Move down"
                        data-testid="move-marker-down"
                    >
                        <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </div>
                <span className="flex-shrink-0 font-medium text-gray-500 dark:text-gray-400">
                    {index + 1}.
                </span>
                <div className="min-w-0 flex-1">
                    <div className="truncate leading-snug font-medium text-gray-900 dark:text-gray-100">
                        {marker.name || 'Unnamed Location'}
                    </div>
                    {marker.estimatedHours && (
                        <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            <span className="font-medium">
                                Estimated duration:
                            </span>{' '}
                            ~{marker.estimatedHours}h
                        </div>
                    )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
                    {onRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 sm:h-11 sm:w-11 dark:text-gray-500 dark:hover:text-red-400"
                            onClick={onRemove}
                            title="Remove from tour"
                            data-testid="remove-marker-from-tour"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    )}
                    <Icon
                        iconNode={getMarkerTypeIcon(marker.type)}
                        className="h-3.5 w-3.5 text-gray-600 sm:h-4 sm:w-4 dark:text-gray-400"
                    />
                    {marker.isUnesco && (
                        <Icon
                            iconNode={UnescoIcon}
                            className="h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4"
                        />
                    )}
                    {onRemove && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 sm:h-11 sm:w-11 dark:text-gray-500 dark:hover:text-red-400"
                            onClick={onRemove}
                            title="Remove from tour"
                            data-testid="remove-marker-from-tour"
                        >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

interface TourCardProps {
    tour: Tour;
    markers: MarkerData[];
    allMarkers: MarkerData[];
    routes: Route[];
    onDeleteTour: (tourId: number) => void;
    onMoveMarkerUp?: (markerId: string) => void;
    onMoveMarkerDown?: (markerId: string) => void;
    onRemoveMarkerFromTour?: (markerId: string) => void;
    onRequestRoute?: (startMarkerId: string, endMarkerId: string) => void;
    selectedAvailableMarkerId?: string | null;
    onSelectAvailableMarker?: (markerId: string | null) => void;
    onAddMarkerToTour?: (markerId: string) => void;
}

function TourCard({
    tour,
    markers,
    allMarkers,
    routes,
    onDeleteTour,
    onMoveMarkerUp,
    onMoveMarkerDown,
    onRemoveMarkerFromTour,
    onRequestRoute,
    selectedAvailableMarkerId,
    onSelectAvailableMarker,
    onAddMarkerToTour,
}: TourCardProps) {
    // Precompute marker counts for O(1) lookup performance
    const markerCountsInTour = useMemo(() => {
        const counts = new Map<string, number>();

        for (const marker of markers) {
            const currentCount = counts.get(marker.id) ?? 0;
            counts.set(marker.id, currentCount + 1);
        }

        return counts;
    }, [markers]);

    // Function to count how many times a marker appears in the tour
    const getMarkerCountInTour = (markerId: string): number => {
        return markerCountsInTour.get(markerId) ?? 0;
    };

    // Show all markers (including those already in tour)
    const availableMarkers = useMemo(
        () =>
            [...allMarkers].sort((a, b) =>
                (a.name || '').localeCompare(b.name || '', undefined, {
                    numeric: true,
                    sensitivity: 'base',
                }),
            ),
        [allMarkers],
    );
    return (
        <Card className="flex-1 overflow-auto p-3 sm:p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between sm:mb-3">
                <div className="flex min-w-0 flex-col">
                    <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base dark:text-gray-100">
                        {tour.name}
                    </h3>
                    {tour.estimated_duration_hours !== undefined &&
                        tour.estimated_duration_hours > 0 && (
                            <span className="text-xs leading-relaxed text-blue-600 dark:text-blue-400">
                                Estimated duration:{' '}
                                {formatDuration(tour.estimated_duration_hours)}
                            </span>
                        )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteTour(tour.id)}
                    className="flex-shrink-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete tour"
                >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
            </div>
            {markers.length === 0 ? (
                <p className="text-xs leading-relaxed text-gray-500 sm:text-sm dark:text-gray-400">
                    Click the arrow next to a marker to add it to this tour
                </p>
            ) : (
                <ul className="space-y-1">
                    {markers.map((marker, index) => (
                        <li key={index}>
                            <MarkerItem
                                marker={marker}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === markers.length - 1}
                                onMoveUp={
                                    onMoveMarkerUp
                                        ? () => onMoveMarkerUp(marker.id)
                                        : undefined
                                }
                                onMoveDown={
                                    onMoveMarkerDown
                                        ? () => onMoveMarkerDown(marker.id)
                                        : undefined
                                }
                                onRemove={
                                    onRemoveMarkerFromTour
                                        ? () =>
                                              onRemoveMarkerFromTour(marker.id)
                                        : undefined
                                }
                            />
                            {/* Route button between consecutive markers */}
                            {index < markers.length - 1 &&
                                onRequestRoute &&
                                (() => {
                                    const nextMarker = markers[index + 1];
                                    // Find existing route between these markers
                                    const existingRoute = routes.find(
                                        (route) =>
                                            (route.start_marker.id ===
                                                marker.id &&
                                                route.end_marker.id ===
                                                    nextMarker.id) ||
                                            (route.start_marker.id ===
                                                nextMarker.id &&
                                                route.end_marker.id ===
                                                    marker.id),
                                    );

                                    return (
                                        <div className="my-1 flex items-center justify-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onRequestRoute(
                                                        marker.id,
                                                        nextMarker.id,
                                                    )
                                                }
                                                className="h-6 gap-1 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                                                title="Calculate route"
                                                data-testid={`route-button-${index}`}
                                            >
                                                <RouteIcon className="h-3 w-3" />
                                                <span>Route</span>
                                            </Button>
                                            {existingRoute && (
                                                <span
                                                    className="text-xs text-gray-600 dark:text-gray-400"
                                                    data-testid={`route-duration-${index}`}
                                                >
                                                    {existingRoute.duration
                                                        .minutes < 60
                                                        ? `${existingRoute.duration.minutes}min`
                                                        : formatDuration(
                                                              existingRoute
                                                                  .duration
                                                                  .seconds /
                                                                  3600,
                                                          )}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}
                        </li>
                    ))}
                </ul>
            )}

            {/* Available Markers Section */}
            {onSelectAvailableMarker && onAddMarkerToTour && (
                <AvailableMarkers
                    availableMarkers={availableMarkers}
                    selectedAvailableMarkerId={
                        selectedAvailableMarkerId ?? null
                    }
                    onSelectAvailableMarker={onSelectAvailableMarker}
                    onAddMarkerToTour={onAddMarkerToTour}
                    getMarkerCountInTour={getMarkerCountInTour}
                />
            )}
        </Card>
    );
}

export default function TourPanel({
    tours,
    selectedTourId,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    markers,
    routes,
    onMoveMarkerUp,
    onMoveMarkerDown,
    onRemoveMarkerFromTour,
    onRequestRoute,
    selectedAvailableMarkerId,
    onSelectAvailableMarker,
    onAddMarkerToTour,
}: TourPanelProps) {
    const handleTabChange = (value: string) => {
        if (value === 'all') {
            onSelectTour(null);
        } else if (value === 'create') {
            onCreateTour();
        } else {
            onSelectTour(parseInt(value));
        }
    };

    // Get the currently selected tour
    const selectedTour = tours.find((tour) => tour.id === selectedTourId);

    // Calculate marker count for each tour
    const getMarkerCountForTour = (tour: Tour) => {
        return tour.markers?.length || 0;
    };

    // Get markers for the selected tour in the correct order from the tour
    const selectedTourMarkers = selectedTour?.markers
        ? selectedTour.markers
              .map((tourMarker) =>
                  markers.find((marker) => marker.id === tourMarker.id),
              )
              .filter((marker): marker is MarkerData => marker !== undefined)
        : [];

    return (
        <div className="flex flex-col gap-4 p-4" data-testid="tour-panel">
            <Tabs
                value={
                    selectedTourId === null ? 'all' : selectedTourId.toString()
                }
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="flex w-full justify-start overflow-x-auto">
                    <TabsTrigger value="all" data-testid="tour-tab-all-markers">
                        All markers
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            ({markers.length})
                        </span>
                    </TabsTrigger>
                    {tours.map((tour) => (
                        <TourTab
                            key={tour.id}
                            tour={tour}
                            markerCount={getMarkerCountForTour(tour)}
                        />
                    ))}
                    <TabsTrigger
                        value="create"
                        className="ml-2"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault();
                            onCreateTour();
                        }}
                        data-testid="tour-tab-create-new"
                    >
                        <Plus className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {selectedTourId !== null && selectedTour && (
                <TourCard
                    tour={selectedTour}
                    markers={selectedTourMarkers}
                    allMarkers={markers}
                    routes={routes}
                    onDeleteTour={onDeleteTour}
                    onMoveMarkerUp={onMoveMarkerUp}
                    onMoveMarkerDown={onMoveMarkerDown}
                    onRemoveMarkerFromTour={onRemoveMarkerFromTour}
                    onRequestRoute={onRequestRoute}
                    selectedAvailableMarkerId={selectedAvailableMarkerId}
                    onSelectAvailableMarker={onSelectAvailableMarker}
                    onAddMarkerToTour={onAddMarkerToTour}
                />
            )}
        </div>
    );
}
