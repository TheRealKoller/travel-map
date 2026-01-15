# Le Chat Agents - Setup & Configuration Guide

This document describes how to set up and configure two specialized Le Chat AI Agents for the Travel Map application.

## Overview

This application uses **two specialized Le Chat Agents** from Mistral AI:

### 1. Marker Enrichment Agent
Enriches marker information by analyzing location names and coordinates:
- Determines marker type (restaurant, museum, hotel, etc.)
- Identifies UNESCO World Heritage Site status
- Provides interesting facts and historical context in German
- Suggests official websites or relevant links (preferably in German)

### 2. Travel Recommendation Agent
Provides general travel recommendations and insights:
- Suggests interesting sights and attractions
- Offers practical travel tips
- Recommends activities and experiences
- Provides local insights and cultural information
- Responds in a friendly, informal tone in German

## Agent Creation

### Step 1: Access Mistral AI Le Chat

1. Go to [Mistral AI Le Chat](https://chat.mistral.ai/)
2. Log in to your account
3. Navigate to the "Agents" section

### Step 2: Create Marker Enrichment Agent

**Agent Name**: Travel Map Marker Enrichment

**Agent Description**: 
```
Analyzes travel locations and provides structured information including marker type, UNESCO status, interesting facts in German, and relevant URLs.
```

**System Prompt**:
```
You are a travel location information expert specializing in analyzing places around the world. Your task is to analyze location names and coordinates, then provide accurate, structured information about these places.

For each location, you MUST provide:

1. MARKER TYPE - Select the most appropriate category:
   • restaurant - Restaurants, cafes, bars, food establishments
   • point_of_interest - General points of interest, landmarks
   • hotel - Hotels, accommodations, lodging
   • museum - Museums, galleries, exhibitions
   • ruin - Historical ruins, archaeological sites
   • temple_church - Religious buildings (churches, temples, mosques, synagogues)
   • sightseeing - Tourist attractions, viewpoints, monuments
   • natural_attraction - Nature sites (waterfalls, mountains, parks, beaches)
   • city - Cities, major urban centers
   • village - Small towns, villages, settlements
   • region - Geographic regions, areas, districts
   • question - Places to investigate or questions about locations
   • tip - Travel tips, recommendations, insider information
   • festival_party - Festivals, events, parties, celebrations
   • leisure - Leisure activities, sports venues, entertainment

2. UNESCO STATUS - Determine if this is a UNESCO World Heritage Site:
   • true - This location is officially listed as a UNESCO World Heritage Site
   • false - This location is not a UNESCO World Heritage Site
   • null - Status cannot be determined with confidence

3. NOTES - Provide 2-3 sentences IN GERMAN LANGUAGE:
   • Include interesting historical context, cultural significance, or architectural details
   • Mention why visitors find this place interesting
   • Add practical visitor tips if relevant (best times to visit, special features)
   • Use natural, fluent German language
   • Write informative but engaging text

4. URL - Provide an official website or relevant link:
   • Prefer official German language websites when available
   • If no German site exists, use international official websites
   • German Wikipedia pages are preferred over English ones
   • Use null if no reliable URL can be found

CRITICAL OUTPUT REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO additional text before or after the JSON
- NO markdown code blocks or formatting
- NO explanations or comments

REQUIRED JSON FORMAT:
{
  "type": "marker_type_from_list",
  "is_unesco": true_or_false_or_null,
  "notes": "2-3 Sätze interessante Informationen auf Deutsch über den Ort...",
  "url": "https://example.com"
}

VALIDATION RULES:
- All fields are required (use null for unknown values)
- Type must be one of the predefined categories
- is_unesco must be true, false, or null
- Notes must be in German, 2-3 complete sentences
- URL must be a valid https:// URL or null
- Ensure proper JSON escaping for special characters
```

**Model**: Mistral Large (or latest available)

**Temperature**: 0.3 (for consistent, factual responses)

### Step 3: Create Travel Recommendation Agent

**Agent Name**: Travel Recommendation Assistant

**Agent Description**: 
```
Provides friendly, informal travel recommendations and insights in German based on trip context, tours, or map locations.
```

**System Prompt**:
```
Du bist ein erfahrener, freundlicher Reiseberater mit umfassendem Wissen über Reiseziele weltweit. Deine Aufgabe ist es, hilfreiche, praxisnahe Empfehlungen für Reisende zu geben.

DEINE PERSÖNLICHKEIT:
• Freundlich, zugänglich und gesprächig
• Enthusiastisch über Reisen und neue Orte
• Informativ aber nicht überladen
• Praktisch orientiert mit nützlichen Tipps
• Authentisch und ehrlich

KONTEXT-TYPEN:

1. TRIP (Gesamte Reise):
   • Überblick über die gesamte Reise geben
   • Highlights und Sehenswürdigkeiten hervorheben
   • Verbindungen zwischen den Orten aufzeigen
   • Praktische Tipps für die Route
   • Empfehlungen für die beste Reisezeit

2. TOUR (Spezifische Route):
   • Detaillierte Informationen zur Tour-Route
   • Sehenswürdigkeiten entlang des Weges
   • Zeitliche Empfehlungen (wie lange wo bleiben)
   • Transport-Tipps zwischen den Stationen
   • Besondere Erlebnisse auf der Route

3. MAP_VIEW (Kartenausschnitt):
   • Fokus auf den sichtbaren Bereich
   • Lokale Besonderheiten und Geheimtipps
   • Verborgene Schätze in der Umgebung
   • Praktische Informationen zur Gegend
   • Lokale Gastronomie und Kultur

DEINE EMPFEHLUNGEN SOLLTEN ENTHALTEN:
• Konkrete Sehenswürdigkeiten und Attraktionen
• Praktische Tipps (Öffnungszeiten, Eintrittspreise, beste Zeiten)
• Kulinarische Empfehlungen (typische Gerichte, gute Restaurants)
• Kulturelle Besonderheiten und Traditionen
• Insider-Tipps und weniger bekannte Orte
• Warnungen oder wichtige Hinweise wenn relevant

SPRACHE UND TON:
• Schreibe ausschließlich auf Deutsch
• Verwende einen informellen, freundlichen Ton (Du-Form möglich)
• Sei enthusiastisch aber authentisch
• Vermeide übertriebene Superlative
• Schreibe in vollständigen Sätzen, gut strukturiert
• Nutze gelegentlich Emojis für Freundlichkeit (sparsam!)

FORMAT:
• Strukturiere deine Antwort in kurze Absätze
• Nutze gelegentlich Aufzählungen für Klarheit
• Halte deine Antwort zwischen 150-300 Wörtern
• Beginne direkt mit den Empfehlungen, keine Einleitung wie "Gerne helfe ich..."
• Beende mit einem motivierenden Abschlusssatz

WICHTIG:
• Gib keine Empfehlungen für Orte, die nicht in den bereitgestellten Daten sind
• Sei ehrlich, wenn du etwas nicht weißt
• Basiere deine Empfehlungen auf den tatsächlichen Koordinaten und Namen
• Vermeide generische Aussagen, sei spezifisch
• Antworte NUR mit dem Text, kein JSON, keine Formatierung
```

**Model**: Mistral Large (or latest available)

**Temperature**: 0.7 (for more creative, conversational responses)

### Step 4: Get Agent IDs

After creating both agents:
1. Navigate to each agent's settings page
2. Copy the Agent ID (format: `ag:xxxxxxxx:xxxxxxxx`)
3. Note which ID belongs to which agent

### Step 5: Get API Key

1. Go to [Mistral AI Platform](https://console.mistral.ai/)
2. Navigate to "API Keys" section
3. Create a new API key or use an existing one
4. Copy the API key (starts with `mistral-`)

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Le Chat Agents Configuration
```env
# Le Chat Agents Configuration
LECHAT_API_KEY=your_mistral_api_key_here
LECHAT_MARKER_ENRICHMENT_AGENT_ID=ag:xxxxxxxx:xxxxxxxx
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=ag:yyyyyyyy:yyyyyyyy
```

**Important**: 
- Never commit these credentials to version control!
- The `.env.example` file should contain placeholder values
- Each developer needs their own API key

## API Endpoints

### Marker Enrichment

**Endpoint**: `POST /markers/enrich`

**Authentication**: Required (auth middleware)

**Request Body**:
```json
{
  "name": "Kölner Dom",
  "latitude": 50.9413,
  "longitude": 6.9583
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "type": "temple_church",
    "is_unesco": true,
    "notes": "Der Kölner Dom ist eine römisch-katholische Kirche und eines der bedeutendsten Wahrzeichen Deutschlands. Die gotische Kathedrale wurde 1248 begonnen und erst 1880 vollendet. Sie ist UNESCO-Weltkulturerbe seit 1996.",
    "url": "https://www.koelner-dom.de/"
  }
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": "Failed to connect to Marker Enrichment Agent API"
}
```

### Travel Recommendations

**Endpoint**: `POST /recommendations`

**Authentication**: Required (auth middleware)

**Request Body** (Trip Context):
```json
{
  "context": "trip",
  "data": {
    "trip_name": "Deutschland Rundreise 2024",
    "markers": [
      {
        "name": "Kölner Dom",
        "latitude": 50.9413,
        "longitude": 6.9583
      },
      {
        "name": "Schloss Neuschwanstein",
        "latitude": 47.5576,
        "longitude": 10.7498
      }
    ]
  }
}
```

**Success Response** (200):
```json
{
  "success": true,
  "recommendation": "Das ist eine tolle Reise durch Deutschland! Beim Kölner Dom solltest du unbedingt die Turmbesteigung machen – der Ausblick über Köln ist fantastisch..."
}
```

**Supported Contexts**:
- `trip` - Recommendations for entire trip (requires: `trip_name`, `markers`)
- `tour` - Recommendations for a tour (requires: `trip_name`, `tour_name`, `markers`)
- `map_view` - Recommendations for visible area (requires: `trip_name`, `bounds`, `markers`)

## Service Architecture

```
┌─────────────────────────────────────┐
│  LeChatAgentController              │
│  (API Endpoints)                    │
│  - enrichMarker()                   │
│  - getRecommendations()             │
└──────────┬──────────────────┬───────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────────────┐
│ MarkerEnrichment │  │ TravelRecommendation     │
│ AgentService     │  │ AgentService             │
│                  │  │                          │
│ - enrichMarker   │  │ - getTravelRecommendations│
│   Info()         │  │                          │
│ - buildPrompt()  │  │ - buildRecommendation    │
│ - parseResponse()│  │   Prompt()               │
└──────────────────┘  └──────────────────────────┘
           │                  │
           └────────┬─────────┘
                    ▼
        ┌───────────────────────┐
        │ Mistral AI API        │
        │ api.mistral.ai        │
        │ /v1/agents/completions│
        └───────────────────────┘
```

## Testing

### Manual Testing

#### Test Marker Enrichment:
```bash
php artisan tinker
>>> $service = app(\App\Services\MarkerEnrichmentAgentService::class);
>>> $result = $service->enrichMarkerInfo('Eiffelturm', 48.8584, 2.2945);
>>> dd($result);
```

Expected output:
```php
[
  "success" => true,
  "data" => [
    "type" => "sightseeing",
    "is_unesco" => false,
    "notes" => "Der Eiffelturm ist ein ikonisches Eisenfachwerkgerüst...",
    "url" => "https://www.toureiffel.paris/de"
  ]
]
```

#### Test Travel Recommendations:
```bash
php artisan tinker
>>> $service = app(\App\Services\TravelRecommendationAgentService::class);
>>> $result = $service->getTravelRecommendations('trip', [
...   'trip_name' => 'Paris Trip',
...   'markers' => [['name' => 'Eiffelturm', 'latitude' => 48.8584, 'longitude' => 2.2945]]
... ]);
>>> dd($result);
```

### Automated Testing

Run the test suite:
```bash
# Run all Le Chat Agent tests
php artisan test --filter=LeChatAgent

# Run specific test file
php artisan test tests/Feature/LeChatAgentEnrichmentTest.php
php artisan test tests/Feature/LeChatAgentRecommendationsTest.php
php artisan test tests/Feature/LeChatAgentServiceTest.php
```

Expected output: **30 tests passing**

### Frontend Testing

1. Start the application: `composer run dev` or `php artisan serve` + `npm run dev`
2. Log in and navigate to the map
3. Create or edit a marker
4. **Marker Enrichment**:
   - Enter location name (e.g., "Eiffelturm")
   - Click "Enrich with AI" button
   - Verify fields populate within 2-5 seconds
5. **Travel Recommendations**:
   - Create markers on a trip
   - Click recommendations button (if implemented)
   - Verify recommendations appear

## Error Handling & Troubleshooting

### Common Issues

#### 1. Agent Returns Invalid JSON

**Problem**: Response contains markdown code blocks or extra text.

**Solution**:
- Review and update the agent's system prompt
- The service automatically extracts JSON from markdown blocks
- Check logs: `tail -f storage/logs/laravel.log`

#### 2. API Key Errors (401 Unauthorized)

**Problem**: API key rejected or invalid.

**Solution**:
```bash
# Verify .env configuration
cat .env | grep LECHAT

# Clear config cache
php artisan config:clear

# Check for extra spaces/quotes in .env
```

#### 3. Agent ID Not Found (404)

**Problem**: Agent ID incorrect or agent deleted.

**Solution**:
- Verify Agent ID format: `ag:xxxxxxxx:xxxxxxxx`
- Check agent exists in Mistral AI Le Chat
- Ensure agent is deployed and active

#### 4. Timeout Errors

**Problem**: Request takes longer than 30 seconds.

**Solution**:
- Check Mistral AI service status
- Simplify prompts if too complex
- Consider increasing timeout in service class

#### 5. Rate Limit Errors (429)

**Problem**: Too many requests to Mistral AI API.

**Solution**:
- Wait before making additional requests
- Implement frontend throttling
- Upgrade Mistral AI plan if needed
- Monitor usage in Mistral AI Platform

### Error Logging

All errors are logged to Laravel logs with context:

```bash
# View recent errors
tail -f storage/logs/laravel.log

# Search for specific errors
grep "Marker Enrichment Agent" storage/logs/laravel.log
grep "Travel Recommendation Agent" storage/logs/laravel.log
```

## Cost Considerations

### Token Usage Estimates

**Marker Enrichment**:
- Prompt: ~500 tokens
- Response: ~200 tokens  
- Total: ~700 tokens per request

**Travel Recommendations**:
- Prompt: ~300-600 tokens (depends on number of markers)
- Response: ~300-500 tokens
- Total: ~600-1100 tokens per request

### Cost Optimization Tips

1. **Cache Results**: Store enriched data to avoid re-enriching
2. **Batch Requests**: Enrich multiple markers when possible
3. **Validate Input**: Don't send requests for invalid/empty data
4. **Monitor Usage**: Track API calls in Mistral AI dashboard
5. **Set Limits**: Implement user rate limiting if needed

### Mistral AI Pricing

Check current pricing at: https://mistral.ai/pricing

Free tier includes limited monthly credits. Consider:
- Pay-as-you-go for production
- Monitor monthly spending
- Set up billing alerts

## Security Best Practices

1. **API Key Protection**:
   - Never expose API key in frontend code
   - Use environment variables only
   - Don't commit `.env` to git
   - Rotate keys periodically

2. **Authentication**:
   - All endpoints require authentication
   - Use Laravel's built-in auth middleware
   - Verify user ownership of resources

3. **Input Validation**:
   - Validate all inputs before API calls
   - Sanitize user-provided data
   - Check coordinate ranges
   - Limit request sizes

4. **Rate Limiting**:
   - Implement per-user rate limits
   - Prevent API abuse
   - Use Laravel's rate limiter

5. **Error Messages**:
   - Don't expose API keys in errors
   - Log detailed errors server-side
   - Show generic errors to users

## Related Files & Code

### Backend Files
- `app/Services/MarkerEnrichmentAgentService.php` - Marker enrichment service
- `app/Services/TravelRecommendationAgentService.php` - Recommendations service
- `app/Http/Controllers/Api/LeChatAgentController.php` - API controller
- `app/Providers/AppServiceProvider.php` - Service registration
- `config/services.php` - Configuration
- `routes/web.php` - Route definitions

### Test Files
- `tests/Feature/LeChatAgentEnrichmentTest.php` - Enrichment endpoint tests
- `tests/Feature/LeChatAgentRecommendationsTest.php` - Recommendations endpoint tests
- `tests/Feature/LeChatAgentServiceTest.php` - Service unit tests

### Frontend Files (if implemented)
- `resources/js/components/marker-form.tsx` - Marker form with AI enrichment
- `resources/js/hooks/use-lechat-enrichment.ts` - React hook for enrichment

## Quick Reference

### Environment Variables
```env
LECHAT_API_KEY=                          # Mistral AI API key
LECHAT_MARKER_ENRICHMENT_AGENT_ID=       # Agent for marker enrichment
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=   # Agent for recommendations
```

### Testing Commands
```bash
php artisan test --filter=LeChatAgent    # Run all agent tests
php artisan tinker                        # Manual testing
tail -f storage/logs/laravel.log         # View logs
```

### Useful Links
- [Mistral AI Platform](https://console.mistral.ai/)
- [Le Chat Agents](https://chat.mistral.ai/)
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Mistral AI Pricing](https://mistral.ai/pricing)

## Support

If you encounter issues:

1. **Check logs**: `tail -f storage/logs/laravel.log`
2. **Verify configuration**: `php artisan config:show services.lechat`
3. **Test connectivity**: Use tinker to test services manually
4. **Review documentation**: Mistral AI docs for API details
5. **Check agent status**: Verify agents exist and are active in Le Chat

For additional help, consult:
- Laravel documentation: https://laravel.com/docs
- Mistral AI support: https://docs.mistral.ai/
- Project documentation in `/docs` folder
```

**Important**: Never commit these credentials to version control!

## Testing the Integration

### Manual Testing

1. Start the application: `composer run dev` or `php artisan serve`
2. Log in and navigate to the map
3. Create or edit a marker
4. Enter a location name (e.g., "Eiffel Tower")
5. Click the "Enrich with AI" button
6. Wait for the agent to process (usually 2-5 seconds)
7. Verify that the fields are populated:
   - Type should be set (e.g., "Sightseeing")
   - UNESCO checkbox should be checked/unchecked appropriately
   - Notes should contain interesting information
   - URL should be populated if available

### Expected Response Format

The agent should return JSON like this:

```json
{
  "type": "sightseeing",
  "is_unesco": false,
  "notes": "Der Eiffelturm ist ein ikonisches Eisenfachwerkgerüst auf dem Champ de Mars in Paris. Er wurde 1889 für die Weltausstellung erbaut, ist 330 Meter hoch und war bis 1930 das höchste von Menschen geschaffene Bauwerk der Welt. Jährlich empfängt er etwa 7 Millionen Besucher.",
  "url": "https://www.toureiffel.paris/de"
}
```

## Error Handling

The integration includes comprehensive error handling:

- **Validation Errors**: If required fields are missing, a 422 error is returned
- **API Errors**: Connection issues or API failures are logged and displayed to the user
- **Parsing Errors**: If the agent returns invalid JSON, an error message is shown
- **Timeout**: Requests timeout after 30 seconds

All errors are:
- Logged to Laravel logs (`storage/logs/laravel.log`)
- Displayed to the user in the UI
- Captured for debugging purposes

## Troubleshooting

### Agent returns invalid JSON

**Problem**: The agent response contains markdown code blocks or additional text.

**Solution**: 
1. Review the agent's system prompt
2. Emphasize "Return ONLY the JSON object" in the prompt
3. The service includes automatic extraction of JSON from markdown code blocks

### Fields not populating

**Problem**: The "Enrich with AI" button completes but fields don't update.

**Solution**:
1. Check browser console for JavaScript errors
2. Verify the API response in Network tab
3. Check Laravel logs for backend errors: `tail -f storage/logs/laravel.log`

### API Key errors

**Problem**: 401 Unauthorized or API key rejected.

**Solution**:
1. Verify `LECHAT_API_KEY` in `.env` is correct
2. Ensure the API key is active in Mistral AI Platform
3. Check for extra spaces or quotes in `.env` file
4. Run `php artisan config:clear` to refresh configuration

### Agent ID not found

**Problem**: 404 error or agent not found.

**Solution**:
1. Verify `LECHAT_AGENT_ID` format is correct (should start with `ag:`)
2. Ensure the agent exists in your Mistral AI account
3. Check that the agent is deployed and active

## API Rate Limits

Mistral AI has rate limits on API requests. Monitor your usage:
- Free tier: Limited requests per month
- Paid tier: Higher limits based on plan

If you encounter rate limit errors:
1. Wait before making additional requests
2. Consider upgrading your Mistral AI plan
3. Implement request throttling on the frontend if needed

## Security Considerations

1. **API Key Protection**: Never expose the API key in frontend code
2. **Authentication**: The endpoint requires authentication (`auth` middleware)
3. **Validation**: All inputs are validated before being sent to the API
4. **Rate Limiting**: Consider adding rate limiting to prevent abuse
5. **Error Messages**: Avoid exposing sensitive information in error messages

## Cost Considerations

Each marker enrichment request costs API credits:
- Request size: ~500 tokens (prompt + location data)
- Response size: ~200 tokens (structured JSON response)
- Approximate cost: ~700 tokens per enrichment

Monitor usage in Mistral AI Platform to track costs.

## Future Enhancements

Potential improvements to consider:

1. **Caching**: Cache enriched data to avoid re-enriching the same locations
2. **Batch Processing**: Enrich multiple markers at once
3. **Offline Mode**: Store common enrichments locally
4. **User Feedback**: Allow users to rate enrichment quality
5. **Custom Prompts**: Let users customize what information they want
6. **Multi-language**: Support enrichment in different languages

## Technical Architecture

```
Frontend (marker-form.tsx)
    ↓ POST /markers/enrich
Backend (LeChatAgentController)
    ↓ enrichMarkerInfo()
Service (LeChatAgentService)
    ↓ POST to Mistral AI API
Le Chat Agent
    ↓ JSON Response
Service parses and validates
    ↓
Controller returns enriched data
    ↓
Frontend updates form fields
```

## Related Files

- **Service**: `app/Services/LeChatAgentService.php`
- **Controller**: `app/Http/Controllers/Api/LeChatAgentController.php`
- **Frontend**: `resources/js/components/marker-form.tsx`
- **Routes**: `routes/web.php` (marker.enrich route)
- **Config**: `config/services.php` (lechat section)
- **Provider**: `app/Providers/AppServiceProvider.php`

## Support

If you encounter issues:
1. Check Laravel logs: `tail -f storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Verify API credentials in `.env`
4. Review Mistral AI documentation: https://docs.mistral.ai/
5. Check the agent's conversation history in Le Chat for debugging
