#!/bin/bash

# Script to run E2E tests locally
# This script handles the complete setup and execution of E2E tests

set -e

echo "================================"
echo "Running E2E Tests Locally"
echo "================================"

# Check if Playwright browsers are installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo "Error: Playwright is not installed. Run 'npm ci' first."
    exit 1
fi

echo ""
echo "Step 1: Checking Playwright browsers..."
if ! npx playwright install --dry-run chromium > /dev/null 2>&1; then
    echo "Installing Chromium browser..."
    npx playwright install chromium
else
    echo "✓ Chromium browser already installed"
fi

echo ""
echo "Step 2: Setting up test environment..."
# Use test environment if available
if [ -f ".env.e2e" ]; then
    echo "Using .env.e2e configuration"
    cp .env.e2e .env.test
else
    echo "Using .env configuration"
fi

echo ""
echo "Step 3: Building frontend assets..."
npm run build

echo ""
echo "Step 4: Running database migrations..."
php artisan migrate:fresh --force

echo ""
echo "Step 5: Running E2E tests..."
npm run test:e2e

echo ""
echo "================================"
echo "E2E Tests Complete!"
echo "================================"
