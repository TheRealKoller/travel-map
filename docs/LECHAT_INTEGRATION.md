# Le Chat Agent Integration

## Übersicht

Die Travel Map Application wurde um einen Le Chat AI Agent erweitert, der automatisch Marker-Informationen anreichert. Benutzer können mit einem Klick auf einen Button im Marker-Formular folgende Informationen automatisch ergänzen lassen:

- **Marker-Typ**: Automatische Kategorisierung (Restaurant, Museum, UNESCO-Stätte, etc.)
- **UNESCO-Status**: Erkennung von UNESCO-Weltkulturerbestätten
- **Notizen**: 2-3 Sätze mit interessanten Fakten und historischem Kontext **auf Deutsch**
- **URL**: Offizielle Webseite oder relevanter Link (bevorzugt deutsche Seiten)

## Implementierte Features

### Backend

1. **`LeChatAgentService`** (`app/Services/LeChatAgentService.php`)
   - Kommunikation mit der Mistral AI Le Chat API
   - JSON-Parsing mit Fallback für Markdown-Codeblöcke
   - Umfangreiche Fehlerbehandlung
   - Timeout-Handling (30 Sekunden)

2. **`LeChatAgentController`** (`app/Http/Controllers/Api/LeChatAgentController.php`)
   - API-Endpoint `/markers/enrich` (POST)
   - Validierung von Eingabedaten
   - Authentifizierung erforderlich

3. **Konfiguration**
   - `config/services.php`: Le Chat API-Credentials
   - `AppServiceProvider`: Service-Registrierung als Singleton

4. **Routing**
   - `routes/web.php`: Neue Route `markers.enrich`

### Frontend

1. **Marker-Formular** (`resources/js/components/marker-form.tsx`)
   - Neuer "Enrich with AI" Button
   - Loading-State mit Spinner
   - Error-Handling mit User-Feedback
   - Automatisches Befüllen der Formularfelder

2. **Type-Mapping**
   - Konvertierung zwischen API-Typen und MarkerType-Enum
   - Intelligente Zusammenführung von Notizen

### Tests

1. **Feature Tests** (18 Tests, alle bestanden)
   - `LeChatAgentEnrichmentTest.php`: API-Endpoint-Tests
   - `LeChatAgentServiceTest.php`: Service-Logic-Tests
   
2. **Test Coverage**
   - Authentifizierung
   - Validierung
   - API-Fehlerbehandlung
   - JSON-Parsing (inkl. Markdown-Codeblöcke)
   - Timeout-Handling
   - Type-Casting und Sanitization

## Setup

### 1. Le Chat Agent erstellen

Siehe ausführliche Anleitung in [`docs/LECHAT_AGENT_SETUP.md`](docs/LECHAT_AGENT_SETUP.md)

**Kurz:**
1. Gehe zu [Mistral AI Le Chat](https://chat.mistral.ai/)
2. Erstelle einen neuen Agent mit dem bereitgestellten System-Prompt
3. Kopiere die Agent-ID
4. Erstelle einen API-Key im [Mistral AI Platform](https://console.mistral.ai/)

### 2. Umgebungsvariablen setzen

Füge folgende Variablen zu deiner `.env` hinzu:

```env
LECHAT_API_KEY=dein_mistral_api_key
LECHAT_AGENT_ID=ag:xxxxxxxx:xxxxxxxx
```

### 3. Testen

```bash
php artisan test --filter="LeChatAgent"
```

## Verwendung

1. Öffne oder erstelle einen Marker auf der Karte
2. Gib einen Namen ein (z.B. "Eiffelturm")
3. Klicke auf "Enrich with AI"
4. Warte 2-5 Sekunden
5. Die Felder werden automatisch ausgefüllt:
   - Typ wird gesetzt
   - UNESCO-Checkbox wird aktiviert/deaktiviert
   - Notizen werden hinzugefügt (bestehende Notizen bleiben erhalten)
   - URL wird gesetzt (wenn Feld leer ist)

## Agent-Prompt

Der Agent verwendet folgenden System-Prompt:

```
You are a travel location information expert. Your task is to analyze location names and coordinates, then provide structured information about these places.

For each location, you must provide:
1. The most appropriate marker type from this list:
   - restaurant, point_of_interest, hotel, museum, ruin, temple_church, 
     sightseeing, natural_attraction, city, village, region, question, 
     tip, festival_party, leisure

2. Whether the location is a UNESCO World Heritage Site (true/false)

3. 2-3 sentences of interesting information about the location IN GERMAN LANGUAGE

4. An official website URL or relevant link (prefer German language websites if available)

CRITICAL: You MUST respond ONLY with valid JSON in exactly this format:
{
  "type": "marker_type_here",
  "is_unesco": true_or_false,
  "notes": "Interessante Informationen auf Deutsch...",
  "url": "https://example.com"
}

Rules:
- Return ONLY the JSON object, no additional text
- If any field cannot be determined, use null
- For notes, write 2-3 complete sentences IN GERMAN
- Write natural, fluent German text in the notes field
- For URLs, prefer German language official websites when available
- If a German Wikipedia page exists, prefer it over the English version
- Do not wrap JSON in markdown code blocks
- Ensure all JSON is valid and properly escaped
```

## Technische Details

### API-Request

```typescript
POST /markers/enrich

{
  "name": "Eiffel Tower",
  "latitude": 48.8584,
  "longitude": 2.2945
}
```

### API-Response (Success)

```json
{
  "success": true,
  "data": {
    "type": "sightseeing",
    "is_unesco": false,
    "notes": "Der Eiffelturm ist ein ikonisches Eisenfachwerkgerüst in Paris. Er wurde 1889 für die Weltausstellung erbaut und ist mit 330 Metern Höhe eines der bekanntesten Wahrzeichen der Welt. Jährlich besuchen etwa 7 Millionen Menschen dieses architektonische Meisterwerk.",
    "url": "https://www.toureiffel.paris/de"
  }
}
```

### API-Response (Error)

```json
{
  "success": false,
  "error": "Error message"
}
```

## Fehlerbehandlung

- **Authentifizierung**: 401 wenn nicht eingeloggt
- **Validierung**: 422 bei ungültigen Eingabedaten
- **API-Fehler**: 500 bei Problemen mit Le Chat API
- **Timeout**: 30 Sekunden maximale Wartezeit
- **JSON-Parsing**: Automatische Extraktion aus Markdown-Codeblöcken

Alle Fehler werden:
- Im Laravel-Log protokolliert (`storage/logs/laravel.log`)
- Dem Benutzer in der UI angezeigt
- Für Debugging erfasst

## Sicherheit

- ✅ API-Key wird nur im Backend verwendet
- ✅ Authentifizierung erforderlich (`auth` middleware)
- ✅ Alle Eingaben werden validiert
- ✅ Fehler-Messages enthalten keine sensiblen Informationen
- ✅ CSRF-Protection aktiviert

## Kosten

Pro Marker-Anreicherung:
- Request: ~500 Tokens (Prompt + Location)
- Response: ~200 Tokens (JSON)
- **Gesamt: ~700 Tokens**

Überwache die Nutzung in der [Mistral AI Platform](https://console.mistral.ai/).

## Zukünftige Erweiterungen

- [ ] Caching von Anreicherungen
- [ ] Batch-Processing für mehrere Marker
- [ ] Offline-Modus mit häufigen Orten
- [ ] Benutzer-Feedback-System
- [ ] Mehrsprachige Unterstützung
- [ ] Anpassbare Prompts pro Benutzer

## Dateien

### Backend
- `app/Services/LeChatAgentService.php`
- `app/Http/Controllers/Api/LeChatAgentController.php`
- `app/Providers/AppServiceProvider.php`
- `routes/web.php`
- `config/services.php`
- `.env.example`

### Frontend
- `resources/js/components/marker-form.tsx`

### Tests
- `tests/Feature/LeChatAgentEnrichmentTest.php`
- `tests/Feature/LeChatAgentServiceTest.php`

### Dokumentation
- `docs/LECHAT_AGENT_SETUP.md`
- `docs/LECHAT_INTEGRATION.md` (diese Datei)

## Support

Bei Problemen:
1. Prüfe Laravel-Logs: `tail -f storage/logs/laravel.log`
2. Prüfe Browser-Console für Frontend-Fehler
3. Verifiziere API-Credentials in `.env`
4. Siehe [Le Chat Agent Setup Guide](docs/LECHAT_AGENT_SETUP.md)
