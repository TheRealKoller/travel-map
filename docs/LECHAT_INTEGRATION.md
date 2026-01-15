# Le Chat Agents Integration

## Übersicht

Die Travel Map Application nutzt **zwei spezialisierte Le Chat AI Agents** von Mistral AI:

### 1. Marker Enrichment Agent
Reichert automatisch Marker-Informationen an:
- **Marker-Typ**: Automatische Kategorisierung (Restaurant, Museum, UNESCO-Stätte, etc.)
- **UNESCO-Status**: Erkennung von UNESCO-Weltkulturerbestätten
- **Notizen**: 2-3 Sätze mit interessanten Fakten und historischem Kontext **auf Deutsch**
- **URL**: Offizielle Webseite oder relevanter Link (bevorzugt deutsche Seiten)

### 2. Travel Recommendation Agent
Gibt allgemeine Reiseempfehlungen:
- **Sehenswürdigkeiten**: Interessante Orte und Attraktionen
- **Praktische Tipps**: Öffnungszeiten, beste Besuchszeiten
- **Kulinarik**: Lokale Spezialitäten und Restaurant-Empfehlungen
- **Kultur**: Besonderheiten und Traditionen
- **Ton**: Freundlich, informell auf Deutsch

## Implementierte Features

### Backend

1. **`MarkerEnrichmentAgentService`** (`app/Services/MarkerEnrichmentAgentService.php`)
   - Kommunikation mit Mistral AI Le Chat API für Marker-Anreicherung
   - JSON-Parsing mit Fallback für Markdown-Codeblöcke
   - Umfangreiche Fehlerbehandlung
   - Timeout-Handling (30 Sekunden)

2. **`TravelRecommendationAgentService`** (`app/Services/TravelRecommendationAgentService.php`)
   - Kommunikation mit Mistral AI Le Chat API für Reiseempfehlungen
   - Unterstützt drei Kontexte: Trip, Tour, Map View
   - Dynamische Prompt-Generierung basierend auf Kontext
   - Fehlerbehandlung und Logging

3. **`LeChatAgentController`** (`app/Http/Controllers/Api/LeChatAgentController.php`)
   - API-Endpoint `/markers/enrich` (POST) für Marker-Anreicherung
   - API-Endpoint `/recommendations` (POST) für Reiseempfehlungen
   - Validierung von Eingabedaten
   - Authentifizierung erforderlich

4. **Konfiguration**
   - `config/services.php`: Separate Agent-IDs und API-Key
   - `AppServiceProvider`: Registrierung beider Services als Singletons

5. **Routing**
   - `routes/web.php`: 
     - `markers.enrich` - Marker-Anreicherung
     - `recommendations.get` - Reiseempfehlungen

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

1. **Feature Tests** (30 Tests, alle bestanden)
   - `LeChatAgentEnrichmentTest.php`: Marker-Anreicherung Endpoint-Tests
   - `LeChatAgentRecommendationsTest.php`: Reiseempfehlungen Endpoint-Tests
   - `LeChatAgentServiceTest.php`: Marker Enrichment Service Unit-Tests
   
2. **Test Coverage**
   - Authentifizierung für beide Endpoints
   - Validierung aller Eingabedaten
   - API-Fehlerbehandlung
   - JSON-Parsing (inkl. Markdown-Codeblöcke)
   - Timeout-Handling
   - Type-Casting und Sanitization
   - Kontext-spezifische Validierung (trip, tour, map_view)

## Setup

### 1. Le Chat Agents erstellen

Siehe ausführliche Anleitung in [`docs/LECHAT_AGENT_SETUP.md`](LECHAT_AGENT_SETUP.md)

**Kurz:**
1. Gehe zu [Mistral AI Le Chat](https://chat.mistral.ai/)
2. Erstelle **zwei separate Agents**:
   - **Marker Enrichment Agent**: Strukturierte JSON-Antworten für Marker-Daten
   - **Travel Recommendation Agent**: Freundliche Reiseempfehlungen auf Deutsch
3. Kopiere beide Agent-IDs
4. Erstelle einen API-Key im [Mistral AI Platform](https://console.mistral.ai/)

### 2. Umgebungsvariablen setzen

Füge folgende Variablen zu deiner `.env` hinzu:

```env
LECHAT_API_KEY=dein_mistral_api_key
LECHAT_MARKER_ENRICHMENT_AGENT_ID=ag:xxxxxxxx:xxxxxxxx
LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID=ag:yyyyyyyy:yyyyyyyy
```

### 3. Testen

```bash
# Alle Le Chat Agent Tests
php artisan test --filter="LeChatAgent"

# Spezifische Tests
php artisan test tests/Feature/LeChatAgentEnrichmentTest.php
php artisan test tests/Feature/LeChatAgentRecommendationsTest.php
```

## Verwendung

### Marker-Anreicherung

1. Öffne oder erstelle einen Marker auf der Karte
2. Gib einen Namen ein (z.B. "Eiffelturm")
3. Klicke auf "Enrich with AI"
4. Warte 2-5 Sekunden
5. Die Felder werden automatisch ausgefüllt:
   - Typ wird gesetzt
   - UNESCO-Checkbox wird aktiviert/deaktiviert
   - Notizen werden hinzugefügt (bestehende Notizen bleiben erhalten)
   - URL wird gesetzt (wenn Feld leer ist)

### Reiseempfehlungen (wenn implementiert)

1. Navigiere zur Reise-/Tour-Ansicht
2. Klicke auf "Empfehlungen anzeigen"
3. Wähle Kontext (gesamte Reise, Tour oder Kartenausschnitt)
4. Erhalte personalisierte Empfehlungen auf Deutsch

## Agent System-Prompts

Die vollständigen System-Prompts für beide Agents findest du in [`docs/LECHAT_AGENT_SETUP.md`](LECHAT_AGENT_SETUP.md).

### Marker Enrichment Agent (Zusammenfassung)

Analysiert Orte und gibt strukturierte JSON-Antworten zurück mit:
- Marker-Typ aus vordefinierter Liste
- UNESCO-Status (true/false/null)
- 2-3 Sätze interessante Informationen auf Deutsch
- Offizielle URL (bevorzugt deutsch)

**Temperatur**: 0.3 (konsistente, faktische Antworten)

### Travel Recommendation Agent (Zusammenfassung)

Gibt freundliche Reiseempfehlungen auf Deutsch:
- Sehenswürdigkeiten und Attraktionen
- Praktische Tipps und Insider-Informationen
- Kulinarische Empfehlungen
- Kulturelle Besonderheiten
- Informeller, enthusiastischer Ton

**Temperatur**: 0.7 (kreative, konversationelle Antworten)

## Technische Details

### Marker Enrichment API

**Request:**
```typescript
POST /markers/enrich

{
  "name": "Eiffel Tower",
  "latitude": 48.8584,
  "longitude": 2.2945
}
```

**Response (Success):**
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

### Travel Recommendations API

**Request:**
```typescript
POST /recommendations

{
  "context": "trip",
  "data": {
    "trip_name": "Deutschland Rundreise",
    "markers": [
      {
        "name": "Kölner Dom",
        "latitude": 50.9413,
        "longitude": 6.9583
      }
    ]
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "recommendation": "Das ist eine tolle Reise! Der Kölner Dom ist absolut beeindruckend – plane mindestens 2-3 Stunden ein. Die Turmbesteigung lohnt sich besonders bei gutem Wetter..."
}
```

**Supported Contexts:**
- `trip` - Gesamte Reise (benötigt: trip_name, markers)
- `tour` - Spezifische Tour (benötigt: trip_name, tour_name, markers)  
- `map_view` - Kartenausschnitt (benötigt: trip_name, bounds, markers)

### Error Response (beide APIs)

```json
{
  "success": false,
  "error": "Error message"
}
```

## Fehlerbehandlung

- **Authentifizierung**: 401 wenn nicht eingeloggt
- **Validierung**: 422 bei ungültigen Eingabedaten
- **API-Fehler**: 500 bei Problemen mit Mistral AI API
- **Timeout**: 30 Sekunden maximale Wartezeit
- **JSON-Parsing**: Automatische Extraktion aus Markdown-Codeblöcken (nur Marker Enrichment)

Alle Fehler werden:
- Im Laravel-Log protokolliert (`storage/logs/laravel.log`)
- Dem Benutzer in der UI angezeigt (wenn implementiert)
- Mit spezifischen Fehlermeldungen versehen

## Sicherheit

- ✅ API-Key wird nur im Backend verwendet
- ✅ Authentifizierung erforderlich (`auth` middleware)
- ✅ Alle Eingaben werden validiert
- ✅ Fehler-Messages enthalten keine sensiblen Informationen
- ✅ CSRF-Protection aktiviert
- ✅ Getrennte Agents für verschiedene Zwecke

## Kosten

### Token-Verbrauch

**Marker-Anreicherung:**
- Request: ~500 Tokens (Prompt + Location)
- Response: ~200 Tokens (JSON)
- **Gesamt: ~700 Tokens pro Request**

**Reiseempfehlungen:**
- Request: ~300-600 Tokens (Kontext-abhängig)
- Response: ~300-500 Tokens (Text)
- **Gesamt: ~600-1100 Tokens pro Request**

Überwache die Nutzung in der [Mistral AI Platform](https://console.mistral.ai/).

## Zukünftige Erweiterungen

- [ ] Caching von Marker-Anreicherungen
- [ ] Frontend-Integration für Reiseempfehlungen
- [ ] Batch-Processing für mehrere Marker
- [ ] Offline-Modus mit häufigen Orten
- [ ] Benutzer-Feedback-System
- [ ] Mehrsprachige Unterstützung
- [ ] Anpassbare Prompts pro Benutzer
- [ ] Kontext-basierte Empfehlungen direkt in der Karte

## Dateien

### Backend Services
- `app/Services/MarkerEnrichmentAgentService.php` - Marker-Anreicherung Service
- `app/Services/TravelRecommendationAgentService.php` - Reiseempfehlungen Service
- `app/Http/Controllers/Api/LeChatAgentController.php` - API Controller
- `app/Providers/AppServiceProvider.php` - Service-Registrierung
- `routes/web.php` - Route-Definitionen
- `config/services.php` - Konfiguration
- `.env.example` - Environment-Template

### Tests
- `tests/Feature/LeChatAgentEnrichmentTest.php` - Marker-Anreicherung Endpoint-Tests
- `tests/Feature/LeChatAgentRecommendationsTest.php` - Reiseempfehlungen Endpoint-Tests
- `tests/Feature/LeChatAgentServiceTest.php` - Marker Enrichment Service Unit-Tests

### Frontend (wenn implementiert)
- `resources/js/components/marker-form.tsx` - Marker-Formular mit AI-Anreicherung
- `resources/js/hooks/use-lechat-enrichment.ts` - React Hook (optional)

### Dokumentation
- `docs/LECHAT_AGENT_SETUP.md` - Vollständige Setup-Anleitung mit System-Prompts
- `docs/LECHAT_INTEGRATION.md` - Diese Datei (Integrations-Übersicht)

## Service-Architektur

```
┌──────────────────────────────────────────┐
│  LeChatAgentController                   │
│  - enrichMarker()                        │
│  - getRecommendations()                  │
└──────────┬──────────────────┬────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌──────────────────────────┐
│ MarkerEnrichment │  │ TravelRecommendation     │
│ AgentService     │  │ AgentService             │
│                  │  │                          │
│ - enrichMarker   │  │ - getTravelRecommendations│
│   Info()         │  │                          │
│ - buildPrompt()  │  │ - buildRecommendation    │
│ - parseResponse()│  │   Prompt()               │
└──────────────────┘  └──────────────────────────┘
           │                  │
           └────────┬─────────┘
                    ▼
        ┌───────────────────────┐
        │ Mistral AI API        │
        │ api.mistral.ai        │
        │ /v1/agents/completions│
        └───────────────────────┘
```

## Support

Bei Problemen:
1. Prüfe Laravel-Logs: `tail -f storage/logs/laravel.log`
2. Prüfe Browser-Console für Frontend-Fehler
3. Verifiziere API-Credentials in `.env`:
   - `LECHAT_API_KEY`
   - `LECHAT_MARKER_ENRICHMENT_AGENT_ID`
   - `LECHAT_TRAVEL_RECOMMENDATION_AGENT_ID`
4. Teste Services manuell mit `php artisan tinker`
5. Siehe [Le Chat Agent Setup Guide](LECHAT_AGENT_SETUP.md) für Details
