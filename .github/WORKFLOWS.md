# GitHub Actions Workflows

## Übersicht

Dieses Projekt verwendet **GitHub Flow** mit automatisierten CI/CD Pipelines.

## Workflows

### 🔍 CI (Continuous Integration)
**Datei:** `.github/workflows/ci.yml`  
**Trigger:** Push oder PR auf `main`

**Pipeline:**
```
Lint → Tests → Build
```

- **Lint**: Code-Style Checks (PHP Pint, ESLint, Prettier)
- **Tests**: Unit, Feature und E2E Tests (Pest, Playwright)
- **Build**: Kompiliert Assets (nur bei Push auf main)

### 🧹 Lint
**Datei:** `.github/workflows/lint.yml`  
**Trigger:** Von CI aufgerufen oder manuell

**Checks:**
- PHP Code Style (Laravel Pint)
- TypeScript/JavaScript (ESLint)
- Code Formatting (Prettier)

### ✅ Tests
**Datei:** `.github/workflows/tests.yml`  
**Trigger:** Von CI/Deploy aufgerufen oder manuell

**Tests:**
- PHPUnit/Pest Tests (Unit + Feature)
- Playwright E2E Tests
- Code Coverage Reports

### 🚀 Deploy
**Datei:** `.github/workflows/deploy.yml`  
**Trigger:** Push auf `main` oder manuell

**Pipeline:**
```
Tests → Build → Package → SFTP Upload → Post-Deploy
```

**Schritte:**
1. ✅ Tests ausführen
2. 🔨 Production Assets bauen
3. 📦 Deployment-Paket erstellen
4. 📤 Upload zu all-inkl.com via SFTP
5. ⚙️ Post-Deployment Commands:
   - Berechtigungen setzen
   - Laravel Cache optimieren
   - Optional: Migrationen

## Erforderliche Secrets

Für das Deployment müssen folgende Secrets konfiguriert werden:

| Secret | Beschreibung | Beispiel |
|--------|--------------|----------|
| `SFTP_HOST` | SSH-Hostname | `ssh.kasserver.com` |
| `SFTP_USERNAME` | SSH-Benutzername | `kas123456` |
| `SFTP_PASSWORD` | SSH-Passwort | `***` |
| `SFTP_REMOTE_PATH` | Zielverzeichnis | `/www/htdocs/kas123456/public_html` |

## Workflow-Trigger

### Automatisch

- **Push auf `main`**:
  - CI läuft (Lint, Tests, Build)
  - Deploy läuft (nach erfolgreichen Tests)

- **Pull Request auf `main`**:
  - CI läuft (Lint, Tests)
  - Kein Deployment

### Manuell

Alle Workflows können manuell gestartet werden:

1. Gehe zu **Actions**
2. Wähle den Workflow
3. Klicke auf **Run workflow**
4. Wähle den Branch
5. Klicke auf **Run workflow**

## Branch-Strategie (GitHub Flow)

```
┌─────────────────────────────────────────┐
│           main (Production)              │
│    ✅ Tests  🚀 Auto-Deploy              │
└─────────────────────────────────────────┘
           ↑               ↑
           │               │
      Pull Request    Pull Request
           │               │
    ┌──────────┐    ┌──────────┐
    │ feature/ │    │ feature/ │
    │   login  │    │   maps   │
    └──────────┘    └──────────┘
```

### Workflow für Features

1. **Branch erstellen:**
   ```bash
   git checkout -b feature/neue-funktion
   ```

2. **Code entwickeln:**
   ```bash
   git add .
   git commit -m "Add: Neue Funktion"
   git push origin feature/neue-funktion
   ```

3. **Pull Request erstellen:**
   - Base: `main`
   - Compare: `feature/neue-funktion`
   - CI-Checks abwarten

4. **Merge nach Review:**
   - Nach erfolgreichen CI-Checks
   - Nach Code-Review (optional)
   - Automatisches Deployment startet

## Fehlerbehandlung

### CI-Fehler bei PR

Wenn CI fehlschlägt:
1. Prüfe die Logs im PR
2. Fixe die Fehler lokal
3. Push den Fix zum Feature-Branch
4. CI läuft automatisch erneut

### Deployment-Fehler

Wenn Deployment fehlschlägt:
1. Prüfe die Logs in **Actions**
2. Häufige Ursachen:
   - SFTP-Credentials falsch
   - Berechtigungen auf Server
   - Disk Space voll
3. Nach Fix: Manuelles Re-Deployment starten

## Monitoring

### Status Badges

Füge zu `README.md` hinzu:

```markdown
![CI](https://github.com/username/repo/workflows/CI/badge.svg)
![Tests](https://github.com/username/repo/workflows/tests/badge.svg)
![Deploy](https://github.com/username/repo/workflows/Deploy%20to%20Production/badge.svg)
```

### Deployment-Status

Nach jedem Deployment wird ein Summary erstellt:
- **Actions** → **Deploy to Production** → Letzter Run → **Summary**

## Best Practices

✅ **DO:**
- Immer Feature-Branches verwenden
- Pull Requests für alle Änderungen erstellen
- Auf erfolgreiche CI-Checks warten
- Code-Reviews durchführen
- Tests lokal vor Push ausführen

❌ **DON'T:**
- Direkt auf `main` pushen (außer Notfälle)
- Tests überspringen
- Deployment-Secrets committen
- CI-Checks ignorieren

## Lokale Entwicklung

### Tests lokal ausführen

```bash
# PHP Tests
./vendor/bin/pest

# E2E Tests
npm run test:e2e

# Alle Tests
composer test && npm run test:e2e
```

### Linting lokal ausführen

```bash
# PHP
./vendor/bin/pint

# JavaScript/TypeScript
npm run lint
npm run format
```

### Build lokal testen

```bash
# Production Build
npm run build

# Development
npm run dev
```

## Deployment-Historie

Alle Deployments sind dokumentiert:
- **Actions** → **Deploy to Production**
- Zeigt: Commit, Author, Zeit, Status

## Rollback

Bei Problemen nach Deployment:

1. **Option A: Revert Commit**
   ```bash
   git revert HEAD
   git push origin main
   ```
   → Automatisches Re-Deployment mit vorherigem Stand

2. **Option B: Manuelles Re-Deploy**
   - **Actions** → **Deploy to Production**
   - Wähle früheren, funktionierenden Commit
   - **Run workflow**

## Support

- GitHub Actions Dokumentation: https://docs.github.com/en/actions
- Laravel Deployment Guide: https://laravel.com/docs/deployment
- all-inkl.com Docs: https://all-inkl.com/wichtig/anleitungen/
