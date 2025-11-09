import { Page } from '@playwright/test';

export async function login(
    page: Page,
    email: string = 'test@example.com',
    password: string = 'password',
) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    // Wait for navigation to complete
    await page.waitForURL(/\/(dashboard|$)/);
}

export async function register(
    page: Page,
    name: string = 'Test User',
    email: string = 'test@example.com',
    password: string = 'password',
) {
    await page.goto('/register');
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="password_confirmation"]', password);
    await page.click('button[type="submit"]');
    // Wait for redirect after registration
    await page.waitForURL(/\/(verify-email|dashboard|$)/);
}

export async function logout(page: Page) {
    // Look for logout button/link and click it
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');
    await page.waitForURL('/login');
}
