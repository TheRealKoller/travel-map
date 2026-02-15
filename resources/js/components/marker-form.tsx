import '@/../../resources/css/markdown-preview.css';
import DeleteMarkerDialog from '@/components/delete-marker-dialog';
import MarkerFormEdit from '@/components/marker-form/marker-form-edit';
import MarkerFormHeader from '@/components/marker-form/marker-form-header';
import MarkerFormView from '@/components/marker-form/marker-form-view';
import { configureMarked, getSimpleMDEOptions } from '@/config/markdown-editor';
import { useLanguage } from '@/hooks/use-language';
import { useMarkerEnrichment } from '@/hooks/use-marker-enrichment';
import { useMarkerForm } from '@/hooks/use-marker-form';
import { isValidUrl } from '@/lib/marker-utils';
import { MarkerData, MarkerType } from '@/types/marker';
import { Tour } from '@/types/tour';
import 'easymde/dist/easymde.min.css';
import { useEffect, useMemo, useState } from 'react';

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
        estimatedHours: number | null,
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

    // Get current language
    const { language } = useLanguage();

    // Configure marked globally (side effect in useEffect)
    useEffect(() => {
        configureMarked();
    }, []);

    // Use custom hooks for form state and enrichment
    const { formState, handlers } = useMarkerForm(marker, onSave);
    const { enrichmentState, handleEnrichMarker, clearEnrichmentError } =
        useMarkerEnrichment(marker, formState, handlers, language);

    // Delete dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // SimpleMDE options
    const mdeOptions = useMemo(() => getSimpleMDEOptions(), []);

    if (!marker) {
        return null;
    }

    const handleOpenUrl = () => {
        if (formState.url.trim() && isValidUrl(formState.url)) {
            window.open(formState.url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = () => {
        onDeleteMarker(marker.id);
        setShowDeleteDialog(false);
    };

    const handleCancelEditWithErrorClear = () => {
        handlers.handleCancelEdit();
        clearEnrichmentError();
    };

    return (
        <div className="relative rounded-lg bg-white p-4 shadow">
            <MarkerFormHeader
                type={formState.type}
                isUnesco={formState.isUnesco}
                aiEnriched={formState.aiEnriched}
                onClose={onClose}
            />

            {/* View Mode */}
            {!formState.isEditMode && (
                <MarkerFormView
                    marker={marker}
                    name={formState.name}
                    notes={formState.notes}
                    url={formState.url}
                    estimatedHours={formState.estimatedHours}
                    tours={tours}
                    onEnterEditMode={handlers.handleEnterEditMode}
                    onDelete={handleDelete}
                    onOpenUrl={handleOpenUrl}
                />
            )}

            {/* Edit Mode */}
            {formState.isEditMode && (
                <MarkerFormEdit
                    marker={marker}
                    name={formState.name}
                    type={formState.type}
                    notes={formState.notes}
                    url={formState.url}
                    isUnesco={formState.isUnesco}
                    estimatedHours={formState.estimatedHours}
                    enrichmentError={enrichmentState.enrichmentError}
                    isEnriching={enrichmentState.isEnriching}
                    tours={tours}
                    mdeOptions={mdeOptions}
                    onNameChange={handlers.handleNameChange}
                    onTypeChange={handlers.handleTypeChange}
                    onNotesChange={handlers.handleNotesChange}
                    onUrlChange={handlers.handleUrlChange}
                    onUnescoChange={handlers.handleUnescoChange}
                    onEstimatedHoursChange={handlers.handleEstimatedHoursChange}
                    onEnrichMarker={handleEnrichMarker}
                    onOpenUrl={handleOpenUrl}
                    onSave={handlers.handleSave}
                    onCancelEdit={handleCancelEditWithErrorClear}
                    onDelete={handleDelete}
                    onToggleMarkerInTour={onToggleMarkerInTour}
                />
            )}

            <DeleteMarkerDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleConfirmDelete}
                markerName={formState.name || 'this marker'}
            />
        </div>
    );
}
