# Deployment Setup für all-inkl.com (GitHub Flow)

## 📋 Übersicht

Dieses Projekt verwendet **GitHub Flow** als Branching-Strategie:
- **`main` Branch** = Produktionsumgebung (automatisches Deployment nach erfolgreichem Merge)
- **Feature-Branches** für Entwicklung (z.B. `feature/neue-funktion`)
- **Pull Requests** für Code-Reviews und Qualitätssicherung
- **Automatisches Deployment** bei Push auf `main` (nur wenn alle Tests bestehen)

## 🚀 Workflow

```
Feature Branch → Pull Request → Code Review → Tests → Merge → Deployment
```

## 1️⃣ GitHub Secrets einrichten

### Secrets in Repository Settings hinzufügen

Gehe zu: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Beispielwert | Wo zu finden |
|-------------|--------------|--------------|
| `SFTP_HOST` | `ssh.kasserver.com` | KAS → SSH-Zugang |
| `SFTP_USERNAME` | `kas123456` | KAS → SSH-Zugang |
| `SFTP_PASSWORD` | `dein-passwort` | KAS → SSH-Zugang |
| `SFTP_REMOTE_PATH` | `/www/htdocs/kas123456/public_html` | Dein Zielverzeichnis |

### Optional: Environment erstellen

Für bessere Organisation kannst du ein "production" Environment erstellen:

1. **Settings** → **Environments** → **New environment**
2. Name: `production`
3. Füge die Secrets dem Environment hinzu
4. Optional: Aktiviere "Required reviewers" für zusätzliche Sicherheit

## 2️⃣ Server vorbereiten (einmalig)

### SSH-Verbindung testen

```bash
ssh kas123456@ssh.kasserver.com
```

### Verzeichnisstruktur erstellen

```bash
# Hauptverzeichnis
cd /www/htdocs/kas123456/public_html

# Storage-Verzeichnisse
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache

# Berechtigungen setzen
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### .env Datei erstellen

```bash
nano .env
```

**Minimale Produktions-Konfiguration:**

```env
APP_NAME="Travel Map"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://deine-domain.de

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=dein_db_name
DB_USERNAME=dein_db_user
DB_PASSWORD=dein_db_passwort

CACHE_STORE=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

MAIL_MAILER=smtp
MAIL_HOST=smtp.kasserver.com
MAIL_PORT=587
MAIL_USERNAME=mail@deine-domain.de
MAIL_PASSWORD=dein-mail-passwort
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=mail@deine-domain.de
MAIL_FROM_NAME="${APP_NAME}"
```

Speichern: `CTRL+O`, `ENTER`, `CTRL+X`

### Datenbank erstellen

1. Im **KAS**: **MySQL-Datenbanken** → **Neue Datenbank**
2. Notiere: Datenbankname, User, Passwort
3. Trage die Daten in `.env` ein

### Domain-Konfiguration

**Option A: Domain direkt auf `public` zeigen lassen**
- Im KAS: Domain-Verwaltung → Dokumentenpfad: `/www/htdocs/kas123456/public_html/public`

**Option B: .htaccess Rewrite**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

## 3️⃣ Erstes Deployment

### Nach dem ersten Deployment via SSH:

```bash
cd /www/htdocs/kas123456/public_html

# APP_KEY generieren
php artisan key:generate

# Datenbank migrieren
php artisan migrate --force

# Cache optimieren
php artisan optimize
```

## 4️⃣ Entwicklungs-Workflow

### Neue Funktion entwickeln

```bash
# Neuen Feature-Branch erstellen
git checkout -b feature/meine-neue-funktion

# Code schreiben...
git add .
git commit -m "Add: Neue Funktion implementiert"

# Branch pushen
git push origin feature/meine-neue-funktion
```

### Pull Request erstellen

1. Auf GitHub → **Pull requests** → **New pull request**
2. Base: `main`, Compare: `feature/meine-neue-funktion`
3. Beschreibung hinzufügen
4. **Create pull request**
5. Warte auf CI-Checks (Tests, Linting)
6. Optional: Request Review
7. Nach erfolgreichen Tests: **Merge pull request**

### Automatisches Deployment

Nach dem Merge in `main`:
1. ✅ Tests laufen automatisch
2. 🔨 Assets werden gebaut
3. 📦 Deployment-Paket wird erstellt
4. 🚀 Upload zu all-inkl.com via SFTP
5. ⚙️ Post-Deployment Commands (Cache, Permissions)
6. ✅ Deployment abgeschlossen

## 5️⃣ Manuelles Deployment

Falls du manuell deployen möchtest:

1. **Actions** → **Deploy to Production**
2. **Run workflow** → Branch: `main`
3. **Run workflow**

## 6️⃣ Nach jedem Deployment

### Optional: Migrationen ausführen

Wenn DB-Änderungen vorhanden sind:

```bash
ssh kas123456@ssh.kasserver.com
cd /www/htdocs/kas123456/public_html
php artisan migrate --force
```

### Logs prüfen

```bash
# Letzte 50 Zeilen
tail -n 50 storage/logs/laravel.log

# Live-Logs ansehen
tail -f storage/logs/laravel.log
```

## 🔍 Monitoring & Troubleshooting

### Website prüfen

1. Öffne deine Domain im Browser
2. Teste Login/Registration
3. Prüfe alle wichtigen Features

### Bei Fehlern

```bash
# Logs ansehen
tail -f storage/logs/laravel.log

# Cache leeren
php artisan optimize:clear

# Berechtigungen prüfen
ls -la storage/
chmod -R 755 storage
```

### Häufige Probleme

**"500 Server Error"**
```bash
# Logs prüfen
tail storage/logs/laravel.log

# APP_KEY gesetzt?
php artisan key:generate

# Berechtigungen korrekt?
chmod -R 755 storage bootstrap/cache
```

**"Class not found"**
```bash
composer dump-autoload --optimize
php artisan clear-compiled
```

**Assets fehlen**
```bash
# Prüfe ob public/build existiert
ls -la public/build

# Falls nicht, lokal neu bauen und erneut deployen
npm run build
git add public/build
git commit -m "Rebuild assets"
git push
```

## 📊 GitHub Actions Workflows

### CI Workflow (bei jedem Push/PR)
- **Lint**: Code-Style Checks (PHP Pint, ESLint, Prettier)
- **Tests**: Unit, Feature und E2E Tests
- **Build**: Asset-Kompilierung

### Deploy Workflow (nur bei Push auf main)
- Führt zuerst Tests aus
- Baut Production Assets
- Erstellt Deployment-Paket
- Upload via SFTP
- Post-Deployment Commands

## 🔒 Sicherheit

- ✅ `APP_DEBUG=false` in Produktion
- ✅ Starkes `APP_KEY` generiert
- ✅ `.env` nicht im Repository
- ✅ Secrets in GitHub verschlüsselt
- ✅ HTTPS für Domain aktivieren (Let's Encrypt via KAS)

## 📚 Nützliche Befehle

```bash
# Application Status
php artisan about

# Migrationen Status
php artisan migrate:status

# Cache Management
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimierung
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Wartungsmodus
php artisan down --secret="geheimer-token"
php artisan up
```

## 📞 Support

- **all-inkl.com Support**: support@all-inkl.com
- **KAS Login**: https://kas.all-inkl.com/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
