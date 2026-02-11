import { useState } from 'react';

export type PanelType = 'markers' | 'tours' | 'routes';
export type SnapPoint = 'closed' | 'peek' | 'half' | 'full';

interface PanelState {
    isOpen: boolean;
    snapPoint: SnapPoint;
}

export function useMobilePanels() {
    const [activePanel, setActivePanel] = useState<PanelType>('markers');
    const [panelStates, setPanelStates] = useState<
        Record<PanelType, PanelState>
    >({
        markers: { isOpen: true, snapPoint: 'peek' },
        tours: { isOpen: false, snapPoint: 'closed' },
        routes: { isOpen: false, snapPoint: 'closed' },
    });

    const openPanel = (panel: PanelType, snapPoint: SnapPoint = 'half') => {
        setPanelStates((prev) => {
            const newStates = { ...prev };
            // Close all panels first
            Object.keys(newStates).forEach((key) => {
                newStates[key as PanelType] = {
                    isOpen: false,
                    snapPoint: 'closed',
                };
            });
            // Open the requested panel
            newStates[panel] = { isOpen: true, snapPoint };
            return newStates;
        });
        setActivePanel(panel);
    };

    const closePanel = (panel: PanelType) => {
        setPanelStates((prev) => ({
            ...prev,
            [panel]: { isOpen: false, snapPoint: 'closed' },
        }));
    };

    const updatePanelSnapPoint = (panel: PanelType, snapPoint: SnapPoint) => {
        setPanelStates((prev) => ({
            ...prev,
            [panel]: {
                ...prev[panel],
                snapPoint,
                isOpen: snapPoint !== 'closed',
            },
        }));
    };

    const togglePanel = (panel: PanelType) => {
        const currentState = panelStates[panel];
        if (currentState.isOpen && currentState.snapPoint !== 'peek') {
            // If open and not peeking, close it
            closePanel(panel);
        } else if (currentState.isOpen && currentState.snapPoint === 'peek') {
            // If peeking, expand to half
            updatePanelSnapPoint(panel, 'half');
        } else {
            // If closed, open to peek
            openPanel(panel, 'peek');
        }
    };

    return {
        activePanel,
        setActivePanel,
        panelStates,
        openPanel,
        closePanel,
        updatePanelSnapPoint,
        togglePanel,
    };
}
