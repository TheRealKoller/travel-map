# Quick Start: GitHub Secrets and Variables Setup

This is a quick reference guide for setting up GitHub Secrets (sensitive) and Variables (non-sensitive). For complete documentation, see [GITHUB-SECRETS.md](GITHUB-SECRETS.md).

## Important: Secrets vs Variables

- **Secrets** = Sensitive data (passwords, keys) - encrypted and hidden
- **Variables** = Configuration (hostnames, ports) - plain text, visible

## Quick Setup Checklist

### Step 1: Generate Application Key

```bash
php artisan key:generate --show
```

Copy the output (e.g., `base64:xxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Create Production Environment

1. Go to **Repository Settings → Environments**
2. Click **New environment**
3. Name it `production`
4. Click **Configure environment**

### Step 3: Add Secrets (Sensitive Data)

In production environment, go to **Environment secrets** and add:

#### Required Secrets (6 total)

1. `APP_KEY` = (output from step 1)
2. `DB_PASSWORD` = (your database password from KAS)
3. `MAIL_PASSWORD` = (your email password from KAS)

#### Optional Secrets (if using these services)

4. `REDIS_PASSWORD` = (your Redis password, or leave empty)
5. `AWS_ACCESS_KEY_ID` = (your AWS access key, or leave empty)
6. `AWS_SECRET_ACCESS_KEY` = (your AWS secret key, or leave empty)

### Step 4: Add Variables (Non-Sensitive Configuration)

In production environment, go to **Environment variables** and add:

#### Application (4 variables)
- `APP_NAME` = `Travel Map`
- `APP_ENV` = `production`
- `APP_DEBUG` = `false`
- `APP_URL` = `https://your-domain.com`

#### Localization (3 variables)
- `APP_LOCALE` = `en`
- `APP_FALLBACK_LOCALE` = `en`
- `APP_FAKER_LOCALE` = `en_US`

#### Database (5 variables)
- `DB_CONNECTION` = `mysql`
- `DB_HOST` = `localhost`
- `DB_PORT` = `3306`
- `DB_DATABASE` = (your database name from KAS)
- `DB_USERNAME` = (your database user from KAS)

#### Mail (6 variables)
- `MAIL_MAILER` = `smtp`
- `MAIL_HOST` = `smtp.kasserver.com`
- `MAIL_PORT` = `587`
- `MAIL_USERNAME` = (your email from KAS)
- `MAIL_FROM_ADDRESS` = (your email)
- `MAIL_FROM_NAME` = `${APP_NAME}`

#### System Configuration (15 variables)
- `APP_MAINTENANCE_DRIVER` = `file`
- `BCRYPT_ROUNDS` = `12`
- `LOG_CHANNEL` = `stack`
- `LOG_STACK` = `single`
- `LOG_DEPRECATIONS_CHANNEL` = `null`
- `LOG_LEVEL` = `error`
- `SESSION_DRIVER` = `database`
- `SESSION_LIFETIME` = `120`
- `SESSION_ENCRYPT` = `false`
- `SESSION_PATH` = `/`
- `SESSION_DOMAIN` = `null`
- `BROADCAST_CONNECTION` = `log`
- `FILESYSTEM_DISK` = `local`
- `QUEUE_CONNECTION` = `database`
- `CACHE_STORE` = `database`

#### Optional System (8 variables)
- `MEMCACHED_HOST` = `127.0.0.1`
- `REDIS_CLIENT` = `phpredis`
- `REDIS_HOST` = `127.0.0.1`
- `REDIS_PORT` = `6379`
- `MAIL_SCHEME` = `null`
- `AWS_DEFAULT_REGION` = `us-east-1`
- `AWS_BUCKET` = (empty or your bucket)
- `AWS_USE_PATH_STYLE_ENDPOINT` = `false`

#### Frontend (1 variable)
- `VITE_APP_NAME` = `${APP_NAME}`

### Step 5: Configure Deployment Secrets (Repository Level)

Go to **Repository Settings → Secrets and variables → Actions → Repository secrets** and add:

- `SSH_HOST` = `ssh.kasserver.com`
- `SSH_USERNAME` = (your KAS username)
- `SSH_PASSWORD` = (your SSH password)
- `SSH_REMOTE_PATH` = `/www/htdocs/your_kas_user/public_html`

### Step 6: Deploy

Push to `main` branch or manually trigger the deployment workflow.

The workflow will:
1. ✅ Generate `.env` from your secrets and variables
2. ✅ Build assets
3. ✅ Create deployment package
4. ✅ Deploy to server
5. ✅ Verify `.env` exists

## Configuration Summary

### Secrets (Sensitive - 3-6 total)
- `APP_KEY` (required)
- `DB_PASSWORD` (required)
- `MAIL_PASSWORD` (required)
- `REDIS_PASSWORD` (optional)
- `AWS_ACCESS_KEY_ID` (optional)
- `AWS_SECRET_ACCESS_KEY` (optional)

### Variables (Non-Sensitive - ~42 total)
- Application config (4)
- Localization (3)
- Database config (5)
- Mail config (6)
- System config (15)
- Optional system (8)
- Frontend (1)

### Repository Secrets (Deployment - 4 total)
- SSH credentials for deployment

**Total configuration items: ~50**

## Copy-Paste Checklist for Environment Variables

```
Application:
✓ APP_NAME
✓ APP_ENV
✓ APP_DEBUG
✓ APP_URL

Localization:
✓ APP_LOCALE
✓ APP_FALLBACK_LOCALE
✓ APP_FAKER_LOCALE

Maintenance & Logging:
✓ APP_MAINTENANCE_DRIVER
✓ BCRYPT_ROUNDS
✓ LOG_CHANNEL
✓ LOG_STACK
✓ LOG_DEPRECATIONS_CHANNEL
✓ LOG_LEVEL

Database:
✓ DB_CONNECTION
✓ DB_HOST
✓ DB_PORT
✓ DB_DATABASE
✓ DB_USERNAME

Session:
✓ SESSION_DRIVER
✓ SESSION_LIFETIME
✓ SESSION_ENCRYPT
✓ SESSION_PATH
✓ SESSION_DOMAIN

Cache & Queue:
✓ BROADCAST_CONNECTION
✓ FILESYSTEM_DISK
✓ QUEUE_CONNECTION
✓ CACHE_STORE

Redis (optional):
✓ REDIS_CLIENT
✓ REDIS_HOST
✓ REDIS_PORT

Memcached (optional):
✓ MEMCACHED_HOST

Mail:
✓ MAIL_MAILER
✓ MAIL_SCHEME
✓ MAIL_HOST
✓ MAIL_PORT
✓ MAIL_USERNAME
✓ MAIL_FROM_ADDRESS
✓ MAIL_FROM_NAME

AWS (optional):
✓ AWS_DEFAULT_REGION
✓ AWS_BUCKET
✓ AWS_USE_PATH_STYLE_ENDPOINT

Frontend:
✓ VITE_APP_NAME
```

## Troubleshooting

**Q: Deployment fails with "secret not found" or "variable not found"?**
- Check that secrets are in **production environment** (not repository level)
- Check that variables are in **production environment** (not repository level)
- Verify names are exactly as shown (case-sensitive)
- Ensure the production environment exists and is configured

**Q: Application shows errors after deployment?**
- SSH to server: `ssh kas123456@ssh.kasserver.com`
- Check `.env` exists: `cat .env`
- Check Laravel logs: `tail -f storage/logs/laravel.log`
- Clear caches: `php artisan optimize:clear`

**Q: How to update a secret?**
- Go to GitHub Settings → Secrets → Click secret name → Update secret
- Redeploy (push to main or trigger manually)

## Next Steps

1. ✅ Add all secrets to GitHub
2. ✅ Test deployment by triggering workflow manually
3. ✅ Verify application works on production
4. ✅ Check Laravel logs for any errors
5. ✅ Done! 🎉

For detailed documentation, see [GITHUB-SECRETS.md](GITHUB-SECRETS.md).
