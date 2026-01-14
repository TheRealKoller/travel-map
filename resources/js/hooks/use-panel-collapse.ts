import { useEffect, useState } from 'react';

interface UsePanelCollapseOptions {
    mapInstance: mapboxgl.Map | null;
}

export function usePanelCollapse({ mapInstance }: UsePanelCollapseOptions) {
    const [isTourPanelCollapsed, setIsTourPanelCollapsed] = useState(true);
    const [isRoutePanelCollapsed, setIsRoutePanelCollapsed] = useState(true);

    // Resize map when panels are collapsed/expanded
    useEffect(() => {
        if (mapInstance) {
            // Use setTimeout to ensure the DOM has updated before resizing
            setTimeout(() => {
                mapInstance.resize();
            }, 100);
        }
    }, [isTourPanelCollapsed, isRoutePanelCollapsed, mapInstance]);

    return {
        isTourPanelCollapsed,
        setIsTourPanelCollapsed,
        isRoutePanelCollapsed,
        setIsRoutePanelCollapsed,
    } as const;
}
