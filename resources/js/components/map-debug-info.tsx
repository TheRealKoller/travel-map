interface MapDebugInfoProps {
    tripViewport: {
        latitude: number | null;
        longitude: number | null;
        zoom: number | null;
    } | null;
    currentMapBounds: {
        north: number;
        south: number;
        east: number;
        west: number;
        center: { lat: number; lng: number };
        zoom: number;
    } | null;
    searchBbox: [number, number, number, number] | undefined;
}

export function MapDebugInfo({
    tripViewport,
    currentMapBounds,
    searchBbox,
}: MapDebugInfoProps) {
    return (
        <div className="flex gap-4 text-xs text-gray-600">
            {/* Trip Viewport */}
            <div className="flex flex-col">
                <span className="font-semibold text-gray-700">
                    Trip Viewport:
                </span>
                {tripViewport &&
                tripViewport.latitude !== null &&
                tripViewport.longitude !== null &&
                tripViewport.zoom !== null ? (
                    <span className="font-mono">
                        {Number(tripViewport.latitude).toFixed(4)},{' '}
                        {Number(tripViewport.longitude).toFixed(4)} @ z
                        {Number(tripViewport.zoom).toFixed(1)}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Not set</span>
                )}
            </div>

            {/* Current Map Bounds */}
            <div className="flex flex-col">
                <span className="font-semibold text-gray-700">
                    Current Map View:
                </span>
                {currentMapBounds ? (
                    <span className="font-mono">
                        {currentMapBounds.center.lat.toFixed(4)},{' '}
                        {currentMapBounds.center.lng.toFixed(4)} @ z
                        {currentMapBounds.zoom.toFixed(1)}
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Loading...</span>
                )}
            </div>

            {/* Search Bounding Box */}
            <div className="flex flex-col">
                <span className="font-semibold text-gray-700">
                    Search BBox:
                </span>
                {searchBbox ? (
                    <span className="font-mono">
                        [{searchBbox[0].toFixed(2)}, {searchBbox[1].toFixed(2)},{' '}
                        {searchBbox[2].toFixed(2)}, {searchBbox[3].toFixed(2)}]
                    </span>
                ) : (
                    <span className="text-gray-400 italic">Not set</span>
                )}
            </div>
        </div>
    );
}
