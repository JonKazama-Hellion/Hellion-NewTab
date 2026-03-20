# ⬡ Hellion NewTab v1.2.0

![Version](https://img.shields.io/badge/Version-1.2.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES2020-F7DF1E?logo=javascript&logoColor=black)
![Manifest](https://img.shields.io/badge/Manifest-V3%20%7C%20V2-green)
![License](https://img.shields.io/badge/License-Propriet%C3%A4r-red)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Lokal-448f45)

**Kein Account. Kein Abo. Keine Cloud. Alle Daten bleiben 100% lokal.**

Ein persoenlicher Bookmark-Dashboard als Browser-Extension.
Boards, Drag & Drop, 8 Themes, Suchleiste, Sticky Notes — alles im Browser, alles offline.
Keine externe Datenübertragung, keine Tracker, keine Analytics, keine Werbung.

Entwickelt von **[Hellion Online Media](https://hellion-media.de)** — JonKazama-Hellion.

---

## Was diese Extension NICHT ist

- Kein Cloud-Sync und kein Account-System
- Keine Datenerfassung oder Telemetrie
- Keine Drittanbieter-Abhängigkeiten oder Build-Tools
- Kein Netzwerkverkehr ausser Favicon-Abruf (Google Favicons API)

## Was diese Extension IST

Ein lokaler, privater NewTab-Ersatz für alle gaengigen Browser.
Bookmarks werden in `chrome.storage.local` gespeichert — nichts verlässt den Browser.
Was angezeigt wird, ist was gespeichert ist. Keine Magie.

---

## Features

### Boards & Bookmarks

- Boards als Gruppen fuer Links — per Drag & Drop umsortierbar
- Bookmarks mit Favicon, Titel, optionaler Beschreibung
- Boards per Blur-Button verstecken (Privat-Modus)
- HTML-Import von Browser-Lesezeichen (Chrome, Edge, Firefox)
- JSON Export & Import (Backup & Restore)

### Suchleiste

- Google, DuckDuckGo oder Bing — per Klick wechselbar
- Ein/ausblendbar über Settings

### Sticky Note

- Schwebendes Notiz-Widget, frei positionierbar
- Text und Position werden persistent gespeichert

### 8 Themes

| Theme | Akzent | Stil |
| --- | --- | --- |
| Astronaut | Orange | Dark / Space |
| Cosmic Clock | Gold | Warm / Mystisch |
| Void Mage | Lila | Arkan |
| Merchantman | Teal | Industrial Sci-Fi |
| Julia & Jin | Blau | FFXIV Night |
| SC Sunset | Amber | Planet-Side |
| Hellion HUD | Gruen | Circuit Board |
| Hellion Energy | Matrix-Gruen | Tactical |

### Settings

- Compact Mode — reduziert Abstände fuer mehr Bookmarks
- Shorten Titles — kürzt lange Titel auf eine Zeile
- Open in New Tab — Bookmarks in neuem Tab oeffnen
- Show Descriptions — Beschreibungen unter Bookmarks anzeigen
- Hide Extra Bookmarks — Boards ab 5/10/20 Bookmarks einklappen
- Hintergrundbild — URL oder lokaler Upload
- Suchleiste ein/ausblenden
- JSON Export / Import
- Danger Zone — Reset aller Daten

---

## Browser-Kompatibilität

| Browser | Status | Manifest |
| --- | --- | --- |
| Chrome | Kompatibel | V3 (`manifest.json`) |
| Edge | Kompatibel | V3 (`manifest.json`) |
| Brave | Kompatibel | V3 (`manifest.json`) |
| Opera | Kompatibel | V3 (`manifest.json`) |
| Opera GX | Kompatibel | V3 (`manifest.json`) |
| Vivaldi | Kompatibel | V3 (`manifest.json`) |
| Firefox | Kompatibel | V2 (`manifest.firefox.json`) |

> **Firefox-Hinweis:** Firefox verwendet aktuell Manifest V2. Mozilla arbeitet an MV3-Support —
> sobald stabil, wird die Extension migriert. MV2 wird von Mozilla weiterhin unterstuetzt.

---

## Installation

### Chrome / Edge / Brave / Opera / Opera GX / Vivaldi

```text
1. Repository als ZIP herunterladen oder git clone
2. chrome://extensions oeffnen (oder edge:// / brave:// / opera://)
3. Entwicklermodus aktivieren
4. "Entpackte Erweiterung laden" → Ordner auswählen in dem manifest.json liegt
5. Neuen Tab oeffnen
```

### Firefox

Firefox benoetigt `manifest.json` im Format V2.

```bash
# manifest.json durch Firefox-Version ersetzen:
copy manifest.firefox.json manifest.json   # Windows
cp manifest.firefox.json manifest.json     # Linux/Mac
```

```text
1. about:debugging#/runtime/this-firefox oeffnen
2. "Temporaeres Add-on laden"
3. Die manifest.json aus dem Projektordner auswählen
```

> **Hinweis:** Temporaere Add-ons werden beim Browser-Neustart entfernt.
> Fuer dauerhafte Installation ist eine signierte `.xpi`-Datei noetig.

---

## Browser-Bookmarks exportieren & importieren

| Browser | Export-Pfad |
| --- | --- |
| Chrome / Edge | Einstellungen → Lesezeichen → Exportieren |
| Firefox | Lesezeichen → Alle Lesezeichen → Importieren und Sichern → Als HTML exportieren |

Die exportierte `.html`-Datei ueber den **Import**-Button in der Extension laden.

---

## Datenschutz

- Keine externe Datenübertragung (ausser Google Favicons API fuer Icons)
- Speicherung in `chrome.storage.local` (Chromium) bzw. `browser.storage.local` (Firefox)
- Keine Tracker, keine Analytics, keine Werbung
- Keine Cookies, keine Session-Daten
- Storage-Quota-Pruefung warnt bei 8 MB+ (Limit: 10 MB)
- Permissions: `storage`, `bookmarks`

---

## Tech-Stack

| Komponente | Details |
| --- | --- |
| Sprache | JavaScript (Vanilla ES2020, keine Frameworks) |
| Styling | CSS Custom Properties (Theme-System) |
| Fonts | Google Fonts (Rajdhani, Inter, Cinzel) |
| Storage | chrome.storage.local / localStorage Fallback |
| Favicons | Google Favicons API (`/s2/favicons`) |
| Drag & Drop | Pointer Events API (nativ) |
| Build | Kein Build-Schritt — direkt lauffähig |
| CI/CD | GitHub Actions (Security, Quality, Release) |

---

## Architektur

```text
hellion-newtab/
├── manifest.json                   # Chrome, Edge, Brave, Opera, Vivaldi (MV3)
├── manifest.firefox.json           # Firefox (MV2)
├── newtab.html                     # Haupt-HTML (UI-Struktur, Modals, Settings Panel)
│
├── src/
│   ├── js/
│   │   ├── storage.js              # Storage Abstraction + Quota-Pruefung
│   │   ├── state.js                # Globaler State, Defaults, Hilfsfunktionen
│   │   ├── themes.js               # Theme-Definitionen & Anwendungslogik
│   │   ├── boards.js               # Board/Bookmark Rendering, Event Delegation, Modals
│   │   ├── drag.js                 # Drag & Drop (Pointer Events, Board + Bookmark)
│   │   ├── settings.js             # Settings Panel (Toggles, Theme-Picker, Background)
│   │   ├── search.js               # Suchleiste (Google, DuckDuckGo, Bing)
│   │   ├── sticky.js               # Sticky Note Widget (Drag, Persist, Toggle)
│   │   ├── data.js                 # JSON Export / Import mit Validierung
│   │   └── app.js                  # Init, Clock, globale Events (Einstiegspunkt)
│   └── css/
│       └── main.css                # Styles + Theme-System + Responsive Breakpoints
│
├── assets/
│   ├── themes/                     # 8 Theme-Hintergrundbilder
│   │   ├── bg-astronaut.jpg
│   │   ├── bg-cosmic-clock.jpg
│   │   ├── bg-void-mage.jpg
│   │   ├── bg-merchantman.webp
│   │   ├── bg-julia-jin.png
│   │   ├── bg-sc-sunset.jpg
│   │   ├── bg-hellion-hud.png
│   │   └── bg-hellion-energy.jpg
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── .github/
    └── workflows/
        ├── security.yml            # CodeQL-Analyse + Dependency Review
        ├── quality.yml             # Struktur, Manifest, Syntax, Versions-Konsistenz
        └── release.yml             # ZIP-Pakete (Chrome + Firefox) + SHA256 Checksummen
```

### Design-Prinzipien

- **Zero Dependencies** — Kein npm, kein Build, kein Framework. Direkt lauffähig
- **Privacy First** — Alle Daten lokal, kein Server-Kontakt
- **Modular** — 10 JS-Dateien mit klarer Zuständigkeit
- **Responsive** — Tablet (768px) und Smartphone (480px) Breakpoints
- **Secure** — createElement statt innerHTML, URL-Validierung, Storage-Fehlerbehandlung
- **Event Delegation** — Ein Listener pro Board-Liste statt pro Bookmark (Performance)
- **Theme-System** — CSS Custom Properties, 8 Themes, Custom-Background-Support

---

## GitHub Actions

### Security Scan (`security.yml`)

- **CodeQL-Analyse** — Statische Sicherheitsanalyse fuer JavaScript
- **Dependency Review** — Prueft Pull Requests auf bekannte Schwachstellen
- **Zeitplan** — Automatisch wöchentlich (Montag 06:00 UTC) + bei Push/PR

### Code Quality (`quality.yml`)

- **Projektstruktur** — Alle Pflichtdateien und -ordner vorhanden
- **Manifest-Validierung** — JSON-Syntax, Version, Permissions
- **JavaScript Syntax-Check** — `node --check` fuer alle JS-Dateien
- **Versions-Konsistenz** — manifest.json, manifest.firefox.json und newtab.html muessen übereinstimmen
- **Icon-Pruefung** — Alle Extension-Icons vorhanden

### Release (`release.yml`)

- **Trigger** — Bei Git-Tag (`v*`)
- **Pakete** — Chrome-ZIP (MV3) + Firefox-ZIP (MV2)
- **Checksummen** — SHA256 fuer alle Artefakte
- **GitHub Release** — Automatisch mit Installationsanleitung

```bash
# Release erstellen:
git tag v1.2.0
git push origin v1.2.0
# → GitHub Action erstellt automatisch Release mit ZIP-Dateien
```

---

## Entwicklung

```bash
# Repository klonen
git clone https://github.com/JonKazama-Hellion/Hellion-NewTab.git

# Extension im Browser laden (siehe Installation)

# Nach Aenderungen: Extension neu laden
chrome://extensions → Hellion NewTab → Neu laden
```

Kein Build-Schritt noetig. Dateien aendern, Extension neu laden, fertig.

---

## Lizenz & Impressum

**Proprietaeres Projekt — alle Rechte vorbehalten.**

| | |
| --- | --- |
| **Entwickler** | Florian Wathling |
| **Unternehmen** | Hellion Online Media |
| **Web** | [hellion-media.de](https://hellion-media.de) |
| **Impressum** | [hellion-media.de/impressum](https://hellion-media.de/impressum) |
| **Bug Reports** | [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Bug%20Report) |

---

## Changelog

### v1.2.0 — 20.03.2026

- Projektstruktur in `src/js/`, `src/css/`, `assets/` aufgeteilt
- JS in 10 Module aufgeteilt (storage, state, themes, boards, drag, settings, search, sticky, data, app)
- Firefox-Kompatibilitaet (`manifest.firefox.json`, Manifest V2)
- Vivaldi bestaetigt kompatibel
- Theme-Bildpfade korrigiert (Settings Preview)
- URL-Validierung bei Bookmark-Erstellung
- JSON-Import mit Board- und Bookmark-Struktur-Validierung
- XSS-Schutz: createElement statt innerHTML fuer Bookmarks
- Storage-Quota-Pruefung mit Warnung bei 8 MB+
- Event Delegation fuer Bookmark-Klicks (Performance)
- Responsive Design (Tablet 768px, Smartphone 480px)
- Sticky Note Header-Kollision behoben
- FileReader-Fehlerbehandlung fuer Hintergrundbild-Upload
- GitHub Actions: Security Scan, Code Quality, Release Automation

### v1.1.0 — 20.03.2026

- 5 neue Themes (Merchantman, Julia & Jin, SC Sunset, Hellion HUD, Hellion Energy)
- Suchleiste (Google / DuckDuckGo / Bing)
- Sticky Note Widget
- JSON Export & Import
- Datum neben der Uhr
- About / Impressum in Settings
- Board Blur-Funktion (Privat-Modus)
- Drag & Drop auf Pointer Events umgestellt
- Opera / Opera GX Kompatibilitaet

### v1.0.0 — 20.03.2026

- Initiales Release
- Boards & Bookmarks mit Drag & Drop
- 3 Themes (Astronaut, Cosmic Clock, Void Mage)
- HTML-Import (Browser-Lesezeichen)
- Settings Panel

---

### Einsatz von AI

AI (Claude Code, Opus 4.6 von Anthropic) wurde als Hilfsmittel eingesetzt — fuer Fehleridentifikation, Code-Review und Qualitaetssicherung. Architektur, Features und alle Entscheidungen sind Eigenleistung.

---

**Hellion NewTab** — [Hellion Online Media](https://hellion-media.de) — JonKazama-Hellion
