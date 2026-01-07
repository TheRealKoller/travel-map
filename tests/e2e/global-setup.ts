import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateUniqueEmail, register } from './helpers/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;
    const storageStatePath = path.join(__dirname, '../../playwright/.auth/user.json');

    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    // Register a global test user that will be reused across all non-auth tests
    const email = generateUniqueEmail();
    const password = 'password123';
    const name = 'E2E Test User';

    console.log(`\n🔐 Registering global test user: ${email}`);

    await register(page, name, email, password);

    // Wait for successful login/registration
    await page.waitForURL((url) => !url.pathname.includes('/register'), {
        timeout: 10000,
    });

    // Save authentication state to file
    await context.storageState({ path: storageStatePath });

    await browser.close();

    // Store credentials in environment for tests that need them
    process.env.E2E_TEST_EMAIL = email;
    process.env.E2E_TEST_PASSWORD = password;
    process.env.E2E_TEST_NAME = name;

    console.log(`✅ Global test user registered and auth state saved\n`);
}

export default globalSetup;
