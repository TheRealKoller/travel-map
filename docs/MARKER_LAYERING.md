# Mapbox Marker Layering Implementation

## Overview

This document describes the implementation of a proper layering system for markers, routes, and tour lines in the Mapbox GL JS map component. The implementation ensures that click events are properly handled according to the layer hierarchy and that visual elements are displayed in the correct order.

## Layer Hierarchy

The map now uses a clear layer hierarchy from bottom to top:

1. **Mapbox Base Map Layers** (bottom)
   - Standard Mapbox map tiles and labels
   
2. **Saved Routes** (route-{id})
   - Mapbox vector layers for saved routes
   - Displayed with colors based on transport mode
   
3. **Tour Lines** (tour-line-{tourId}-{segmentIndex})
   - Mapbox vector layers connecting markers in a tour
   - Curved lines rendered between consecutive tour markers
   
4. **Saved Markers** (z-index: 10)
   - DOM elements representing persisted markers
   - Standard base z-index
   
5. **Search Result Markers** (z-index: 20)
   - DOM elements for search results
   - Blue circles from Overpass/Mapbox search
   
6. **Temporary/Unsaved Markers** (z-index: 30, topmost)
   - DOM elements for markers not yet saved to database
   - Created by clicking on map, POIs, or place labels
   - Highest z-index ensures they're always on top

## Technical Implementation

### CSS Z-Index

Markers are DOM elements overlaid on the map, so their stacking order is controlled by CSS z-index values defined in `resources/css/map-markers.css`:

```css
.mapbox-marker {
    z-index: 10; /* Default for saved markers */
}

.search-result-marker {
    z-index: 20; /* Search results */
}

.mapbox-marker--temporary {
    z-index: 30; /* Temporary/unsaved markers */
}
```

### TypeScript Layer Management

The `resources/js/lib/map-layers.ts` module provides:

- **MARKER_Z_INDEX**: Constants for marker z-index values
- **VECTOR_LAYER_ORDER**: Prefixes for route and tour line layer IDs
- **getFirstSymbolLayerId()**: Finds the first symbol layer to insert custom layers below
- **ensureVectorLayerOrder()**: Ensures vector layers are properly ordered below symbol layers
- **applyMarkerZIndex()**: Helper to apply z-index to marker elements

### Marker Creation

The `createMarkerElement()` function in `resources/js/lib/marker-utils.ts` now accepts an `isTemporary` parameter:

```typescript
export const createMarkerElement = (
    type: MarkerType,
    isHighlighted = false,
    isTemporary = false,
): HTMLDivElement => {
    // Applies mapbox-marker--temporary class when isTemporary=true
}
```

### Updated Hooks

All marker creation hooks have been updated to use proper layering:

- **use-markers.ts**: Saved markers use `isTemporary=false`
- **use-marker-highlight.ts**: Preserves temporary status when highlighting
- **use-map-interactions.ts**: Creates markers with `isTemporary=true`
- **use-geocoder.ts**: Search box results use `isTemporary=true`
- **use-search-results.ts**: Overpass/Mapbox search results use `isTemporary=true`
- **use-routes.ts**: Routes are inserted below symbol layers
- **use-tour-lines.ts**: Tour lines are inserted below symbol layers

## Event Propagation

All marker click handlers use `e.stopPropagation()` to prevent clicks from propagating to underlying layers:

```typescript
el.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevents event from reaching map or underlying layers
    onMarkerClick(markerId);
});
```

This ensures that:
- Clicking a temporary marker over a route only triggers the marker event
- Clicking a saved marker over a place-label only triggers the marker event
- No unintended interactions occur when elements overlap

## Verification

To verify the implementation:

1. **Temporary markers appear on top**: Create a marker by clicking the map over an existing route or saved marker. The new marker should be clickable and appear on top.

2. **Search results appear above saved markers**: Search for a location and click on the result. The yellow search marker should appear above saved markers.

3. **Routes and tour lines below markers**: Routes and tour lines should appear below all markers but above the base map.

4. **Click events don't propagate**: Clicking on a marker should not trigger underlying layer events (routes, place-labels, POIs).

## Benefits

1. **Clear Visual Hierarchy**: Users can easily distinguish between different types of markers and their relative importance.

2. **Predictable Interactions**: Click events are handled by the topmost element, preventing confusion from multiple overlapping interactive elements.

3. **Maintainable Code**: Centralized layer management makes it easy to adjust the hierarchy or add new layers in the future.

4. **Performance**: Using CSS z-index for DOM elements and Mapbox layer ordering for vector layers ensures optimal rendering performance.

## Future Enhancements

Possible future improvements:

1. Add visual indicators when multiple markers overlap at the same location
2. Implement marker clustering for dense areas
3. Add animation when markers change layers (e.g., temporary → saved)
4. Allow users to customize marker z-index preferences
