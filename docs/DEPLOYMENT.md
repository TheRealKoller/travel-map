# Deployment Setup für all-inkl.com (GitHub Flow)

## 📋 Übersicht

Dieses Projekt verwendet **GitHub Flow** als Branching-Strategie mit zwei separaten Deployment-Umgebungen:

### Umgebungen

- **DEV (Development)**: https://dev.travelmap.koller.dk/
  - **`main` Branch** → automatisches DEV-Deployment (nach erfolgreichem Merge)
  - Für Tests und Entwicklung
  - Deployment erfolgt bei jedem Push auf `main`
  
- **PROD (Production)**: https://travelmap.koller.dk/
  - Nur **manuelles Deployment** über GitHub Actions
  - Für Live-Betrieb
  - Deployment muss explizit ausgelöst werden

### Workflow

- **Feature-Branches** für Entwicklung (z.B. `feature/neue-funktion`)
- **Pull Requests** für Code-Reviews und Qualitätssicherung
- **Automatisches DEV-Deployment** bei Push auf `main` (nur wenn alle Tests bestehen)
- **Manuelles PROD-Deployment** über GitHub Actions Interface

## 🚀 Workflow

```
Feature Branch → Pull Request → Code Review → Tests → Merge → DEV Deployment
                                                              ↓
                                                    (Manuell) PROD Deployment
```

## ⚡ Deployment-Optimierung

Das Deployment verwendet ein **ZIP-basiertes Verfahren** für maximale Upload-Geschwindigkeit:

- **Kompression**: ~80MB Deployment-Dateien werden auf ~21MB komprimiert (74% Reduzierung)
- **Single-File Transfer**: 1 ZIP-Datei statt 16.000+ Einzeldateien
- **Geschwindigkeit**: 5-10x schneller als File-by-File SFTP Upload
- **Zuverlässigkeit**: Weniger anfällig für Netzwerkunterbrechungen
- **Prozess**:
  1. Deployment-Paket wird lokal erstellt (vendor + assets + app code)
  2. In ZIP-Archiv komprimiert
  3. Einzelne ZIP-Datei via SFTP hochgeladen
  4. Auf dem Server automatisch entpackt
  5. .env-Datei wird automatisch wiederhergestellt
  6. Berechtigungen gesetzt und Caches optimiert

## 1️⃣ GitHub Secrets und Environments einrichten

### Environment-basierte Konfiguration

Die Anwendung verwendet GitHub Environments (DEV und PROD) zur Verwaltung von Umgebungsvariablen. Jedes Environment hat seine eigenen Secrets und Variables. Die `.env` Datei wird automatisch während des Deployments aus den GitHub Secrets und Variables generiert.

**📖 Vollständige Dokumentation:**
- **[GitHub Environments Setup Guide](GITHUB-ENVIRONMENTS-SETUP.md)** - **HAUPTDOKUMENTATION** für DEV/PROD Setup (empfohlen)
- [Schnellstart für alte Single-Environment Setup](SECRETS-SETUP-QUICK-START.md) - Legacy-Dokumentation
- [Vollständige Secrets Dokumentation](GITHUB-SECRETS.md) - Detaillierte Beschreibung aller Secrets

**Wichtigste Punkte:**
- **Zwei separate Environments**: `development` und `production`
- Jedes Environment hat eigene Secrets und Variables
- `APP_KEY` muss für jedes Environment unterschiedlich sein
- DEV verwendet `APP_DEBUG=true`, PROD verwendet `APP_DEBUG=false`
- **Insgesamt ca. 44 Secrets/Variables** pro Environment (siehe Setup Guide)

### Deployment Secrets (SFTP/SSH)

Die SSH/SFTP Secrets müssen entweder auf Repository-Ebene (wenn beide Environments auf demselben Server liegen) oder auf Environment-Ebene (wenn separate Server verwendet werden) konfiguriert werden.

**Siehe: [GitHub Environments Setup Guide](GITHUB-ENVIRONMENTS-SETUP.md)** für detaillierte Anweisungen.

**Kurzfassung - Gleicher Server:**
- Repository Secrets: `SSH_HOST`, `SSH_USERNAME`, `SSH_PASSWORD`, `SFTP_SSH_PRIVATE_KEY`
- DEV Environment Secret: `SSH_REMOTE_PATH` = `/www/htdocs/w00b3df6/dev.travelmap.koller.dk`
- PROD Environment Secret: `SSH_REMOTE_PATH` = `/www/htdocs/w00b3df6/travelmap.koller.dk`

**Kurzfassung - Unterschiedliche Server:**
- Alle SSH-Secrets als Environment Secrets in jedem Environment separat konfigurieren

## 2️⃣ Server vorbereiten (einmalig)

### SSH-Verbindung testen

```bash
ssh dein_user@ssh.kasserver.com
```

### Verzeichnisstruktur erstellen

**DEV Server:**
```bash
cd /www/htdocs/dein_user/dev.travelmap.koller.dk

# Storage-Verzeichnisse
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache

# Berechtigungen setzen
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

**PROD Server:**
```bash
cd /www/htdocs/dein_user/travelmap.koller.dk

# Storage-Verzeichnisse
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache

# Berechtigungen setzen
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### .env Datei konfigurieren

**Wichtig:** Die `.env` Datei wird jetzt automatisch aus GitHub Secrets generiert!

Du musst **keine manuelle `.env` Datei mehr auf dem Server erstellen**. Bei jedem Deployment wird die `.env` Datei automatisch aus den in GitHub hinterlegten Secrets erstellt und mit deployed.

**Was du stattdessen tun musst:**

1. Alle Umgebungsvariablen als GitHub Secrets hinzufügen (siehe [GITHUB-SECRETS.md](GITHUB-SECRETS.md))
2. Bei jedem Deployment wird automatisch eine `.env` Datei aus diesen Secrets generiert
3. Die alte `.env` Datei wird als Backup gesichert (falls vorhanden)

**Falls du trotzdem manuell eine `.env` Datei erstellen möchtest** (z.B. für das erste Setup vor dem ersten Deployment):

```bash
nano .env
```

**Minimale Produktions-Konfiguration:**

```env
APP_NAME="Travel Map"
APP_ENV=production
APP_KEY=base64:xxx  # Mit php artisan key:generate generiert
APP_DEBUG=false
APP_URL=https://deine-domain.de

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=dein_db_name
DB_USERNAME=dein_db_user
DB_PASSWORD=dein_db_passwort

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

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

**Hinweis:** Diese manuelle `.env` wird beim ersten automatisierten Deployment durch die aus GitHub Secrets generierte Version ersetzt.

### Datenbank erstellen

1. Im **KAS**: **MySQL-Datenbanken** → **Neue Datenbank**
2. Erstelle zwei separate Datenbanken:
   - **DEV**: z.B. `dev_travelmap_db` mit User `dev_db_user`
   - **PROD**: z.B. `prod_travelmap_db` mit User `prod_db_user`
3. Notiere: Datenbankname, User, Passwort für beide Umgebungen
4. Trage die Daten in die entsprechenden GitHub Environment Variables ein (siehe [Setup Guide](GITHUB-ENVIRONMENTS-SETUP.md))

### Domain-Konfiguration

**DEV Domain: dev.travelmap.koller.dk**

**Option A: Domain direkt auf `public` zeigen lassen**
- Im KAS: Domain-Verwaltung → Dokumentenpfad: `/www/htdocs/dein_user/dev.travelmap.koller.dk/public`

**Option B: .htaccess Rewrite**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

**PROD Domain: travelmap.koller.dk**

**Option A: Domain direkt auf `public` zeigen lassen**
- Im KAS: Domain-Verwaltung → Dokumentenpfad: `/www/htdocs/dein_user/travelmap.koller.dk/public`

**Option B: .htaccess Rewrite**
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

## 3️⃣ Erstes Deployment

### DEV Deployment (automatisch)

Push eine Änderung auf den `main` Branch:

```bash
git checkout main
git pull origin main
# Mache eine kleine Änderung
git add .
git commit -m "Trigger DEV deployment"
git push origin main
```

Überprüfe den Deployment-Status unter **Actions** → **Deploy to DEV**

### Nach dem ersten DEV Deployment via SSH:

```bash
cd /www/htdocs/dein_user/dev.travelmap.koller.dk

# Datenbank migrieren
php artisan migrate --force

# Cache optimieren
php artisan optimize
```

### PROD Deployment (manuell)

1. Gehe zu **Actions** → **Deploy to PROD**
2. Klicke auf **Run workflow**
3. Wähle Branch: `main`
4. Klicke auf **Run workflow**

Überprüfe den Deployment-Status in den Actions Logs.

### Nach dem ersten PROD Deployment via SSH:

```bash
cd /www/htdocs/dein_user/travelmap.koller.dk

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

### Automatisches DEV Deployment

Nach dem Merge in `main`:
1. ✅ Tests laufen automatisch
2. 🔨 Assets werden gebaut
3. 📦 Deployment-Paket wird erstellt
4. 🚀 Upload zur DEV-Umgebung via SFTP
5. ⚙️ Post-Deployment Commands (Cache, Permissions)
6. ✅ DEV Deployment abgeschlossen
7. 🌐 Verfügbar unter: https://dev.travelmap.koller.dk/

## 5️⃣ PROD Deployment (Manuell)

PROD Deployments müssen immer manuell ausgelöst werden:

1. **Actions** → **Deploy to PROD**
2. **Run workflow** → Branch: `main` (oder ein anderer Branch wenn nötig)
3. **Run workflow**
4. Warte auf erfolgreichen Deployment
5. 🌐 Verfügbar unter: https://travelmap.koller.dk/

**Wichtig:** 
- PROD wird NIE automatisch deployed
- Du musst den Workflow manuell auslösen
- Stelle sicher, dass alle Tests auf dem Branch bestehen
- Teste die Änderungen zuerst auf DEV

## 6️⃣ Nach jedem Deployment

### Optional: Migrationen ausführen

Wenn DB-Änderungen vorhanden sind:

**DEV:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/dev.travelmap.koller.dk
php artisan migrate --force
```

**PROD:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/travelmap.koller.dk
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

### DEV Deploy Workflow (automatisch bei Push auf main)
- Trigger: Automatisch bei Push auf `main` oder manuell
- Environment: `development`
- Target: https://dev.travelmap.koller.dk/
- Führt zuerst Tests aus
- Baut Production Assets
- Erstellt Deployment-Paket (ZIP-Archiv für schnellen Upload)
- Upload via SFTP zur DEV-Umgebung
- Entpackt und richtet Deployment auf dem Server ein
- Post-Deployment Commands (Berechtigungen, Cache-Optimierung)

### PROD Deploy Workflow (nur manuell)
- Trigger: Nur manuell über GitHub Actions Interface
- Environment: `production`
- Target: https://travelmap.koller.dk/
- Führt zuerst Tests aus
- Baut Production Assets
- Erstellt Deployment-Paket (ZIP-Archiv für schnellen Upload)
- Upload via SFTP zur PROD-Umgebung
- Entpackt und richtet Deployment auf dem Server ein
- Post-Deployment Commands (Berechtigungen, Cache-Optimierung)

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

## 🔀 Alternative Deployment-Methoden (Evaluiert)

### ZIP-basiertes Deployment ✅ (AKTUELL IN VERWENDUNG)

**Vorteile:**
- 5-10x schneller als File-by-File Upload
- 74% Größenreduktion durch Kompression
- Einzelne Datei-Übertragung (weniger fehleranfällig)
- Funktioniert auf Shared Hosting
- Einfache Implementierung

**Nachteile:**
- Benötigt unzip auf dem Server (auf all-inkl.com vorhanden)

### Git-basiertes Deployment (Nicht empfohlen für Shared Hosting)

**Konzept:** Git Repository auf Server klonen und bei jedem Deployment `git pull` ausführen.

**Vorteile:**
- Nur geänderte Dateien werden übertragen
- Versionskontrolle auf dem Server
- Einfaches Rollback möglich

**Nachteile:**
- Erfordert Git auf dem Server
- Benötigt Composer und npm/Node.js auf dem Server
- Build-Prozess müsste auf dem Server laufen (PHP 8.4, Node.js 22)
- Shared Hosting Umgebungen unterstützen dies meist nicht
- Komplexere Wartung

**Fazit:** Nicht geeignet für all-inkl.com Shared Hosting

### Rsync Incremental Sync (Alternative)

**Konzept:** Nur geänderte Dateien via rsync übertragen.

**Vorteile:**
- Nur Deltas werden übertragen
- Integrierte Kompression

**Nachteile:**
- Erstes Deployment genauso langsam wie File-by-File
- Benötigt rsync auf Server und Client
- Nicht wesentlich besser als ZIP für Shared Hosting

**Fazit:** ZIP-Methode bietet bessere Gesamt-Performance

### CI/CD mit Deployment-Tools (z.B. Deployer, Envoyer)

**Konzept:** Spezialisierte PHP Deployment-Tools verwenden.

**Vorteile:**
- Professionelle Deployment-Features (Zero-Downtime, Rollback)
- Atomic Deployments mit Symlinks
- Health Checks

**Nachteile:**
- Erfordert Shell-Zugriff und spezielle Server-Konfiguration
- Atomic Deployments benötigen Symlink-Unterstützung
- Komplexer Setup
- Shared Hosting oft zu eingeschränkt

**Fazit:** Overkill für aktuellen Use-Case und Shared Hosting

## 📞 Support

- **all-inkl.com Support**: support@all-inkl.com
- **KAS Login**: https://kas.all-inkl.com/
- **GitHub Actions Docs**: https://docs.github.com/en/actions
