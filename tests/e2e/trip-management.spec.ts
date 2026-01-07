import { generateUniqueEmail, register } from './helpers/auth';
import { expect, test } from './fixtures';

test.describe('Trip Management - Display & Navigation', () => {
    test.beforeEach(async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    });

    test('sidebar displays trip selector after login', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 5000 });
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
    });

    test('trip selector shows "No trips yet" when user has no trips', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        await expect(tripSelector).toContainText('No trips yet');
    });

    test('create trip button is visible in sidebar', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Trip Management - Create Trip', () => {
    test.beforeEach(async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    });

    test('user can create a new trip successfully', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await expect(createTripButton).toBeVisible({ timeout: 5000 });
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        await tripNameInput.fill('European Adventure 2026');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        await tripCreationPromise;

        await expect(modal).not.toBeVisible({ timeout: 10000 });

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toContainText('European Adventure 2026', { timeout: 10000 });
    });

    test('trip name is required when creating a trip', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await expect(tripNameInput).toBeVisible({ timeout: 5000 });
        
        // Try to submit without entering a name
        const submitButton = page.locator('button:has-text("Create trip")');
        await expect(submitButton).toBeVisible();
        
        // Button should be disabled when name is empty
        const isDisabled = await submitButton.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('user can cancel trip creation', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const cancelButton = page.locator('button:has-text("Cancel")');
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    test('trip creation modal can be closed with X button', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const closeButton = modal.locator('button[aria-label*="Close"], button:has-text("×")').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
            await expect(modal).not.toBeVisible({ timeout: 5000 });
        }
    });

    test('multiple trips can be created', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripNames = ['Trip One', 'Trip Two', 'Trip Three'];

        for (const tripName of tripNames) {
            const createTripButton = page.locator('button[title="Create new trip"]').first();
            await createTripButton.click();

            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible({ timeout: 5000 });

            const tripNameInput = page.locator('input#tripName');
            await tripNameInput.fill(tripName);

            const tripCreationPromise = page.waitForResponse(
                (response) =>
                    response.url().includes('/trips') &&
                    response.request().method() === 'POST' &&
                    response.status() === 201,
                { timeout: 10000 },
            );

            const submitButton = page.locator('button:has-text("Create trip")');
            await submitButton.click();

            await tripCreationPromise;
            await expect(modal).not.toBeVisible({ timeout: 10000 });
        }

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        
        // Check that all trips exist by opening the dropdown
        await tripSelector.click();
        await page.waitForTimeout(300);
        
        for (const tripName of tripNames) {
            const option = page.locator('[role="option"], option').filter({ hasText: tripName });
            await expect(option).toBeVisible({ timeout: 5000 });
        }
    });
});

test.describe('Trip Management - Switch Between Trips', () => {
    test.beforeEach(async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripNames = ['Asia Trip', 'Europe Trip'];
        for (const tripName of tripNames) {
            const createTripButton = page.locator('button[title="Create new trip"]').first();
            await createTripButton.click();

            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible({ timeout: 5000 });

            const tripNameInput = page.locator('input#tripName');
            await tripNameInput.fill(tripName);

            const tripCreationPromise = page.waitForResponse(
                (response) =>
                    response.url().includes('/trips') &&
                    response.request().method() === 'POST' &&
                    response.status() === 201,
                { timeout: 10000 },
            );

            const submitButton = page.locator('button:has-text("Create trip")');
            await submitButton.click();

            await tripCreationPromise;
            await expect(modal).not.toBeVisible({ timeout: 10000 });
        }
    });

    test('user can switch between trips using the selector', async ({ page }) => {
        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });

        await tripSelector.click();
        await page.waitForTimeout(300);

        const europeOption = page.locator('[role="option"], option').filter({ hasText: 'Europe Trip' }).first();
        await expect(europeOption).toBeVisible({ timeout: 5000 });
        await europeOption.click();

        await page.waitForTimeout(500);

        await tripSelector.click();
        await page.waitForTimeout(300);

        const asiaOption = page.locator('[role="option"], option').filter({ hasText: 'Asia Trip' }).first();
        await expect(asiaOption).toBeVisible({ timeout: 5000 });
        await asiaOption.click();

        await page.waitForTimeout(500);
    });

    test('switching trips updates the selected trip in the selector', async ({ page }) => {
        const tripSelector = page.locator('select, [role="combobox"]').first();
        
        await tripSelector.click();
        await page.waitForTimeout(300);

        const europeOption = page.locator('[role="option"], option').filter({ hasText: 'Europe Trip' }).first();
        await europeOption.click();
        await page.waitForTimeout(500);

        const selectedValue = await tripSelector.innerText();
        expect(selectedValue).toContain('Europe Trip');
    });
});

test.describe('Trip Management - Rename Trip', () => {
    test.beforeEach(async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Original Trip Name');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });
    });

    test('user can rename a trip via the dropdown menu', async ({ page }) => {
        const dropdownMenuButton = page.locator('button[role="button"]').filter({ hasText: /more/i }).or(
            page.locator('button:has-text("⋯")').or(
                page.locator('button').filter({ has: page.locator('svg') }).nth(1)
            )
        );
        
        const renameButton = page.locator('button, [role="menuitem"]').filter({ hasText: /rename|edit/i });
        
        try {
            await dropdownMenuButton.first().click({ timeout: 2000 });
            await page.waitForTimeout(300);
            await expect(renameButton.first()).toBeVisible({ timeout: 5000 });
            await renameButton.first().click();
        } catch {
            const alternativeButton = page.locator('button[aria-haspopup="menu"]').first();
            await alternativeButton.click();
            await page.waitForTimeout(300);
            await expect(renameButton.first()).toBeVisible({ timeout: 5000 });
            await renameButton.first().click();
        }

        const renameModal = page.locator('[role="dialog"]');
        await expect(renameModal).toBeVisible({ timeout: 5000 });

        const renameInput = page.locator('input#tripName');
        await expect(renameInput).toBeVisible({ timeout: 5000 });
        await renameInput.clear();
        await renameInput.fill('Renamed Trip');

        const tripUpdatePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips/') &&
                response.request().method() === 'PUT' &&
                response.status() === 200,
            { timeout: 10000 },
        );

        const saveButton = page.locator('button:has-text("Rename trip"), button:has-text("Save")').first();
        await expect(saveButton).toBeVisible();
        await saveButton.click();

        await tripUpdatePromise;
        await expect(renameModal).not.toBeVisible({ timeout: 10000 });

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toContainText('Renamed Trip', { timeout: 10000 });
    });

    test('rename trip validates required name', async ({ page }) => {
        const dropdownMenuButton = page.locator('button[aria-haspopup="menu"]').first();
        await dropdownMenuButton.click({ timeout: 5000 });
        await page.waitForTimeout(300);

        const renameButton = page.locator('button, [role="menuitem"]').filter({ hasText: /rename|edit/i }).first();
        await expect(renameButton).toBeVisible({ timeout: 5000 });
        await renameButton.click();

        const renameModal = page.locator('[role="dialog"]');
        await expect(renameModal).toBeVisible({ timeout: 5000 });

        const renameInput = page.locator('input#tripName');
        await expect(renameInput).toBeVisible({ timeout: 5000 });
        await renameInput.clear();
        
        await page.waitForTimeout(300);

        const saveButton = page.locator('button:has-text("Rename trip"), button:has-text("Save")').first();
        await expect(saveButton).toBeVisible();
        
        // Button should be disabled when name is empty
        const isDisabled = await saveButton.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('user can cancel trip rename', async ({ page }) => {
        const dropdownMenuButton = page.locator('button[aria-haspopup="menu"]').first();
        await dropdownMenuButton.click({ timeout: 5000 });
        await page.waitForTimeout(300);

        const renameButton = page.locator('button, [role="menuitem"]').filter({ hasText: /rename|edit/i }).first();
        await renameButton.click();

        const renameModal = page.locator('[role="dialog"]');
        await expect(renameModal).toBeVisible({ timeout: 5000 });

        const cancelButton = page.locator('button:has-text("Cancel")');
        await expect(cancelButton).toBeVisible();
        await cancelButton.click();

        await expect(renameModal).not.toBeVisible({ timeout: 5000 });

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toContainText('Original Trip Name');
    });
});

test.describe('Trip Management - Data Isolation', () => {
    test('trips are isolated between different users', async ({ page, browser }) => {
        const email1 = generateUniqueEmail();
        await register(page, 'User One', email1, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('User One Trip');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        await page.goto('/logout');
        await page.waitForTimeout(1000);

        const context2 = await browser.newContext();
        const page2 = await context2.newPage();

        const email2 = generateUniqueEmail();
        await register(page2, 'User Two', email2, 'password123');
        await page2.goto('/');
        await page2.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger2 = page2.locator('[data-sidebar="trigger"]');
        await sidebarTrigger2.click();
        await page2.waitForTimeout(500);

        const tripSelector2 = page2.locator('select, [role="combobox"]').first();
        await expect(tripSelector2).toBeVisible({ timeout: 5000 });
        
        const selectorText = await tripSelector2.innerText();
        expect(selectorText).not.toContain('User One Trip');
        expect(selectorText).toContain('No trips yet');

        await context2.close();
    });

    test('creating trip automatically selects it', async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Auto Selected Trip');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        const tripSelector = page.locator('select, [role="combobox"]').first();
        const selectedValue = await tripSelector.innerText();
        expect(selectedValue).toContain('Auto Selected Trip');
    });
});

test.describe('Trip Management - Edge Cases & Validation', () => {
    test.beforeEach(async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });
    });

    test('trip name can contain special characters', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Trip: São Paulo → Rio (2026) 🌎');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toContainText('São Paulo', { timeout: 10000 });
    });

    test('trip name with very long text', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const longTripName = 'A'.repeat(250);
        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill(longTripName);

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST',
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        const response = await tripCreationPromise;
        const status = response.status();

        if (status === 201) {
            await expect(modal).not.toBeVisible({ timeout: 10000 });
        } else {
            const errorMessage = page.locator('text=/name.*too long|name.*255/i');
            await expect(errorMessage).toBeVisible({ timeout: 5000 });
        }
    });

    test('sidebar closes and reopens correctly after trip creation', async ({ page }) => {
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Test Trip');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        // Wait for sidebar animations to complete
        await page.waitForTimeout(1000);
        
        // Close sidebar by clicking the trigger or overlay
        const overlay = page.locator('[aria-hidden="true"]').first();
        if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
            await overlay.click({ force: true });
        } else {
            await sidebarTrigger.click({ force: true });
        }
        await page.waitForTimeout(500);

        // Reopen sidebar
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        await expect(tripSelector).toContainText('Test Trip');
    });
});

test.describe('Trip Management - Performance & Loading', () => {
    test('trips load correctly after page refresh', async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('Persistent Trip');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        await page.reload();
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        await expect(tripSelector).toContainText('Persistent Trip', { timeout: 10000 });
    });

    test('trip selector is disabled when no trips exist', async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        
        const isDisabled = await tripSelector.isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('trip selector becomes enabled after creating first trip', async ({ page }) => {
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');
        await page.goto('/');
        await page.waitForSelector('.leaflet-container', { timeout: 10000 });

        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await sidebarTrigger.click();
        await page.waitForTimeout(500);

        const tripSelector = page.locator('select, [role="combobox"]').first();
        await expect(tripSelector).toBeVisible({ timeout: 5000 });
        
        let isDisabled = await tripSelector.isDisabled();
        expect(isDisabled).toBe(true);

        const createTripButton = page.locator('button[title="Create new trip"]').first();
        await createTripButton.click();

        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        const tripNameInput = page.locator('input#tripName');
        await tripNameInput.fill('First Trip');

        const tripCreationPromise = page.waitForResponse(
            (response) =>
                response.url().includes('/trips') &&
                response.request().method() === 'POST' &&
                response.status() === 201,
            { timeout: 10000 },
        );

        const submitButton = page.locator('button:has-text("Create trip")');
        await submitButton.click();

        await tripCreationPromise;
        await expect(modal).not.toBeVisible({ timeout: 10000 });

        await page.waitForTimeout(500);

        isDisabled = await tripSelector.isDisabled();
        expect(isDisabled).toBe(false);
    });
});
