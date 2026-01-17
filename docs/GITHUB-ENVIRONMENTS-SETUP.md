# GitHub Environments Setup Guide

Diese Anleitung beschreibt, wie GitHub Secrets und Variables für die DEV- und PROD-Umgebungen konfiguriert werden müssen.

## Übersicht

Das Travel Map Projekt verwendet zwei separate Deployment-Umgebungen:

- **DEV (Development)**: https://dev.travelmap.koller.dk/
  - Automatisches Deployment bei Push auf `main` Branch
  - Für Tests und Entwicklung
  
- **PROD (Production)**: https://travelmap.koller.dk/
  - Nur manuelles Deployment über GitHub Actions
  - Für den Live-Betrieb

## Umgebungen in GitHub einrichten

### Schritt 1: Environments erstellen

1. Gehe zu deinem Repository auf GitHub
2. Navigiere zu **Settings** → **Environments**
3. Erstelle zwei Environments:
   - `development` (für DEV)
   - `production` (für PROD)

### Schritt 2: Environment Protection Rules (optional)

Für **production** Environment solltest du folgende Schutzregeln aktivieren:

1. Klicke auf das **production** Environment
2. Aktiviere **Required reviewers** (mindestens 1 Person)
3. Optional: Aktiviere **Wait timer** (z.B. 5 Minuten Wartezeit vor Deployment)

Für **development** Environment können die Schutzregeln weniger streng sein oder ganz weggelassen werden.

## Secrets konfigurieren

Secrets sind sensible Daten wie Passwörter, API Keys und Verschlüsselungsschlüssel. Diese müssen für **beide** Environments separat konfiguriert werden.

### Secrets für DEV Environment

Navigiere zu: **Settings → Environments → development → Environment secrets**

| Secret Name | Beschreibung | Beispielwert |
|------------|--------------|--------------|
| `APP_KEY` | Laravel Verschlüsselungsschlüssel | `base64:generierter_schlüssel` |
| `DB_PASSWORD` | Datenbank Passwort für DEV | `dev_db_password` |
| `MAIL_PASSWORD` | SMTP Passwort für DEV | `dev_mail_password` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API Token | `pk.eyJ1...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | `AIza...` |
| `LECHAT_API_KEY` | Le Chat API Key | `your_lechat_key` |
| `LECHAT_MARKER_ENRICHMENT_AGENT_ID` | Le Chat Agent ID für Marker | `ag_xxx` |
| `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID` | Le Chat Agent ID für Empfehlungen | `ag_yyy` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key (optional) | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key (optional) | `wJalrXUtnFEMI...` |

### Secrets für PROD Environment

Navigiere zu: **Settings → Environments → production → Environment secrets**

| Secret Name | Beschreibung | Beispielwert |
|------------|--------------|--------------|
| `APP_KEY` | Laravel Verschlüsselungsschlüssel (UNTERSCHIEDLICH zu DEV!) | `base64:anderer_schlüssel` |
| `DB_PASSWORD` | Datenbank Passwort für PROD | `prod_db_password` |
| `MAIL_PASSWORD` | SMTP Passwort für PROD | `prod_mail_password` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox API Token | `pk.eyJ1...` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API Key | `AIza...` |
| `LECHAT_API_KEY` | Le Chat API Key | `your_lechat_key` |
| `LECHAT_MARKER_ENRICHMENT_AGENT_ID` | Le Chat Agent ID für Marker | `ag_xxx` |
| `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID` | Le Chat Agent ID für Empfehlungen | `ag_yyy` |
| `AWS_ACCESS_KEY_ID` | AWS Access Key (optional) | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Key (optional) | `wJalrXUtnFEMI...` |

**Wichtig:** 
- Verwende **unterschiedliche** `APP_KEY` Werte für DEV und PROD!
- Verwende **unterschiedliche** Datenbank-Passwörter für DEV und PROD!

### APP_KEY generieren

Generiere separate APP_KEYs für DEV und PROD:

```bash
# Für DEV
php artisan key:generate --show

# Für PROD (führe den Befehl nochmal aus für einen anderen Schlüssel)
php artisan key:generate --show
```

Kopiere jeweils den Output (z.B., `base64:xxxxxxxxxxxxxxxxxxxxx`) und füge ihn als Secret hinzu.

## Variables konfigurieren

Variables sind nicht-sensible Konfigurationswerte wie Hostnamen, Ports, Feature Flags etc. Diese müssen ebenfalls für **beide** Environments separat konfiguriert werden.

### Variables für DEV Environment

Navigiere zu: **Settings → Environments → development → Environment variables**

| Variable Name | Beschreibung | DEV Wert |
|--------------|--------------|----------|
| `APP_NAME` | Anwendungsname | `Travel Map (DEV)` |
| `APP_ENV` | Umgebung | `development` |
| `APP_DEBUG` | Debug-Modus | `true` |
| `APP_URL` | Anwendungs-URL | `https://dev.travelmap.koller.dk` |
| `DB_CONNECTION` | Datenbank-Treiber | `mysql` |
| `DB_HOST` | Datenbank-Host | `localhost` |
| `DB_PORT` | Datenbank-Port | `3306` |
| `DB_DATABASE` | Datenbank-Name | `dev_travelmap_db` |
| `DB_USERNAME` | Datenbank-Benutzername | `dev_db_user` |
| `MAIL_MAILER` | Mail-Treiber | `smtp` |
| `MAIL_SCHEME` | Mail-Schema | `null` |
| `MAIL_HOST` | SMTP-Host | `smtp.kasserver.com` |
| `MAIL_PORT` | SMTP-Port | `587` |
| `MAIL_USERNAME` | SMTP-Benutzername | `dev@travelmap.koller.dk` |
| `MAIL_FROM_ADDRESS` | Absender E-Mail | `noreply@dev.travelmap.koller.dk` |
| `MAIL_FROM_NAME` | Absender Name | `${APP_NAME}` |
| `AWS_DEFAULT_REGION` | AWS Region (optional) | `eu-central-1` |
| `AWS_BUCKET` | AWS Bucket (optional) | `` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | AWS Path Style (optional) | `false` |
| `VITE_APP_NAME` | Vite App Name | `${APP_NAME}` |

### Variables für PROD Environment

Navigiere zu: **Settings → Environments → production → Environment variables**

| Variable Name | Beschreibung | PROD Wert |
|--------------|--------------|-----------|
| `APP_NAME` | Anwendungsname | `Travel Map` |
| `APP_ENV` | Umgebung | `production` |
| `APP_DEBUG` | Debug-Modus | `false` |
| `APP_URL` | Anwendungs-URL | `https://travelmap.koller.dk` |
| `DB_CONNECTION` | Datenbank-Treiber | `mysql` |
| `DB_HOST` | Datenbank-Host | `localhost` |
| `DB_PORT` | Datenbank-Port | `3306` |
| `DB_DATABASE` | Datenbank-Name | `prod_travelmap_db` |
| `DB_USERNAME` | Datenbank-Benutzername | `prod_db_user` |
| `MAIL_MAILER` | Mail-Treiber | `smtp` |
| `MAIL_SCHEME` | Mail-Schema | `null` |
| `MAIL_HOST` | SMTP-Host | `smtp.kasserver.com` |
| `MAIL_PORT` | SMTP-Port | `587` |
| `MAIL_USERNAME` | SMTP-Benutzername | `mail@travelmap.koller.dk` |
| `MAIL_FROM_ADDRESS` | Absender E-Mail | `noreply@travelmap.koller.dk` |
| `MAIL_FROM_NAME` | Absender Name | `${APP_NAME}` |
| `AWS_DEFAULT_REGION` | AWS Region (optional) | `eu-central-1` |
| `AWS_BUCKET` | AWS Bucket (optional) | `` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | AWS Path Style (optional) | `false` |
| `VITE_APP_NAME` | Vite App Name | `${APP_NAME}` |

**Wichtig:**
- `APP_DEBUG` sollte in PROD immer `false` sein!
- Verwende unterschiedliche Datenbanknamen für DEV und PROD!
- Verwende unterschiedliche E-Mail-Adressen für DEV und PROD!

## Deployment Secrets (Repository-Level)

Diese Secrets werden für den SFTP-Upload zu den Servern benötigt und sollten auf **Repository-Ebene** (nicht Environment-Ebene) konfiguriert werden, wenn beide Environments auf demselben Server liegen.

Falls DEV und PROD auf **unterschiedlichen Servern** liegen, müssen diese Secrets als **Environment Secrets** für jedes Environment separat konfiguriert werden.

### Variante A: Beide auf demselben Server (Repository Secrets)

Navigiere zu: **Settings → Secrets and variables → Actions → Repository secrets**

| Secret Name | Beschreibung | Beispielwert |
|------------|--------------|--------------|
| `SSH_HOST` | SSH Server Hostname | `ssh.kasserver.com` |
| `SSH_USERNAME` | SSH Benutzername | `w00b3df6` |
| `SSH_PASSWORD` | SSH Passwort | `dein_ssh_passwort` |
| `SFTP_SSH_PRIVATE_KEY` | SSH Private Key (optional) | `-----BEGIN RSA...` |

**DEV Remote Path** (als Environment Secret in `development`):
- Secret Name: `SSH_REMOTE_PATH`
- Wert: `/www/htdocs/w00b3df6/dev.travelmap.koller.dk`

**PROD Remote Path** (als Environment Secret in `production`):
- Secret Name: `SSH_REMOTE_PATH`
- Wert: `/www/htdocs/w00b3df6/travelmap.koller.dk`

### Variante B: Unterschiedliche Server (Environment Secrets)

Wenn DEV und PROD auf unterschiedlichen Servern liegen, konfiguriere alle SSH-Secrets als **Environment Secrets** für jedes Environment separat:

**DEV Environment Secrets:**
- `SSH_HOST`: z.B. `dev-ssh.kasserver.com`
- `SSH_USERNAME`: z.B. `dev_user`
- `SSH_PASSWORD`: z.B. `dev_password`
- `SSH_REMOTE_PATH`: z.B. `/www/htdocs/dev_user/dev.travelmap.koller.dk`
- `SFTP_SSH_PRIVATE_KEY` (optional)

**PROD Environment Secrets:**
- `SSH_HOST`: z.B. `ssh.kasserver.com`
- `SSH_USERNAME`: z.B. `prod_user`
- `SSH_PASSWORD`: z.B. `prod_password`
- `SSH_REMOTE_PATH`: z.B. `/www/htdocs/prod_user/travelmap.koller.dk`
- `SFTP_SSH_PRIVATE_KEY` (optional)

## Workflows

### DEV Deployment

Der DEV-Deployment Workflow (`.github/workflows/deploy-dev.yml`) wird automatisch ausgelöst:
- Bei jedem Push auf den `main` Branch
- Kann auch manuell über GitHub Actions ausgelöst werden

```
Push to main → Tests → Build → Deploy to DEV
```

### PROD Deployment

Der PROD-Deployment Workflow (`.github/workflows/deploy-prod.yml`) muss **manuell** ausgelöst werden:

1. Gehe zu **Actions** Tab
2. Wähle **Deploy to PROD** Workflow
3. Klicke auf **Run workflow**
4. Wähle den Branch (normalerweise `main`)
5. Klicke auf **Run workflow**

```
Manual trigger → Tests → Build → Deploy to PROD
```

## Checkliste: Ersteinrichtung

### 1. Environments erstellen
- [ ] `development` Environment erstellt
- [ ] `production` Environment erstellt
- [ ] Protection Rules für `production` konfiguriert (optional)

### 2. DEV Secrets konfigurieren
- [ ] `APP_KEY` (neu generiert für DEV)
- [ ] `DB_PASSWORD`
- [ ] `MAIL_PASSWORD`
- [ ] `MAPBOX_ACCESS_TOKEN`
- [ ] `GOOGLE_MAPS_API_KEY`
- [ ] `LECHAT_API_KEY`
- [ ] `LECHAT_MARKER_ENRICHMENT_AGENT_ID`
- [ ] `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`
- [ ] `AWS_ACCESS_KEY_ID` (optional)
- [ ] `AWS_SECRET_ACCESS_KEY` (optional)

### 3. DEV Variables konfigurieren
- [ ] `APP_NAME`
- [ ] `APP_ENV` = `development`
- [ ] `APP_DEBUG` = `true`
- [ ] `APP_URL` = `https://dev.travelmap.koller.dk`
- [ ] `DB_CONNECTION`, `DB_HOST`, `DB_PORT`
- [ ] `DB_DATABASE`, `DB_USERNAME`
- [ ] `MAIL_*` Variablen
- [ ] `AWS_*` Variablen (optional)
- [ ] `VITE_APP_NAME`

### 4. PROD Secrets konfigurieren
- [ ] `APP_KEY` (neu generiert für PROD, unterschiedlich zu DEV!)
- [ ] `DB_PASSWORD`
- [ ] `MAIL_PASSWORD`
- [ ] `MAPBOX_ACCESS_TOKEN`
- [ ] `GOOGLE_MAPS_API_KEY`
- [ ] `LECHAT_API_KEY`
- [ ] `LECHAT_MARKER_ENRICHMENT_AGENT_ID`
- [ ] `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`
- [ ] `AWS_ACCESS_KEY_ID` (optional)
- [ ] `AWS_SECRET_ACCESS_KEY` (optional)

### 5. PROD Variables konfigurieren
- [ ] `APP_NAME`
- [ ] `APP_ENV` = `production`
- [ ] `APP_DEBUG` = `false`
- [ ] `APP_URL` = `https://travelmap.koller.dk`
- [ ] `DB_CONNECTION`, `DB_HOST`, `DB_PORT`
- [ ] `DB_DATABASE`, `DB_USERNAME`
- [ ] `MAIL_*` Variablen
- [ ] `AWS_*` Variablen (optional)
- [ ] `VITE_APP_NAME`

### 6. Deployment Secrets konfigurieren
- [ ] `SSH_HOST` (Repository oder Environment Secret)
- [ ] `SSH_USERNAME` (Repository oder Environment Secret)
- [ ] `SSH_PASSWORD` (Repository oder Environment Secret)
- [ ] `SSH_REMOTE_PATH` für DEV (Environment Secret)
- [ ] `SSH_REMOTE_PATH` für PROD (Environment Secret)
- [ ] `SFTP_SSH_PRIVATE_KEY` (optional)

### 7. Server vorbereiten

**DEV Server:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/dev.travelmap.koller.dk

# Verzeichnisstruktur erstellen
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache
chmod -R 755 storage bootstrap/cache

# Datenbank erstellen (via KAS Panel)
# DEV: dev_travelmap_db
```

**PROD Server:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/travelmap.koller.dk

# Verzeichnisstruktur erstellen
mkdir -p storage/{app,framework/{cache,sessions,views},logs}
mkdir -p bootstrap/cache
chmod -R 755 storage bootstrap/cache

# Datenbank erstellen (via KAS Panel)
# PROD: prod_travelmap_db
```

### 8. Erstes Deployment testen

**DEV:**
1. Push eine Änderung auf `main` Branch
2. Überprüfe GitHub Actions Logs
3. Teste die DEV-Website: https://dev.travelmap.koller.dk/

**PROD:**
1. Gehe zu **Actions** → **Deploy to PROD**
2. Klicke auf **Run workflow**
3. Überprüfe GitHub Actions Logs
4. Teste die PROD-Website: https://travelmap.koller.dk/

### 9. Nach erstem Deployment

**DEV Server:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/dev.travelmap.koller.dk

# Datenbank migrieren
php artisan migrate --force

# Cache optimieren
php artisan optimize
```

**PROD Server:**
```bash
ssh dein_user@ssh.kasserver.com
cd /www/htdocs/dein_user/travelmap.koller.dk

# Datenbank migrieren
php artisan migrate --force

# Cache optimieren
php artisan optimize
```

## Troubleshooting

### Secret nicht gefunden

Wenn ein "Secret not found" Fehler auftritt:
1. Prüfe, ob das Secret im richtigen Environment konfiguriert ist (development/production)
2. Prüfe die Schreibweise (case-sensitive)
3. Prüfe, ob das Secret wirklich gespeichert wurde (klicke auf den Secret-Namen)

### .env Datei nicht erstellt

Wenn die .env Datei nicht auf dem Server ankommt:
1. Prüfe die Deployment-Logs im "Generate production .env file" Schritt
2. Prüfe, ob alle referenzierten Secrets existieren
3. Prüfe, ob die ZIP-Extraktion erfolgreich war

### Deployment-Fehler

Bei Deployment-Fehlern:
1. Prüfe die GitHub Actions Logs
2. Prüfe die Laravel Logs auf dem Server: `tail -f storage/logs/laravel.log`
3. Prüfe die Berechtigungen: `ls -la storage/`
4. Leere den Cache: `php artisan optimize:clear`

### Unterschiede zwischen DEV und PROD

| Aspekt | DEV | PROD |
|--------|-----|------|
| URL | dev.travelmap.koller.dk | travelmap.koller.dk |
| APP_ENV | development | production |
| APP_DEBUG | true | false |
| Deployment | Automatisch bei Push auf main | Nur manuell |
| Datenbank | dev_travelmap_db | prod_travelmap_db |
| APP_KEY | Eigener Schlüssel | Eigener Schlüssel |

## Sicherheitshinweise

1. **Niemals** Secrets im Code committen
2. Verwende **unterschiedliche** `APP_KEY` für DEV und PROD
3. Verwende **unterschiedliche** Datenbank-Passwörter für DEV und PROD
4. Setze `APP_DEBUG=false` in PROD
5. Aktiviere Protection Rules für das PROD Environment
6. Rotiere Secrets regelmäßig (alle 6-12 Monate)
7. Beschränke Zugriff auf GitHub Repository auf notwendige Personen

## Weitere Ressourcen

- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Laravel Configuration](https://laravel.com/docs/configuration)
- [Laravel Deployment](https://laravel.com/docs/deployment)
