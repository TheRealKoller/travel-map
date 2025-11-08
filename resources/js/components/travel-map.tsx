import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet-control-geocoder';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import MarkerList from '@/components/marker-list';
import MarkerForm from '@/components/marker-form';
import { MarkerData, MarkerType } from '@/types/marker';
import axios from 'axios';

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

export default function TravelMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const searchMarkerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize the map centered on Japan
        const map = L.map(mapRef.current).setView([36.2048, 138.2529], 6);
        mapInstanceRef.current = map;

        // Set crosshair cursor
        map.getContainer().style.cursor = 'crosshair';

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add geocoder search control
        const geocoder = (L.Control as any).geocoder({
            defaultMarkGeocode: false,
            placeholder: 'Search for places...',
            errorMessage: 'Nothing found.',
            collapsed: false,
        }).on('markgeocode', (e: any) => {
            const latlng = e.geocode.center;
            const placeName = e.geocode.name || 'Searched Location';
            
            // Remove previous search marker if exists
            if (searchMarkerRef.current) {
                map.removeLayer(searchMarkerRef.current);
            }
            
            // Center and zoom to the location
            map.setView(latlng, 16);
            
            // Create a temporary highlight marker with yellow color
            const highlightIcon = (L as any).AwesomeMarkers.icon({
                icon: 'search',
                markerColor: 'yellow',
                iconColor: 'black',
                prefix: 'fa',
                spin: false,
            });
            
            // Add temporary marker to highlight search result
            const searchMarker = L.marker(latlng, { icon: highlightIcon }).addTo(map);
            searchMarker.bindPopup(`<strong>${placeName}</strong><br><small>Click on this marker to add it permanently</small>`).openPopup();
            
            // Add click handler to convert temporary marker to permanent
            searchMarker.on('click', () => {
                // Remove the temporary marker
                map.removeLayer(searchMarker);
                searchMarkerRef.current = null;
                
                // Create permanent marker
                const defaultType = MarkerType.PointOfInterest;
                const awesomeMarker = (L as any).AwesomeMarkers.icon({
                    icon: getIconForType(defaultType),
                    markerColor: getColorForType(defaultType),
                    iconColor: 'white',
                    prefix: 'fa',
                    spin: false,
                });
                
                const marker = L.marker(latlng, { icon: awesomeMarker }).addTo(map);
                const markerId = `marker-${Date.now()}`;
                const markerData: MarkerData = {
                    id: markerId,
                    lat: latlng.lat,
                    lng: latlng.lng,
                    name: placeName,
                    type: defaultType,
                    marker: marker,
                };
                
                // Add tooltip to marker
                marker.bindTooltip(placeName, { permanent: false, direction: 'top' });
                
                // Add click handler to permanent marker
                marker.on('click', () => {
                    setSelectedMarkerId(markerId);
                });
                
                setMarkers((prev) => [...prev, markerData]);
                setSelectedMarkerId(markerId);
                
                // Save to database and update marker with dbId
                saveMarkerToDatabase(markerData).then((dbId) => {
                    if (dbId) {
                        setMarkers((prev) =>
                            prev.map((m) => (m.id === markerId ? { ...m, dbId } : m))
                        );
                    }
                });
            });
            
            searchMarkerRef.current = searchMarker;
        }).addTo(map);

        // Add click event to create markers with awesome-markers
        map.on('click', (e: L.LeafletMouseEvent) => {
            const defaultType = MarkerType.PointOfInterest;
            const awesomeMarker = (L as any).AwesomeMarkers.icon({
                icon: getIconForType(defaultType),
                markerColor: getColorForType(defaultType),
                iconColor: 'white',
                prefix: 'fa',
                spin: false,
            });
            
            const marker = L.marker(e.latlng, { icon: awesomeMarker }).addTo(map);
            const markerId = `marker-${Date.now()}`;
            const markerData: MarkerData = {
                id: markerId,
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name: '',
                type: defaultType,
                marker: marker,
            };
            
            // Add tooltip to marker
            marker.bindTooltip('Unnamed Location', { permanent: false, direction: 'top' });
            
            // Add click handler to marker
            marker.on('click', () => {
                setSelectedMarkerId(markerId);
            });
            
            setMarkers((prev) => [...prev, markerData]);
            setSelectedMarkerId(markerId);
            
            // Save to database and update marker with dbId
            saveMarkerToDatabase(markerData).then((dbId) => {
                if (dbId) {
                    setMarkers((prev) =>
                        prev.map((m) => (m.id === markerId ? { ...m, dbId } : m))
                    );
                }
            });
        });

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update marker icons and tooltips when selection changes or names update
    useEffect(() => {
        markers.forEach((markerData) => {
            const isSelected = markerData.id === selectedMarkerId;
            const icon = (L as any).AwesomeMarkers.icon({
                icon: getIconForType(markerData.type),
                markerColor: isSelected ? 'red' : getColorForType(markerData.type),
                iconColor: 'white',
                prefix: 'fa',
                spin: isSelected,
            });
            markerData.marker.setIcon(icon);
            
            // Update tooltip with current name
            const tooltipContent = markerData.name || 'Unnamed Location';
            markerData.marker.setTooltipContent(tooltipContent);
        });
    }, [selectedMarkerId, markers]);

    // Load markers from database on component mount
    useEffect(() => {
        const loadMarkers = async () => {
            try {
                const response = await axios.get('/markers');
                const dbMarkers = response.data;
                
                if (mapInstanceRef.current) {
                    const map = mapInstanceRef.current;
                    const loadedMarkers: MarkerData[] = dbMarkers.map((dbMarker: any) => {
                        const icon = (L as any).AwesomeMarkers.icon({
                            icon: getIconForType(dbMarker.type),
                            markerColor: getColorForType(dbMarker.type),
                            iconColor: 'white',
                            prefix: 'fa',
                            spin: false,
                        });
                        
                        const marker = L.marker([dbMarker.latitude, dbMarker.longitude], { icon }).addTo(map);
                        const markerId = `marker-${dbMarker.id}`;
                        
                        marker.bindTooltip(dbMarker.name || 'Unnamed Location', { permanent: false, direction: 'top' });
                        marker.on('click', () => {
                            setSelectedMarkerId(markerId);
                        });
                        
                        return {
                            id: markerId,
                            dbId: dbMarker.id,
                            lat: dbMarker.latitude,
                            lng: dbMarker.longitude,
                            name: dbMarker.name,
                            type: dbMarker.type,
                            marker: marker,
                        };
                    });
                    
                    setMarkers(loadedMarkers);
                }
            } catch (error) {
                console.error('Failed to load markers:', error);
            }
        };
        
        if (mapInstanceRef.current) {
            loadMarkers();
        }
    }, [mapInstanceRef.current]);

    const handleSelectMarker = (id: string) => {
        setSelectedMarkerId(id);
    };

    const handleUpdateMarkerName = async (id: string, name: string) => {
        const marker = markers.find(m => m.id === id);
        if (marker?.dbId) {
            try {
                await axios.put(`/markers/${marker.dbId}`, { name });
            } catch (error) {
                console.error('Failed to update marker name:', error);
            }
        }
        
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, name } : m))
        );
    };

    const handleUpdateMarkerType = async (id: string, type: MarkerType) => {
        const marker = markers.find(m => m.id === id);
        if (marker?.dbId) {
            try {
                await axios.put(`/markers/${marker.dbId}`, { type });
            } catch (error) {
                console.error('Failed to update marker type:', error);
            }
        }
        
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, type } : m))
        );
    };

    const saveMarkerToDatabase = async (markerData: Omit<MarkerData, 'marker'>) => {
        try {
            const response = await axios.post('/markers', {
                name: markerData.name,
                type: markerData.type,
                latitude: markerData.lat,
                longitude: markerData.lng,
            });
            return response.data.id;
        } catch (error) {
            console.error('Failed to save marker:', error);
            return null;
        }
    };

    const selectedMarker = markers.find((m) => m.id === selectedMarkerId) || null;

    return (
        <div>
            <div 
                ref={mapRef} 
                id="map" 
                className="w-full h-[600px] mt-5"
            />
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <MarkerForm 
                    marker={selectedMarker} 
                    onUpdateName={handleUpdateMarkerName}
                    onUpdateType={handleUpdateMarkerType}
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
