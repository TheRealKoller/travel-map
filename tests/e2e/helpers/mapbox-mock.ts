import { Page } from '@playwright/test';

/**
 * Mock all Mapbox API requests to avoid requiring a valid token
 * This intercepts all requests to Mapbox services and returns fake responses
 */
export async function mockMapboxRequests(page: Page) {
    // Mock Mapbox GL JS library requests
    await page.route('**/*api.mapbox.com/**', async (route) => {
        const url = route.request().url();

        // Mock style requests (must come BEFORE tile check since they share /styles/v1/ path)
        if (
            url.includes('/styles/v1/') &&
            (url.includes('?access_token=') || url.includes('&access_token='))
        ) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: 8,
                    name: 'Mock Style',
                    sources: {
                        'mock-source': {
                            type: 'raster',
                            tiles: ['http://localhost/mock-tile/{z}/{x}/{y}.png'],
                            tileSize: 256,
                        },
                    },
                    layers: [
                        {
                            id: 'background',
                            type: 'background',
                            paint: { 'background-color': '#f0f0f0' },
                        },
                    ],
                    glyphs: 'http://localhost/fonts/{fontstack}/{range}.pbf',
                    sprite: 'http://localhost/sprite',
                }),
            });
            return;
        }

        // Mock tiles (raster and vector) - now checked after styles
        if (url.includes('/v4/') || url.includes('/tiles/')) {
            // Return empty 1x1 transparent PNG for tiles
            const emptyTile = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64',
            );
            await route.fulfill({
                status: 200,
                contentType: 'image/png',
                body: emptyTile,
            });
            return;
        }

        // Mock geocoding requests
        if (url.includes('/geocoding/v5/')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    type: 'FeatureCollection',
                    query: [],
                    features: [],
                    attribution:
                        'Mock Geocoding Results - No real data in tests',
                }),
            });
            return;
        }

        // Mock fonts
        if (url.includes('/fonts/v1/')) {
            // Return empty font buffer
            await route.fulfill({
                status: 200,
                contentType: 'application/x-protobuf',
                body: Buffer.from([]),
            });
            return;
        }

        // Mock sprite requests (both /sprites/ and /sprite.json patterns)
        if (url.includes('/sprites/') || url.includes('/sprite.')) {
            if (url.endsWith('.json') || url.includes('sprite.json')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({}),
                });
            } else {
                // Return empty 1x1 transparent PNG for sprite
                const emptySprite = Buffer.from(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                    'base64',
                );
                await route.fulfill({
                    status: 200,
                    contentType: 'image/png',
                    body: emptySprite,
                });
            }
            return;
        }

        // Mock any PNG requests (tiles, sprites, etc.) - must be PNG, not JSON
        if (url.endsWith('.png') || url.includes('.png?')) {
            const emptyPng = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                'base64',
            );
            await route.fulfill({
                status: 200,
                contentType: 'image/png',
                body: emptyPng,
            });
            return;
        }

        // Mock any other Mapbox API requests with empty JSON
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({}),
        });
    });

    // Also mock events.mapbox.com (analytics/tracking)
    await page.route('**/*events.mapbox.com/**', async (route) => {
        await route.fulfill({
            status: 204,
            body: '',
        });
    });

    // Mock sprite requests that go to localhost (relative URLs)
    await page.route('**/sprite.json', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({}),
        });
    });

    await page.route('**/sprite.png', async (route) => {
        const emptySprite = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64',
        );
        await route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: emptySprite,
        });
    });
}

/**
 * Setup Mapbox mocking by intercepting all API requests
 * This lets the real Mapbox library run but prevents any actual API calls
 * All requests to Mapbox are intercepted and return fake responses
 */
export async function setupMapboxMock(page: Page) {
    // Intercept ALL Mapbox API requests BEFORE any page loads
    await mockMapboxRequests(page);

    // Provide a valid-looking token via environment variable
    // We use a properly formatted Mapbox token pattern: pk.xxxxx.yyyyy
    await page.addInitScript(() => {
        // Override import.meta.env to provide a fake token
        const originalImportMeta = (window as any).importMeta || import.meta;
        
        // Create a proxy for import.meta.env
        const envProxy = new Proxy(originalImportMeta.env || {}, {
            get(target: any, prop: string) {
                if (prop === 'VITE_MAPBOX_ACCESS_TOKEN') {
                    return 'pk.eyJ1IjoidGVzdCIsImEiOiJ0ZXN0In0.test';
                }
                return target[prop];
            }
        });
        
        // Try to override import.meta.env
        try {
            Object.defineProperty(import.meta, 'env', {
                get() {
                    return envProxy;
                },
                configurable: true
            });
        } catch (e) {
            // If that fails, store it on window for the app to access
            (window as any).__VITE_ENV__ = envProxy;
        }
    });
}
