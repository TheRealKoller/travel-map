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
- **Tests**: Unit and Feature Tests (Pest)
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
- Code Coverage Reports

### 🚀 Deploy to DEV
**Datei:** `.github/workflows/deploy-dev.yml`  
**Trigger:** Push auf `main` oder manuell  
**Environment:** `development`  
**Target:** https://dev.travelmap.koller.dk/

**Pipeline:**
```
Tests → Build → Package → SFTP Upload → Post-Deploy
```

**Schritte:**
1. ✅ Tests ausführen
2. 🔨 Production Assets bauen
3. 📝 .env aus GitHub Secrets generieren
4. 📦 Deployment-Paket erstellen (ZIP)
5. 📤 Upload zur DEV-Umgebung via SFTP
6. 🔓 Auf Server entpacken
7. ⚙️ Post-Deployment Commands:
   - Berechtigungen setzen
   - Laravel Cache optimieren
   - Optional: Migrationen

### 🚀 Deploy to PROD
**Datei:** `.github/workflows/deploy-prod.yml`  
**Trigger:** Nur manuell  
**Environment:** `production`  
**Target:** https://travelmap.koller.dk/

**Pipeline:**
```
Tests → Build → Package → SFTP Upload → Post-Deploy
```

**Schritte:**
1. ✅ Tests ausführen
2. 🔨 Production Assets bauen
3. 📝 .env aus GitHub Secrets generieren
4. 📦 Deployment-Paket erstellen (ZIP)
5. 📤 Upload zur PROD-Umgebung via SFTP
6. 🔓 Auf Server entpacken
7. ⚙️ Post-Deployment Commands:
   - Berechtigungen setzen
   - Laravel Cache optimieren
   - Optional: Migrationen

**Wichtig:** PROD Deployments müssen immer manuell über GitHub Actions UI ausgelöst werden!

## Erforderliche Secrets und Variables

Für das Deployment müssen Secrets und Variables in GitHub Environments konfiguriert werden.

**Siehe:** [GitHub Environments Setup Guide](./GITHUB-ENVIRONMENTS-SETUP.md)

### DEV Environment (`development`)
- Alle Secrets und Variables für dev.travelmap.koller.dk
- APP_DEBUG=true
- Separate Datenbank

### PROD Environment (`production`)
- Alle Secrets und Variables für travelmap.koller.dk
- APP_DEBUG=false
- Separate Datenbank

### SSH/SFTP Secrets
Entweder auf Repository-Ebene oder Environment-Ebene:

| Secret | Beschreibung | Beispiel |
|--------|--------------|----------|
| `SSH_HOST` | SSH-Hostname | `ssh.kasserver.com` |
| `SSH_USERNAME` | SSH-Benutzername | `w00b3df6` |
| `SSH_PASSWORD` | SSH-Passwort | `***` |
| `SSH_REMOTE_PATH` | Zielverzeichnis | `/www/htdocs/w00b3df6/dev.travelmap.koller.dk` |

## Workflow-Trigger

### Automatisch

- **Push auf `main`**:
  - CI läuft (Lint, Tests, Build)
  - DEV Deploy läuft (nach erfolgreichen Tests)

- **Pull Request auf `main`**:
  - CI läuft (Lint, Tests)
  - Kein Deployment

### Manuell

**DEV Deployment:**
1. Gehe zu **Actions** → **Deploy to DEV**
2. Klicke auf **Run workflow**
3. Wähle Branch: `main`
4. Klicke auf **Run workflow**

**PROD Deployment:**
1. Gehe zu **Actions** → **Deploy to PROD**
2. Klicke auf **Run workflow**
3. Wähle Branch: `main`
4. Klicke auf **Run workflow**
5. Warte auf Bestätigung/Genehmigung (falls konfiguriert)

## Branch-Strategie (GitHub Flow)

```
┌─────────────────────────────────────────┐
│           main (DEV-ready)               │
│    ✅ Tests  🚀 Auto-Deploy to DEV       │
│    🔐 Manual Deploy to PROD              │
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
