import { expect, Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import { setupMapboxMock } from './mapbox-mock';

/**
 * Generate a unique email address for testing
 * Uses UUID to ensure uniqueness even when tests run in parallel
 */
export function generateUniqueEmail(): string {
    const uuid = randomUUID().split('-')[0]; // Use first segment of UUID (8 chars)
    return `test-${uuid}@example.com`;
}

export async function login(
    page: Page,
    email: string = 'test@example.com',
    password: string = 'password',
) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    
    // Click submit and wait for navigation away from login
    const loginButton = page.getByTestId('login-button');
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await loginButton.click();
    
    // Wait for successful login - should NOT be on login page anymore
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
        timeout: 10000,
    });
}

export async function register(
    page: Page,
    name: string = 'Test User',
    email: string = 'test@example.com',
    password: string = 'password',
) {
    // Setup Mapbox mocking before any navigation
    await setupMapboxMock(page);
    
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="password_confirmation"]', password);
    
    // Submit form and wait for navigation away from register
    const registerButton = page.getByTestId('register-user-button');
    await expect(registerButton).toBeVisible({ timeout: 5000 });
    await registerButton.click();
    
    // Wait for successful registration - should NOT be on register page anymore
    await page.waitForURL((url) => !url.pathname.includes('/register'), {
        timeout: 10000,
    });
    
    // Give time for session to be established
    await page.waitForTimeout(1000);
}

export async function logout(page: Page) {
    // Navigate to home page where logout exists
    await page.goto('/');
    
    // Wait for sidebar trigger to be ready instead of networkidle
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    await expect(sidebarTrigger).toBeVisible({ timeout: 10000 });
    await sidebarTrigger.click();
    
    // Wait a bit for sidebar animation
    await page.waitForTimeout(300);
    
    // Now click the menu button in the opened sidebar
    const menuButton = page.getByTestId('sidebar-menu-button');
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    await menuButton.click();
    
    // Wait for dropdown to open and click logout
    const logoutButton = page.getByTestId('logout-button');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();
    
    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
}
