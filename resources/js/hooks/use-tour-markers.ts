import { Tour } from '@/types/tour';
import axios from 'axios';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface UseTourMarkersOptions {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    onToursUpdate: (tours: Tour[]) => void;
}

export function useTourMarkers({
    selectedTripId,
    selectedTourId,
    tours,
    onToursUpdate,
}: UseTourMarkersOptions) {
    const handleToggleMarkerInTour = useCallback(
        async (markerId: string, tourId: number, isInTour: boolean) => {
            try {
                if (isInTour) {
                    // Detach marker from tour
                    await axios.delete(`/tours/${tourId}/markers`, {
                        data: { marker_id: markerId },
                    });
                } else {
                    // Attach marker to tour
                    await axios.post(`/tours/${tourId}/markers`, {
                        marker_id: markerId,
                    });
                }

                // Reload tours to get updated marker associations
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            } catch (error) {
                console.error(
                    'Failed to update marker tour assignment:',
                    error,
                );
                if (axios.isAxiosError(error) && error.response) {
                    toast.error(
                        `Failed to update marker tour assignment: ${error.response.data.error || error.response.data.message || 'Unknown error'}`,
                    );
                } else {
                    toast.error(
                        'Failed to update marker tour assignment. Please try again.',
                    );
                }
            }
        },
        [selectedTripId, onToursUpdate],
    );

    const handleAddMarkerToTour = useCallback(
        async (markerId: string): Promise<boolean> => {
            if (selectedTourId === null) return false;

            try {
                // Attach marker to tour (duplicates allowed)
                await axios.post(`/tours/${selectedTourId}/markers`, {
                    marker_id: markerId,
                });

                // Reload tours to get updated marker associations
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
                return true;
            } catch (error) {
                console.error('Failed to add marker to tour:', error);
                toast.error('Failed to add marker to tour. Please try again.');
                return false;
            }
        },
        [selectedTourId, selectedTripId, onToursUpdate],
    );

    const handleMoveMarkerUp = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;

            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (!selectedTour || !selectedTour.markers) return;

            const currentIndex = selectedTour.markers.findIndex(
                (m) => m.id === markerId,
            );

            if (currentIndex <= 0) return;

            // Swap with previous marker
            const reorderedMarkers = [...selectedTour.markers];
            [
                reorderedMarkers[currentIndex - 1],
                reorderedMarkers[currentIndex],
            ] = [
                reorderedMarkers[currentIndex],
                reorderedMarkers[currentIndex - 1],
            ];

            // Optimistically update the UI
            const updatedTours = tours.map((t) =>
                t.id === selectedTourId
                    ? { ...t, markers: reorderedMarkers }
                    : t,
            );
            onToursUpdate(updatedTours);

            // Send the reorder request to the server
            try {
                await axios.put(`/tours/${selectedTourId}/markers/reorder`, {
                    marker_ids: reorderedMarkers.map((m) => m.id),
                });

                // Reload tours from server to ensure we have the latest correct data
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            } catch (error) {
                console.error('Failed to reorder markers:', error);
                toast.error(
                    'Failed to reorder markers. The order has been reverted.',
                );
                // Revert the optimistic update on error
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            }
        },
        [selectedTourId, selectedTripId, tours, onToursUpdate],
    );

    const handleMoveMarkerDown = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;

            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (!selectedTour || !selectedTour.markers) return;

            const currentIndex = selectedTour.markers.findIndex(
                (m) => m.id === markerId,
            );

            if (
                currentIndex === -1 ||
                currentIndex >= selectedTour.markers.length - 1
            )
                return;

            // Swap with next marker
            const reorderedMarkers = [...selectedTour.markers];
            [
                reorderedMarkers[currentIndex],
                reorderedMarkers[currentIndex + 1],
            ] = [
                reorderedMarkers[currentIndex + 1],
                reorderedMarkers[currentIndex],
            ];

            // Optimistically update the UI
            const updatedTours = tours.map((t) =>
                t.id === selectedTourId
                    ? { ...t, markers: reorderedMarkers }
                    : t,
            );
            onToursUpdate(updatedTours);

            // Send the reorder request to the server
            try {
                await axios.put(`/tours/${selectedTourId}/markers/reorder`, {
                    marker_ids: reorderedMarkers.map((m) => m.id),
                });

                // Reload tours from server to ensure we have the latest correct data
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            } catch (error) {
                console.error('Failed to reorder markers:', error);
                toast.error(
                    'Failed to reorder markers. The order has been reverted.',
                );
                // Revert the optimistic update on error
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            }
        },
        [selectedTourId, selectedTripId, tours, onToursUpdate],
    );

    const handleRemoveMarker = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;

            try {
                // Remove one instance of the marker from the tour
                await axios.delete(`/tours/${selectedTourId}/markers`, {
                    data: { marker_id: markerId },
                });

                // Reload tours to get updated marker associations
                if (selectedTripId) {
                    const response = await axios.get('/tours', {
                        params: { trip_id: selectedTripId },
                    });
                    onToursUpdate(response.data);
                }
            } catch (error) {
                console.error('Failed to remove marker from tour:', error);
                toast.error(
                    'Failed to remove marker from tour. Please try again.',
                );
            }
        },
        [selectedTourId, selectedTripId, onToursUpdate],
    );

    return {
        handleToggleMarkerInTour,
        handleAddMarkerToTour,
        handleMoveMarkerUp,
        handleMoveMarkerDown,
        handleRemoveMarker,
    } as const;
}
