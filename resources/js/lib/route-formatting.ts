/**
 * Utility functions for formatting route-related data
 */

/**
 * Format duration in minutes to human-readable string
 * Handles days, hours, and minutes
 */
export function formatDuration(minutes: number): string {
    const totalMinutes = Math.round(minutes);

    // More than a day (1440 minutes)
    if (totalMinutes >= 1440) {
        const days = Math.floor(totalMinutes / 1440);
        const remainingMinutes = totalMinutes % 1440;
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;

        if (hours === 0 && mins === 0) {
            return `${days}d`;
        } else if (hours === 0) {
            return `${days}d ${mins}min`;
        } else if (mins === 0) {
            return `${days}d ${hours}h`;
        }
        return `${days}d ${hours}h ${mins}min`;
    }

    // More than an hour (60 minutes)
    if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;

        if (mins === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${mins}min`;
    }

    // Less than an hour
    return `${totalMinutes} min`;
}

/**
 * Format duration from seconds to human-readable string
 * Converts seconds to minutes and uses formatDuration
 */
export function formatDurationFromSeconds(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    return formatDuration(minutes);
}

/**
 * Format Unix timestamp to time string (HH:MM AM/PM)
 */
export function formatTime(timestamp: number | null): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
