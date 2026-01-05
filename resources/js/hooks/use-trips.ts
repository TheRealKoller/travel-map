import {
    index as tripsIndex,
    store as tripsStore,
    update as tripsUpdate,
} from '@/routes/trips';
import { Trip } from '@/types/trip';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export function useTrips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadTrips = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get<Trip[]>(tripsIndex.url());
            const loadedTrips = response.data;
            setTrips(loadedTrips);

            if (loadedTrips.length > 0 && selectedTripId === null) {
                setSelectedTripId(loadedTrips[0].id);
            }
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to load trips');
            setError(error);
            console.error('Failed to load trips:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedTripId]);

    const createTrip = useCallback(async (name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post<Trip>(tripsStore.url(), { name });
            const newTrip = response.data;
            setTrips((prev) => [...prev, newTrip]);
            setSelectedTripId(newTrip.id);

            return newTrip;
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to create trip');
            setError(error);
            console.error('Failed to create trip:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const renameTrip = useCallback(async (trip: Trip, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.put<Trip>(tripsUpdate.url(trip.id), {
                name,
            });
            const updatedTrip = response.data;
            setTrips((prev) =>
                prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t)),
            );

            return updatedTrip;
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to rename trip');
            setError(error);
            console.error('Failed to rename trip:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        trips,
        selectedTripId,
        setSelectedTripId,
        isLoading,
        error,
        loadTrips,
        createTrip,
        renameTrip,
    } as const;
}
