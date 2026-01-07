import { expect, test } from '@playwright/test';

test.describe('Marker Management', () => {
    test.beforeEach(async ({ page }) => {
        // User is already authenticated via global setup
        // Just navigate to the map page
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Wait for map to be ready
        await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
        
        // Delete all existing markers to ensure clean state for each test
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 5000 });
        
        // Check if there are any markers
        const markerItems = page.locator('[data-testid="marker-list-item"]');
        const count = await markerItems.count();
        
        // Delete all markers one by one
        for (let i = 0; i < count; i++) {
            // Always click the first marker since the list updates after each deletion
            const firstMarker = page.locator('[data-testid="marker-list-item"]').first();
            await firstMarker.click();
            
            // Wait for form to open
            const markerForm = page.getByTestId('marker-form');
            await expect(markerForm).toBeVisible({ timeout: 5000 });
            
            // Click delete button
            const deleteButton = page.getByTestId('marker-delete-button');
            await expect(deleteButton).toBeVisible({ timeout: 5000 });
            
            // Set up dialog handler to accept confirmation
            page.once('dialog', async (dialog) => {
                await dialog.accept();
            });
            
            await deleteButton.click();
            
            // Wait for deletion to complete
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            await expect(markerList).toBeVisible({ timeout: 10000 });
            await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        }
    });

    test('should display empty marker list initially', async ({ page }) => {
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 5000 });
        
        // Should show "Markers (0)" and empty state message
        await expect(markerList).toContainText('Markers (0)');
        await expect(markerList).toContainText('Click on the map to add markers');
    });

    test('should create a new marker when clicking on the map', async ({ page }) => {
        // Click on the map to create a marker
        const map = page.locator('.leaflet-container');
        await expect(map).toBeVisible({ timeout: 5000 });
        
        // Click somewhere in the middle of the map
        await map.click({ position: { x: 300, y: 300 } });
        
        // Wait a moment for marker creation
        await page.waitForTimeout(500);
        
        // Marker form should appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Form should have empty name field initially
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await expect(nameInput).toHaveValue('');
        
        // Default type should be selected
        const typeSelect = page.getByTestId('marker-type-select');
        await expect(typeSelect).toBeVisible({ timeout: 5000 });
        
        // Coordinates should be displayed
        await expect(page.getByTestId('marker-latitude')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('marker-longitude')).toBeVisible({ timeout: 5000 });
    });

    test('should save a new marker with name and type', async ({ page }) => {
        // Click on the map to create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Fill in marker details
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Test Restaurant');
        
        const typeSelect = page.getByTestId('marker-type-select');
        await expect(typeSelect).toBeVisible({ timeout: 5000 });
        await typeSelect.selectOption('restaurant');
        
        // Save the marker
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await expect(saveButton).not.toBeDisabled();
        
        await saveButton.click();
        
        // Wait for network to settle and React to update
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Marker list should reappear - wait for it first
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        await expect(markerList).toContainText('Markers (1)');
        
        // Should see the marker in the list with the name we entered
        await expect(markerList).toContainText('Test Restaurant');
        
        // Form should have closed automatically after save
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
    });

    test('should not save marker without a name', async ({ page }) => {
        // Click on the map to create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Try to save without entering a name
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        // Save button should be disabled when name is empty
        await expect(saveButton).toBeDisabled();
    });

    test('should close marker form without saving when clicking close button', async ({ page }) => {
        // Click on the map to create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Wait for form to appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Click close button
        const closeButton = page.getByTestId('marker-form-close-button');
        await expect(closeButton).toBeVisible({ timeout: 5000 });
        await closeButton.click();
        
        // Form should close and marker list should appear
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 5000 });
        
        // No markers should be saved
        await expect(markerList).toContainText('Markers (0)');
    });

    test('should edit an existing marker', async ({ page }) => {
        // Create and save a marker first
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Original Name');
        
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for marker list to appear
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        // Click on the marker in the list to edit it
        const markerListItem = page.locator('[data-testid="marker-list-item"]').first();
        await expect(markerListItem).toBeVisible({ timeout: 5000 });
        await markerListItem.click();
        
        // Form should open again
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Change the name
        await nameInput.fill('Updated Name');
        
        // Save the changes
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Marker list should reappear
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        await expect(markerList).toContainText('Updated Name');
        await expect(markerList).not.toContainText('Original Name');
    });

    test('should delete an existing marker', async ({ page }) => {
        // Create and save a marker first
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Marker to Delete');
        
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for marker list to appear
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        // Click on the marker to edit it
        const markerListItem = page.locator('[data-testid="marker-list-item"]').first();
        await expect(markerListItem).toBeVisible({ timeout: 5000 });
        await markerListItem.click();
        
        // Form should open
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Delete button should be visible (only for saved markers)
        const deleteButton = page.getByTestId('marker-delete-button');
        await expect(deleteButton).toBeVisible({ timeout: 5000 });
        
        // Set up dialog handler before clicking delete
        page.on('dialog', async (dialog) => {
            expect(dialog.type()).toBe('confirm');
            expect(dialog.message()).toContain('Are you sure you want to delete');
            await dialog.accept();
        });
        
        // Click delete
        await deleteButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Marker list should reappear and be empty
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        await expect(markerList).toContainText('Markers (0)');
    });

    test('should set UNESCO flag on a marker', async ({ page }) => {
        // Create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Fill in details
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('UNESCO Site');
        
        // Check UNESCO checkbox
        const unescoCheckbox = page.locator('input[type="checkbox"]').first();
        await expect(unescoCheckbox).toBeVisible({ timeout: 5000 });
        await unescoCheckbox.check();
        
        // Save
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // The marker should be saved with UNESCO flag
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        await expect(markerList).toContainText('UNESCO Site');
    });

    test('should add URL to a marker and open it', async ({ page }) => {
        // Create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Fill in details
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Place with URL');
        
        // Add URL
        const urlInput = page.locator('input#marker-url');
        await expect(urlInput).toBeVisible({ timeout: 5000 });
        await urlInput.fill('https://example.com');
        
        // Save
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for marker list to appear
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        // Click on marker to reopen
        const markerListItem = page.locator('[data-testid="marker-list-item"]').first();
        await expect(markerListItem).toBeVisible({ timeout: 5000 });
        await markerListItem.click();
        
        // Form should open
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // URL should be displayed
        await expect(urlInput).toHaveValue('https://example.com');
        
        // Open URL button should be enabled
        const openUrlButton = page.locator('button[aria-label="Open URL in new tab"]');
        await expect(openUrlButton).toBeVisible({ timeout: 5000 });
        await expect(openUrlButton).not.toBeDisabled();
    });

    test('should change marker type', async ({ page }) => {
        // Create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Museum');
        
        // Change type to Museum
        const typeSelect = page.getByTestId('marker-type-select');
        await expect(typeSelect).toBeVisible({ timeout: 5000 });
        await typeSelect.selectOption('museum');
        
        // Save
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Verify marker is saved
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        await expect(markerList).toContainText('Museum');
    });

    test('should display multiple markers in the list', async ({ page }) => {
        const map = page.locator('.leaflet-container');
        const markerForm = page.getByTestId('marker-form');
        
        // Helper function to create a marker
        const createMarker = async (x: number, y: number, name: string) => {
            await map.click({ position: { x, y } });
            
            const nameInput = page.getByTestId('marker-name-input');
            await expect(nameInput).toBeVisible({ timeout: 5000 });
            await nameInput.fill(name);
            
            const saveButton = page.getByTestId('marker-save-button');
            await expect(saveButton).toBeVisible({ timeout: 5000 });
            
            await saveButton.click();
            
            // Wait for network to settle
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // Wait for marker list to appear
            const markerList = page.getByTestId('marker-list');
            await expect(markerList).toBeVisible({ timeout: 15000 });
            
            // Form should close
            await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        };
        
        // Create three markers
        await createMarker(250, 250, 'Marker 1');
        await createMarker(350, 350, 'Marker 2');
        await createMarker(300, 400, 'Marker 3');
        
        // Marker list should show 3 markers
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 5000 });
        await expect(markerList).toContainText('Markers (3)');
        
        // All markers should be visible in the list
        await expect(markerList).toContainText('Marker 1');
        await expect(markerList).toContainText('Marker 2');
        await expect(markerList).toContainText('Marker 3');
    });

    test('should select marker from the list and show its form', async ({ page }) => {
        const map = page.locator('.leaflet-container');
        const markerForm = page.getByTestId('marker-form');
        
        // Helper function to create a marker
        const createMarker = async (x: number, y: number, name: string) => {
            await map.click({ position: { x, y } });
            
            const nameInput = page.getByTestId('marker-name-input');
            await expect(nameInput).toBeVisible({ timeout: 5000 });
            await nameInput.fill(name);
            
            const saveButton = page.getByTestId('marker-save-button');
            await expect(saveButton).toBeVisible({ timeout: 5000 });
            
            await saveButton.click();
            
            // Wait for network to settle
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            
            // Wait for marker list to appear
            const markerList = page.getByTestId('marker-list');
            await expect(markerList).toBeVisible({ timeout: 15000 });
            
            // Form should close
            await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        };
        
        // Create two markers
        await createMarker(250, 250, 'First Marker');
        await createMarker(350, 350, 'Second Marker');
        
        // Marker list should show 2 markers
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 5000 });
        await expect(markerList).toContainText('Markers (2)');
        
        // Click on first marker in list
        const firstMarkerItem = page.locator('[data-testid="marker-list-item"]').first();
        await expect(firstMarkerItem).toBeVisible({ timeout: 5000 });
        await firstMarkerItem.click();
        
        // Form should open with first marker's data
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toHaveValue('First Marker');
    });

    test('should add notes to a marker', async ({ page }) => {
        // Create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        const nameInput = page.getByTestId('marker-name-input');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        await nameInput.fill('Marker with Notes');
        
        // Add notes using the SimpleMDE editor
        const notesEditor = page.locator('.CodeMirror textarea');
        await expect(notesEditor).toBeVisible({ timeout: 5000 });
        await notesEditor.fill('These are some test notes for this marker.');
        
        // Save
        const saveButton = page.getByTestId('marker-save-button');
        await expect(saveButton).toBeVisible({ timeout: 5000 });
        
        await saveButton.click();
        
        // Wait for network to settle
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        
        // Wait for marker list to appear
        const markerList = page.getByTestId('marker-list');
        await expect(markerList).toBeVisible({ timeout: 15000 });
        
        // Form should have closed automatically
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).not.toBeVisible({ timeout: 5000 });
        
        // Reopen marker to verify notes were saved
        const markerListItem = page.locator('[data-testid="marker-list-item"]').first();
        await expect(markerListItem).toBeVisible({ timeout: 5000 });
        await markerListItem.click();
        
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Notes should still be there
        const notesText = await page.locator('.CodeMirror').textContent();
        expect(notesText).toContain('These are some test notes for this marker.');
    });

    test('should display marker coordinates in the form', async ({ page }) => {
        // Click on the map to create a marker
        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 300 } });
        
        // Wait for form to appear
        const markerForm = page.getByTestId('marker-form');
        await expect(markerForm).toBeVisible({ timeout: 5000 });
        
        // Latitude and longitude should be displayed
        const latitude = page.getByTestId('marker-latitude');
        const longitude = page.getByTestId('marker-longitude');
        
        await expect(latitude).toBeVisible({ timeout: 5000 });
        await expect(longitude).toBeVisible({ timeout: 5000 });
        
        // They should contain numeric values
        const latText = await latitude.textContent();
        const lngText = await longitude.textContent();
        
        expect(latText).toMatch(/Latitude:\s*[-\d.]+/);
        expect(lngText).toMatch(/Longitude:\s*[-\d.]+/);
    });
});
