# Environment Variables Reference

Complete reference for all environment variables used in the Travel Map application.

## Table of Contents

- [Application Settings](#application-settings)
- [Database Configuration](#database-configuration)
- [Session & Cache](#session--cache)
- [Queue & Broadcasting](#queue--broadcasting)
- [Mail Configuration](#mail-configuration)
- [Logging](#logging)
- [External Services](#external-services)
    - [Mapbox](#mapbox)
    - [Google Maps](#google-maps)
    - [Unsplash](#unsplash)
    - [Le Chat Agent](#le-chat-agent)
- [Admin User](#admin-user)
- [Vite Frontend Variables](#vite-frontend-variables)

---

## Application Settings

### `APP_NAME`

- **Type:** String
- **Default:** `Laravel`
- **Description:** The name of your application, displayed in the UI and emails
- **Example:** `Travel Map`

### `APP_ENV`

- **Type:** String
- **Default:** `local`
- **Options:** `local`, `staging`, `production`
- **Description:** Determines the application environment
- **Important:** Always use `production` for live deployments

### `APP_KEY`

- **Type:** String (Base64)
- **Default:** Empty (generated with `php artisan key:generate`)
- **Description:** Encryption key for securing cookies, sessions, and encrypted data
- **Security:** ⚠️ **Never commit this to version control!** Generate locally for each environment

### `APP_DEBUG`

- **Type:** Boolean
- **Default:** `true`
- **Description:** Enables detailed error messages
- **Important:** ⚠️ **Always set to `false` in production** to avoid exposing sensitive information

### `APP_URL`

- **Type:** URL
- **Default:** `http://localhost`
- **Description:** The base URL of your application
- **Examples:**
    - Local: `http://localhost:8000`
    - Production: `https://travelmap.koller.dk`

### `APP_LOCALE`

- **Type:** String
- **Default:** `en`
- **Options:** `en`, `de`
- **Description:** Default language for the application

### `APP_FALLBACK_LOCALE`

- **Type:** String
- **Default:** `en`
- **Description:** Language used when the requested locale is not available

### `APP_FAKER_LOCALE`

- **Type:** String
- **Default:** `en_US`
- **Description:** Locale for fake data generation in tests and seeders

### `APP_MAINTENANCE_DRIVER`

- **Type:** String
- **Default:** `file`
- **Options:** `file`, `database`
- **Description:** Storage driver for maintenance mode state

### `BCRYPT_ROUNDS`

- **Type:** Integer
- **Default:** `12`
- **Description:** Number of rounds for bcrypt password hashing (higher = more secure but slower)

---

## Database Configuration

### `DB_CONNECTION`

- **Type:** String
- **Default:** `mariadb`
- **Options:** `sqlite`, `mysql`, `mariadb`, `pgsql`
- **Description:** Database driver to use

### SQLite (Default for Development)

```env
DB_CONNECTION=sqlite
```

No additional configuration needed. Database file is created at `database/database.sqlite`.

### MariaDB/MySQL

```env
DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=travel_map
DB_USERNAME=travel_map
DB_PASSWORD=secret
```

### `DB_HOST`

- **Type:** String
- **Default:** `127.0.0.1`
- **Description:** Database server host

### `DB_PORT`

- **Type:** Integer
- **Default:** `3306` (MySQL/MariaDB), `5432` (PostgreSQL)
- **Description:** Database server port

### `DB_DATABASE`

- **Type:** String
- **Default:** `travel_map`
- **Description:** Name of the database

### `DB_USERNAME`

- **Type:** String
- **Default:** `travel_map`
- **Description:** Database user

### `DB_PASSWORD`

- **Type:** String
- **Default:** `secret`
- **Description:** Database password
- **Security:** ⚠️ Use strong passwords in production

---

## Session & Cache

### `SESSION_DRIVER`

- **Type:** String
- **Default:** `database`
- **Options:** `file`, `cookie`, `database`, `redis`, `memcached`
- **Description:** Session storage driver

### `SESSION_LIFETIME`

- **Type:** Integer (minutes)
- **Default:** `120`
- **Description:** Session lifetime in minutes

### `SESSION_ENCRYPT`

- **Type:** Boolean
- **Default:** `false`
- **Description:** Encrypt session data

### `SESSION_PATH`

- **Type:** String
- **Default:** `/`
- **Description:** Session cookie path

### `SESSION_DOMAIN`

- **Type:** String
- **Default:** `null`
- **Description:** Session cookie domain

### `CACHE_STORE`

- **Type:** String
- **Default:** `database`
- **Options:** `file`, `database`, `redis`, `memcached`
- **Description:** Cache storage driver

---

## Queue & Broadcasting

### `QUEUE_CONNECTION`

- **Type:** String
- **Default:** `database`
- **Options:** `sync`, `database`, `redis`, `sqs`
- **Description:** Queue driver for background jobs

### `BROADCAST_CONNECTION`

- **Type:** String
- **Default:** `log`
- **Options:** `log`, `redis`, `pusher`, `ably`
- **Description:** Broadcasting driver for real-time events

### `FILESYSTEM_DISK`

- **Type:** String
- **Default:** `local`
- **Options:** `local`, `public`, `s3`
- **Description:** Default filesystem disk for file storage

---

## Mail Configuration

### `MAIL_MAILER`

- **Type:** String
- **Default:** `log`
- **Options:** `smtp`, `sendmail`, `mailgun`, `ses`, `postmark`, `log`
- **Description:** Mail driver

### `MAIL_HOST`

- **Type:** String
- **Default:** `127.0.0.1`
- **Description:** SMTP server host

### `MAIL_PORT`

- **Type:** Integer
- **Default:** `2525`
- **Description:** SMTP server port

### `MAIL_USERNAME`

- **Type:** String
- **Default:** `null`
- **Description:** SMTP username

### `MAIL_PASSWORD`

- **Type:** String
- **Default:** `null`
- **Description:** SMTP password

### `MAIL_FROM_ADDRESS`

- **Type:** Email
- **Default:** `hello@example.com`
- **Description:** Default sender email address

### `MAIL_FROM_NAME`

- **Type:** String
- **Default:** `${APP_NAME}`
- **Description:** Default sender name

---

## Logging

### `LOG_CHANNEL`

- **Type:** String
- **Default:** `daily`
- **Options:** `stack`, `single`, `daily`, `slack`, `syslog`, `errorlog`
- **Description:** Default log channel

### `LOG_STACK`

- **Type:** String
- **Default:** `daily`
- **Description:** Stack channel configuration

### `LOG_LEVEL`

- **Type:** String
- **Default:** `debug`
- **Options:** `debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency`
- **Description:** Minimum log level to record

### `LOG_DAILY_DAYS`

- **Type:** Integer
- **Default:** `14`
- **Description:** Number of days to keep daily log files

### `LOG_DEPRECATIONS_CHANNEL`

- **Type:** String
- **Default:** `null`
- **Description:** Channel for deprecation warnings

---

## External Services

### Mapbox

#### `MAPBOX_ACCESS_TOKEN`

- **Type:** String
- **Required:** ✅ Yes (for map functionality)
- **Description:** Mapbox API access token
- **Get Token:** [Mapbox Account](https://account.mapbox.com/)
- **Documentation:** See [External Services - Mapbox](./external-services.md#mapbox)

#### `MAPBOX_MONTHLY_REQUEST_LIMIT`

- **Type:** Integer
- **Default:** `10000`
- **Description:** Monthly request limit for rate limiting
- **Note:** Adjust based on your Mapbox plan

### Google Maps

#### `GOOGLE_MAPS_API_KEY`

- **Type:** String
- **Required:** Optional (for public transport routing)
- **Description:** Google Maps API key for Directions API
- **Get Key:** [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Required APIs:** Directions API
- **Documentation:** See [External Services - Google Maps](./external-services.md#google-maps)

### Unsplash

#### `UNSPLASH_ACCESS_KEY`

- **Type:** String
- **Required:** Optional (for on-demand images)
- **Description:** Unsplash API access key
- **Get Key:** [Unsplash Developers](https://unsplash.com/developers)
- **Rate Limit:** 50 requests/hour (free tier)
- **Documentation:** See [External Services - Unsplash](./external-services.md#unsplash)

#### `UNSPLASH_UTM_SOURCE`

- **Type:** String
- **Default:** `${APP_NAME}`
- **Description:** UTM source for attribution tracking
- **Example:** `Travel Map`

### Le Chat Agent

#### `LECHAT_API_KEY`

- **Type:** String
- **Required:** Optional (for AI-powered features)
- **Description:** Mistral AI API key
- **Get Key:** [Mistral AI Console](https://console.mistral.ai/)
- **Documentation:** See [External Services - Le Chat](./external-services.md#le-chat-agent)

#### `LECHAT_MARKER_ENRICHMENT_AGENT_ID`

- **Type:** String
- **Required:** Optional (if using Le Chat)
- **Description:** Agent ID for marker enrichment

#### `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`

- **Type:** String
- **Required:** Optional (if using Le Chat)
- **Description:** Agent ID for travel recommendations

---

## Admin User

Configuration for automatic admin user creation during database seeding.

### `ADMIN_EMAIL`

- **Type:** Email
- **Default:** `admin@travel-map.local`
- **Description:** Admin user email address
- **Security:** ⚠️ Change in production

### `ADMIN_PASSWORD`

- **Type:** String
- **Default:** Empty (no auto-creation)
- **Description:** Admin user password
- **Security:** ⚠️ Leave empty in production to skip automatic creation

### `ADMIN_NAME`

- **Type:** String
- **Default:** `Travel Map Admin`
- **Description:** Admin user display name

---

## Vite Frontend Variables

These variables are exposed to the frontend JavaScript/TypeScript code.

### `VITE_APP_NAME`

- **Type:** String
- **Default:** `${APP_NAME}`
- **Description:** Application name for frontend

### `VITE_MAPBOX_ACCESS_TOKEN`

- **Type:** String
- **Default:** `${MAPBOX_ACCESS_TOKEN}`
- **Description:** Mapbox token for frontend map rendering

**Important:** All variables prefixed with `VITE_` are exposed to the frontend bundle. Never add sensitive secrets here.

---

## AWS Configuration (Optional)

Used if you configure S3 for file storage.

### `AWS_ACCESS_KEY_ID`

- **Type:** String
- **Description:** AWS access key ID

### `AWS_SECRET_ACCESS_KEY`

- **Type:** String
- **Description:** AWS secret access key

### `AWS_DEFAULT_REGION`

- **Type:** String
- **Default:** `us-east-1`
- **Description:** AWS region

### `AWS_BUCKET`

- **Type:** String
- **Description:** S3 bucket name

### `AWS_USE_PATH_STYLE_ENDPOINT`

- **Type:** Boolean
- **Default:** `false`
- **Description:** Use path-style S3 endpoint

---

## Redis Configuration (Optional)

Used if you configure Redis for cache/queue/sessions.

### `REDIS_CLIENT`

- **Type:** String
- **Default:** `phpredis`
- **Options:** `phpredis`, `predis`
- **Description:** Redis client library

### `REDIS_HOST`

- **Type:** String
- **Default:** `127.0.0.1`
- **Description:** Redis server host

### `REDIS_PASSWORD`

- **Type:** String
- **Default:** `null`
- **Description:** Redis password

### `REDIS_PORT`

- **Type:** Integer
- **Default:** `6379`
- **Description:** Redis server port

---

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use different `APP_KEY` values** for each environment
3. ✅ **Set `APP_DEBUG=false`** in production
4. ✅ **Use strong passwords** for database and admin users
5. ✅ **Rotate API keys** periodically
6. ✅ **Use HTTPS** in production (`APP_URL=https://...`)
7. ✅ **Limit Vite variables** to non-sensitive data only
8. ✅ **Review logs regularly** and adjust `LOG_LEVEL` appropriately

---

## Environment-Specific Examples

### Local Development

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=sqlite
MAIL_MAILER=log
```

### Production

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://travelmap.koller.dk
DB_CONNECTION=mysql
MAIL_MAILER=smtp
LOG_LEVEL=warning
```

---

## Next Steps

- **Configure external services** - See [External Services Setup](./external-services.md)
- **Complete local setup** - See [Local Development](./local-development.md)
- **Deploy to production** - See [Deployment Guide](../deployment/)
