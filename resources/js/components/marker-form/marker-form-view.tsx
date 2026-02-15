import { formatCoordinates, isValidUrl } from '@/lib/marker-utils';
import { MarkerData } from '@/types/marker';
import { Tour } from '@/types/tour';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

interface MarkerFormViewProps {
    marker: MarkerData;
    name: string;
    notes: string;
    url: string;
    estimatedHours: number | null;
    tours: Tour[];
    onEnterEditMode: () => void;
    onDelete: () => void;
    onOpenUrl: () => void;
}

export default function MarkerFormView({
    marker,
    name,
    notes,
    url,
    estimatedHours,
    tours,
    onEnterEditMode,
    onDelete,
    onOpenUrl,
}: MarkerFormViewProps) {
    return (
        <div className="space-y-3">
            {marker.imageUrl && (
                <div>
                    <img
                        src={marker.imageUrl}
                        alt={name || 'Marker image'}
                        className="w-full rounded-md object-cover"
                        style={{ maxHeight: '300px' }}
                    />
                </div>
            )}
            <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Name
                    </label>
                    {url && (
                        <button
                            type="button"
                            onClick={onOpenUrl}
                            disabled={!isValidUrl(url)}
                            className="flex-shrink-0 rounded-md bg-blue-600 px-2 py-1 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                            aria-label="Open URL in new tab"
                            title="Open URL"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                        </button>
                    )}
                </div>
                <p className="text-gray-900">{name || 'Unnamed Location'}</p>
            </div>
            {notes && (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <div
                        className="prose prose-sm max-w-none rounded-md border border-gray-200 bg-gray-50 p-3"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                                marked.parse(notes) as string,
                            ),
                        }}
                    />
                </div>
            )}
            {estimatedHours !== null && (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Estimated time
                    </label>
                    <p className="text-gray-900">
                        {estimatedHours}{' '}
                        {estimatedHours === 1 ? 'hour' : 'hours'}
                    </p>
                </div>
            )}
            {tours.length > 0 && (
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
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
            <div className="border-t border-gray-200 pt-2">
                <p className="text-xs text-gray-500">
                    {formatCoordinates(marker.lat, marker.lng)}
                </p>
            </div>
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 lg:flex-row lg:gap-2">
                <button
                    onClick={onEnterEditMode}
                    className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                    data-testid="button-edit-marker"
                >
                    Edit
                </button>
                {marker.isSaved && (
                    <button
                        onClick={onDelete}
                        className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
