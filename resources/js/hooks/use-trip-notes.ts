import { update as tripsUpdate } from '@/routes/trips';
import { Trip } from '@/types/trip';
import { useCallback, useState } from 'react';

interface UseTripNotesProps {
    selectedTripId: number | null;
    trips: Trip[];
}

interface UseTripNotesReturn {
    isTripNotesModalOpen: boolean;
    openTripNotesModal: () => void;
    closeTripNotesModal: () => void;
    handleSaveTripNotes: (notes: string) => Promise<void>;
}

/**
 * Custom hook for managing trip notes modal and API operations
 */
export function useTripNotes({
    selectedTripId,
    trips,
}: UseTripNotesProps): UseTripNotesReturn {
    // Trip notes modal state
    const [isTripNotesModalOpen, setIsTripNotesModalOpen] = useState(false);

    const openTripNotesModal = useCallback(() => {
        setIsTripNotesModalOpen(true);
    }, []);

    const closeTripNotesModal = useCallback(() => {
        setIsTripNotesModalOpen(false);
    }, []);

    /**
     * Handler for saving trip notes
     */
    const handleSaveTripNotes = useCallback(
        async (notes: string) => {
            if (!selectedTripId) return;

            try {
                const response = await fetch(tripsUpdate.url(selectedTripId), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ notes }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update trip notes');
                }

                // Update the local trips state with the new notes
                const trip = trips.find((t) => t.id === selectedTripId);
                if (trip) {
                    trip.notes = notes;
                }
            } catch (error) {
                console.error('Failed to save trip notes:', error);
                throw error;
            }
        },
        [selectedTripId, trips],
    );

    return {
        isTripNotesModalOpen,
        openTripNotesModal,
        closeTripNotesModal,
        handleSaveTripNotes,
    };
}
