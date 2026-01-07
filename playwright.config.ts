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
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        viewport: { width: 1920, height: 1080 },
        // Enable code coverage collection
        contextOptions: {
            recordVideo: undefined, // Disable video to speed up tests
        },
    },

    // Global setup to create authenticated user once
    globalSetup: './tests/e2e/global-setup.ts',

    projects: [
        {
            name: 'setup',
            testMatch: /global-setup\.ts/,
        },
        {
            name: 'authenticated',
            use: { 
                ...devices['Desktop Chrome'],
                // Reuse authentication state from global setup
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
            testIgnore: '**/auth.spec.ts', // Exclude auth tests from using saved auth
        },
        {
            name: 'auth-tests',
            use: { ...devices['Desktop Chrome'] },
            testMatch: '**/auth.spec.ts', // Auth tests run without saved state
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'php artisan key:generate --force --env=e2e && php artisan migrate:fresh --force --env=e2e && php artisan serve --env=e2e',
        url: 'http://127.0.0.1:8000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
            APP_ENV: 'e2e',
        },
    },
});
