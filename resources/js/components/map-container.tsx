import TravelMap from '@/components/travel-map';
import { Tour } from '@/types/tour';

interface MapContainerProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    onToursUpdate: (tours: Tour[]) => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
}

export function MapContainer({
    selectedTripId,
    selectedTourId,
    tours,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
}: MapContainerProps) {
    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            <TravelMap
                selectedTripId={selectedTripId}
                selectedTourId={selectedTourId}
                tours={tours}
                onToursUpdate={onToursUpdate}
                onSelectTour={onSelectTour}
                onCreateTour={onCreateTour}
                onDeleteTour={onDeleteTour}
            />
        </div>
    );
}
