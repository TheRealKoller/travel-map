#!/bin/bash

# Setup script for E2E tests
# This script prepares the environment for running E2E tests

set -e

echo "Setting up E2E test environment..."

# Create a test database if needed
if [ -f ".env.e2e" ]; then
    echo "Using .env.e2e configuration"
    cp .env.e2e .env
else
    echo "Using .env.example as fallback"
    cp .env.example .env
fi

# Generate application key
php artisan key:generate --force

# Run migrations
php artisan migrate:fresh --force

echo "E2E test environment setup complete!"
