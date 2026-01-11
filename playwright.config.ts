import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['list'],
        ['html', { open: 'never' }], // HTML report ohne Auto-Open
    ],
    use: {
        baseURL: process.env.APP_URL || 'http://localhost:8000',
        trace: process.env.CI ? 'on' : 'on-first-retry',
        screenshot: process.env.CI ? 'on' : 'only-on-failure',
        video: process.env.CI ? 'retain-on-failure' : 'off',
        viewport: { width: 1920, height: 1080 },
        // Enable code coverage collection
        contextOptions: {
            recordVideo: undefined, // Disable video to speed up tests
        },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: process.env.CI 
            ? 'php artisan serve --env=e2e'
            : 'php artisan migrate:fresh --force --env=e2e && php artisan serve --env=e2e',
        url: 'http://127.0.0.1:8000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
            APP_ENV: 'e2e',
        },
    },
});
