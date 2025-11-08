import { MarkerData, MarkerType } from '@/types/marker';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import '@/../../resources/css/markdown-preview.css';

interface MarkerListProps {
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onSelectMarker: (id: string) => void;
}

export default function MarkerList({ markers, selectedMarkerId, onSelectMarker }: MarkerListProps) {
    // Configure marked
    useEffect(() => {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }, []);
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
                        <div className="font-medium text-gray-900 mb-1">
                            {markerData.name || 'Unnamed Location'}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Lat:</span> {markerData.lat.toFixed(6)}, 
                            <span className="font-medium ml-2">Lng:</span> {markerData.lng.toFixed(6)}
                        </div>
                        {selectedMarkerId === markerData.id && markerData.notes && (
                            <div 
                                className="markdown-preview text-sm text-gray-700 mt-2 pt-2 border-t border-blue-300"
                                dangerouslySetInnerHTML={{ __html: marked.parse(markerData.notes) as string }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
