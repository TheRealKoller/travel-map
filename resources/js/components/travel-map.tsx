import MapOptionsMenu from '@/components/map-options-menu';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import TourPanel from '@/components/tour-panel';
import { MarkerData, MarkerType } from '@/types/marker';
import { Tour } from '@/types/tour';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for Leaflet plugins
interface GeocodeResult {
    center: L.LatLng;
    name: string;
}

interface GeocodeEvent {
    geocode: GeocodeResult;
}

interface PlaceType {
    value: string;
    label: string;
}

interface SearchResult {
    lat: number;
    lon: number;
    name?: string;
    name_en?: string;
    name_int?: string;
    type?: string;
    website?: string;
    description?: string;
    fee?: string;
    opening_hours?: string;
    address?: {
        street?: string;
        housenumber?: string;
        postcode?: string;
        city?: string;
        country?: string;
    };
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

// Helper function to map OSM place type to MarkerType
const getMarkerTypeFromOSMType = (osmType?: string): MarkerType => {
    if (!osmType) {
        return MarkerType.PointOfInterest;
    }

    // Convert to lowercase for case-insensitive matching
    const type = osmType.toLowerCase();

    // Restaurant category
    if (
        type === 'restaurant' ||
        type === 'cafe' ||
        type === 'bar' ||
        type === 'pub' ||
        type === 'fast_food'
    ) {
        return MarkerType.Restaurant;
    }

    // Hotel category
    if (
        type === 'hotel' ||
        type === 'guest_house' ||
        type === 'hostel' ||
        type === 'motel'
    ) {
        return MarkerType.Hotel;
    }

    // Museum category
    if (type === 'museum' || type === 'gallery') {
        return MarkerType.Museum;
    }

    // Ruin category
    if (type === 'ruins' || type === 'archaeological_site') {
        return MarkerType.Ruin;
    }

    // Temple/Church category
    if (
        type === 'place_of_worship' ||
        type === 'church' ||
        type === 'temple' ||
        type === 'mosque' ||
        type === 'shrine'
    ) {
        return MarkerType.TempleChurch;
    }

    // Festival/Party category
    if (
        type === 'nightclub' ||
        type === 'theatre' ||
        type === 'cinema' ||
        type === 'arts_centre'
    ) {
        return MarkerType.FestivalParty;
    }

    // Leisure category
    if (
        type === 'park' ||
        type === 'garden' ||
        type === 'playground' ||
        type === 'sports_centre' ||
        type === 'swimming_pool' ||
        type === 'beach' ||
        type === 'marina'
    ) {
        return MarkerType.Leisure;
    }

    // Sightseeing category
    if (
        type === 'attraction' ||
        type === 'viewpoint' ||
        type === 'monument' ||
        type === 'memorial' ||
        type === 'castle' ||
        type === 'artwork' ||
        type === 'zoo' ||
        type === 'theme_park'
    ) {
        return MarkerType.Sightseeing;
    }

    // Default to Point of Interest for anything else
    return MarkerType.PointOfInterest;
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
    onCreateSubTour: (parentTourId: number) => void;
    onDeleteTour: (tourId: number) => void;
}

export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
    onCreateSubTour,
    onDeleteTour,
}: TravelMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
        null,
    );
    const searchMarkerRef = useRef<L.Marker | null>(null);
    const previousSelectedMarkerRef = useRef<string | null>(null);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const isSearchModeRef = useRef(false);
    const [searchCoordinates, setSearchCoordinates] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 km
    const searchRadiusRef = useRef<number>(10); // Ref for use in event handlers
    const [searchResultCount, setSearchResultCount] = useState<number | null>(
        null,
    );
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
    const [selectedPlaceType, setSelectedPlaceType] = useState<string>('all');
    const selectedPlaceTypeRef = useRef<string>('all'); // Ref for use in event handlers
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const searchResultCirclesRef = useRef<L.Circle[]>([]);
    const searchRadiusCircleRef = useRef<L.Circle | null>(null);

    // Configure drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 12, // Require 12px of movement to prevent accidental drags
            },
        }),
    );

    // Note: saveMarkerToDatabase is no longer needed as we save when user clicks Save button

    // Filter markers visibility based on selected tour
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        if (selectedTourId === null) {
            // Show all markers when no tour is selected
            markers.forEach((marker) => {
                if (!map.hasLayer(marker.marker)) {
                    marker.marker.addTo(map);
                }
            });
        } else {
            // Find the selected tour
            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (selectedTour) {
                // Get marker IDs that belong to the selected tour
                const tourMarkerIds = new Set(
                    selectedTour.markers?.map((m) => m.id) || [],
                );

                // Show/hide markers based on whether they belong to the tour
                markers.forEach((marker) => {
                    if (tourMarkerIds.has(marker.id)) {
                        // Show marker if it belongs to the tour
                        if (!map.hasLayer(marker.marker)) {
                            marker.marker.addTo(map);
                        }
                    } else {
                        // Hide marker if it doesn't belong to the tour
                        if (map.hasLayer(marker.marker)) {
                            map.removeLayer(marker.marker);
                        }
                    }
                });
            } else {
                // Tour not found, hide all markers
                markers.forEach((marker) => {
                    if (map.hasLayer(marker.marker)) {
                        map.removeLayer(marker.marker);
                    }
                });
            }
        }
    }, [selectedTourId, markers, tours]);

    // Highlight selected marker effect
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        // Restore previous marker to its original appearance
        if (previousSelectedMarkerRef.current) {
            const prevMarker = markers.find(
                (m) => m.id === previousSelectedMarkerRef.current,
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

        // Highlight the currently selected marker
        if (selectedMarkerId) {
            const selectedMarker = markers.find(
                (m) => m.id === selectedMarkerId,
            );
            if (selectedMarker) {
                const highlightIcon = (
                    L as LeafletExtensions
                ).AwesomeMarkers.icon({
                    icon: getIconForType(selectedMarker.type),
                    markerColor: 'red',
                    iconColor: 'white',
                    prefix: 'fa',
                    spin: false,
                });
                selectedMarker.marker.setIcon(highlightIcon);
            }
        }

        // Update the ref for the next iteration
        previousSelectedMarkerRef.current = selectedMarkerId;
    }, [selectedMarkerId, markers]);

    // Update cursor based on search mode
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;
        // Update the ref for use in event handlers
        isSearchModeRef.current = isSearchMode;

        if (isSearchMode) {
            // Change cursor to magnifying glass (zoom-in) for search mode
            map.getContainer().style.cursor = 'zoom-in';
        } else {
            // Restore crosshair cursor for normal mode
            map.getContainer().style.cursor = 'crosshair';
        }
    }, [isSearchMode]);

    // Update search radius ref when radius changes
    useEffect(() => {
        searchRadiusRef.current = searchRadius;
    }, [searchRadius]);

    // Update place type ref when it changes
    useEffect(() => {
        selectedPlaceTypeRef.current = selectedPlaceType;
    }, [selectedPlaceType]);

    // Display blue circles for search results
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Remove existing circles
        searchResultCirclesRef.current.forEach((circle) => {
            map.removeLayer(circle);
        });
        searchResultCirclesRef.current = [];

        // Add new circles for search results
        if (searchResults.length > 0) {
            const circles = searchResults.map((result) => {
                const circle = L.circle([result.lat, result.lon], {
                    color: 'blue',
                    fillColor: 'blue',
                    fillOpacity: 0.3,
                    radius: 150, // 150 meters radius for better visibility and clickability
                }).addTo(map);

                // Add tooltip with priority: English name > International name > Local name
                const displayName =
                    result.name_en || result.name_int || result.name;
                if (displayName) {
                    circle.bindTooltip(displayName, {
                        permanent: false,
                        direction: 'top',
                    });
                }

                // Add click handler to create a marker from search result
                circle.on('click', (e: L.LeafletMouseEvent) => {
                    // Prevent event from bubbling to the map's click handler
                    L.DomEvent.stopPropagation(e);

                    // Get the name with priority: English > International > Local
                    const markerName =
                        result.name_en || result.name_int || result.name || '';

                    // Get the appropriate marker type based on OSM type
                    const markerType = getMarkerTypeFromOSMType(result.type);

                    // Create a marker icon
                    const awesomeMarker = (
                        L as LeafletExtensions
                    ).AwesomeMarkers.icon({
                        icon: getIconForType(markerType),
                        markerColor: getColorForType(markerType),
                        iconColor: 'white',
                        prefix: 'fa',
                        spin: false,
                    });

                    // Create the marker
                    const marker = L.marker([result.lat, result.lon], {
                        icon: awesomeMarker,
                    }).addTo(map);

                    const markerId = uuidv4();
                    const markerData: MarkerData = {
                        id: markerId,
                        lat: result.lat,
                        lng: result.lon,
                        name: markerName,
                        type: markerType,
                        notes: '',
                        url: '',
                        isUnesco: false,
                        marker: marker,
                        isSaved: false, // Mark as unsaved
                    };

                    // Add tooltip to marker
                    marker.bindTooltip(markerName || 'Unnamed Location', {
                        permanent: false,
                        direction: 'top',
                    });

                    // Add click handler to marker
                    marker.on('click', () => {
                        setSelectedMarkerId(markerId);
                    });

                    // Add marker to state
                    setMarkers((prev) => [...prev, markerData]);
                    setSelectedMarkerId(markerId);

                    // Remove the blue circle since we've created a marker from it
                    map.removeLayer(circle);
                });

                return circle;
            });

            searchResultCirclesRef.current = circles;
        }
    }, [searchResults]);

    // Display gray dashed circle for search radius
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Remove existing search radius circle
        if (searchRadiusCircleRef.current) {
            map.removeLayer(searchRadiusCircleRef.current);
            searchRadiusCircleRef.current = null;
        }

        // Add new search radius circle when coordinates are available
        if (searchCoordinates) {
            const radiusInMeters = searchRadius * 1000; // Convert km to meters
            const circle = L.circle(
                [searchCoordinates.lat, searchCoordinates.lng],
                {
                    color: 'gray',
                    fillColor: 'gray',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '10, 10', // Dashed line pattern
                    radius: radiusInMeters,
                },
            ).addTo(map);

            searchRadiusCircleRef.current = circle;
        }
    }, [searchCoordinates, searchRadius]);

    // Fetch available place types on component mount
    useEffect(() => {
        const fetchPlaceTypes = async () => {
            try {
                const response = await axios.get('/markers/place-types');
                setPlaceTypes(response.data);
            } catch (error) {
                console.error('Failed to load place types:', error);
                // Set default place types if API call fails
                setPlaceTypes([{ value: 'all', label: 'Alle Orte' }]);
            }
        };

        fetchPlaceTypes();
    }, []);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize the map
        const map = L.map(mapRef.current, {
            zoomSnap: 0,
            zoomDelta: 0.25,
        }).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
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
                        url: '',
                        isUnesco: false,
                        marker: marker,
                        isSaved: false, // Mark as unsaved
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

                    // Do NOT save to database yet - wait for user to click Save button
                });

                searchMarkerRef.current = searchMarker;
            })
            .addTo(map);

        // Add click event to create markers with awesome-markers
        map.on('click', async (e: L.LeafletMouseEvent) => {
            // Check if we're in search mode
            if (isSearchModeRef.current) {
                // In search mode, draw the search radius circle first
                setSearchCoordinates({
                    lat: e.latlng.lat,
                    lng: e.latlng.lng,
                });

                // Remove previous search radius circle if it exists
                if (searchRadiusCircleRef.current) {
                    map.removeLayer(searchRadiusCircleRef.current);
                }

                // Draw the search radius circle (radius in meters = km * 1000)
                const circle = L.circle(e.latlng, {
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    radius: searchRadiusRef.current * 1000,
                }).addTo(map);

                searchRadiusCircleRef.current = circle;

                // Zoom to fit the circle bounds with asymmetric padding
                // More padding on the right to keep the circle center-left,
                // so the options menu doesn't cover the circle
                const bounds = circle.getBounds();
                map.fitBounds(bounds, {
                    paddingTopLeft: [50, 50],
                    paddingBottomRight: [350, 50],
                });

                // Call the search API
                setIsSearching(true);
                setSearchError(null);
                setSearchResultCount(null);
                setSearchResults([]); // Clear previous results

                try {
                    const response = await axios.post(
                        '/markers/search-nearby',
                        {
                            latitude: e.latlng.lat,
                            longitude: e.latlng.lng,
                            radius_km: searchRadiusRef.current,
                            place_type: selectedPlaceTypeRef.current,
                        },
                    );

                    if (response.data.error) {
                        setSearchError(response.data.error);
                        setSearchResultCount(null);
                        setSearchResults([]);
                    } else {
                        setSearchResultCount(response.data.count);
                        setSearchResults(response.data.results || []);
                        setSearchError(null);

                        // Log search results to console for debugging
                        console.log(
                            'Proximity search results:',
                            response.data.results,
                        );
                        console.log(`Found ${response.data.count} results`);
                    }
                } catch (error) {
                    console.error('Failed to search nearby:', error);
                    setSearchError('Failed to search nearby locations');
                    setSearchResultCount(null);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                    // Deactivate search mode after search is executed
                    setIsSearchMode(false);
                }

                return;
            }

            // Normal mode: create a marker
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
                url: '',
                isUnesco: false,
                marker: marker,
                isSaved: false, // Mark as unsaved
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

            // Do NOT save to database yet - wait for user to click Save button
        });

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

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
                        url: string;
                        is_unesco: boolean;
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
                            url: dbMarker.url || '',
                            isUnesco: dbMarker.is_unesco || false,
                            marker: marker,
                            isSaved: true, // Markers from database are already saved
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
        url: string,
        isUnesco: boolean,
    ) => {
        try {
            const markerToSave = markers.find((m) => m.id === id);
            if (!markerToSave) {
                console.error('Marker not found');
                return;
            }

            if (markerToSave.isSaved) {
                // Update existing marker in database
                await axios.put(`/markers/${id}`, {
                    name,
                    type,
                    notes,
                    url,
                    is_unesco: isUnesco,
                });
            } else {
                // Create new marker in database
                await axios.post('/markers', {
                    id: id,
                    name: name,
                    type: type,
                    notes: notes,
                    url: url,
                    latitude: markerToSave.lat,
                    longitude: markerToSave.lng,
                    trip_id: selectedTripId,
                    is_unesco: isUnesco,
                });
            }

            // Update local state - mark as saved
            setMarkers((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? {
                              ...m,
                              name,
                              type,
                              notes,
                              url,
                              isUnesco,
                              isSaved: true,
                          }
                        : m,
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
        // If closing an unsaved marker, remove it from the map and state
        if (selectedMarkerId) {
            const marker = markers.find((m) => m.id === selectedMarkerId);
            if (marker && !marker.isSaved) {
                // Remove marker from map
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(marker.marker);
                }
                // Remove from state
                setMarkers((prev) =>
                    prev.filter((m) => m.id !== selectedMarkerId),
                );
            }
        }
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
            if (axios.isAxiosError(error) && error.response) {
                console.error('Error response:', error.response.data);
                alert(
                    `Failed to update marker tour assignment: ${error.response.data.error || error.response.data.message || 'Unknown error'}`,
                );
            } else {
                alert(
                    'Failed to update marker tour assignment. Please try again.',
                );
            }
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // CASE 1: Dragging a marker from sidebar over a tour item (marker or subtour in a tour)
        // This handles adding a marker to a tour by dropping it on an existing item in that tour
        if (!activeId.startsWith('tour-item-') && overId.startsWith('tour-item-')) {
            
            // Extract the marker ID being dragged
            const markerId = activeId;
            
            // Find which tour contains the item we dropped on
            let targetTourId: number | null = null;
            
            // Check if dropped on a marker in a tour
            if (overId.startsWith('tour-item-marker-')) {
                const overMarkerId = overId.replace('tour-item-marker-', '');
                
                // Find which tour contains this marker
                const findTourWithMarker = (markerId: string): Tour | null => {
                    // Check sub-tours FIRST (they have priority over parent tours)
                    for (const tour of tours) {
                        if (tour.sub_tours) {
                            for (const subTour of tour.sub_tours) {
                                if (subTour.markers?.some(m => m.id === markerId)) {
                                    return subTour;
                                }
                            }
                        }
                    }
                    
                    // Then check top-level tours
                    for (const tour of tours) {
                        if (tour.markers?.some(m => m.id === markerId)) {
                            return tour;
                        }
                    }
                    
                    return null;
                };
                
                const targetTour = findTourWithMarker(overMarkerId);
                if (targetTour) {
                    targetTourId = targetTour.id;
                }
            }
            // Check if dropped on a subtour in a tour
            else if (overId.startsWith('tour-item-subtour-')) {
                targetTourId = parseInt(overId.replace('tour-item-subtour-', ''));
            }
            
            if (targetTourId !== null && !isNaN(targetTourId)) {
                await handleToggleMarkerInTour(markerId, targetTourId, false);
                return;
            }
        }

        // Check if this is reordering within a tour (mixed items: markers and sub-tours)
        // This handles drag-and-drop reordering of items within the selected parent tour
        if (
            activeId !== overId &&
            activeId.startsWith('tour-item-') &&
            overId.startsWith('tour-item-') &&
            selectedTourId !== null
        ) {
            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (!selectedTour) return;

            // Step 1: Build a combined list of all items (markers and sub-tours) in the tour
            // This allows markers and sub-tours to be reordered together
            type TourItem =
                | { type: 'marker'; id: string; position: number }
                | { type: 'subtour'; id: number; position: number };

            const items: TourItem[] = [];

            // Add all markers from the tour with their current positions
            selectedTour.markers?.forEach((m) => {
                items.push({
                    type: 'marker',
                    id: m.id,
                    position: m.position || 0,
                });
            });

            // Add all sub-tours from the tour with their current positions
            selectedTour.sub_tours?.forEach((st) => {
                items.push({
                    type: 'subtour',
                    id: st.id,
                    position: st.position,
                });
            });

            // Step 2: Sort items by their current position to get the correct order
            items.sort((a, b) => a.position - b.position);

            // Step 3: Find the indices of the dragged item (active) and drop target (over)
            const activeIndex = items.findIndex((item) => {
                const itemId =
                    item.type === 'marker'
                        ? `tour-item-marker-${item.id}`
                        : `tour-item-subtour-${item.id}`;
                return itemId === activeId;
            });

            const overIndex = items.findIndex((item) => {
                const itemId =
                    item.type === 'marker'
                        ? `tour-item-marker-${item.id}`
                        : `tour-item-subtour-${item.id}`;
                return itemId === overId;
            });

            if (activeIndex !== -1 && overIndex !== -1) {
                // Step 4: Reorder the items array by moving the active item to the over position
                const reorderedItems = arrayMove(items, activeIndex, overIndex);

                // Step 5: Prepare the reordered data in the format expected by the backend API
                const itemsForBackend = reorderedItems.map((item) => ({
                    type: item.type,
                    id: item.type === 'marker' ? item.id : item.id.toString(),
                }));

                // Step 6: Optimistically update the UI with new positions before server response
                // This provides immediate visual feedback to the user
                const updatedMarkers = reorderedItems
                    .map((item, index) => {
                        if (item.type === 'marker') {
                            const marker = selectedTour.markers?.find(
                                (m) => m.id === item.id,
                            );
                            return marker
                                ? { ...marker, position: index }
                                : undefined;
                        }
                        return undefined;
                    })
                    .filter((m): m is NonNullable<typeof m> => m !== undefined);

                const updatedSubTours = reorderedItems
                    .map((item, index) => {
                        if (item.type === 'subtour') {
                            const subTour = selectedTour.sub_tours?.find(
                                (st) => st.id === item.id,
                            );
                            return subTour
                                ? { ...subTour, position: index }
                                : undefined;
                        }
                        return undefined;
                    })
                    .filter(
                        (st): st is NonNullable<typeof st> => st !== undefined,
                    );

                // Update the tours state with the new order
                const updatedTours = tours.map((t) =>
                    t.id === selectedTourId
                        ? {
                              ...t,
                              markers: updatedMarkers,
                              sub_tours: updatedSubTours,
                          }
                        : t,
                );

                onToursUpdate(updatedTours);

                // Step 7: Send the reorder request to the server and reload data
                try {
                    await axios.put(`/tours/${selectedTourId}/items/reorder`, {
                        items: itemsForBackend,
                    });

                    // Reload tours from server to ensure we have the latest correct data
                    if (selectedTripId) {
                        const response = await axios.get('/tours', {
                            params: { trip_id: selectedTripId },
                        });
                        onToursUpdate(response.data);
                    }
                } catch (error) {
                    console.error('Failed to reorder items:', error);
                    alert(
                        'Failed to reorder items. The order has been reverted.',
                    );
                    // Step 8: Revert the optimistic update on error by reloading from server
                    if (selectedTripId) {
                        const response = await axios.get('/tours', {
                            params: { trip_id: selectedTripId },
                        });
                        onToursUpdate(response.data);
                    }
                }
                return;
            }
        }

        // Check if this is reordering within a sub-tour (markers only)
        if (
            activeId !== overId &&
            activeId.startsWith('tour-marker-') &&
            selectedTourId !== null
        ) {
            // Extract actual marker IDs by removing the prefix
            const activeMarkerId = activeId.replace('tour-marker-', '');
            const overMarkerId = overId.replace('tour-marker-', '');

            const selectedTour = tours.find((t) => t.id === selectedTourId);

            // Helper function to find which tour (parent or sub) contains both markers
            const findTourWithMarkers = (
                tour: Tour | undefined,
            ): Tour | null => {
                if (!tour) return null;

                // Check sub-tours only (parent tour uses tour-item- prefix)
                if (tour.sub_tours) {
                    for (const subTour of tour.sub_tours) {
                        if (subTour.markers) {
                            const hasActive = subTour.markers.some(
                                (m) => m.id === activeMarkerId,
                            );
                            const hasOver = subTour.markers.some(
                                (m) => m.id === overMarkerId,
                            );
                            if (hasActive && hasOver) {
                                return subTour;
                            }
                        }
                    }
                }

                return null;
            };

            const tourWithMarkers = findTourWithMarkers(selectedTour);

            if (tourWithMarkers && tourWithMarkers.markers) {
                const oldIndex = tourWithMarkers.markers.findIndex(
                    (m) => m.id === activeMarkerId,
                );
                const newIndex = tourWithMarkers.markers.findIndex(
                    (m) => m.id === overMarkerId,
                );

                if (oldIndex !== -1 && newIndex !== -1) {
                    // Reorder markers in the sub-tour
                    const reorderedMarkers = arrayMove(
                        tourWithMarkers.markers,
                        oldIndex,
                        newIndex,
                    );

                    // Update tours state optimistically
                    const updatedTours = tours.map((t) => {
                        if (t.id === selectedTourId) {
                            return {
                                ...t,
                                sub_tours: t.sub_tours?.map((st) =>
                                    st.id === tourWithMarkers.id
                                        ? { ...st, markers: reorderedMarkers }
                                        : st,
                                ),
                            };
                        }
                        return t;
                    });
                    onToursUpdate(updatedTours);

                    // Send reorder request to server
                    try {
                        await axios.put(
                            `/tours/${tourWithMarkers.id}/markers/reorder`,
                            {
                                marker_ids: reorderedMarkers.map((m) => m.id),
                            },
                        );
                    } catch (error) {
                        console.error('Failed to reorder markers:', error);
                        alert(
                            'Failed to reorder markers. The order has been reverted.',
                        );
                        // Revert on error
                        if (selectedTripId) {
                            const response = await axios.get('/tours', {
                                params: { trip_id: selectedTripId },
                            });
                            onToursUpdate(response.data);
                        }
                    }
                    return;
                }
            }
        }

        // Check if dropped on a tour or sub-tour (adding marker to tour)
        let tourId: number | null = null;
        
        // Check if dropped on a sub-tour item in mixed list
        if (overId.startsWith('tour-item-subtour-')) {
            tourId = parseInt(overId.replace('tour-item-subtour-', ''));
        } 
        // Check if dropped on a regular tour tab
        else if (overId.startsWith('tour-') && !overId.startsWith('tour-item-')) {
            tourId = parseInt(overId.replace('tour-', ''));
        }

        if (tourId !== null && !isNaN(tourId)) {
            const markerId = activeId;

            // Helper function to find a tour (including sub-tours)
            const findTourById = (id: number): Tour | null => {
                // Check top-level tours
                const topLevelTour = tours.find((t) => t.id === id);
                if (topLevelTour) return topLevelTour;

                // Check sub-tours
                for (const tour of tours) {
                    if (tour.sub_tours) {
                        const subTour = tour.sub_tours.find(
                            (st) => st.id === id,
                        );
                        if (subTour) return subTour;
                    }
                }

                return null;
            };

            // Find the tour (could be top-level or sub-tour)
            const tour = findTourById(tourId);

            if (tour) {
                const isAlreadyInTour = tour.markers?.some(
                    (m) => m.id === markerId,
                );
                
                if (isAlreadyInTour) {
                    // Don't show alert, just skip silently as this is expected behavior
                    return;
                }

                // Attach marker to tour
                await handleToggleMarkerInTour(markerId, tourId, false);
            }
        }
    };

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
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
                        onCreateSubTour={onCreateSubTour}
                        onDeleteTour={onDeleteTour}
                        markers={markers}
                    />
                </div>

                {/* Part 3: Map */}
                <div className="w-full flex-1 lg:w-1/2">
                    <div className="relative">
                        <div
                            ref={mapRef}
                            id="map"
                            className="z-10 h-[400px] w-full lg:h-[600px]"
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
        </DndContext>
    );
}
