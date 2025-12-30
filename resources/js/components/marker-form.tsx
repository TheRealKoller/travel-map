import '@/../../resources/css/markdown-preview.css';
import { MarkerData, MarkerType } from '@/types/marker';
import 'easymde/dist/easymde.min.css';
import { marked } from 'marked';
import { useMemo } from 'react';
import SimpleMDE from 'react-simplemde-editor';

interface MarkerFormProps {
    marker: MarkerData | null;
    onUpdateName: (id: string, name: string) => void;
    onUpdateType: (id: string, type: MarkerType) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onDeleteMarker: (id: string) => void;
}

export default function MarkerForm({
    marker,
    onUpdateName,
    onUpdateType,
    onUpdateNotes,
    onDeleteMarker,
}: MarkerFormProps) {
    // Define mdeOptions before any early returns to ensure hooks are called in consistent order
    const mdeOptions = useMemo(() => {
        // Configure marked to preserve line breaks
        marked.setOptions({
            breaks: true,
            gfm: true,
        });

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
        return (
            <div className="rounded-lg bg-white p-4 shadow">
                <h2 className="mb-4 text-xl font-semibold">Marker Details</h2>
                <p className="text-gray-500">
                    Select a marker to edit its details
                </p>
            </div>
        );
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateName(marker.id, e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateType(marker.id, e.target.value as MarkerType);
    };

    const handleNotesChange = (value: string) => {
        onUpdateNotes(marker.id, value);
    };

    const handleDelete = () => {
        if (
            window.confirm(
                `Are you sure you want to delete "${marker.name || 'this marker'}"? This action cannot be undone.`,
            )
        ) {
            onDeleteMarker(marker.id);
        }
    };

    return (
        <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-xl font-semibold">Marker Details</h2>
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
                        value={marker.name}
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
                        value={marker.type}
                        onChange={handleTypeChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value={MarkerType.Restaurant}>
                            Restaurant
                        </option>
                        <option value={MarkerType.PointOfInterest}>
                            Point of Interest
                        </option>
                        <option value={MarkerType.Question}>Question</option>
                        <option value={MarkerType.Tip}>Tip</option>
                        <option value={MarkerType.Hotel}>Hotel</option>
                        <option value={MarkerType.Museum}>Museum</option>
                        <option value={MarkerType.Ruin}>Ruin</option>
                        <option value={MarkerType.UnescoWorldHeritage}>
                            UNESCO World Heritage
                        </option>
                        <option value={MarkerType.TempleChurch}>
                            Temple/Church
                        </option>
                        <option value={MarkerType.FestivalParty}>
                            Festival/Party
                        </option>
                        <option value={MarkerType.Leisure}>Leisure</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <SimpleMDE
                        value={marker.notes}
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
                <div className="border-t border-gray-200 pt-4">
                    <button
                        onClick={handleDelete}
                        className="w-full rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Delete Marker
                    </button>
                </div>
            </div>
        </div>
    );
}
