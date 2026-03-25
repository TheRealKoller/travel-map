# External Services Configuration

Guide to configuring third-party services for the Travel Map application.

## Overview

The Travel Map application integrates with several external services:

- **Mapbox** - Required for map functionality
- **Google Maps** - Optional for public transport routing
- **Unsplash** - Optional for on-demand trip and marker images
- **Le Chat (Mistral AI)** - Optional for AI-powered marker enrichment

## Mapbox

**Status:** ✅ Required for core map functionality

### What is Mapbox?

Mapbox provides the interactive map interface, geocoding (location search), and routing capabilities.

### Getting Your Access Token

1. Create a free account at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Go to your [Account Dashboard](https://account.mapbox.com/)
3. Find your **Default Public Token** or create a new one
4. Copy the token (starts with `pk.`)

### Configuration

Add to your `.env` file:

```env
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
MAPBOX_MONTHLY_REQUEST_LIMIT=10000

# Also add to Vite variables for frontend
VITE_MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN}"
```

### Rate Limits

**Free Tier:**

- 50,000 map loads per month
- 100,000 geocoding requests per month
- 100,000 routing requests per month

**Recommendation:** Set `MAPBOX_MONTHLY_REQUEST_LIMIT` based on your plan to enable application-level rate limiting.

### Testing

After configuration, you should be able to:

- View the interactive map
- Search for locations
- Calculate routes between markers

### Troubleshooting

**Map not displaying:**

- Verify your token in `.env` and `.env` is loaded
- Check browser console for 401 errors
- Ensure token has not expired
- Rebuild frontend: `npm run build`

**"Unauthorized" errors:**

- Token may be invalid or expired
- Create a new token in Mapbox dashboard
- Update both `MAPBOX_ACCESS_TOKEN` and `VITE_MAPBOX_ACCESS_TOKEN`

### Related Documentation

- [Mapbox API Documentation](https://docs.mapbox.com/api/)
- [API Reference](../api/mapbox.md)

---

## Google Maps

**Status:** ⚙️ Optional (for public transport routing)

### What is Google Maps?

Google Maps Directions API provides public transport routing with detailed transit information (buses, trains, trams).

### Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Directions API**:
    - Go to "APIs & Services" → "Library"
    - Search for "Directions API"
    - Click "Enable"
4. Create credentials:
    - Go to "APIs & Services" → "Credentials"
    - Click "Create Credentials" → "API Key"
    - Copy your API key
5. (Recommended) Restrict your API key:
    - Click on the key to edit it
    - Set application restrictions (HTTP referrers for web)
    - Set API restrictions (limit to Directions API only)

### Configuration

Add to your `.env` file:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Features Enabled

When configured, users can:

- Calculate routes with public transport
- View detailed transit instructions (lines, stops, transfers)
- See departure/arrival times
- View number of stops on each segment

### Rate Limits & Pricing

**Free Tier:**

- $200 free credit per month
- Directions API: $5 per 1,000 requests
- Approximately 40,000 free requests per month

**Cost Optimization:**

- Routes are cached to minimize API calls
- Users must explicitly request public transport routing

### Testing

1. Navigate to the map
2. Create a route between two markers
3. Select "Public Transport" as the routing mode
4. View detailed transit instructions

### Troubleshooting

**Public transport option not available:**

- Check that `GOOGLE_MAPS_API_KEY` is set in `.env`
- Restart your Laravel server: `php artisan serve`

**API errors:**

- Verify API key in Google Cloud Console
- Ensure Directions API is enabled
- Check API key restrictions (may be too restrictive)
- Review billing account status

### Related Documentation

- [Google Directions API](https://developers.google.com/maps/documentation/directions)
- [API Reference](../api/) (when available)

---

## Unsplash

**Status:** ⚙️ Optional (for on-demand images)

### What is Unsplash?

Unsplash provides high-quality, free stock photos for trips and markers.

### Features

- **On-demand image fetching** - Click placeholder to load relevant images
- **Smart caching** - Images cached for 30 days to minimize API calls
- **Download tracking** - Properly tracks downloads to benefit photographers
- **API compliance** - Uses official Unsplash PHP wrapper
- **Graceful fallback** - Shows placeholders if API unavailable

### Getting Your Access Key

1. Create a free account at [Unsplash Developers](https://unsplash.com/developers)
2. Register your application:
    - Go to "Your Apps"
    - Click "New Application"
    - Accept terms and provide app details
3. Copy your **Access Key**

### Configuration

Add to your `.env` file:

```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
UNSPLASH_UTM_SOURCE="${APP_NAME}"
```

**`UNSPLASH_UTM_SOURCE`** is used for attribution tracking. It defaults to your `APP_NAME`.

### Rate Limits

**Free Tier:**

- 50 requests per hour
- Demo status: Limited to 50 requests/hour

**Production:**

- Apply for production access to increase limits
- 5,000 requests per hour after approval

### Usage

1. View a trip or marker
2. Click on the placeholder image icon
3. Application fetches a relevant image from Unsplash
4. Image is displayed and cached for 30 days

### Caching Behavior

- Images are cached for **30 days**
- Cache reduces API calls significantly
- Downloaded images are hotlinked (per Unsplash guidelines)
- Photo views are tracked when images are displayed

### Troubleshooting

**Images not loading:**

- Check API key in `.env`
- Review rate limit (50 requests/hour on free tier)
- Check browser console for errors
- Verify internet connectivity

**Rate limit exceeded:**

- Wait for the rate limit to reset (hourly)
- Consider applying for production access
- Images will fall back to placeholders

**Cache issues:**

- Clear application cache: `php artisan cache:clear`
- Check `storage/framework/cache` permissions

### Related Documentation

- [Unsplash API Documentation](https://unsplash.com/documentation)
- [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
- [API Reference](../api/unsplash.md)

---

## Le Chat Agent

**Status:** ⚙️ Optional (for AI-powered features)

### What is Le Chat?

Le Chat (Mistral AI) provides AI-powered marker enrichment and travel recommendations.

### Features

- **Marker enrichment** - Automatically enhance marker descriptions with AI
- **Travel recommendations** - Get AI-generated suggestions for destinations
- **Contextual information** - Provide historical, cultural context

### Getting Your API Key

1. Create an account at [Mistral AI Console](https://console.mistral.ai/)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key

### Creating Agents

You need to create two agents:

1. **Marker Enrichment Agent**
    - Purpose: Enhance marker descriptions
    - Recommended model: `mistral-large-latest`

2. **Travel Recommendation Agent**
    - Purpose: Generate travel recommendations
    - Recommended model: `mistral-large-latest`

For detailed agent setup instructions, see [Le Chat Integration](../api/lechat.md).

### Configuration

Add to your `.env` file:

```env
LECHAT_API_KEY=your_lechat_api_key_here
LECHAT_MARKER_ENRICHMENT_AGENT_ID=your_enrichment_agent_id
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=your_recommendation_agent_id
```

### Rate Limits & Pricing

**Free Tier:**

- Limited free usage
- Check current limits in console

**Paid Plans:**

- Pay-as-you-go based on token usage
- Pricing varies by model

### Usage

Once configured:

- Marker enrichment is available in marker editing
- Travel recommendations appear in trip planning

### Troubleshooting

**AI features not available:**

- Verify all three Le Chat environment variables are set
- Restart Laravel server

**API errors:**

- Check API key validity
- Verify agent IDs are correct
- Review rate limits and billing status

### Related Documentation

- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Le Chat Integration Guide](../api/lechat.md)
- [Le Chat Agent Setup](../api/lechat.md#agent-setup)

---

## Verification Checklist

After configuring external services, verify:

- [ ] **Mapbox** - Map displays correctly and location search works
- [ ] **Google Maps** (if configured) - Public transport routing available
- [ ] **Unsplash** (if configured) - Can fetch images by clicking placeholders
- [ ] **Le Chat** (if configured) - AI features available in UI

## Environment Variables Summary

Quick reference for all external service variables:

```env
# Mapbox (Required)
MAPBOX_ACCESS_TOKEN=pk.your_token
MAPBOX_MONTHLY_REQUEST_LIMIT=10000
VITE_MAPBOX_ACCESS_TOKEN="${MAPBOX_ACCESS_TOKEN}"

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=your_key

# Unsplash (Optional)
UNSPLASH_ACCESS_KEY=your_key
UNSPLASH_UTM_SOURCE="${APP_NAME}"

# Le Chat Agent (Optional)
LECHAT_API_KEY=your_key
LECHAT_MARKER_ENRICHMENT_AGENT_ID=agent_id
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=agent_id
```

---

## Next Steps

- **Review environment variables** - See [Environment Variables Reference](./environment-variables.md)
- **Complete local setup** - See [Local Development](./local-development.md)
- **Learn about API features** - See [API Documentation](../api/)

## Need Help?

- Review service-specific documentation in [API Reference](../api/)
- Check the [Troubleshooting section](./local-development.md#troubleshooting) in Local Development
- Consult official documentation for each service (links provided above)
