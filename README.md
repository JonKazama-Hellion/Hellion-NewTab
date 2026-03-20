# ⬡ Hellion NewTab

> **Privates Projekt — Proprietär · Nicht open source**  
> Entwickelt von Florian Wathling · [Hellion Online Media](https://hellion-media.de)

Persönlicher Bookmark-Dashboard als Browser-Extension.  
**Kein Account. Kein Abo. Keine Cloud. Alle Daten bleiben 100% lokal.**

---

## Features

### 📋 Boards & Bookmarks
- Boards als Gruppen für Links — per Drag & Drop umsortierbar
- Bookmarks mit Favicon, Titel, optionaler Beschreibung
- Boards per 🔒 blurren (Privat-Modus)

### 🔍 Suchleiste
- Google, DuckDuckGo oder Bing — per Klick wechselbar

### 📝 Sticky Note
- Schwebendes Notiz-Widget, frei positionierbar, persistent

### 🎨 8 Themes

| Theme | Akzent | Stil |
|---|---|---|
| Astronaut | Orange | Dark / Space |
| Cosmic Clock | Gold | Warm / Mystisch |
| Void Mage | Lila | Arkan |
| Merchantman | Teal | Industrial Sci-Fi |
| Julia & Jin | Blau | FFXIV Night |
| SC Sunset | Amber | Planet-Side |
| Hellion HUD | Grün | Circuit Board |
| Hellion Energy | Matrix-Grün | Tactical |

### ⚙️ Settings
- Compact mode · Shorten titles · Open in new tab
- Show descriptions · Hide extra bookmarks (5/10/20)
- Hintergrundbild (URL oder lokaler Upload)
- Suchleiste ein/ausblenden
- JSON Export / Import

---

## Browser-Kompatibilität

| Browser | Status | Manifest |
|---|---|---|
| Chrome | ✅ | V3 (`manifest.json`) |
| Edge | ✅ | V3 (`manifest.json`) |
| Brave | ✅ | V3 (`manifest.json`) |
| Opera | ✅ | V3 (`manifest.json`) |
| Opera GX | ✅ | V3 (`manifest.json`) |
| Vivaldi | ✅ | V3 (`manifest.json`) |
| Firefox | ✅ | V2 (`manifest.firefox.json`) |

---

## Installation

### Chrome / Edge / Brave / Opera / Opera GX / Vivaldi
```
1. Repo klonen oder ZIP entpacken
2. chrome://extensions  (oder edge:// / brave:// / opera://)
3. Entwicklermodus aktivieren
4. "Entpackte Erweiterung laden" → Ordner "hellion-newtab" auswählen
5. Neuen Tab öffnen ✓
```

### Firefox
Firefox benötigt `manifest.json` im Format V2.

```bash
# manifest.json durch Firefox-Version ersetzen:
copy manifest.firefox.json manifest.json   # Windows
cp manifest.firefox.json manifest.json     # Linux/Mac
```

```
1. about:debugging#/runtime/this-firefox öffnen
2. "Temporäres Add-on laden"
3. Die manifest.json aus dem hellion-newtab Ordner auswählen
```

> **Hinweis Firefox:** Temporäre Add-ons werden beim Browser-Neustart entfernt.  
> Für dauerhafte Installation ist eine signierte `.xpi`-Datei nötig.

> **Wichtig allgemein:** Den Ordner auswählen, in dem `manifest.json` direkt liegt.

---

## Browser-Bookmarks exportieren & importieren

**Chrome / Edge:**
```
Einstellungen → Lesezeichen → Exportieren
```
**Firefox:**
```
Lesezeichen → Alle Lesezeichen → Importieren und Sichern → Als HTML exportieren
```

Die exportierte `.html` Datei über den `Import`-Button in der Extension laden.

---

## Projektstruktur

```
hellion-newtab/
├── manifest.json              ← Chrome, Edge, Brave, Opera, Vivaldi (MV3)
├── manifest.firefox.json      ← Firefox (MV2)
├── newtab.html                ← Haupt-HTML
│
├── src/
│   ├── js/
│   │   ├── storage.js         ← Storage Abstraction (chrome.storage / localStorage)
│   │   ├── state.js           ← Globaler State, Defaults, Hilfsfunktionen
│   │   ├── themes.js          ← Theme-Definitionen & Anwendungslogik
│   │   ├── boards.js          ← Board/Bookmark Rendering & Modals
│   │   ├── drag.js            ← Drag & Drop (Pointer Events)
│   │   ├── settings.js        ← Settings Panel Logik
│   │   ├── search.js          ← Suchleiste
│   │   ├── sticky.js          ← Sticky Note Widget
│   │   ├── data.js            ← JSON Export / Import
│   │   └── app.js             ← Init, Clock, globale Events (Einstiegspunkt)
│   └── css/
│       └── main.css           ← Styles + Theme-System (CSS Custom Properties)
│
└── assets/
    ├── themes/
    │   ├── bg-astronaut.jpg
    │   ├── bg-cosmic-clock.jpg
    │   ├── bg-void-mage.jpg
    │   ├── bg-merchantman.webp
    │   ├── bg-julia-jin.png
    │   ├── bg-sc-sunset.jpg
    │   ├── bg-hellion-hud.png
    │   └── bg-hellion-energy.jpg
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## Entwicklung

```bash
# Nach Änderungen: Extension im Browser neu laden
chrome://extensions → Hellion NewTab → ↻ Neu laden
```

---

## Datenschutz

- Keine externe Datenübertragung
- Speicherung in `chrome.storage.local` (Chromium) bzw. `browser.storage.local` (Firefox)
- Keine Tracker, keine Analytics, keine Werbung
- Permissions: `storage`, `bookmarks`

---

## Lizenz & Impressum

**Proprietäres Projekt — alle Rechte vorbehalten.**

| | |
|---|---|
| **Entwickler** | Florian Wathling |
| **Unternehmen** | Hellion Online Media |
| **Web** | [hellion-media.de](https://hellion-media.de) |
| **Impressum** | [hellion-media.de/impressum](https://hellion-media.de/impressum) |
| **Bug Reports** | [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Bug%20Report) |

---

## Changelog

### v1.2.0 — 20.03.2026
- Projektstruktur in `src/js/`, `src/css/`, `assets/` aufgeteilt
- JS in Module aufgeteilt (storage, state, themes, boards, drag, settings, search, sticky, data, app)
- Firefox-Kompatibilität (`manifest.firefox.json`, Manifest V2)
- Vivaldi bestätigt kompatibel

### v1.1.0 — 20.03.2026
- 5 neue Themes
- Suchleiste (Google / DDG / Bing)
- Sticky Note Widget
- JSON Export & Import
- Datum neben der Uhr
- About / Impressum in Settings
- Board Blur-Funktion
- Drag & Drop auf Pointer Events umgestellt
- Opera / Opera GX Kompatibilität

### v1.0.0 — 20.03.2026
- Initiales Release
- Boards & Bookmarks mit Drag & Drop
- 3 Themes
- HTML-Import
- Settings Panel

---

> **Hinweis:** Bei der Entwicklung dieses Projekts wurde [Claude Code (Opus 4.6)](https://claude.ai) von Anthropic als Assistent zur Fehleridentifikation und Code-Qualitätssicherung eingesetzt.
