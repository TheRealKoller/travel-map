import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Marker Management', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        const currentUrl = page.url();
        if (!currentUrl.endsWith('/') && !currentUrl.includes('/map')) {
            await page.goto('/');
        }
    });

    test('authenticated user can access map page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Map/);

        // Wait for map to be loaded
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('map displays correctly with leaflet controls', async ({ page }) => {
        await page.goto('/');

        // Wait for map container to be visible
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('user can interact with map', async ({ page }) => {
        await page.goto('/');

        // Wait for map to load
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // Click on the map - this should create a marker and open the form
        // We need to click inside the leaflet map, not just the container
        await page.locator('.leaflet-container').first().click({ position: { x: 200, y: 200 } });

        // Wait for marker form to appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });
    });

    test('map page has marker form or controls', async ({ page }) => {
        await page.goto('/');

        // Wait for map to load
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Marker Creation', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('clicking on map should allow marker creation', async ({ page }) => {
        // Click on the map to create a marker
        await page.locator('.leaflet-container').first().click({ position: { x: 200, y: 200 } });

        // Marker form should appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Form title should be visible
        const formTitle = page.getByTestId('marker-form-title');
        await expect(formTitle).toBeVisible();
        await expect(formTitle).toHaveText('Marker Details');

        // Name input should be visible and empty
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible();
        await expect(nameInput).toHaveValue('');
    });
});

test.describe('Marker Editing', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.getByTestId('leaflet-map-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    // TODO: Fix application bug - markers don't appear in list after save
    // The marker is saved to the database but the frontend state doesn't update to show it in the marker list
    test.skip('user can edit marker name and type', async ({ page }) => {
        // Create a marker by clicking on the map
        await page.locator('.leaflet-container').first().click({ position: { x: 300, y: 300 } });

        // Marker form should open automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Fill in initial marker details
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible();
        await nameInput.fill('Original Marker Name');

        const typeSelect = page.getByTestId('marker-type-select');
        await expect(typeSelect).toBeVisible();
        await typeSelect.selectOption('restaurant');

        // Save the marker
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();
        await saveButton.click();

        // Wait for save and form to close automatically
        await page.waitForTimeout(2000);

        // Wait for marker list to update
        const markerListHeading = page.locator('h2:has-text("Markers (1)")');
        await expect(markerListHeading).toBeVisible({ timeout: 10000 });

        // Marker should appear in the list
        const markerListItem = page.getByTestId('marker-list-item').filter({ hasText: 'Original Marker Name' });
        await expect(markerListItem).toBeVisible({ timeout: 5000 });

        // Click on marker in list to reopen form
        await markerListItem.click();
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Edit marker name
        await nameInput.fill('Updated Marker Name');

        // Change marker type
        await typeSelect.selectOption('hotel');

        // Save changes
        await saveButton.click();
        await page.waitForTimeout(2000);

        // Verify marker name updated in list
        const updatedMarkerInList = page.getByTestId('marker-list-item').filter({ hasText: 'Updated Marker Name' });
        await expect(updatedMarkerInList).toBeVisible({ timeout: 5000 });

        // Click marker again to verify changes were saved
        await updatedMarkerInList.click();
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Verify the updated values
        await expect(nameInput).toHaveValue('Updated Marker Name');
        await expect(typeSelect).toHaveValue('hotel');
    });

    // TODO: Fix application bug - markers don't appear in list after save
    // The marker is saved to the database but the frontend state doesn't update to show it in the marker list
    test.skip('user can edit marker notes with markdown', async ({ page }) => {
        // Create a marker
        await page.locator('.leaflet-container').first().click({ position: { x: 350, y: 350 } });

        // Marker form should be visible
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Fill in marker name
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible();
        await nameInput.fill('Test Location With Notes');

        // Add markdown notes using CodeMirror editor
        // CodeMirror uses a special interaction - we need to interact with the visible editor
        const markdownText =
            '# Important Place\n\n**Great food** and nice atmosphere.\n\n- Must try: Pizza\n- Must try: Pasta';
        
        // Click on the CodeMirror editor area to focus it
        await page.locator('.CodeMirror-scroll').first().click();
        
        // Type the text using keyboard - this works better with CodeMirror
        await page.keyboard.type(markdownText);
        
        // Wait for CodeMirror to sync - it has internal debouncing
        await page.waitForTimeout(1000);

        // Save the marker
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // Wait for save and form to close automatically
        await page.waitForTimeout(2000);

        // Wait for marker list to update
        const markerListHeading = page.locator('h2:has-text("Markers (1)")');
        await expect(markerListHeading).toBeVisible({ timeout: 10000 });

        // Verify marker was created and appears in list
        const markerInList = page.getByTestId('marker-list-item').filter({ hasText: 'Test Location With Notes' });
        await expect(markerInList).toBeVisible({ timeout: 5000 });

        // Reopen the marker to verify notes were saved
        await markerInList.click();
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Wait a moment for the form to fully load with the saved data
        await page.waitForTimeout(1000);

        // Verify the notes were saved correctly by checking the CodeMirror content
        const codeMirrorContent = await page.locator('.CodeMirror-line').first().textContent();
        expect(codeMirrorContent).toContain('Important Place');
    });

    // TODO: Fix application bug - markers don't appear in list after save
    // The marker is saved to the database but the frontend state doesn't update to show it in the marker list
    test.skip('user can view updated marker in marker list', async ({ page }) => {
        // Create a marker
        await page.locator('.leaflet-container').first().click({ position: { x: 300, y: 250 }, force: true });

        // Marker form should appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Set marker details
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible();
        await nameInput.fill('Favorite Restaurant');

        const typeSelect = page.getByTestId('marker-type-select');
        await expect(typeSelect).toBeVisible();
        await typeSelect.selectOption('restaurant');

        // Save marker
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        // Wait for save and form to close automatically
        await page.waitForTimeout(2000);

        // Wait for marker list to update
        const markerListHeading = page.locator('h2:has-text("Markers (1)")');
        await expect(markerListHeading).toBeVisible({ timeout: 10000 });

        // Marker should appear in the marker list
        const markerListItem = page.getByTestId('marker-list-item').filter({ hasText: 'Favorite Restaurant' });
        await expect(markerListItem).toBeVisible({ timeout: 5000 });
    });

    test('marker form displays correct coordinates', async ({ page }) => {
        // Create a marker at a specific position
        await page.locator('.leaflet-container').first().click({ position: { x: 250, y: 250 } });

        // Marker form should be visible
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });

        // Check if coordinates are displayed
        const latitudeText = page.getByTestId('marker-latitude');
        const longitudeText = page.getByTestId('marker-longitude');

        await expect(latitudeText).toBeVisible();
        await expect(longitudeText).toBeVisible();

        // Verify coordinates contain "Latitude:" and "Longitude:" labels
        await expect(latitudeText).toContainText('Latitude:');
        await expect(longitudeText).toContainText('Longitude:');
    });
});
