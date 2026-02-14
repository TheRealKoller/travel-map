import MapOptionsMenu from '@/components/map-options-menu';
import { Toolbar } from '@/components/toolbar';
import TripNotesModal from '@/components/trip-notes-modal';
import { useGeocoder } from '@/hooks/use-geocoder';
import { useLanguage } from '@/hooks/use-language';
import { useMapInstance } from '@/hooks/use-map-instance';
import { useMapInteractions } from '@/hooks/use-map-interactions';
import { useMarkerHighlight } from '@/hooks/use-marker-highlight';
import { useMarkers } from '@/hooks/use-markers';
import { usePlaceTypes } from '@/hooks/use-place-types';
import { useSearchMode } from '@/hooks/use-search-mode';
import { useSearchRadius } from '@/hooks/use-search-radius';
import { useSearchResults } from '@/hooks/use-search-results';
import { getBoundingBoxFromTrip } from '@/lib/map-utils';
import { update as tripsUpdate } from '@/routes/trips';
import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';

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
 * Phase 1: Simplified Travel Map Component
 * 
 * This version focuses on displaying a fullscreen map with a toolbar.
 * All panels (markers, tours, routes, AI) are temporarily hidden and will be
 * restored in Phase 2 (Desktop Floating Panels) and Phase 3 (Mobile Panels).
 */
export default function TravelMap({
    selectedTripId,
    selectedTourId,
    trips,
    onSetViewport,
}: TravelMapProps) {
    // Get current language setting
    const { language } = useLanguage();

    // Initialize map instance with language support
    const { mapRef, mapInstance } = useMapInstance({ language });

    // Get the selected trip to access its country
    const selectedTrip = trips.find((t) => t.id === selectedTripId);

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

    // Marker management - simplified for Phase 1
    const {
        markers,
        selectedMarkerId,
        setSelectedMarkerId,
        addMarker,
        updateMarkerReference,
    } = useMarkers({
        mapInstance,
        selectedTripId,
        selectedTourId,
        onMarkerClick: (id: string) => {
            setSelectedMarkerId(id);
        },
    });

    // Search results management
    useSearchResults({
        mapInstance,
        onMarkerCreated: addMarker,
        onMarkerSelected: setSelectedMarkerId,
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

    // Placeholder state for MapOptionsMenu (search feature not fully implemented)
    const searchCoordinates = null;
    const searchResultCount = null;
    const isSearching = false;
    const searchError = null;

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
            />

            {/* Map fills the entire screen */}
            <div
                className="absolute inset-0 h-full w-full"
                data-testid="map-panel"
            >
                <div ref={mapRef} id="map" className="h-full w-full" />
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

            {/* 
             * Temporarily hidden panels - will be restored in later phases
             * 
             * The following panels are commented out for Phase 1:
             * - AI Recommendations Panel
             * - Marker Panel (Desktop)
             * - Tour Panel (Desktop)
             * - Route Panel (Desktop)
             * - Mobile Draggable Sheets
             * - Mobile Bottom Navigation
             * 
             * These will be re-implemented in Phase 2 (Desktop Floating Panels)
             * and Phase 3 (Mobile Panels)
             */}

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
