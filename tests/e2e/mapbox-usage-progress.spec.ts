import { expect, test } from '@playwright/test';
import { login } from './helpers/auth';
import { setupMapboxMock } from './helpers/mapbox-mock';

test.describe('Mapbox Usage Progress Bar', () => {
    test.beforeEach(async ({ page }) => {
        // Setup Mapbox mock before navigation
        await setupMapboxMock(page);

        // Login first
        await login(page);

        // Navigate to map page
        await page.goto('/');
    });

    test('should display the Mapbox usage progress bar', async ({ page }) => {
        // Wait for the map to load
        await page.waitForSelector('#map', { timeout: 10000 });

        // Check that the progress bar is visible
        const progressBar = page.getByTestId('mapbox-usage-progress-bar');
        await expect(progressBar).toBeVisible({ timeout: 10000 });

        // Check that usage stats are displayed
        const usageStats = page.getByTestId('mapbox-usage-stats');
        await expect(usageStats).toBeVisible();

        // Check that the progress element exists
        const progress = page.getByTestId('mapbox-usage-progress');
        await expect(progress).toBeVisible();
    });

    test('should show usage statistics', async ({ page }) => {
        // Wait for the map to load
        await page.waitForSelector('#map', { timeout: 10000 });

        // Get the usage stats text
        const usageStats = page.getByTestId('mapbox-usage-stats');
        await expect(usageStats).toBeVisible({ timeout: 10000 });

        const statsText = await usageStats.textContent();

        // Verify format is "X / Y" (e.g., "0 / 10,000")
        expect(statsText).toMatch(/\d+(?:,\d+)?\s*\/\s*\d+(?:,\d+)?/);
    });
});
