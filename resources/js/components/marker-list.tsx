import '@/../../resources/css/markdown-preview.css';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { MarkerData } from '@/types/marker';
import { ArrowRight, Image, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useState } from 'react';

interface MarkerListProps {
    markers: MarkerData[];
    selectedMarkerId: string | null;
    onSelectMarker: (id: string) => void;
    selectedTourId: number | null;
    onAddMarkerToTour?: (markerId: string) => void;
    onMarkerImageFetched?: (markerId: string, imageUrl: string) => void;
}

interface MarkerItemProps {
    markerData: MarkerData;
    isSelected: boolean;
    onSelect: (id: string) => void;
    showAddToTourButton: boolean;
    onAddToTour?: (markerId: string) => void;
    onImageFetched?: (markerId: string, imageUrl: string) => void;
}

function MarkerItem({
    markerData,
    isSelected,
    onSelect,
    showAddToTourButton,
    onAddToTour,
    onImageFetched,
}: MarkerItemProps) {
    const [loadingImage, setLoadingImage] = useState(false);

    // Configure marked
    useEffect(() => {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
    }, []);

    const handleAddToTour = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddToTour) {
            onAddToTour(markerData.id);
        }
    };

    const handleFetchImage = async (event: React.MouseEvent) => {
        event.stopPropagation();

        if (loadingImage) return;

        setLoadingImage(true);

        try {
            const response = await fetch(
                `/markers/${markerData.id}/fetch-image`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();

                if (data.marker?.image_url && onImageFetched) {
                    onImageFetched(markerData.id, data.marker.image_url);
                }
            }
        } catch (error) {
            console.error('Failed to fetch image:', error);
        } finally {
            setLoadingImage(false);
        }
    };

    return (
        <li
            className={`flex items-start gap-2 rounded p-2 transition ${
                isSelected
                    ? 'border-2 border-blue-500 bg-blue-100'
                    : 'bg-gray-50 hover:bg-gray-100'
            }`}
            data-testid="marker-list-item"
        >
            {markerData.imageUrl ? (
                <img
                    src={markerData.imageUrl}
                    alt={markerData.name || 'Marker'}
                    className="h-16 w-16 flex-shrink-0 rounded object-cover"
                    loading="lazy"
                />
            ) : (
                <button
                    onClick={handleFetchImage}
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded bg-gray-200 transition-colors hover:bg-gray-300"
                    title="Click to load image"
                    disabled={loadingImage}
                >
                    {loadingImage ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    ) : (
                        <Image className="h-6 w-6 text-gray-400" />
                    )}
                </button>
            )}
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
            <div className="flex items-center gap-1.5">
                {showAddToTourButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-600 hover:text-blue-600"
                        onClick={handleAddToTour}
                        title="Add to tour"
                        data-testid="add-marker-to-tour-button"
                    >
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                )}
                {markerData.aiEnriched && (
                    <span
                        className="text-purple-600"
                        title="AI enriched marker"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                )}
                <Icon
                    iconNode={getMarkerTypeIcon(markerData.type)}
                    className="h-4 w-4 text-gray-600"
                />
                {markerData.isUnesco && (
                    <Icon
                        iconNode={UnescoIcon}
                        className="h-4 w-4 text-blue-600"
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
    selectedTourId,
    onAddMarkerToTour,
    onMarkerImageFetched,
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

    const showAddToTourButtons = selectedTourId !== null;

    return (
        <div
            className="rounded-lg bg-white p-3 shadow"
            data-testid="marker-list"
        >
            <h2 className="mb-3 text-base font-semibold">
                Markers ({markers.length})
            </h2>
            {showAddToTourButtons && (
                <p className="mb-2 text-xs text-gray-500">
                    Click the arrow to add a marker to the current tour
                </p>
            )}
            <ul className="space-y-1.5" data-testid="marker-list-items">
                {markers.map((markerData) => (
                    <MarkerItem
                        key={markerData.id}
                        markerData={markerData}
                        isSelected={selectedMarkerId === markerData.id}
                        onSelect={onSelectMarker}
                        showAddToTourButton={showAddToTourButtons}
                        onAddToTour={onAddMarkerToTour}
                        onImageFetched={onMarkerImageFetched}
                    />
                ))}
            </ul>
        </div>
    );
}
