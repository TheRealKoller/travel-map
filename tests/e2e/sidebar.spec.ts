import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to a page with sidebar (map or dashboard)
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('sidebar is hidden by default on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Check that sidebar is not visible (collapsed/offcanvas mode)
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
    });

    test('sidebar trigger button is visible', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // The burger menu trigger should be visible
        const trigger = page.getByTestId('sidebar-trigger');
        await expect(trigger).toBeVisible();
    });

    test('clicking burger menu opens sidebar on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Click the sidebar trigger
        const trigger = page.getByTestId('sidebar-trigger');
        await trigger.click();

        // Wait for sidebar to become expanded
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveAttribute('data-state', 'expanded', { timeout: 2000 });
    });

    test('clicking outside sidebar closes it on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Open the sidebar first
        const trigger = page.getByTestId('sidebar-trigger');
        await trigger.click();

        // Wait for sidebar to be expanded
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveAttribute('data-state', 'expanded', { timeout: 2000 });

        // Click on the overlay (should be visible when sidebar is open)
        const overlay = page.getByTestId('sidebar-overlay');
        await expect(overlay).toBeVisible({ timeout: 2000 });
        await overlay.click({ force: true });

        // Wait for sidebar to collapse
        await expect(sidebar).toHaveAttribute('data-state', 'collapsed', { timeout: 2000 });
    });

    test('navigating to another page closes sidebar on desktop', async ({
        page,
    }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Open the sidebar
        const trigger = page.getByTestId('sidebar-trigger');
        await trigger.click();

        // Wait for sidebar to be expanded
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveAttribute('data-state', 'expanded', { timeout: 2000 });

        // Click on a navigation link in the sidebar
        const navLink = page.getByTestId('nav-dashboard-link');
        await expect(navLink).toBeVisible({ timeout: 5000 });
        await navLink.click();
        await page.waitForLoadState('networkidle');

        // Wait for sidebar to collapse after navigation
        await expect(sidebar).toHaveAttribute('data-state', 'collapsed', { timeout: 2000 });
    });

    test('sidebar works correctly on mobile', async ({ page }) => {
        // Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 });

        // On mobile, sidebar should be in a Sheet (modal)
        const trigger = page.getByTestId('sidebar-trigger');
        await expect(trigger).toBeVisible();

        // Click to open
        await trigger.click();

        // Wait for mobile sheet to appear
        const mobileSheet = page.getByTestId('sidebar-mobile-sheet');
        await expect(mobileSheet).toBeVisible({ timeout: 2000 });

        // The sidebar content should be visible
        const sidebarContent = page.getByTestId('sidebar-content');
        await expect(sidebarContent).toBeVisible();
    });

    test('sidebar overlay is visible when open on desktop', async ({
        page,
    }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Initially, no overlay should be visible
        const overlay = page.getByTestId('sidebar-overlay');
        await expect(overlay).not.toBeVisible();

        // Open the sidebar
        const trigger = page.getByTestId('sidebar-trigger');
        await trigger.click();

        // Wait for sidebar to expand and overlay to appear
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveAttribute('data-state', 'expanded', { timeout: 2000 });
        await expect(overlay).toBeVisible({ timeout: 2000 });
    });
});
