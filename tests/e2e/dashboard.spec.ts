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

        // Check for dashboard content
        await expect(
            page.getByTestId('dashboard-content'),
        ).toBeVisible();
    });

    test('user can navigate from dashboard to map', async ({ page }) => {
        await page.goto('/dashboard');

        // The map link is in the sidebar, so we need to open it first
        // Click the sidebar trigger button
        const sidebarTrigger = page.getByTestId('sidebar-trigger');
        await expect(sidebarTrigger).toBeVisible();
        await sidebarTrigger.click();
        
        // Wait for sidebar to expand
        await page.waitForTimeout(800);

        // Click the Map link in the sidebar
        const mapLink = page.getByTestId('nav-map-link');
        await expect(mapLink).toBeVisible({ timeout: 5000 });
        await mapLink.click();
        
        // Wait for navigation to complete (should not be on dashboard anymore)
        await page.waitForURL((url) => !url.pathname.includes('/dashboard'), { timeout: 5000 });
    });
});
