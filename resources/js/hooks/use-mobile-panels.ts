import { useState } from 'react';

export type MobilePanelType = 'markers' | 'tours' | 'routes' | 'ai' | null;

/**
 * useMobilePanels - State management for mobile bottom sheets (Phase 3)
 *
 * On mobile, only one panel can be open at a time.
 * Panels are displayed as draggable bottom sheets.
 */
export function useMobilePanels() {
    const [activePanel, setActivePanel] = useState<MobilePanelType>(null);

    const openPanel = (panel: MobilePanelType) => {
        setActivePanel(panel);
    };

    const closePanel = () => {
        setActivePanel(null);
    };

    const togglePanel = (panel: Exclude<MobilePanelType, null>) => {
        setActivePanel((current) => (current === panel ? null : panel));
    };

    return {
        activePanel,
        openPanel,
        closePanel,
        togglePanel,
    };
}
