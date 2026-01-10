import { expect, test } from '@playwright/test';
import { generateUniqueEmail, register } from './helpers/auth';

test.describe('Sidebar Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Register and login a test user
        const email = generateUniqueEmail();
        await register(page, 'Test User', email, 'password123');

        // Navigate to a page with sidebar (map or dashboard)
        await page.goto('/');
        // Wait for sidebar trigger to be ready instead of networkidle
        const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
        await expect(sidebarTrigger).toBeVisible({ timeout: 10000 });
    });

    test('sidebar is hidden by default on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Wait for sidebar element to be ready
        const sidebar = page.locator('[data-slot="sidebar"]');
        await expect(sidebar).toBeAttached({ timeout: 10000 });

        // Check that sidebar is not visible (collapsed/offcanvas mode)
        const sidebarState = await page.evaluate(() => {
            const sidebarElement = document.querySelector(
                '[data-slot="sidebar"]',
            );
            return sidebarElement?.getAttribute('data-state');
        });

        expect(sidebarState).toBe('collapsed');
    });

    test('sidebar trigger button is visible', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // The burger menu trigger should be visible
        const trigger = page.locator('[data-sidebar="trigger"]');
        await expect(trigger).toBeVisible();
    });

    test('clicking burger menu opens sidebar on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Click the sidebar trigger
        const trigger = page.locator('[data-sidebar="trigger"]');
        await trigger.click();

        // Wait for sidebar to become expanded
        await page.waitForFunction(
            () => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                return sidebarElement?.getAttribute('data-state') === 'expanded';
            },
            { timeout: 2000 },
        );

        // Check that sidebar is now expanded
        const sidebarState = await page.evaluate(() => {
            const sidebarElement = document.querySelector(
                '[data-slot="sidebar"]',
            );
            return sidebarElement?.getAttribute('data-state');
        });

        expect(sidebarState).toBe('expanded');
    });

    test('clicking outside sidebar closes it on desktop', async ({ page }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Open the sidebar first
        const trigger = page.locator('[data-sidebar="trigger"]');
        await trigger.click();

        // Wait for sidebar to be expanded
        await page.waitForFunction(
            () => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                return sidebarElement?.getAttribute('data-state') === 'expanded';
            },
            { timeout: 2000 },
        );

        // Verify sidebar is open
        let sidebarState = await page.evaluate(() => {
            const sidebarElement = document.querySelector(
                '[data-slot="sidebar"]',
            );
            return sidebarElement?.getAttribute('data-state');
        });
        expect(sidebarState).toBe('expanded');

        // Click on the overlay (should be visible when sidebar is open)
        const overlay = page.locator(
            'div[class*="fixed"][class*="bg-black"]',
        ).first();
        await overlay.waitFor({ state: 'visible', timeout: 2000 });
        await overlay.click();

        // Wait for sidebar to collapse
        await page.waitForFunction(
            () => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                return sidebarElement?.getAttribute('data-state') === 'collapsed';
            },
            { timeout: 2000 },
        );

        // Verify sidebar is closed
        sidebarState = await page.evaluate(() => {
            const sidebarElement = document.querySelector(
                '[data-slot="sidebar"]',
            );
            return sidebarElement?.getAttribute('data-state');
        });

        expect(sidebarState).toBe('collapsed');
    });

    test('navigating to another page closes sidebar on desktop', async ({
        page,
    }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Open the sidebar
        const trigger = page.locator('[data-sidebar="trigger"]');
        await trigger.click();

        // Wait for sidebar to be expanded
        await page.waitForFunction(
            () => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                return sidebarElement?.getAttribute('data-state') === 'expanded';
            },
            { timeout: 2000 },
        );

        // Verify sidebar is open
        let sidebarState = await page.evaluate(() => {
            const sidebarElement = document.querySelector(
                '[data-slot="sidebar"]',
            );
            return sidebarElement?.getAttribute('data-state');
        });
        expect(sidebarState).toBe('expanded');

        // Click on a navigation link in the sidebar
        const navLink = page
            .locator('[data-sidebar="menu-button"]')
            .filter({ hasText: 'Dashboard' })
            .first();

        if ((await navLink.count()) > 0) {
            await navLink.click();
            await page.waitForLoadState('domcontentloaded');

            // Wait for sidebar to collapse after navigation
            await page.waitForFunction(
                () => {
                    const sidebarElement = document.querySelector(
                        '[data-slot="sidebar"]',
                    );
                    return (
                        sidebarElement?.getAttribute('data-state') ===
                        'collapsed'
                    );
                },
                { timeout: 2000 },
            );

            // Verify sidebar is closed after navigation
            sidebarState = await page.evaluate(() => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                return sidebarElement?.getAttribute('data-state');
            });

            expect(sidebarState).toBe('collapsed');
        }
    });

    test('sidebar works correctly on mobile', async ({ page }) => {
        // Set viewport to mobile size
        await page.setViewportSize({ width: 375, height: 667 });

        // On mobile, sidebar should be in a Sheet (modal)
        const trigger = page.locator('[data-sidebar="trigger"]');
        await expect(trigger).toBeVisible();

        // Click to open
        await trigger.click();

        // Wait for mobile sheet to appear
        const mobileSheet = page.locator('[data-mobile="true"]');
        await mobileSheet.waitFor({ state: 'visible', timeout: 2000 });

        // Check that Sheet is visible (mobile sidebar)
        await expect(mobileSheet).toBeVisible();

        // The sidebar content should be visible
        const sidebarContent = mobileSheet.locator('[data-sidebar="content"]');
        await expect(sidebarContent).toBeVisible();
    });

    test('sidebar overlay is visible when open on desktop', async ({
        page,
    }) => {
        // Set viewport to desktop size
        await page.setViewportSize({ width: 1280, height: 720 });

        // Initially, no overlay should be visible
        let overlay = page.locator(
            'div[class*="fixed"][class*="bg-black"][class*="z-"]',
        );
        await expect(overlay).not.toBeVisible();

        // Open the sidebar
        const trigger = page.locator('[data-sidebar="trigger"]');
        await trigger.click();

        // Wait for sidebar to expand and overlay to appear
        await page.waitForFunction(
            () => {
                const sidebarElement = document.querySelector(
                    '[data-slot="sidebar"]',
                );
                const overlayElement = document.querySelector(
                    'div[class*="fixed"][class*="bg-black"]',
                );
                return (
                    sidebarElement?.getAttribute('data-state') === 'expanded' &&
                    overlayElement !== null
                );
            },
            { timeout: 2000 },
        );

        // Now overlay should be visible
        overlay = page.locator(
            'div[class*="fixed"][class*="bg-black"][class*="z-"]',
        );
        await expect(overlay).toBeVisible();
    });
});
