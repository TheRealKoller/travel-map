import TravelMap from '@/components/travel-map';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';

interface MapContainerProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    trips: Trip[];
    onToursUpdate: (tours: Tour[]) => void;
    onReloadTours: () => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    onSetViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<void>;
}

export function MapContainer({
    selectedTripId,
    selectedTourId,
    tours,
    trips,
    onToursUpdate,
    onReloadTours,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    onSetViewport,
}: MapContainerProps) {
    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            <TravelMap
                selectedTripId={selectedTripId}
                selectedTourId={selectedTourId}
                tours={tours}
                trips={trips}
                onToursUpdate={onToursUpdate}
                onReloadTours={onReloadTours}
                onSelectTour={onSelectTour}
                onCreateTour={onCreateTour}
                onDeleteTour={onDeleteTour}
                onSetViewport={onSetViewport}
            />
        </div>
    );
}
