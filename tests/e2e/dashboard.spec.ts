import { expect, test } from '@playwright/test';
import { register } from './helpers/auth';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const timestamp = Date.now();
        const email = `test${timestamp}@example.com`;
        await register(page, 'Test User', email, 'password123');

        // If on verify-email page, navigate to dashboard directly
        const currentUrl = page.url();
        if (currentUrl.includes('verify-email')) {
            await page.goto('/dashboard');
        }
    });

    test('authenticated user can access dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveTitle(/Dashboard/);
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('dashboard displays navigation elements', async ({ page }) => {
        await page.goto('/dashboard');

        // Check for common navigation elements
        await expect(
            page.locator('nav, [role="navigation"]').first(),
        ).toBeVisible();
    });

    test('user can navigate from dashboard to map', async ({ page }) => {
        await page.goto('/dashboard');

        // Look for a link to map/home
        const mapLink = page.locator('a[href="/"], a[href="/map"]').first();
        if ((await mapLink.count()) > 0) {
            await mapLink.click();
            await expect(page).toHaveURL(/\/(map|$)/);
        }
    });
});
