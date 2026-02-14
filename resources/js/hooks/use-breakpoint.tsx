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
 * Media query list for mobile detection
 */
const mobileMql = window.matchMedia(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);

/**
 * Media query list for tablet detection
 */
const tabletMql = window.matchMedia(
    `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
);

/**
 * Media query list for desktop detection
 */
const desktopMql = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);

/**
 * Subscribe to media query changes
 */
function mediaQueryListener(callback: (event: MediaQueryListEvent) => void) {
    mobileMql.addEventListener('change', callback);
    tabletMql.addEventListener('change', callback);
    desktopMql.addEventListener('change', callback);

    return () => {
        mobileMql.removeEventListener('change', callback);
        tabletMql.removeEventListener('change', callback);
        desktopMql.removeEventListener('change', callback);
    };
}

/**
 * Get current breakpoint snapshot
 */
function getBreakpointSnapshot() {
    return {
        isMobile: mobileMql.matches,
        isTablet: tabletMql.matches,
        isDesktop: desktopMql.matches,
        // For convenience: treat tablets as mobile for UI layout
        isMobileLayout: mobileMql.matches || tabletMql.matches,
        width: window.innerWidth,
        height: window.innerHeight,
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
 */
export function useBreakpoint() {
    return useSyncExternalStore(mediaQueryListener, getBreakpointSnapshot);
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
