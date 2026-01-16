# Travel Map Application

[![CI](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml)
[![Tests](https://github.com/TheRealKoller/travel-map/actions/workflows/tests.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/tests.yml)
[![Lint](https://github.com/TheRealKoller/travel-map/actions/workflows/lint.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/lint.yml)

A Laravel application with React/Inertia.js frontend for managing travel maps.

## Development Workflow

This project follows the **GitHub Flow** branching strategy for a streamlined development and deployment process.

### 📖 Documentation

- **[Branching Strategy Guide](./docs/BRANCHING_STRATEGY.md)** - Complete guide to GitHub Flow workflow
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute to this project
- **[Pipeline Overview](./docs/PIPELINE.md)** - Detailed CI/CD pipeline documentation
- **[Deployment Setup](./docs/DEPLOYMENT.md)** - Complete deployment guide for all-inkl.com
- **[GitHub Secrets Configuration](./docs/GITHUB-SECRETS.md)** - Configure environment variables via GitHub Secrets
- **[Secrets Quick Start](./docs/SECRETS-SETUP-QUICK-START.md)** - Quick reference for setting up GitHub Secrets
- **[Secrets Workflow Diagram](./docs/GITHUB-SECRETS-WORKFLOW.md)** - Visual guide to how secrets are deployed
- **[Workflow Checklist](./docs/WORKFLOW-CHECKLIST.md)** - Step-by-step checklist for development workflow
- **[GitHub Actions](./docs/WORKFLOWS.md)** - Detailed CI/CD pipeline documentation
- **[Workflow Diagrams](./docs/WORKFLOW_DIAGRAM.md)** - Visual workflow diagrams
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and troubleshooting
- **[Mapbox Geocoder Feature](./docs/GEOCODER_FEATURE.md)** - Location search functionality documentation
- **[Mapbox Migration Guide](./docs/MAPBOX_MIGRATION.md)** - Migration from Leaflet to Mapbox GL JS

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
- MySQL or PostgreSQL database

## Installation & Setup

### 1. Install PHP Dependencies

```bash
composer install
```

### 2. Install JavaScript Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and configure your database:

```bash
cp .env.example .env
```

Edit `.env` and set your database credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Run Database Migrations

```bash
php artisan migrate
```

### 6. Configure External Services (Optional)

#### Mapbox (Required for map functionality)

Get your Mapbox access token from [Mapbox Account](https://account.mapbox.com/):

```
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

#### Unsplash (Optional - for automatic trip and marker images)

Get your Unsplash access key from [Unsplash Developers](https://unsplash.com/developers):

```
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

**Features:**

- Automatically fetches high-quality images for trips and markers
- Images are cached for 30 days to minimize API calls
- **Rate Limit:** 50 requests/hour (free tier)
- Falls back to placeholder images if API is unavailable

**Note:** If you don't configure an Unsplash API key, the application will still work but will display placeholder images instead of real photos.

#### Le Chat Agent (Optional - for AI-powered marker enrichment)

Get your API key from [Mistral AI Console](https://console.mistral.ai/):

```
LECHAT_API_KEY=your_lechat_api_key_here
LECHAT_MARKER_ENRICHMENT_AGENT_ID=your_agent_id_here
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=your_agent_id_here
```

### 7. Build Frontend Assets

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
```

## Running the Application

### Development Mode

1. **Start the Laravel development server** (in one terminal):

    ```bash
    php artisan serve
    ```

2. **Start the Vite development server** (in another terminal):

    ```bash
    npm run dev
    ```

3. **Open your browser** and visit:
    ```
    http://localhost:8000
    ```

### Production Mode

1. Build the frontend assets:

    ```bash
    npm run build
    ```

2. Configure your web server (Apache/Nginx) to point to the `public` directory

3. Ensure proper file permissions:
    ```bash
    chmod -R 775 storage bootstrap/cache
    ```

## Testing

### Unit and Feature Tests

Run the PHP test suite:

```bash
php artisan test
```

Or using Pest directly:

```bash
./vendor/bin/pest
```

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up your development environment
- Our code of conduct
- The pull request process
- Coding standards

## Additional Commands

### Clear Application Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Create Database Seeder Data

```bash
php artisan db:seed
```

## Troubleshooting

- **Port 8000 already in use**: Specify a different port with `php artisan serve --port=8001`
- **Database connection errors**: Verify your `.env` database credentials
- **Permission errors**: Ensure `storage` and `bootstrap/cache` directories are writable
- **Frontend not loading**: Make sure `npm run dev` is running alongside `php artisan serve`
