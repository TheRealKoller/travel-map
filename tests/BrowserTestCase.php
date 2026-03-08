<?php

namespace Tests;

use Illuminate\Support\Facades\Vite;

abstract class BrowserTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Redirect Vite to a non-existent hot file so the built assets
        // from `public/build` are used instead of the dev server,
        // even when a dev server happens to be running locally.
        Vite::useHotFile(storage_path('vite-browser-test.hot'));
    }
}
