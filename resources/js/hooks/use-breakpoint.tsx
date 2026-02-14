import { useSyncExternalStore } from 'react';

/**
 * Breakpoint definitions for responsive design
 * Based on common device sizes and Tailwind CSS defaults
 */
export const BREAKPOINTS = {
    mobile: 768, // < 768px: Mobile phones
    tablet: 1024, // 768px - 1024px: Tablets
    desktop: 1024, // >= 1024px: Desktop/laptop
} as const;

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Lazy initialization of MediaQueryList objects (SSR-safe)
 */
let mobileMql: MediaQueryList | null = null;
let tabletMql: MediaQueryList | null = null;
let desktopMql: MediaQueryList | null = null;

function getMediaQueryLists() {
    if (!isBrowser) {
        return { mobileMql: null, tabletMql: null, desktopMql: null };
    }

    if (!mobileMql) {
        mobileMql = window.matchMedia(
            `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
        );
    }
    if (!tabletMql) {
        tabletMql = window.matchMedia(
            `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
        );
    }
    if (!desktopMql) {
        desktopMql = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);
    }

    return { mobileMql, tabletMql, desktopMql };
}

/**
 * Subscribe to media query changes
 */
function mediaQueryListener(callback: () => void) {
    if (!isBrowser) return () => {};

    const handleChange = () => {
        // Invalidate cache when breakpoint changes
        cachedSnapshot = null;
        callback();
    };

    const { mobileMql, tabletMql, desktopMql } = getMediaQueryLists();

    mobileMql?.addEventListener('change', handleChange);
    tabletMql?.addEventListener('change', handleChange);
    desktopMql?.addEventListener('change', handleChange);

    // Also listen to resize for width/height changes
    window.addEventListener('resize', handleChange);

    return () => {
        mobileMql?.removeEventListener('change', handleChange);
        tabletMql?.removeEventListener('change', handleChange);
        desktopMql?.removeEventListener('change', handleChange);
        window.removeEventListener('resize', handleChange);
    };
}

/**
 * Cached snapshot to prevent infinite loops
 */
let cachedSnapshot: ReturnType<typeof createSnapshot> | null = null;

/**
 * Create a breakpoint snapshot
 */
function createSnapshot() {
    if (!isBrowser) {
        // SSR fallback: default to desktop layout
        return {
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            isMobileLayout: false,
            width: 1024,
            height: 768,
        };
    }

    const { mobileMql, tabletMql, desktopMql } = getMediaQueryLists();

    return {
        isMobile: mobileMql?.matches ?? false,
        isTablet: tabletMql?.matches ?? false,
        isDesktop: desktopMql?.matches ?? true,
        // For convenience: treat tablets as mobile for UI layout
        isMobileLayout:
            (mobileMql?.matches ?? false) || (tabletMql?.matches ?? false),
        width: window.innerWidth,
        height: window.innerHeight,
    };
}

/**
 * Get current breakpoint snapshot (cached)
 */
function getBreakpointSnapshot() {
    if (!cachedSnapshot) {
        cachedSnapshot = createSnapshot();
    }
    return cachedSnapshot;
}

/**
 * Get server-side snapshot (for SSR)
 */
function getServerSnapshot() {
    return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isMobileLayout: false,
        width: 1024,
        height: 768,
    };
}

/**
 * Hook for responsive breakpoint detection
 *
 * Returns an object with:
 * - isMobile: true if viewport width < 768px
 * - isTablet: true if viewport width is between 768px and 1024px
 * - isDesktop: true if viewport width >= 1024px
 * - isMobileLayout: true if mobile or tablet (< 1024px) - use this for UI decisions
 * - width: current window inner width
 * - height: current window inner height
 *
 * Uses useSyncExternalStore for React 18 compatibility and optimal re-rendering
 * SSR-safe: returns desktop defaults on server, hydrates to actual viewport on client
 */
export function useBreakpoint() {
    return useSyncExternalStore(
        mediaQueryListener,
        getBreakpointSnapshot,
        getServerSnapshot,
    );
}

/**
 * Legacy hook for backwards compatibility
 * Returns true if viewport is mobile-sized (< 768px)
 *
 * @deprecated Use useBreakpoint().isMobile instead
 */
export function useIsMobile() {
    const { isMobile } = useBreakpoint();
    return isMobile;
}
