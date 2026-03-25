# Setup Documentation

This section contains all documentation related to setting up and configuring the Travel Map application.

## Quick Links

- **[Local Development Setup](./local-development.md)** - Complete guide to setting up your local development environment
- **[Environment Variables](./environment-variables.md)** - Comprehensive reference for all `.env` configuration options
- **[External Services](./external-services.md)** - Configuration guide for Mapbox, Unsplash, and Le Chat

## Overview

The Travel Map application is built with Laravel 12 and React 19. Setting up the application requires:

1. **System Requirements** - PHP 8.1+, Node.js 18+, Composer, npm
2. **Local Development Environment** - Installing dependencies and configuring the application
3. **Environment Configuration** - Setting up `.env` files with required variables
4. **External Services** - Configuring API keys for third-party services

## Getting Started

If you're setting up the application for the first time, follow these steps:

1. **Read [Local Development Setup](./local-development.md)** to install dependencies and configure your environment
2. **Review [Environment Variables](./environment-variables.md)** to understand all configuration options
3. **Configure [External Services](./external-services.md)** to enable map functionality, images, and AI features

## Quick Start

```bash
# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start development servers
php artisan serve &
npm run dev
```

Visit `http://localhost:8000` to see the application running.

## Need Help?

- Check the [Troubleshooting section](./local-development.md#troubleshooting) in the Local Development guide
- Review the [Environment Variables reference](./environment-variables.md) for configuration issues
- See the [External Services guide](./external-services.md) for API key problems

## Related Documentation

- **Development Workflow** - See [../development/](../development/) for branching strategy and contribution guidelines
- **Deployment** - See [../deployment/](../deployment/) for production deployment instructions
- **Testing** - See [../testing/](../testing/) for running tests
