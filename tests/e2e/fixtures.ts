import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Extend Playwright test to automatically collect coverage
export const test = base.extend({
    context: async ({ context }, use) => {
        // Enable coverage collection on all pages
        await context.addInitScript(() => {
            (window as any).__coverage__ = (window as any).__coverage__ || {};
        });
        
        await use(context);
        
        // After all tests, collect coverage from all pages
        const pages = context.pages();
        for (const page of pages) {
            const coverage = await page.evaluate(() => (window as any).__coverage__);
            if (coverage) {
                saveCoverage(coverage);
            }
        }
    },
});

export { expect } from '@playwright/test';

function saveCoverage(coverage: any) {
    const coverageDir = path.join(process.cwd(), '.nyc_output');
    
    if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const filename = path.join(coverageDir, `coverage-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(coverage, null, 2));
}
