import { AiRecommendationsPanel } from '@/components/ai-recommendations-panel';
import { DraggableSheet } from '@/components/draggable-sheet';
import { FloatingPanel } from '@/components/floating-panel';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import { MobileNavigation } from '@/components/mobile-navigation';
import RoutePanel from '@/components/route-panel';
import { TabButton } from '@/components/tab-button';
import { Toolbar } from '@/components/toolbar';
import TourPanel from '@/components/tour-panel';
import TripNotesModal from '@/components/trip-notes-modal';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useGeocoder } from '@/hooks/use-geocoder';
import { useLanguage } from '@/hooks/use-language';
import { useMapInstance } from '@/hooks/use-map-instance';
import { useMapInteractions } from '@/hooks/use-map-interactions';
import { useMarkerStyling } from '@/hooks/use-marker-styling';
import { useMarkers } from '@/hooks/use-markers';
import { usePanels } from '@/hooks/use-panels';
import { usePlaceTypes } from '@/hooks/use-place-types';
import { useRoutes } from '@/hooks/use-routes';
import { useSearchMode } from '@/hooks/use-search-mode';
import { useSearchRadius } from '@/hooks/use-search-radius';
import { useSearchResults } from '@/hooks/use-search-results';
import { useTourMarkers } from '@/hooks/use-tour-markers';
import { getBoundingBoxFromTrip } from '@/lib/map-utils';
import { update as tripsUpdate } from '@/routes/trips';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { AnimatePresence } from 'framer-motion';
import { Bot, List, Map as MapIcon, Route as RouteIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TravelMapProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    trips: Trip[];
    onToursUpdate: (tours: Tour[]) => void;
    onReloadTours: () => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    onSetViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<void>;
}

/**
 * Phase 3: Travel Map Component with Mobile Bottom Sheets
 *
 * Desktop view (Phase 2):
 * - Left side: Markers and Tours panels
 * - Right side: Routes and AI panels
 * - Multiple panels can be open simultaneously
 * - Panels float over the map with semi-transparent backgrounds
 *
 * Mobile view (Phase 3):
 * - Bottom navigation bar with 4 icons (Markers, Tours, Routes, AI)
 * - Draggable bottom sheets for panel content
 * - Only one panel can be open at a time
 */
export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    trips,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    onSetViewport,
}: TravelMapProps) {
    const { t } = useTranslation();

    // Detect mobile/desktop breakpoint
    const { isMobileLayout } = useBreakpoint();

    // Unified panel management with shared state across breakpoints
    const { isOpen, activePanel, togglePanel, closePanel, closeAllPanels } =
        usePanels(isMobileLayout);

    // Helper for mobile: close the currently active panel
    const closeMobilePanel = () => {
        if (activePanel) {
            closePanel(activePanel);
        }
    };

    // Handle Escape key to close all panels
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeAllPanels();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [closeAllPanels]);

    // Get current language setting
    const { language } = useLanguage();

    // Initialize map instance with language support
    const { mapRef, mapInstance } = useMapInstance({ language });

    // Get the selected trip to access its country
    const selectedTrip = trips.find((t) => t.id === selectedTripId);

    // State for map bounds (for AI recommendations)
    const [mapBounds, setMapBounds] = useState<{
        north: number;
        south: number;
        east: number;
        west: number;
    } | null>(null);

    // Search mode management
    const { isSearchMode, setIsSearchMode, isSearchModeRef } = useSearchMode({
        mapInstance,
    });

    // Search radius management
    const { searchRadius, setSearchRadius } = useSearchRadius();

    // Place types management
    const { placeTypes, selectedPlaceType, setSelectedPlaceType } =
        usePlaceTypes();

    // Trip notes modal state
    const [isTripNotesModalOpen, setIsTripNotesModalOpen] = useState(false);

    // State for pre-filling route form from tour view
    const [routeRequest, setRouteRequest] = useState<{
        startMarkerId: string;
        endMarkerId: string;
    } | null>(null);

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

    // Marker management
    const {
        markers,
        setMarkers,
        selectedMarkerId,
        setSelectedMarkerId,
        addMarker,
        updateMarkerReference,
        handleSaveMarker,
        handleDeleteMarker,
        handleCloseForm,
    } = useMarkers({
        mapInstance,
        selectedTripId,
        selectedTourId,
        onMarkerClick: (id: string) => {
            setSelectedMarkerId(id);
        },
    });

    // Get the selected marker object
    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    // Routes management
    const { routes, setRoutes } = useRoutes({
        mapInstance,
        selectedTripId,
        selectedTourId,
        tours,
        expandedRoutes,
        highlightedRouteId,
        onRouteClick: (routeId: number) => {
            if (handleRouteClickRef.current) {
                handleRouteClickRef.current(routeId);
            }
        },
    });

    // Tour markers management
    const {
        handleToggleMarkerInTour,
        handleAddMarkerToTour,
        handleMoveMarkerUp,
        handleMoveMarkerDown,
    } = useTourMarkers({
        selectedTripId,
        selectedTourId,
        tours,
        onToursUpdate,
    });

    // Search results management
    useSearchResults({
        mapInstance,
        onMarkerCreated: addMarker,
        onMarkerSelected: setSelectedMarkerId,
    });

    // Marker styling (highlight + grey out by tour)
    useMarkerStyling({
        mapInstance,
        markers,
        selectedMarkerId,
        selectedTourId,
        tours,
        onMarkerUpdated: updateMarkerReference,
        onMarkerClick: setSelectedMarkerId,
    });

    // Geocoder - provides callbacks for SearchBox component
    const { handleSearchResult } = useGeocoder({
        mapInstance,
        onMarkerCreated: addMarker,
        onMarkerSelected: setSelectedMarkerId,
    });

    // Map interactions (POI clicks, etc.)
    useMapInteractions({
        mapInstance,
        isSearchModeRef,
        onMarkerCreated: addMarker,
        onMarkerSelected: setSelectedMarkerId,
    });

    // Auto-open markers panel when a marker is selected
    useEffect(() => {
        if (selectedMarkerId && !isOpen('markers')) {
            if (isMobileLayout) {
                // Mobile: open markers panel (closes other panels)
                togglePanel('markers');
            } else {
                // Desktop: open markers panel (keeps others open)
                togglePanel('markers');
            }
        }
    }, [selectedMarkerId, isOpen, togglePanel, isMobileLayout]);

    // Handler for removing marker from tour
    const handleRemoveMarkerFromTour = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;
            await handleToggleMarkerInTour(markerId, selectedTourId, true);
        },
        [selectedTourId, handleToggleMarkerInTour],
    );

    // Handler for updating a tour after sorting
    const handleTourUpdate = useCallback(
        (updatedTour: Tour) => {
            const updatedTours = tours.map((tour) =>
                tour.id === updatedTour.id ? updatedTour : tour,
            );
            onToursUpdate(updatedTours);
        },
        [tours, onToursUpdate],
    );

    // Handler for requesting a route between two markers
    const handleRequestRoute = useCallback(
        (startMarkerId: string, endMarkerId: string) => {
            setRouteRequest({ startMarkerId, endMarkerId });

            // Find if a route already exists between these markers
            const existingRoute = routes.find(
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
        [routes, isMobileLayout, isOpen, togglePanel],
    );

    // Handler for route clicks on the map
    const handleRouteClick = useCallback(
        (routeId: number) => {
            const route = routes.find((r) => r.id === routeId);
            if (!route) return;

            // Use the same logic as handleRequestRoute to ensure consistent behavior
            handleRequestRoute(route.start_marker.id, route.end_marker.id);
        },
        [routes, handleRequestRoute],
    );

    // Store handleRouteClick in ref for use in useRoutes hook
    useEffect(() => {
        handleRouteClickRef.current = handleRouteClick;
    }, [handleRouteClick]);

    // Update map bounds for AI recommendations
    useEffect(() => {
        if (!mapInstance) return;

        const updateBounds = () => {
            const bounds = mapInstance.getBounds();
            if (!bounds) return;
            setMapBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        };

        // Update immediately
        updateBounds();

        // Update on moveend
        mapInstance.on('moveend', updateBounds);

        return () => {
            mapInstance.off('moveend', updateBounds);
        };
    }, [mapInstance]);

    // Listen for custom event to set viewport (triggered by trip notes modal)
    useEffect(() => {
        if (!mapInstance || !onSetViewport) return;

        const handleSetViewportEvent = (event: CustomEvent) => {
            const { tripId, viewport } = event.detail;
            onSetViewport(tripId, viewport);
        };

        window.addEventListener(
            'trip:set-viewport',
            handleSetViewportEvent as EventListener,
        );

        return () => {
            window.removeEventListener(
                'trip:set-viewport',
                handleSetViewportEvent as EventListener,
            );
        };
    }, [mapInstance, onSetViewport]);

    // Apply saved viewport when switching trips
    useEffect(() => {
        if (!mapInstance || !selectedTripId) return;

        const trip = trips.find((t) => t.id === selectedTripId);
        if (
            trip &&
            trip.viewport_latitude !== null &&
            trip.viewport_longitude !== null &&
            trip.viewport_zoom !== null &&
            !isNaN(trip.viewport_latitude) &&
            !isNaN(trip.viewport_longitude) &&
            !isNaN(trip.viewport_zoom)
        ) {
            mapInstance.flyTo({
                center: [trip.viewport_longitude, trip.viewport_latitude],
                zoom: trip.viewport_zoom,
                essential: true,
            });
        }
    }, [selectedTripId, mapInstance, trips]);

    // Handler for saving trip notes
    const handleSaveTripNotes = async (notes: string) => {
        if (!selectedTripId) return;

        try {
            const response = await fetch(tripsUpdate.url(selectedTripId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) {
                throw new Error('Failed to update trip notes');
            }

            // Update the local trips state with the new notes
            const trip = trips.find((t) => t.id === selectedTripId);
            if (trip) {
                trip.notes = notes;
            }
        } catch (error) {
            console.error('Failed to save trip notes:', error);
            throw error;
        }
    };

    return (
        <div className="relative h-full w-full">
            {/* Toolbar at the top */}
            <Toolbar
                onSearchResult={handleSearchResult}
                countries={
                    selectedTrip?.country ? [selectedTrip.country] : undefined
                }
                bbox={getBoundingBoxFromTrip(selectedTrip)}
                isSearchMode={isSearchMode}
                onSearchModeChange={setIsSearchMode}
                searchRadius={searchRadius}
                onSearchRadiusChange={setSearchRadius}
                placeTypes={placeTypes}
                selectedPlaceType={selectedPlaceType}
                onPlaceTypeChange={setSelectedPlaceType}
            />

            {/* Map fills the entire screen */}
            <div
                className="absolute inset-0 h-full w-full"
                data-testid="map-panel"
            >
                <div ref={mapRef} id="map" className="h-full w-full" />
            </div>

            {/* Desktop Floating Panels - Phase 2 */}
            {!isMobileLayout && (
                <>
                    {/* Left side tab buttons */}
                    <div className="absolute top-1/4 left-0 z-20 flex flex-col gap-2">
                        <TabButton
                            icon={List}
                            label={t('panels.markers', 'Markers')}
                            isActive={isOpen('markers')}
                            onClick={() => togglePanel('markers')}
                            position="left"
                        />
                        <TabButton
                            icon={MapIcon}
                            label={t('panels.tours', 'Tours')}
                            isActive={isOpen('tours')}
                            onClick={() => togglePanel('tours')}
                            position="left"
                        />
                    </div>

                    {/* Right side tab buttons */}
                    <div className="absolute top-1/4 right-0 z-20 flex flex-col gap-2">
                        <TabButton
                            icon={RouteIcon}
                            label={t('panels.routes', 'Routes')}
                            isActive={isOpen('routes')}
                            onClick={() => togglePanel('routes')}
                            position="right"
                        />
                        <TabButton
                            icon={Bot}
                            label={t('panels.ai', 'AI')}
                            isActive={isOpen('ai')}
                            onClick={() => togglePanel('ai')}
                            position="right"
                        />
                    </div>

                    {/* Left side floating panels */}
                    <FloatingPanel
                        id="markers-panel"
                        isOpen={isOpen('markers')}
                        onClose={() => closePanel('markers')}
                        position="left"
                        title={t('panels.markers', 'Markers')}
                    >
                        {selectedMarkerId ? (
                            <MarkerForm
                                key={selectedMarkerId}
                                marker={selectedMarker}
                                onSave={handleSaveMarker}
                                onDeleteMarker={handleDeleteMarker}
                                onClose={handleCloseForm}
                                tours={tours}
                                onToggleMarkerInTour={handleToggleMarkerInTour}
                            />
                        ) : (
                            <MarkerList
                                markers={markers}
                                selectedMarkerId={selectedMarkerId}
                                onSelectMarker={setSelectedMarkerId}
                                selectedTourId={selectedTourId}
                                onAddMarkerToTour={handleAddMarkerToTour}
                                onMarkerImageFetched={(markerId, imageUrl) => {
                                    const updatedMarkers = markers.map((m) =>
                                        m.id === markerId
                                            ? { ...m, imageUrl }
                                            : m,
                                    );
                                    setMarkers([...updatedMarkers]);
                                }}
                            />
                        )}
                    </FloatingPanel>

                    <FloatingPanel
                        id="tours-panel"
                        isOpen={isOpen('tours')}
                        onClose={() => closePanel('tours')}
                        position="left"
                        title={t('panels.tours', 'Tours')}
                    >
                        <TourPanel
                            tours={tours}
                            selectedTourId={selectedTourId}
                            onSelectTour={onSelectTour}
                            onCreateTour={onCreateTour}
                            onDeleteTour={onDeleteTour}
                            markers={markers}
                            routes={routes}
                            onMoveMarkerUp={handleMoveMarkerUp}
                            onMoveMarkerDown={handleMoveMarkerDown}
                            onRemoveMarkerFromTour={handleRemoveMarkerFromTour}
                            onRequestRoute={handleRequestRoute}
                        />
                    </FloatingPanel>

                    {/* Right side floating panels */}
                    {selectedTripId && (
                        <FloatingPanel
                            id="routes-panel"
                            isOpen={isOpen('routes')}
                            onClose={() => closePanel('routes')}
                            position="right"
                            title={t('panels.routes', 'Routes')}
                        >
                            <RoutePanel
                                tripId={selectedTripId}
                                tourId={selectedTourId}
                                markers={markers}
                                routes={routes}
                                onRoutesUpdate={setRoutes}
                                initialStartMarkerId={
                                    routeRequest?.startMarkerId
                                }
                                initialEndMarkerId={routeRequest?.endMarkerId}
                                tours={tours}
                                highlightedRouteId={highlightedRouteId}
                                expandedRoutes={expandedRoutes}
                                onExpandedRoutesChange={setExpandedRoutes}
                                onHighlightedRouteIdChange={
                                    setHighlightedRouteId
                                }
                                onTourUpdate={handleTourUpdate}
                            />
                        </FloatingPanel>
                    )}

                    <FloatingPanel
                        id="ai-panel"
                        isOpen={isOpen('ai')}
                        onClose={() => closePanel('ai')}
                        position="right"
                        title={t('panels.ai', 'AI Recommendations')}
                    >
                        <AiRecommendationsPanel
                            tripId={selectedTripId}
                            tripName={selectedTrip?.name || null}
                            selectedTourId={selectedTourId}
                            tours={tours}
                            markers={markers}
                            mapBounds={mapBounds}
                        />
                    </FloatingPanel>
                </>
            )}

            {/* Mobile Panels - Phase 3 */}
            {isMobileLayout && (
                <>
                    {/* Bottom Navigation Bar */}
                    <MobileNavigation
                        activePanel={activePanel}
                        onPanelChange={togglePanel}
                    />

                    <AnimatePresence mode="wait">
                        {/* Markers Sheet */}
                        {activePanel === 'markers' && (
                            <DraggableSheet
                                key="markers"
                                onClose={closeMobilePanel}
                                title={t('panels.markers', 'Markers')}
                            >
                                {selectedMarkerId ? (
                                    <MarkerForm
                                        key={selectedMarkerId}
                                        marker={selectedMarker}
                                        onSave={handleSaveMarker}
                                        onDeleteMarker={handleDeleteMarker}
                                        onClose={handleCloseForm}
                                        tours={tours}
                                        onToggleMarkerInTour={
                                            handleToggleMarkerInTour
                                        }
                                    />
                                ) : (
                                    <MarkerList
                                        markers={markers}
                                        selectedMarkerId={selectedMarkerId}
                                        onSelectMarker={setSelectedMarkerId}
                                        selectedTourId={selectedTourId}
                                        onAddMarkerToTour={
                                            handleAddMarkerToTour
                                        }
                                        onMarkerImageFetched={(
                                            markerId,
                                            imageUrl,
                                        ) => {
                                            const updatedMarkers = markers.map(
                                                (m) =>
                                                    m.id === markerId
                                                        ? { ...m, imageUrl }
                                                        : m,
                                            );
                                            setMarkers([...updatedMarkers]);
                                        }}
                                    />
                                )}
                            </DraggableSheet>
                        )}

                        {/* Tours Sheet */}
                        {activePanel === 'tours' && (
                            <DraggableSheet
                                key="tours"
                                onClose={closeMobilePanel}
                                title={t('panels.tours', 'Tours')}
                            >
                                <TourPanel
                                    tours={tours}
                                    selectedTourId={selectedTourId}
                                    onSelectTour={onSelectTour}
                                    onCreateTour={onCreateTour}
                                    onDeleteTour={onDeleteTour}
                                    markers={markers}
                                    routes={routes}
                                    onMoveMarkerUp={handleMoveMarkerUp}
                                    onMoveMarkerDown={handleMoveMarkerDown}
                                    onRemoveMarkerFromTour={
                                        handleRemoveMarkerFromTour
                                    }
                                    onRequestRoute={handleRequestRoute}
                                />
                            </DraggableSheet>
                        )}

                        {/* Routes Sheet */}
                        {activePanel === 'routes' && selectedTripId && (
                            <DraggableSheet
                                key="routes"
                                onClose={closeMobilePanel}
                                title={t('panels.routes', 'Routes')}
                            >
                                <RoutePanel
                                    tripId={selectedTripId}
                                    tourId={selectedTourId}
                                    markers={markers}
                                    routes={routes}
                                    onRoutesUpdate={setRoutes}
                                    initialStartMarkerId={
                                        routeRequest?.startMarkerId
                                    }
                                    initialEndMarkerId={
                                        routeRequest?.endMarkerId
                                    }
                                    tours={tours}
                                    highlightedRouteId={highlightedRouteId}
                                    expandedRoutes={expandedRoutes}
                                    onExpandedRoutesChange={setExpandedRoutes}
                                    onHighlightedRouteIdChange={
                                        setHighlightedRouteId
                                    }
                                    onTourUpdate={handleTourUpdate}
                                />
                            </DraggableSheet>
                        )}

                        {/* AI Sheet */}
                        {activePanel === 'ai' && (
                            <DraggableSheet
                                key="ai"
                                onClose={closeMobilePanel}
                                title={t('panels.ai', 'AI Recommendations')}
                            >
                                <AiRecommendationsPanel
                                    tripId={selectedTripId}
                                    tripName={selectedTrip?.name || null}
                                    selectedTourId={selectedTourId}
                                    tours={tours}
                                    markers={markers}
                                    mapBounds={mapBounds}
                                />
                            </DraggableSheet>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* Trip Notes Modal - Keep functional */}
            {selectedTrip && (
                <TripNotesModal
                    isOpen={isTripNotesModalOpen}
                    onClose={() => setIsTripNotesModalOpen(false)}
                    initialNotes={selectedTrip.notes || null}
                    onSave={handleSaveTripNotes}
                    tripName={selectedTrip.name}
                />
            )}
        </div>
    );
}
