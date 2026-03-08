import { withLoading } from '@/lib/with-loading';
import {
    destroy as tripsDestroy,
    index as tripsIndex,
    store as tripsStore,
    update as tripsUpdate,
} from '@/routes/trips';
import { Trip } from '@/types/trip';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export function useTrips(showAll: boolean = false) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadTrips = useCallback(async () => {
        await withLoading(
            setIsLoading,
            setError,
            async () => {
                const url = showAll
                    ? `${tripsIndex.url()}?show_all=1`
                    : tripsIndex.url();
                const response = await axios.get<Trip[]>(url);
                const loadedTrips = response.data;
                setTrips(loadedTrips);

                // Don't auto-select the first trip - let the user choose
            },
            { fallbackMessage: 'Failed to load trips', rethrow: false },
        );
    }, [showAll]);

    const createTrip = useCallback(
        async (name: string, country: string | null = null) => {
            return withLoading(
                setIsLoading,
                setError,
                async () => {
                    const response = await axios.post<Trip>(tripsStore.url(), {
                        name,
                        country,
                    });
                    const newTrip = response.data;
                    setTrips((prev) => [...prev, newTrip]);
                    setSelectedTripId(newTrip.id);

                    return newTrip;
                },
                { fallbackMessage: 'Failed to create trip' },
            );
        },
        [],
    );

    const renameTrip = useCallback(async (trip: Trip, name: string) => {
        return withLoading(
            setIsLoading,
            setError,
            async () => {
                const response = await axios.put<Trip>(
                    tripsUpdate.url(trip.id),
                    { name },
                );
                const updatedTrip = response.data;
                setTrips((prev) =>
                    prev.map((t) =>
                        t.id === updatedTrip.id ? updatedTrip : t,
                    ),
                );

                return updatedTrip;
            },
            { fallbackMessage: 'Failed to rename trip' },
        );
    }, []);

    const deleteTrip = useCallback(
        async (tripId: number) => {
            await withLoading(
                setIsLoading,
                setError,
                async () => {
                    await axios.delete(tripsDestroy.url(tripId));
                    setTrips((prev) => prev.filter((t) => t.id !== tripId));

                    // If we deleted the selected trip, select the first remaining trip
                    if (selectedTripId === tripId) {
                        const remainingTrips = trips.filter(
                            (t) => t.id !== tripId,
                        );
                        setSelectedTripId(
                            remainingTrips.length > 0
                                ? remainingTrips[0].id
                                : null,
                        );
                    }
                },
                { fallbackMessage: 'Failed to delete trip' },
            );
        },
        [selectedTripId, trips],
    );

    const updateTripViewport = useCallback(
        async (
            tripId: number,
            viewport: {
                latitude: number;
                longitude: number;
                zoom: number;
            },
        ) => {
            return withLoading(
                setIsLoading,
                setError,
                async () => {
                    const response = await axios.put<Trip>(
                        tripsUpdate.url(tripId),
                        {
                            viewport_latitude: viewport.latitude,
                            viewport_longitude: viewport.longitude,
                            viewport_zoom: viewport.zoom,
                        },
                    );
                    const updatedTrip = response.data;
                    setTrips((prev) =>
                        prev.map((t) =>
                            t.id === updatedTrip.id ? updatedTrip : t,
                        ),
                    );

                    return updatedTrip;
                },
                { fallbackMessage: 'Failed to update trip viewport' },
            );
        },
        [],
    );

    useEffect(() => {
        loadTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showAll]);

    return {
        trips,
        setTrips,
        selectedTripId,
        setSelectedTripId,
        isLoading,
        error,
        loadTrips,
        createTrip,
        renameTrip,
        deleteTrip,
        updateTripViewport,
    } as const;
}
