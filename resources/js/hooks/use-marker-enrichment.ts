import {
    applyEnrichmentData,
    fetchEnrichmentData,
} from '@/lib/enrichment-utils';
import { MarkerData } from '@/types/marker';
import { useState } from 'react';
import { MarkerFormHandlers, MarkerFormState } from './use-marker-form';

export interface EnrichmentState {
    isEnriching: boolean;
    enrichmentError: string | null;
}

export interface UseMarkerEnrichmentReturn {
    enrichmentState: EnrichmentState;
    handleEnrichMarker: () => Promise<void>;
    clearEnrichmentError: () => void;
}

/**
 * Custom hook to manage AI enrichment for markers
 *
 * @param marker - The marker being enriched
 * @param formState - Current form state
 * @param handlers - Form handlers to update state
 * @param language - Current language preference
 * @returns Enrichment state and handlers
 */
export function useMarkerEnrichment(
    marker: MarkerData | null,
    formState: MarkerFormState,
    handlers: MarkerFormHandlers,
    language: string,
): UseMarkerEnrichmentReturn {
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichmentError, setEnrichmentError] = useState<string | null>(null);

    const handleEnrichMarker = async () => {
        if (!marker || !formState.name.trim()) {
            return;
        }

        setIsEnriching(true);
        setEnrichmentError(null);

        try {
            // Fetch enrichment data from API
            const data = await fetchEnrichmentData(
                formState.name,
                marker.lat,
                marker.lng,
                language,
            );

            // Apply enrichment data to form state
            const enrichmentResult = applyEnrichmentData(data, {
                notes: formState.notes,
                url: formState.url,
            });

            // Update form fields with enriched data
            if (enrichmentResult.type !== undefined) {
                handlers.setType(enrichmentResult.type);
            }

            if (enrichmentResult.isUnesco !== undefined) {
                handlers.setIsUnesco(enrichmentResult.isUnesco);
            }

            if (enrichmentResult.notes !== undefined) {
                handlers.setNotes(enrichmentResult.notes);
            }

            if (enrichmentResult.url !== undefined) {
                handlers.setUrl(enrichmentResult.url);
            }

            if (enrichmentResult.estimatedHours !== undefined) {
                handlers.setEstimatedHours(enrichmentResult.estimatedHours);
            }

            // Mark this marker as AI enriched
            handlers.setAiEnriched(true);
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

    const clearEnrichmentError = () => {
        setEnrichmentError(null);
    };

    return {
        enrichmentState: {
            isEnriching,
            enrichmentError,
        },
        handleEnrichMarker,
        clearEnrichmentError,
    };
}
