# CI/CD Pipeline Overview

This document provides a visual overview of the CI/CD pipeline implemented for the Travel Map project using GitHub Flow.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Flow Pipeline                      │
└─────────────────────────────────────────────────────────────┘

                    Feature Development
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │  Create Feature Branch from main    │
        │  (e.g., feature/add-new-map-marker) │
        └─────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │   Make Changes & Push to GitHub     │
        └─────────────────────────────────────┘
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │    Open Pull Request to main        │
        └─────────────────────────────────────┘
                           │
                           ▼
        ╔═════════════════════════════════════╗
        ║     CI Pipeline (Automatic)         ║
        ╚═════════════════════════════════════╝
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
        ┌───────────────┐     ┌───────────────┐
        │   Lint Job    │     │   Test Job    │
        ├───────────────┤     ├───────────────┤
        │ • PHP Pint    │     │ • Unit Tests  │
        │ • Prettier    │     │ • Feature     │
        │ • ESLint      │     │ • E2E Tests   │
        │ • TypeScript  │     │ • Pest Suite  │
        └───────────────┘     └───────────────┘
                │                     │
                └──────────┬──────────┘
                           │
                    ✅ All Checks Pass
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │      Code Review (Manual)            │
        │  • Review by team member             │
        │  • Address comments                  │
        │  • Request changes if needed         │
        └─────────────────────────────────────┘
                           │
                    ✅ Approved
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │    Merge to main Branch              │
        │  • Squash or merge commits           │
        │  • Delete feature branch             │
        └─────────────────────────────────────┘
                           │
                           ▼
        ╔═════════════════════════════════════╗
        ║   Build Job (main branch only)      ║
        ╠═════════════════════════════════════╣
        ║ • Build production assets            ║
        ║ • Upload build artifacts             ║
        ╚═════════════════════════════════════╝
                           │
                           ▼
        ╔═════════════════════════════════════╗
        ║  DEV Deploy Workflow (Automatic)    ║
        ╠═════════════════════════════════════╣
        ║ • Deploy to DEV environment          ║
        ║ • URL: dev.travelmap.koller.dk       ║
        ║ • Run migrations                     ║
        ║ • Clear caches                       ║
        ║ • Send notification                  ║
        ╚═════════════════════════════════════╝
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │    🧪 Live on DEV                    │
        │    Test & Verify Changes             │
        └─────────────────────────────────────┘
                           │
                  (Manual Decision)
                           │
                           ▼
        ╔═════════════════════════════════════╗
        ║  PROD Deploy Workflow (Manual)      ║
        ╠═════════════════════════════════════╣
        ║ • Triggered via GitHub Actions UI    ║
        ║ • Deploy to PROD environment         ║
        ║ • URL: travelmap.koller.dk           ║
        ║ • Run migrations                     ║
        ║ • Clear caches                       ║
        ║ • Send notification                  ║
        ╚═════════════════════════════════════╝
                           │
                           ▼
        ┌─────────────────────────────────────┐
        │    🚀 Live in Production             │
        └─────────────────────────────────────┘
```

## Workflow Files

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**

#### Lint Job
- Runs first, gates the test job
- Checks code quality and style
- **PHP:** Laravel Pint (PSR-12)
- **JavaScript/TypeScript:** Prettier, ESLint
- **Types:** TypeScript type checking

#### Test Job
- Runs after lint passes
- Comprehensive test suite
- **Backend:** Pest (41 unit & feature tests)
- Uploads test artifacts

#### Build Job
- Runs after tests pass
- **Only on main branch** (not PRs)
- Compiles production assets with Vite
- Uploads build artifacts for deployment

### 2. Legacy Workflows

#### Tests Workflow (`.github/workflows/tests.yml`)
- Dedicated test runner
- Same as CI test job
- Kept for backward compatibility

#### Lint Workflow (`.github/workflows/lint.yml`)
- Dedicated linting runner
- Same as CI lint job
- Kept for backward compatibility

### 3. Deployment Workflows

#### DEV Deploy Workflow (`.github/workflows/deploy-dev.yml`)

**Triggers:**
- Automatic: Push to `main` branch
- Manual: workflow_dispatch

**Environment:** `development`

**Target:** https://dev.travelmap.koller.dk/

**Jobs:**
- Run tests first (ensure quality)
- Install dependencies
- Build production assets
- Generate .env from GitHub Secrets/Variables
- Create deployment package (ZIP)
- Deploy to DEV server via SFTP
- Extract and configure on server
- Optimize caches
- Send notification

#### PROD Deploy Workflow (`.github/workflows/deploy-prod.yml`)

**Triggers:**
- Manual only: workflow_dispatch

**Environment:** `production`

**Target:** https://travelmap.koller.dk/

**Jobs:**
- Run tests first (ensure quality)
- Install dependencies
- Build production assets
- Generate .env from GitHub Secrets/Variables
- Create deployment package (ZIP)
- Deploy to PROD server via SFTP
- Extract and configure on server
- Optimize caches
- Send notification

**Deployment Process:**
1. Build deployment package with all files
2. Compress to ZIP (74% size reduction)
3. Upload single ZIP file via SFTP
4. Extract on server
5. Backup old .env file
6. Set permissions
7. Optimize Laravel caches

## Branch Protection Rules

Recommended settings for `main` branch:

```yaml
Protection Rules:
  - Require pull request reviews (1+ approvals)
  - Require status checks before merging:
    - CI / Lint
    - CI / Test
  - Require branches to be up to date
  - Require conversation resolution
  - Require linear history
  - Block force pushes
  - Block deletions
```

## CI/CD Timeline

Typical execution times:

```
Lint Job:      ~2-3 minutes
  ├─ PHP Pint:       10-15s
  ├─ Prettier:       5-10s
  ├─ ESLint:         10-15s
  └─ TypeScript:     5-10s

Test Job:      ~5-8 minutes
  ├─ Setup:          1-2 minutes
  ├─ Unit/Feature:   2-3 seconds
  ├─ E2E Tests:      3-5 minutes
  └─ Upload:         10-20 seconds

Build Job:     ~1-2 minutes
  ├─ Setup:          30-60 seconds
  ├─ npm build:      10-15 seconds
  └─ Upload:         5-10 seconds

Total PR:      ~6-10 minutes
Total DEV Deploy: ~3-5 minutes
Total PROD Deploy: ~3-5 minutes
```

## Status Checks

All pull requests must pass:

- ✅ **Lint / Quality** - Code style and quality
- ✅ **Test / Unit & Feature** - Backend tests
- ✅ **Test / E2E** - Frontend tests
- ✅ **Test / Build** - Asset compilation

## Environment Variables & Secrets

Required secrets and variables for deployment are managed via GitHub Environments:

**See:** [GitHub Environments Setup Guide](./GITHUB-ENVIRONMENTS-SETUP.md)

**DEV Environment** (`development`):
- All secrets and variables configured for dev.travelmap.koller.dk
- APP_DEBUG=true for debugging
- Separate database and credentials

**PROD Environment** (`production`):
- All secrets and variables configured for travelmap.koller.dk
- APP_DEBUG=false for security
- Separate database and credentials

**SSH/SFTP Secrets** (Repository or Environment level):
- SSH_HOST, SSH_USERNAME, SSH_PASSWORD
- SSH_REMOTE_PATH (environment-specific)
- SFTP_SSH_PRIVATE_KEY (optional)

## Monitoring & Notifications

**Success indicators:**
- ✅ All CI checks green
- 📦 Build artifacts uploaded
- 🚀 DEV deployment completed automatically
- 🔐 PROD deployment triggered manually
- 📊 No test failures

**Failure handling:**
- ❌ CI fails → PR blocked
- 🔴 DEV deployment fails → Check logs and fix
- 🔴 PROD deployment fails → Rollback available
- 📧 Team notified via GitHub
- 📝 Logs available in Actions tab

## Best Practices

### For Developers

1. **Always work in feature branches**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Run checks locally before pushing**
   ```bash
   vendor/bin/pint
   npm run format
   npm run lint
   composer test
   ```

3. **Keep PRs small** (< 400 lines)

4. **Write tests** for new features

5. **Update docs** with code changes

### For Reviewers

1. **Review within 24 hours**
2. **Run changes locally** if complex
3. **Check test coverage**
4. **Verify documentation** updates
5. **Approve when satisfied**

## Rollback Strategy

If deployment causes issues:

```bash
# Option 1: Quick hotfix
git checkout -b hotfix/issue-name
# Fix, test, PR, merge

# Option 2: Revert commit
git revert <commit-hash>
git push origin main
# Triggers automatic deployment
```

## Resources

- [GitHub Flow Documentation](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Laravel CI/CD Best Practices](https://laravel.com/docs/deployment)
- [Branching Strategy Guide](../BRANCHING_STRATEGY.md)
- [Contributing Guide](../CONTRIBUTING.md)

## Troubleshooting

### CI Failures

**Lint failures:**
```bash
# Locally format code
vendor/bin/pint
npm run format
npm run lint
git commit -am "Fix code style"
```

**Test failures:**
```bash
# Run tests locally
composer test
npm run test:e2e

# Debug specific test
./vendor/bin/pest --filter="test name"
```

**Build failures:**
```bash
# Check build locally
npm run build

# Clear caches
rm -rf node_modules public/build
npm ci
npm run build
```

### Deployment Failures

1. Check GitHub Actions logs
2. Verify environment variables
3. Check application logs
4. Verify database migrations
5. Test deployment locally

### Getting Help

- Check workflow logs in Actions tab
- Review [Branching Strategy](../BRANCHING_STRATEGY.md)
- Ask in PR comments
- Open an issue for persistent problems

---

**Last Updated:** 2025-11-09  
**Pipeline Version:** 1.0.0  
**Maintained by:** Travel Map Team
