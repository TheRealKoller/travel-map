# Error Handling & Logging

## Übersicht

Die Anwendung verfügt über ein verbessertes Error-Handling-System, das detaillierte Informationen über alle auftretenden Fehler sammelt.

## Log Viewer (Web Interface)

**URL:** `/logs` (nach Login verfügbar)

Mit Laravel Log Viewer können Sie Logs direkt im Browser ansehen:
- Übersichtliche Darstellung aller Log-Dateien
- Filterung nach Log-Level (error, warning, info, etc.)
- Syntax-Highlighting
- Stack-Traces leicht lesbar
- Keine SSH/FTP-Zugriff nötig

**Zugriff:**
1. Einloggen in die Anwendung
2. Navigieren zu `https://ihre-domain.de/logs`
3. Logs durchsuchen und filtern

**Sicherheit:** Nur für authentifizierte und verifizierte Benutzer zugänglich (via `auth` und `verified` Middleware).

## Log-Konfiguration

### Daily Logs
- **Speicherort:** `storage/logs/`
- **Format:** `laravel-YYYY-MM-DD.log`
- **Aufbewahrung:** 14 Tage (konfigurierbar via `LOG_DAILY_DAYS`)
- **Vorteil:** Bessere Organisation, automatisches Cleanup

### Was wird geloggt?

Bei jedem Exception werden folgende Informationen erfasst:

```php
[
    'exception' => 'Klassenname der Exception',
    'file' => 'Datei, in der der Fehler auftrat',
    'line' => 'Zeilennummer',
    'url' => 'Vollständige URL des Requests',
    'method' => 'HTTP-Methode (GET, POST, etc.)',
    'ip' => 'IP-Adresse des Benutzers',
    'user_id' => 'ID des eingeloggten Benutzers (falls vorhanden)',
    'user_agent' => 'Browser/Client Information',
    'trace' => 'Vollständiger Stack-Trace',
]
```

## Logs auf dem Server finden

### Lokal (Development)
```bash
# Neueste Log-Datei anzeigen
tail -f storage/logs/laravel-$(date +%Y-%m-%d).log

# Alle Logs der letzten 7 Tage
ls -lh storage/logs/laravel-*.log | tail -7
```

### Auf all-inkl.com (Production)

#### Via KAS (Kunden-Administrations-System)
1. Login auf https://kas.all-inkl.com
2. **Software → Fehlerprotokoll** (PHP/Apache Logs)
3. **Statistiken → Logfiles**

#### Via SSH/FTP
```bash
# Laravel Logs
/www/htdocs/[username]/storage/logs/laravel-YYYY-MM-DD.log

# PHP Error Logs
/www/htdocs/[username]/logs/php_errors.log
```

## Environment-Konfiguration

### Development (.env)
```env
APP_DEBUG=true
LOG_CHANNEL=daily
LOG_LEVEL=debug
LOG_DAILY_DAYS=14
```

### Production (.env)
```env
APP_DEBUG=false  # Wichtig: Keine Details nach außen!
LOG_CHANNEL=daily
LOG_LEVEL=error  # Nur Fehler loggen
LOG_DAILY_DAYS=30
```

## Test-Route

Nur im Debug-Modus verfügbar:

```
GET /test-error
```

Diese Route wirft eine Test-Exception und demonstriert das Logging.

**Beispiel:**
```bash
curl http://localhost:8000/test-error
```

Nach dem Aufruf prüfen Sie `storage/logs/laravel-YYYY-MM-DD.log` für den detaillierten Log-Eintrag.

## Logs analysieren

### Letzte 20 Fehler anzeigen
```bash
grep "ERROR" storage/logs/laravel-*.log | tail -20
```

### Fehler eines bestimmten Benutzers
```bash
grep "user_id.*123" storage/logs/laravel-*.log
```

### Alle 500-Fehler
```bash
grep "500" storage/logs/laravel-*.log
```

## Erweiterte Features (Optional)

### ✅ Laravel Log Viewer (Installiert)

**Bereits installiert und verfügbar unter `/logs`**

Features:
- Web-basierter Log-Browser
- Keine Terminal-Kenntnisse erforderlich
- Filterung nach Level und Datum
- Syntax-Highlighting
- Geschützt durch Authentication

### Sentry-Integration (Empfohlen für Production)

Für Echtzeit-Benachrichtigungen und Web-Dashboard:

```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=your-dsn-here
```

Das aktuelle Exception Handling ist bereits Sentry-kompatibel und wird automatisch Exceptions an Sentry senden, sobald es konfiguriert ist.

## Schnellstart

1. **Log Viewer öffnen:** Nach dem Login → `/logs`
2. **Test-Fehler erzeugen:** `/test-error` besuchen (nur im Debug-Modus)
3. **Im Log Viewer aktualisieren** und den neuen Fehler-Eintrag sehen
4. **Details analysieren:** Stack-Trace, Request-Info, User-Kontext

### Via Terminal/Kommandozeile

## Logs analysieren

### Keine Logs werden geschrieben

**Berechtigungen prüfen:**
```bash
chmod -R 775 storage/logs
chown -R www-data:www-data storage
```

**Verzeichnis existiert:**
```bash
mkdir -p storage/logs
```

### Log-Dateien zu groß

**Aufbewahrungsdauer reduzieren:**
```env
LOG_DAILY_DAYS=7  # Statt 14
```

**Alte Logs manuell löschen:**
```bash
find storage/logs -name "laravel-*.log" -mtime +7 -delete
```

## Best Practices

1. **Production:** Setzen Sie immer `APP_DEBUG=false`
2. **Log-Level:** Verwenden Sie `error` oder `warning` in Production
3. **Monitoring:** Implementieren Sie Sentry oder ähnliche Tools für Echtzeit-Überwachung
4. **Cleanup:** Löschen Sie alte Logs regelmäßig oder verwenden Sie `LOG_DAILY_DAYS`
5. **Sensitive Data:** Loggen Sie niemals Passwörter, API-Keys oder andere sensible Daten

## Support

Bei Fragen oder Problemen mit dem Error-Handling:
1. Prüfen Sie `storage/logs/laravel-YYYY-MM-DD.log`
2. Aktivieren Sie temporär `APP_DEBUG=true` (nur lokal!)
3. Verwenden Sie die `/test-error` Route zum Testen
