# Mapbox Request Limiting

This feature limits the number of Mapbox API requests per month to avoid exceeding free tier limits.

## Overview

The Travel Map application uses Mapbox APIs for:
- **Place Search**: Finding points of interest near a location
- **Route Calculation**: Calculating routes between markers

Since Mapbox offers a limited number of free requests per month, we've implemented a request tracking and limiting system to prevent exceeding the quota.

## Configuration

The monthly request limit is configurable via environment variable:

```env
MAPBOX_MONTHLY_REQUEST_LIMIT=10000
```

Default value: **10,000 requests per month**

## How It Works

### Request Tracking

1. Every Mapbox API call is counted and stored in the `mapbox_requests` table
2. Requests are tracked by month (e.g., "2026-01" for January 2026)
3. The counter is automatically reset each month

### Request Limiting

1. Before making any Mapbox API request, the system checks if the monthly quota has been exceeded
2. If the quota is exceeded, the request is blocked and an error is returned to the user
3. The error message informs the user that the monthly quota has been exceeded

### Database Schema

```sql
CREATE TABLE mapbox_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    period VARCHAR(7) UNIQUE,  -- Format: YYYY-MM
    count BIGINT DEFAULT 0,
    last_request_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## API Responses

### Place Search (Search Nearby)

When quota is exceeded, the search endpoint returns:

```json
{
  "count": 0,
  "results": [],
  "error": "Mapbox API monthly quota exceeded (10000/10000 requests). Please try again next month."
}
```

HTTP Status: `200 OK` (with error in response body)

### Route Calculation

When quota is exceeded, the route creation endpoint returns:

```json
{
  "error": "Mapbox API monthly quota exceeded (10000/10000 requests). Please try again next month."
}
```

HTTP Status: `429 Too Many Requests`

## Frontend Handling

The frontend already handles these errors gracefully:

- **Search errors**: Displayed in the map options menu
- **Route creation errors**: Displayed in the route panel

No additional frontend changes are required.

## Usage Statistics

You can query the current usage statistics:

```php
use App\Services\MapboxRequestLimiter;

$limiter = new MapboxRequestLimiter();
$stats = $limiter->getUsageStats();

// Returns:
// [
//     'period' => '2026-01',
//     'count' => 5432,
//     'limit' => 10000,
//     'remaining' => 4568
// ]
```

## Implementation Details

### Services

1. **MapboxRequestLimiter** (`app/Services/MapboxRequestLimiter.php`)
   - Tracks and enforces request limits
   - Provides usage statistics
   - Throws `MapboxQuotaExceededException` when limit is exceeded

2. **MapboxPlacesService** (`app/Services/MapboxPlacesService.php`)
   - Integrated with request limiter
   - Checks quota before searching
   - Increments counter after each successful API call

3. **RoutingService** (`app/Services/RoutingService.php`)
   - Integrated with request limiter
   - Checks quota before calculating routes
   - Increments counter after each successful API call

### Exception

**MapboxQuotaExceededException** (`app/Exceptions/MapboxQuotaExceededException.php`)
- Thrown when monthly quota is exceeded
- Caught by controllers and returned as appropriate error responses

## Testing

Comprehensive tests are available in `tests/Feature/MapboxRequestLimiterTest.php`:

- Request counting
- Quota enforcement
- Integration with search and routing endpoints
- Error handling

Run tests:
```bash
./vendor/bin/pest tests/Feature/MapboxRequestLimiterTest.php
```

## Monitoring

To monitor Mapbox API usage:

1. Check the `mapbox_requests` table directly:
   ```sql
   SELECT * FROM mapbox_requests ORDER BY period DESC LIMIT 12;
   ```

2. Use the `MapboxRequestLimiter::getUsageStats()` method in your application

3. Set up alerts when approaching the limit (e.g., at 80% usage)

## Notes

- Each category search counts as one request (place search may make multiple category requests)
- Each route calculation counts as one request
- The counter is automatically reset each month
- Failed API calls are NOT counted
- The limit applies globally across all users
