import { AiRecommendationsPanel } from '@/components/ai-recommendations-panel';
import { DraggableSheet } from '@/components/draggable-sheet';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import { MobileNavigation } from '@/components/mobile-navigation';
import RoutePanel from '@/components/route-panel';
import TourPanel from '@/components/tour-panel';
import { PanelType } from '@/hooks/use-panels';
import { MarkerData, MarkerType } from '@/types/marker';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface MobilePanelsProps {
    // Panel state
    activePanel: PanelType | null;
    togglePanel: (panel: PanelType) => void;
    closeMobilePanel: () => void;

    // Marker state
    markers: MarkerData[];
    selectedMarkerId: string | null;
    selectedMarker: MarkerData | null;
    setSelectedMarkerId: (id: string | null) => void;
    setMarkers: (markers: MarkerData[]) => void;
    handleSaveMarker: (
        id: string,
        name: string,
        type: MarkerType,
        notes: string,
        url: string,
        isUnesco: boolean,
        aiEnriched: boolean,
        estimatedHours: number | null,
    ) => Promise<void>;
    handleDeleteMarker: (markerId: string) => Promise<void>;
    handleCloseForm: () => void;

    // Tour state
    tours: Tour[];
    selectedTourId: number | null;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
    onDeleteTour: (tourId: number) => void;
    handleToggleMarkerInTour: (
        markerId: string,
        tourId: number,
        isRemoving: boolean,
    ) => Promise<void>;
    handleMoveMarkerUp: (markerId: string) => void;
    handleMoveMarkerDown: (markerId: string) => void;
    handleRemoveMarkerFromTour: (markerId: string) => Promise<void>;
    handleTourUpdate: (tour: Tour) => void;

    // Route state
    routes: Route[];
    setRoutes: (routes: Route[]) => void;
    selectedTripId: number | null;
    routeRequest: { startMarkerId: string; endMarkerId: string } | null;
    highlightedRouteId: number | null;
    expandedRoutes: Set<number>;
    setExpandedRoutes: (
        routes: Set<number> | ((prev: Set<number>) => Set<number>),
    ) => void;
    setHighlightedRouteId: (id: number | null) => void;
    handleRequestRoute: (startMarkerId: string, endMarkerId: string) => void;

    // Available marker selection (for tours)
    selectedAvailableMarkerId: string | null;
    handleSelectAvailableMarker: (markerId: string | null) => void;
    handleAddAvailableMarkerToTour: (markerId: string) => Promise<void>;

    // AI recommendations
    selectedTrip: Trip | null | undefined;
    mapBounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    } | null;
}

/**
 * Mobile Bottom Sheets Component
 * Renders bottom navigation and draggable sheets for mobile layout
 */
export function MobilePanels({
    activePanel,
    togglePanel,
    closeMobilePanel,
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
}: MobilePanelsProps) {
    const { t } = useTranslation();

    /**
     * Handler for marker image updates
     * Extracted to avoid duplication between desktop and mobile
     */
    const handleMarkerImageUpdate = (markerId: string, imageUrl: string) => {
        const updatedMarkers = markers.map((m) =>
            m.id === markerId ? { ...m, imageUrl } : m,
        );
        setMarkers([...updatedMarkers]);
    };

    return (
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
                                onToggleMarkerInTour={handleToggleMarkerInTour}
                            />
                        ) : (
                            <MarkerList
                                markers={markers}
                                selectedMarkerId={selectedMarkerId}
                                onSelectMarker={setSelectedMarkerId}
                                onMarkerImageFetched={handleMarkerImageUpdate}
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
                        snapPoints={[0.4, 0.7, 0.95]}
                        initialSnapPoint={1} // Start at 70% height (index 1) to show Available Markers section
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
                            selectedAvailableMarkerId={
                                selectedAvailableMarkerId
                            }
                            onSelectAvailableMarker={
                                handleSelectAvailableMarker
                            }
                            onAddMarkerToTour={handleAddAvailableMarkerToTour}
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
    );
}
