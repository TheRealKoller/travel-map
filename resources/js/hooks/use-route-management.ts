import { PanelType } from '@/hooks/use-panels';
import { Route } from '@/types/route';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RouteRequest {
    startMarkerId: string;
    endMarkerId: string;
}

interface UseRouteManagementProps {
    routesRef: React.MutableRefObject<Route[]>;
    isMobileLayout: boolean;
    isOpen: (panel: PanelType) => boolean;
    togglePanel: (panel: PanelType) => void;
}

interface UseRouteManagementReturn {
    routeRequest: RouteRequest | null;
    highlightedRouteId: number | null;
    expandedRoutes: Set<number>;
    handleRequestRoute: (startMarkerId: string, endMarkerId: string) => void;
    handleRouteClick: (routeId: number) => void;
    setExpandedRoutes: (
        routes: Set<number> | ((prev: Set<number>) => Set<number>),
    ) => void;
    setHighlightedRouteId: (id: number | null) => void;
    handleRouteClickRef: React.MutableRefObject<
        ((routeId: number) => void) | null
    >;
}

/**
 * Custom hook for managing route-related state and interactions
 * Combines: routeRequest, highlightedRouteId, expandedRoutes states
 */
export function useRouteManagement({
    routesRef,
    isMobileLayout,
    isOpen,
    togglePanel,
}: UseRouteManagementProps): UseRouteManagementReturn {
    // State for pre-filling route form from tour view
    const [routeRequest, setRouteRequest] = useState<RouteRequest | null>(null);

    // State for highlighting a route in the route panel
    const [highlightedRouteId, setHighlightedRouteId] = useState<number | null>(
        null,
    );

    // State for tracking which routes are expanded in the route panel
    const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(
        new Set(),
    );

    // Ref to store the handleRouteClick callback for use in useRoutes
    const handleRouteClickRef = useRef<((routeId: number) => void) | null>(
        null,
    );

    /**
     * Handler for requesting a route between two markers
     * Opens the routes panel and highlights/expands existing routes
     */
    const handleRequestRoute = useCallback(
        (startMarkerId: string, endMarkerId: string) => {
            setRouteRequest({ startMarkerId, endMarkerId });

            // Find if a route already exists between these markers
            const existingRoute = routesRef.current.find(
                (route) =>
                    (route.start_marker.id === startMarkerId &&
                        route.end_marker.id === endMarkerId) ||
                    (route.start_marker.id === endMarkerId &&
                        route.end_marker.id === startMarkerId),
            );

            // Highlight the route if it exists
            if (existingRoute) {
                setHighlightedRouteId(existingRoute.id);
                // Expand the route in the panel
                setExpandedRoutes(
                    (prev) => new Set([...prev, existingRoute.id]),
                );
            } else {
                setHighlightedRouteId(null);
            }

            // Open the routes panel on desktop, it will be the active panel on mobile
            if (!isMobileLayout) {
                // Open routes panel if not open
                if (!isOpen('routes')) {
                    togglePanel('routes');
                }
            }
        },
        [routesRef, isMobileLayout, isOpen, togglePanel],
    );

    /**
     * Handler for route clicks on the map
     * Uses the same logic as handleRequestRoute to ensure consistent behavior
     */
    const handleRouteClick = useCallback(
        (routeId: number) => {
            const route = routesRef.current.find((r) => r.id === routeId);
            if (!route) return;

            // Use the same logic as handleRequestRoute to ensure consistent behavior
            handleRequestRoute(route.start_marker.id, route.end_marker.id);
        },
        [routesRef, handleRequestRoute],
    );

    // Store handleRouteClick in ref for use in useRoutes hook
    useEffect(() => {
        handleRouteClickRef.current = handleRouteClick;
    }, [handleRouteClick]);

    return {
        routeRequest,
        highlightedRouteId,
        expandedRoutes,
        handleRequestRoute,
        handleRouteClick,
        setExpandedRoutes,
        setHighlightedRouteId,
        handleRouteClickRef,
    };
}
