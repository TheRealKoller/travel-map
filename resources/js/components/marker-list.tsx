import '@/../../resources/css/markdown-preview.css';
import { MarkerData } from '@/types/marker';
import { marked } from 'marked';
import { useEffect } from 'react';

interface MarkerListProps {
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onSelectMarker: (id: string) => void;
}

export default function MarkerList({
    markers,
    selectedMarkerId,
    onSelectMarker,
}: MarkerListProps) {
    // Configure marked
    useEffect(() => {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }, []);
    if (markers.length === 0) {
        return (
            <div className="rounded-lg bg-white p-4 shadow">
                <h2 className="mb-4 text-xl font-semibold">Markers (0)</h2>
                <p className="text-gray-500">Click on the map to add markers</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-xl font-semibold">
                Markers ({markers.length})
            </h2>
            <ul className="space-y-2">
                {markers.map((markerData) => (
                    <li
                        key={markerData.id}
                        onClick={() => onSelectMarker(markerData.id)}
                        className={`cursor-pointer rounded p-3 transition ${
                            selectedMarkerId === markerData.id
                                ? 'border-2 border-blue-500 bg-blue-100'
                                : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                        <div className="mb-1 font-medium text-gray-900">
                            {markerData.name || 'Unnamed Location'}
                        </div>
                        <div className="mb-2 text-sm text-gray-600">
                            <span className="font-medium">Lat:</span>{' '}
                            {markerData.lat.toFixed(6)},
                            <span className="ml-2 font-medium">Lng:</span>{' '}
                            {markerData.lng.toFixed(6)}
                        </div>
                        {selectedMarkerId === markerData.id &&
                            markerData.notes && (
                                <div
                                    className="markdown-preview mt-2 border-t border-blue-300 pt-2 text-sm text-gray-700"
                                    dangerouslySetInnerHTML={{
                                        __html: marked.parse(
                                            markerData.notes,
                                        ) as string,
                                    }}
                                />
                            )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
