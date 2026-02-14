import { useEffect, useState } from 'react';

export type DesktopPanelType = 'markers' | 'tours' | 'routes' | 'ai';

interface PanelState {
    isOpen: boolean;
}

type PanelStates = Record<DesktopPanelType, PanelState>;

const STORAGE_KEY = 'desktop-panel-states';

/**
 * Hook for managing desktop floating panel states
 *
 * Features:
 * - Manages open/closed state for all panels
 * - Persists state to localStorage
 * - Multiple panels can be open simultaneously
 * - Separate state management for left (markers, tours) and right (routes, ai) panels
 */
export function useDesktopPanels() {
    // Initialize state from localStorage or defaults
    const [panelStates, setPanelStates] = useState<PanelStates>(() => {
        if (typeof window === 'undefined') {
            return {
                markers: { isOpen: false },
                tours: { isOpen: false },
                routes: { isOpen: false },
                ai: { isOpen: false },
            };
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to parse stored panel states:', error);
        }

        return {
            markers: { isOpen: false },
            tours: { isOpen: false },
            routes: { isOpen: false },
            ai: { isOpen: false },
        };
    });

    // Persist to localStorage whenever states change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(panelStates));
        } catch (error) {
            console.error('Failed to save panel states:', error);
        }
    }, [panelStates]);

    /**
     * Toggle a panel's open/closed state
     */
    const togglePanel = (panel: DesktopPanelType) => {
        setPanelStates((prev) => ({
            ...prev,
            [panel]: {
                ...prev[panel],
                isOpen: !prev[panel].isOpen,
            },
        }));
    };

    /**
     * Open a specific panel
     */
    const openPanel = (panel: DesktopPanelType) => {
        setPanelStates((prev) => ({
            ...prev,
            [panel]: {
                ...prev[panel],
                isOpen: true,
            },
        }));
    };

    /**
     * Close a specific panel
     */
    const closePanel = (panel: DesktopPanelType) => {
        setPanelStates((prev) => ({
            ...prev,
            [panel]: {
                ...prev[panel],
                isOpen: false,
            },
        }));
    };

    /**
     * Close all panels
     */
    const closeAllPanels = () => {
        setPanelStates({
            markers: { isOpen: false },
            tours: { isOpen: false },
            routes: { isOpen: false },
            ai: { isOpen: false },
        });
    };

    return {
        panelStates,
        togglePanel,
        openPanel,
        closePanel,
        closeAllPanels,
    };
}
