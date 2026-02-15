import { PanelType } from '@/hooks/use-panels';
import { useCallback, useEffect, useState } from 'react';

interface UseAvailableMarkerSelectionProps {
    selectedTourId: number | null;
    handleToggleMarkerInTour: (
        markerId: string,
        tourId: number,
        isRemoving: boolean,
    ) => Promise<void>;
    handleAddMarkerToTour: (markerId: string) => Promise<boolean>;
    isOpen: (panel: PanelType) => boolean;
    togglePanel: (panel: PanelType) => void;
}

interface UseAvailableMarkerSelectionReturn {
    selectedAvailableMarkerId: string | null;
    handleSelectAvailableMarker: (markerId: string | null) => void;
    handleAddAvailableMarkerToTour: (markerId: string) => Promise<void>;
    handleRemoveMarkerFromTour: (markerId: string) => Promise<void>;
}

/**
 * Custom hook for managing available marker selection in the tour context
 * Handles the blue ring highlight and add/remove operations
 */
export function useAvailableMarkerSelection({
    selectedTourId,
    handleToggleMarkerInTour,
    handleAddMarkerToTour,
    isOpen,
    togglePanel,
}: UseAvailableMarkerSelectionProps): UseAvailableMarkerSelectionReturn {
    // State for selected available marker (for blue ring highlight in Available Markers section)
    const [selectedAvailableMarkerId, setSelectedAvailableMarkerId] = useState<
        string | null
    >(null);

    // Clear selected available marker when tour changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentionally clearing state when tour changes
        setSelectedAvailableMarkerId(null);
    }, [selectedTourId]);

    // Auto-open tour panel when an available marker is selected
    useEffect(() => {
        if (selectedAvailableMarkerId && !isOpen('tours')) {
            togglePanel('tours');
        }
    }, [selectedAvailableMarkerId, isOpen, togglePanel]);

    /**
     * Handler for selecting an available marker (shows blue ring on map)
     */
    const handleSelectAvailableMarker = useCallback(
        (markerId: string | null) => {
            setSelectedAvailableMarkerId(markerId);
        },
        [],
    );

    /**
     * Handler for adding an available marker to the current tour
     */
    const handleAddAvailableMarkerToTour = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;
            const success = await handleAddMarkerToTour(markerId);
            // Only clear selection if add was successful
            if (success) {
                setSelectedAvailableMarkerId(null);
            }
        },
        [selectedTourId, handleAddMarkerToTour],
    );

    /**
     * Handler for removing marker from tour
     */
    const handleRemoveMarkerFromTour = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;
            await handleToggleMarkerInTour(markerId, selectedTourId, true);
        },
        [selectedTourId, handleToggleMarkerInTour],
    );

    return {
        selectedAvailableMarkerId,
        handleSelectAvailableMarker,
        handleAddAvailableMarkerToTour,
        handleRemoveMarkerFromTour,
    };
}
