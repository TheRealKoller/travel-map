import '@/../../resources/css/markdown-preview.css';
import { MarkerData, MarkerType } from '@/types/marker';
import 'easymde/dist/easymde.min.css';
import { marked } from 'marked';
import { useMemo, useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';

interface MarkerFormProps {
    marker: MarkerData | null;
    onSave: (id: string, name: string, type: MarkerType, notes: string) => void;
    onDeleteMarker: (id: string) => void;
    onClose: () => void;
}

export default function MarkerForm({
    marker,
    onSave,
    onDeleteMarker,
    onClose,
}: MarkerFormProps) {
    // Initialize local state from marker prop
    // Using marker?.id as key in parent will cause re-mount when marker changes
    const [name, setName] = useState(marker?.name || '');
    const [type, setType] = useState<MarkerType>(
        marker?.type || MarkerType.PointOfInterest,
    );
    const [notes, setNotes] = useState(marker?.notes || '');
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
        return null;
    }

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setType(e.target.value as MarkerType);
    };

    const handleNotesChange = (value: string) => {
        setNotes(value);
    };

    const handleSave = () => {
        if (marker) {
            onSave(marker.id, name, type, notes);
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

    return (
        <div className="relative rounded-lg bg-white p-4 shadow">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
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
            <h2 className="mb-4 pr-8 text-xl font-semibold">Marker Details</h2>
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
                <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 lg:flex-row lg:gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                    >
                        Save
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
