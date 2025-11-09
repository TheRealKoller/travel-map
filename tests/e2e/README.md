# E2E Tests

This directory contains end-to-end (E2E) tests for the Travel Map application using [Playwright](https://playwright.dev/).

## Setup

### Prerequisites

- Node.js 18 or higher
- PHP 8.2 or higher
- All project dependencies installed (`composer install` and `npm ci`)

### Install Playwright Browsers

Before running the tests for the first time, install the required browsers:

```bash
npx playwright install chromium
```

For CI environments or if you need system dependencies:

```bash
npx playwright install --with-deps chromium
```

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see the browser)

```bash
npm run test:e2e:headed
```

### Run tests in debug mode

```bash
npm run test:e2e:debug
```

### Run specific test file

```bash
npx playwright test tests/e2e/auth.spec.ts
```

### Run tests matching a pattern

```bash
npx playwright test --grep "login"
```

## Test Structure

- `smoke.spec.ts` - Basic smoke tests to verify the application loads correctly
- `auth.spec.ts` - Authentication flow tests (login, register, logout)
- `dashboard.spec.ts` - Dashboard access and navigation tests
- `markers.spec.ts` - Marker management and map interaction tests
- `helpers/` - Shared helper functions for tests

## Writing Tests

### Example Test

```typescript
import { expect, test } from '@playwright/test';

test('example test', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Travel Map/);
});
```

### Using Auth Helpers

```typescript
import { login, register } from './helpers/auth';

test('authenticated test', async ({ page }) => {
    await register(page, 'Test User', 'test@example.com', 'password');
    // Now the user is logged in
    await page.goto('/dashboard');
});
```

## Configuration

E2E test configuration is in `playwright.config.ts` at the project root.

Key configuration options:

- **Base URL**: `http://localhost:8000` (configurable via `APP_URL` env variable)
- **Browser**: Chromium (default)
- **Retries**: 2 retries in CI, 0 locally
- **Workers**: 1 in CI, unlimited locally
- **Screenshots**: Taken on failure
- **Traces**: Captured on first retry

## CI/CD

E2E tests run automatically in GitHub Actions on push and pull requests to `develop` and `main` branches.

The workflow:

1. Sets up PHP and Node.js
2. Installs dependencies
3. Builds frontend assets
4. Runs database migrations
5. Runs unit/feature tests
6. Installs Playwright browsers
7. Runs E2E tests
8. Uploads test reports as artifacts

## Troubleshooting

### Tests fail with "Target page, context or browser has been closed"

This usually means the server crashed or the page navigation failed. Check:

- Server logs
- Browser console logs
- Screenshot in `test-results/` directory

### Tests timeout

- Increase timeout in test with `test.setTimeout(60000)`
- Check if server is starting correctly
- Verify database migrations ran successfully

### Authentication tests fail

- Ensure the database is properly migrated
- Check that the `.env` file has correct settings
- Verify email verification is not blocking the flow

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use descriptive test names** - Make it clear what the test is verifying
3. **Clean up after tests** - Use `beforeEach` and `afterEach` hooks
4. **Use test helpers** - DRY principle applies to tests too
5. **Test user workflows** - Focus on end-to-end user journeys, not individual functions
6. **Avoid brittle selectors** - Use semantic HTML, ARIA labels, and data-testid attributes
7. **Mock external services** - Don't depend on external APIs in tests

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
