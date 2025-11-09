import { Page } from '@playwright/test';

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
    await page.waitForTimeout(1000);
    
    // The application uses a dropdown menu for user actions
    // First, open the user menu (look for user avatar/button)
    const userMenuTrigger = page.locator('button[data-sidebar="menu-button"], button:has([data-avatar]), [data-state]').first();
    
    try {
        await userMenuTrigger.click({ timeout: 3000 });
        await page.waitForTimeout(500);
    } catch (e) {
        // Menu might already be open or use different structure
    }
    
    // Now click the logout button using data-test attribute
    const logoutButton = page.locator('[data-test="logout-button"]');
    await logoutButton.waitFor({ state: 'visible', timeout: 5000 });
    await logoutButton.click();
    
    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 10000 });
}
