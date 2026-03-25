---
name: create-pull-request
description: Create GitHub pull requests following project workflow with proper issue linking, quality checks, and pipeline compliance
license: MIT
compatibility: opencode
metadata:
    project: TheRealKoller/travel-map
    workflow: GitHub Flow
---

## What I do

Guide the complete workflow for creating well-structured pull requests in the `TheRealKoller/travel-map` repository, ensuring:

- Proper branch naming and structure
- Issue tracking and linking
- Quality assurance (tests, formatting, linting)
- Pipeline compliance
- Complete PR documentation

## When to use me

Use this skill when the user asks to:

- Create a pull request
- Open a PR
- Submit changes for review
- Merge a feature branch
- Complete an issue implementation

## Prerequisites

Before creating a PR, ensure:

1. **An issue exists** - Every PR must be linked to an issue
2. **Changes are complete** - Feature is implemented and tested
3. **Branch is created** - Following naming conventions
4. **Code is committed** - All changes are committed locally

## Workflow

### Step 1: Verify Issue Exists

**If NO issue exists:**

1. Ask the user if they want to create an issue first
2. Use the `create-github-issue` skill to create the issue
3. Note the issue number for PR linking

**If issue exists:**

1. Note the issue number (e.g., `#532`)
2. Verify the issue is assigned to the user (optional)

### Step 2: Prepare Branch

Ensure the branch follows naming conventions:

**Branch naming format:**

```
<type>/issue-<number>-<brief-description>
```

**Types:**

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `chore/` - Maintenance tasks

**Examples:**

- `feature/issue-532-restructure-setup-docs`
- `fix/issue-23-map-zoom-bug`
- `refactor/issue-105-optimize-queries`

**If branch doesn't exist or has wrong name:**

```bash
git checkout main
git pull origin main
git checkout -b <type>/issue-<number>-<description>
```

### Step 3: Quality Assurance Checks

**CRITICAL:** Run all quality checks before creating PR:

#### 1. Run Tests

```bash
php artisan test --compact
```

- All tests must pass
- If tests fail, fix issues before proceeding

#### 2. Format PHP Code

```bash
vendor/bin/pint --dirty
```

- Formats only modified files
- Ensures code style compliance

#### 3. Format Frontend Code

```bash
npm run format
```

- Runs Prettier on JS/TS files
- Ensures consistent formatting

#### 4. Run Linters

```bash
npm run lint
```

- Checks for code quality issues
- Fix any errors before proceeding

**Summary command (run all checks):**

```bash
vendor/bin/pint && npm run format && php artisan test --compact
```

### Step 4: Commit Changes

Ensure all changes are committed:

```bash
git status
```

If there are uncommitted changes:

1. Use the `conventional-commit` skill to create proper commit messages
2. Ensure commit messages are descriptive and reference the issue

### Step 5: Push Branch

```bash
git push -u origin <branch-name>
```

### Step 6: Create Pull Request

Use `gh pr create` with the following structure:

```bash
gh pr create \
  --repo TheRealKoller/travel-map \
  --title "<emoji> <Title matching issue>" \
  --base main \
  --body "$(cat <<'EOF'
## Summary

Brief description of changes (1-3 sentences).

## Changes

### Category 1
- Change 1
- Change 2

### Category 2
- Change 3

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactoring
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Test update

## Testing

- [ ] Unit tests added/updated
- [ ] Feature tests added/updated
- [ ] Manual testing performed
- [ ] All tests passing

### Manual Testing Steps

1. Step 1
2. Step 2
3. Step 3

## Checklist

- [ ] Code follows project standards
- [ ] Self-review performed
- [ ] Code is documented
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] No new warnings or errors

## Related Issues

Closes #<issue-number>
EOF
)"
```

**Title format:**

- Use an appropriate emoji (📁 for docs, ✨ for features, 🐛 for fixes, etc.)
- Match or summarize the issue title
- Keep it concise (max 72 characters)

**Body structure:**

- **Summary** - Brief overview (1-3 sentences)
- **Changes** - Categorized list of changes
- **Type of Change** - Select applicable types
- **Testing** - Testing checklist and manual steps
- **Checklist** - Pre-merge checklist
- **Related Issues** - MUST include `Closes #<issue-number>`

### Step 7: Link PR to Issue

After PR is created, verify it's linked to the issue:

1. **Check GitHub UI** - PR should appear under "Development" in the issue sidebar
2. **Verify "Closes" keyword** - Ensure PR body contains `Closes #<number>`

**If linking fails:**

```bash
# Get PR number from gh pr create output
PR_NUMBER=<number>

# Manually link using GitHub CLI
gh issue develop <issue-number> --repo TheRealKoller/travel-map --pr <PR_NUMBER>
```

### Step 8: Request Copilot Review (Optional but Recommended)

```bash
gh pr edit <PR_NUMBER> --add-reviewer copilot-pull-request-reviewer
```

This triggers an automated code review by GitHub Copilot.

### Step 9: Update Issue

Add a comment to the issue noting the PR has been created:

```bash
gh issue comment <issue-number> --body "✅ Pull request created: #<PR_NUMBER>"
```

## Pipeline Compliance

The PR must pass these automated checks:

### CI Workflow (`ci.yml`)

- ✅ PHP code formatting (Laravel Pint)
- ✅ Frontend formatting (Prettier)
- ✅ Linting (ESLint)

### Tests Workflow (`tests.yml`)

- ✅ Unit tests (Pest/PHPUnit)
- ✅ Feature tests
- ✅ E2E tests (if applicable)

### Lint Workflow (`lint.yml`)

- ✅ PHP syntax check
- ✅ JavaScript/TypeScript linting

**If checks fail:**

1. Review the error messages in GitHub Actions
2. Fix issues locally
3. Commit and push fixes
4. CI will re-run automatically

## Branch Protection Rules

PRs targeting `main` must satisfy:

- ✅ All CI checks pass
- ✅ At least 1 approval (if required)
- ✅ Branch is up-to-date with main
- ✅ No merge conflicts

## Handling Copilot Review Feedback

After Copilot reviews the PR:

1. **Read all comments carefully**
2. **Evaluate each suggestion** - Not all need to be implemented
3. **Implement sensible changes** that improve:
    - Code quality
    - Security
    - Performance
    - Maintainability
4. **Ask the user** if uncertain about a suggestion
5. **Create commits** to address feedback
6. **Push changes** - Review updates automatically

**DO NOT blindly implement all suggestions** - use judgment!

## After PR is Approved

### Merge the PR

```bash
# Merge using GitHub CLI
gh pr merge <PR_NUMBER> --squash --delete-branch

# Or use GitHub UI:
# 1. Click "Squash and merge"
# 2. Confirm merge
# 3. Delete branch when prompted
```

### Cleanup Local Branch

```bash
git checkout main
git pull origin main
git branch -d <branch-name>
```

### Verify Deployment

1. Check GitHub Actions for deployment status
2. DEV is auto-deployed after merge to `main`
3. Visit https://dev.travelmap.koller.dk/ to verify changes
4. Issue automatically closes when PR is merged

## Common Scenarios

### Scenario 1: PR without existing issue

**User:** "Create a PR for my changes"

**Response:**

```
I see you want to create a PR, but there's no linked issue.
Every PR must be connected to an issue for tracking.

Would you like me to:
1. Create an issue first, then the PR
2. Help you find an existing issue to link to

Which would you prefer?
```

### Scenario 2: Tests failing

**Response:**

```
Tests are failing. Let me show you the errors:
[Display test output]

I'll fix these issues before creating the PR.
```

### Scenario 3: Branch name incorrect

**Response:**

```
Your branch name doesn't follow the convention.
Current: my-feature
Expected: feature/issue-<number>-<description>

Let me create a properly named branch:
git checkout -b feature/issue-<number>-<description>
git push -u origin feature/issue-<number>-<description>
```

## Best Practices

### DO:

✅ Always link PRs to issues with `Closes #<number>`
✅ Run all quality checks before creating PR
✅ Write descriptive PR titles and descriptions
✅ Keep PRs focused and reasonably sized
✅ Request Copilot review for quality feedback
✅ Update issue with PR link
✅ Address review feedback thoughtfully
✅ Ensure all CI checks pass
✅ Test changes manually before submitting

### DON'T:

❌ Create PRs without linked issues
❌ Skip quality checks (tests, formatting, linting)
❌ Use generic PR titles ("Fix stuff", "Updates")
❌ Create massive PRs with unrelated changes
❌ Ignore CI failures
❌ Blindly implement all review suggestions
❌ Merge without approval (if required)
❌ Leave branches undeleted after merge
❌ Commit directly to `main` branch

## Quick Reference

### Full PR Creation Flow

```bash
# 1. Verify issue exists (e.g., #532)

# 2. Prepare branch
git checkout main
git pull origin main
git checkout -b feature/issue-532-brief-description

# 3. Make changes and commit
git add .
git commit -m "docs: add feature X

Closes #532"

# 4. Quality checks
vendor/bin/pint && npm run format && php artisan test --compact

# 5. Push branch
git push -u origin feature/issue-532-brief-description

# 6. Create PR
gh pr create --title "📁 Feature Title" --base main --body "...Closes #532"

# 7. Request review
gh pr edit <PR_NUMBER> --add-reviewer copilot-pull-request-reviewer

# 8. Update issue
gh issue comment 532 --body "✅ Pull request created: #<PR_NUMBER>"
```

## Related Skills

- **`create-github-issue`** - Create issues before PRs
- **`conventional-commit`** - Write proper commit messages

## Related Documentation

- [Branching Strategy](../../docs/BRANCHING_STRATEGY.md) - Complete GitHub Flow guide
- [Workflow Checklist](../../docs/WORKFLOW-CHECKLIST.md) - Step-by-step workflow
- [Contributing Guide](../../docs/CONTRIBUTING.md) - Contribution guidelines
- [AGENTS.md](../../AGENTS.md) - Issue implementation workflow (lines 538-598)

## Summary

This skill ensures every PR:

1. ✅ Is linked to an issue (`Closes #<number>`)
2. ✅ Follows naming conventions
3. ✅ Passes all quality checks
4. ✅ Is properly documented
5. ✅ Complies with pipeline requirements
6. ✅ Is connected to the issue in GitHub UI

**Result:** Clean, trackable, pipeline-compliant pull requests that maintain code quality and project standards.
