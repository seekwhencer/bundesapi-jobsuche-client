# Mr. Jobbinger

Eine Suchhilfe für die Jobsuche der Arbeitsagentur für Arbeit.

- Verwendet die [bundesAPI](https://github.com/bundesAPI/jobsuche-api)
- Mehrere Suchen speichern / bearbeiten / löschen
- Einzelne Suche auslösen
- Suchergebnisse einer Suche löschen
- Liste nach Stichwort filtern
- Liste nach Suche filtern
- Alle Suchergebnisse landen in einer Liste
- Keine Dopplungen mehr wie per E-Mail-Suchauftrag
- Herzchenliste
- Ignore-Liste

Technische Features:

- Bundling Frontend und Server
-

@TODO

- Bundling (progress)
- Docker Development und Production
- Scheduling Such-Aufträge
- Benutzer (Daten nach Benutzer aufteilen)
- Filter (include & exclude) nach Berufen / Berufsbezeichnungen
- Statistik Berufe

@TODO²
- Binary bauen

> **ACHTUNG**: nicht für Production im Web gedacht. Bitte ausschließlich für den lokalen Betrieb verwenden.  
> Läuft bspw. sehr gut auf einem Raspberry Pi 4

## Installation

- braucht Node.js für bare metal
- wenn Windows, dann WSL (Linux, Ubuntu)

```bash
git clone https://github.com/seekwhencer/bundesapi-jobsuche-client.git
cd bundesapi-jobsuche-client
npm install
````

## Starten

```bash
npm start
```

> Dann läuft das auf port `3000` auf `http://localhost:3000` - sofern man das auf localhost installiert.

![Screenshot #1](../master/screenshots/screenshot_01.png?raw=true "Screenshot #1")
![Screenshot #2](../master/screenshots/screenshot_02.png?raw=true "Screenshot #2")
![Screenshot #3](../master/screenshots/screenshot_03.png?raw=true "Screenshot #3")

## Entwicklung

Frontend und Server geschrieben in Vanilla Javascript ES6+ und purem CSS. Komplett ohne `webpack`, `vite` und Co.

### Build

```
npm run build
```

Baut Bundles für Frontend (js, css) und den Server im Ordner : `build/`

## Docker

- benötigt Docker und Docker-Compose
- `.env.default` nach `.env` klonen vor Betrieb und Datei bearbeiten

### Development

```bash
docker-compose -f docker-compose-dev.yml up -d
```

### Production

```bash
docker-compose up -d
```

## Deployment

- simple as hell
- nach dem erstmaligen auschecken eingeben:

 ```bash
    docker-compose down
    git pull
    docker-compose build
    docker-compose up -d
```

> **ENJOY IT**