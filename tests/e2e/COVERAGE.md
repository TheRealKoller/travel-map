# Code Coverage für E2E Tests

Dieses Projekt nutzt `vite-plugin-istanbul` und `nyc` für Code Coverage der E2E-Tests.

## Setup

Das Setup ist bereits konfiguriert:
- ✅ `vite-plugin-istanbul` in `vite.config.ts`
- ✅ `.nycrc.json` Konfiguration
- ✅ Coverage-Ordner in `.gitignore`

## Verwendung

### 1. E2E-Tests ausführen

```bash
npm run test:e2e
```

Die Coverage-Daten werden automatisch während der Testausführung in `.nyc_output/` gesammelt.

### 2. Coverage-Report generieren

Nach den Tests den Report erstellen:

```bash
npm run coverage:report
```

Dies generiert:
- **HTML-Report**: `coverage/index.html`
- **Text-Report**: In der Konsole
- **LCOV-Report**: `coverage/lcov.info` (für CI/CD)

### 3. Coverage-Report öffnen

```bash
npm run coverage:open
```

Öffnet den HTML-Report im Browser.

## Alternativ: Coverage mit spezifischen Tests

```bash
# Nur bestimmte Tests ausführen
npm run test:e2e -- trip-management.spec.ts

# Coverage-Report generieren
npm run coverage:report
```

## Coverage-Metriken

Der Report zeigt:
- **Statements**: Prozentsatz der ausgeführten Code-Zeilen
- **Branches**: Prozentsatz der durchlaufenen if/else-Zweige
- **Functions**: Prozentsatz der aufgerufenen Funktionen
- **Lines**: Prozentsatz der ausgeführten Zeilen

## Konfiguration

Die Coverage-Konfiguration befindet sich in `.nycrc.json`:

```json
{
  "include": ["resources/js/**/*.ts", "resources/js/**/*.tsx"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts", "tests/**"],
  "reporter": ["html", "text", "lcov", "json"]
}
```

## Coverage-Daten löschen

```bash
# PowerShell
Remove-Item -Recurse -Force .nyc_output, coverage
```

## CI/CD Integration

Die Coverage-Daten können in CI/CD-Pipelines genutzt werden:

```yaml
- name: Generate Coverage Report
  run: npm run coverage:report
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

**Problem**: Keine Coverage-Daten werden gesammelt
- Lösung: Stelle sicher, dass `npm run build` vor den Tests ausgeführt wurde

**Problem**: Coverage-Report ist leer
- Lösung: Prüfe, ob `.nyc_output/` Dateien enthält nach Testausführung
