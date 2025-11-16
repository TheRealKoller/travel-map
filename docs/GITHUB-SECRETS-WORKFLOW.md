# GitHub Secrets Workflow Diagram

## Overview

This document visualizes how GitHub Secrets are used during the deployment process.

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      1. Developer pushes to main                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   2. GitHub Actions Workflow Starts                  │
│                    (.github/workflows/deploy.yml)                    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         3. Run Tests First                           │
│                    (Workflow uses .env.example)                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼ Tests Pass
┌─────────────────────────────────────────────────────────────────────┐
│                      4. Setup Build Environment                      │
│                      - Install PHP dependencies                      │
│                      - Install Node dependencies                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      5. Build Production Assets                      │
│                          npm run build                               │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  6. Generate .env from Secrets                       │
│                                                                       │
│  GitHub Secrets (Encrypted) ──────────┐                             │
│   • APP_NAME                           │                             │
│   • APP_KEY                            │                             │
│   • DB_PASSWORD                        │  Injected into              │
│   • MAIL_PASSWORD                      │  workflow as                │
│   • ... (~44 secrets total)            │  ${{ secrets.* }}           │
│                                        │                             │
│                                        ▼                             │
│                          cat > .env << 'EOF'                         │
│                          APP_NAME="${{ secrets.APP_NAME }}"          │
│                          APP_KEY="${{ secrets.APP_KEY }}"            │
│                          DB_PASSWORD="${{ secrets.DB_PASSWORD }}"    │
│                          ...                                         │
│                          EOF                                         │
│                                                                       │
│  Result: Fresh .env file with all secrets ───► .env (file created)  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   7. Create Deployment Package                       │
│                                                                       │
│  Files Included:                                                     │
│   • Application code (PHP)                                           │
│   • Built assets (JS/CSS in public/build/)                           │
│   • Composer dependencies (vendor/)                                  │
│   • .env file (generated from secrets) ◄── NEW!                     │
│                                                                       │
│  Files Excluded:                                                     │
│   • .env.example                                                     │
│   • .env.testing                                                     │
│   • tests/                                                           │
│   • node_modules/                                                    │
│                                                                       │
│  Package created as: deployment.zip (~21MB compressed)               │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     8. Upload via SFTP to Server                     │
│                                                                       │
│  GitHub Actions Runner ─────► deployment.zip ─────► all-inkl.com    │
│                          (Single file upload)                        │
│                          (Fast & reliable)                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    9. Extract on Server via SSH                      │
│                                                                       │
│  Server Actions:                                                     │
│  1. Backup old .env if exists:                                       │
│     cp .env .env.backup.20250116_123456                             │
│                                                                       │
│  2. Extract deployment.zip:                                          │
│     unzip -q -o deployment.zip                                       │
│                                                                       │
│  3. Verify .env exists:                                              │
│     if [ ! -f .env ]; then                                           │
│       echo "ERROR: .env not found!"                                  │
│       exit 1                                                         │
│     fi                                                               │
│                                                                       │
│  4. Set permissions:                                                 │
│     chmod -R 755 storage bootstrap/cache                             │
│                                                                       │
│  5. Optimize caches:                                                 │
│     php artisan optimize:clear                                       │
│     php artisan config:cache                                         │
│     php artisan route:cache                                          │
│     php artisan view:cache                                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     10. Deployment Complete ✅                       │
│                                                                       │
│  Production Server State:                                            │
│   • All application files updated                                    │
│   • Fresh .env with latest secrets from GitHub                       │
│   • Old .env backed up with timestamp                                │
│   • Caches optimized                                                 │
│   • Application ready to serve traffic                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Secret Flow Detail

```
GitHub Repository Settings
  │
  ├─ Secrets and variables
  │    │
  │    ├─ Actions
  │    │    │
  │    │    ├─ Repository secrets (Encrypted at rest)
  │    │    │    │
  │    │    │    ├─ APP_NAME: "Travel Map"
  │    │    │    ├─ APP_KEY: "base64:..."
  │    │    │    ├─ DB_PASSWORD: "secure_password"
  │    │    │    └─ ... (~44 total secrets)
  │    │    │
  │    │    └─ Available to workflow as: ${{ secrets.SECRET_NAME }}
  │    │
  │    └─ Only accessible to GitHub Actions workflows
  │
  ▼
Workflow Execution (GitHub Actions Runner)
  │
  ├─ Secret values injected into workflow environment
  │   (Never logged, never shown in output)
  │
  ├─ Generate .env file using these values
  │   cat > .env << 'EOF'
  │   APP_NAME="${{ secrets.APP_NAME }}"
  │   APP_KEY="${{ secrets.APP_KEY }}"
  │   ...
  │   EOF
  │
  └─ .env file created with actual values (not visible in logs)
       │
       ▼
  Included in deployment.zip
       │
       ▼
  Uploaded to production server
       │
       ▼
  Extracted on server as /path/to/.env
       │
       ▼
  Laravel application reads from .env at runtime
```

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│ Layer 1: GitHub Secrets Storage (Encrypted at Rest)            │
│  • AES-256-GCM encryption                                       │
│  • Only accessible to repository administrators                │
│  • Cannot be read via API, only set/update                      │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 2: GitHub Actions Runtime (Encrypted in Transit)         │
│  • Secrets injected into workflow environment                   │
│  • Automatically redacted from logs                             │
│  • TLS/HTTPS for all GitHub API communication                   │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 3: SFTP Upload (Encrypted in Transit)                    │
│  • SSH/SFTP protocol with encryption                            │
│  • deployment.zip contains .env file                            │
│  • Only transferred once per deployment                         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│ Layer 4: Production Server (File System Permissions)           │
│  • .env file with 644 permissions (read by web server only)    │
│  • Not accessible via web (outside public/ directory)           │
│  • Laravel reads secrets at runtime                             │
└────────────────────────────────────────────────────────────────┘
```

## Comparison: Before vs After

### Before (Manual .env Management)

```
Developer/Admin ──► SSH to Server ──► Edit .env manually ──► Save
                                            │
                                            ├─ Easy to make typos
                                            ├─ No version control
                                            ├─ No audit trail
                                            ├─ Requires server access
                                            └─ Manual sync between environments
```

### After (GitHub Secrets)

```
Developer/Admin ──► GitHub Settings ──► Update Secret ──► Automatic Deployment
                          │                                       │
                          ├─ Version controlled                   ├─ .env generated
                          ├─ Encrypted storage                    ├─ Automated sync
                          ├─ Audit trail                          ├─ Consistent values
                          ├─ No server access needed              └─ No manual errors
                          └─ Centralized management
```

## Benefits Visualization

```
                      Security ↑
                           │
                           │ • Encrypted storage
                           │ • No plaintext secrets in repo
                           │ • Audit trail
                           │
     ─────────────────────┼─────────────────────
                           │
                           │ • Auto-generation
    Automation ◄───────────┼───────────► Reliability
                           │                 │
                           │                 • Always uses latest values
                           │                 • Deployment verification
                           │                 • Timestamped backups
                           │
                    Maintainability ↓
                           │
                           • No manual server edits
                           • Version controlled config
                           • Centralized management
```

## Rollback Process

If something goes wrong:

```
1. Option A: Redeploy previous version
   Git Revert ──► Push to main ──► Auto-deploy ──► Previous .env generated

2. Option B: Manual rollback on server
   SSH to Server ──► Copy backup ──► Restore
   cp .env.backup.20250116_123456 .env
```

## Updating Secrets Workflow

```
1. Admin updates secret in GitHub
   GitHub Settings ──► Actions Secrets ──► Edit ──► Save
                                                      │
                                                      ▼
2. New secret value encrypted and stored
   GitHub Backend ──► Encrypt ──► Store ──► Ready for next deployment
                                              │
                                              ▼
3. Next deployment uses new value
   Push to main ──► Workflow runs ──► New .env generated ──► Deployed
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Secret Storage** | Server filesystem | GitHub encrypted storage |
| **Updates** | Manual SSH + edit | GitHub UI |
| **Deployment** | Restore old .env | Generate fresh .env |
| **Version Control** | ❌ No | ✅ Yes (via GitHub) |
| **Audit Trail** | ❌ No | ✅ Yes (GitHub logs) |
| **Automation** | ❌ Manual | ✅ Automatic |
| **Security** | 🟡 Moderate | 🟢 High |
| **Human Error Risk** | 🔴 High | 🟢 Low |
| **Rollback** | Manual restore | Redeploy or use backup |

## Documentation Structure

```
docs/
  ├─ GITHUB-SECRETS.md
  │   └─ Comprehensive guide (11KB)
  │       ├─ All 44 secrets documented
  │       ├─ Production examples
  │       ├─ Security best practices
  │       └─ Troubleshooting
  │
  ├─ SECRETS-SETUP-QUICK-START.md
  │   └─ Quick reference (4.6KB)
  │       ├─ Checklist of all secrets
  │       ├─ Copy-paste template
  │       └─ Basic troubleshooting
  │
  ├─ GITHUB-SECRETS-WORKFLOW.md (This file)
  │   └─ Visual workflow diagrams
  │
  └─ DEPLOYMENT.md
      └─ Main deployment guide
          └─ References both guides above
```

---

**Last Updated:** November 2025  
**Workflow Version:** v1.0  
**Status:** ✅ Production Ready
