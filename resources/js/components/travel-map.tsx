import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import MarkerList from '@/components/marker-list';
import MarkerForm from '@/components/marker-form';

interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    name: string;
    marker: L.Marker;
}

export default function TravelMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

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

        // Add click event to create markers with awesome-markers
        map.on('click', (e: L.LeafletMouseEvent) => {
            const awesomeMarker = (L as any).AwesomeMarkers.icon({
                icon: 'map-pin',
                markerColor: 'gray',
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
                marker: marker,
            };
            
            // Add click handler to marker
            marker.on('click', () => {
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

    const handleSelectMarker = (id: string) => {
        setSelectedMarkerId(id);
    };

    const handleUpdateMarkerName = (id: string, name: string) => {
        setMarkers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, name } : m))
        );
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
                <MarkerForm marker={selectedMarker} onUpdateName={handleUpdateMarkerName} />
                <MarkerList 
                    markers={markers} 
                    selectedMarkerId={selectedMarkerId}
                    onSelectMarker={handleSelectMarker}
                />
            </div>
        </div>
    );
}
