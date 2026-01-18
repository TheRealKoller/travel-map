import '@/../../resources/css/markdown-preview.css';
import { MarkerData, MarkerType } from '@/types/marker';
import { Tour } from '@/types/tour';
import 'easymde/dist/easymde.min.css';
import { marked } from 'marked';
import { useMemo, useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';

interface MarkerFormProps {
    marker: MarkerData | null;
    onSave: (
        id: string,
        name: string,
        type: MarkerType,
        notes: string,
        url: string,
        isUnesco: boolean,
        aiEnriched: boolean,
    ) => void;
    onDeleteMarker: (id: string) => void;
    onClose: () => void;
    tours?: Tour[];
    onToggleMarkerInTour?: (
        markerId: string,
        tourId: number,
        isInTour: boolean,
    ) => void;
}

export default function MarkerForm({
    marker,
    onSave,
    onDeleteMarker,
    onClose,
    tours = [],
    onToggleMarkerInTour,
}: MarkerFormProps) {
    // Initialize local state from marker prop
    // The key={selectedMarkerId} in parent ensures this component remounts with each new marker
    // so we can safely initialize state here without worrying about updates

    // Determine initial mode: edit for new markers (not saved), view for existing markers
    const [isEditMode, setIsEditMode] = useState(!marker?.isSaved);
    const [name, setName] = useState(marker?.name || '');
    const [type, setType] = useState<MarkerType>(
        marker?.type || MarkerType.PointOfInterest,
    );
    const [notes, setNotes] = useState(marker?.notes || '');
    const [url, setUrl] = useState(marker?.url || '');
    const [isUnesco, setIsUnesco] = useState(marker?.isUnesco || false);
    const [aiEnriched, setAiEnriched] = useState(marker?.aiEnriched || false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

    // Configure marked once globally
    if (
        typeof window !== 'undefined' &&
        !(window as unknown as Record<string, unknown>).__markedConfigured
    ) {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        (window as unknown as Record<string, unknown>).__markedConfigured =
            true;
    }

    // Define mdeOptions for SimpleMDE editor
    const mdeOptions = useMemo(() => {
        type ToolbarButton =
            | 'bold'
            | 'italic'
            | 'heading'
            | '|'
            | 'quote'
            | 'unordered-list'
            | 'ordered-list'
            | 'link'
            | 'image'
            | 'preview'
            | 'guide';

        return {
            spellChecker: false,
            placeholder:
                'Add notes about this location (Markdown supported)...',
            status: false,
            previewRender: (text: string) => {
                return marked.parse(text) as string;
            },
            toolbar: [
                'bold',
                'italic',
                'heading',
                '|',
                'quote',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                'image',
                '|',
                'preview',
                '|',
                'guide',
            ] as ToolbarButton[],
        };
    }, []);

    if (!marker) {
        return null;
    }

    const getMarkerTypeLabel = (type: MarkerType): string => {
        const typeLabels: Record<MarkerType, string> = {
            [MarkerType.Restaurant]: 'Restaurant',
            [MarkerType.PointOfInterest]: 'Point of Interest',
            [MarkerType.Question]: 'Question',
            [MarkerType.Tip]: 'Tip',
            [MarkerType.Hotel]: 'Hotel',
            [MarkerType.Museum]: 'Museum',
            [MarkerType.Ruin]: 'Ruin',
            [MarkerType.TempleChurch]: 'Temple/Church',
            [MarkerType.FestivalParty]: 'Festival/Party',
            [MarkerType.Leisure]: 'Leisure',
            [MarkerType.Sightseeing]: 'Sightseeing',
            [MarkerType.NaturalAttraction]: 'Natural Attraction',
            [MarkerType.City]: 'City',
            [MarkerType.Village]: 'Village',
            [MarkerType.Region]: 'Region',
        };
        return typeLabels[type] || type;
    };

    const isValidUrl = (urlString: string): boolean => {
        if (!urlString.trim()) return false;
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setType(e.target.value as MarkerType);
    };

    const handleNotesChange = (value: string) => {
        setNotes(value);
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    };

    const handleOpenUrl = () => {
        if (url.trim() && isValidUrl(url)) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleSave = () => {
        if (marker) {
            onSave(marker.id, name, type, notes, url, isUnesco, aiEnriched);
            setIsEditMode(false);
        }
    };

    const handleDelete = () => {
        if (
            window.confirm(
                `Are you sure you want to delete "${name || 'this marker'}"? This action cannot be undone.`,
            )
        ) {
            onDeleteMarker(marker.id);
        }
    };

    const handleEnterEditMode = () => {
        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        // Reset form fields to original marker values
        if (marker) {
            setName(marker.name || '');
            setType(marker.type || MarkerType.PointOfInterest);
            setNotes(marker.notes || '');
            setUrl(marker.url || '');
            setIsUnesco(marker.isUnesco || false);
            setAiEnriched(marker.aiEnriched || false);
        }
        setIsEditMode(false);
        setEnrichmentError(null);
    };

    const handleEnrichMarker = async () => {
        if (!marker || !name.trim()) {
            return;
        }

        setIsEnriching(true);
        setEnrichmentError(null);

        try {
            const response = await fetch('/markers/enrich', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: name,
                    latitude: marker.lat,
                    longitude: marker.lng,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to enrich marker');
            }

            const data = result.data;

            // Apply enriched data to form fields
            if (data.type) {
                // Map the API type to MarkerType enum
                const typeMap: Record<string, MarkerType> = {
                    restaurant: MarkerType.Restaurant,
                    point_of_interest: MarkerType.PointOfInterest,
                    hotel: MarkerType.Hotel,
                    museum: MarkerType.Museum,
                    ruin: MarkerType.Ruin,
                    temple_church: MarkerType.TempleChurch,
                    sightseeing: MarkerType.Sightseeing,
                    natural_attraction: MarkerType.NaturalAttraction,
                    city: MarkerType.City,
                    village: MarkerType.Village,
                    region: MarkerType.Region,
                    question: MarkerType.Question,
                    tip: MarkerType.Tip,
                    festival_party: MarkerType.FestivalParty,
                    leisure: MarkerType.Leisure,
                };

                const mappedType = typeMap[data.type];
                if (mappedType) {
                    setType(mappedType);
                }
            }

            if (data.is_unesco !== undefined && data.is_unesco !== null) {
                setIsUnesco(data.is_unesco);
            }

            if (data.notes) {
                // Append to existing notes if any, otherwise set new notes
                if (notes.trim()) {
                    setNotes(notes + '\n\n' + data.notes);
                } else {
                    setNotes(data.notes);
                }
            }

            if (data.url && !url.trim()) {
                // Only set URL if it's currently empty
                setUrl(data.url);
            }

            // Mark this marker as AI enriched
            setAiEnriched(true);
        } catch (error) {
            console.error('Failed to enrich marker:', error);
            setEnrichmentError(
                error instanceof Error
                    ? error.message
                    : 'Failed to enrich marker information',
            );
        } finally {
            setIsEnriching(false);
        }
    };

    return (
        <div className="relative rounded-lg bg-white p-4 shadow">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
                data-testid="button-close-marker-form"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            <h2 className="mb-4 pr-8 text-xl font-semibold">
                Marker Details
                {aiEnriched && (
                    <span
                        className="ml-2 inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                        title="This marker has been enriched with AI"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                            />
                        </svg>
                        AI enriched
                    </span>
                )}
            </h2>

            {/* View Mode */}
            {!isEditMode && (
                <div className="space-y-4">
                    {marker.imageUrl && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Image
                            </label>
                            <img
                                src={marker.imageUrl}
                                alt={name || 'Marker image'}
                                className="w-full rounded-md object-cover"
                                style={{ maxHeight: '300px' }}
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Name
                        </label>
                        <p className="text-gray-900">
                            {name || 'Unnamed Location'}
                        </p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Type
                        </label>
                        <p className="text-gray-900">
                            {getMarkerTypeLabel(type)}
                        </p>
                    </div>
                    {isUnesco && (
                        <div>
                            <p className="flex items-center gap-2 text-sm text-gray-700">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-blue-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="font-medium">
                                    UNESCO World Heritage Site
                                </span>
                            </p>
                        </div>
                    )}
                    {url && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                URL
                            </label>
                            <div className="flex gap-2">
                                <p className="flex-1 truncate text-gray-900">
                                    {url}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleOpenUrl}
                                    disabled={!isValidUrl(url)}
                                    className="flex-shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                                    aria-label="Open URL in new tab"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    {notes && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Notes
                            </label>
                            <div
                                className="prose prose-sm max-w-none rounded-md border border-gray-200 bg-gray-50 p-3"
                                dangerouslySetInnerHTML={{
                                    __html: marked.parse(notes) as string,
                                }}
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Coordinates
                        </label>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Latitude:</span>{' '}
                            {marker.lat.toFixed(6)}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Longitude:</span>{' '}
                            {marker.lng.toFixed(6)}
                        </p>
                    </div>
                    {tours.length > 0 && onToggleMarkerInTour && (
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Tours
                            </label>
                            <div className="space-y-1">
                                {tours
                                    .filter(
                                        (tour) =>
                                            tour.markers?.some(
                                                (m) => m.id === marker?.id,
                                            ) || false,
                                    )
                                    .map((tour) => (
                                        <p
                                            key={tour.id}
                                            className="text-sm text-gray-700"
                                        >
                                            • {tour.name}
                                        </p>
                                    ))}
                                {!tours.some(
                                    (tour) =>
                                        tour.markers?.some(
                                            (m) => m.id === marker?.id,
                                        ) || false,
                                ) && (
                                    <p className="text-sm text-gray-500">
                                        Not in any tour
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 lg:flex-row lg:gap-2">
                        <button
                            onClick={handleEnterEditMode}
                            className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                            data-testid="button-edit-marker"
                        >
                            Edit
                        </button>
                        {marker.isSaved && (
                            <button
                                onClick={handleDelete}
                                className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Mode */}
            {isEditMode && (
                <>
                    {enrichmentError && (
                        <div
                            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
                            role="alert"
                        >
                            <strong>Error:</strong> {enrichmentError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="marker-name"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Name
                            </label>
                            <input
                                id="marker-name"
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Enter marker name"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="marker-type"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Type
                            </label>
                            <select
                                id="marker-type"
                                value={type}
                                onChange={handleTypeChange}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value={MarkerType.Restaurant}>
                                    Restaurant
                                </option>
                                <option value={MarkerType.PointOfInterest}>
                                    Point of Interest
                                </option>
                                <option value={MarkerType.Question}>
                                    Question
                                </option>
                                <option value={MarkerType.Tip}>Tip</option>
                                <option value={MarkerType.Hotel}>Hotel</option>
                                <option value={MarkerType.Museum}>
                                    Museum
                                </option>
                                <option value={MarkerType.Ruin}>Ruin</option>
                                <option value={MarkerType.TempleChurch}>
                                    Temple/Church
                                </option>
                                <option value={MarkerType.FestivalParty}>
                                    Festival/Party
                                </option>
                                <option value={MarkerType.Leisure}>
                                    Leisure
                                </option>
                                <option value={MarkerType.Sightseeing}>
                                    Sightseeing
                                </option>
                                <option value={MarkerType.NaturalAttraction}>
                                    Natural Attraction
                                </option>
                                <option value={MarkerType.City}>City</option>
                                <option value={MarkerType.Village}>
                                    Village
                                </option>
                                <option value={MarkerType.Region}>
                                    Region
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={isUnesco}
                                    onChange={(e) =>
                                        setIsUnesco(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    UNESCO World Heritage Site
                                </span>
                            </label>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleEnrichMarker}
                                disabled={isEnriching || !name.trim()}
                                className="w-full rounded-md border border-purple-600 bg-white px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                                data-testid="button-enrich-marker"
                            >
                                {isEnriching ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="h-4 w-4 animate-spin"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Enriching with AI...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
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
                                        Enrich with AI
                                    </span>
                                )}
                            </button>
                            <p className="mt-1 text-xs text-gray-500">
                                Use AI to automatically determine the marker
                                type, UNESCO status, and add additional
                                information
                            </p>
                        </div>
                        <div>
                            <label
                                htmlFor="marker-url"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="marker-url"
                                    type="url"
                                    value={url}
                                    onChange={handleUrlChange}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="https://example.com"
                                />
                                <button
                                    type="button"
                                    onClick={handleOpenUrl}
                                    disabled={!url.trim() || !isValidUrl(url)}
                                    className="flex-shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                                    aria-label="Open URL in new tab"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Notes
                            </label>
                            <SimpleMDE
                                value={notes}
                                onChange={handleNotesChange}
                                options={mdeOptions}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Coordinates
                            </label>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Latitude:</span>{' '}
                                {marker.lat.toFixed(6)}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Longitude:</span>{' '}
                                {marker.lng.toFixed(6)}
                            </p>
                        </div>
                        {tours.length > 0 && onToggleMarkerInTour && (
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Tours
                                </label>
                                <div className="space-y-2">
                                    {tours.map((tour) => {
                                        const isInTour =
                                            tour.markers?.some(
                                                (m) => m.id === marker?.id,
                                            ) || false;
                                        return (
                                            <label
                                                key={tour.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isInTour}
                                                    onChange={() => {
                                                        if (marker) {
                                                            onToggleMarkerInTour(
                                                                marker.id,
                                                                tour.id,
                                                                isInTour,
                                                            );
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {tour.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 lg:flex-row lg:gap-2">
                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                                data-testid="button-save-marker"
                            >
                                Save
                            </button>
                            {marker.isSaved && (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                        data-testid="button-cancel-edit"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
