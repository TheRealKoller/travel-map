/**
 * Map Layer Management
 *
 * This module defines the layer hierarchy for the Mapbox map.
 * Layers are ordered from bottom to top:
 * 1. Mapbox base map layers (default)
 * 2. Saved Routes layer (route-*)
 * 3. Tour Lines layer (tour-line-*)
 * 4. Saved Markers layer (z-index: 10)
 * 5. Search Results layer (z-index: 20)
 * 6. Temporary Markers layer (z-index: 30) - topmost
 *
 * Note: Mapbox GL JS markers are DOM elements overlaid on the map,
 * not actual Mapbox layers. Their z-index is controlled via CSS.
 * Route and tour line layers are actual Mapbox vector layers.
 */

/**
 * Z-index values for marker layers (DOM elements)
 * Higher values appear on top
 */
export const MARKER_Z_INDEX = {
    SAVED: 10,
    SEARCH_RESULT: 20,
    TEMPORARY: 30,
} as const;

/**
 * Layer ordering for Mapbox vector layers
 * These are the IDs or ID prefixes for Mapbox layers
 */
export const VECTOR_LAYER_ORDER = {
    // Routes are added dynamically with IDs like "route-{id}"
    ROUTES_PREFIX: 'route-',
    // Tour lines are added dynamically with IDs like "tour-line-{tourId}-{segmentIndex}"
    TOUR_LINES_PREFIX: 'tour-line-',
} as const;

/**
 * Get the first symbol layer ID in the map style
 * This is used to insert custom layers below labels
 */
export function getFirstSymbolLayerId(map: mapboxgl.Map): string | undefined {
    const layers = map.getStyle()?.layers;
    if (!layers) return undefined;

    // Find the first symbol layer
    for (const layer of layers) {
        if (layer.type === 'symbol') {
            return layer.id;
        }
    }
    return undefined;
}

/**
 * Ensures vector layers (routes, tour lines) are ordered correctly
 * Should be called after adding new layers to maintain proper ordering
 */
export function ensureVectorLayerOrder(map: mapboxgl.Map): void {
    if (!map.isStyleLoaded()) {
        console.warn('Cannot reorder layers: map style not loaded');
        return;
    }

    // Get the first symbol layer to insert our layers before it
    const firstSymbolLayerId = getFirstSymbolLayerId(map);
    if (!firstSymbolLayerId) {
        console.warn('No symbol layer found for layer ordering');
        return;
    }

    const layers = map.getStyle()?.layers;
    if (!layers) return;

    // Collect all route and tour line layers
    const routeLayers: string[] = [];
    const tourLineLayers: string[] = [];

    for (const layer of layers) {
        if (layer.id.startsWith(VECTOR_LAYER_ORDER.ROUTES_PREFIX)) {
            routeLayers.push(layer.id);
        } else if (layer.id.startsWith(VECTOR_LAYER_ORDER.TOUR_LINES_PREFIX)) {
            tourLineLayers.push(layer.id);
        }
    }

    // Move layers in correct order (from bottom to top):
    // 1. Routes (and their hover layers)
    // 2. Tour lines (and their hover layers)
    // All should be below the first symbol layer

    [...routeLayers, ...tourLineLayers].forEach((layerId) => {
        try {
            map.moveLayer(layerId, firstSymbolLayerId);
        } catch (error) {
            console.error(`Failed to move layer ${layerId}:`, error);
        }
    });
}

/**
 * Apply z-index to a marker element based on its type
 */
export function applyMarkerZIndex(
    element: HTMLElement,
    type: 'saved' | 'search-result' | 'temporary',
): void {
    switch (type) {
        case 'saved':
            element.style.zIndex = String(MARKER_Z_INDEX.SAVED);
            break;
        case 'search-result':
            element.style.zIndex = String(MARKER_Z_INDEX.SEARCH_RESULT);
            break;
        case 'temporary':
            element.style.zIndex = String(MARKER_Z_INDEX.TEMPORARY);
            break;
    }
}
