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
- **[Workflow Checklist](./docs/WORKFLOW-CHECKLIST.md)** - Step-by-step checklist for development workflow
- **[GitHub Actions](./docs/WORKFLOWS.md)** - Detailed CI/CD pipeline documentation
- **[Workflow Diagrams](./docs/WORKFLOW_DIAGRAM.md)** - Visual workflow diagrams
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and troubleshooting


### 🚀 Quick Start

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
vendor/bin/pint && npm run format && composer test

# Push and create PR
git push origin feature/your-feature-name
```

## Some infos and links
* icons https://fontawesome.com/search?o=r&ic=free&s=regular&ip=classic
* marker icons: https://github.com/lennardv2/Leaflet.awesome-markers
* map library: https://leafletjs.com/

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

### 6. Build Frontend Assets

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

### End-to-End (E2E) Tests

The application includes E2E tests using Playwright to test the complete user workflows.

#### First Time Setup

1. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

2. Create and setup the E2E database:
   ```bash
   # Create the E2E SQLite database
   New-Item -Path "database\e2e.sqlite" -ItemType File -Force
   
   # Run migrations for E2E database
   php artisan migrate:fresh --env=e2e --force
   ```

#### Running E2E Tests

**Important:** The assets must be built before running E2E tests (this is done automatically by the test commands).

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

**Note:** Currently 19 out of 20 E2E tests pass consistently (1 test is skipped, 1 occasionally flaky due to parallel execution timing).

**Known Issues:**
- One test (user can navigate from dashboard to map) may occasionally fail when run in parallel due to database timing
- One test (registered user can login and logout) is temporarily skipped pending fixes to the user menu dropdown interaction

For more details on E2E testing, see [tests/e2e/README.md](tests/e2e/README.md)

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
