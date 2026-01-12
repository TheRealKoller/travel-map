# Public Transport Routing mit Google Routes API v2

## Übersicht

Die Travel Map Anwendung unterstützt jetzt vollständiges ÖPNV-Routing (Öffentlicher Personennahverkehr) mit der **Google Routes API v2** (auch bekannt als Routes Preferred API). Dies ermöglicht detaillierte Routenplanung mit:

- **Umstieginformationen** (Haltestellen, Linien, Zeiten)
- **Alternative Verbindungen**
- **Verschiedene Verkehrsmittel** (Bus, Bahn, U-Bahn, Tram, Fähre)
- **Echtzeit-Fahrpläne**

## Setup

### 1. Google Maps API Key erhalten

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die **Routes API** (nicht die alte Directions API)
4. Erstelle einen API-Schlüssel unter "APIs & Services" → "Credentials"
5. (Optional) Beschränke den Key auf die Routes API

### 2. Konfiguration

Füge den API-Schlüssel zu deiner `.env` Datei hinzu:

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Verwendung

### API-Request

Erstelle eine Route mit `transport_mode: 'public-transport'`:

```bash
POST /routes
Content-Type: application/json

{
  "trip_id": 1,
  "start_marker_id": "uuid-1",
  "end_marker_id": "uuid-2",
  "transport_mode": "public-transport"
}
```

### Response-Struktur

Die Response enthält detaillierte Transit-Informationen:

```json
{
  "id": 1,
  "trip_id": 1,
  "start_marker": { ... },
  "end_marker": { ... },
  "transport_mode": {
    "value": "public-transport",
    "label": "Public Transport"
  },
  "distance": {
    "meters": 25000,
    "km": 25.0
  },
  "duration": {
    "seconds": 1800,
    "minutes": 30
  },
  "geometry": [[lng, lat], [lng, lat], ...],
  "transit_details": {
    "steps": [
      {
        "travel_mode": "WALKING",
        "distance": 500,
        "duration": 360,
        "instructions": "Walk to bus stop"
      },
      {
        "travel_mode": "TRANSIT",
        "distance": 24000,
        "duration": 1200,
        "instructions": "Take bus 100",
        "transit": {
          "departure_stop": {
            "name": "Main Station",
            "location": { "lat": 52.52, "lng": 13.405 }
          },
          "arrival_stop": {
            "name": "Central Square",
            "location": { "lat": 52.53, "lng": 13.42 }
          },
          "line": {
            "name": "Bus 100",
            "short_name": "100",
            "color": "#FF0000",
            "vehicle_type": "BUS",
            "vehicle_icon": "bus-icon"
          },
          "departure_time": 1736712360,
          "arrival_time": 1736713560,
          "num_stops": 12,
          "headsign": "City Center"
        }
      },
      {
        "travel_mode": "WALKING",
        "distance": 500,
        "duration": 240,
        "instructions": "Walk to destination"
      }
    ],
    "departure_time": 1736712000,
    "arrival_time": 1736713800,
    "start_address": "Start Location",
    "end_address": "End Location"
  },
  "alternatives": [
    {
      "summary": "Alternative Route",
      "distance": 26500,
      "duration": 2100,
      "departure_time": 1736712600,
      "arrival_time": 1736714700,
      "num_transfers": 1
    }
  ]
}
```

## API-Details

### Google Routes API v2

Die Anwendung verwendet die moderne **Routes API v2** mit folgenden Besonderheiten:

**Endpoint:**
```
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

**Authentication:**
- API-Key wird im Header übergeben: `X-Goog-Api-Key`
- Zusätzlich wird ein Field-Mask Header benötigt: `X-Goog-FieldMask`

**Request-Struktur:**
```json
{
  "origin": {
    "location": {
      "latLng": {
        "latitude": 52.520008,
        "longitude": 13.404954
      }
    }
  },
  "destination": {
    "location": {
      "latLng": {
        "latitude": 52.530000,
        "longitude": 13.420000
      }
    }
  },
  "travelMode": "TRANSIT",
  "computeAlternativeRoutes": true,
  "languageCode": "en-US",
  "units": "METRIC"
}
```

**Response-Struktur:**
```json
{
  "routes": [
    {
      "distanceMeters": 25000,
      "duration": "1800s",
      "polyline": {
        "encodedPolyline": "u{~vFvyys@..."
      },
      "legs": [
        {
          "localizedValues": {
            "departure": { "time": { "text": "14:00" }},
            "arrival": { "time": { "text": "14:30" }}
          },
          "steps": [...]
        }
      ]
    }
  ]
}
```

### Architektur

```
RouteController
    ↓
RoutingService
    ├─→ calculateTransitRoute() [Google Maps API]
    └─→ calculateMapboxRoute()   [Mapbox API]
```

### Transport Mode Routing

- **Public Transport** → Google Maps Directions API (mode=transit)
- **Car, Bicycle, Walking** → Mapbox Directions API

### Datenbank-Schema

Die `routes` Tabelle wurde erweitert um:

```php
$table->json('transit_details')->nullable();
$table->json('alternatives')->nullable();
```

## Features

### Transit Details

Jeder Transit-Step enthält:

- **Verkehrsmitteltyp** (BUS, TRAIN, SUBWAY, TRAM, FERRY)
- **Abfahrts-/Ankunftshaltestelle** mit Name und Koordinaten
- **Linie** mit Name, Kurzname, Farbe und Icon
- **Zeiten** (Abfahrt/Ankunft als Unix-Timestamp)
- **Anzahl Haltestellen**
- **Fahrtrichtung** (Headsign)

### Alternative Routen

Das System liefert automatisch alternative Verbindungen mit:

- Gesamtdistanz und -dauer
- Abfahrts- und Ankunftszeit
- Anzahl Umstiege

### Polyline Decoding

Google liefert Geometrien als encoded polyline. Das System dekodiert diese automatisch in GeoJSON-kompatible Koordinaten `[longitude, latitude]`.

## Kosten & Limits

### Google Maps Pricing

- **$5.00** pro 1.000 Requests
- **$200 monatlich** kostenlos inkludiert (~40.000 Requests)
- Keine harten Limits, Pay-as-you-go

### Best Practices

1. **Caching:** Speichere Routen in der Datenbank
2. **Rate Limiting:** Implementiere User-spezifische Limits
3. **Fehlerbehandlung:** Zeige sinnvolle Fehlermeldungen bei fehlenden Verbindungen

## Fehlerbehandlung

### Keine Route gefunden

```json
{
  "error": "No public transport route found between the markers"
}
```

Status Code: **404**

### API-Key fehlt

```json
{
  "error": "Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your .env file."
}
```

Status Code: **503**

### API-Fehler

```json
{
  "error": "Failed to calculate transit route via Google Maps: ..."
}
```

Status Code: **503**

## Testing

Tests sind vollständig implementiert mit Mock-Responses:

```bash
php artisan test --filter="public transport"
```

Beispiel-Mock für Google Maps API:

```php
Http::fake([
    'maps.googleapis.com/*' => Http::response([
        'status' => 'OK',
        'routes' => [ /* ... */ ]
    ], 200),
]);
```

## Zukünftige Erweiterungen

Mögliche Features für die Zukunft:

- **Departure Time Picker:** User können Abfahrtszeit wählen
- **Transit Preferences:** Bevorzugte Verkehrsmittel (nur Bus, nur Bahn, etc.)
- **Accessibility Options:** Barrierefreie Routen
- **Real-time Updates:** Live-Verspätungsinformationen
- **Multi-Stop Routes:** Routen mit Zwischenstopps

## Siehe auch

- [Google Routes API v2 Documentation](https://developers.google.com/maps/documentation/routes)
- [Routes API Migration Guide](https://developers.google.com/maps/documentation/routes/migrate_directions)
- [Mapbox Migration Guide](./MAPBOX_MIGRATION.md)
- [Route Authentication](./ROUTE_AUTHENTICATION.md)
