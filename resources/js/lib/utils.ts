import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

/**
 * Format duration in hours to a human-readable string.
 * @param hours - Duration in hours (can include decimals)
 * @returns Formatted string like "2h 30min" or "45min" or empty string if 0
 */
export function formatDuration(hours: number): string {
    if (hours === 0) return '';
    if (hours < 1) {
        return `${Math.round(hours * 60)}min`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
        return `${wholeHours}h`;
    }
    return `${wholeHours}h ${minutes}min`;
}
