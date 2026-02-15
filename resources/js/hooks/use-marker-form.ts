import { MarkerData, MarkerType } from '@/types/marker';
import { useState } from 'react';

export interface MarkerFormState {
    isEditMode: boolean;
    name: string;
    type: MarkerType;
    notes: string;
    url: string;
    isUnesco: boolean;
    aiEnriched: boolean;
    estimatedHours: number | null;
}

export interface MarkerFormHandlers {
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleNotesChange: (value: string) => void;
    handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUnescoChange: (checked: boolean) => void;
    handleEstimatedHoursChange: (value: number | null) => void;
    handleSave: () => void;
    handleCancelEdit: () => void;
    handleEnterEditMode: () => void;
    setAiEnriched: (value: boolean) => void;
    setType: (value: MarkerType) => void;
    setIsUnesco: (value: boolean) => void;
    setNotes: (value: string) => void;
    setUrl: (value: string) => void;
    setEstimatedHours: (value: number | null) => void;
}

export interface UseMarkerFormReturn {
    formState: MarkerFormState;
    handlers: MarkerFormHandlers;
}

/**
 * Custom hook to manage marker form state and handlers
 *
 * @param marker - The marker being edited or viewed
 * @param onSave - Callback to save marker changes
 * @returns Form state and handlers
 */
export function useMarkerForm(
    marker: MarkerData | null,
    onSave: (
        id: string,
        name: string,
        type: MarkerType,
        notes: string,
        url: string,
        isUnesco: boolean,
        aiEnriched: boolean,
        estimatedHours: number | null,
    ) => void,
): UseMarkerFormReturn {
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
    const [estimatedHours, setEstimatedHours] = useState<number | null>(
        marker?.estimatedHours ?? null,
    );

    // Form field change handlers
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

    const handleUnescoChange = (checked: boolean) => {
        setIsUnesco(checked);
    };

    const handleEstimatedHoursChange = (value: number | null) => {
        setEstimatedHours(value);
    };

    // Action handlers
    const handleSave = () => {
        if (marker) {
            onSave(
                marker.id,
                name,
                type,
                notes,
                url,
                isUnesco,
                aiEnriched,
                estimatedHours,
            );
            setIsEditMode(false);
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
            setEstimatedHours(marker.estimatedHours ?? null);
        }
        setIsEditMode(false);
    };

    return {
        formState: {
            isEditMode,
            name,
            type,
            notes,
            url,
            isUnesco,
            aiEnriched,
            estimatedHours,
        },
        handlers: {
            handleNameChange,
            handleTypeChange,
            handleNotesChange,
            handleUrlChange,
            handleUnescoChange,
            handleEstimatedHoursChange,
            handleSave,
            handleCancelEdit,
            handleEnterEditMode,
            setAiEnriched,
            setType,
            setIsUnesco,
            setNotes,
            setUrl,
            setEstimatedHours,
        },
    };
}
