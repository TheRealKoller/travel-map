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
import { useSync } from '@/hooks/use-sync';
import { useTourLines } from '@/hooks/use-tour-lines';
import { useTourMarkers } from '@/hooks/use-tour-markers';
import { useTripNotes } from '@/hooks/use-trip-notes';
import { useWaypointMode } from '@/hooks/use-waypoint-mode';
import { getBoundingBoxFromTrip } from '@/lib/map-utils';
import { createMarkerElement } from '@/lib/marker-utils';
import { type TripOwner } from '@/types';
import { MarkerData, MarkerType } from '@/types/marker';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

interface TravelMapProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    trips: Trip[];
    onToursUpdate: (tours: Tour[]) => void;
    onTripsUpdate: Dispatch<SetStateAction<Trip[]>>;
    onReloadTours: () => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    onSetViewport?: (
        tripId: number,
        viewport: { latitude: number; longitude: number; zoom: number },
    ) => Promise<void>;
    tripName?: string;
    owner?: TripOwner;
    canEdit?: boolean;
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
    onTripsUpdate,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
    onSetViewport,
    tripName,
    owner,
    canEdit = true,
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

    // Waypoint mode management
    const {
        isWaypointMode,
        setIsWaypointMode,
        isWaypointModeRef,
        pendingWaypoints,
        addWaypoint,
        removeWaypoint,
        clearWaypoints,
    } = useWaypointMode({ mapInstance });

    // Search radius management
    const { searchRadius, setSearchRadius } = useSearchRadius();

    // Place types management
    const { placeTypes, selectedPlaceType, setSelectedPlaceType } =
        usePlaceTypes();

    // Trip notes management
    const { isTripNotesModalOpen, closeTripNotesModal, handleSaveTripNotes } =
        useTripNotes({
            selectedTripId,
            setTrips: onTripsUpdate,
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

    // Alternative route selection state — tracks which alternative is currently
    // selected for a given expanded public transport route
    const [selectedAlternativeRouteId, setSelectedAlternativeRouteId] =
        useState<number | null>(null);
    const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<
        number | null
    >(null);

    const handleSelectedAlternativeIndexChange = useCallback(
        (routeId: number | null, index: number | null) => {
            setSelectedAlternativeRouteId(routeId);
            setSelectedAlternativeIndex(index);
        },
        [],
    );

    // Routes management - now with proper route click handler
    const { routes, setRoutes } = useRoutes({
        mapInstance,
        selectedTripId,
        selectedTourId,
        tours,
        expandedRoutes,
        highlightedRouteId,
        selectedAlternativeIndex:
            highlightedRouteId === selectedAlternativeRouteId
                ? selectedAlternativeIndex
                : null,
        onRouteClick: (routeId: number) => {
            if (handleRouteClickRef.current) {
                handleRouteClickRef.current(routeId);
            }
        },
        onAlternativeClick: (routeId: number, index: number) => {
            handleSelectedAlternativeIndexChange(routeId, index);
        },
    });

    // Update routesRef when routes change
    useEffect(() => {
        routesRef.current = routes;
    }, [routes]);

    // Background sync – polls for changes from other collaborators
    const handleAddSyncedMarker = useCallback(
        (raw: {
            id: string;
            latitude: number;
            longitude: number;
            name: string;
            type: MarkerType;
            notes: string | null;
            url: string | null;
            image_url: string | null;
            is_unesco: boolean;
            ai_enriched: boolean;
            estimated_hours: number | null;
        }): MarkerData | null => {
            if (!mapInstance) return null;

            const el = createMarkerElement({
                type: raw.type as MarkerType,
                isHighlighted: false,
                isTemporary: false,
            });

            const mapboxMarker = new mapboxgl.Marker(el)
                .setLngLat([raw.longitude, raw.latitude])
                .addTo(mapInstance);

            const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                raw.name || 'Unnamed Location',
            );
            mapboxMarker.setPopup(popup);

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelectedMarkerId(raw.id);
            });

            return {
                id: raw.id,
                lat: raw.latitude,
                lng: raw.longitude,
                name: raw.name ?? '',
                type: (raw.type as MarkerType) ?? MarkerType.PointOfInterest,
                notes: raw.notes ?? '',
                url: raw.url ?? '',
                imageUrl: raw.image_url ?? null,
                isUnesco: raw.is_unesco ?? false,
                aiEnriched: raw.ai_enriched ?? false,
                estimatedHours: raw.estimated_hours ?? null,
                isSaved: true,
                marker: mapboxMarker,
            };
        },
        [mapInstance],
    );

    useSync({
        selectedTripId,
        selectedTrip,
        setMarkers,
        setRoutes,
        onToursUpdate,
        tours,
        selectedMarkerId,
        expandedRoutes,
        onAddMarker: handleAddSyncedMarker,
    });

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
        onMarkerCreated: canEdit ? addMarker : undefined,
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
        onMarkerCreated: canEdit ? addMarker : undefined,
        onMarkerSelected: setSelectedMarkerId,
    });

    // Map interactions (POI clicks, etc.)
    useMapInteractions({
        mapInstance,
        isSearchModeRef,
        isWaypointModeRef,
        onMarkerCreated: canEdit ? addMarker : undefined,
        onMarkerSelected: setSelectedMarkerId,
        onWaypointAdded: canEdit ? addWaypoint : undefined,
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

    const sharedPanelProps = {
        markers,
        selectedMarkerId,
        selectedMarker,
        setSelectedMarkerId,
        setMarkers,
        handleSaveMarker,
        handleDeleteMarker,
        handleCloseForm,
        tours,
        selectedTourId,
        onSelectTour,
        onCreateTour,
        onDeleteTour,
        handleToggleMarkerInTour,
        handleMoveMarkerUp,
        handleMoveMarkerDown,
        handleRemoveMarkerFromTour,
        handleTourUpdate,
        routes,
        setRoutes,
        selectedTripId,
        routeRequest,
        highlightedRouteId,
        expandedRoutes,
        setExpandedRoutes,
        setHighlightedRouteId,
        handleRequestRoute,
        selectedAvailableMarkerId,
        handleSelectAvailableMarker,
        handleAddAvailableMarkerToTour,
        selectedTrip,
        mapBounds,
        selectedAlternativeIndex:
            highlightedRouteId === selectedAlternativeRouteId
                ? selectedAlternativeIndex
                : null,
        onSelectedAlternativeIndexChange: handleSelectedAlternativeIndexChange,
        isWaypointMode,
        setIsWaypointMode,
        pendingWaypoints,
        onRemoveWaypoint: removeWaypoint,
        onClearWaypoints: clearWaypoints,
        canEdit,
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
                tripName={tripName}
                owner={owner}
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
                    {...sharedPanelProps}
                    isOpen={isOpen}
                    togglePanel={togglePanel}
                    closePanel={closePanel}
                />
            )}

            {/* Mobile Panels */}
            {isMobileLayout && (
                <MobilePanels
                    {...sharedPanelProps}
                    activePanel={activePanel}
                    togglePanel={togglePanel}
                    closeMobilePanel={closeMobilePanel}
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
