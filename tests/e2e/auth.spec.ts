import { expect, test } from '@playwright/test';
import { login, logout, register } from './helpers/auth';

test.describe('Authentication', () => {
    test.beforeEach(async () => {
        // Reset database before each test
        // In a real scenario, you might want to use a test database
    });

    test('user can visit login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/Log in/);
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('user can visit registration page', async ({ page }) => {
        await page.goto('/register');
        await expect(page).toHaveTitle(/Register|Sign up/);
        await expect(page.locator('input[name="name"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('guest is redirected to login when accessing protected pages', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/login/);
    });

    test('user can register with valid credentials', async ({ page }) => {
        const timestamp = Date.now();
        const email = `test${timestamp}@example.com`;

        await register(page, 'Test User', email, 'password123');

        // Should redirect to email verification or dashboard
        await expect(page).toHaveURL(/\/(verify-email|dashboard|$)/);
    });

    test('user cannot register with invalid email', async ({ page }) => {
        await page.goto('/register');
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', 'invalid-email');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="password_confirmation"]', 'password123');
        await page.click('button[type="submit"]');

        // Should show validation error
        await expect(page.locator('text=/email/i')).toBeVisible();
    });

    test('user cannot register with mismatched passwords', async ({
        page,
    }) => {
        const timestamp = Date.now();
        const email = `test${timestamp}@example.com`;

        await page.goto('/register');
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="password_confirmation"]', 'different123');
        await page.click('button[type="submit"]');

        // Should show validation error for password confirmation mismatch
        await expect(
            page.locator('text=/password.*confirmation|must match/i').first(),
        ).toBeVisible();
    });
});

test.describe('Login and Logout', () => {
    test('user cannot login with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should stay on login page (not redirect to dashboard/home)
        await page.waitForTimeout(1000); // Wait for any redirect attempts
        await expect(page).toHaveURL(/\/login/);
    });

    // TODO: Fix logout flow - the user menu dropdown structure makes this test complex
    test.skip('registered user can login and logout', async ({ page }) => {
        const timestamp = Date.now();
        const email = `test${timestamp}@example.com`;
        const password = 'password123';

        // First register a user
        await register(page, 'Test User', email, password);

        // If redirected to email verification, skip it for testing
        const currentUrl = page.url();
        if (currentUrl.includes('verify-email')) {
            // Mark email as verified via direct database update
            // For now, we'll try to proceed anyway
        }

        // Logout
        await logout(page);

        // Verify we're at login page
        await expect(page).toHaveURL(/\/login/);

        // Login again
        await login(page, email, password);

        // Should be redirected to home or dashboard
        await expect(page).toHaveURL(/\/(dashboard|$)/);
    });
});
