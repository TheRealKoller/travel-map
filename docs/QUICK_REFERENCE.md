# CI/CD Quick Reference

Quick reference guide for common CI/CD tasks and commands.

## 🚀 Quick Start

### Starting a New Feature

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Add feature description"

# Push and create PR
git push origin feature/your-feature-name
# Then open PR on GitHub
```

### Before Opening a PR

```bash
# Run all checks locally
vendor/bin/pint           # Format PHP
npm run format            # Format JS/TS
npm run lint              # Lint JS/TS
npm run types             # Check types
composer test             # Run tests
npm run build             # Build assets
```

## 📋 Workflow Status Badges

Add to your PR or documentation:

```markdown
[![CI](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml/badge.svg)](https://github.com/TheRealKoller/travel-map/actions/workflows/ci.yml)
```

## 🔧 Common Commands

### PHP/Laravel

```bash
# Code formatting
vendor/bin/pint                    # Auto-fix PHP code style
vendor/bin/pint --test             # Check without fixing

# Testing
composer test                      # Run all tests
./vendor/bin/pest                  # Run tests directly
./vendor/bin/pest --filter=name    # Run specific test

# Laravel commands
php artisan cache:clear            # Clear cache
php artisan config:clear           # Clear config
php artisan migrate                # Run migrations
php artisan key:generate           # Generate app key
```

### JavaScript/TypeScript

```bash
# Formatting & linting
npm run format                     # Auto-fix formatting
npm run format:check               # Check formatting
npm run lint                       # Auto-fix linting
npm run types                      # Check TypeScript

# Building
npm run build                      # Production build
npm run dev                        # Development server

# Testing
npm run test:e2e                   # Run E2E tests
npm run test:e2e:ui                # Run with UI
npm run test:e2e:debug             # Debug mode
```

### Git

```bash
# Branch management
git branch                         # List local branches
git branch -r                      # List remote branches
git checkout -b feature/name       # Create new branch

# Syncing with main
git fetch origin                   # Fetch updates
git rebase origin/main             # Rebase on main
git merge origin/main              # Merge main

# Cleanup
git branch -d feature/name         # Delete local branch
git push origin --delete feature/name  # Delete remote branch
```

## 🎯 CI Pipeline Jobs

### What Runs When

| Event | Workflows | Jobs |
|-------|-----------|------|
| Push to main | `ci.yml`, `deploy.yml` | Lint → Test → Build → Deploy |
| Pull Request | `ci.yml` | Lint → Test |
| Manual Deploy | `deploy.yml` | Deploy |

### Job Dependencies

```
Lint ──> Test ──> Build (main only) ──> Deploy (main only)
```

## 🐛 Troubleshooting

### Lint Failures

**PHP Pint errors:**
```bash
vendor/bin/pint                    # Auto-fix
```

**Prettier errors:**
```bash
npm run format                     # Auto-fix
```

**ESLint errors:**
```bash
npm run lint                       # Auto-fix
```

**TypeScript errors:**
```bash
npm run types                      # Check errors
# Fix manually in editor
```

### Test Failures

**PHP tests:**
```bash
# Run specific test
./vendor/bin/pest --filter="test name"

# Run with debug output
./vendor/bin/pest -vvv

# Check test database
php artisan migrate:fresh --env=testing
```

**E2E tests:**
```bash
# Run in headed mode to see browser
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Check E2E database
touch database/e2e.sqlite
```

### Build Failures

```bash
# Clear and rebuild
rm -rf node_modules public/build
npm ci
npm run build

# Check for errors
npm run build -- --debug
```

### Merge Conflicts

```bash
# Update your branch with main
git checkout main
git pull origin main
git checkout feature/your-branch
git merge main

# Resolve conflicts in editor
# After resolving:
git add .
git commit -m "Resolve merge conflicts"
git push origin feature/your-branch
```

## 📊 Monitoring

### Check CI Status

- **GitHub Actions:** Repository → Actions tab
- **PR Status:** Check icons next to commit in PR
- **Branch Status:** Repository → Branches

### View Logs

1. Go to Actions tab
2. Click on workflow run
3. Click on failed job
4. Expand step to see logs

### Download Artifacts

1. Go to Actions tab
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Download artifacts

## 🔐 Required Secrets

### For Deployment

Configure in: Settings → Secrets and variables → Actions

```
# Laravel Forge
FORGE_TOKEN           # API token
FORGE_SERVER_ID       # Server ID
FORGE_SITE_ID         # Site ID

# Laravel Vapor
VAPOR_API_TOKEN       # API token

# Custom
DEPLOY_HOST           # Server hostname
DEPLOY_USER           # SSH user
DEPLOY_KEY            # SSH private key
```

## 🎨 PR Template Checklist

When opening a PR, ensure:

- [ ] Description is clear and complete
- [ ] Related issue is linked (Closes #123)
- [ ] Type of change is marked
- [ ] Changes are listed
- [ ] Testing is documented
- [ ] Screenshots added (if UI change)
- [ ] All checklist items completed
- [ ] CI checks are green
- [ ] Conflicts resolved
- [ ] Ready for review

## 🚨 Emergency Procedures

### Hotfix Process

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Make fix and test
# ... fix code ...
composer test
npm run test:e2e

# 3. Quick commit and push
git add .
git commit -m "Fix critical issue: description"
git push origin hotfix/critical-issue

# 4. Open PR with "HOTFIX:" prefix
# 5. Request immediate review
# 6. Merge ASAP after approval
```

### Rollback

```bash
# Option 1: Revert last commit
git checkout main
git pull origin main
git revert HEAD
git push origin main
# Triggers automatic deployment

# Option 2: Revert specific commit
git revert <commit-hash>
git push origin main
```

### Stop Deployment

If deployment is running but should stop:

1. Go to Actions tab
2. Click on running deployment workflow
3. Click "Cancel workflow"

## 📚 Resources

| Resource | Link |
|----------|------|
| Pipeline Overview | [PIPELINE.md](PIPELINE.md) |
| Workflow Diagrams | [WORKFLOW_DIAGRAM.md](WORKFLOW_DIAGRAM.md) |
| Branching Strategy | [BRANCHING_STRATEGY.md](../BRANCHING_STRATEGY.md) |
| Contributing Guide | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Main README | [README.md](../README.md) |

## 💡 Tips

### Speed Up Development

```bash
# Use concurrently for local dev
composer dev

# Run only changed tests
./vendor/bin/pest --dirty

# Skip E2E tests if not needed
composer test
# instead of npm run test:e2e
```

### Efficient PR Reviews

- Keep PRs small (< 400 lines)
- Use draft PRs for WIP
- Request review when ready
- Respond to comments quickly
- Push fixup commits, squash later

### CI Best Practices

- Run checks before pushing
- Fix CI failures immediately
- Don't ignore warnings
- Keep dependencies updated
- Monitor CI duration

## 🔍 Useful GitHub CLI Commands

If you have `gh` installed:

```bash
# View PR checks
gh pr checks

# View PR status
gh pr status

# View PR diff
gh pr diff

# Merge PR
gh pr merge --squash

# View workflow runs
gh run list

# Watch workflow run
gh run watch

# View workflow logs
gh run view --log
```

## ⚡ Keyboard Shortcuts

On GitHub PR page:

- `? ` - Show keyboard shortcuts
- `c` - Create PR
- `e` - Edit PR
- `m` - Merge PR
- `/` - Search
- `t` - File finder
- `b` - Open blame view
- `w` - Branch selector

---

**Last Updated:** 2025-11-09  
**Version:** 1.0.0

Need help? Check the [Contributing Guide](../CONTRIBUTING.md) or open an issue!
