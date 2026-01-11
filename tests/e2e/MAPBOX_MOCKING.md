# Mapbox Mocking for E2E Tests

This document explains how Mapbox API calls are mocked in E2E tests to avoid requiring a valid Mapbox access token in CI/CD pipelines.

## Overview

The E2E tests use Playwright's route interception to mock all Mapbox API requests. This allows tests to run without:
- A valid Mapbox access token
- Network requests to external Mapbox services
- Rate limiting or API quota concerns

## Implementation

### Helper File: `tests/e2e/helpers/mapbox-mock.ts`

This file provides two main functions:

1. **`setupMapboxMock(page: Page)`** - Sets up mocking for a test page
   - Injects a fake Mapbox token into the page context
   - Calls `mockMapboxRequests()` to intercept API calls

2. **`mockMapboxRequests(page: Page)`** - Intercepts and mocks Mapbox API routes
   - **Tile requests**: Returns empty 1x1 transparent PNG images
   - **Style requests**: Returns minimal valid Mapbox style JSON
   - **Geocoding requests**: Returns empty feature collections
   - **Font requests**: Returns empty font buffers
   - **Sprite requests**: Returns empty sprite images/JSON
   - **Analytics/Events**: Returns 204 No Content responses

### Integration

The mocking is automatically applied in tests through:

1. **`register()` helper** in `tests/e2e/helpers/auth.ts`
   - Calls `setupMapboxMock()` before navigating to any page
   - All tests using `register()` get automatic mocking

2. **`beforeEach` hooks** in test files that don't use `register()`
   - Auth tests: `tests/e2e/auth.spec.ts`
   - Smoke tests: `tests/e2e/smoke.spec.ts`

### Environment Configuration

A dummy token is set in `.env.e2e`:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.test.mock-token-for-e2e-tests
```

This token is never used for actual API calls - all requests are intercepted and mocked.

## Mocked API Endpoints

| Endpoint Pattern | Mock Response |
|------------------|---------------|
| `api.mapbox.com/v4/**` | Empty 1x1 PNG tile |
| `api.mapbox.com/styles/v1/**` | Minimal style JSON with background layer |
| `api.mapbox.com/geocoding/v5/**` | Empty GeoJSON feature collection |
| `api.mapbox.com/fonts/v1/**` | Empty protocol buffer |
| `api.mapbox.com/sprites/**` | Empty sprite image/JSON |
| `events.mapbox.com/**` | 204 No Content |

## Benefits

✅ **No API Keys Required**: Tests run in CI/CD without Mapbox secrets
✅ **Fast Execution**: No network latency from external API calls
✅ **Reliable**: No dependency on external service availability
✅ **No Rate Limits**: Unlimited test runs without quota concerns
✅ **Offline Testing**: Tests work without internet connection

## Limitations

⚠️ **Visual Testing**: Map tiles will not display real map data
⚠️ **Geocoding**: Search functionality returns empty results
⚠️ **Routing**: Any routing features would need separate mocking

These limitations are acceptable for E2E tests that focus on:
- User authentication flows
- UI interactions
- Form validation
- Navigation between pages
- Basic map component rendering

## Usage in New Tests

For new tests that interact with map pages:

```typescript
import { setupMapboxMock } from './helpers/mapbox-mock';

test.describe('My Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Setup Mapbox mocking
        await setupMapboxMock(page);
        
        // Rest of your test setup...
    });
    
    test('should work with mocked Mapbox', async ({ page }) => {
        await page.goto('/map');
        // Test will run with all Mapbox calls mocked
    });
});
```

Or use the `register()` helper which includes automatic mocking:

```typescript
import { register, generateUniqueEmail } from './helpers/auth';

test('my test', async ({ page }) => {
    const email = generateUniqueEmail();
    await register(page, 'Test User', email, 'password123');
    // Mapbox is already mocked!
    await page.goto('/');
});
```

## Testing in CI/CD

The GitHub Actions workflow can now run E2E tests without requiring a `MAPBOX_ACCESS_TOKEN` secret:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    APP_ENV: testing
    # No MAPBOX_ACCESS_TOKEN needed!
```

## Debugging

If you need to see what Mapbox requests are being made:

```typescript
page.on('request', request => {
    if (request.url().includes('mapbox')) {
        console.log('Mapbox request:', request.url());
    }
});
```

## Future Enhancements

Possible improvements to the mocking system:

- Mock specific geocoding results for search tests
- Mock route/direction calculations
- Return realistic-looking map tiles for visual regression tests
- Add configurable mock responses per test
