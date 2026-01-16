import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import { ArrowDown, ArrowUp, Plus, Route as RouteIcon, Trash2 } from 'lucide-react';

interface TourPanelProps {
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    markers: MarkerData[];
    onMoveMarkerUp?: (markerId: string) => void;
    onMoveMarkerDown?: (markerId: string) => void;
    onRequestRoute?: (startMarkerId: string, endMarkerId: string) => void;
}

interface TourTabProps {
    tour: Tour;
    markerCount: number;
}

function TourTab({ tour, markerCount }: TourTabProps) {
    return (
        <div className="inline-flex" style={{ minHeight: '40px' }}>
            <TabsTrigger value={tour.id.toString()} data-testid="tour-tab">
                {tour.name}
                {markerCount > 0 && (
                    <span className="ml-1 text-xs text-gray-500">
                        ({markerCount})
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
}

function MarkerItem({
    marker,
    index,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
}: MarkerItemProps) {
    return (
        <li className="rounded bg-gray-50 p-2 text-sm">
            <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        onClick={onMoveUp}
                        disabled={isFirst}
                        title="Move up"
                        data-testid="move-marker-up"
                    >
                        <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                        onClick={onMoveDown}
                        disabled={isLast}
                        title="Move down"
                        data-testid="move-marker-down"
                    >
                        <ArrowDown className="h-3 w-3" />
                    </Button>
                </div>
                <span className="font-medium text-gray-500">{index + 1}.</span>
                <div className="flex-1">
                    <div className="font-medium text-gray-900">
                        {marker.name || 'Unnamed Location'}
                    </div>
                    <div className="text-xs text-gray-600">
                        {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <Icon
                        iconNode={getMarkerTypeIcon(marker.type)}
                        className="h-4 w-4 text-gray-600"
                    />
                    {marker.isUnesco && (
                        <Icon
                            iconNode={UnescoIcon}
                            className="h-4 w-4 text-blue-600"
                        />
                    )}
                </div>
            </div>
        </li>
    );
}

interface TourCardProps {
    tour: Tour;
    markers: MarkerData[];
    onDeleteTour: (tourId: number) => void;
    onMoveMarkerUp?: (markerId: string) => void;
    onMoveMarkerDown?: (markerId: string) => void;
    onRequestRoute?: (startMarkerId: string, endMarkerId: string) => void;
}

function TourCard({
    tour,
    markers,
    onDeleteTour,
    onMoveMarkerUp,
    onMoveMarkerDown,
    onRequestRoute,
}: TourCardProps) {
    return (
        <Card className="flex-1 overflow-auto p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{tour.name}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteTour(tour.id)}
                    className="h-7 w-7 text-gray-500 hover:text-red-600"
                    title="Delete tour"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            {markers.length === 0 ? (
                <p className="text-sm text-gray-500">
                    Click the arrow next to a marker to add it to this tour
                </p>
            ) : (
                <ul className="space-y-1">
                    {markers.map((marker, index) => (
                        <li key={marker.id}>
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
                            />
                            {/* Route button between consecutive markers */}
                            {index < markers.length - 1 && onRequestRoute && (
                                <div className="my-1 flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            onRequestRoute(
                                                marker.id,
                                                markers[index + 1].id,
                                            )
                                        }
                                        className="h-6 gap-1 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                        title="Calculate route"
                                        data-testid={`route-button-${index}`}
                                    >
                                        <RouteIcon className="h-3 w-3" />
                                        <span>Route</span>
                                    </Button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
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
    onMoveMarkerUp,
    onMoveMarkerDown,
    onRequestRoute,
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
        <div className="flex h-full flex-col gap-4" data-testid="tour-panel">
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
                        <span className="ml-1 text-xs text-gray-500">
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
                    onDeleteTour={onDeleteTour}
                    onMoveMarkerUp={onMoveMarkerUp}
                    onMoveMarkerDown={onMoveMarkerDown}
                    onRequestRoute={onRequestRoute}
                />
            )}
        </div>
    );
}
