import { Input } from '@/components/ui/input';
import { formatCoordinates } from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import { Tour } from '@/types/tour';
import type { Options } from 'easymde';
import SimpleMDE from 'react-simplemde-editor';
import EnrichmentButton from './enrichment-button';
import MarkerTypeSelector from './marker-type-selector';
import TourCheckboxList from './tour-checkbox-list';
import UrlField from './url-field';

interface MarkerFormEditProps {
    marker: MarkerData;
    name: string;
    type: MarkerType;
    notes: string;
    url: string;
    isUnesco: boolean;
    estimatedHours: number | null;
    enrichmentError: string | null;
    isEnriching: boolean;
    tours: Tour[];
    mdeOptions: Options;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onNotesChange: (value: string) => void;
    onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUnescoChange: (checked: boolean) => void;
    onEstimatedHoursChange: (value: number | null) => void;
    onEnrichMarker: () => void;
    onOpenUrl: () => void;
    onSave: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
    onToggleMarkerInTour?: (
        markerId: string,
        tourId: number,
        isInTour: boolean,
    ) => void;
}

export default function MarkerFormEdit({
    marker,
    name,
    type,
    notes,
    url,
    isUnesco,
    estimatedHours,
    enrichmentError,
    isEnriching,
    tours,
    mdeOptions,
    onNameChange,
    onTypeChange,
    onNotesChange,
    onUrlChange,
    onUnescoChange,
    onEstimatedHoursChange,
    onEnrichMarker,
    onOpenUrl,
    onSave,
    onCancelEdit,
    onDelete,
    onToggleMarkerInTour,
}: MarkerFormEditProps) {
    return (
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
                    <Input
                        id="marker-name"
                        type="text"
                        value={name}
                        onChange={onNameChange}
                        placeholder="Enter marker name"
                    />
                </div>
                <MarkerTypeSelector value={type} onChange={onTypeChange} />
                <div>
                    <label className="flex min-h-[44px] cursor-pointer items-center space-x-2 py-2">
                        <input
                            type="checkbox"
                            checked={isUnesco}
                            onChange={(e) => onUnescoChange(e.target.checked)}
                            className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            UNESCO World Heritage Site
                        </span>
                    </label>
                </div>
                <div>
                    <label
                        htmlFor="marker-estimated-hours"
                        className="mb-2 block text-sm font-medium text-gray-700"
                    >
                        Estimated time (hours)
                    </label>
                    <Input
                        id="marker-estimated-hours"
                        type="number"
                        min="0"
                        max="999.99"
                        step="0.25"
                        value={estimatedHours ?? ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            onEstimatedHoursChange(
                                value === '' ? null : parseFloat(value),
                            );
                        }}
                        placeholder="e.g., 1.5"
                        data-testid="input-estimated-hours"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        How many hours do you expect to spend here? (e.g., 1.5
                        for 1.5 hours)
                    </p>
                </div>
                <EnrichmentButton
                    onClick={onEnrichMarker}
                    isEnriching={isEnriching}
                    disabled={isEnriching || !name.trim()}
                />
                <UrlField
                    value={url}
                    onChange={onUrlChange}
                    onOpen={onOpenUrl}
                />
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <SimpleMDE
                        value={notes}
                        onChange={onNotesChange}
                        options={mdeOptions}
                    />
                </div>
                {onToggleMarkerInTour && (
                    <TourCheckboxList
                        tours={tours}
                        marker={marker}
                        onToggleMarkerInTour={onToggleMarkerInTour}
                    />
                )}
                <div className="border-t border-gray-200 pt-2">
                    <p className="text-xs text-gray-500">
                        {formatCoordinates(marker.lat, marker.lng)}
                    </p>
                </div>
                <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 lg:flex-row lg:gap-2">
                    <button
                        onClick={onSave}
                        disabled={!name.trim()}
                        className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:bg-gray-400"
                        data-testid="button-save-marker"
                    >
                        Save
                    </button>
                    {marker.isSaved && (
                        <>
                            <button
                                onClick={onCancelEdit}
                                className="flex min-h-[44px] w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                                data-testid="button-cancel-edit"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onDelete}
                                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
