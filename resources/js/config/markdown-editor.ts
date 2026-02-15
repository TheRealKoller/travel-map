/**
 * Configuration for SimpleMDE markdown editor and marked.js
 */

import type { Options } from 'easymde';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

/**
 * Available toolbar buttons for SimpleMDE
 */
export type ToolbarButton =
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

/**
 * Configure marked.js globally (call once)
 * Sets up GitHub Flavored Markdown with line breaks
 */
export function configureMarked(): void {
    if (
        typeof window !== 'undefined' &&
        !(window as unknown as Record<string, unknown>).__markedConfigured
    ) {
        marked.setOptions({
            breaks: true,
            gfm: true,
        });
        (window as unknown as Record<string, unknown>).__markedConfigured =
            true;
    }
}

/**
 * Get SimpleMDE editor configuration
 * Returns options for consistent editor behavior
 */
export function getSimpleMDEOptions(): Options {
    return {
        spellChecker: false,
        placeholder: 'Add notes about this location (Markdown supported)...',
        status: false,
        previewRender: (text: string) => {
            return DOMPurify.sanitize(marked.parse(text) as string);
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
}
