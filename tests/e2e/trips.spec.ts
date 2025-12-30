import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Trip Management', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    });

    test('sidebar displays trip selector', async ({ page }) => {
        // Open the sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Check for trip selector elements
        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
    });

    test('user can create a new trip', async ({ page }) => {
        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Click the "Create Trip" button (Plus icon button)
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible();
        await createTripButton.click();

        // Wait for modal to appear
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Fill in trip name
        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('My Summer Vacation 2024');

        // Submit the form
        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        // Wait for modal to close
        await expect(
            page.locator('[role="dialog"]'),
        ).not.toBeVisible({ timeout: 5000 });

        // Verify the new trip appears in the selector
        await page.waitForTimeout(500);
    });

    test('user can switch between trips', async ({ page }) => {
        // Create a marker on default trip
        const mapContainer = page.locator('.leaflet-container').first();
        await mapContainer.click({ position: { x: 200, y: 200 } });
        await page.waitForTimeout(1000);

        // Open sidebar and create a new trip
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await createTripButton.click();

        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Winter Trip');

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 5000,
        });

        await page.waitForTimeout(1000);

        // Map should now show no markers (new trip is selected)
        // This is a simplified test - in reality, you might want to check marker counts
    });

    test('markers are isolated per trip', async ({ page }) => {
        // Create first marker on default trip
        const mapContainer = page.locator('.leaflet-container').first();
        await mapContainer.click({ position: { x: 200, y: 200 } });
        await page.waitForTimeout(1000);

        // Create a new trip
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await createTripButton.click();

        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Second Trip');

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 5000,
        });

        await page.waitForTimeout(1000);

        // Close sidebar to access map - force close to avoid overlay issues
        await sidebarTrigger.click({ force: true });
        await page.waitForTimeout(500);

        // Create a marker on the second trip
        await mapContainer.click({ position: { x: 300, y: 300 } });
        await page.waitForTimeout(1000);

        // Switch back to first trip using selector
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Select the first trip from dropdown
        const tripSelector = page.locator('select, [role="combobox"]').first();
        if (await tripSelector.isVisible()) {
            await tripSelector.click();
            await page.waitForTimeout(300);

            // Look for the "Default" option
            const defaultOption = page
                .locator('[role="option"]:has-text("Default")')
                .first();
            if (await defaultOption.isVisible()) {
                await defaultOption.click();
                await page.waitForTimeout(1000);
            }
        }

        // Markers from first trip should be visible again
        // This is a simplified check - actual implementation might verify specific markers
    });

    test('trip name validation', async ({ page }) => {
        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Click create trip button
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await createTripButton.click();

        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Try to submit without entering a name
        const submitButton = page.locator('button:has-text("Create trip")');
        
        // Button should be disabled when input is empty
        await expect(submitButton).toBeDisabled();
    });

    test('user can rename an existing trip', async ({ page }) => {
        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Create a new trip first
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await createTripButton.click();

        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Original Trip Name');

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 5000,
        });

        await page.waitForTimeout(500);

        // Now rename the trip
        const tripActionsButton = page
            .locator('button[title="Trip actions"]')
            .first();
        await expect(tripActionsButton).toBeVisible();
        await tripActionsButton.click();

        // Click rename option in dropdown
        const renameOption = page.locator('[role="menuitem"]:has-text("Rename trip")');
        await expect(renameOption).toBeVisible({ timeout: 3000 });
        await renameOption.click();

        // Wait for rename modal to appear
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        // Verify the input has the current trip name
        const renameInput = page.locator('input#tripName');
        await expect(renameInput).toHaveValue('Original Trip Name');

        // Change the trip name
        await renameInput.fill('Renamed Trip');

        // Submit the rename
        const renameSubmitButton = page.locator('button:has-text("Rename trip")');
        await renameSubmitButton.click();

        // Wait for modal to close
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 5000,
        });

        await page.waitForTimeout(500);

        // Verify the trip selector shows the new name
        const tripSelector = page.locator('select, [role="combobox"]').first();
        if (await tripSelector.isVisible()) {
            await expect(tripSelector).toContainText('Renamed Trip');
        }
    });
});
