# DEV und PROD Deployment - Schnellanleitung

Diese Anleitung erklärt, wie die neuen DEV- und PROD-Deployments funktionieren und wie sie verwendet werden.

## 🎯 Übersicht

Das Travel Map Projekt verwendet jetzt zwei separate Deployment-Umgebungen:

### DEV (Development)
- **URL:** https://dev.travelmap.koller.dk/
- **Deployment:** Automatisch bei jedem Push auf `main`
- **Zweck:** Test und Entwicklung, Änderungen sofort sehen
- **Environment:** `development`

### PROD (Production)
- **URL:** https://travelmap.koller.dk/
- **Deployment:** Nur manuell über GitHub Actions
- **Zweck:** Live-Betrieb für Endbenutzer
- **Environment:** `production`

## 🚀 Wie funktioniert das Deployment?

### 1. Entwicklung und DEV-Deployment

```
Feature Branch → Pull Request → Code Review → Merge to main → Automatisches DEV Deployment
```

**Workflow:**
1. Du erstellst einen Feature-Branch: `git checkout -b feature/meine-neue-funktion`
2. Du entwickelst deine Änderungen und pushst sie
3. Du erstellst einen Pull Request auf GitHub
4. Nach Code Review und erfolgreichen Tests mergst du in `main`
5. **Sofort danach** wird automatisch auf DEV deployed
6. Du kannst deine Änderungen auf https://dev.travelmap.koller.dk/ testen

### 2. PROD-Deployment (Manuell)

Nachdem du deine Änderungen auf DEV getestet hast und alles funktioniert:

**Workflow:**
1. Gehe zu GitHub → **Actions** Tab
2. Wähle **"Deploy to PROD"** in der linken Sidebar
3. Klicke auf **"Run workflow"** (rechts oben)
4. Wähle Branch: `main` (oder einen anderen Branch wenn nötig)
5. Klicke auf **"Run workflow"**
6. Warte bis das Deployment abgeschlossen ist
7. Deine Änderungen sind jetzt live auf https://travelmap.koller.dk/

## 📋 GitHub Secrets und Variables einrichten

### Schritt 1: Environments erstellen

1. Gehe zu **Settings** → **Environments**
2. Erstelle zwei Environments:
   - `development` (für DEV)
   - `production` (für PROD)

### Schritt 2: Secrets und Variables konfigurieren

**Wichtig:** Jedes Environment braucht seine eigenen Secrets und Variables!

#### Für DEV Environment (`development`):

**Environment Secrets:**
- `APP_KEY` - Generiere mit `php artisan key:generate --show`
- `DB_PASSWORD` - Datenbank-Passwort für DEV-Datenbank
- `MAIL_PASSWORD` - SMTP-Passwort
- `MAPBOX_ACCESS_TOKEN` - Mapbox API Token
- `GOOGLE_MAPS_API_KEY` - Google Maps API Key
- `LECHAT_API_KEY`, `LECHAT_MARKER_ENRICHMENT_AGENT_ID`, `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`
- Optional: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Environment Variables:**
- `APP_NAME` = `Travel Map (DEV)`
- `APP_ENV` = `development`
- `APP_DEBUG` = `true`
- `APP_URL` = `https://dev.travelmap.koller.dk`
- `DB_CONNECTION` = `mysql`
- `DB_HOST` = `localhost`
- `DB_PORT` = `3306`
- `DB_DATABASE` = `dev_travelmap_db` (Name deiner DEV-Datenbank)
- `DB_USERNAME` = `dev_db_user` (DEV-Datenbank User)
- Weitere Mail-, AWS- und Vite-Variablen (siehe vollständige Dokumentation)

**Environment Secret für Remote Path:**
- `SSH_REMOTE_PATH` = `/www/htdocs/w00b3df6/dev.travelmap.koller.dk`

#### Für PROD Environment (`production`):

**Environment Secrets:**
- `APP_KEY` - **Neuen** Schlüssel generieren (unterschiedlich zu DEV!)
- `DB_PASSWORD` - Datenbank-Passwort für PROD-Datenbank
- `MAIL_PASSWORD` - SMTP-Passwort
- `MAPBOX_ACCESS_TOKEN` - Mapbox API Token
- `GOOGLE_MAPS_API_KEY` - Google Maps API Key
- `LECHAT_API_KEY`, `LECHAT_MARKER_ENRICHMENT_AGENT_ID`, `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`
- Optional: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

**Environment Variables:**
- `APP_NAME` = `Travel Map`
- `APP_ENV` = `production`
- `APP_DEBUG` = `false` ⚠️ **Wichtig: In PROD immer false!**
- `APP_URL` = `https://travelmap.koller.dk`
- `DB_CONNECTION` = `mysql`
- `DB_HOST` = `localhost`
- `DB_PORT` = `3306`
- `DB_DATABASE` = `prod_travelmap_db` (Name deiner PROD-Datenbank)
- `DB_USERNAME` = `prod_db_user` (PROD-Datenbank User)
- Weitere Mail-, AWS- und Vite-Variablen (siehe vollständige Dokumentation)

**Environment Secret für Remote Path:**
- `SSH_REMOTE_PATH` = `/www/htdocs/w00b3df6/travelmap.koller.dk`

#### Repository-Level Secrets (für beide Environments):

Navigiere zu: **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**

- `SSH_HOST` = `ssh.kasserver.com`
- `SSH_USERNAME` = `w00b3df6` (dein SSH-Username)
- `SSH_PASSWORD` = `dein-ssh-passwort`
- `SFTP_SSH_PRIVATE_KEY` (optional, wenn du SSH-Keys verwendest)

### Schritt 3: Server vorbereiten

**Auf dem Server müssen zwei separate Verzeichnisse existieren:**

```bash
# SSH-Verbindung herstellen
ssh w00b3df6@ssh.kasserver.com

# DEV-Verzeichnis vorbereiten
cd /www/htdocs/w00b3df6/dev.travelmap.koller.dk
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache
chmod -R 755 storage bootstrap/cache

# PROD-Verzeichnis vorbereiten
cd /www/htdocs/w00b3df6/travelmap.koller.dk
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache
chmod -R 755 storage bootstrap/cache
```

### Schritt 4: Datenbanken erstellen

Im **KAS Panel**:

1. Erstelle zwei separate MySQL-Datenbanken:
   - **DEV**: z.B. `dev_travelmap_db` mit User `dev_db_user`
   - **PROD**: z.B. `prod_travelmap_db` mit User `prod_db_user`
   
2. Notiere dir die Credentials und trage sie in die entsprechenden GitHub Variables ein

### Schritt 5: Domains konfigurieren

Im **KAS Panel** → **Domain-Verwaltung**:

**DEV Domain:**
- Domain: `dev.travelmap.koller.dk`
- Dokumentenpfad: `/www/htdocs/w00b3df6/dev.travelmap.koller.dk/public`

**PROD Domain:**
- Domain: `travelmap.koller.dk`
- Dokumentenpfad: `/www/htdocs/w00b3df6/travelmap.koller.dk/public`

## ✅ Checkliste: Ersteinrichtung

### GitHub Environments
- [ ] `development` Environment erstellt
- [ ] `production` Environment erstellt

### DEV Konfiguration
- [ ] Alle DEV Environment Secrets konfiguriert
- [ ] Alle DEV Environment Variables konfiguriert
- [ ] `SSH_REMOTE_PATH` für DEV konfiguriert
- [ ] DEV-Datenbank im KAS erstellt
- [ ] DEV-Verzeichnis auf Server vorbereitet
- [ ] DEV-Domain konfiguriert

### PROD Konfiguration
- [ ] Alle PROD Environment Secrets konfiguriert
- [ ] Alle PROD Environment Variables konfiguriert
- [ ] `SSH_REMOTE_PATH` für PROD konfiguriert
- [ ] PROD-Datenbank im KAS erstellt
- [ ] PROD-Verzeichnis auf Server vorbereitet
- [ ] PROD-Domain konfiguriert

### Repository Secrets
- [ ] `SSH_HOST` konfiguriert
- [ ] `SSH_USERNAME` konfiguriert
- [ ] `SSH_PASSWORD` konfiguriert

### Erstes Deployment testen
- [ ] Push auf `main` durchgeführt
- [ ] DEV Deployment erfolgreich
- [ ] DEV-Website funktioniert: https://dev.travelmap.koller.dk/
- [ ] Migrations auf DEV ausgeführt: `php artisan migrate --force`
- [ ] Manuelles PROD Deployment durchgeführt
- [ ] PROD-Website funktioniert: https://travelmap.koller.dk/
- [ ] Migrations auf PROD ausgeführt: `php artisan migrate --force`

## 🔧 Häufige Aufgaben

### Änderungen auf DEV testen

```bash
# 1. Feature entwickeln
git checkout -b feature/meine-funktion
# ... Änderungen machen ...
git commit -am "Neue Funktion"
git push origin feature/meine-funktion

# 2. Pull Request erstellen und mergen
# (über GitHub UI)

# 3. Automatisch auf DEV deployed!
# Testen auf: https://dev.travelmap.koller.dk/
```

### Auf PROD deployen

```bash
# 1. Sicherstellen dass main aktuell ist
git checkout main
git pull origin main

# 2. Auf GitHub gehen:
# Actions → Deploy to PROD → Run workflow

# 3. Warten bis Deployment abgeschlossen ist
# Live auf: https://travelmap.koller.dk/
```

### Datenbank-Migrationen ausführen

**Nach DEV Deployment:**
```bash
ssh w00b3df6@ssh.kasserver.com
cd /www/htdocs/w00b3df6/dev.travelmap.koller.dk
php artisan migrate --force
```

**Nach PROD Deployment:**
```bash
ssh w00b3df6@ssh.kasserver.com
cd /www/htdocs/w00b3df6/travelmap.koller.dk
php artisan migrate --force
```

### Logs anschauen

**DEV Logs:**
```bash
ssh w00b3df6@ssh.kasserver.com
tail -f /www/htdocs/w00b3df6/dev.travelmap.koller.dk/storage/logs/laravel.log
```

**PROD Logs:**
```bash
ssh w00b3df6@ssh.kasserver.com
tail -f /www/htdocs/w00b3df6/travelmap.koller.dk/storage/logs/laravel.log
```

## 🐛 Troubleshooting

### DEV Deployment schlägt fehl

1. Prüfe die GitHub Actions Logs
2. Stelle sicher, dass alle DEV Environment Secrets konfiguriert sind
3. Prüfe ob `SSH_REMOTE_PATH` für development korrekt ist
4. Teste SSH-Verbindung: `ssh w00b3df6@ssh.kasserver.com`

### PROD Deployment kann nicht gestartet werden

1. Stelle sicher, dass du den Workflow manuell auslöst (nicht automatisch)
2. Gehe zu **Actions** → **Deploy to PROD** → **Run workflow**
3. Falls "Required reviewers" aktiviert ist, warte auf Genehmigung

### Website zeigt Fehler nach Deployment

**DEV:**
```bash
ssh w00b3df6@ssh.kasserver.com
cd /www/htdocs/w00b3df6/dev.travelmap.koller.dk
php artisan optimize:clear
php artisan optimize
php artisan migrate --force
tail -f storage/logs/laravel.log
```

**PROD:**
```bash
ssh w00b3df6@ssh.kasserver.com
cd /www/htdocs/w00b3df6/travelmap.koller.dk
php artisan optimize:clear
php artisan optimize
php artisan migrate --force
tail -f storage/logs/laravel.log
```

### Unterschied zwischen DEV und PROD vergessen?

| Aspekt | DEV | PROD |
|--------|-----|------|
| URL | dev.travelmap.koller.dk | travelmap.koller.dk |
| Deployment | Automatisch bei Push auf main | Nur manuell |
| APP_ENV | development | production |
| APP_DEBUG | true | false |
| Datenbank | dev_travelmap_db | prod_travelmap_db |
| Zweck | Testen & Entwicklung | Live-Betrieb |

## 📚 Vollständige Dokumentation

Für detailliertere Informationen siehe:

- **[GitHub Environments Setup Guide](./GITHUB-ENVIRONMENTS-SETUP.md)** - Vollständige Setup-Anleitung
- **[Deployment Guide](./DEPLOYMENT.md)** - Deployment-Dokumentation
- **[Branching Strategy](./BRANCHING_STRATEGY.md)** - GitHub Flow Workflow

## 🎉 Zusammenfassung

**Das wichtigste in Kürze:**

1. **Push auf `main`** → Automatisches DEV Deployment → Testen auf dev.travelmap.koller.dk
2. **Alles OK?** → Manuelles PROD Deployment über GitHub Actions → Live auf travelmap.koller.dk
3. **Zwei separate Environments** mit eigenen Secrets, Variables und Datenbanken
4. **DEV** ist zum Testen, **PROD** ist für Endbenutzer

Das war's! 🚀
