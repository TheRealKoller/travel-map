import { withLoading } from '@/lib/with-loading';
import {
    destroy as toursDestroy,
    index as toursIndex,
    store as toursStore,
} from '@/routes/tours';
import { Tour } from '@/types/tour';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export function useTours(selectedTripId: number | null) {
    const [tours, setTours] = useState<Tour[]>([]);
    const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadTours = useCallback(async () => {
        if (!selectedTripId) return;

        await withLoading(setIsLoading, setError, async () => {
            const response = await axios.get<Tour[]>(
                toursIndex.url({ query: { trip_id: selectedTripId } }),
            );
            setTours(response.data);
            setSelectedTourId(null); // Reset to "All markers" when switching trips
        });
    }, [selectedTripId]);

    const createTour = useCallback(
        async (name: string) => {
            if (!selectedTripId) return;

            return withLoading(setIsLoading, setError, async () => {
                const response = await axios.post<Tour>(toursStore.url(), {
                    name,
                    trip_id: selectedTripId,
                });
                const newTour = response.data;
                setTours((prev) => [...prev, newTour]);
                setSelectedTourId(newTour.id);

                return newTour;
            });
        },
        [selectedTripId],
    );

    const deleteTour = useCallback(
        async (tour: Tour) => {
            await withLoading(setIsLoading, setError, async () => {
                await axios.delete(toursDestroy.url(tour.id));

                // Remove tour from tours array
                setTours((prev) => prev.filter((t) => t.id !== tour.id));

                // Reset to "All markers" view if the deleted tour was selected
                if (selectedTourId === tour.id) {
                    setSelectedTourId(null);
                }
            });
        },
        [selectedTourId],
    );

    useEffect(() => {
        loadTours();
    }, [loadTours]);

    return {
        tours,
        setTours,
        selectedTourId,
        setSelectedTourId,
        isLoading,
        error,
        loadTours,
        createTour,
        deleteTour,
    } as const;
}
