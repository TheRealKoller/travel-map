import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface TourPanelProps {
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    markers: MarkerData[];
}

interface DroppableTourTabProps {
    tour: Tour;
    markerCount: number;
}

function DroppableTourTab({ tour, markerCount }: DroppableTourTabProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `tour-${tour.id}`,
        data: {
            tourId: tour.id,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className="inline-flex"
            style={{ minHeight: '40px' }}
        >
            <TabsTrigger
                value={tour.id.toString()}
                className={`${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                data-testid="tour-tab"
            >
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

interface SortableMarkerItemProps {
    marker: MarkerData;
    index: number;
}

function SortableMarkerItem({ marker, index }: SortableMarkerItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `tour-item-marker-${marker.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`rounded bg-gray-50 p-2 text-sm ${isDragging ? 'opacity-50' : ''
                }`}
        >
            <div className="flex items-start gap-2">
                <button
                    {...listeners}
                    {...attributes}
                    className="mt-0.5 cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </button>
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

interface DroppableTourCardProps {
    tour: Tour;
    markers: MarkerData[];
    onDeleteTour: (tourId: number) => void;
}

function DroppableTourCard({
    tour,
    markers,
    onDeleteTour,
}: DroppableTourCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `tour-${tour.id}`,
        data: {
            tourId: tour.id,
        },
    });

    // Create sortable IDs for markers
    const sortableIds = markers.map(
        (marker) => `tour-item-marker-${marker.id}`,
    );

    return (
        <Card
            ref={setNodeRef}
            className={`flex-1 overflow-auto p-4 ${isOver ? 'bg-blue-50 ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
        >
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
                    Drag markers here to add them to this tour
                </p>
            ) : (
                <SortableContext
                    items={sortableIds}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className="space-y-2">
                        {markers.map((marker, index) => (
                            <SortableMarkerItem
                                key={marker.id}
                                marker={marker}
                                index={index}
                            />
                        ))}
                    </ul>
                </SortableContext>
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
                        <DroppableTourTab
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
                <DroppableTourCard
                    tour={selectedTour}
                    markers={selectedTourMarkers}
                    onDeleteTour={onDeleteTour}
                />
            )}
        </div>
    );
}
