import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';

interface TourCheckboxListProps {
    tours: Tour[];
    marker: MarkerData;
    onToggleMarkerInTour: (
        markerId: string,
        tourId: number,
        isInTour: boolean,
    ) => void;
}

export default function TourCheckboxList({
    tours,
    marker,
    onToggleMarkerInTour,
}: TourCheckboxListProps) {
    if (tours.length === 0) {
        return null;
    }

    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
                Tours
            </label>
            <div className="space-y-2">
                {tours.map((tour) => {
                    const isInTour =
                        tour.markers?.some((m) => m.id === marker?.id) || false;
                    return (
                        <label
                            key={tour.id}
                            className="flex min-h-[44px] cursor-pointer items-center space-x-2 py-2"
                        >
                            <input
                                type="checkbox"
                                checked={isInTour}
                                onChange={() => {
                                    if (marker) {
                                        onToggleMarkerInTour(
                                            marker.id,
                                            tour.id,
                                            isInTour,
                                        );
                                    }
                                }}
                                className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                {tour.name}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
