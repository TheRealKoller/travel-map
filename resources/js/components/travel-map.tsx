import { AiRecommendationsPanel } from '@/components/ai-recommendations-panel';
import MapOptionsMenu from '@/components/map-options-menu';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import RoutePanel from '@/components/route-panel';
import TourPanel from '@/components/tour-panel';
import { useGeocoder } from '@/hooks/use-geocoder';
import { useMapInstance } from '@/hooks/use-map-instance';
import { useMapInteractions } from '@/hooks/use-map-interactions';
import { useMarkerHighlight } from '@/hooks/use-marker-highlight';
import { useMarkerVisibility } from '@/hooks/use-marker-visibility';
import { useMarkers } from '@/hooks/use-markers';
import { usePanelCollapse } from '@/hooks/use-panel-collapse';
import { usePlaceTypes } from '@/hooks/use-place-types';
import { useRoutes } from '@/hooks/use-routes';
import { useSearchMode } from '@/hooks/use-search-mode';
import { useSearchRadius } from '@/hooks/use-search-radius';
import { useSearchResults } from '@/hooks/use-search-results';
import { useTourMarkers } from '@/hooks/use-tour-markers';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';

interface TravelMapProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    trips: Trip[];
    onToursUpdate: (tours: Tour[]) => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
}

export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    trips,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
}: TravelMapProps) {
    // Initialize map instance
    const { mapRef, mapInstance } = useMapInstance();

    // State for map bounds
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

    // Panel collapse state
    const {
        isTourPanelCollapsed,
        setIsTourPanelCollapsed,
        isRoutePanelCollapsed,
        setIsRoutePanelCollapsed,
    } = usePanelCollapse({ mapInstance });

    // Routes management
    const { routes, setRoutes } = useRoutes({
        mapInstance,
        selectedTripId,
    });

    // Marker management - defined here so we can use setSelectedMarkerId in other hooks
    const {
        markers,
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
        onMarkerClick: (id: string) => {
            // This callback is safe because setSelectedMarkerId is defined in useMarkers
            setSelectedMarkerId(id);
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

    // Geocoder
    useGeocoder({
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

    // Update map bounds when map moves
    useEffect(() => {
        if (mapInstance) {
            const updateBounds = () => {
                const bounds = mapInstance.getBounds();
                if (bounds) {
                    setMapBounds({
                        north: bounds.getNorth(),
                        south: bounds.getSouth(),
                        east: bounds.getEast(),
                        west: bounds.getWest(),
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

    // Placeholder state for MapOptionsMenu (search feature not fully implemented)
    const searchCoordinates = null;
    const searchResultCount = null;
    const isSearching = false;
    const searchError = null;

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    const selectedTrip = trips.find((t) => t.id === selectedTripId) || null;

    return (
        <div className="flex h-full flex-col gap-4">
            {/* AI Recommendations Panel - Full width above the 4 existing areas */}
            <AiRecommendationsPanel
                tripId={selectedTripId}
                tripName={selectedTrip?.name || null}
                selectedTourId={selectedTourId}
                tours={tours}
                markers={markers}
                mapBounds={mapBounds}
            />

            {/* Existing 4 panels in a row */}
            <div className="flex flex-1 flex-col lg:flex-row">
                {/* Part 1: Marker list or form */}
                <div
                    className="w-full rounded-lg border border-gray-200 bg-white shadow-sm lg:max-w-[25%]"
                    data-testid="marker-panel"
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
                        />
                    )}
                </div>

                {/* Part 2: Tour panel with collapse button */}
                <div
                    className={`flex w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${isTourPanelCollapsed ? 'lg:w-auto' : 'lg:max-w-[min(25%,300px)]'}`}
                    data-testid="tour-panel"
                >
                    {!isTourPanelCollapsed && (
                        <div className="h-full flex-1 overflow-hidden rounded-l-lg">
                            <TourPanel
                                tours={tours}
                                selectedTourId={selectedTourId}
                                onSelectTour={onSelectTour}
                                onCreateTour={onCreateTour}
                                onDeleteTour={onDeleteTour}
                                markers={markers}
                                onMoveMarkerUp={handleMoveMarkerUp}
                                onMoveMarkerDown={handleMoveMarkerDown}
                            />
                        </div>
                    )}
                    <button
                        onClick={() =>
                            setIsTourPanelCollapsed(!isTourPanelCollapsed)
                        }
                        className={`flex items-center bg-white px-1 shadow-md hover:bg-gray-100 ${isTourPanelCollapsed ? 'rounded-lg' : 'rounded-r-lg'}`}
                        title={
                            isTourPanelCollapsed
                                ? 'Expand Tours'
                                : 'Collapse Tours'
                        }
                        data-testid="tour-panel-toggle"
                    >
                        {isTourPanelCollapsed ? (
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        ) : (
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Part 3: Route panel with collapse button */}
                {selectedTripId && (
                    <div
                        className={`flex w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${isRoutePanelCollapsed ? 'lg:w-auto' : 'lg:max-w-[min(25%,300px)]'}`}
                        data-testid="route-panel"
                    >
                        {!isRoutePanelCollapsed && (
                            <div className="h-full flex-1 overflow-hidden rounded-l-lg">
                                <RoutePanel
                                    tripId={selectedTripId}
                                    markers={markers}
                                    routes={routes}
                                    onRoutesUpdate={setRoutes}
                                />
                            </div>
                        )}
                        <button
                            onClick={() =>
                                setIsRoutePanelCollapsed(!isRoutePanelCollapsed)
                            }
                            className={`flex items-center bg-white px-1 shadow-md hover:bg-gray-100 ${isRoutePanelCollapsed ? 'rounded-lg' : 'rounded-r-lg'}`}
                            title={
                                isRoutePanelCollapsed
                                    ? 'Expand Routes'
                                    : 'Collapse Routes'
                            }
                            data-testid="route-panel-toggle"
                        >
                            {isRoutePanelCollapsed ? (
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            ) : (
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            )}
                        </button>
                    </div>
                )}

                {/* Part 4: Map with top control area */}
                <div
                    className="flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:ml-4"
                    data-testid="map-panel"
                >
                    {/* Top area for future buttons/controls */}
                    <div
                        className="mb-2 min-h-[40px] rounded-lg bg-white p-2 shadow"
                        aria-hidden="true"
                    >
                        {/* Empty for now - placeholder for future controls */}
                    </div>

                    {/* Map area */}
                    <div className="relative flex-1">
                        <div
                            ref={mapRef}
                            id="map"
                            className="z-10 h-full w-full"
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
            </div>
        </div>
    );
}
