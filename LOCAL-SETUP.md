# Local Development Setup

## Application Key Generation

The application requires an `APP_KEY` for encryption and security. This key is **never** committed to the repository.

### For Default Environment (`.env`)

If you're setting up the project for the first time:

```bash
cp .env.example .env
php artisan key:generate
```

This generates a new application key and writes it to your `.env` file.

### For E2E Testing Environment (`.env.e2e`)

The E2E testing environment uses a separate `.env.e2e` configuration file. The key is automatically generated when you run E2E tests:

**Locally:**
```bash
npm run test:e2e
```

The `playwright.config.ts` webServer command automatically runs `php artisan key:generate --force --env=e2e` before starting the test server.

**In GitHub Actions:**
The test workflow automatically generates the E2E key before running tests.

### Manual E2E Key Generation

If you need to manually generate an E2E application key:

```bash
php artisan key:generate --force --env=e2e
```

⚠️ **Important:** Never commit the generated `APP_KEY` to git. The `.env.e2e` file should have `APP_KEY=` (empty) in the repository.

### Verification

After generating keys, verify they exist:

```bash
# Check default environment key
php artisan tinker --execute="echo config('app.key');"

# Check E2E environment key
php artisan tinker --execute="echo config('app.key');" --env=e2e
```

Both should output a base64-encoded string starting with `base64:`.

## Environment Files Overview

- `.env.example` - Template with no secrets (committed to git)
- `.env` - Local development config with secrets (ignored by git)
- `.env.e2e` - E2E test config template (committed to git, no secrets)
- Generated keys are written to `.env` and `.env.e2e` but only `.env` is gitignored

## Security Best Practices

1. ✅ Never commit `APP_KEY` values to git
2. ✅ Generate keys locally on first setup
3. ✅ Generate keys in CI/CD pipelines dynamically
4. ✅ Use different keys for different environments
5. ✅ Rotate keys periodically in production

## Troubleshooting

**Error: "No application encryption key has been specified"**
- Run `php artisan key:generate` for default environment
- Run `php artisan key:generate --force --env=e2e` for E2E environment

**Error: E2E tests fail with encryption errors**
- Delete `database/e2e.sqlite`
- Ensure `.env.e2e` exists with `APP_KEY=` (empty)
- Run `npm run test:e2e` again (key will be auto-generated)

**Key generation not persisting:**
- Check file permissions on `.env` or `.env.e2e`
- Ensure the files are writable by your user/web server
