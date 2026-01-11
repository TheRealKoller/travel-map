import { Page } from '@playwright/test';

/**
 * Mock all Mapbox API requests to avoid requiring a valid token
 * This intercepts and blocks all requests to Mapbox services
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
 * Setup Mapbox mocking with a fake token injected into the page
 * This should be called before navigating to pages that use Mapbox
 */
export async function setupMapboxMock(page: Page) {
    // Setup request mocking FIRST, before any page loads
    await mockMapboxRequests(page);

    // Mock the entire mapboxgl library before page scripts run
    await page.addInitScript(() => {
        // Create a mock Map class that doesn't make any real API calls
        class MockMap {
            _listeners: Record<string, Array<(e: any) => void>> = {};
            _sources: Record<string, any> = {};
            _layers: Array<any> = [];
            _center = [0, 0];
            _zoom = 2;

            constructor(options: any) {
                // Simulate async load event
                setTimeout(() => {
                    this._trigger('load');
                }, 0);
            }

            on(event: string, callback: (e: any) => void) {
                if (!this._listeners[event]) {
                    this._listeners[event] = [];
                }
                this._listeners[event].push(callback);
                return this;
            }

            once(event: string, callback: (e: any) => void) {
                const wrapper = (e: any) => {
                    callback(e);
                    this.off(event, wrapper);
                };
                return this.on(event, wrapper);
            }

            off(event: string, callback: (e: any) => void) {
                if (this._listeners[event]) {
                    this._listeners[event] = this._listeners[event].filter(
                        (cb) => cb !== callback,
                    );
                }
                return this;
            }

            _trigger(event: string, data?: any) {
                if (this._listeners[event]) {
                    this._listeners[event].forEach((cb) => cb(data || {}));
                }
            }

            remove() {
                this._listeners = {};
            }

            addControl() {
                return this;
            }

            removeControl() {
                return this;
            }

            addSource(id: string, source: any) {
                this._sources[id] = source;
            }

            getSource(id: string) {
                return this._sources[id];
            }

            removeSource(id: string) {
                delete this._sources[id];
            }

            addLayer(layer: any) {
                this._layers.push(layer);
            }

            removeLayer(id: string) {
                this._layers = this._layers.filter((l) => l.id !== id);
            }

            setCenter(center: [number, number]) {
                this._center = center;
                return this;
            }

            getCenter() {
                return { lng: this._center[0], lat: this._center[1] };
            }

            setZoom(zoom: number) {
                this._zoom = zoom;
                return this;
            }

            getZoom() {
                return this._zoom;
            }

            flyTo(options: any) {
                if (options.center) this._center = options.center;
                if (options.zoom) this._zoom = options.zoom;
                setTimeout(() => this._trigger('moveend'), 0);
                return this;
            }

            getCanvas() {
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 600;
                return canvas;
            }

            getContainer() {
                return document.createElement('div');
            }

            loaded() {
                return true;
            }

            resize() {
                return this;
            }
        }

        class MockMarker {
            _lngLat = [0, 0];
            _element = document.createElement('div');

            constructor(options?: any) {
                if (options?.element) {
                    this._element = options.element;
                }
            }

            setLngLat(lngLat: [number, number]) {
                this._lngLat = lngLat;
                return this;
            }

            addTo(map: any) {
                return this;
            }

            remove() {
                return this;
            }

            getElement() {
                return this._element;
            }
        }

        class MockNavigationControl {
            onAdd() {
                return document.createElement('div');
            }
            onRemove() {}
        }

        class MockGeolocateControl {
            onAdd() {
                return document.createElement('div');
            }
            onRemove() {}
            trigger() {}
        }

        // Mock the mapboxgl global
        (window as any).mapboxgl = {
            accessToken: 'pk.test.mock-token-for-e2e-tests',
            Map: MockMap,
            Marker: MockMarker,
            NavigationControl: MockNavigationControl,
            GeolocateControl: MockGeolocateControl,
            supported: () => true,
        };
    });
}
