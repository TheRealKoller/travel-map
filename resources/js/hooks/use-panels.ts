import { useEffect, useState } from 'react';

export type PanelType = 'markers' | 'tours' | 'routes' | 'ai';

interface PanelState {
    isOpen: boolean;
}

type PanelStates = Record<PanelType, PanelState>;

const STORAGE_KEY = 'desktop-panel-states';

/**
 * Unified hook for managing panel states across desktop and mobile
 *
 * Desktop behavior:
 * - Multiple panels can be open simultaneously
 * - State persisted to localStorage
 * - Uses Record<PanelType, PanelState> for state tracking
 *
 * Mobile behavior:
 * - Only one panel can be open at a time
 * - No state persistence
 * - Opening a new panel automatically closes the current one
 *
 * @param isMobile - Whether the current viewport is mobile
 */
export function usePanels(isMobile: boolean) {
    // Desktop: Track all panel states
    // Mobile: Track single active panel
    const [desktopPanelStates, setDesktopPanelStates] = useState<PanelStates>(
        () => {
            if (typeof window === 'undefined' || isMobile) {
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
        },
    );

    const [mobileActivePanel, setMobileActivePanel] =
        useState<PanelType | null>(null);

    // Persist desktop panel states to localStorage
    useEffect(() => {
        if (!isMobile) {
            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(desktopPanelStates),
                );
            } catch (error) {
                console.error('Failed to save panel states:', error);
            }
        }
    }, [desktopPanelStates, isMobile]);

    /**
     * Check if a panel is currently open
     */
    const isOpen = (panel: PanelType): boolean => {
        if (isMobile) {
            return mobileActivePanel === panel;
        }
        return desktopPanelStates[panel].isOpen;
    };

    /**
     * Open a specific panel
     * Desktop: Opens the panel (others stay as-is)
     * Mobile: Opens the panel and closes any other open panel
     */
    const openPanel = (panel: PanelType) => {
        if (isMobile) {
            setMobileActivePanel(panel);
        } else {
            setDesktopPanelStates((prev) => ({
                ...prev,
                [panel]: {
                    ...prev[panel],
                    isOpen: true,
                },
            }));
        }
    };

    /**
     * Close a specific panel
     */
    const closePanel = (panel: PanelType) => {
        if (isMobile) {
            if (mobileActivePanel === panel) {
                setMobileActivePanel(null);
            }
        } else {
            setDesktopPanelStates((prev) => ({
                ...prev,
                [panel]: {
                    ...prev[panel],
                    isOpen: false,
                },
            }));
        }
    };

    /**
     * Toggle a panel's open/closed state
     * Desktop: Toggles the panel independently
     * Mobile: Opens the panel if closed, closes it if open
     */
    const togglePanel = (panel: PanelType) => {
        if (isMobile) {
            setMobileActivePanel((current) =>
                current === panel ? null : panel,
            );
        } else {
            setDesktopPanelStates((prev) => ({
                ...prev,
                [panel]: {
                    ...prev[panel],
                    isOpen: !prev[panel].isOpen,
                },
            }));
        }
    };

    /**
     * Close all panels
     */
    const closeAllPanels = () => {
        if (isMobile) {
            setMobileActivePanel(null);
        } else {
            setDesktopPanelStates({
                markers: { isOpen: false },
                tours: { isOpen: false },
                routes: { isOpen: false },
                ai: { isOpen: false },
            });
        }
    };

    return {
        // State accessors
        isOpen,
        activePanel: isMobile ? mobileActivePanel : null,
        panelStates: isMobile ? undefined : desktopPanelStates,

        // Actions
        openPanel,
        closePanel,
        togglePanel,
        closeAllPanels,
    };
}
