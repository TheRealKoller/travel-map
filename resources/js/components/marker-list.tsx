import '@/../../resources/css/markdown-preview.css';
import { MarkerData } from '@/types/marker';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { marked } from 'marked';
import { useEffect } from 'react';

interface MarkerListProps {
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onSelectMarker: (id: string) => void;
}

interface DraggableMarkerItemProps {
    markerData: MarkerData;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

function DraggableMarkerItem({
    markerData,
    isSelected,
    onSelect,
}: DraggableMarkerItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: markerData.id,
            data: {
                marker: markerData,
            },
        });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          }
        : undefined;

    // Configure marked
    useEffect(() => {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }, []);

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`flex items-start gap-1 rounded p-2 transition ${
                isDragging
                    ? 'opacity-50'
                    : isSelected
                      ? 'border-2 border-blue-500 bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
            }`}
        >
            <button
                {...listeners}
                {...attributes}
                className="mt-0.5 cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
            <div
                className="flex-1 cursor-pointer"
                onClick={() => onSelect(markerData.id)}
            >
                <div className="mb-0.5 text-sm font-medium text-gray-900">
                    {markerData.name || 'Unnamed Location'}
                </div>
                <div className="mb-1 text-xs text-gray-600">
                    <span className="font-medium">Lat:</span>{' '}
                    {markerData.lat.toFixed(6)},
                    <span className="ml-2 font-medium">Lng:</span>{' '}
                    {markerData.lng.toFixed(6)}
                </div>
                {isSelected && markerData.notes && (
                    <div
                        className="markdown-preview mt-1.5 border-t border-blue-300 pt-1.5 text-xs text-gray-700"
                        dangerouslySetInnerHTML={{
                            __html: marked.parse(markerData.notes) as string,
                        }}
                    />
                )}
            </div>
        </li>
    );
}

export default function MarkerList({
    markers,
    selectedMarkerId,
    onSelectMarker,
}: MarkerListProps) {
    if (markers.length === 0) {
        return (
            <div className="rounded-lg bg-white p-3 shadow">
                <h2 className="mb-3 text-base font-semibold">Markers (0)</h2>
                <p className="text-sm text-gray-500">
                    Click on the map to add markers
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white p-3 shadow">
            <h2 className="mb-3 text-base font-semibold">
                Markers ({markers.length})
            </h2>
            <p className="mb-2 text-xs text-gray-500">
                Drag markers to tour tabs to add them to a tour
            </p>
            <ul className="space-y-1.5">
                {markers.map((markerData) => (
                    <DraggableMarkerItem
                        key={markerData.id}
                        markerData={markerData}
                        isSelected={selectedMarkerId === markerData.id}
                        onSelect={onSelectMarker}
                    />
                ))}
            </ul>
        </div>
    );
}
