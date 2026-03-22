# Changelog

All notable changes to Travel Map are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).


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
