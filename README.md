# ⬡ Hellion NewTab v1.2.0

![Version](https://img.shields.io/badge/Version-1.2.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES2020-F7DF1E?logo=javascript&logoColor=black)
![Manifest](https://img.shields.io/badge/Manifest-V3%20%7C%20V2-green)
![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-orange)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Lokal-448f45)

**Kein Account. Kein Abo. Keine Cloud. Alle Daten bleiben 100% lokal.**

Ein persönlicher Bookmark-Dashboard als Browser-Extension.
Boards, Drag & Drop, 8 Themes, Suchleiste, Sticky Notes — alles im Browser, alles offline.
Keine externe Datenübertragung, keine Tracker, keine Analytics, keine Werbung.

Entwickelt von **[Hellion Online Media](https://hellion-media.de)** — JonKazama-Hellion.

---

## Was diese Extension NICHT ist

- Kein Cloud-Sync und kein Account-System
- Keine Datenerfassung oder Telemetrie
- Keine Drittanbieter-Abhängigkeiten oder Build-Tools
- Kein Netzwerkverkehr außer Favicon-Abruf (Google Favicons API)

## Was diese Extension IST

Ein lokaler, privater NewTab-Ersatz für alle gängigen Browser.
Bookmarks werden in `chrome.storage.local` gespeichert — nichts verlässt den Browser.
Was angezeigt wird, ist was gespeichert ist. Keine Magie.

---

## Features

### Boards & Bookmarks

- Boards als Gruppen für Links — per Drag & Drop umsortierbar
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
| Nebula | Magenta | Cosmic Nebula |
| Crescent | Gold | Minimalist Night |
| Event Horizon | Orange | Deep Space |
| Merchantman | Teal | Industrial Sci-Fi |
| Julia & Jin | Blau | FFXIV Night |
| SC Sunset | Amber | Planet-Side |
| Hellion HUD | Grün | Circuit Board |
| Hellion Energy | Matrix-Grün | Tactical |

### Bild-Credits

| Theme | Quelle | Lizenz |
| --- | --- | --- |
| Nebula | [Temel / mrwashingt0n](https://pixabay.com/de/users/mrwashingt0n-15745216/) auf Pixabay | Pixabay License (frei) |
| Crescent | [Daniil Silantev](https://unsplash.com) auf Unsplash | Unsplash License (frei) |
| Event Horizon | Eigenes Werk — Stillframe von [hellion-initiative.online](https://hellion-initiative.online) | Hellion Online Media |
| Merchantman | [Roberts Space Industries](https://robertsspaceindustries.com) — Made by the community | RSI Community Content |
| SC Sunset | Screenshot aus Star Citizen von Cloud Imperium Games | Fan Content |
| Julia & Jin | Eigenes Werk — Final Fantasy XIV Screenshot, bearbeitet in Photoshop | Hellion Online Media |
| Hellion HUD | Eigenes Werk — AI-generiert und nachbearbeitet für hellion-media.de | Hellion Online Media |
| Hellion Energy | Eigenes Werk — AI-generiert für hellion-media.de | Hellion Online Media |

### Settings

- Compact Mode — reduziert Abstände für mehr Bookmarks
- Shorten Titles — kürzt lange Titel auf eine Zeile
- Open in New Tab — Bookmarks in neuem Tab öffnen
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
> sobald stabil, wird die Extension migriert. MV2 wird von Mozilla weiterhin unterstützt.

---

## Installation

### Chrome / Edge / Brave / Opera / Opera GX / Vivaldi

```text
1. Repository als ZIP herunterladen oder git clone
2. chrome://extensions öffnen (oder edge:// / brave:// / opera://)
3. Entwicklermodus aktivieren
4. "Entpackte Erweiterung laden" → Ordner auswählen in dem manifest.json liegt
5. Neuen Tab öffnen
```

### Firefox

Firefox benötigt `manifest.json` im Format V2.

```bash
# manifest.json durch Firefox-Version ersetzen:
copy manifest.firefox.json manifest.json   # Windows
cp manifest.firefox.json manifest.json     # Linux/Mac
```

```text
1. about:debugging#/runtime/this-firefox öffnen
2. "Temporäres Add-on laden"
3. Die manifest.json aus dem Projektordner auswählen
```

> **Hinweis:** Temporäre Add-ons werden beim Browser-Neustart entfernt.
> Für dauerhafte Installation ist eine signierte `.xpi`-Datei nötig.

---

## Browser-Bookmarks exportieren & importieren

| Browser | Export-Pfad |
| --- | --- |
| Chrome / Edge | Einstellungen → Lesezeichen → Exportieren |
| Firefox | Lesezeichen → Alle Lesezeichen → Importieren und Sichern → Als HTML exportieren |

Die exportierte `.html`-Datei über den **Import**-Button in der Extension laden.

---

## Datenschutz

- Keine externe Datenübertragung (außer Google Favicons API für Icons)
- Speicherung in `chrome.storage.local` (Chromium) bzw. `browser.storage.local` (Firefox)
- Keine Tracker, keine Analytics, keine Werbung
- Keine Cookies, keine Session-Daten
- Storage-Quota-Prüfung warnt bei 8 MB+ (Limit: 10 MB)
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
├── LICENSE                         # CC BY-NC-SA 4.0
├── SECURITY.md                     # Sicherheitsrichtlinie und Meldeprozess
├── DISCLAIMER.md                   # Haftungsausschluss
│
├── src/
│   ├── js/
│   │   ├── storage.js              # Storage Abstraction + Quota-Prüfung
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
│   │   ├── bg-nebula.jpg
│   │   ├── bg-crescent.jpg
│   │   ├── bg-event-horizon.jpg
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

- **CodeQL-Analyse** — Statische Sicherheitsanalyse für JavaScript
- **Dependency Review** — Prüft Pull Requests auf bekannte Schwachstellen
- **Zeitplan** — Automatisch wöchentlich (Montag 06:00 UTC) + bei Push/PR

### Code Quality (`quality.yml`)

- **Projektstruktur** — Alle Pflichtdateien und -ordner vorhanden
- **Manifest-Validierung** — JSON-Syntax, Version, Permissions
- **JavaScript Syntax-Check** — `node --check` für alle JS-Dateien
- **Versions-Konsistenz** — manifest.json, manifest.firefox.json und newtab.html müssen übereinstimmen
- **Icon-Prüfung** — Alle Extension-Icons vorhanden

### Release (`release.yml`)

- **Trigger** — Bei Git-Tag (`v*`)
- **Pakete** — Chrome-ZIP (MV3) + Firefox-ZIP (MV2)
- **Checksummen** — SHA256 für alle Artefakte
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

# Nach Änderungen: Extension neu laden
chrome://extensions → Hellion NewTab → Neu laden
```

Kein Build-Schritt nötig. Dateien ändern, Extension neu laden, fertig.

---

## Sicherheit

Sicherheitslücken bitte **nicht** über öffentliche Issues melden.
Details zur Meldung, Reaktionszeiten und Sicherheitsarchitektur: [SECURITY.md](SECURITY.md)

---

## Lizenz & Impressum

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

- Kostenlos für private Nutzung
- Teilen und Modifikation erlaubt mit Namensnennung
- Kommerzielle Nutzung ohne Erlaubnis verboten

Vollständige Lizenz: [LICENSE](LICENSE) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

| | |
| --- | --- |
| **Entwickler** | Florian Wathling |
| **Unternehmen** | Hellion Online Media |
| **Web** | [hellion-media.de](https://hellion-media.de) |
| **Impressum** | [hellion-media.de/impressum](https://hellion-media.de/impressum) |
| **Bug Reports** | [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Bug%20Report) |
| **Security** | [SECURITY.md](SECURITY.md) |

---

## Changelog

### v1.2.0 — 20.03.2026

- Projektstruktur in `src/js/`, `src/css/`, `assets/` aufgeteilt
- JS in 10 Module aufgeteilt (storage, state, themes, boards, drag, settings, search, sticky, data, app)
- Firefox-Kompatibilität (`manifest.firefox.json`, Manifest V2)
- Vivaldi bestätigt kompatibel
- Theme-Bildpfade korrigiert (Settings Preview)
- URL-Validierung bei Bookmark-Erstellung
- JSON-Import mit Board- und Bookmark-Struktur-Validierung
- XSS-Schutz: createElement statt innerHTML für Bookmarks
- Storage-Quota-Prüfung mit Warnung bei 8 MB+
- Event Delegation für Bookmark-Klicks (Performance)
- Responsive Design (Tablet 768px, Smartphone 480px)
- Sticky Note Header-Kollision behoben
- FileReader-Fehlerbehandlung für Hintergrundbild-Upload
- GitHub Actions: Security Scan, Code Quality, Release Automation
- 3 Themes ersetzt: Astronaut → Nebula, Cosmic Clock → Crescent, Void Mage → Event Horizon
- Alle Theme-Bilder lizenzrechtlich geprüft und dokumentiert
- LICENSE (CC BY-NC-SA 4.0), SECURITY.md und DISCLAIMER.md hinzugefügt

### v1.1.0 — 20.03.2026

- 5 neue Themes (Merchantman, Julia & Jin, SC Sunset, Hellion HUD, Hellion Energy)
- Suchleiste (Google / DuckDuckGo / Bing)
- Sticky Note Widget
- JSON Export & Import
- Datum neben der Uhr
- About / Impressum in Settings
- Board Blur-Funktion (Privat-Modus)
- Drag & Drop auf Pointer Events umgestellt
- Opera / Opera GX Kompatibilität

### v1.0.0 — 20.03.2026

- Initiales Release
- Boards & Bookmarks mit Drag & Drop
- 3 Themes (Nebula, Crescent, Event Horizon)
- HTML-Import (Browser-Lesezeichen)
- Settings Panel

---

### Einsatz von AI

AI (Claude Code, Opus 4.6 von Anthropic) wurde als Hilfsmittel eingesetzt — für Fehleridentifikation, Code-Review und Qualitätssicherung. Architektur, Features und alle Entscheidungen sind Eigenleistung.

---

**Hellion NewTab** — [Hellion Online Media](https://hellion-media.de) — JonKazama-Hellion
