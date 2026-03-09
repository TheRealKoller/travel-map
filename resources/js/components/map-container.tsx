import TravelMap from '@/components/travel-map';
import { type TripOwner } from '@/types';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { Dispatch, SetStateAction } from 'react';

interface MapContainerProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    trips: Trip[];
    onToursUpdate: (tours: Tour[]) => void;
    onTripsUpdate: Dispatch<SetStateAction<Trip[]>>;
    onReloadTours: () => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    onSetViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<void>;
    tripName?: string;
    owner?: TripOwner;
}

export function MapContainer({
    selectedTripId,
    selectedTourId,
    tours,
    trips,
    onToursUpdate,
    onTripsUpdate,
    onReloadTours,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    onSetViewport,
    tripName,
    owner,
}: MapContainerProps) {
    return (
        <div className="fixed inset-0 h-screen w-screen overflow-hidden">
            <TravelMap
                selectedTripId={selectedTripId}
                selectedTourId={selectedTourId}
                tours={tours}
                trips={trips}
                onToursUpdate={onToursUpdate}
                onTripsUpdate={onTripsUpdate}
                onReloadTours={onReloadTours}
                onSelectTour={onSelectTour}
                onCreateTour={onCreateTour}
                onDeleteTour={onDeleteTour}
                onSetViewport={onSetViewport}
                tripName={tripName}
                owner={owner}
            />
        </div>
    );
}
