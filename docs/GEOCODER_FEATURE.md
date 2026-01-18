# Mapbox SearchBox Feature

## Overview

The Travel Map application includes a powerful search feature powered by the **Mapbox SearchBox** (`@mapbox/search-js-react`). This allows users to search for locations worldwide with proximity-based results and quickly add them as markers to their maps.

## Features

### Location Search
- **Search Box**: Located in the top-left corner of the map
- **Placeholder Text**: "Search for places..."
- **Autocomplete**: Provides real-time suggestions as you type
- **Global Coverage**: Search for any location worldwide using Mapbox's Search Box API
- **Proximity Filtering**: Results are biased based on the current map viewport center, showing nearby locations first
- **Multi-language Support**: Supports both English and German (`en,de`)

### Search Results
- **Temporary Yellow Marker**: When you select a search result, a yellow search marker appears at the location
- **Hover Tooltip**: Shows the location name when hovering over the temporary marker
- **Click to Save**: Click the temporary marker to convert it to a permanent marker
- **Info Popup**: The temporary marker displays a popup with instructions: "Click on this marker to add it permanently"

### Marker Creation
When you click a temporary search marker:
1. The temporary marker is removed
2. A permanent marker is created at the location
3. The marker is automatically selected, opening the marker form
4. The location name from the search is pre-filled in the form
5. You can then edit details and save the marker to your trip

## User Interface

### Geocoder Control
- **Position**: Top-left corner of the map
- **Clear Button**: An "X" button appears when text is entered, allowing you to clear the search
- **Test ID**: `data-testid="map-geocoder"` for E2E testing

### Visual Feedback
- **Search Icon**: FontAwesome search icon (`fa-search`) in the temporary marker
- **Yellow Color**: Temporary markers are yellow to distinguish them from saved markers
- **Map Navigation**: After selecting a result, the map automatically flies to the location at zoom level 16

## Implementation Details

### Packages
- **React Component**: `@mapbox/search-js-react` v1.5.1
- **Core Library**: `@mapbox/search-js-core` v1.5.1  
- **Web Component**: `@mapbox/search-js-web` v1.5.1
- **Documentation**: [Mapbox Search JS Docs](https://docs.mapbox.com/mapbox-search-js/api/react/)

### Component Structure
The search box is implemented as a React component (`MapSearchBox`) that wraps the Mapbox SearchBox:

```typescript
<MapSearchBox
    mapInstance={mapInstance}
    onRetrieve={handleSearchResult}
    accessToken={mapboxgl.accessToken || ''}
/>
```

### Configuration
```typescript
<SearchBox
    accessToken={accessToken}
    options={{
        language: 'en,de',
        proximity: proximity || undefined, // Updates with map center
    }}
    placeholder="Search for places..."
    onRetrieve={onRetrieve}
    theme={{
        variables: {
            fontFamily: 'inherit',
            unit: '14px',
            borderRadius: '8px',
        },
    }}
/>
```

### Proximity-Based Search
The search box automatically updates its proximity parameter based on the map's current center:
- When the map moves, the proximity location updates
- Search results are biased toward locations near the current map view
- This provides more relevant results as users pan around the map

### Event Handling
The SearchBox uses the `onRetrieve` callback:
```typescript
const handleSearchResult = (result: SearchBoxRetrieveResponse) => {
    const coordinates = result.features[0]?.geometry.coordinates;
    const properties = result.features[0]?.properties;
    const placeName = properties?.name || properties?.full_address || 'Searched Location';
    // Creates temporary yellow marker with click handler
};
```

## Testing

### Backend Tests
The application includes comprehensive backend tests that verify the Mapbox integration:
- All 269 tests pass
- Includes tests for Mapbox request limiting
- Tests for marker creation and management

### Running Tests
```bash
# Run all backend tests
composer test

# Or use Pest directly
./vendor/bin/pest
```

### Test Mocking
All Mapbox API requests are mocked in tests:
- No real API calls are made during tests
- Mock responses are provided for search requests
- This ensures tests are fast, reliable, and don't consume API quota

## Usage Guide

### For End Users

1. **Open the Search Bar**
   - Look for the search box in the top-left corner of the map
   - It shows "Search for places..." as placeholder text

2. **Enter a Location**
   - Type any location name (city, address, landmark, etc.)
   - Suggestions will appear as you type

3. **Select a Result**
   - Click on one of the suggested locations
   - The map will fly to that location
   - A yellow temporary marker appears

4. **Save the Marker**
   - Click the yellow temporary marker
   - It converts to a permanent marker
   - The marker form opens automatically
   - Edit details and click "Save"

5. **Clear the Search**
   - Click the "X" button to clear your search
   - Start a new search anytime

### For Developers

#### Adding the SearchBox to a Map
```typescript
import { SearchBox } from '@mapbox/search-js-react';

// In your component
<SearchBox
    accessToken={mapboxgl.accessToken}
    options={{
        language: 'en,de',
        proximity: { lng: centerLng, lat: centerLat },
    }}
    placeholder="Search for places..."
    onRetrieve={handleRetrieve}
/>
```

#### Customizing the SearchBox
The SearchBox supports many options:
- `proximity`: Bias results toward a location (automatically updated with map center)
- `language`: Language for results (default: `'en,de'`)
- `limit`: Maximum number of results
- `country`: Limit results to specific countries
- `types`: Filter by feature types
- `bbox`: Limit results to a bounding box

See the [Mapbox Search JS API docs](https://docs.mapbox.com/mapbox-search-js/api/react/) for all options.

## Environment Configuration

The geocoder requires a Mapbox access token:

```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN}"
```

**Getting a Token:**
1. Sign up at [mapbox.com](https://www.mapbox.com/)
2. Go to [Account Dashboard](https://account.mapbox.com/)
3. Create or copy your default public token
4. Add it to `.env`

## API Usage

### Search Box API
- **Service**: Mapbox Search Box API
- **Endpoint**: `https://api.mapbox.com/search/searchbox/v1`
- **Rate Limits**: Subject to your Mapbox plan's limits
- **Free Tier**: 100,000 requests/month

### Features
- Autocomplete suggestions as you type
- Structured address data
- POI (Point of Interest) search
- Proximity-based result ranking
- Multi-language support

### Request Limiting
The application includes built-in Mapbox request limiting to avoid exceeding quotas. See `docs/MAPBOX_REQUEST_LIMITING.md` for details.

## Troubleshooting

### SearchBox Not Showing
- Check that `VITE_MAPBOX_ACCESS_TOKEN` is set in `.env`
- Verify the map instance is initialized before rendering SearchBox
- Check browser console for errors

### Search Not Working
- Verify your Mapbox token is valid
- Check network requests in browser DevTools
- Ensure you haven't exceeded API rate limits
- Look for CORS issues (tokens must allow the domain)

### Styling Issues
- The SearchBox uses CSS custom properties for theming
- Check for CSS conflicts with the search box container
- Verify theme variables are properly configured

## Future Enhancements

Potential improvements for the search feature:
- [ ] Add country filter option
- [ ] Implement search history
- [ ] Add keyboard shortcuts (Ctrl+K to focus)
- [ ] Support custom search filters (only POIs, only cities, etc.)
- [ ] Add geolocation "Search near me" button
- [ ] Implement search result favorites
- [ ] Add search analytics
- [ ] Adjust proximity radius based on map zoom level

## Related Documentation

- [Mapbox Migration Guide](./MAPBOX_MIGRATION.md)
- [Mapbox Request Limiting](./MAPBOX_REQUEST_LIMITING.md)
- [Mapbox Search JS Documentation](https://docs.mapbox.com/mapbox-search-js/api/react/)

## Support

For issues or questions about the search feature:
- Open an issue on GitHub
- Check [Mapbox Search JS Documentation](https://docs.mapbox.com/mapbox-search-js/)
- Review [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
