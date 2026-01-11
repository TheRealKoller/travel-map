# Mapbox Geocoder Feature

## Overview

The Travel Map application includes a powerful search feature powered by the **Mapbox Geocoder** (`@mapbox/mapbox-gl-geocoder`). This allows users to search for locations worldwide and quickly add them as markers to their maps.

## Features

### Location Search
- **Search Bar**: Located in the top-left corner of the map
- **Placeholder Text**: "Search for places..."
- **Autocomplete**: Provides real-time suggestions as you type
- **Global Coverage**: Search for any location worldwide using Mapbox's geocoding service

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

### Package
- **Library**: `@mapbox/mapbox-gl-geocoder` v5.1.2
- **Styles**: Imported from `@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css`
- **Documentation**: [Mapbox Geocoder API](https://github.com/mapbox/mapbox-gl-geocoder)

### Configuration
```typescript
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken || '',
    mapboxgl: mapboxgl as never,
    marker: false, // We handle markers ourselves
    placeholder: 'Search for places...',
});

map.addControl(geocoder, 'top-left');
```

### Event Handling
The geocoder listens for the `result` event:
```typescript
geocoder.on('result', (e: { result: GeocodeResult }) => {
    const [lng, lat] = e.result.center;
    const placeName = e.result.place_name || 'Searched Location';
    // Creates temporary yellow marker with click handler
});
```

## Testing

### E2E Tests
Comprehensive E2E tests are available in `tests/e2e/geocoder.spec.ts`:

- **Visibility Test**: Verifies the geocoder control is visible on the map
- **Input Test**: Checks that the input field is accessible and has the correct placeholder
- **Typing Test**: Ensures users can type into the search field
- **API Request Test**: Validates that searches trigger Mapbox API requests
- **Clear Button Test**: Tests the clear (X) button functionality
- **Results Test**: Verifies the results dropdown appears

### Running Tests
```bash
npm run test:e2e -- geocoder.spec.ts
```

### Test Mocking
All Mapbox API requests are mocked in tests using the `setupMapboxMock` helper:
- No real API calls are made during tests
- Mock responses are provided for geocoding requests
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

#### Adding the Geocoder to a Map
```typescript
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
});

map.addControl(geocoder, 'top-left');
```

#### Customizing the Geocoder
The geocoder supports many options:
- `placeholder`: Custom placeholder text
- `countries`: Limit results to specific countries
- `types`: Filter by feature types (place, address, poi, etc.)
- `bbox`: Limit results to a bounding box
- `proximity`: Bias results toward a location

See the [Mapbox Geocoder API docs](https://github.com/mapbox/mapbox-gl-geocoder/blob/main/API.md) for all options.

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

### Geocoding API
- **Service**: Mapbox Geocoding API
- **Endpoint**: `https://api.mapbox.com/geocoding/v5/`
- **Rate Limits**: Subject to your Mapbox plan's limits
- **Free Tier**: 100,000 requests/month (as of 2026)

### Request Limiting
The application includes built-in Mapbox request limiting to avoid exceeding quotas. See `docs/MAPBOX_REQUEST_LIMITING.md` for details.

## Troubleshooting

### Geocoder Not Showing
- Check that `VITE_MAPBOX_ACCESS_TOKEN` is set in `.env`
- Verify the geocoder CSS is imported
- Check browser console for errors

### Search Not Working
- Verify your Mapbox token is valid
- Check network requests in browser DevTools
- Ensure you haven't exceeded API rate limits
- Look for CORS issues (tokens must allow the domain)

### Styling Issues
- Ensure the geocoder CSS is imported before any custom styles
- Check for CSS conflicts with `.mapboxgl-ctrl-geocoder` classes
- Verify TailwindCSS isn't overriding geocoder styles

## Future Enhancements

Potential improvements for the geocoder feature:
- [ ] Add country filter option
- [ ] Implement search history
- [ ] Add keyboard shortcuts (Ctrl+K to focus)
- [ ] Support custom search filters (only POIs, only cities, etc.)
- [ ] Add geolocation "Search near me" button
- [ ] Implement search result favorites
- [ ] Add search analytics

## Related Documentation

- [Mapbox Migration Guide](./MAPBOX_MIGRATION.md)
- [Mapbox Request Limiting](./MAPBOX_REQUEST_LIMITING.md)
- [E2E Test Mocking Guide](../tests/e2e/MAPBOX_MOCKING.md)

## Support

For issues or questions about the geocoder feature:
- Open an issue on GitHub
- Check [Mapbox Geocoder Documentation](https://docs.mapbox.com/api/search/geocoding/)
- Review [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
