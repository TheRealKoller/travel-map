import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface TourPanelProps {
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    markers: MarkerData[];
}

interface DroppableTourTabProps {
    tour: Tour;
    markerCount: number;
    isSelected: boolean;
}

function DroppableTourTab({
    tour,
    markerCount,
    isSelected,
}: DroppableTourTabProps) {
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

interface DroppableTourCardProps {
    tour: Tour;
    markers: MarkerData[];
}

function DroppableTourCard({ tour, markers }: DroppableTourCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `tour-${tour.id}`,
        data: {
            tourId: tour.id,
        },
    });

    return (
        <Card
            ref={setNodeRef}
            className={`flex-1 overflow-auto p-4 ${
                isOver
                    ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                    : ''
            }`}
        >
            <h3 className="mb-3 text-sm font-semibold">{tour.name}</h3>
            {markers.length === 0 ? (
                <p className="text-sm text-gray-500">
                    Drag markers here to add them to this tour
                </p>
            ) : (
                <ul className="space-y-2">
                    {markers.map((marker, index) => (
                        <li
                            key={marker.id}
                            className="rounded bg-gray-50 p-2 text-sm"
                        >
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-500">
                                    {index + 1}.
                                </span>
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                        {marker.name || 'Unnamed Location'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {marker.lat.toFixed(6)},{' '}
                                        {marker.lng.toFixed(6)}
                                    </div>
                                </div>
                            </div>
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

    // Get markers for the selected tour
    const selectedTourMarkers = selectedTour
        ? markers.filter((marker) =>
              selectedTour.markers?.some((m) => m.id === marker.id),
          )
        : [];

    return (
        <div className="flex h-full flex-col gap-4">
            <Tabs
                value={
                    selectedTourId === null ? 'all' : selectedTourId.toString()
                }
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="flex w-full justify-start overflow-x-auto">
                    <TabsTrigger value="all">
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
                            isSelected={selectedTourId === tour.id}
                        />
                    ))}
                    <TabsTrigger
                        value="create"
                        className="ml-2"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.preventDefault();
                            onCreateTour();
                        }}
                    >
                        <Plus className="h-4 w-4" />
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {selectedTourId !== null && selectedTour && (
                <DroppableTourCard
                    tour={selectedTour}
                    markers={selectedTourMarkers}
                />
            )}
        </div>
    );
}
