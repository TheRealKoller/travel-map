import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.awesome-markers';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import MarkerList from '@/components/marker-list';

interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    marker: L.Marker;
}

export default function TravelMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);

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
            const markerData: MarkerData = {
                id: `marker-${Date.now()}`,
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                marker: marker,
            };
            setMarkers((prev) => [...prev, markerData]);
        });

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div>
            <div 
                ref={mapRef} 
                id="map" 
                className="w-full h-[600px] mt-5"
            />
            
            <MarkerList markers={markers} />
        </div>
    );
}
