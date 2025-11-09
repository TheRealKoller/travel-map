# Deployment Checkliste

## ✅ Einmalige Einrichtung

### GitHub Setup
- [ ] Repository auf GitHub erstellt
- [ ] GitHub Secrets konfiguriert:
  - [ ] `SFTP_HOST`
  - [ ] `SFTP_USERNAME`
  - [ ] `SFTP_PASSWORD`
  - [ ] `SFTP_REMOTE_PATH`
- [ ] Optional: Production Environment erstellt

### all-inkl.com Server
- [ ] KAS-Zugang vorhanden
- [ ] SSH-Zugang aktiviert
- [ ] MySQL-Datenbank erstellt
- [ ] Zielverzeichnis erstellt
- [ ] Storage-Verzeichnisse erstellt:
  - [ ] `storage/app`
  - [ ] `storage/framework/cache`
  - [ ] `storage/framework/sessions`
  - [ ] `storage/framework/views`
  - [ ] `storage/logs`
  - [ ] `bootstrap/cache`
- [ ] Berechtigungen gesetzt (`chmod -R 755 storage bootstrap/cache`)
- [ ] `.env` Datei erstellt und konfiguriert
- [ ] Domain/Subdomain eingerichtet

### Nach erstem Deployment
- [ ] Via SSH auf Server einloggen
- [ ] `php artisan key:generate` ausgeführt
- [ ] `php artisan migrate --force` ausgeführt
- [ ] `php artisan optimize` ausgeführt
- [ ] Website im Browser getestet

---

## 🚀 Workflow für jede neue Funktion

### 1. Feature-Branch erstellen
```bash
git checkout main
git pull
git checkout -b feature/deine-funktion
```

### 2. Code entwickeln
```bash
# Code schreiben...
git add .
git commit -m "Add: Neue Funktion beschreibung"
```

### 3. Tests lokal ausführen
```bash
# PHP Tests
./vendor/bin/pest

# E2E Tests  
npm run test:e2e

# Linting
./vendor/bin/pint
npm run lint
npm run format
```

### 4. Branch pushen
```bash
git push origin feature/deine-funktion
```

### 5. Pull Request erstellen
- [ ] Auf GitHub → **Pull requests** → **New pull request**
- [ ] Base: `main`, Compare: `feature/deine-funktion`
- [ ] Aussagekräftige Beschreibung
- [ ] **Create pull request**
- [ ] Warte auf CI-Checks (Lint, Tests)
- [ ] Bei Fehlern: Fixes pushen
- [ ] Optional: Review anfordern

### 6. Merge & Deploy
- [ ] Nach erfolgreichen Checks: **Merge pull request**
- [ ] **Confirm merge**
- [ ] Deployment läuft automatisch
- [ ] Prüfe Deployment-Status in **Actions**
- [ ] Nach erfolgreichem Deployment: Website testen

### 7. Aufräumen
```bash
git checkout main
git pull
git branch -d feature/deine-funktion
```

---

## 📋 Nach jedem Deployment

### Sofort
- [ ] Deployment-Status in GitHub Actions prüfen
- [ ] Website im Browser öffnen
- [ ] Grundfunktionen testen (Login, Navigation, etc.)

### Falls Datenbank-Änderungen
```bash
ssh kas123456@ssh.kasserver.com
cd /www/htdocs/kas123456/public_html
php artisan migrate --force
```

### Bei Problemen
- [ ] Logs prüfen: `tail -f storage/logs/laravel.log`
- [ ] Cache leeren: `php artisan optimize:clear`
- [ ] Bei kritischen Fehlern: Rollback durchführen

---

## 🔄 Rollback bei Problemen

### Option 1: Git Revert (empfohlen)
```bash
git revert HEAD
git push origin main
# → Automatisches Re-Deployment
```

### Option 2: Manuelles Re-Deploy
- [ ] **Actions** → **Deploy to Production**
- [ ] Wähle funktionierenden Commit
- [ ] **Run workflow**

---

## 🔍 Regelmäßige Wartung

### Wöchentlich
- [ ] Logs prüfen auf Fehler
- [ ] Backup erstellen (Datenbank + Files)
- [ ] Dependencies updaten (security patches)

### Monatlich
- [ ] Disk Space prüfen
- [ ] Performance-Analyse
- [ ] Security-Audit

---

## ⚠️ Notfall-Prozedur

### Website down
1. [ ] Logs prüfen: `tail -f storage/logs/laravel.log`
2. [ ] Server-Status in KAS prüfen
3. [ ] Wartungsmodus: `php artisan down`
4. [ ] Problem fixen
5. [ ] Re-Deploy oder Rollback
6. [ ] `php artisan up`

### Datenbank-Probleme
1. [ ] Verbindung testen: `php artisan tinker` → `DB::connection()->getPdo();`
2. [ ] Credentials in `.env` prüfen
3. [ ] MySQL-Status in KAS prüfen
4. [ ] Bei Beschädigung: Backup wiederherstellen

---

## 📞 Kontakte & Links

- **GitHub Repo**: [Link]
- **Live-Site**: [URL]
- **KAS Login**: https://kas.all-inkl.com/
- **all-inkl Support**: support@all-inkl.com

---

## 💡 Tipps

✅ **Best Practices:**
- Immer Feature-Branches verwenden
- Niemals direkt auf `main` pushen
- Pull Requests für alle Änderungen
- Auf CI-Checks warten
- Tests lokal vor Push ausführen
- Aussagekräftige Commit-Messages
- Kleine, fokussierte Commits

❌ **Zu vermeiden:**
- Große, monolithische Commits
- Code ohne Tests pushen
- CI-Fehler ignorieren
- Deployment-Secrets committen
- `.env` ins Repository pushen
- Direkt auf Production-Server editieren
