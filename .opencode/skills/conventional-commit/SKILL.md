---
name: conventional-commit
description: Write commit messages following Conventional Commits specification, structured for automatic changelog generation
license: MIT
compatibility: opencode
metadata:
    spec: https://www.conventionalcommits.org/en/v1.0.0/
---

## What I do

Write commit messages that follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. These messages are machine-readable and used to automatically generate changelogs and determine semantic version bumps.

## When to use me

Use this skill whenever a commit message needs to be written — e.g. during `git commit`, when staging changes, or when the user asks to commit something.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Rules

- **Subject line:** max 72 characters, lowercase, no trailing period, imperative mood ("add" not "added")
- **Body:** wrap at 72 characters, explain _why_ not _what_, separate from subject with blank line
- **Footer:** reference issues with `Closes #123`, `Fixes #123`, or `Refs #123`
- **Breaking changes:** add `!` after type/scope or a `BREAKING CHANGE:` footer

## Types

| Type       | When to use                                            | Changelog section |
| ---------- | ------------------------------------------------------ | ----------------- |
| `feat`     | New feature for the user                               | **Features**      |
| `fix`      | Bug fix for the user                                   | **Bug Fixes**     |
| `perf`     | Performance improvement                                | **Performance**   |
| `refactor` | Code change that is neither feat nor fix               | **Refactoring**   |
| `style`    | Formatting, missing semicolons, etc. (no logic change) | _(omitted)_       |
| `test`     | Adding or fixing tests                                 | _(omitted)_       |
| `docs`     | Documentation only                                     | **Documentation** |
| `build`    | Build system or dependency changes                     | **Build**         |
| `ci`       | CI/CD configuration                                    | _(omitted)_       |
| `chore`    | Maintenance tasks, tooling                             | _(omitted)_       |
| `revert`   | Revert a previous commit                               | **Reverts**       |

## Scopes (this project)

Use these scopes to indicate which part of the application was changed:

- `auth` — authentication & authorization
- `trips` — trip management
- `markers` — map markers
- `tours` — tour management
- `map` — map page & Mapbox integration
- `admin` — admin functionality
- `pdf` — PDF export
- `api` — backend API / controllers
- `db` — database migrations & models
- `ui` — generic UI components
- `deps` — dependency updates
- `config` — configuration changes

Omit the scope if the change spans multiple areas or doesn't fit any category.

## Examples

```
feat(trips): add Unsplash image auto-fetch on trip creation

fix(markers): prevent duplicate markers on rapid double-click

perf(map): lazy-load marker details on viewport entry

feat(admin)!: allow admins to edit all users' trips

BREAKING CHANGE: TripPolicy now grants admins full write access to all trips.

refactor(auth): extract role check into UserRole enum helper

docs(config): document required env vars for Docker setup

chore(deps): update inertiajs to v2.1.0

Closes #438
```

## Changelog generation

These commit types map to [semantic-release](https://semantic-release.gitbook.io/) and [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) conventions:

- `feat` → **minor** version bump
- `fix`, `perf` → **patch** version bump
- `BREAKING CHANGE` → **major** version bump
- All other types → no version bump, omitted from changelog (unless explicitly configured)
