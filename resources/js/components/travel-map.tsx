import MapOptionsMenu from '@/components/map-options-menu';
import MarkerForm from '@/components/marker-form';
import MarkerList from '@/components/marker-list';
import RoutePanel from '@/components/route-panel';
import TourPanel from '@/components/tour-panel';
import { MarkerData, MarkerType } from '@/types/marker';
import { Route } from '@/types/route';
import { Tour } from '@/types/tour';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import mapboxgl, {
    FeatureSelector,
    GeoJSONFeature,
    TargetFeature,
} from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for geocoder
interface GeocodeResult {
    center: [number, number];
    place_name: string;
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

// Helper function to get icon name based on marker type
const getIconForType = (type: MarkerType): string => {
    switch (type) {
        case MarkerType.Restaurant:
            return 'fa-utensils';
        case MarkerType.Hotel:
            return 'fa-bed';
        case MarkerType.Question:
            return 'fa-question';
        case MarkerType.Tip:
            return 'fa-lightbulb';
        case MarkerType.PointOfInterest:
            return 'fa-map-pin';
        case MarkerType.Museum:
            return 'fa-landmark';
        case MarkerType.Ruin:
            return 'fa-monument';
        case MarkerType.TempleChurch:
            return 'fa-church';
        case MarkerType.FestivalParty:
            return 'fa-champagne-glasses';
        case MarkerType.Leisure:
            return 'fa-bicycle';
        case MarkerType.Sightseeing:
            return 'fa-camera';
        case MarkerType.NaturalAttraction:
            return 'fa-mountain';
        case MarkerType.City:
            return 'fa-city';
        case MarkerType.Village:
            return 'fa-home';
        case MarkerType.Region:
            return 'fa-map';
        default:
            return 'fa-map-pin';
    }
};

// Helper function to get CSS class for marker type
const getMarkerTypeClass = (type: MarkerType): string => {
    const typeMap: Record<MarkerType, string> = {
        [MarkerType.Restaurant]: 'mapbox-marker--restaurant',
        [MarkerType.Hotel]: 'mapbox-marker--hotel',
        [MarkerType.Question]: 'mapbox-marker--question',
        [MarkerType.Tip]: 'mapbox-marker--tip',
        [MarkerType.PointOfInterest]: 'mapbox-marker--point-of-interest',
        [MarkerType.Museum]: 'mapbox-marker--museum',
        [MarkerType.Ruin]: 'mapbox-marker--ruin',
        [MarkerType.TempleChurch]: 'mapbox-marker--temple-church',
        [MarkerType.FestivalParty]: 'mapbox-marker--festival-party',
        [MarkerType.Leisure]: 'mapbox-marker--leisure',
        [MarkerType.Sightseeing]: 'mapbox-marker--sightseeing',
        [MarkerType.NaturalAttraction]: 'mapbox-marker--natural-attraction',
        [MarkerType.City]: 'mapbox-marker--city',
        [MarkerType.Village]: 'mapbox-marker--village',
        [MarkerType.Region]: 'mapbox-marker--region',
    };
    return typeMap[type] || 'mapbox-marker--point-of-interest';
};

// Helper function to create a custom marker element for Mapbox GL
const createMarkerElement = (
    type: MarkerType,
    isHighlighted = false,
): HTMLDivElement => {
    const el = document.createElement('div');
    const typeClass = getMarkerTypeClass(type);
    const highlightClass = isHighlighted ? 'mapbox-marker--highlighted' : '';
    const icon = getIconForType(type);

    el.innerHTML = `
        <div class="mapbox-marker ${typeClass} ${highlightClass}">
            <div class="mapbox-marker__icon">
                <i class="fa ${icon}"></i>
            </div>
        </div>
    `;

    return el;
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

// Helper function to map Mapbox POI class to MarkerType
const getMarkerTypeFromMapboxClass = (mapboxClass?: string): MarkerType => {
    if (!mapboxClass) {
        return MarkerType.PointOfInterest;
    }

    // Use the same logic as OSM types
    return getMarkerTypeFromOSMType(mapboxClass);
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
    onDeleteTour: (tourId: number) => void;
}

export default function TravelMap({
    selectedTripId,
    selectedTourId,
    tours,
    onToursUpdate,
    onSelectTour,
    onCreateTour,
    onDeleteTour,
}: TravelMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
        null,
    );
    const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const previousSelectedMarkerRef = useRef<string | null>(null);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const isSearchModeRef = useRef(false);
    const [searchCoordinates] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(5); // Default 5 km
    const searchRadiusRef = useRef<number>(10); // Ref for use in event handlers
    const [searchResultCount] = useState<number | null>(null);
    const [isSearching] = useState(false);
    const [searchError] = useState<string | null>(null);
    const [placeTypes, setPlaceTypes] = useState<PlaceType[]>([]);
    const [selectedPlaceType, setSelectedPlaceType] = useState<string>('all');
    const selectedPlaceTypeRef = useRef<string>('all'); // Ref for use in event handlers
    const [searchResults] = useState<SearchResult[]>([]);
    const searchResultMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const searchRadiusCircleLayerIdRef = useRef<string | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const routeLayerIdsRef = useRef<Map<number, string>>(new Map());
    const [isTourPanelCollapsed, setIsTourPanelCollapsed] = useState(true);
    const [isRoutePanelCollapsed, setIsRoutePanelCollapsed] = useState(true);

    // Note: saveMarkerToDatabase is no longer needed as we save when user clicks Save button

    // Filter markers visibility based on selected tour
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        if (selectedTourId === null) {
            // Show all markers when no tour is selected
            markers.forEach((marker) => {
                const mapboxMarker = marker.marker;
                if (mapboxMarker && mapInstanceRef.current) {
                    mapboxMarker.addTo(mapInstanceRef.current);
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
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        if (tourMarkerIds.has(marker.id)) {
                            // Show marker if it belongs to the tour
                            if (mapInstanceRef.current) {
                                mapboxMarker.addTo(mapInstanceRef.current);
                            }
                        } else {
                            // Hide marker if it doesn't belong to the tour
                            mapboxMarker.remove();
                        }
                    }
                });
            } else {
                // Tour not found, hide all markers
                markers.forEach((marker) => {
                    const mapboxMarker = marker.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
                    }
                });
            }
        }
    }, [selectedTourId, markers, tours]);

    // Highlight selected marker effect
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Restore previous marker to its original appearance
        if (previousSelectedMarkerRef.current) {
            const prevMarker = markers.find(
                (m) => m.id === previousSelectedMarkerRef.current,
            );
            if (prevMarker) {
                const mapboxMarker = prevMarker.marker;
                const [lng, lat] = [prevMarker.lng, prevMarker.lat];
                const el = createMarkerElement(prevMarker.type, false);

                // Remove and recreate marker with new element
                mapboxMarker.remove();
                const newMarker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                    prevMarker.name || 'Unnamed Location',
                );
                newMarker.setPopup(popup);

                el.addEventListener('click', () => {
                    setSelectedMarkerId(prevMarker.id);
                });

                // Update the marker reference
                prevMarker.marker = newMarker;
            }
        }

        // Highlight the currently selected marker
        if (selectedMarkerId) {
            const selectedMarker = markers.find(
                (m) => m.id === selectedMarkerId,
            );
            if (selectedMarker) {
                const mapboxMarker = selectedMarker.marker;
                const [lng, lat] = [selectedMarker.lng, selectedMarker.lat];
                const el = createMarkerElement(selectedMarker.type, true);

                // Remove and recreate marker with new element
                mapboxMarker.remove();
                const newMarker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                    selectedMarker.name || 'Unnamed Location',
                );
                newMarker.setPopup(popup);

                el.addEventListener('click', () => {
                    setSelectedMarkerId(selectedMarker.id);
                });

                // Update the marker reference
                selectedMarker.marker = newMarker;
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
            map.getCanvas().style.cursor = 'zoom-in';
        } else {
            // Restore crosshair cursor for normal mode
            map.getCanvas().style.cursor = 'crosshair';
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

        // Remove existing result markers
        searchResultMarkersRef.current.forEach((marker) => {
            marker.remove();
        });
        searchResultMarkersRef.current = [];

        // Add new markers for search results
        if (searchResults.length > 0) {
            const resultMarkers = searchResults.map((result) => {
                // Create a custom blue circle marker element
                const el = document.createElement('div');
                el.className = 'search-result-marker';

                // Create the marker
                const marker = new mapboxgl.Marker(el).setLngLat([
                    result.lon,
                    result.lat,
                ]);

                // Add tooltip with priority: English name > International name > Local name
                const displayName =
                    result.name_en || result.name_int || result.name;
                if (displayName) {
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                        displayName,
                    );
                    marker.setPopup(popup);
                }

                // Add click handler to create a marker from search result
                el.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    // Get the name with priority: English > International > Local
                    const markerName =
                        result.name_en || result.name_int || result.name || '';

                    // Get the appropriate marker type based on OSM type
                    const markerType = getMarkerTypeFromOSMType(result.type);

                    // Create the marker element
                    const markerEl = createMarkerElement(markerType);

                    // Create the marker
                    const newMarker = new mapboxgl.Marker(markerEl)
                        .setLngLat([result.lon, result.lat])
                        .addTo(map);

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
                        marker: newMarker,
                        isSaved: false, // Mark as unsaved
                    };

                    // Add popup to marker
                    const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                        markerName || 'Unnamed Location',
                    );
                    newMarker.setPopup(popup);

                    // Add click handler to marker
                    markerEl.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent map click event
                        setSelectedMarkerId(markerId);
                    });

                    // Add marker to state
                    setMarkers((prev) => [...prev, markerData]);
                    setSelectedMarkerId(markerId);

                    // Remove the blue circle marker since we've created a marker from it
                    marker.remove();
                });

                marker.addTo(map);
                return marker;
            });

            searchResultMarkersRef.current = resultMarkers;
        }
    }, [searchResults]);

    // Display gray dashed circle for search radius
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Remove existing search radius circle layer
        if (searchRadiusCircleLayerIdRef.current) {
            if (map.getLayer(searchRadiusCircleLayerIdRef.current)) {
                map.removeLayer(searchRadiusCircleLayerIdRef.current);
            }
            if (map.getSource(searchRadiusCircleLayerIdRef.current)) {
                map.removeSource(searchRadiusCircleLayerIdRef.current);
            }
            searchRadiusCircleLayerIdRef.current = null;
        }

        // Add new search radius circle when coordinates are available
        if (searchCoordinates) {
            const layerId = `search-radius-${Date.now()}`;
            const radiusInMeters = searchRadius * 1000; // Convert km to meters

            // Create a circle using turf-like approach (approximation with points)
            const points = 64;
            const coords: [number, number][] = [];
            const distanceX = radiusInMeters / 111320; // degrees longitude
            const distanceY = radiusInMeters / 110540; // degrees latitude

            for (let i = 0; i < points; i++) {
                const angle = (i / points) * 2 * Math.PI;
                const dx =
                    (distanceX * Math.cos(angle)) /
                    Math.cos((searchCoordinates.lat * Math.PI) / 180);
                const dy = distanceY * Math.sin(angle);
                coords.push([
                    searchCoordinates.lng + dx,
                    searchCoordinates.lat + dy,
                ]);
            }
            coords.push(coords[0]); // Close the circle

            map.addSource(layerId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [coords],
                    },
                },
            });

            map.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                paint: {
                    'line-color': 'gray',
                    'line-width': 2,
                    'line-dasharray': [2, 2],
                    'line-opacity': 0.8,
                },
            });

            map.addLayer({
                id: `${layerId}-fill`,
                type: 'fill',
                source: layerId,
                paint: {
                    'fill-color': 'gray',
                    'fill-opacity': 0.1,
                },
            });

            searchRadiusCircleLayerIdRef.current = layerId;
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

        // Get Mapbox access token from environment variable (vite exposes as import.meta.env)
        const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

        if (!mapboxToken) {
            console.warn(
                'Mapbox access token not found. Using public demo token (not for production).',
            );
        }

        mapboxgl.accessToken =
            mapboxToken ||
            'pk.eyJ1IjoidHJhdmVsLW1hcC1kZW1vIiwiYSI6ImNtMTBhYmMxMjAwMDAya3M0MXl2ZHFyZWEifQ.demo';

        // Initialize the map
        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/standard',
            center: [DEFAULT_MAP_CENTER[1], DEFAULT_MAP_CENTER[0]], // [lng, lat]
            zoom: DEFAULT_MAP_ZOOM,
            config: {
                basemap: {
                    colorPlaceLabelHighlight: 'red',
                    colorPlaceLabelSelect: 'blue',
                },
            },
        });
        mapInstanceRef.current = map;

        // Set crosshair cursor
        map.getCanvas().style.cursor = 'crosshair';

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add geocoder search control
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken || '',
            mapboxgl: mapboxgl as never,
            marker: false, // We'll handle markers ourselves
            placeholder: 'Search for places...',
        });

        map.addControl(geocoder, 'top-left');

        // Add data-testid for E2E testing
        // Use MutationObserver to watch for when the geocoder is added to the DOM
        const addTestIdToGeocoder = () => {
            const geocoderElement = document.querySelector(
                '.mapboxgl-ctrl-geocoder',
            );
            if (geocoderElement) {
                geocoderElement.setAttribute('data-testid', 'map-geocoder');
                return true;
            }
            return false;
        };

        // Try immediately first
        if (!addTestIdToGeocoder()) {
            // If not found, set up MutationObserver
            const observer = new MutationObserver(() => {
                if (addTestIdToGeocoder()) {
                    observer.disconnect();
                }
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            // Fallback timeout to disconnect observer after 5 seconds
            setTimeout(() => observer.disconnect(), 5000);
        }

        // Handle geocoder result
        geocoder.on('result', (e: { result: GeocodeResult }) => {
            const [lng, lat] = e.result.center;
            const placeName = e.result.place_name || 'Searched Location';

            // Remove previous search marker if exists
            if (searchMarkerRef.current) {
                searchMarkerRef.current.remove();
            }

            // Create a temporary highlight marker with yellow color
            const el = document.createElement('div');
            el.innerHTML = `
                <div class="mapbox-marker mapbox-marker--search">
                    <div class="mapbox-marker__icon">
                        <i class="fa fa-search"></i>
                    </div>
                </div>
            `;

            // Add temporary marker to highlight search result
            const searchMarker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(map);

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<strong>${placeName}</strong><br><small>Click on this marker to add it permanently</small>`,
            );
            searchMarker.setPopup(popup);
            popup.addTo(map);

            // Add click handler to convert temporary marker to permanent
            el.addEventListener('click', () => {
                // Remove the temporary marker
                searchMarker.remove();
                searchMarkerRef.current = null;

                // Create permanent marker
                const defaultType = MarkerType.PointOfInterest;
                const markerEl = createMarkerElement(defaultType);

                const marker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: placeName,
                    type: defaultType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    marker: marker,
                    isSaved: false, // Mark as unsaved
                };

                // Add popup to marker
                const markerPopup = new mapboxgl.Popup({ offset: 25 }).setText(
                    placeName,
                );
                marker.setPopup(markerPopup);

                // Add click handler to permanent marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    setSelectedMarkerId(markerId);
                });

                setMarkers((prev) => [...prev, markerData]);
                setSelectedMarkerId(markerId);

                // Do NOT save to database yet - wait for user to click Save button
            });

            searchMarkerRef.current = searchMarker;

            // Center and zoom to the location
            map.flyTo({ center: [lng, lat], zoom: 16 });
        });

        let hoveredPlace:
            | TargetFeature
            | FeatureSelector
            | GeoJSONFeature
            | null
            | undefined = null;
        map.addInteraction('poi-click', {
            type: 'click',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('POI clicked:', feature);
                preventDefault(); // Prevent map click event from firing

                if (!feature || !lngLat) return;

                // Extract information from the feature
                // Try to access _vectorTileFeature for more complete data
                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'POI');
                const mapboxClass = '' + (properties.class || properties.type);
                const markerType = getMarkerTypeFromMapboxClass(mapboxClass);

                // Get coordinates from the click event
                const [lng, lat] = [lngLat.lng, lngLat.lat];

                // Create the marker element
                const markerEl = createMarkerElement(markerType);

                // Create the marker
                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    marker: newMarker,
                    isSaved: false, // Mark as unsaved
                };

                // Add popup to marker
                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                // Add click handler to marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    setSelectedMarkerId(markerId);
                });

                // Add marker to state
                setMarkers((prev) => [...prev, markerData]);
                setSelectedMarkerId(markerId);
            },
        });
        map.addInteraction('poi-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: () => {
                map.getCanvas().style.cursor = 'pointer';
            },
        });
        map.addInteraction('poi-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'poi', importId: 'basemap' },
            handler: () => {
                // Reset to crosshair or zoom-in depending on search mode
                if (isSearchModeRef.current) {
                    map.getCanvas().style.cursor = 'zoom-in';
                } else {
                    map.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        map.addInteraction('place-labels-click', {
            type: 'click',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('place-labels clicked:', feature);
                preventDefault(); // Prevent map click event from firing

                if (!feature || !lngLat) return;

                // Extract information from the feature
                // Try to access _vectorTileFeature for more complete data
                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'Place');

                // Determine marker type based on place type
                let markerType = MarkerType.PointOfInterest;
                const placeClass = '' + properties.class;
                if (placeClass === 'city') {
                    markerType = MarkerType.City;
                } else if (placeClass === 'town' || placeClass === 'village') {
                    markerType = MarkerType.Village;
                }

                // Get coordinates from the click event
                const [lng, lat] = [lngLat.lng, lngLat.lat];

                // Create the marker element
                const markerEl = createMarkerElement(markerType);

                // Create the marker
                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    marker: newMarker,
                    isSaved: false, // Mark as unsaved
                };

                // Add popup to marker
                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                // Add click handler to marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    setSelectedMarkerId(markerId);
                });

                // Add marker to state
                setMarkers((prev) => [...prev, markerData]);
                setSelectedMarkerId(markerId);
            },
        });
        map.addInteraction('place-labels-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: ({ feature }) => {
                if (feature == undefined) return;
                if (hoveredPlace && hoveredPlace.id === feature.id) return;

                if (hoveredPlace) {
                    map.setFeatureState(hoveredPlace, { highlight: false });
                }

                hoveredPlace = feature;
                map.setFeatureState(feature, { highlight: true });
                map.getCanvas().style.cursor = 'pointer';
            },
        });
        map.addInteraction('place-labels-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'place-labels', importId: 'basemap' },
            handler: () => {
                if (hoveredPlace) {
                    map.setFeatureState(hoveredPlace, { highlight: false });
                    hoveredPlace = null;
                }
                // Reset to crosshair or zoom-in depending on search mode
                if (isSearchModeRef.current) {
                    map.getCanvas().style.cursor = 'zoom-in';
                } else {
                    map.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        map.addInteraction('landmark-icons-click', {
            type: 'click',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: ({ feature, lngLat, preventDefault }) => {
                console.log('landmark-icons clicked:', feature);
                preventDefault(); // Prevent map click event from firing

                if (!feature || !lngLat) return;

                // Extract information from the feature
                // Try to access _vectorTileFeature for more complete data
                const vectorTileProps =
                    (
                        feature as unknown as {
                            _vectorTileFeature?: {
                                properties?: Record<string, unknown>;
                            };
                        }
                    )._vectorTileFeature?.properties || {};
                const properties = {
                    ...feature.properties,
                    ...vectorTileProps,
                };
                const name =
                    '' +
                    (properties.name_de ||
                        properties.name_en ||
                        properties.name ||
                        'Landmark');
                const mapboxClass = '' + (properties.class || properties.type);
                const markerType = getMarkerTypeFromMapboxClass(mapboxClass);

                // Get coordinates from the click event
                const [lng, lat] = [lngLat.lng, lngLat.lat];

                // Create the marker element
                const markerEl = createMarkerElement(markerType);

                // Create the marker
                const newMarker = new mapboxgl.Marker(markerEl)
                    .setLngLat([lng, lat])
                    .addTo(map);

                const markerId = uuidv4();
                const markerData: MarkerData = {
                    id: markerId,
                    lat: lat,
                    lng: lng,
                    name: name,
                    type: markerType,
                    notes: '',
                    url: '',
                    isUnesco: false,
                    marker: newMarker,
                    isSaved: false, // Mark as unsaved
                };

                // Add popup to marker
                const popup = new mapboxgl.Popup({ offset: 25 }).setText(name);
                newMarker.setPopup(popup);

                // Add click handler to marker
                markerEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent map click event
                    setSelectedMarkerId(markerId);
                });

                // Add marker to state
                setMarkers((prev) => [...prev, markerData]);
                setSelectedMarkerId(markerId);
            },
        });
        map.addInteraction('landmark-icons-mouseenter', {
            type: 'mouseenter',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: () => {
                map.getCanvas().style.cursor = 'pointer';
            },
        });
        map.addInteraction('landmark-icons-mouseleave', {
            type: 'mouseleave',
            target: { featuresetId: 'landmark-icons', importId: 'basemap' },
            handler: () => {
                // Reset to crosshair or zoom-in depending on search mode
                if (isSearchModeRef.current) {
                    map.getCanvas().style.cursor = 'zoom-in';
                } else {
                    map.getCanvas().style.cursor = 'crosshair';
                }
                return false;
            },
        });

        // Handle clicks on empty map areas (not on POIs or markers)
        map.on('click', (e) => {
            // Check if any POI, place-label or landmark features were clicked
            // If yes, the interaction handlers will take care of it
            const features = map.queryRenderedFeatures(e.point);
            const hasInteractiveFeature = features.some((f) => {
                const feat = f as TargetFeature;
                return (
                    feat.target?.featuresetId === 'poi' ||
                    feat.target?.featuresetId === 'place_label' ||
                    feat.target?.featuresetId === 'landmark'
                );
            });

            if (hasInteractiveFeature) {
                return; // Let the interaction handlers handle it
            }

            // Create a marker at the clicked location
            const defaultType = MarkerType.PointOfInterest;
            const markerEl = createMarkerElement(defaultType);

            const marker = new mapboxgl.Marker(markerEl)
                .setLngLat(e.lngLat)
                .addTo(map);

            const markerId = uuidv4();
            const markerData: MarkerData = {
                id: markerId,
                lat: e.lngLat.lat,
                lng: e.lngLat.lng,
                name: '', // Empty name for manual map clicks
                type: defaultType,
                notes: '',
                url: '',
                isUnesco: false,
                marker: marker,
                isSaved: false, // Mark as unsaved
            };

            // Add popup to marker
            const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                'New Location',
            );
            marker.setPopup(popup);

            // Add click handler to marker
            markerEl.addEventListener('click', (clickEvent) => {
                clickEvent.stopPropagation(); // Prevent map click event
                setSelectedMarkerId(markerId);
            });

            setMarkers((prev) => [...prev, markerData]);
            setSelectedMarkerId(markerId);
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
                    const mapboxMarker = m.marker;
                    if (mapboxMarker) {
                        mapboxMarker.remove();
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
                        const el = createMarkerElement(dbMarker.type);

                        const marker = new mapboxgl.Marker(el)
                            .setLngLat([dbMarker.longitude, dbMarker.latitude])
                            .addTo(map);

                        const popup = new mapboxgl.Popup({
                            offset: 25,
                        }).setText(dbMarker.name || 'Unnamed Location');
                        marker.setPopup(popup);

                        el.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent map click event
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

    // Load routes from database when trip changes
    useEffect(() => {
        const loadRoutes = async () => {
            if (!selectedTripId || !mapInstanceRef.current) return;

            try {
                const response = await axios.get('/routes', {
                    params: { trip_id: selectedTripId },
                });
                const dbRoutes = response.data;
                setRoutes(dbRoutes);
            } catch (error) {
                console.error('Failed to load routes:', error);
            }
        };

        loadRoutes();
    }, [selectedTripId]);

    // Render routes on map
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const map = mapInstanceRef.current;

        // Clear existing route layers
        routeLayerIdsRef.current.forEach((layerId) => {
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            if (map.getSource(layerId)) {
                map.removeSource(layerId);
            }
        });
        routeLayerIdsRef.current.clear();

        // Render each route as a line layer
        routes.forEach((route) => {
            const layerId = `route-${route.id}`;

            // Determine color based on transport mode
            let color = '#3388ff'; // Default blue
            if (route.transport_mode.value === 'driving-car') {
                color = '#e74c3c'; // Red for car
            } else if (route.transport_mode.value === 'cycling-regular') {
                color = '#f39c12'; // Orange for bike
            } else if (route.transport_mode.value === 'foot-walking') {
                color = '#27ae60'; // Green for walking
            } else if (route.transport_mode.value === 'public-transport') {
                color = '#3498db'; // Blue for public transport
            }

            // Add source for the route
            map.addSource(layerId, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {
                        startName: route.start_marker.name,
                        endName: route.end_marker.name,
                        mode: route.transport_mode.label,
                        distance: route.distance.km.toFixed(2),
                        duration: Math.round(route.duration.minutes),
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: route.geometry, // Already in [lng, lat] format
                    },
                },
            });

            // Add layer for the route
            map.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 4,
                    'line-opacity': 0.7,
                },
            });

            // Add popup on click
            map.on('click', layerId, (e) => {
                if (e.features && e.features[0] && e.features[0].properties) {
                    const props = e.features[0].properties;
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(
                            `<strong>${props.startName} → ${props.endName}</strong><br>` +
                                `Mode: ${props.mode}<br>` +
                                `Distance: ${props.distance} km<br>` +
                                `Duration: ${props.duration} min`,
                        )
                        .addTo(map);
                }
            });

            // Change cursor on hover
            map.on('mouseenter', layerId, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', layerId, () => {
                map.getCanvas().style.cursor = 'crosshair';
            });

            routeLayerIdsRef.current.set(route.id, layerId);
        });
    }, [routes]);

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

            // Update marker popup and icon
            const marker = markers.find((m) => m.id === id);
            if (marker) {
                const mapboxMarker = marker.marker;
                const [lng, lat] = [marker.lng, marker.lat];
                const popup = new mapboxgl.Popup({ offset: 25 }).setText(
                    name || 'Unnamed Location',
                );
                mapboxMarker.setPopup(popup);

                // Update marker icon if type changed
                const el = createMarkerElement(type);
                el.addEventListener('click', () => {
                    setSelectedMarkerId(id);
                });

                // Remove and recreate marker with new element
                mapboxMarker.remove();
                const newMarker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .setPopup(popup)
                    .addTo(mapInstanceRef.current!);

                // Update the marker reference in state
                setMarkers((prev) =>
                    prev.map((m) =>
                        m.id === id ? { ...m, marker: newMarker } : m,
                    ),
                );
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
                const mapboxMarker = marker.marker;
                if (mapboxMarker) {
                    mapboxMarker.remove();
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
            // First, get the marker and remove it from map before API call
            const marker = markers.find((m) => m.id === id);
            if (marker) {
                const mapboxMarker = marker.marker;
                if (mapboxMarker) {
                    mapboxMarker.remove();
                }
            }

            // Then call API
            await axios.delete(`/markers/${id}`);

            // Remove from state
            setMarkers((prev) => prev.filter((m) => m.id !== id));

            // Clear selection if deleted marker was selected
            if (selectedMarkerId === id) {
                setSelectedMarkerId(null);
            }
        } catch (error) {
            console.error('Failed to delete marker:', error);
            alert('Failed to delete marker. Please try again.');

            // Re-add marker to map if deletion failed
            const marker = markers.find((m) => m.id === id);
            if (marker && mapInstanceRef.current) {
                marker.marker.addTo(mapInstanceRef.current);
            }
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

    const handleAddMarkerToTour = async (markerId: string) => {
        if (selectedTourId === null) return;

        try {
            // Check if marker is already in tour
            const selectedTour = tours.find((t) => t.id === selectedTourId);
            if (selectedTour) {
                const isAlreadyInTour = selectedTour.markers?.some(
                    (m) => m.id === markerId,
                );

                if (isAlreadyInTour) {
                    return; // Skip silently
                }
            }

            // Attach marker to tour
            await axios.post(`/tours/${selectedTourId}/markers`, {
                marker_id: markerId,
            });

            // Reload tours to get updated marker associations
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        } catch (error) {
            console.error('Failed to add marker to tour:', error);
            alert('Failed to add marker to tour. Please try again.');
        }
    };

    const handleMoveMarkerUp = async (markerId: string) => {
        if (selectedTourId === null) return;

        const selectedTour = tours.find((t) => t.id === selectedTourId);
        if (!selectedTour || !selectedTour.markers) return;

        const currentIndex = selectedTour.markers.findIndex(
            (m) => m.id === markerId,
        );

        if (currentIndex <= 0) return; // Already at the top

        // Swap with previous marker
        const reorderedMarkers = [...selectedTour.markers];
        [reorderedMarkers[currentIndex - 1], reorderedMarkers[currentIndex]] = [
            reorderedMarkers[currentIndex],
            reorderedMarkers[currentIndex - 1],
        ];

        // Optimistically update the UI
        const updatedTours = tours.map((t) =>
            t.id === selectedTourId ? { ...t, markers: reorderedMarkers } : t,
        );
        onToursUpdate(updatedTours);

        // Send the reorder request to the server
        try {
            await axios.put(`/tours/${selectedTourId}/markers/reorder`, {
                marker_ids: reorderedMarkers.map((m) => m.id),
            });

            // Reload tours from server to ensure we have the latest correct data
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        } catch (error) {
            console.error('Failed to reorder markers:', error);
            alert('Failed to reorder markers. The order has been reverted.');
            // Revert the optimistic update on error
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        }
    };

    const handleMoveMarkerDown = async (markerId: string) => {
        if (selectedTourId === null) return;

        const selectedTour = tours.find((t) => t.id === selectedTourId);
        if (!selectedTour || !selectedTour.markers) return;

        const currentIndex = selectedTour.markers.findIndex(
            (m) => m.id === markerId,
        );

        if (
            currentIndex === -1 ||
            currentIndex >= selectedTour.markers.length - 1
        )
            return; // Already at the bottom or not found

        // Swap with next marker
        const reorderedMarkers = [...selectedTour.markers];
        [reorderedMarkers[currentIndex], reorderedMarkers[currentIndex + 1]] = [
            reorderedMarkers[currentIndex + 1],
            reorderedMarkers[currentIndex],
        ];

        // Optimistically update the UI
        const updatedTours = tours.map((t) =>
            t.id === selectedTourId ? { ...t, markers: reorderedMarkers } : t,
        );
        onToursUpdate(updatedTours);

        // Send the reorder request to the server
        try {
            await axios.put(`/tours/${selectedTourId}/markers/reorder`, {
                marker_ids: reorderedMarkers.map((m) => m.id),
            });

            // Reload tours from server to ensure we have the latest correct data
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        } catch (error) {
            console.error('Failed to reorder markers:', error);
            alert('Failed to reorder markers. The order has been reverted.');
            // Revert the optimistic update on error
            if (selectedTripId) {
                const response = await axios.get('/tours', {
                    params: { trip_id: selectedTripId },
                });
                onToursUpdate(response.data);
            }
        }
    };

    const selectedMarker =
        markers.find((m) => m.id === selectedMarkerId) || null;

    return (
        <div className="flex h-full flex-col lg:flex-row">
            {/* Part 1: Marker list or form */}
            <div className="w-full lg:max-w-[25%]" data-testid="marker-panel">
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
                        selectedTourId={selectedTourId}
                        onAddMarkerToTour={handleAddMarkerToTour}
                    />
                )}
            </div>

            {/* Part 2: Tour panel with collapse button */}
            <div className={`flex w-full ${isTourPanelCollapsed ? 'lg:w-auto' : 'lg:max-w-[min(25%,300px)]'}`} data-testid="tour-panel">
                {!isTourPanelCollapsed && (
                    <div className="h-full flex-1">
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
                    className="rounded-l-md bg-white px-1 shadow-md hover:bg-gray-100 flex items-center"
                    title={
                        isTourPanelCollapsed ? 'Expand Tours' : 'Collapse Tours'
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
                <div className={`flex w-full ${isRoutePanelCollapsed ? 'lg:w-auto' : 'lg:max-w-[min(25%,300px)]'}`} data-testid="route-panel">
                    {!isRoutePanelCollapsed && (
                        <div className="h-full flex-1">
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
                        className="rounded-l-md bg-white px-1 shadow-md hover:bg-gray-100 flex items-center"
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
            <div className="flex w-full flex-1 flex-col lg:ml-4" data-testid="map-panel">
                {/* Top area for future buttons/controls */}
                <div
                    className="mb-2 min-h-[40px] rounded-lg bg-white p-2 shadow"
                    aria-hidden="true"
                >
                    {/* Empty for now - placeholder for future controls */}
                </div>

                {/* Map area */}
                <div className="relative flex-1">
                    <div ref={mapRef} id="map" className="z-10 h-full w-full" />
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
    );
}
