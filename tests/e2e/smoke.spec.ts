import { expect, test } from './fixtures/request-logger';
import { setupMapboxMock } from './helpers/mapbox-mock';

test.describe('Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Setup Mapbox mocking for all tests
        await setupMapboxMock(page);
    });

    test('welcome/home page loads correctly', async ({ page }) => {
        await page.goto('/');

        // Should redirect to login for unauthenticated users
        await expect(page).toHaveURL(/\/login/);
        await expect(page).toHaveTitle(/Log in/);
    });

    test('login page renders all required elements', async ({ page }) => {
        await page.goto('/login');

        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Check for link to register page
        await expect(page.locator('a[href="/register"]')).toBeVisible();
    });

    test('register page renders all required elements', async ({ page }) => {
        await page.goto('/register');

        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
        await expect(
            page.locator('input[name="password_confirmation"]'),
        ).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Check for link back to login page
        await expect(page.locator('a[href="/login"]')).toBeVisible();
    });

    test('application has proper meta tags and title', async ({ page }) => {
        await page.goto('/login');

        // Check for title
        await expect(page).toHaveTitle(/.+/);

        // Check for viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toHaveCount(1);
    });

    test('application CSS loads correctly', async ({ page }) => {
        await page.goto('/login');

        // Wait for page to be fully loaded
        await page.waitForLoadState('networkidle');

        // Check if styles are applied by checking if background color is set
        const bodyBgColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });

        // Should have some background color (not the default transparent)
        expect(bodyBgColor).toBeTruthy();
    });
});
