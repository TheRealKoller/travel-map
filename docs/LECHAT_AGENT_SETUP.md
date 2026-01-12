# Le Chat Agent Setup Guide

This document describes how to set up and configure the Le Chat AI Agent for automatic marker enrichment in the Travel Map application.

## Overview

The Le Chat Agent integration allows users to automatically enrich marker information by clicking a button in the marker form. The agent analyzes the location name and coordinates, then provides:

- **Marker Type**: Automatically determines the most appropriate category (restaurant, museum, UNESCO site, etc.)
- **UNESCO Status**: Identifies if the location is a UNESCO World Heritage Site
- **Additional Notes**: Provides 2-3 sentences with interesting facts and historical context
- **URL**: Suggests an official website or relevant link (Wikipedia, tourism site, etc.)

## Agent Creation

### Step 1: Create Agent in Le Chat

1. Go to [Mistral AI Le Chat](https://chat.mistral.ai/)
2. Navigate to the "Agents" section
3. Create a new agent with the following configuration:

### Agent Configuration

**Agent Name**: Travel Map Location Enricher

**Agent Description**: 
```
Analyzes travel locations and provides enriched information including marker type, UNESCO status, interesting facts, and relevant URLs.
```

**System Prompt**:
```
You are a travel location information expert. Your task is to analyze location names and coordinates, then provide structured information about these places.

For each location, you must provide:
1. The most appropriate marker type from this list:
   - restaurant
   - point_of_interest
   - hotel
   - museum
   - ruin
   - temple_church
   - sightseeing
   - natural_attraction
   - city
   - village
   - region
   - question
   - tip
   - festival_party
   - leisure

2. Whether the location is a UNESCO World Heritage Site (true/false)

3. 2-3 sentences of interesting information about the location (historical context, significance, visitor tips, etc.)

4. An official website URL or relevant link (prefer official tourism sites or Wikipedia)

CRITICAL: You MUST respond ONLY with valid JSON in exactly this format:
{
  "type": "marker_type_here",
  "is_unesco": true_or_false,
  "notes": "Interesting information about the location...",
  "url": "https://example.com"
}

Rules:
- Return ONLY the JSON object, no additional text before or after
- If any field cannot be determined with confidence, use null
- For notes, write 2-3 complete sentences with useful information
- For URLs, prefer official websites over Wikipedia when available
- Do not wrap the JSON in markdown code blocks
- Ensure all JSON is valid and properly escaped
```

**Model**: Choose the latest Mistral model (e.g., Mistral Large 2)

**Temperature**: 0.3 (for more consistent, factual responses)

### Step 2: Get Agent ID

After creating the agent:
1. Copy the Agent ID from the agent's settings page
2. The Agent ID format looks like: `ag:xxxxxxxx:xxxxxxxx`

### Step 3: Get API Key

1. Go to [Mistral AI Platform](https://console.mistral.ai/)
2. Navigate to "API Keys" section
3. Create a new API key or use an existing one
4. Copy the API key (starts with `mistral-`)

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Le Chat Agent Configuration
LECHAT_API_KEY=your_mistral_api_key_here
LECHAT_AGENT_ID=ag:xxxxxxxx:xxxxxxxx
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
  "notes": "The Eiffel Tower is an iconic iron lattice tower located on the Champ de Mars in Paris. Built in 1889 for the World's Fair, it stands 330 meters tall and was the world's tallest man-made structure until 1930. It receives approximately 7 million visitors annually.",
  "url": "https://www.toureiffel.paris/en"
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
