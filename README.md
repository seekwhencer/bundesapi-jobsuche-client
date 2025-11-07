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

@TODO
- Scheduling Such-Aufträge

## Installation

- braucht Node.js für bare metal
- nix Windows, only WSL (Linux, Ubuntu)

```bash
git clone https://github.com/seekwhencer/bundesapi-jobsuche-client.git
cd bundesapi-jobsuche-client
npm install
````

## Starten
```bash
node ./index.js
```

> Dann läuft das auf port `3000` auf `http://localhost:3000` - sofern man das auf localhost installiert.

![Screenshot #1](../master/screenshots/screenshot_01.png?raw=true "Screenshot #1")
![Screenshot #2](../master/screenshots/screenshot_02.png?raw=true "Screenshot #2")
![Screenshot #3](../master/screenshots/screenshot_03.png?raw=true "Screenshot #3")
