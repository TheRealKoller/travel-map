import { test, expect } from '@playwright/test';
import { setupMapboxMock } from './helpers/mapbox-mock';

/**
 * Debug helper test - runs first to verify basic setup
 * This test helps identify environment issues in CI/CD
 */
test.describe('Environment Debug', () => {
    test('verify server is responding', async ({ page }) => {
        await setupMapboxMock(page);
        
        const response = await page.goto('/');
        
        // Log response details
        console.log('Response status:', response?.status());
        console.log('Response URL:', response?.url());
        console.log('Response headers:', response?.headers());
        
        expect(response?.status()).toBeLessThan(500);
        
        // Check if page loaded
        const title = await page.title();
        console.log('Page title:', title);
        expect(title).toBeTruthy();
        
        // Check for critical resources
        const html = await page.content();
        console.log('HTML length:', html.length);
        expect(html.length).toBeGreaterThan(100);
    });

    test('verify assets are loading', async ({ page }) => {
        await setupMapboxMock(page);
        
        const failedRequests: string[] = [];
        
        page.on('requestfailed', (request) => {
            failedRequests.push(`${request.method()} ${request.url()}`);
        });
        
        await page.goto('/');
        
        // Wait a bit for all resources to load
        await page.waitForTimeout(2000);
        
        console.log('Failed requests:', failedRequests);
        
        // Some requests might fail (like analytics), but critical ones shouldn't
        const criticalFailures = failedRequests.filter(
            (req) =>
                req.includes('.js') || 
                req.includes('.css') || 
                req.includes('/api/')
        );
        
        expect(criticalFailures).toEqual([]);
    });

    test('verify environment variables', async ({ page }) => {
        await setupMapboxMock(page);
        
        await page.goto('/');
        
        // Check if Vite env vars are accessible
        const envCheck = await page.evaluate(() => {
            return {
                // @ts-ignore
                hasVite: typeof import.meta !== 'undefined',
                userAgent: navigator.userAgent,
                windowSize: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                },
            };
        });
        
        console.log('Environment check:', envCheck);
        expect(envCheck.hasVite).toBe(true);
    });
});
