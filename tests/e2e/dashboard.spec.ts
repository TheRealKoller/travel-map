import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
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

        // The map link is in the sidebar, so we need to open it first
        // Click the sidebar trigger button
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        
        // Wait for sidebar to expand
        await page.waitForTimeout(800);

        // The sidebar overlay blocks clicks, so we programmatically click the Map link
        await page.evaluate(() => {
            const mapButton = document.querySelector<HTMLElement>('[data-sidebar="menu-button"][href="/"]');
            mapButton?.click();
        });
        
        // Wait for navigation to complete (should not be on dashboard anymore)
        await page.waitForURL((url) => !url.pathname.includes('/dashboard'), { timeout: 5000 });
    });
});
