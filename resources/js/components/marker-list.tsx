interface MarkerData {
    id: string;
    lat: number;
    lng: number;
}

interface MarkerListProps {
    markers: MarkerData[];
}

export default function MarkerList({ markers }: MarkerListProps) {
    if (markers.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Markers ({markers.length})</h2>
            <ul className="space-y-2">
                {markers.map((markerData) => (
                    <li 
                        key={markerData.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                    >
                        <div>
                            <span className="font-medium">Latitude:</span> {markerData.lat.toFixed(6)}, 
                            <span className="font-medium ml-2">Longitude:</span> {markerData.lng.toFixed(6)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
