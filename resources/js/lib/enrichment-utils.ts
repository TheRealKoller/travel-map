/**
 * Utilities for AI-powered marker enrichment
 */

import { API_TYPE_TO_MARKER_TYPE } from '@/lib/marker-types';
import { MarkerType } from '@/types/marker';

/**
 * Enrichment data structure returned from API
 */
export interface EnrichmentData {
    type?: string;
    is_unesco?: boolean;
    notes?: string;
    url?: string;
    estimated_hours?: number;
}

/**
 * Enrichment result containing both data and applied state
 */
export interface EnrichmentResult {
    type?: MarkerType;
    isUnesco?: boolean;
    notes?: string;
    url?: string;
    estimatedHours?: number | null;
}

/**
 * Apply enrichment data to form state
 * Merges enrichment with existing form data
 * @param data - Enrichment data from API
 * @param currentState - Current form state
 * @returns Updated form values
 */
export function applyEnrichmentData(
    data: EnrichmentData,
    currentState: {
        notes: string;
        url: string;
    },
): EnrichmentResult {
    const result: EnrichmentResult = {};

    // Map type from API string to MarkerType enum
    if (data.type) {
        const mappedType = API_TYPE_TO_MARKER_TYPE[data.type];
        if (mappedType) {
            result.type = mappedType;
        }
    }

    // Set UNESCO status if provided
    if (data.is_unesco !== undefined && data.is_unesco !== null) {
        result.isUnesco = data.is_unesco;
    }

    // Merge notes - append to existing or set new
    if (data.notes) {
        result.notes = mergeNotes(currentState.notes, data.notes);
    }

    // Only set URL if current one is empty
    if (data.url && !currentState.url.trim()) {
        result.url = data.url;
    }

    // Set estimated hours if provided
    if (data.estimated_hours !== undefined && data.estimated_hours !== null) {
        result.estimatedHours = data.estimated_hours;
    }

    return result;
}

/**
 * Merge new notes with existing notes
 * Appends new notes if existing ones are present
 * @param existingNotes - Current notes
 * @param newNotes - New notes from enrichment
 * @returns Merged notes
 */
export function mergeNotes(existingNotes: string, newNotes: string): string {
    if (existingNotes.trim()) {
        return existingNotes + '\n\n' + newNotes;
    }
    return newNotes;
}

/**
 * Fetch enrichment data from API
 * @param name - Marker name
 * @param latitude - Marker latitude
 * @param longitude - Marker longitude
 * @param language - Preferred language for enrichment
 * @returns Enrichment data or throws error
 */
export async function fetchEnrichmentData(
    name: string,
    latitude: number,
    longitude: number,
    language: string,
): Promise<EnrichmentData> {
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
            name,
            latitude,
            longitude,
            language,
        }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to enrich marker');
    }

    return result.data;
}
