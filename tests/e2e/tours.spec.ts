import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Tour Management', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        await page.waitForSelector('.mapboxgl-map', { timeout: 10000 });

        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Create a trip first (required for tour creation)
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        // Wait for modal to appear
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Japan Trip');

        // Wait for the trip creation API call
        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitTripButton = page.locator('button:has-text("Create trip")');
        await submitTripButton.click();

        // Wait for trip creation to complete
        await tripCreationPromise;

        // Wait for modal to close
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });
        
        // Close the sidebar to remove any lingering overlays
        await sidebarTrigger.click({ force: true });
        await page.waitForTimeout(1000);
    });

    test('user can create a new tour', async ({ page }) => {
        // Verify trip was created by checking for "All markers" tab
        const allMarkersTab = page.getByTestId('tour-tab-all-markers');
        await expect(allMarkersTab).toBeVisible({ timeout: 5000 });

        // Click the "+" button to create a tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        // Verify the modal opened
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Fill in tour name
        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Tokyo Adventure');

        // Submit the form
        const createButton = page.getByTestId('button-submit-create-tour');
        await expect(createButton).toBeVisible();
        await createButton.click();

        // Wait for dialog to close
        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Verify the tour tab appears with the tour name
        const tourTab = page.getByTestId('tour-tab').filter({ hasText: 'Tokyo Adventure' });
        await expect(tourTab).toBeVisible({ timeout: 10000 });
    });

    test('tour name must be unique', async ({ page }) => {
        // Create first tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Kyoto Tour');

        const createButton = page.getByTestId('button-submit-create-tour');
        await createButton.click();

        // Wait for dialog to close
        let dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Verify first tour was created
        const firstTourTab = page.getByTestId('tour-tab').filter({ hasText: 'Kyoto Tour' });
        await expect(firstTourTab).toBeVisible({ timeout: 10000 });

        // Try to create another tour with the same name
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Kyoto Tour');

        await createButton.click();

        // Verify error message appears
        const errorMessage = page.locator('text=A tour with this name already exists');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        // Dialog should still be open because of validation error
        dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
    });

    test('user can delete a tour', async ({ page }) => {
        // Create a tour first
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Osaka Trip');

        const createButton = page.getByTestId('button-submit-create-tour');
        await createButton.click();

        // Wait for dialog to close
        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Verify the tour was created
        const tourTab = page.getByTestId('tour-tab').filter({ hasText: 'Osaka Trip' });
        await expect(tourTab).toBeVisible({ timeout: 10000 });

        // Click on the tour to select it
        await tourTab.click();

        // Click the trash icon button to delete the tour
        const deleteTourButton = page.locator('button[title="Delete tour"]');
        await expect(deleteTourButton).toBeVisible({ timeout: 5000 });
        await deleteTourButton.click();

        // Confirm deletion in the dialog
        const confirmDialog = page.getByRole('dialog');
        await expect(confirmDialog).toBeVisible({ timeout: 5000 });
        
        const confirmButton = page.locator('button:has-text("Delete tour")');
        await expect(confirmButton).toBeVisible({ timeout: 5000 });
        await confirmButton.click();

        // Wait for confirmation dialog to close
        await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });

        // Verify the tour tab is no longer visible
        await expect(tourTab).not.toBeVisible({ timeout: 10000 });
    });

    test('creating a tour without a name shows validation error', async ({ page }) => {
        // Click the "+" button to create a tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        // Leave tour name empty
        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });

        // Try to submit with empty name
        const createButton = page.getByTestId('button-submit-create-tour');
        await expect(createButton).toBeVisible();
        await createButton.click();

        // Verify error message appears
        const errorMessage = page.locator('text=required').or(
            page.locator('text=Tour name is required')
        );
        await expect(errorMessage).toBeVisible({ timeout: 5000 });

        // Dialog should still be open because of validation error
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
    });
});
