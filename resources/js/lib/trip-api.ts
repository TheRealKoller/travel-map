import { update as tripsUpdate } from '@/routes/trips';

/**
 * Get CSRF token from meta tag
 */
export function getCsrfToken(): string {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || ''
    );
}

/**
 * Update trip notes via API
 */
export async function updateTripNotes(
    tripId: number,
    notes: string,
): Promise<void> {
    try {
        const response = await fetch(tripsUpdate.url(tripId), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
            body: JSON.stringify({ notes }),
        });

        if (!response.ok) {
            throw new Error('Failed to update trip notes');
        }
    } catch (error) {
        console.error('Failed to save trip notes:', error);
        throw error;
    }
}
