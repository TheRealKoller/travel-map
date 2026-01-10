import { Page } from '@playwright/test';

/**
 * Mock all Mapbox API requests to avoid requiring a valid token
 * This intercepts and blocks all requests to Mapbox services
 */
export async function mockMapboxRequests(page: Page) {
    // Mock Mapbox GL JS library requests
    await page.route('**/*api.mapbox.com/**', async (route) => {
        const url = route.request().url();

        // Mock tiles (raster and vector)
        if (url.includes('/v4/') || url.includes('/styles/v1/')) {
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

        // Mock style requests
        if (url.includes('/styles/v1/') && url.includes('?access_token=')) {
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

        // Mock sprite requests
        if (url.includes('/sprites/')) {
            if (url.endsWith('.json')) {
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

        // Mock any other Mapbox API requests
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
}

/**
 * Setup Mapbox mocking with a fake token injected into the page
 * This should be called before navigating to pages that use Mapbox
 */
export async function setupMapboxMock(page: Page) {
    // Inject a fake token before the page loads
    await page.addInitScript(() => {
        // Mock environment variable for Mapbox token
        (window as any).VITE_MAPBOX_ACCESS_TOKEN =
            'pk.test.mock-token-for-e2e-tests';
    });

    // Setup request mocking
    await mockMapboxRequests(page);
}
