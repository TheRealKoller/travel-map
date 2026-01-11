# Contributing to Travel Map

Thank you for your interest in contributing to Travel Map! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and constructive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- PHP 8.2 or higher
- Composer 2.8+
- Node.js 18 or higher
- npm 10.8+

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/travel-map.git
cd travel-map
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/TheRealKoller/travel-map.git
```

### Setup Development Environment

Follow the installation instructions in [README.md](./README.md):

```bash
# Install dependencies
composer install
npm ci

# Setup environment
cp .env.example .env
php artisan key:generate
php artisan migrate

# Build assets
npm run build
```

## Development Workflow

This project follows **GitHub Flow**. Read the detailed [Branching Strategy Guide](./BRANCHING_STRATEGY.md) for complete information.

### Quick Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit frequently:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub against the `main` branch

5. **Address review comments** and update your PR as needed

6. **Once approved**, a maintainer will merge your PR

## Coding Standards

### PHP

- Follow **PSR-12** coding standards
- Use **Laravel best practices**
- Run Laravel Pint for code formatting:
  ```bash
  vendor/bin/pint
  ```

### JavaScript/TypeScript

- Use **TypeScript** for new code
- Follow **React best practices**
- Use **functional components** with hooks
- Run formatting and linting:
  ```bash
  npm run format    # Format code
  npm run lint      # Lint code
  npm run types     # Check TypeScript types
  ```

### Commit Messages

Write clear, descriptive commit messages:

```
Add user authentication feature

- Implement login/logout functionality
- Add password reset capability
- Create authentication middleware
```

Guidelines:
- Use present tense ("Add feature" not "Added feature")
- First line: brief summary (50 chars or less)
- Blank line, then detailed description if needed
- Reference issues: "Closes #123" or "Fixes #456"

## Testing

All contributions must include appropriate tests.

### Running Tests

```bash
# PHP unit and feature tests
composer test

# E2E tests
npm run test:e2e

# Run all checks before submitting PR
vendor/bin/pint          # Format PHP
npm run format           # Format JS/TS
npm run lint             # Lint JS/TS
npm run types            # Check types
composer test            # Run PHP tests
npm run test:e2e         # Run E2E tests
```

### Writing Tests

- **PHP tests**: Use Pest framework in `tests/` directory
  - Unit tests: `tests/Unit/`
  - Feature tests: `tests/Feature/`

Example PHP test:
```php
test('user can create a marker', function () {
    $user = User::factory()->create();
    
    $this->actingAs($user)
        ->post('/markers', [
            'title' => 'Test Marker',
            'latitude' => 52.52,
            'longitude' => 13.405,
        ])
        ->assertStatus(201);
});
```

Example E2E test:
```typescript
test('user can view map', async ({ page }) => {
    await page.goto('/map');
    await expect(page.locator('.leaflet-container')).toBeVisible();
});
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Run all tests** and ensure they pass
3. **Format and lint** your code
4. **Rebase on main** if needed:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

### PR Requirements

- [ ] Clear, descriptive title
- [ ] Completed PR template
- [ ] All CI checks passing
- [ ] At least one approval from maintainers
- [ ] Up-to-date with main branch
- [ ] No merge conflicts

### PR Template

When you open a PR, fill out the template completely:
- Describe what changes were made and why
- Link related issues
- List testing steps
- Add screenshots for UI changes
- Check all applicable boxes in the checklist

### Review Process

1. **Automated checks** run on every PR:
   - Linting
   - Tests
   - Build

2. **Code review** by maintainers:
   - Code quality
   - Architecture
   - Test coverage
   - Documentation

3. **Address feedback**:
   - Respond to comments
   - Make requested changes
   - Push updates to your branch

4. **Approval and merge**:
   - Maintainer approves and merges
   - Feature branch is deleted

## Reporting Issues

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check if the issue still exists in the latest version
- Gather relevant information (browser, OS, error messages)

### Creating an Issue

Use the appropriate issue template:

**Bug Report:**
- Clear title describing the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

**Feature Request:**
- Clear title describing the feature
- Use case and benefits
- Proposed implementation (optional)
- Alternative solutions considered

**Question:**
- Clear, specific question
- Context and what you've tried
- Relevant code snippets

## Development Tips

### Local Development

Start all services at once:
```bash
composer dev
```

Or manually:
```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker
php artisan queue:listen

# Terminal 3: Vite dev server
npm run dev
```

### Debugging

- Use Laravel Telescope for debugging requests
- Use browser DevTools for frontend debugging
- Check logs: `storage/logs/laravel.log`
- Use `dd()` and `dump()` for quick debugging

### Common Commands

```bash
# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Database
php artisan migrate:fresh     # Reset database
php artisan db:seed           # Seed data

# Code quality
vendor/bin/pint --test       # Check formatting
npm run format:check         # Check JS/TS formatting
```

## Getting Help

If you need help:

1. Check the [README.md](./README.md)
2. Read the [Branching Strategy Guide](./BRANCHING_STRATEGY.md)
3. Search existing issues
4. Ask in pull request comments
5. Open a new issue with your question

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes for significant contributions
- Project documentation

Thank you for contributing to Travel Map! 🎉
