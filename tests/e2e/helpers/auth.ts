import { Page } from '@playwright/test';
import { randomUUID } from 'crypto';

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
    await page.click('button[type="submit"]');
    
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
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="password_confirmation"]', password);
    
    // Submit form and wait for navigation away from register
    await page.click('button[type="submit"]');
    
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
    await page.waitForLoadState('networkidle');
    
    // Try to find the user menu trigger (sidebar version or header version)
    const sidebarTrigger = page.locator('[data-test="sidebar-menu-button"]');
    const headerTrigger = page.locator('button:has([data-avatar])').first();
    
    // Check which trigger is visible and click it
    const sidebarVisible = await sidebarTrigger.isVisible().catch(() => false);
    
    if (sidebarVisible) {
        await sidebarTrigger.click();
    } else {
        // Try header trigger
        await headerTrigger.click();
    }
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Now click the logout button using data-test attribute
    const logoutButton = page.locator('[data-test="logout-button"]');
    await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await logoutButton.click();
    
    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
}
