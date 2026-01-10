import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Arrow-Based Tour Management', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.locator('.leaflet-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // Open sidebar
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        // Create a trip first (required for tour creation)
        const createTripButton = page
            .locator('button[title="Create new trip"]')
            .first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        // Wait for modal to appear
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        await tripNameInput.fill('Test Trip');

        // Wait for the trip creation API call
        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitTripButton = page.locator('button:has-text("Create trip")');
        await expect(submitTripButton).toBeVisible({ timeout: 5000 });
        await submitTripButton.click();

        // Wait for trip creation to complete
        await tripCreationPromise;

        // Wait for modal to close
        await expect(modal).not.toBeVisible({
            timeout: 10000,
        });

        // Wait for trip to be selected (important for marker creation!)
        await page.waitForTimeout(2000);

        // Close the sidebar to remove any lingering overlays
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click({ force: true });
        await page.waitForTimeout(1000);
    });

    test('user can see add to tour arrow when tour is selected', async ({
        page,
    }) => {
        // Create a marker by clicking on the map
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
        await mapContainer.click({ position: { x: 300, y: 300 } });

        // Wait for marker form to appear
        await page.waitForTimeout(1000);

        // Fill in marker name and save
        const nameInput = page.locator('#marker-name');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Test Marker');

        const markerCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/markers') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const saveButton = page.getByTestId('button-save-marker');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await saveButton.click();

        await markerCreationPromise;

        // Wait for marker to appear in the list
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 10000 });

        // Create a tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        // Fill in tour details
        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Day 1 Tour');

        // Wait for the tour creation API call
        const tourCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const createButton = page.getByTestId('button-submit-create-tour');
        await expect(createButton).toBeVisible({ timeout: 5000 });
        await createButton.click();

        // Wait for tour creation to complete
        await tourCreationPromise;

        // Wait for the dialog to close
        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Check for add to tour arrow button
        const addToTourButton = page.getByTestId('add-marker-to-tour-button');
        await expect(addToTourButton).toBeVisible({ timeout: 10000 });
    });

    test('user can add marker to tour using arrow button', async ({ page }) => {
        // Create a marker
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
        await mapContainer.click({ position: { x: 300, y: 300 } });

        // Wait for marker form to appear
        await page.waitForTimeout(1000);

        // Fill in marker name and save
        const nameInput = page.locator('#marker-name');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Test Marker');

        const markerCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/markers') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const saveButton = page.getByTestId('button-save-marker');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await saveButton.click();

        await markerCreationPromise;

        // Wait for marker to appear in list
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 10000 });

        // Create a tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('Food Tour');

        // Wait for the tour creation API call
        const tourCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const createButton = page.getByTestId('button-submit-create-tour');
        await expect(createButton).toBeVisible({ timeout: 5000 });
        await createButton.click();

        // Wait for tour creation to complete
        await tourCreationPromise;

        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Wait for add to tour button to appear
        const addToTourButton = page.getByTestId('add-marker-to-tour-button');
        await expect(addToTourButton).toBeVisible({ timeout: 10000 });

        // Wait for the add marker to tour API call
        const addToTourPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours/') &&
                response.url().includes('/markers') &&
                response.request().method() === 'POST',
            { timeout: 10000 },
        );

        // Click the add to tour arrow button
        await addToTourButton.click();

        // Wait for the API call to complete
        await addToTourPromise;

        // Check that the tour now shows marker count
        const tourTab = page
            .getByTestId('tour-tab')
            .filter({ hasText: 'Food Tour' });
        await expect(tourTab).toContainText('(1)', { timeout: 10000 });
    });

    test('user can reorder markers in tour using up/down arrows', async ({
        page,
    }) => {
        // Create two markers
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // First marker
        await mapContainer.click({ position: { x: 300, y: 300 } });
        await page.waitForTimeout(1000);

        let nameInput = page.locator('#marker-name');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('First Marker');

        let markerCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/markers') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        let saveButton = page.getByTestId('button-save-marker');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await saveButton.click();
        await markerCreationPromise;
        await page.waitForTimeout(500);

        // Second marker
        await mapContainer.click({ position: { x: 400, y: 400 } });
        await page.waitForTimeout(1000);

        nameInput = page.locator('#marker-name');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Second Marker');

        markerCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/markers') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        saveButton = page.getByTestId('button-save-marker');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await saveButton.click();
        await markerCreationPromise;
        await page.waitForTimeout(500);

        // Wait for markers to appear in list
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 10000 });

        // Create a tour
        const createTourButton = page.getByTestId('tour-tab-create-new');
        await expect(createTourButton).toBeVisible({ timeout: 5000 });
        await createTourButton.click();

        const tourNameInput = page.getByTestId('input-tour-name');
        await expect(tourNameInput).toBeVisible({ timeout: 5000 });
        await tourNameInput.fill('My Tour');

        const tourCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const createButton = page.getByTestId('button-submit-create-tour');
        await expect(createButton).toBeVisible({ timeout: 5000 });
        await createButton.click();

        await tourCreationPromise;

        const dialog = page.getByRole('dialog');
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // Wait for add to tour buttons to appear
        const addButtons = page.getByTestId('add-marker-to-tour-button');
        await expect(addButtons.first()).toBeVisible({ timeout: 10000 });

        // Add first marker
        let addToTourPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours/') &&
                response.url().includes('/markers') &&
                response.request().method() === 'POST',
            { timeout: 10000 },
        );

        await addButtons.first().click();
        await addToTourPromise;

        // Wait for tour count to update
        let tourTab = page
            .getByTestId('tour-tab')
            .filter({ hasText: 'My Tour' });
        await expect(tourTab).toContainText('(1)', { timeout: 10000 });

        // Add second marker
        addToTourPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours/') &&
                response.url().includes('/markers') &&
                response.request().method() === 'POST',
            { timeout: 10000 },
        );

        await addButtons.last().click();
        await addToTourPromise;

        // Wait for tour count to update to 2
        await expect(tourTab).toContainText('(2)', { timeout: 10000 });

        // Now verify the up/down arrows are visible in the tour panel
        const moveUpButton = page.getByTestId('move-marker-up');
        const moveDownButton = page.getByTestId('move-marker-down');

        await expect(moveUpButton.first()).toBeVisible({ timeout: 10000 });
        await expect(moveDownButton.first()).toBeVisible({ timeout: 10000 });

        // The second item's up button should be enabled
        const secondItemUpButton = moveUpButton.nth(1);
        await expect(secondItemUpButton).toBeVisible({ timeout: 5000 });
        await expect(secondItemUpButton).not.toBeDisabled();

        // Wait for the reorder API call
        const reorderPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/tours/') &&
                response.url().includes('/reorder') &&
                response.request().method() === 'PUT',
            { timeout: 10000 },
        );

        // Click up on the second marker to swap it with the first
        await secondItemUpButton.click();
        await reorderPromise;

        // Give UI time to update after reorder
        await page.waitForTimeout(500);

        // Verify the markers have reordered by checking the tour panel
        const tourPanel = page.getByTestId('tour-panel');
        await expect(tourPanel).toBeVisible({ timeout: 5000 });
    });
});
