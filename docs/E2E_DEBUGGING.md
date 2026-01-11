# E2E Test Debugging in CI/CD

## Problem
E2E-Tests schlagen in der CI/CD-Pipeline fehl, funktionieren aber lokal.

## Mögliche Ursachen

### 1. **Server startet nicht richtig**
- Die Laravel-App könnte Probleme beim Start haben
- Migrationen könnten fehlschlagen
- Dependencies fehlen

### 2. **Timing-Probleme**
- CI-Umgebungen sind oft langsamer
- Playwright könnte zu schnell sein, bevor die Seite geladen ist
- Assets werden möglicherweise nicht rechtzeitig geladen

### 3. **Umgebungsvariablen**
- `.env.e2e` könnte falsch konfiguriert sein
- `VITE_MAPBOX_ACCESS_TOKEN` könnte fehlen oder falsch sein
- `APP_URL` stimmt nicht überein

### 4. **Build-Probleme**
- Assets wurden nicht korrekt gebaut
- `npm run build` hat Fehler produziert
- Vite manifest fehlt

### 5. **Browser-Unterschiede**
- Headless Chrome verhält sich anders
- WebGL/Canvas-Features fehlen in CI
- Fonts oder andere Ressourcen fehlen

## Debugging-Schritte

### 1. Artifacts herunterladen
Nach jedem fehlgeschlagenen Test-Lauf:

1. Gehe zu GitHub Actions → Workflow Run → "Summary"
2. Scrolle nach unten zu "Artifacts"
3. Lade herunter:
   - `playwright-report` - HTML-Report mit Details
   - `playwright-screenshots` - Screenshots von fehlgeschlagenen Tests

### 2. Logs analysieren
```bash
# In GitHub Actions Workflow:
# 1. Klicke auf den fehlgeschlagenen Step
# 2. Suche nach:
- "Error:" oder "Failed:"
- HTTP-Statuscodes (404, 500, etc.)
- "ECONNREFUSED" oder "ETIMEDOUT"
- Console errors
```

### 3. Server-Logs prüfen
Der neue Step "Check Server Can Start" zeigt, ob der Server überhaupt startet:
- Wenn dieser Step fehlschlägt → Server-Problem
- Wenn er erfolgreich ist, Tests aber fehlschlagen → Test-Problem

### 4. Debug-Test ausführen
Der neue `debug-helper.spec.ts` Test läuft zuerst und zeigt:
- Ob der Server antwortet
- Welche Requests fehlschlagen
- Ob Assets geladen werden

### 5. Traces ansehen
Mit den neuen Einstellungen werden Traces für alle Tests in CI erstellt:

1. Lade `playwright-report` Artifact herunter
2. Entpacke es
3. Öffne lokal: `npx playwright show-report playwright-report`
4. Klicke auf fehlgeschlagene Tests
5. Klicke auf "Trace" Tab → zeigt jeden Schritt mit Screenshots

## Häufige Fixes

### Fix 1: Server-Timeout erhöhen
```typescript
// playwright.config.ts
webServer: {
    timeout: 180000, // Erhöhe auf 3 Minuten
}
```

### Fix 2: Mehr Zeit zum Laden geben
```typescript
// In Tests
await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
```

### Fix 3: Explizite Waits hinzufügen
```typescript
// Warte auf kritische Elemente
await page.waitForSelector('[data-testid="map-container"]', { 
    state: 'visible',
    timeout: 10000 
});
```

### Fix 4: Build-Probleme debuggen
```yaml
# In .github/workflows/tests.yml
- name: Build Assets
  run: npm run build
  env:
    VITE_MAPBOX_ACCESS_TOKEN: pk.test.mock-token-for-e2e-tests
    
# Füge hinzu:
- name: Verify Build
  run: |
    ls -la public/build/
    cat public/build/manifest.json
```

### Fix 5: Environment-Variablen überprüfen
```yaml
# In .github/workflows/tests.yml
- name: Debug Environment
  run: |
    echo "APP_URL: $APP_URL"
    cat .env.e2e
    php artisan config:show app
    php artisan route:list
```

## Aktuelle Verbesserungen

### ✅ Playwright Config
- **Traces aktiviert in CI**: Jeder Test erstellt einen Trace
- **Screenshots aktiviert**: Bei jedem Fehler wird Screenshot gemacht
- **Videos bei Fehlern**: Nur wenn Tests fehlschlagen

### ✅ GitHub Actions
- **Debug-Modus aktiviert**: `DEBUG: pw:api`
- **Server-Check hinzugefügt**: Verifiziert, dass Server startet
- **Screenshots werden hochgeladen**: Auch test-results/ Ordner

### ✅ Debug-Test
- **debug-helper.spec.ts** läuft zuerst
- Zeigt Server-Status, failed requests, Environment

## Nächste Schritte

1. **Committe die Änderungen**
2. **Pushe zu GitHub**
3. **Warte auf Workflow**
4. **Lade Artifacts herunter**, wenn Tests fehlschlagen
5. **Analysiere Traces und Screenshots**

## Wichtige Commands

```bash
# Lokal in CI-Modus testen
CI=true npm run test:e2e

# Spezifischen Test mit Debug-Output
DEBUG=pw:api npx playwright test tests/e2e/debug-helper.spec.ts

# Server manuell im E2E-Modus starten
php artisan serve --env=e2e

# E2E-Datenbank zurücksetzen
php artisan migrate:fresh --force --env=e2e
```

## Kontakt bei Problemen

Wenn das Problem weiterhin besteht:
1. Erstelle ein Issue mit:
   - Link zum fehlgeschlagenen Workflow
   - Screenshots aus Artifacts
   - Relevante Logs
   - Was lokal funktioniert
