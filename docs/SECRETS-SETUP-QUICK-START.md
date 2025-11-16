# Quick Start: GitHub Secrets Setup

This is a quick reference guide for setting up the required GitHub Secrets. For complete documentation, see [GITHUB-SECRETS.md](GITHUB-SECRETS.md).

## Quick Setup Checklist

### Step 1: Generate Application Key

```bash
php artisan key:generate --show
```

Copy the output (e.g., `base64:xxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Add Required Secrets to GitHub

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets (Minimum for Production)

#### Application (5 secrets)
- `APP_NAME` = `Travel Map`
- `APP_ENV` = `production`
- `APP_KEY` = (output from step 1)
- `APP_DEBUG` = `false`
- `APP_URL` = `https://your-domain.com`

#### Database (6 secrets)
- `DB_CONNECTION` = `mysql`
- `DB_HOST` = `localhost`
- `DB_PORT` = `3306`
- `DB_DATABASE` = (your database name from KAS)
- `DB_USERNAME` = (your database user from KAS)
- `DB_PASSWORD` = (your database password from KAS)

#### Mail (6 secrets)
- `MAIL_MAILER` = `smtp`
- `MAIL_HOST` = `smtp.kasserver.com`
- `MAIL_PORT` = `587`
- `MAIL_USERNAME` = (your email from KAS)
- `MAIL_PASSWORD` = (your email password from KAS)
- `MAIL_FROM_ADDRESS` = (your email)

#### Localization (3 secrets)
- `APP_LOCALE` = `en`
- `APP_FALLBACK_LOCALE` = `en`
- `APP_FAKER_LOCALE` = `en_US`

#### System Configuration (15 secrets)
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

#### Additional System (9 secrets)
- `MEMCACHED_HOST` = `127.0.0.1`
- `REDIS_CLIENT` = `phpredis`
- `REDIS_HOST` = `127.0.0.1`
- `REDIS_PASSWORD` = `null`
- `REDIS_PORT` = `6379`
- `MAIL_SCHEME` = `null`
- `MAIL_FROM_NAME` = `${APP_NAME}`
- `AWS_ACCESS_KEY_ID` = (empty or your key)
- `AWS_SECRET_ACCESS_KEY` = (empty or your key)
- `AWS_DEFAULT_REGION` = `us-east-1`
- `AWS_BUCKET` = (empty or your bucket)
- `AWS_USE_PATH_STYLE_ENDPOINT` = `false`
- `VITE_APP_NAME` = `${APP_NAME}`

### Step 3: Verify Deployment Secrets (Already Configured)

These should already be set:
- `SSH_HOST`
- `SSH_USERNAME`
- `SSH_PASSWORD`
- `SSH_REMOTE_PATH`

### Step 4: Deploy

Push to `main` branch or manually trigger the deployment workflow.

The workflow will:
1. ✅ Generate `.env` from your secrets
2. ✅ Build assets
3. ✅ Create deployment package
4. ✅ Deploy to server
5. ✅ Verify `.env` exists

## Total Secrets Count

- **Application & Database**: 11 secrets
- **Mail**: 6 secrets
- **Localization**: 3 secrets
- **System Configuration**: 24 secrets
- **Deployment (already set)**: 4 secrets

**Total: ~44 secrets to configure**

## Copy-Paste Template for GitHub Secrets UI

Use this as a checklist when adding secrets:

```
✓ APP_NAME
✓ APP_ENV
✓ APP_KEY
✓ APP_DEBUG
✓ APP_URL
✓ APP_LOCALE
✓ APP_FALLBACK_LOCALE
✓ APP_FAKER_LOCALE
✓ APP_MAINTENANCE_DRIVER
✓ BCRYPT_ROUNDS
✓ LOG_CHANNEL
✓ LOG_STACK
✓ LOG_DEPRECATIONS_CHANNEL
✓ LOG_LEVEL
✓ DB_CONNECTION
✓ DB_HOST
✓ DB_PORT
✓ DB_DATABASE
✓ DB_USERNAME
✓ DB_PASSWORD
✓ SESSION_DRIVER
✓ SESSION_LIFETIME
✓ SESSION_ENCRYPT
✓ SESSION_PATH
✓ SESSION_DOMAIN
✓ BROADCAST_CONNECTION
✓ FILESYSTEM_DISK
✓ QUEUE_CONNECTION
✓ CACHE_STORE
✓ MEMCACHED_HOST
✓ REDIS_CLIENT
✓ REDIS_HOST
✓ REDIS_PASSWORD
✓ REDIS_PORT
✓ MAIL_MAILER
✓ MAIL_SCHEME
✓ MAIL_HOST
✓ MAIL_PORT
✓ MAIL_USERNAME
✓ MAIL_PASSWORD
✓ MAIL_FROM_ADDRESS
✓ MAIL_FROM_NAME
✓ AWS_ACCESS_KEY_ID
✓ AWS_SECRET_ACCESS_KEY
✓ AWS_DEFAULT_REGION
✓ AWS_BUCKET
✓ AWS_USE_PATH_STYLE_ENDPOINT
✓ VITE_APP_NAME
```

## Troubleshooting

**Q: Deployment fails with "secret not found"?**
- Check secret names are exactly as shown (case-sensitive)
- Verify all required secrets are added in GitHub Settings

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
