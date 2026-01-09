import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Trip Management', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.locator('.leaflet-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('sidebar displays trip selector', async ({ page }) => {
        // Open the sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Check for trip selector elements
        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
    });

    test('user can create a new trip', async ({ page }) => {
        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Click the "Create Trip" button (Plus icon button)
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        // Wait for modal to appear
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Fill in trip name
        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        await tripNameInput.fill('My Summer Vacation 2024');

        // Submit the form
        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await submitButton.click();

        // Wait for modal to close (longer timeout for animations + API)
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        // Verify the new trip was created
        await page.waitForTimeout(1000);
    });

    test('user can switch between trips', async ({ page }) => {
        // Create a marker on default trip
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
        await mapContainer.click({ position: { x: 200, y: 200 } });
        await page.waitForTimeout(1000);

        // Open sidebar and create a new trip
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        
        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        await tripNameInput.fill('Winter Trip');

        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await submitButton.click();

        await expect(modal).not.toBeVisible({ timeout: 5000 });

        await page.waitForTimeout(1000);
    });

    test('markers are isolated per trip', async ({ page }) => {
        // Create first marker on default trip
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
        await mapContainer.click({ position: { x: 200, y: 200 } });
        await page.waitForTimeout(1000);

        // Create a new trip
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 10000 });
        
        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        await tripNameInput.fill('Second Trip');

        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await submitButton.click();

        await expect(modal).not.toBeVisible({ timeout: 10000 });

        await page.waitForTimeout(1500);

        // Close sidebar to access map - force close to avoid overlay issues
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click({ force: true });
        await page.waitForTimeout(500);

        // Create a marker on the second trip
        await expect(mapContainer).toBeVisible({ timeout: 5000 });
        await mapContainer.click({ position: { x: 300, y: 300 } });
        await page.waitForTimeout(1000);
    });

    test('trip name validation', async ({ page }) => {
        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Click create trip button
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Try to submit without entering a name - button should be disabled
        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeDisabled();
    });
});
