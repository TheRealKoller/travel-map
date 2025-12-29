import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import { MarkerData, MarkerType } from '@/types/marker';
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
        default:
            return 'gray';
    }
};

// Constants
const DEFAULT_MAP_CENTER: [number, number] = [36.2048, 138.2529]; // Japan
const DEFAULT_MAP_ZOOM = 6;
const DEBOUNCE_DELAY_MS = 500;

interface TravelMapProps {
    selectedTripId: number | null;
}

export default function TravelMap({ selectedTripId }: TravelMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
        null,
    );
    const searchMarkerRef = useRef<L.Marker | null>(null);
    // Refs to store timeout IDs for debouncing
    const updateNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const updateNotesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Refs to track previous values for optimization
    const prevSelectedMarkerIdRef = useRef<string | null>(null);
    const prevMarkerNamesRef = useRef<{ [id: string]: string }>({});

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

    // Only update marker icon when selection changes
    useEffect(() => {
        if (prevSelectedMarkerIdRef.current !== selectedMarkerId) {
            // Update previously selected marker icon
            if (prevSelectedMarkerIdRef.current) {
                const prevMarker = markers.find(
                    (m) => m.id === prevSelectedMarkerIdRef.current,
                );
                if (prevMarker) {
                    const icon = (L as LeafletExtensions).AwesomeMarkers.icon({
                        icon: getIconForType(prevMarker.type),
                        markerColor: getColorForType(prevMarker.type),
                        iconColor: 'white',
                        prefix: 'fa',
                        spin: false,
                    });
                    prevMarker.marker.setIcon(icon);
                }
            }
            // Update newly selected marker icon
            if (selectedMarkerId) {
                const selectedMarker = markers.find(
                    (m) => m.id === selectedMarkerId,
                );
                if (selectedMarker) {
                    const icon = (L as LeafletExtensions).AwesomeMarkers.icon({
                        icon: getIconForType(selectedMarker.type),
                        markerColor: 'red',
                        iconColor: 'white',
                        prefix: 'fa',
                        spin: true,
                    });
                    selectedMarker.marker.setIcon(icon);
                }
            }
            prevSelectedMarkerIdRef.current = selectedMarkerId;
        }
    }, [selectedMarkerId, markers]);

    // Only update marker tooltip when name changes
    useEffect(() => {
        markers.forEach((markerData) => {
            const prevName = prevMarkerNamesRef.current[markerData.id];
            if (markerData.name !== prevName) {
                const tooltipContent = markerData.name || 'Unnamed Location';
                markerData.marker.setTooltipContent(tooltipContent);
                prevMarkerNamesRef.current[markerData.id] = markerData.name;
            }
        });
    }, [markers]);

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

    // Debounced API call for updating marker name
    const debouncedUpdateMarkerName = useCallback(
        (id: string, name: string) => {
            if (updateNameTimeoutRef.current) {
                clearTimeout(updateNameTimeoutRef.current);
            }
            updateNameTimeoutRef.current = setTimeout(async () => {
                try {
                    await axios.put(`/markers/${id}`, { name });
                } catch (error) {
                    console.error('Failed to update marker name:', error);
                    alert('Failed to update marker name. Please try again.');
                }
            }, DEBOUNCE_DELAY_MS);
        },
        [],
    );

    const handleUpdateMarkerName = (id: string, name: string) => {
        // Update local state immediately
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, name } : m)),
        );

        // Debounce the API call
        debouncedUpdateMarkerName(id, name);
    };

    const handleUpdateMarkerType = async (id: string, type: MarkerType) => {
        // Update local state immediately
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, type } : m)),
        );

        // Update in database (not debounced as dropdown changes are infrequent)
        const marker = markers.find((m) => m.id === id);
        if (marker) {
            try {
                await axios.put(`/markers/${marker.id}`, { type });
            } catch (error) {
                console.error('Failed to update marker type:', error);
                alert('Failed to update marker type. Please try again.');
            }
        }
    };

    // Debounced API call for updating marker notes
    const debouncedUpdateMarkerNotes = useCallback(
        (id: string, notes: string) => {
            // Clear previous timeout if it exists
            if (updateNotesTimeoutRef.current) {
                clearTimeout(updateNotesTimeoutRef.current);
            }
            updateNotesTimeoutRef.current = setTimeout(async () => {
                try {
                    await axios.put(`/markers/${id}`, { notes });
                } catch (error) {
                    console.error('Failed to update marker notes:', error);
                    alert('Failed to update marker notes. Please try again.');
                }
            }, DEBOUNCE_DELAY_MS);
        },
        [],
    );

    const handleUpdateMarkerNotes = (id: string, notes: string) => {
        // Update local state immediately
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, notes } : m)),
        );

        // Debounce the API call
        debouncedUpdateMarkerNotes(id, notes);
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

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    return (
        <div>
            <div ref={mapRef} id="map" className="z-10 mt-5 h-[600px] w-full" />

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <MarkerForm
                    marker={selectedMarker}
                    onUpdateName={handleUpdateMarkerName}
                    onUpdateType={handleUpdateMarkerType}
                    onUpdateNotes={handleUpdateMarkerNotes}
                    onDeleteMarker={handleDeleteMarker}
                />
                <MarkerList
                    markers={markers}
                    selectedMarkerId={selectedMarkerId}
                    onSelectMarker={handleSelectMarker}
                />
            </div>
        </div>
    );
}
