# GitHub Secrets and Variables Configuration

This document describes how to configure GitHub Secrets and Variables for the Travel Map application deployment.

## Overview

The application uses **GitHub Secrets** (for sensitive data) and **GitHub Variables** (for non-sensitive configuration) to manage environment variables during deployment. Instead of maintaining a `.env` file on the server, all configuration is stored in GitHub and injected during the deployment process.

### Secrets vs Variables

- **Secrets** (`secrets.*`): Encrypted storage for sensitive data like passwords, API keys, and encryption keys
  - Encrypted at rest with AES-256-GCM
  - Never exposed in logs (automatically redacted)
  - Cannot be read via API
  
- **Variables** (`vars.*`): Plain text storage for non-sensitive configuration
  - Visible in workflow logs
  - Can be read via API
  - Suitable for hostnames, ports, feature flags, etc.

## Benefits

- **Security**: Sensitive data encrypted and never exposed in repository or logs
- **Separation**: Clear distinction between sensitive and non-sensitive configuration
- **Version Control**: Environment configuration is managed alongside code changes
- **Automation**: Deployment process automatically uses the latest values
- **Audit Trail**: GitHub tracks who changed what and when
- **No Manual Server Configuration**: No need to SSH and manually edit `.env` files

## Configuration Location

All secrets and variables are configured in the **production** environment:

**Settings → Environments → production → Environment secrets/variables**

This ensures proper isolation and access control for production deployments.

## Required Secrets (Sensitive Data)

Navigate to **Settings → Environments → production → Environment secrets**:

### Encryption & Authentication

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `APP_KEY` | Laravel encryption key (generate with `php artisan key:generate --show`) | `base64:random_base64_string` | Yes |

### Database Credentials

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `DB_PASSWORD` | Database password | `your_secure_db_password` | Yes |

### Mail Credentials

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `MAIL_PASSWORD` | SMTP password | `your_mail_password` | Yes |


### AWS Credentials (Optional)

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` | No |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | No |

## Required Variables (Non-Sensitive Configuration)

Navigate to **Settings → Environments → production → Environment variables**:

### Application Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `APP_NAME` | Application name | `Travel Map` | Yes |
| `APP_ENV` | Environment (production/staging) | `production` | Yes |
| `APP_DEBUG` | Enable debug mode (should be `false` in production) | `false` | Yes |
| `APP_URL` | Application URL | `https://your-domain.com` | Yes |


### Database Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `DB_CONNECTION` | Database driver | `mysql` | Yes |
| `DB_HOST` | Database host | `localhost` | Yes |
| `DB_PORT` | Database port | `3306` | Yes |
| `DB_DATABASE` | Database name | `your_database` | Yes |
| `DB_USERNAME` | Database username | `your_db_user` | Yes |


### Mail Configuration

| Variable Name | Description | Example Value | Required |
|---------------|-------------|---------------|----------|
| `MAIL_MAILER` | Mail driver | `smtp` | Yes |
| `MAIL_SCHEME` | Mail scheme | `null` | No |
| `MAIL_HOST` | SMTP host | `smtp.kasserver.com` | Yes |
| `MAIL_PORT` | SMTP port | `587` | Yes |
| `MAIL_USERNAME` | SMTP username | `mail@your-domain.com` | Yes |
| `MAIL_FROM_ADDRESS` | From email address | `noreply@your-domain.com` | Yes |
| `MAIL_FROM_NAME` | From name | `${APP_NAME}` | Yes |

## Deployment Secrets (Repository-Level)

These secrets are used for SFTP deployment and should be configured at the **repository level** (not environment level):

Navigate to **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret Name | Description | Example Value | Required |
|-------------|-------------|---------------|----------|
| `SSH_HOST` | SSH server hostname | `ssh.kasserver.com` | Yes |
| `SSH_USERNAME` | SSH username | `kas123456` | Yes |
| `SSH_PASSWORD` | SSH password | `your_ssh_password` | Yes |
| `SSH_REMOTE_PATH` | Remote deployment path | `/www/htdocs/kas123456/public_html` | Yes |

## Setup Instructions

### 1. Generate Application Key

First, generate a new application key locally:

```bash
php artisan key:generate --show
```

Copy the output (e.g., `base64:xxxxxxxxxxxxxxxxxxxxx`)

### 2. Create Production Environment

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **New environment**
4. Name it `production`
5. Click **Configure environment**

### 3. Add Secrets to Production Environment

1. In the production environment configuration
2. Scroll to **Environment secrets**
3. Click **Add secret**
4. Add each **secret** from the secrets table above:
   - `APP_KEY`
   - `DB_PASSWORD`
   - `MAIL_PASSWORD`
   - `REDIS_PASSWORD` (if using Redis)
   - `AWS_ACCESS_KEY_ID` (if using AWS)
   - `AWS_SECRET_ACCESS_KEY` (if using AWS)

### 4. Add Variables to Production Environment

1. In the production environment configuration
2. Scroll to **Environment variables**
3. Click **Add variable**
4. Add each **variable** from the variables tables above (all non-password configuration)

### 5. Configure Deployment Secrets (Repository Level)

1. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**
2. Click **New repository secret**
3. Add the SSH/SFTP deployment secrets:
   - `SSH_HOST`
   - `SSH_USERNAME`
   - `SSH_PASSWORD`
   - `SSH_REMOTE_PATH`

### 6. Production Values Example

Here's an example of production values for all-inkl.com hosting:

```env
APP_NAME=Travel Map
APP_ENV=production
APP_KEY=base64:your-generated-key-here
APP_DEBUG=false
APP_URL=https://your-domain.com

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

APP_MAINTENANCE_DRIVER=file

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.kasserver.com
MAIL_PORT=587
MAIL_USERNAME=mail@your-domain.com
MAIL_PASSWORD=your_mail_password
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME=${APP_NAME}

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME=${APP_NAME}
```

### 4. Verify Deployment

After adding all secrets:

1. Push a change to the `main` branch (or manually trigger the deployment workflow)
2. Go to **Actions** tab and monitor the deployment
3. The workflow will:
   - Generate `.env` file from your GitHub Secrets
   - Include it in the deployment package
   - Deploy to the server with the new configuration
4. Check the deployment logs to ensure `.env` was created successfully
5. Verify your application works correctly with the new configuration

## Updating Secrets

To update a secret:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click the secret name you want to update
3. Click **Update secret**
4. Enter the new value
5. Click **Update secret**
6. Deploy your application (push to `main` or trigger manual deployment)

The new secret value will be used in the next deployment automatically.

## Security Best Practices

1. **Never commit `.env` files**: The `.env` file is generated during deployment and should never be committed to the repository
2. **Use strong passwords**: Especially for `APP_KEY`, `DB_PASSWORD`, and `MAIL_PASSWORD`
3. **Limit access**: Only grant repository admin access to users who need to view/edit secrets
4. **Rotate secrets regularly**: Change critical secrets (passwords, keys) periodically
5. **Use environment-specific secrets**: Use different secrets for production, staging, and development
6. **Enable debug only in non-production**: Always set `APP_DEBUG=false` in production

## Troubleshooting

### Secret Not Found Error

If you see an error about missing secrets during deployment:

1. Verify all required secrets are added in GitHub Settings
2. Check secret names match exactly (case-sensitive)
3. Ensure there are no typos in secret names
4. Re-run the deployment workflow

### `.env` File Not Created

If the deployment succeeds but `.env` is not found on the server:

1. Check the deployment logs for errors in the "Generate production .env file" step
2. Verify the `.env` file is included in the deployment package
3. Ensure the deployment script properly extracts the ZIP file

### Application Errors After Deployment

If the application shows errors after deployment with secrets:

1. SSH to the server and check the `.env` file exists: `cat .env`
2. Verify all critical values are present (APP_KEY, DB_*, etc.)
3. Check Laravel logs: `tail -f storage/logs/laravel.log`
4. Clear caches: `php artisan optimize:clear`
5. Regenerate optimized files: `php artisan optimize`

## Migration from Manual .env Management

If you're migrating from manual `.env` file management:

1. **Backup current `.env`**: The deployment script automatically creates timestamped backups
2. **Extract current values**: SSH to server and copy your current `.env` contents
3. **Add to GitHub Secrets**: Add all values as secrets in GitHub
4. **Test deployment**: Trigger a manual deployment and verify everything works
5. **Old backups**: Old `.env` backups are kept as `.env.backup.YYYYMMDD_HHMMSS` files

The first deployment with secrets will:
- Create a backup of your current `.env` file
- Deploy the new `.env` generated from GitHub Secrets
- Verify the new `.env` file exists
- Continue with normal deployment process

## Additional Resources

- [GitHub Actions Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Laravel Configuration Documentation](https://laravel.com/docs/configuration)
- [Laravel Deployment Documentation](https://laravel.com/docs/deployment)
