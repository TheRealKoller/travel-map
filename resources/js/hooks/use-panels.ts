import { useCallback, useEffect, useRef, useState } from 'react';

export type PanelType = 'markers' | 'tours' | 'routes' | 'ai';

interface PanelState {
    isOpen: boolean;
}

type PanelStates = Record<PanelType, PanelState>;

const STORAGE_KEY = 'panel-states';
const OLD_STORAGE_KEY = 'desktop-panel-states'; // For migration

/**
 * Default panel states (all closed)
 */
const DEFAULT_PANEL_STATES: PanelStates = {
    markers: { isOpen: false },
    tours: { isOpen: false },
    routes: { isOpen: false },
    ai: { isOpen: false },
};

/**
 * Validate and sanitize stored panel states
 * Ensures the data structure is valid and contains all required panels
 */
function validatePanelStates(data: unknown): PanelStates | null {
    if (!data || typeof data !== 'object') {
        return null;
    }

    const panels: PanelType[] = ['markers', 'tours', 'routes', 'ai'];
    const validated: Partial<PanelStates> = {};

    for (const panel of panels) {
        const panelData = (data as Record<string, unknown>)[panel];
        if (
            panelData &&
            typeof panelData === 'object' &&
            'isOpen' in panelData &&
            typeof (panelData as { isOpen: unknown }).isOpen === 'boolean'
        ) {
            validated[panel] = panelData as PanelState;
        } else {
            // Missing or invalid panel data - use default
            validated[panel] = { isOpen: false };
        }
    }

    return validated as PanelStates;
}

/**
 * Load panel states from localStorage with validation and migration
 * Only loads on desktop (isMobileLayout = false)
 */
function loadPanelStates(isMobileLayout: boolean): PanelStates {
    if (typeof window === 'undefined' || isMobileLayout) {
        // SSR or mobile: use defaults
        return { ...DEFAULT_PANEL_STATES };
    }

    try {
        // Try new storage key first
        let stored = localStorage.getItem(STORAGE_KEY);
        let isFromOldKey = false;

        // If not found, try migrating from old key
        if (!stored) {
            stored = localStorage.getItem(OLD_STORAGE_KEY);
            isFromOldKey = true;
        }

        if (stored) {
            const parsed = JSON.parse(stored);
            const validated = validatePanelStates(parsed);

            if (validated) {
                // If we migrated from old key, save to new key
                if (isFromOldKey) {
                    localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(validated),
                    );
                    localStorage.removeItem(OLD_STORAGE_KEY);
                }
                return validated;
            }
        }
    } catch (error) {
        console.error('Failed to load stored panel states:', error);
    }

    return { ...DEFAULT_PANEL_STATES };
}

/**
 * Unified hook for managing panel states across desktop and mobile layouts
 *
 * Features:
 * - Maintains shared state regardless of current layout (desktop/mobile)
 * - Desktop mode: Multiple panels can be open simultaneously
 * - Mobile mode: Only one panel active at a time (auto-closes others)
 * - Seamless state preservation when switching between breakpoints
 * - localStorage persistence for desktop panel states
 * - Handles edge cases like window resize, rotation, zoom
 *
 * @param isMobileLayout - Whether to use mobile layout behavior (< 1024px)
 */
export function usePanels(isMobileLayout: boolean) {
    // Core state: tracks which panels are open
    // This state is preserved across breakpoint changes
    const [panelStates, setPanelStates] = useState<PanelStates>(() =>
        loadPanelStates(isMobileLayout),
    );

    // Track the active panel for mobile mode
    // This is derived from panelStates but enforces single-panel constraint
    const [mobileActivePanel, setMobileActivePanel] =
        useState<PanelType | null>(() => {
            // On initial mount, if we're in mobile mode, find the first open panel
            const openPanel = (
                Object.entries(panelStates) as [PanelType, PanelState][]
            ).find(([, state]) => state.isOpen)?.[0];
            return openPanel || null;
        });

    // Persist desktop panel states to localStorage
    useEffect(() => {
        if (!isMobileLayout) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(panelStates));
            } catch (error) {
                console.error('Failed to save panel states:', error);
            }
        }
    }, [panelStates, isMobileLayout]);

    // Handle breakpoint changes: enforce mobile constraints when switching to mobile
    // Using useRef to track previous layout to avoid unnecessary updates
    const prevIsMobileLayoutRef = useRef(isMobileLayout);

    useEffect(() => {
        // Only process when transitioning TO mobile layout (not on every render)
        const wasDesktop = !prevIsMobileLayoutRef.current;
        const isNowMobile = isMobileLayout;

        if (isNowMobile && wasDesktop) {
            // When switching from desktop to mobile, ensure only one panel is open
            const openPanels = (
                Object.entries(panelStates) as [PanelType, PanelState][]
            ).filter(([, state]) => state.isOpen);

            // Schedule state updates asynchronously to avoid cascading renders
            queueMicrotask(() => {
                if (openPanels.length > 1) {
                    // Multiple panels open - close all except the first one
                    const firstPanel = openPanels[0][0];
                    setPanelStates({
                        markers: { isOpen: firstPanel === 'markers' },
                        tours: { isOpen: firstPanel === 'tours' },
                        routes: { isOpen: firstPanel === 'routes' },
                        ai: { isOpen: firstPanel === 'ai' },
                    });
                    setMobileActivePanel(firstPanel);
                } else if (openPanels.length === 1) {
                    setMobileActivePanel(openPanels[0][0]);
                } else {
                    setMobileActivePanel(null);
                }
            });
        }

        // Update the previous layout reference
        prevIsMobileLayoutRef.current = isMobileLayout;
        // Note: We don't need to do anything when switching to desktop
        // Desktop can handle multiple panels, so we just preserve the state
    }, [isMobileLayout, panelStates]);

    /**
     * Check if a panel is currently open
     */
    const isOpen = useCallback(
        (panel: PanelType): boolean => {
            return panelStates[panel].isOpen;
        },
        [panelStates],
    );

    /**
     * Open a specific panel
     * Desktop: Opens the panel (others stay as-is)
     * Mobile: Opens the panel and closes any other open panel
     */
    const openPanel = useCallback(
        (panel: PanelType) => {
            if (isMobileLayout) {
                // Mobile: close all others, open this one
                setPanelStates({
                    markers: { isOpen: panel === 'markers' },
                    tours: { isOpen: panel === 'tours' },
                    routes: { isOpen: panel === 'routes' },
                    ai: { isOpen: panel === 'ai' },
                });
                setMobileActivePanel(panel);
            } else {
                // Desktop: just open this panel
                setPanelStates((prev) => ({
                    ...prev,
                    [panel]: { isOpen: true },
                }));
            }
        },
        [isMobileLayout],
    );

    /**
     * Close a specific panel
     */
    const closePanel = useCallback(
        (panel: PanelType) => {
            setPanelStates((prev) => ({
                ...prev,
                [panel]: { isOpen: false },
            }));

            if (isMobileLayout && mobileActivePanel === panel) {
                setMobileActivePanel(null);
            }
        },
        [isMobileLayout, mobileActivePanel],
    );

    /**
     * Toggle a panel's open/closed state
     * Desktop: Toggles the panel independently
     * Mobile: Opens the panel if closed, closes it if open
     */
    const togglePanel = useCallback(
        (panel: PanelType) => {
            const currentlyOpen = panelStates[panel].isOpen;

            if (isMobileLayout) {
                if (currentlyOpen) {
                    // Close this panel
                    closePanel(panel);
                } else {
                    // Open this panel (and close others)
                    openPanel(panel);
                }
            } else {
                // Desktop: simple toggle
                setPanelStates((prev) => ({
                    ...prev,
                    [panel]: { isOpen: !prev[panel].isOpen },
                }));
            }
        },
        [panelStates, isMobileLayout, openPanel, closePanel],
    );

    /**
     * Close all panels
     */
    const closeAllPanels = useCallback(() => {
        setPanelStates({
            markers: { isOpen: false },
            tours: { isOpen: false },
            routes: { isOpen: false },
            ai: { isOpen: false },
        });
        setMobileActivePanel(null);
    }, []);

    return {
        // State accessors
        isOpen,
        activePanel: isMobileLayout ? mobileActivePanel : null,
        panelStates,

        // Actions
        openPanel,
        closePanel,
        togglePanel,
        closeAllPanels,
    };
}
