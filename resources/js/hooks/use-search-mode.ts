import { useEffect, useRef, useState } from 'react';

interface UseSearchModeOptions {
    mapInstance: mapboxgl.Map | null;
}

export function useSearchMode({ mapInstance }: UseSearchModeOptions) {
    const [isSearchMode, setIsSearchMode] = useState(false);
    const isSearchModeRef = useRef(false);

    // Update cursor based on search mode
    useEffect(() => {
        if (!mapInstance) return;

        // Update the ref for use in event handlers
        isSearchModeRef.current = isSearchMode;

        if (isSearchMode) {
            // Change cursor to magnifying glass (zoom-in) for search mode
            mapInstance.getCanvas().style.cursor = 'zoom-in';
        } else {
            // Restore crosshair cursor for normal mode
            mapInstance.getCanvas().style.cursor = 'crosshair';
        }
    }, [isSearchMode, mapInstance]);

    return {
        isSearchMode,
        setIsSearchMode,
        isSearchModeRef,
    } as const;
}
