import { AiRecommendationsPanel } from '@/components/ai-recommendations-panel';
import { FloatingPanel } from '@/components/floating-panel';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import RoutePanel from '@/components/route-panel';
import { TabButton } from '@/components/tab-button';
import TourPanel from '@/components/tour-panel';
import { PanelType } from '@/hooks/use-panels';
import { MarkerData, MarkerType } from '@/types/marker';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { Bot, List, Map as MapIcon, Route as RouteIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DesktopPanelsProps {
    // Panel state
    isOpen: (panel: PanelType) => boolean;
    togglePanel: (panel: PanelType) => void;
    closePanel: (panel: PanelType) => void;

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
 * Desktop Floating Panels Component
 * Renders tab buttons and floating panels for desktop layout
 */
export function DesktopPanels({
    isOpen,
    togglePanel,
    closePanel,
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
}: DesktopPanelsProps) {
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
                        onMarkerImageFetched={handleMarkerImageUpdate}
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
                    selectedAvailableMarkerId={selectedAvailableMarkerId}
                    onSelectAvailableMarker={handleSelectAvailableMarker}
                    onAddMarkerToTour={handleAddAvailableMarkerToTour}
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
                        initialStartMarkerId={routeRequest?.startMarkerId}
                        initialEndMarkerId={routeRequest?.endMarkerId}
                        tours={tours}
                        highlightedRouteId={highlightedRouteId}
                        expandedRoutes={expandedRoutes}
                        onExpandedRoutesChange={setExpandedRoutes}
                        onHighlightedRouteIdChange={setHighlightedRouteId}
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
    );
}
