import { expect, test } from '@playwright/test';
import { generateUniqueEmail, login, logout, register } from './helpers/auth';
import { setupMapboxMock } from './helpers/mapbox-mock';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        // Setup Mapbox mocking for all tests
        await setupMapboxMock(page);
        
        // Reset database before each test
        // In a real scenario, you might want to use a test database
    });

    test('user can visit login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveTitle(/Log in/);
        
        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        
        const passwordInput = page.locator('input[name="password"]');
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
    });

    test('user can visit registration page', async ({ page }) => {
        await page.goto('/register');
        await expect(page).toHaveTitle(/Register|Sign up/);
        
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible({ timeout: 5000 });
        
        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible({ timeout: 5000 });
        
        const passwordInput = page.locator('input[name="password"]');
        await expect(passwordInput).toBeVisible({ timeout: 5000 });
    });

    test('guest is redirected to login when accessing protected pages', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/\/login/);
    });

    test('user can register with valid credentials', async ({ page }) => {
        const email = generateUniqueEmail();

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
        
        const registerButton = page.getByTestId('register-user-button');
        await expect(registerButton).toBeVisible({ timeout: 5000 });
        await registerButton.click();

        // Should show validation error
        const errorMessage = page.locator('text=/email/i');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('user cannot register with mismatched passwords', async ({
        page,
    }) => {
        const email = generateUniqueEmail();

        await page.goto('/register');
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="password_confirmation"]', 'different123');
        
        const registerButton = page.getByTestId('register-user-button');
        await expect(registerButton).toBeVisible({ timeout: 5000 });
        await registerButton.click();

        // Should show validation error for password confirmation mismatch
        const errorMessage = page.locator('text=/password.*confirmation|must match/i').first();
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
});

test.describe('Login and Logout', () => {
    test('user cannot login with invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        
        const loginButton = page.getByTestId('login-button');
        await expect(loginButton).toBeVisible({ timeout: 5000 });
        await loginButton.click();

        // Should stay on login page (not redirect to dashboard/home)
        await page.waitForTimeout(1000); // Wait for any redirect attempts
        await expect(page).toHaveURL(/\/login/);
    });

    test('registered user can login and logout', async ({ page }) => {
        const email = generateUniqueEmail();
        const password = 'password123';

        // First register a user
        await register(page, 'Test User', email, password);

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
