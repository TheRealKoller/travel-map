interface MarkerData {
    id: string;
    lat: number;
    lng: number;
    name: string;
}

interface MarkerListProps {
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onSelectMarker: (id: string) => void;
}

export default function MarkerList({ markers, selectedMarkerId, onSelectMarker }: MarkerListProps) {
    if (markers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Markers (0)</h2>
                <p className="text-gray-500">Click on the map to add markers</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Markers ({markers.length})</h2>
            <ul className="space-y-2">
                {markers.map((markerData) => (
                    <li 
                        key={markerData.id}
                        onClick={() => onSelectMarker(markerData.id)}
                        className={`p-3 rounded cursor-pointer transition ${
                            selectedMarkerId === markerData.id 
                                ? 'bg-blue-100 border-2 border-blue-500' 
                                : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                        <div className="font-medium text-gray-900 mb-1">{markerData.name}</div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Lat:</span> {markerData.lat.toFixed(6)}, 
                            <span className="font-medium ml-2">Lng:</span> {markerData.lng.toFixed(6)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
