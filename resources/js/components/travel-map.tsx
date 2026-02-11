import { AiRecommendationsPanel } from '@/components/ai-recommendations-panel';
import { MapDebugInfo } from '@/components/map-debug-info';
import MapOptionsMenu from '@/components/map-options-menu';
import { MapSearchBox } from '@/components/map-search-box';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import MobileBottomNavigation, {
    PanelType,
} from '@/components/mobile-bottom-navigation';
import RoutePanel from '@/components/route-panel';
import TourPanel from '@/components/tour-panel';
import TripNotesModal from '@/components/trip-notes-modal';
import { Button } from '@/components/ui/button';
import { DraggableSheet } from '@/components/ui/draggable-sheet';
import { useGeocoder } from '@/hooks/use-geocoder';
import { useLanguage } from '@/hooks/use-language';
import { useMapInstance } from '@/hooks/use-map-instance';
import { useMapInteractions } from '@/hooks/use-map-interactions';
import { useMarkerHighlight } from '@/hooks/use-marker-highlight';
import { useMarkerVisibility } from '@/hooks/use-marker-visibility';
import { useMarkers } from '@/hooks/use-markers';
import { useMobilePanels } from '@/hooks/use-mobile-panels';
import { usePanelCollapse } from '@/hooks/use-panel-collapse';
import { usePlaceTypes } from '@/hooks/use-place-types';
import { useRoutes } from '@/hooks/use-routes';
import { useSearchMode } from '@/hooks/use-search-mode';
import { useSearchRadius } from '@/hooks/use-search-radius';
import { useSearchResults } from '@/hooks/use-search-results';
import { useTourLines } from '@/hooks/use-tour-lines';
import { useTourMarkers } from '@/hooks/use-tour-markers';
import { getBoundingBoxFromTrip } from '@/lib/map-utils';
import { update as tripsUpdate } from '@/routes/trips';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';

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

export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    trips,
    onToursUpdate,
    onReloadTours,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    onSetViewport,
}: TravelMapProps) {
    // Get current language setting
    const { language } = useLanguage();

    // Initialize map instance with language support
    const { mapRef, mapInstance } = useMapInstance({ language });

    // Get the selected trip to access its country
    const selectedTrip = trips.find((t) => t.id === selectedTripId);

    // State for map bounds
    const [mapBounds, setMapBounds] = useState<{
        north: number;
        south: number;
        east: number;
        west: number;
    } | null>(null);

    // State for current map viewport (for debug info)
    const [currentMapViewport, setCurrentMapViewport] = useState<{
        north: number;
        south: number;
        east: number;
        west: number;
        center: { lat: number; lng: number };
        zoom: number;
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

    // Panel collapse state
    const {
        isTourPanelCollapsed,
        setIsTourPanelCollapsed,
        isRoutePanelCollapsed,
        setIsRoutePanelCollapsed,
    } = usePanelCollapse({ mapInstance });

    // Mobile panel management with draggable sheets
    const {
        activePanel,
        setActivePanel,
        panelStates,
        openPanel,
        closePanel,
        updatePanelSnapPoint,
    } = useMobilePanels();

    // Handle panel change from bottom navigation
    const handlePanelChange = (panel: PanelType) => {
        const currentPanelState = panelStates[panel];
        if (
            currentPanelState.isOpen &&
            currentPanelState.snapPoint !== 'peek'
        ) {
            // Panel is already open at half or full, keep it at current position
            setActivePanel(panel);
        } else if (
            currentPanelState.isOpen &&
            currentPanelState.snapPoint === 'peek'
        ) {
            // If peeking, expand to half
            updatePanelSnapPoint(panel, 'half');
            setActivePanel(panel);
        } else {
            // If closed, open to half
            openPanel(panel, 'half');
            setActivePanel(panel);
        }
    };

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

    // Routes management - define FIRST before callbacks
    const { routes: routesFromHook, setRoutes } = useRoutes({
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

    const routes = routesFromHook;

    // Handler for route request from tour panel
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
            } else {
                setHighlightedRouteId(null);
            }

            // Expand route panel if collapsed
            setIsRoutePanelCollapsed(false);
        },
        [routes, setIsRoutePanelCollapsed],
    );

    // Handler for route click on map - uses useCallback to ensure stable reference
    const handleRouteClick = useCallback(
        (routeId: number) => {
            const route = routes.find((r) => r.id === routeId);
            if (!route) return;

            // Use the same logic as handleRequestRoute to ensure consistent behavior
            handleRequestRoute(route.start_marker.id, route.end_marker.id);
        },
        [routes, handleRequestRoute],
    );

    // Update the ref with the current handleRouteClick
    useEffect(() => {
        handleRouteClickRef.current = handleRouteClick;
    }, [handleRouteClick]);

    // Marker management - defined here so we can use setSelectedMarkerId in other hooks
    const {
        markers,
        setMarkers,
        selectedMarkerId,
        setSelectedMarkerId,
        handleSaveMarker,
        handleDeleteMarker,
        handleCloseForm,
        addMarker,
        updateMarkerReference,
    } = useMarkers({
        mapInstance,
        selectedTripId,
        selectedTourId,
        onMarkerClick: (id: string) => {
            // This callback is safe because setSelectedMarkerId is defined in useMarkers
            setSelectedMarkerId(id);
        },
        onMarkerSaved: () => {
            // Reload tours when a new marker is saved to a tour
            onReloadTours();
        },
    });

    // Search results management
    useSearchResults({
        mapInstance,
        onMarkerCreated: addMarker,
        onMarkerSelected: setSelectedMarkerId,
    });

    // Marker visibility based on tour selection
    useMarkerVisibility({
        mapInstance,
        markers,
        selectedTourId,
        tours,
    });

    // Marker highlighting
    useMarkerHighlight({
        mapInstance,
        markers,
        selectedMarkerId,
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

    // Tour marker operations
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

    // Handler for removing a marker from the currently selected tour
    const handleRemoveMarkerFromTour = useCallback(
        async (markerId: string) => {
            if (selectedTourId === null) return;
            await handleToggleMarkerInTour(markerId, selectedTourId, true);
        },
        [selectedTourId, handleToggleMarkerInTour],
    );

    // Handler for updating a single tour after sorting
    const handleTourUpdate = useCallback(
        (updatedTour: Tour) => {
            const updatedTours = tours.map((tour) =>
                tour.id === updatedTour.id ? updatedTour : tour,
            );
            onToursUpdate(updatedTours);
        },
        [tours, onToursUpdate],
    );

    // Tour lines - draw curved lines between markers in selected tour
    useTourLines({
        mapInstance,
        selectedTourId,
        tours,
        markers,
        routes,
        onTourLineClick: handleRequestRoute,
    });

    // Update map bounds when map moves
    useEffect(() => {
        if (mapInstance) {
            const updateBounds = () => {
                const bounds = mapInstance.getBounds();
                const center = mapInstance.getCenter();
                const zoom = mapInstance.getZoom();

                if (bounds) {
                    setMapBounds({
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
                    });

                    setCurrentMapViewport({
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
                        center: { lat: center.lat, lng: center.lng },
                        zoom,
                    });
                }
            };

            // Initial bounds
            updateBounds();

            // Update on map move
            mapInstance.on('moveend', updateBounds);

            return () => {
                mapInstance.off('moveend', updateBounds);
            };
        }
    }, [mapInstance]);

    // Handle viewport setting via custom event
    useEffect(() => {
        if (!mapInstance || !onSetViewport) return;

        const handleSetViewportEvent = (
            event: CustomEvent<{ tripId: number }>,
        ) => {
            const { tripId } = event.detail;
            const center = mapInstance.getCenter();
            const zoom = mapInstance.getZoom();

            onSetViewport(tripId, {
                latitude: center.lat,
                longitude: center.lng,
                zoom,
            });
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

    // Placeholder state for MapOptionsMenu (search feature not fully implemented)
    const searchCoordinates = null;
    const searchResultCount = null;
    const isSearching = false;
    const searchError = null;

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

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
        <div className="flex h-full flex-col gap-4 pb-16 md:pb-0">
            {/* AI Recommendations Panel - Full width above the 4 existing areas */}
            <AiRecommendationsPanel
                tripId={selectedTripId}
                tripName={selectedTrip?.name || null}
                selectedTourId={selectedTourId}
                tours={tours}
                markers={markers}
                mapBounds={mapBounds}
            />

            {/* Responsive layout: Mobile stacks vertically, Desktop uses row */}
            <div className="flex flex-1 flex-col gap-4 overflow-hidden md:flex-row md:gap-0">
                {/* Mobile: Map takes full height, Desktop: Last in row */}
                <div
                    className="order-1 flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 md:order-4 md:ml-4 md:h-auto md:flex-1"
                    data-testid="map-panel"
                >
                    {/* Top area for debug info and trip notes button */}
                    <div className="mb-2 flex min-h-[40px] flex-shrink-0 items-center justify-between gap-2 rounded-lg bg-white p-2 shadow">
                        <MapDebugInfo
                            tripViewport={
                                selectedTrip
                                    ? {
                                          latitude:
                                              selectedTrip.viewport_latitude,
                                          longitude:
                                              selectedTrip.viewport_longitude,
                                          zoom: selectedTrip.viewport_zoom,
                                      }
                                    : null
                            }
                            currentMapBounds={currentMapViewport}
                            searchBbox={getBoundingBoxFromTrip(selectedTrip)}
                        />
                        {selectedTrip && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTripNotesModalOpen(true)}
                                className="flex items-center gap-2"
                                data-testid="trip-notes-button"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Notes</span>
                            </Button>
                        )}
                    </div>

                    {/* Map area */}
                    <div className="relative flex-1 overflow-hidden">
                        <div
                            ref={mapRef}
                            id="map"
                            className="z-10 h-full w-full"
                        />
                        <MapSearchBox
                            onRetrieve={handleSearchResult}
                            accessToken={mapboxgl.accessToken || ''}
                            countries={
                                selectedTrip?.country
                                    ? [selectedTrip.country]
                                    : undefined
                            }
                            bbox={getBoundingBoxFromTrip(selectedTrip)}
                        />
                        <MapOptionsMenu
                            isSearchMode={isSearchMode}
                            onSearchModeChange={setIsSearchMode}
                            searchCoordinates={searchCoordinates}
                            searchRadius={searchRadius}
                            onSearchRadiusChange={setSearchRadius}
                            searchResultCount={searchResultCount}
                            isSearching={isSearching}
                            searchError={searchError}
                            placeTypes={placeTypes}
                            selectedPlaceType={selectedPlaceType}
                            onPlaceTypeChange={setSelectedPlaceType}
                        />
                    </div>
                </div>

                {/* Marker panel - Mobile: Draggable Sheet, Desktop: Static Panel */}
                <div
                    className="order-2 hidden h-auto w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 md:order-1 md:flex md:w-[16.67%]"
                    data-testid="marker-panel-desktop"
                >
                    <div className="flex-1 overflow-y-auto">
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
                                    // Update markers state directly with the new imageUrl
                                    const updatedMarkers = markers.map((m) =>
                                        m.id === markerId
                                            ? { ...m, imageUrl }
                                            : m,
                                    );
                                    // Force update by creating a new array reference
                                    setMarkers([...updatedMarkers]);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Tour panel - Mobile: Draggable Sheet, Desktop: Static Panel */}
                <div
                    className={`order-3 hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 md:order-2 md:flex md:h-auto ${isTourPanelCollapsed ? 'md:w-auto' : 'md:w-[16.67%]'}`}
                    data-testid="tour-panel-desktop"
                >
                    {!isTourPanelCollapsed && (
                        <div className="flex h-full flex-1 flex-col overflow-hidden rounded-l-lg">
                            <div className="flex-1 overflow-y-auto">
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
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() =>
                            setIsTourPanelCollapsed(!isTourPanelCollapsed)
                        }
                        className={`flex min-h-11 min-w-11 items-center justify-center bg-white shadow-md hover:bg-gray-100 ${isTourPanelCollapsed ? 'rounded-lg px-3' : 'rounded-r-lg px-2'}`}
                        title={
                            isTourPanelCollapsed
                                ? 'Expand Tours'
                                : 'Collapse Tours'
                        }
                        data-testid="tour-panel-toggle"
                    >
                        {isTourPanelCollapsed ? (
                            <ChevronRight className="h-6 w-6 text-gray-600" />
                        ) : (
                            <ChevronLeft className="h-6 w-6 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Route panel - Mobile: Draggable Sheet, Desktop: Static Panel */}
                {selectedTripId && (
                    <div
                        className={`order-4 hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-300 md:order-3 md:flex md:h-auto ${isRoutePanelCollapsed ? 'md:w-auto' : 'md:w-[16.67%]'}`}
                        data-testid="route-panel-desktop"
                    >
                        {!isRoutePanelCollapsed && (
                            <div className="flex h-full flex-1 flex-col overflow-hidden rounded-l-lg">
                                <div className="flex-1 overflow-y-auto">
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
                                        onExpandedRoutesChange={
                                            setExpandedRoutes
                                        }
                                        onHighlightedRouteIdChange={
                                            setHighlightedRouteId
                                        }
                                        onTourUpdate={handleTourUpdate}
                                    />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() =>
                                setIsRoutePanelCollapsed(!isRoutePanelCollapsed)
                            }
                            className={`flex min-h-11 min-w-11 items-center justify-center bg-white shadow-md hover:bg-gray-100 ${isRoutePanelCollapsed ? 'rounded-lg px-3' : 'rounded-r-lg px-2'}`}
                            title={
                                isRoutePanelCollapsed
                                    ? 'Expand Routes'
                                    : 'Collapse Routes'
                            }
                            data-testid="route-panel-toggle"
                        >
                            {isRoutePanelCollapsed ? (
                                <ChevronRight className="h-6 w-6 text-gray-600" />
                            ) : (
                                <ChevronLeft className="h-6 w-6 text-gray-600" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Draggable Sheets */}
            <DraggableSheet
                isOpen={panelStates.markers.isOpen}
                onOpenChange={(open) =>
                    open ? openPanel('markers', 'half') : closePanel('markers')
                }
                snapPoint={panelStates.markers.snapPoint}
                onSnapPointChange={(snapPoint) =>
                    updatePanelSnapPoint('markers', snapPoint)
                }
                title="Markers"
                peekHeight={80}
                halfHeight={50}
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
                                m.id === markerId ? { ...m, imageUrl } : m,
                            );
                            setMarkers([...updatedMarkers]);
                        }}
                    />
                )}
            </DraggableSheet>

            <DraggableSheet
                isOpen={panelStates.tours.isOpen}
                onOpenChange={(open) =>
                    open ? openPanel('tours', 'half') : closePanel('tours')
                }
                snapPoint={panelStates.tours.snapPoint}
                onSnapPointChange={(snapPoint) =>
                    updatePanelSnapPoint('tours', snapPoint)
                }
                title="Tours"
                peekHeight={80}
                halfHeight={50}
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
            </DraggableSheet>

            {selectedTripId && (
                <DraggableSheet
                    isOpen={panelStates.routes.isOpen}
                    onOpenChange={(open) =>
                        open
                            ? openPanel('routes', 'half')
                            : closePanel('routes')
                    }
                    snapPoint={panelStates.routes.snapPoint}
                    onSnapPointChange={(snapPoint) =>
                        updatePanelSnapPoint('routes', snapPoint)
                    }
                    title="Routes"
                    peekHeight={80}
                    halfHeight={50}
                >
                    <RoutePanel
                        tripId={selectedTripId}
                        tourId={selectedTourId}
                        markers={markers}
                        routes={routes}
                        onRoutesUpdate={setRoutes}
                        initialStartMarkerId={routeRequest?.startMarkerId}
                        initialEndMarkerId={routeRequest?.endMarkerId}
                        tours={tours}
                        highlightedRouteId={highlightedRouteId}
                        expandedRoutes={expandedRoutes}
                        onExpandedRoutesChange={setExpandedRoutes}
                        onHighlightedRouteIdChange={setHighlightedRouteId}
                        onTourUpdate={handleTourUpdate}
                    />
                </DraggableSheet>
            )}

            {/* Mobile Bottom Navigation */}
            <MobileBottomNavigation
                activePanel={activePanel}
                onPanelChange={handlePanelChange}
                panelStates={panelStates}
            />

            {/* Trip Notes Modal */}
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
