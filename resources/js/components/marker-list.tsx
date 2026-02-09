import '@/../../resources/css/markdown-preview.css';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getMarkerTypeIcon, UnescoIcon } from '@/lib/marker-icons';
import { MarkerData, MarkerType } from '@/types/marker';
import { ArrowRight, Filter, Image, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { useEffect, useMemo, useState } from 'react';

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
                    className="flex h-16 min-h-11 w-16 min-w-11 flex-shrink-0 items-center justify-center rounded bg-gray-200 transition-colors hover:bg-gray-300"
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
                    {markerData.estimatedHours && (
                        <span className="ml-2 text-gray-500">
                            ~{markerData.estimatedHours}h
                        </span>
                    )}
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
                        className="h-11 w-11 text-gray-600 hover:text-blue-600"
                        onClick={handleAddToTour}
                        title="Add to tour"
                        data-testid="add-marker-to-tour-button"
                    >
                        <ArrowRight className="h-5 w-5" />
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [appliedType, setAppliedType] = useState<string>('all');
    const [selectedUnescoFilter, setSelectedUnescoFilter] =
        useState<string>('all');
    const [appliedUnescoFilter, setAppliedUnescoFilter] =
        useState<string>('all');
    const showAddToTourButtons = selectedTourId !== null;

    // Get all marker types from the enum
    const allMarkerTypes = Object.values(MarkerType);

    // Filter markers based on applied type and UNESCO filter
    const filteredMarkers = useMemo(() => {
        let result = markers;

        // Apply type filter
        if (appliedType !== 'all') {
            result = result.filter((marker) => marker.type === appliedType);
        }

        // Apply UNESCO filter
        if (appliedUnescoFilter === 'unesco') {
            result = result.filter((marker) => marker.isUnesco);
        } else if (appliedUnescoFilter === 'non-unesco') {
            result = result.filter((marker) => !marker.isUnesco);
        }

        return result;
    }, [markers, appliedType, appliedUnescoFilter]);

    const handleApplyFilter = () => {
        setAppliedType(selectedType);
        setAppliedUnescoFilter(selectedUnescoFilter);
    };

    return (
        <div
            className="rounded-lg bg-white p-3 shadow"
            data-testid="marker-list"
        >
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">
                    Markers ({filteredMarkers.length})
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    title="Toggle filter menu"
                    data-testid="filter-toggle-button"
                    className="relative h-8 w-8"
                >
                    <Filter className="h-4 w-4" />
                    {(appliedType !== 'all' ||
                        appliedUnescoFilter !== 'all') && (
                        <span
                            className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600"
                            data-testid="filter-active-indicator"
                            title="Filter active"
                        />
                    )}
                </Button>
            </div>
            {isFilterOpen && (
                <div
                    className="mb-3 rounded border border-gray-200 bg-gray-50 p-3"
                    data-testid="filter-menu"
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Filter by type
                        </label>
                        <Select
                            value={selectedType}
                            onValueChange={setSelectedType}
                        >
                            <SelectTrigger
                                className="w-full"
                                data-testid="type-filter-dropdown"
                            >
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    value="all"
                                    data-testid="type-filter-option-all"
                                >
                                    All types
                                </SelectItem>
                                {allMarkerTypes.map((type) => {
                                    // Capitalize first letter of each type
                                    const displayName =
                                        type.charAt(0).toUpperCase() +
                                        type.slice(1);
                                    return (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                            data-testid={`type-filter-option-${type}`}
                                        >
                                            {displayName}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <label className="text-sm font-medium text-gray-700">
                            Filter by UNESCO
                        </label>
                        <Select
                            value={selectedUnescoFilter}
                            onValueChange={setSelectedUnescoFilter}
                        >
                            <SelectTrigger
                                className="w-full"
                                data-testid="unesco-filter-dropdown"
                            >
                                <SelectValue placeholder="Select UNESCO filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    value="all"
                                    data-testid="unesco-filter-option-all"
                                >
                                    All markers
                                </SelectItem>
                                <SelectItem
                                    value="unesco"
                                    data-testid="unesco-filter-option-unesco"
                                >
                                    UNESCO only
                                </SelectItem>
                                <SelectItem
                                    value="non-unesco"
                                    data-testid="unesco-filter-option-non-unesco"
                                >
                                    Non-UNESCO only
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleApplyFilter}
                            className="w-full"
                            size="sm"
                            data-testid="apply-filter-button"
                        >
                            Apply filter
                        </Button>
                    </div>
                </div>
            )}
            {filteredMarkers.length === 0 ? (
                <p className="text-sm text-gray-500">
                    {markers.length === 0
                        ? 'Click on the map to add markers'
                        : 'No markers match the selected filter'}
                </p>
            ) : (
                <>
                    {showAddToTourButtons && (
                        <p className="mb-2 text-xs text-gray-500">
                            Click the arrow to add a marker to the current tour
                        </p>
                    )}
                    <ul className="space-y-1.5" data-testid="marker-list-items">
                        {filteredMarkers.map((markerData) => (
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
                </>
            )}
        </div>
    );
}
