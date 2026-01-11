# Branching Strategy - GitHub Flow

This project follows the **GitHub Flow** branching strategy, which is a lightweight, branch-based workflow that supports teams practicing continuous deployment.

## Overview

GitHub Flow is a simple, powerful workflow designed around deployments. It emphasizes:
- A single main branch that is always deployable
- Short-lived feature branches
- Pull requests for code review
- Immediate deployment after merging

## Branch Structure

### Main Branch

- **`main`** - The production-ready branch
  - Always in a deployable state
  - Protected with branch protection rules
  - All code must pass CI checks before merging
  - Represents the current production code
  - Never commit directly to main (use pull requests)

### Feature Branches

Feature branches are created from `main` and merged back via pull requests:

```bash
# Create a new feature branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name
```

**Naming conventions:**
- `feature/add-user-authentication`
- `feature/improve-map-performance`
- `bugfix/fix-marker-deletion`
- `hotfix/security-vulnerability`
- `refactor/optimize-database-queries`
- `docs/update-readme`

## Workflow

### 1. Create a Feature Branch

Start from the latest `main` branch:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

### 2. Develop and Commit

Make your changes in small, logical commits:

```bash
git add .
git commit -m "Add feature X"
git push origin feature/my-new-feature
```

**Commit message guidelines:**
- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issue numbers when applicable (#123)

### 3. Open a Pull Request

1. Push your branch to GitHub
2. Open a pull request against `main`
3. Fill in the PR template with:
   - Description of changes
   - Related issues
   - Screenshots (if UI changes)
   - Testing notes

### 4. Code Review

- At least one approval required before merging
- Address review comments
- Keep the PR up to date with main:

```bash
git checkout main
git pull origin main
git checkout feature/my-new-feature
git merge main
# Resolve conflicts if any
git push origin feature/my-new-feature
```

### 5. CI/CD Pipeline

All pull requests automatically trigger:

- **Linting** - Code style and quality checks
  - PHP: Laravel Pint
  - JavaScript/TypeScript: ESLint, Prettier
  - TypeScript: Type checking

- **Testing** - Comprehensive test suite
  - Unit tests (Pest)
  - Feature tests (Pest)

- **Build** - Asset compilation
  - Frontend assets (Vite)

### 6. Merge and Deploy

Once approved and CI passes:

1. Merge the pull request to `main`
2. Delete the feature branch
3. Deployment is automatically triggered

The deployment workflow:
- Builds production assets
- Deploys to production environment
- Runs database migrations
- Clears caches
- Notifies team

## CI/CD Pipelines

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main` and all pull requests:

```yaml
Lint → Test → Build (if main branch)
```

**Jobs:**
1. **Lint** - Code quality and style checks
2. **Test** - Run all test suites
3. **Build** - Compile production assets (main branch only)

### Deployment Pipeline (`.github/workflows/deploy.yml`)

Runs automatically on merge to `main`:

```yaml
Deploy → Production
```

Can also be triggered manually with:
- Production deployment
- Staging deployment

## Branch Protection Rules

The `main` branch should be protected with:

- ✅ Require pull request reviews before merging (at least 1 approval)
- ✅ Require status checks to pass before merging
  - CI: Lint
  - CI: Test
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings

### Setting up Branch Protection

1. Go to repository Settings
2. Navigate to Branches
3. Add rule for `main`
4. Configure the rules as listed above

## Best Practices

### Do's ✅

- Keep feature branches small and focused
- Commit frequently with descriptive messages
- Write tests for new features
- Update documentation with code changes
- Resolve merge conflicts promptly
- Delete branches after merging
- Deploy frequently (multiple times per day)

### Don'ts ❌

- Don't commit directly to `main`
- Don't create long-lived feature branches
- Don't merge without code review
- Don't merge failing CI checks
- Don't deploy without testing
- Don't force push to shared branches
- Don't ignore review comments

## Hotfixes

For critical production issues:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make fix and test thoroughly
git add .
git commit -m "Fix critical bug in production"
git push origin hotfix/critical-bug-fix

# Create PR and request immediate review
# After approval, merge and deploy
```

## Rollback Strategy

If a deployment causes issues:

1. **Quick fix** - Create a hotfix branch and deploy
2. **Revert** - Revert the problematic commit:

```bash
git checkout main
git pull origin main
git revert <commit-hash>
git push origin main
# This triggers automatic deployment
```

## Release Management

While GitHub Flow doesn't use formal releases, you can:

1. **Tag releases** - Mark significant milestones:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

2. **GitHub Releases** - Create releases on GitHub for:
   - Major feature launches
   - Significant changes
   - Version milestones

## Local Development

For local development workflow:

```bash
# Start development servers
composer dev

# Or manually:
php artisan serve           # Backend (terminal 1)
php artisan queue:listen    # Queue worker (terminal 2)
npm run dev                 # Frontend (terminal 3)
```

**Before committing:**

```bash
# Format and lint code
vendor/bin/pint              # PHP formatting
npm run format               # JS/TS formatting
npm run lint                 # JS/TS linting

# Run tests
composer test                # PHP tests
npm run test:e2e             # E2E tests
```

## Continuous Deployment

With GitHub Flow, every merge to `main` should be deployable:

1. **Small, incremental changes** - Easier to review and test
2. **Automated testing** - Catch issues before production
3. **Feature flags** - Deploy incomplete features safely
4. **Monitoring** - Track deployments and errors
5. **Quick rollback** - Revert if needed

## Team Collaboration

### Code Review Guidelines

**For authors:**
- Keep PRs small (< 400 lines)
- Write clear descriptions
- Respond to comments promptly
- Update based on feedback

**For reviewers:**
- Review within 24 hours
- Be constructive and specific
- Test the changes locally if needed
- Approve when satisfied

### Communication

- Use PR comments for code discussions
- Reference issue numbers (#123)
- Update PR description with changes
- Notify team of important deployments

## Troubleshooting

### Merge Conflicts

```bash
git checkout main
git pull origin main
git checkout feature/my-branch
git merge main
# Resolve conflicts in your editor
git add .
git commit -m "Resolve merge conflicts"
git push origin feature/my-branch
```

### Failed CI Checks

1. Review the error logs in GitHub Actions
2. Fix the issues locally
3. Run tests locally to verify:
   ```bash
   composer test
   npm run test:e2e
   ```
4. Push the fixes

### Deployment Issues

1. Check deployment logs in GitHub Actions
2. Verify environment configuration
3. Check application logs
4. Roll back if necessary

## Resources

- [GitHub Flow Guide](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Laravel Deployment Best Practices](https://laravel.com/docs/deployment)
- [Project README](./README.md)

## Summary

GitHub Flow provides a simple, effective workflow for continuous deployment:

1. **Branch** from main
2. **Commit** changes
3. **Open** pull request
4. **Review** code
5. **Test** automatically
6. **Merge** to main
7. **Deploy** to production

This strategy ensures code quality, enables collaboration, and supports rapid deployment cycles.
