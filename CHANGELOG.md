# Changelog

All notable changes to Travel Map are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v1.2.0] - 2026-03-25

### Added
- Add create-pull-request skill for standardized PR workflow

### Fixed
- Use GitHub App for release workflow
- Use GitHub App token in post-merge workflow
- Prevent tag collision in post-merge automation
- Fix ai-review and deploy-dev workflow failures
- Remove checks: write from tests.yml to fix deploy-dev workflow_call

## [v1.1.1] - 2026-03-25

### Fixed
- Use GitHub App for release workflow and post-merge workflow token
- Prevent tag collision in post-merge automation
- Fix AI review and deploy-dev workflow failures by removing checks: write from tests.yml

## [v1.1.1] - 2026-03-25

### Fixed
- Prevent tag collision in post-merge automation
- Use GitHub App token in post-merge workflow
- Fix AI review and deploy-dev workflow failures
- Remove redundant `checks: write` permission from tests workflow to resolve deploy-dev issues

## [v1.1.0] - 2026-03-22

### Added
- Pending migration warning in deploy workflows

## [v1.0.1] - 2026-03-22

### Changed
- Improve CI workflow by triggering deploy-dev after successful CI runs and removing duplicate tests

## [v1.0.0] - 2026-03-22

### Added
- Real-time sync via polling for collaborative trip editing
- Email notification when collaborator is directly added to a trip
- Invitation link expiry and revoke functionality for shared trips
- Trip-sharing viewer role with read-only access
- Collaborator Management UI for shared trips
- Manual public transport route entry and waypoints in route creation
- Alternative transit route selection and adoption
- Trip name display and admin highlight in map toolbar
- E2E browser tests with HTML report in GitHub Actions
- E2E tests for map page, marker visibility, authentication, and trip management

### Changed
- AI-agent-powered CI/CD pipeline (Stages 1–6)

### Fixed
- Workflow permissions for `workflow_call` in deploy and test jobs
- Skip issue-link check for dependabot and copilot PRs
