# Travel Map Application

[![CI](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml)
[![Tests](https://github.com/TheRealKoller/travel-map/actions/workflows/tests.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/tests.yml)
[![Lint](https://github.com/TheRealKoller/travel-map/actions/workflows/lint.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/lint.yml)

A Laravel application with React/Inertia.js frontend for managing travel maps.

## 🌐 Deployments

This project uses separate DEV and PROD environments:

- **DEV**: https://dev.travelmap.koller.dk/ - Automatically deployed on every merge to `main`
- **PROD**: https://travelmap.koller.dk/ - Manually deployed via GitHub Actions

**See [GitHub Environments Setup Guide](./docs/GITHUB-ENVIRONMENTS-SETUP.md)** for configuration instructions.

## Development Workflow

This project follows the **GitHub Flow** branching strategy for a streamlined development and deployment process.

### 📖 Documentation

**Setup & Configuration:**

- **[Setup Documentation](./docs/setup/)** - Installation and configuration
    - [Local Development Setup](./docs/setup/local-development.md)
    - [Environment Variables](./docs/setup/environment-variables.md)
    - [External Services](./docs/setup/external-services.md)

**Deployment:**

- [GitHub Environments Setup Guide](./docs/GITHUB-ENVIRONMENTS-SETUP.md) - DEV/PROD setup guide ⭐
- [Deployment Setup](./docs/DEPLOYMENT.md) - Complete deployment guide
- [GitHub Secrets Configuration](./docs/GITHUB-SECRETS.md) - Environment variables via GitHub Secrets

**Development:**

- [Branching Strategy Guide](./docs/BRANCHING_STRATEGY.md) - GitHub Flow workflow
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute
- [Workflow Checklist](./docs/WORKFLOW-CHECKLIST.md) - Development workflow steps
- [Quick Reference](./docs/QUICK_REFERENCE.md) - Common commands

**Features:**

- [Mapbox Geocoder Feature](./docs/GEOCODER_FEATURE.md) - Location search functionality
- [Mapbox Migration Guide](./docs/MAPBOX_MIGRATION.md) - Migration from Leaflet to Mapbox
- [Trip Collaboration](./docs/TRIP-COLLABORATION.md) - Multi-user collaboration

**CI/CD:**

- [Pipeline Overview](./docs/PIPELINE.md) - CI/CD pipeline documentation
- [GitHub Actions](./docs/WORKFLOWS.md) - Detailed workflow documentation
- [Workflow Diagrams](./docs/WORKFLOW_DIAGRAM.md) - Visual workflow diagrams

### 🚀 Quick Start

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
vendor/bin/pint && npm run format && composer test

# Push and create PR
git push origin feature/your-feature-name
```

### 🤖 GitHub Copilot Integration

This repository is configured with a custom environment for GitHub Copilot to automatically set up the development environment when working on issues. The configuration is defined in `.github/copilot-environment.yml` and includes:

- PHP 8.4 with Composer
- Node.js 22 with npm
- Automatic installation of dependencies
- Laravel environment setup (`.env` file, application key)
- Database migrations
- Frontend asset building

When GitHub Copilot starts working on an issue, it will automatically:

1. Install PHP and Node.js dependencies
2. Configure the Laravel environment
3. Run database migrations
4. Build frontend assets

For detailed instructions and project conventions, see [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

## Features & Technology

- **Icons**: [FontAwesome](https://fontawesome.com/search?o=r&ic=free&s=regular&ip=classic)
- **Map Library**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) (migrated from Leaflet)
- **Location Search**: [Mapbox Geocoder](https://github.com/mapbox/mapbox-gl-geocoder)
- **Frontend**: React 19 with TypeScript and Inertia.js
- **Backend**: Laravel 12 with PHP 8.2+

## Requirements

- PHP 8.1 or higher
- Composer
- Node.js 18 or higher
- npm or yarn
- MySQL, PostgreSQL, or SQLite database

## Quick Start

Get started quickly with these commands:

```bash
# Install dependencies
composer install && npm install

# Configure environment
cp .env.example .env
php artisan key:generate
php artisan migrate

# Start development servers
php artisan serve &
npm run dev
```

Visit `http://localhost:8000` to see the application.

## Installation & Setup

For detailed setup instructions, see **[Setup Documentation](./docs/setup/)**:

- **[Local Development Setup](./docs/setup/local-development.md)** - Complete installation guide
- **[Environment Variables](./docs/setup/environment-variables.md)** - Configuration reference
- **[External Services](./docs/setup/external-services.md)** - Mapbox, Unsplash, Le Chat setup

## Testing

Run the test suite:

```bash
php artisan test
```

For detailed testing documentation, see **[Testing Documentation](./docs/testing/)**.

## Contributing

We welcome contributions! Please read our **[Contributing Guide](./docs/development/contributing.md)** for details on our development workflow, code standards, and pull request process.

## Additional Commands

### Clear Application Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Code Formatting

```bash
# Format PHP code
vendor/bin/pint

# Format JavaScript/TypeScript
npm run format
```

For more commands, see the **[Quick Reference](./docs/development/quick-reference.md)**.

## Troubleshooting

Common issues and solutions:

- **Port 8000 already in use**: `php artisan serve --port=8001`
- **Database connection errors**: Verify your `.env` database credentials
- **Permission errors**: `chmod -R 775 storage bootstrap/cache`
- **Frontend not loading**: Ensure `npm run dev` is running

For more troubleshooting help, see **[Local Development Setup](./docs/setup/local-development.md#troubleshooting)**.
