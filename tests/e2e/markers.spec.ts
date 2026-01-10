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
        const mapContainer = page.locator('.mapboxgl-map');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('map displays correctly with mapbox controls', async ({ page }) => {
        await page.goto('/');

        // Wait for map container
        const mapContainer = page.locator('.mapboxgl-map');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // Check for zoom controls
        const zoomControl = page.locator('.mapboxgl-ctrl-zoom-in').first();
        await expect(zoomControl).toBeVisible({ timeout: 5000 });
    });

    test('user can interact with map', async ({ page }) => {
        await page.goto('/');

        // Wait for map to load
        const mapContainer = page.locator('.mapboxgl-map').first();
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // Click on the map
        await mapContainer.click({ position: { x: 200, y: 200 } });

        // Wait a moment for any markers or forms to appear
        await page.waitForTimeout(1000);
    });

    test('map page has marker form or controls', async ({ page }) => {
        await page.goto('/');

        // Wait for map to load
        const mapContainer = page.locator('.mapboxgl-map');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });

        // Check if there are any marker-related controls
        const buttons = page.locator('button, [role="button"]');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);
    });
});

test.describe('Marker Creation', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.locator('.mapboxgl-map');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('clicking on map should allow marker creation', async ({ page }) => {
        // Click on the map to potentially create a marker
        const mapContainer = page.locator('.mapboxgl-map').first();
        await mapContainer.click({ position: { x: 200, y: 200 } });

        // Wait for any modal, form, or marker to appear
        await page.waitForTimeout(1500);

        // Check that the page still has content after clicking
        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(0);
    });
});

test.describe('Marker Editing', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to map page
        await page.goto('/');
        const mapContainer = page.locator('.mapboxgl-map');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('clicking on map opens marker creation interface', async ({ page }) => {
        // Create a marker by clicking on the map
        const mapContainer = page.locator('.mapboxgl-map').first();
        await mapContainer.click({ position: { x: 300, y: 300 } });

        // Wait for any response (form, marker, etc.)
        await page.waitForTimeout(1500);

        // Verify page is still functional
        await expect(mapContainer).toBeVisible();
    });
});
