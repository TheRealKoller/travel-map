import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import TourPanel from '@/components/tour-panel';
import { MarkerData, MarkerType } from '@/types/marker';
import { Tour } from '@/types/tour';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for Leaflet plugins
interface GeocodeResult {
    center: L.LatLng;
    name: string;
}

interface GeocodeEvent {
    geocode: GeocodeResult;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletExtensions = any;

// Helper function to get icon name based on marker type
const getIconForType = (type: MarkerType): string => {
    switch (type) {
        case MarkerType.Restaurant:
            return 'utensils';
        case MarkerType.Hotel:
            return 'bed';
        case MarkerType.Question:
            return 'question';
        case MarkerType.Tip:
            return 'lightbulb';
        case MarkerType.PointOfInterest:
            return 'map-pin';
        case MarkerType.Museum:
            return 'landmark';
        case MarkerType.Ruin:
            return 'monument';
        case MarkerType.UnescoWorldHeritage:
            return 'globe';
        case MarkerType.TempleChurch:
            return 'church';
        case MarkerType.FestivalParty:
            return 'champagne-glasses';
        case MarkerType.Leisure:
            return 'bicycle';
        case MarkerType.Sightseeing:
            return 'camera';
        default:
            return 'map-pin';
    }
};

// Helper function to get color based on marker type
const getColorForType = (type: MarkerType): string => {
    switch (type) {
        case MarkerType.Restaurant:
            return 'orange';
        case MarkerType.Hotel:
            return 'blue';
        case MarkerType.Question:
            return 'purple';
        case MarkerType.Tip:
            return 'green';
        case MarkerType.PointOfInterest:
            return 'cadetblue';
        case MarkerType.Museum:
            return 'darkblue';
        case MarkerType.Ruin:
            return 'darkred';
        case MarkerType.UnescoWorldHeritage:
            return 'darkgreen';
        case MarkerType.TempleChurch:
            return 'darkpurple';
        case MarkerType.FestivalParty:
            return 'pink';
        case MarkerType.Leisure:
            return 'lightgreen';
        case MarkerType.Sightseeing:
            return 'lightblue';
        default:
            return 'gray';
    }
};

// Constants
const DEFAULT_MAP_CENTER: [number, number] = [36.2048, 138.2529]; // Japan
const DEFAULT_MAP_ZOOM = 6;

interface TravelMapProps {
    selectedTripId: number | null;
    selectedTourId: number | null;
    tours: Tour[];
    onToursUpdate: (tours: Tour[]) => void;
    onSelectTour: (tourId: number | null) => void;
    onCreateTour: () => void;
}

export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
}: TravelMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
        null,
    );
    const searchMarkerRef = useRef<L.Marker | null>(null);

    // Define saveMarkerToDatabase before it's used in useEffect
    const saveMarkerToDatabase = useCallback(
        async (markerData: Omit<MarkerData, 'marker'>) => {
            try {
                const response = await axios.post('/markers', {
                    id: markerData.id,
                    name: markerData.name,
                    type: markerData.type,
                    notes: markerData.notes,
                    latitude: markerData.lat,
                    longitude: markerData.lng,
                    trip_id: selectedTripId,
                });
                return response.data.id;
            } catch (error) {
                console.error('Failed to save marker:', error);
                alert('Failed to save marker. Please try again.');
                return null;
            }
        },
        [selectedTripId],
    );

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize the map
        const map = L.map(mapRef.current).setView(
            DEFAULT_MAP_CENTER,
            DEFAULT_MAP_ZOOM,
        );
        mapInstanceRef.current = map;

        // Set crosshair cursor
        map.getContainer().style.cursor = 'crosshair';

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add geocoder search control
        (L.Control as LeafletExtensions)
            .geocoder({
                defaultMarkGeocode: false,
                placeholder: 'Search for places...',
                errorMessage: 'Nothing found.',
                collapsed: false,
            })
            .on('markgeocode', (e: GeocodeEvent) => {
                const latlng = e.geocode.center;
                const placeName = e.geocode.name || 'Searched Location';

                // Remove previous search marker if exists
                if (searchMarkerRef.current) {
                    map.removeLayer(searchMarkerRef.current);
                }

                // Center and zoom to the location
                map.setView(latlng, 16);

                // Create a temporary highlight marker with yellow color
                const highlightIcon = (
                    L as LeafletExtensions
                ).AwesomeMarkers.icon({
                    icon: 'search',
                    markerColor: 'yellow',
                    iconColor: 'black',
                    prefix: 'fa',
                    spin: false,
                });

                // Add temporary marker to highlight search result
                const searchMarker = L.marker(latlng, {
                    icon: highlightIcon,
                }).addTo(map);
                searchMarker
                    .bindPopup(
                        `<strong>${placeName}</strong><br><small>Click on this marker to add it permanently</small>`,
                    )
                    .openPopup();

                // Add click handler to convert temporary marker to permanent
                searchMarker.on('click', () => {
                    // Remove the temporary marker
                    map.removeLayer(searchMarker);
                    searchMarkerRef.current = null;

                    // Create permanent marker
                    const defaultType = MarkerType.PointOfInterest;
                    const awesomeMarker = (
                        L as LeafletExtensions
                    ).AwesomeMarkers.icon({
                        icon: getIconForType(defaultType),
                        markerColor: getColorForType(defaultType),
                        iconColor: 'white',
                        prefix: 'fa',
                        spin: false,
                    });

                    const marker = L.marker(latlng, {
                        icon: awesomeMarker,
                    }).addTo(map);
                    const markerId = uuidv4();
                    const markerData: MarkerData = {
                        id: markerId,
                        lat: latlng.lat,
                        lng: latlng.lng,
                        name: placeName,
                        type: defaultType,
                        notes: '',
                        marker: marker,
                    };

                    // Add tooltip to marker
                    marker.bindTooltip(placeName, {
                        permanent: false,
                        direction: 'top',
                    });

                    // Add click handler to permanent marker
                    marker.on('click', () => {
                        setSelectedMarkerId(markerId);
                    });

                    setMarkers((prev) => [...prev, markerData]);
                    setSelectedMarkerId(markerId);

                    // Save to database
                    saveMarkerToDatabase(markerData);
                });

                searchMarkerRef.current = searchMarker;
            })
            .addTo(map);

        // Add click event to create markers with awesome-markers
        map.on('click', (e: L.LeafletMouseEvent) => {
            const defaultType = MarkerType.PointOfInterest;
            const awesomeMarker = (L as LeafletExtensions).AwesomeMarkers.icon({
                icon: getIconForType(defaultType),
                markerColor: getColorForType(defaultType),
                iconColor: 'white',
                prefix: 'fa',
                spin: false,
            });

            const marker = L.marker(e.latlng, { icon: awesomeMarker }).addTo(
                map,
            );
            const markerId = uuidv4();
            const markerData: MarkerData = {
                id: markerId,
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name: '',
                type: defaultType,
                notes: '',
                marker: marker,
            };

            // Add tooltip to marker
            marker.bindTooltip('Unnamed Location', {
                permanent: false,
                direction: 'top',
            });

            // Add click handler to marker
            marker.on('click', () => {
                setSelectedMarkerId(markerId);
            });

            setMarkers((prev) => [...prev, markerData]);
            setSelectedMarkerId(markerId);

            // Save to database
            saveMarkerToDatabase(markerData);
        });

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [saveMarkerToDatabase]);

    // Load markers from database when trip changes
    useEffect(() => {
        const loadMarkers = async () => {
            if (!selectedTripId || !mapInstanceRef.current) return;

            try {
                const response = await axios.get('/markers', {
                    params: { trip_id: selectedTripId },
                });
                const dbMarkers = response.data;

                const map = mapInstanceRef.current;

                // Clear existing markers from map
                markers.forEach((m) => {
                    if (m.marker && map.hasLayer(m.marker)) {
                        map.removeLayer(m.marker);
                    }
                });

                const loadedMarkers: MarkerData[] = dbMarkers.map(
                    (dbMarker: {
                        id: string;
                        latitude: number;
                        longitude: number;
                        name: string;
                        type: MarkerType;
                        notes: string;
                    }) => {
                        const icon = (
                            L as LeafletExtensions
                        ).AwesomeMarkers.icon({
                            icon: getIconForType(dbMarker.type),
                            markerColor: getColorForType(dbMarker.type),
                            iconColor: 'white',
                            prefix: 'fa',
                            spin: false,
                        });

                        const marker = L.marker(
                            [dbMarker.latitude, dbMarker.longitude],
                            { icon },
                        ).addTo(map);

                        marker.bindTooltip(
                            dbMarker.name || 'Unnamed Location',
                            { permanent: false, direction: 'top' },
                        );
                        marker.on('click', () => {
                            setSelectedMarkerId(dbMarker.id);
                        });

                        return {
                            id: dbMarker.id,
                            lat: dbMarker.latitude,
                            lng: dbMarker.longitude,
                            name: dbMarker.name,
                            type: dbMarker.type,
                            notes: dbMarker.notes || '',
                            marker: marker,
                        };
                    },
                );

                setMarkers(loadedMarkers);
                setSelectedMarkerId(null);
            } catch (error) {
                console.error('Failed to load markers:', error);
                alert('Failed to load markers. Please refresh the page.');
            }
        };

        loadMarkers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTripId]);

    const handleSelectMarker = (id: string) => {
        setSelectedMarkerId(id);
    };

    const handleSaveMarker = async (
        id: string,
        name: string,
        type: MarkerType,
        notes: string,
    ) => {
        try {
            // Update in database
            await axios.put(`/markers/${id}`, { name, type, notes });

            // Update local state
            setMarkers((prev) =>
                prev.map((m) =>
                    m.id === id ? { ...m, name, type, notes } : m,
                ),
            );

            // Update marker tooltip
            const marker = markers.find((m) => m.id === id);
            if (marker) {
                marker.marker.setTooltipContent(name || 'Unnamed Location');

                // Update marker icon if type changed
                const icon = (L as LeafletExtensions).AwesomeMarkers.icon({
                    icon: getIconForType(type),
                    markerColor: getColorForType(type),
                    iconColor: 'white',
                    prefix: 'fa',
                    spin: false,
                });
                marker.marker.setIcon(icon);
            }

            // Close the form
            setSelectedMarkerId(null);
        } catch (error) {
            console.error('Failed to save marker:', error);
            alert('Failed to save marker. Please try again.');
        }
    };

    const handleCloseForm = () => {
        setSelectedMarkerId(null);
    };

    const handleDeleteMarker = async (id: string) => {
        try {
            await axios.delete(`/markers/${id}`);

            // Remove marker from map
            const marker = markers.find((m) => m.id === id);
            if (marker && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(marker.marker);
            }

            // Remove from state
            setMarkers((prev) => prev.filter((m) => m.id !== id));

            // Clear selection if deleted marker was selected
            if (selectedMarkerId === id) {
                setSelectedMarkerId(null);
            }
        } catch (error) {
            console.error('Failed to delete marker:', error);
            alert('Failed to delete marker. Please try again.');
        }
    };

    const handleToggleMarkerInTour = async (
        markerId: string,
        tourId: number,
        isInTour: boolean,
    ) => {
        try {
            if (isInTour) {
                // Detach marker from tour
                await axios.delete(`/tours/${tourId}/markers`, {
                    data: { marker_id: markerId },
                });
            } else {
                // Attach marker to tour
                await axios.post(`/tours/${tourId}/markers`, {
                    marker_id: markerId,
                });
            }

            // Reload tours to get updated marker associations
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        } catch (error) {
            console.error('Failed to update marker tour assignment:', error);
            alert('Failed to update marker tour assignment. Please try again.');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        // Check if dropped on a tour tab
        const overId = over.id as string;
        if (overId.startsWith('tour-')) {
            const tourId = parseInt(overId.replace('tour-', ''));
            const markerId = active.id as string;

            // Check if marker is already in the tour
            const tour = tours.find((t) => t.id === tourId);
            if (tour) {
                const isAlreadyInTour = tour.markers?.some(
                    (m) => m.id === markerId,
                );

                if (!isAlreadyInTour) {
                    // Attach marker to tour
                    await handleToggleMarkerInTour(markerId, tourId, false);
                }
            }
        }
    };

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="flex h-full flex-col gap-4 lg:flex-row">
                {/* Part 1: Marker list or form */}
                <div className="w-full lg:w-1/4">
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
                            onSelectMarker={handleSelectMarker}
                        />
                    )}
                </div>

                {/* Part 2: Tour panel */}
                <div className="w-full lg:w-1/4">
                    <TourPanel
                        tours={tours}
                        selectedTourId={selectedTourId}
                        onSelectTour={onSelectTour}
                        onCreateTour={onCreateTour}
                        markers={markers}
                    />
                </div>

                {/* Part 3: Map */}
                <div className="w-full flex-1 lg:w-1/2">
                    <div
                        ref={mapRef}
                        id="map"
                        className="z-10 h-[400px] w-full lg:h-[600px]"
                    />
                </div>
            </div>
        </DndContext>
    );
}
