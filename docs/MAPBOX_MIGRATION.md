# Mapbox GL JS Migration Guide

This document explains the migration from Leaflet.js to Mapbox GL JS.

## What Changed

### Dependencies

**Removed:**
- `leaflet` - Leaflet mapping library
- `leaflet-control-geocoder` - Geocoding control for Leaflet
- `leaflet.awesome-markers` - Custom marker icons for Leaflet
- `@types/leaflet` - TypeScript types for Leaflet

**Added:**
- `mapbox-gl` - Mapbox GL JS mapping library
- `@mapbox/mapbox-gl-geocoder` - Geocoding control for Mapbox
- `@types/mapbox-gl` - TypeScript types for Mapbox GL
- `@types/mapbox__mapbox-gl-geocoder` - TypeScript types for Mapbox geocoder

### Environment Configuration

A Mapbox access token is now required. Add to your `.env` file:

```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN}"
```

**How to get a Mapbox token:**
1. Sign up for a free account at [mapbox.com](https://www.mapbox.com/)
2. Go to your [Account Dashboard](https://account.mapbox.com/)
3. Create a new access token or copy the default public token
4. Add it to your `.env` file

### Code Changes

#### Map Component (`resources/js/components/travel-map.tsx`)

**Map Initialization:**
- Changed from `L.map()` to `new mapboxgl.Map()`
- Map style changed to Mapbox streets style
- Coordinate order changed from `[lat, lng]` to `[lng, lat]` (Mapbox convention)

**Markers:**
- Changed from `L.marker()` to `new mapboxgl.Marker()`
- Custom HTML markers replace Leaflet's awesome-markers
- Markers now use FontAwesome icons with custom styling
- Marker popup API changed from `.bindTooltip()` to `.setPopup(new mapboxgl.Popup())`

**Geocoder:**
- Changed from `L.Control.geocoder()` to `new MapboxGeocoder()`
- Event handling changed from `markgeocode` to `result`
- Geocoder uses Mapbox geocoding service instead of Nominatim

**Routes:**
- Changed from `L.polyline()` to Mapbox GL layers
- Routes now use GeoJSON sources with line layers
- Popup handling changed to click events on layers

**Search Radius Circles:**
- Changed from `L.circle()` to GeoJSON polygon layers
- Circle approximation uses computed polygon coordinates

#### Type Definitions (`resources/js/types/marker.ts`)

Changed marker type from `L.Marker` to `mapboxgl.Marker`:

```typescript
// Before
import L from 'leaflet';
marker: L.Marker;

// After
import mapboxgl from 'mapbox-gl';
marker: mapboxgl.Marker;
```

### Testing Changes

#### E2E Tests

CSS selectors updated to match Mapbox GL classes:

```typescript
// Before
page.locator('.leaflet-container')
page.locator('.leaflet-control-zoom')

// After
page.locator('.mapboxgl-map')
page.locator('.mapboxgl-ctrl-zoom-in')
```

## Migration Benefits

1. **Better Performance**: Mapbox GL JS uses WebGL for rendering, providing better performance with large datasets
2. **Vector Tiles**: Native support for vector tiles with better quality at all zoom levels
3. **3D Support**: Built-in support for 3D terrain and buildings (can be enabled later)
4. **Modern Technology**: Actively maintained with modern features and better mobile support
5. **Professional Maps**: Access to professional-quality map styles from Mapbox

## Known Issues

None at this time. All existing tests pass after migration.

## Rollback Instructions

If you need to rollback to Leaflet:

1. Restore `package.json` dependencies:
   ```bash
   npm uninstall mapbox-gl @mapbox/mapbox-gl-geocoder @types/mapbox-gl @types/mapbox__mapbox-gl-geocoder
   npm install leaflet leaflet-control-geocoder leaflet.awesome-markers @types/leaflet
   ```

2. Revert the changes in:
   - `resources/js/components/travel-map.tsx`
   - `resources/js/types/marker.ts`
   - E2E test files

3. Remove Mapbox environment variables from `.env`

## Support

For issues or questions about this migration, please open an issue on GitHub.
