import { Toolbar } from '@/components/toolbar';
import { DesktopPanels } from '@/components/travel-map/desktop-panels';
import { MobilePanels } from '@/components/travel-map/mobile-panels';
import TripNotesModal from '@/components/trip-notes-modal';
import { useAvailableMarkerSelection } from '@/hooks/use-available-marker-selection';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useGeocoder } from '@/hooks/use-geocoder';
import { useLanguage } from '@/hooks/use-language';
import { useMapBounds } from '@/hooks/use-map-bounds';
import { useMapInstance } from '@/hooks/use-map-instance';
import { useMapInteractions } from '@/hooks/use-map-interactions';
import { useMarkerStyling } from '@/hooks/use-marker-styling';
import { useMarkers } from '@/hooks/use-markers';
import { usePanels } from '@/hooks/use-panels';
import { usePlaceTypes } from '@/hooks/use-place-types';
import { useRouteManagement } from '@/hooks/use-route-management';
import { useRoutes } from '@/hooks/use-routes';
import { useSearchMode } from '@/hooks/use-search-mode';
import { useSearchRadius } from '@/hooks/use-search-radius';
import { useSearchResults } from '@/hooks/use-search-results';
import { useTourLines } from '@/hooks/use-tour-lines';
import { useTourMarkers } from '@/hooks/use-tour-markers';
import { useTripNotes } from '@/hooks/use-trip-notes';
import { getBoundingBoxFromTrip } from '@/lib/map-utils';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef } from 'react';

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
 * Travel Map Component - Refactored
 *
 * Desktop view:
 * - Left side: Markers and Tours panels
 * - Right side: Routes and AI panels
 * - Multiple panels can be open simultaneously
 * - Panels float over the map with semi-transparent backgrounds
 *
 * Mobile view:
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

    // Map bounds management (viewport, AI recommendations)
    const { mapBounds } = useMapBounds({
        mapInstance,
        selectedTripId,
        trips,
        onSetViewport,
    });

    // Search mode management
    const { isSearchMode, setIsSearchMode, isSearchModeRef } = useSearchMode({
        mapInstance,
    });

    // Search radius management
    const { searchRadius, setSearchRadius } = useSearchRadius();

    // Place types management
    const { placeTypes, selectedPlaceType, setSelectedPlaceType } =
        usePlaceTypes();

    // Trip notes management
    const { isTripNotesModalOpen, closeTripNotesModal, handleSaveTripNotes } =
        useTripNotes({
            selectedTripId,
            trips,
        });

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

    // Ref to store routes for circular dependency resolution
    const routesRef = useRef<Route[]>([]);

    // Route management (request, highlight, expand)
    const {
        routeRequest,
        highlightedRouteId,
        expandedRoutes,
        handleRequestRoute,
        setExpandedRoutes,
        setHighlightedRouteId,
        handleRouteClickRef,
    } = useRouteManagement({
        routesRef,
        isMobileLayout,
        isOpen,
        togglePanel,
    });

    // Routes management - now with proper route click handler
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

    // Update routesRef when routes change
    useEffect(() => {
        routesRef.current = routes;
    }, [routes]);

    // Tour lines - draw curved lines between markers in selected tour when no route exists
    useTourLines({
        mapInstance,
        selectedTourId,
        tours,
        markers,
        routes,
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

    // Available marker selection management (for tours)
    const {
        selectedAvailableMarkerId,
        handleSelectAvailableMarker,
        handleAddAvailableMarkerToTour,
        handleRemoveMarkerFromTour,
    } = useAvailableMarkerSelection({
        selectedTourId,
        handleToggleMarkerInTour,
        handleAddMarkerToTour,
        isOpen,
        togglePanel,
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
        selectedAvailableMarkerId, // Used for Available Markers section blue ring highlight
        tours,
        onMarkerUpdated: updateMarkerReference,
        onMarkerClick: (markerId: string) => {
            // If we are in tour context (tour selected + tours panel open), select in Available Markers
            const isInTourContext = selectedTourId !== null && isOpen('tours');

            if (isInTourContext) {
                // In tour context: Select marker in Available Markers list (blue ring)
                handleSelectAvailableMarker(markerId);
            } else {
                // Outside tour context: Select marker normally (open marker form)
                setSelectedMarkerId(markerId);
                if (!isOpen('markers')) {
                    togglePanel('markers');
                }
            }
        },
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

    // Auto-open markers panel when a marker is selected, except when managing a tour in the open Tour panel
    useEffect(() => {
        if (!selectedMarkerId) return;

        // If a tour is selected and the tours panel is open, stay in the tour context (no marker form)
        if (selectedTourId !== null && isOpen('tours')) {
            return;
        }

        if (!isOpen('markers')) {
            togglePanel('markers');
        }
    }, [selectedMarkerId, selectedTourId, isOpen, togglePanel]);

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

            {/* Desktop Floating Panels */}
            {!isMobileLayout && (
                <DesktopPanels
                    isOpen={isOpen}
                    togglePanel={togglePanel}
                    closePanel={closePanel}
                    markers={markers}
                    selectedMarkerId={selectedMarkerId}
                    selectedMarker={selectedMarker}
                    setSelectedMarkerId={setSelectedMarkerId}
                    setMarkers={setMarkers}
                    handleSaveMarker={handleSaveMarker}
                    handleDeleteMarker={handleDeleteMarker}
                    handleCloseForm={handleCloseForm}
                    tours={tours}
                    selectedTourId={selectedTourId}
                    onSelectTour={onSelectTour}
                    onCreateTour={onCreateTour}
                    onDeleteTour={onDeleteTour}
                    handleToggleMarkerInTour={handleToggleMarkerInTour}
                    handleMoveMarkerUp={handleMoveMarkerUp}
                    handleMoveMarkerDown={handleMoveMarkerDown}
                    handleRemoveMarkerFromTour={handleRemoveMarkerFromTour}
                    handleTourUpdate={handleTourUpdate}
                    routes={routes}
                    setRoutes={setRoutes}
                    selectedTripId={selectedTripId}
                    routeRequest={routeRequest}
                    highlightedRouteId={highlightedRouteId}
                    expandedRoutes={expandedRoutes}
                    setExpandedRoutes={setExpandedRoutes}
                    setHighlightedRouteId={setHighlightedRouteId}
                    handleRequestRoute={handleRequestRoute}
                    selectedAvailableMarkerId={selectedAvailableMarkerId}
                    handleSelectAvailableMarker={handleSelectAvailableMarker}
                    handleAddAvailableMarkerToTour={
                        handleAddAvailableMarkerToTour
                    }
                    selectedTrip={selectedTrip}
                    mapBounds={mapBounds}
                />
            )}

            {/* Mobile Panels */}
            {isMobileLayout && (
                <MobilePanels
                    activePanel={activePanel}
                    togglePanel={togglePanel}
                    closeMobilePanel={closeMobilePanel}
                    markers={markers}
                    selectedMarkerId={selectedMarkerId}
                    selectedMarker={selectedMarker}
                    setSelectedMarkerId={setSelectedMarkerId}
                    setMarkers={setMarkers}
                    handleSaveMarker={handleSaveMarker}
                    handleDeleteMarker={handleDeleteMarker}
                    handleCloseForm={handleCloseForm}
                    tours={tours}
                    selectedTourId={selectedTourId}
                    onSelectTour={onSelectTour}
                    onCreateTour={onCreateTour}
                    onDeleteTour={onDeleteTour}
                    handleToggleMarkerInTour={handleToggleMarkerInTour}
                    handleMoveMarkerUp={handleMoveMarkerUp}
                    handleMoveMarkerDown={handleMoveMarkerDown}
                    handleRemoveMarkerFromTour={handleRemoveMarkerFromTour}
                    handleTourUpdate={handleTourUpdate}
                    routes={routes}
                    setRoutes={setRoutes}
                    selectedTripId={selectedTripId}
                    routeRequest={routeRequest}
                    highlightedRouteId={highlightedRouteId}
                    expandedRoutes={expandedRoutes}
                    setExpandedRoutes={setExpandedRoutes}
                    setHighlightedRouteId={setHighlightedRouteId}
                    handleRequestRoute={handleRequestRoute}
                    selectedAvailableMarkerId={selectedAvailableMarkerId}
                    handleSelectAvailableMarker={handleSelectAvailableMarker}
                    handleAddAvailableMarkerToTour={
                        handleAddAvailableMarkerToTour
                    }
                    selectedTrip={selectedTrip}
                    mapBounds={mapBounds}
                />
            )}

            {/* Trip Notes Modal */}
            {selectedTrip && (
                <TripNotesModal
                    isOpen={isTripNotesModalOpen}
                    onClose={closeTripNotesModal}
                    initialNotes={selectedTrip.notes || null}
                    onSave={handleSaveTripNotes}
                    tripName={selectedTrip.name}
                />
            )}
        </div>
    );
}
