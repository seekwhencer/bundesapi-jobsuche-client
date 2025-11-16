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
- Filter nach Berufen
- Visualisierung Häufigkeit der Berufe

Technische Features:

- Node.js Server App
- CSR Frontend App
- API
- Bundling Frontend und Server
- Docker Development und Production

@TODO

- Scheduling Such-Aufträge
- Benutzer (Daten nach Benutzer aufteilen)

@TODO²

- Binary bauen

> **ACHTUNG**: nicht für Production im Web gedacht. Bitte ausschließlich für den lokalen Betrieb verwenden.  
> Läuft bspw. sehr gut auf einem Raspberry Pi 4

## Installation

- braucht Node.js für bare metal
- wenn Windows, dann WSL (Linux, Ubuntu)
- am besten auf einem Ubuntu Docker Host

### Auschecken

```bash
git clone https://github.com/seekwhencer/bundesapi-jobsuche-client.git
cd bundesapi-jobsuche-client
````

### Installieren (bare metal)

```bash
npm install
```

### ... oder mit Docker

[Docker Installation](#docker)

## Starten

```bash
npm start
```

> Dann läuft das auf port `3000` auf `http://localhost:3000` - sofern man das auf localhost installiert.

![Screenshot #1](../master/screenshots/screenshot_01.png?raw=true "Screenshot #1")
![Screenshot #2](../master/screenshots/screenshot_02.png?raw=true "Screenshot #2")
![Screenshot #3](../master/screenshots/screenshot_03.png?raw=true "Screenshot #3")
![Screenshot #4](../master/screenshots/screenshot_04.png?raw=true "Screenshot #4")

## Entwicklung

Frontend und Server geschrieben in Vanilla Javascript ES6+ und purem CSS. Bundler: `esbuild`

### Build

```
npm run build
```

Baut Bundles für Frontend (js, css) und den Server im Ordner : `build/`

## Docker

- benötigt Docker und Docker-Compose
- `.env.default` nach `.env` klonen vor Betrieb diese Datei bearbeiten

### Build Image

```bash
docker-compose build --no-cache
```

### Development

```bash
# exposed port
docker-compose -f docker-compose-dev.yml up -d
```

... oder

```bash
# keine Ports exposed, mit jwilders nginx reverse proxy
docker-compose -f docker-compose-dev-proxy.yml up -d
```

### Production

Also wenn man überhaupt von *"production"* reden kann...  
Das yaml benötigt noch den nginx reverse proxy von jwilder.

```bash
docker-compose -f docker-compose-prod.yml up -d
```

## Deployment

- simple as hell
- `docker-compose-dev.yml` oder `docker-compose-dev-proxy.yml`
- nach dem erstmaligen auschecken eingeben:

 ```bash
    docker-compose -f docker-compose-dev.yml down
    git pull
    docker-compose build --no-cache
    docker-compose -f docker-compose-dev.yml up -d
```

---

> Ein einfaches `docker-compose up` machts nichts. Es startet nur der Container.  
> Das `docker-compose.yml` ist einzig dafür da, das Image zu bauen.

**ENJOY IT**