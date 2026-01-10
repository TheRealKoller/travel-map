# Request Logger for E2E Tests

Automatic request logging for all E2E tests to help debug issues in CI/CD pipelines.

## Features

✅ **Automatic Request Tracking** - All HTTP requests are logged automatically
✅ **Failed Request Detection** - Failed requests are highlighted in reports
✅ **Console Error Capture** - JavaScript errors and warnings are captured
✅ **Smart Attachment** - Logs are attached only when tests fail or have errors
✅ **Human-Readable Summary** - Beautiful summary in test reports
✅ **JSON Export** - Detailed logs available as JSON for analysis

## Usage

### Basic Usage

Import `test` and `expect` from the fixture instead of `@playwright/test`:

```typescript
// Before
import { expect, test } from '@playwright/test';

// After
import { expect, test } from './fixtures/request-logger';
```

That's it! Your tests now automatically log all requests.

### Advanced Usage - Manual Log Control

If you want to control when logs are attached:

```typescript
import { expect, test } from './fixtures/request-logger';

test('my test with custom logging', async ({ page, requestLogger }) => {
    await page.goto('/');
    
    // Do your test actions...
    
    // Manually attach logs at any point
    await requestLogger.attachLogs();
    
    // Or access raw data
    console.log(`Total requests: ${requestLogger.requests.length}`);
    console.log(`Failed requests: ${requestLogger.failedRequests.length}`);
});
```

### Accessing Request Data

The `requestLogger` fixture provides:

```typescript
{
    requests: RequestLog[];           // All requests
    failedRequests: FailedRequest[];  // Failed requests only
    consoleMessages: string[];        // Console logs/errors/warnings
    attachLogs: () => Promise<void>;  // Manually attach logs
}
```

## What Gets Logged

### Request Information
- HTTP Method (GET, POST, etc.)
- URL
- Status Code
- Status Text
- Resource Type (document, script, image, etc.)
- Timestamp

### Failure Information
- Failed requests with error messages
- HTTP errors (4xx, 5xx)
- Console errors and warnings
- Page errors (JavaScript exceptions)

## Report Output

### When Logs Are Attached

Logs are **automatically** attached when:
- ❌ Test fails
- ❌ Any request fails
- ❌ Console errors are detected

Logs are **not** attached when:
- ✅ Test passes with no errors

### Report Attachments

Each test with logs gets two attachments:

1. **request-summary.txt** - Human-readable summary:
   ```
   ═══════════════════════════════════════════════════════════
   📊 REQUEST LOG SUMMARY
   ═══════════════════════════════════════════════════════════
   Test: authenticated user can access map page
   
   📈 Statistics:
     • Total Requests: 127
     • Successful (2xx/3xx): 125
     • Failed Requests: 2
     • Console Errors: 1
     • Console Warnings: 3
   
   📊 Requests by Status:
     • 2xx: 120
     • 3xx: 5
     • 4xx: 2
   
   ❌ FAILED REQUESTS:
     • GET https://api.example.com/data
       → net::ERR_CONNECTION_REFUSED
   
   🔴 CONSOLE ERRORS:
     [ERROR] Uncaught TypeError: Cannot read property 'foo'
   ```

2. **request-logs.json** - Detailed JSON data:
   ```json
   {
     "summary": {
       "testName": "authenticated user can access map page",
       "totalRequests": 127,
       "failedRequests": 2,
       "successfulRequests": 125,
       "consoleErrors": 1,
       "consoleWarnings": 3
     },
     "requestsByStatus": {
       "2xx": 120,
       "3xx": 5,
       "4xx": 2
     },
     "failedRequests": [...],
     "errorMessages": [...],
     "warningMessages": [...],
     "allRequests": [...]
   }
   ```

## Examples

### Example 1: Simple Test

```typescript
import { expect, test } from './fixtures/request-logger';
import { register, generateUniqueEmail } from './helpers/auth';

test('user can login', async ({ page }) => {
    const email = generateUniqueEmail();
    await register(page, 'Test User', email, 'password');
    
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Logs automatically attached if test fails or has errors
});
```

### Example 2: Debug Specific Issues

```typescript
import { expect, test } from './fixtures/request-logger';

test('debug api failures', async ({ page, requestLogger }) => {
    await page.goto('/');
    
    // Trigger API calls
    await page.click('[data-testid="load-data"]');
    
    // Wait for requests to complete
    await page.waitForTimeout(2000);
    
    // Check for failed requests
    if (requestLogger.failedRequests.length > 0) {
        console.log('Failed requests detected:');
        requestLogger.failedRequests.forEach(req => {
            console.log(`  ${req.method} ${req.url} - ${req.failure}`);
        });
    }
    
    // Manually attach logs even on success
    await requestLogger.attachLogs();
});
```

### Example 3: Assert No Failed Requests

```typescript
import { expect, test } from './fixtures/request-logger';

test('all api calls should succeed', async ({ page, requestLogger }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Assert no requests failed
    expect(requestLogger.failedRequests).toHaveLength(0);
    
    // Assert no HTTP errors
    const httpErrors = requestLogger.requests.filter(
        r => r.status && r.status >= 400
    );
    expect(httpErrors).toHaveLength(0);
    
    // Assert no console errors
    const consoleErrors = requestLogger.consoleMessages.filter(
        m => m.startsWith('[ERROR]')
    );
    expect(consoleErrors).toHaveLength(0);
});
```

## Viewing Reports

### Locally

```bash
npm run test:e2e
npx playwright show-report
```

Click on any failed test → See "Attachments" section

### In CI/CD

Reports are uploaded as artifacts. Download and open `index.html`.

## Tips

### Reduce Noise

If you have too many requests, filter by domain:

```typescript
const apiRequests = requestLogger.requests.filter(
    r => r.url.includes('localhost:8000')
);
console.log(`API requests: ${apiRequests.length}`);
```

### Debug Specific Resources

```typescript
const failedScripts = requestLogger.failedRequests.filter(
    r => r.resourceType === 'script'
);
```

### Check Response Times

```typescript
// Note: Timing requires additional implementation
// Current version doesn't track timing, but can be extended
```

## Troubleshooting

### Logs Not Appearing

Logs only appear when:
- Test fails
- Requests fail
- Console errors occur

For successful tests with no errors, logs are not attached to keep reports clean.

### Too Much Data

If reports are too large, consider:
- Filtering requests by domain
- Only logging failed requests
- Increasing the error threshold

### Performance Impact

Request logging has minimal performance impact:
- ~5-10ms overhead per test
- Logs stored in memory until test completes
- Asynchronous attachment doesn't block test execution

## Future Enhancements

Potential additions:
- [ ] Request/response timing data
- [ ] Response body capture for failed requests
- [ ] Request/response header logging
- [ ] Custom filtering options
- [ ] Automatic screenshot on API errors
- [ ] Performance metrics (TTFB, etc.)
