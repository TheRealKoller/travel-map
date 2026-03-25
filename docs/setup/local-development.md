# Local Development Setup

Complete guide to setting up the Travel Map application on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **PHP 8.1 or higher** - [Download PHP](https://www.php.net/downloads)
- **Composer** - [Install Composer](https://getcomposer.org/download/)
- **Node.js 18 or higher** - [Download Node.js](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **Database** - MySQL, PostgreSQL, or SQLite (SQLite is used by default for development)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/TheRealKoller/travel-map.git
cd travel-map
```

### 2. Install PHP Dependencies

```bash
composer install
```

This will install all Laravel dependencies and packages defined in `composer.json`.

### 3. Install JavaScript Dependencies

```bash
npm install
```

This installs all frontend dependencies including React, Inertia.js, and build tools.

### 4. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default configuration uses SQLite for development, which requires no additional database setup.

**For MySQL/PostgreSQL**, edit `.env` and configure your database credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 5. Generate Application Key

The application requires an `APP_KEY` for encryption and security. Generate it with:

```bash
php artisan key:generate
```

This creates a secure key and automatically writes it to your `.env` file.

**Important:** The `APP_KEY` is **never** committed to the repository for security reasons.

### 6. Run Database Migrations

```bash
php artisan migrate
```

This creates all necessary database tables. For SQLite, the database file will be created automatically at `database/database.sqlite`.

### 7. (Optional) Seed the Database

To populate the database with sample data for testing:

```bash
php artisan db:seed
```

### 8. Build Frontend Assets

For development with hot module replacement:

```bash
npm run dev
```

For production build:

```bash
npm run build
```

## Running the Application

### Development Mode

You need two terminal windows running simultaneously:

**Terminal 1 - Laravel development server:**

```bash
php artisan serve
```

This starts the backend server at `http://localhost:8000`.

**Terminal 2 - Vite development server:**

```bash
npm run dev
```

This starts the frontend build process with hot module replacement.

**Open your browser** and visit: `http://localhost:8000`

### Alternative: Use Laravel Sail (Docker)

If you prefer Docker-based development:

```bash
# Start all services
./vendor/bin/sail up

# Run migrations
./vendor/bin/sail artisan migrate

# Install npm dependencies
./vendor/bin/sail npm install

# Start Vite dev server
./vendor/bin/sail npm run dev
```

## Environment Files

The project uses multiple environment files:

| File           | Purpose                  | Git Status                |
| -------------- | ------------------------ | ------------------------- |
| `.env.example` | Template with no secrets | ✅ Committed              |
| `.env`         | Local development config | ❌ Ignored                |
| `.env.e2e`     | E2E test configuration   | ✅ Committed (no secrets) |
| `.env.testing` | Unit test configuration  | ✅ Committed (no secrets) |

### E2E Testing Environment

For E2E tests, a separate environment is used:

```bash
# E2E key is auto-generated during test runs
npm run test:e2e
```

### Verification

Verify your application keys are set correctly:

```bash
# Check default environment key
php artisan tinker --execute="echo config('app.key');"

# Check E2E environment key
php artisan tinker --execute="echo config('app.key');" --env=e2e
```

Both should output a base64-encoded string starting with `base64:`.

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
# Format PHP code (Laravel Pint)
vendor/bin/pint

# Format JavaScript/TypeScript (Prettier)
npm run format
```

### Run Tests

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/ExampleTest.php

# Run with coverage
php artisan test --coverage
```

## Troubleshooting

### Port 8000 Already in Use

Specify a different port:

```bash
php artisan serve --port=8001
```

### Database Connection Errors

- Verify your `.env` database credentials
- For MySQL/PostgreSQL, ensure the database exists
- For SQLite, check that `database/` directory is writable

### Permission Errors

Ensure storage and cache directories are writable:

```bash
chmod -R 775 storage bootstrap/cache
```

On Linux/Mac, you may need to set the correct owner:

```bash
sudo chown -R $USER:www-data storage bootstrap/cache
```

### Frontend Not Loading

- Ensure `npm run dev` is running alongside `php artisan serve`
- Clear your browser cache
- Check the browser console for errors
- Try rebuilding assets: `npm run build`

### "No application encryption key has been specified"

Run:

```bash
php artisan key:generate
```

For E2E environment:

```bash
php artisan key:generate --force --env=e2e
```

### E2E Tests Fail with Encryption Errors

1. Delete `database/e2e.sqlite`
2. Ensure `.env.e2e` exists with `APP_KEY=` (empty)
3. Run `npm run test:e2e` again (key will be auto-generated)

### Key Generation Not Persisting

- Check file permissions on `.env` or `.env.e2e`
- Ensure the files are writable by your user/web server
- Try running with `sudo` if necessary (not recommended for security)

## Security Best Practices

1. ✅ **Never commit** `APP_KEY` values to git
2. ✅ **Generate keys locally** on first setup
3. ✅ **Generate keys dynamically** in CI/CD pipelines
4. ✅ **Use different keys** for different environments (dev, staging, prod)
5. ✅ **Rotate keys periodically** in production
6. ✅ **Keep `.env` out of git** (already configured in `.gitignore`)

## Next Steps

- **Configure external services** - See [External Services Setup](./external-services.md)
- **Review environment variables** - See [Environment Variables Reference](./environment-variables.md)
- **Learn the development workflow** - See [Development Workflow](../development/)
- **Run tests** - See [Testing Documentation](../testing/)

## Need More Help?

- Check the [Environment Variables](./environment-variables.md) reference
- Review the [External Services](./external-services.md) setup guide
- See the [Quick Reference](../development/quick-reference.md) for common commands
