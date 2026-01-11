import { expect, test } from './fixtures/request-logger';
import { generateUniqueEmail, register } from './helpers/auth';
import { setupMapboxMock } from './helpers/mapbox-mock';

test.describe('Debug: Request Logging', () => {
    test('log all requests and responses after authentication', async ({
        page,
        requestLogger,
    }) => {
        // Setup Mapbox mock before any navigation
        await setupMapboxMock(page);
        
        // Request logger fixture automatically tracks all requests, responses, 
        // console messages, and errors. No need to set up manual listeners.

        // Register and login
        const email = generateUniqueEmail();
        console.log('\n=== Starting Registration ===');
        await register(page, 'Debug User', email, 'password123');
        console.log('=== Registration Complete ===\n');

        // Navigate to map page
        console.log('\n=== Navigating to Map Page ===');
        await page.goto('/');

        // Wait for page to settle
        await page.waitForTimeout(3000);

        // Take screenshot
        const screenshot = await page.screenshot({
            fullPage: true,
        });
        await test.info().attach('screenshot-after-auth', {
            body: screenshot,
            contentType: 'image/png',
        });

        // Check page content
        const pageContent = await page.content();
        console.log(
            `\n=== Page HTML Length: ${pageContent.length} characters ===`,
        );

        // Check if page has any visible text
        const bodyText = await page
            .locator('body')
            .textContent()
            .catch(() => '');
        console.log(`\n=== Body Text Length: ${bodyText?.length || 0} ===`);
        console.log(
            `Body Text Sample: ${bodyText?.substring(0, 200) || '[empty]'}`,
        );

        // Check for specific elements
        const mapContainer = page.locator('.mapboxgl-map');
        const mapExists = await mapContainer.count();
        console.log(`\n=== Map Container Found: ${mapExists > 0} ===`);

        const sidebar = page.locator('[data-sidebar="trigger"]');
        const sidebarExists = await sidebar.count();
        console.log(`=== Sidebar Trigger Found: ${sidebarExists > 0} ===`);

        // Print summary from request logger
        console.log('\n=== Request Summary ===');
        console.log(`Total Requests: ${requestLogger.requests.length}`);
        console.log(`Failed Requests: ${requestLogger.failedRequests.length}`);
        console.log(`Console Messages: ${requestLogger.consoleMessages.length}`);

        // Print failed requests if any
        if (requestLogger.failedRequests.length > 0) {
            console.log('\n=== Failed Requests ===');
            requestLogger.failedRequests.forEach((req) => {
                console.log(`${req.method} ${req.url} - ${req.failure}`);
            });
        }

        // Print error console messages
        const errors = requestLogger.consoleMessages.filter((msg) =>
            msg.startsWith('[ERROR]'),
        );
        if (errors.length > 0) {
            console.log('\n=== Console Errors ===');
            errors.forEach((err) => console.log(err));
        }

        // Manually attach logs (they will be attached automatically on failure, 
        // but we want them even on success for debugging)
        await requestLogger.attachLogs();

        // Assert that we don't have a completely blank page
        expect(pageContent.length).toBeGreaterThan(1000);
    });
});
