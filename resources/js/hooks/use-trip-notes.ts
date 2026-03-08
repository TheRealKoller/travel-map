import { update as tripsUpdate } from '@/routes/trips';
import { Trip } from '@/types/trip';
import axios from 'axios';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';

interface UseTripNotesProps {
    selectedTripId: number | null;
    setTrips: Dispatch<SetStateAction<Trip[]>>;
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
    setTrips,
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
                const response = await axios.put<Trip>(
                    tripsUpdate.url(selectedTripId),
                    { notes },
                );

                const updatedTrip = response.data;
                setTrips((prev) =>
                    prev.map((t) =>
                        t.id === updatedTrip.id ? updatedTrip : t,
                    ),
                );
            } catch (error) {
                console.error('Failed to save trip notes:', error);
                throw error;
            }
        },
        [selectedTripId, setTrips],
    );

    return {
        isTripNotesModalOpen,
        openTripNotesModal,
        closeTripNotesModal,
        handleSaveTripNotes,
    };
}
