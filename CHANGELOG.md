# ⬡ Hellion Dashboard — Changelog

Alle relevanten Änderungen pro Version. Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

### v1.5.2 — 21.03.2026

#### Neue Features

- **Custom Dialog-System** — Native `confirm()` und `alert()` durch Frosted-Glass-Dialoge ersetzt (`dialog.js`)
- **Onboarding** — 6-stufiger Willkommens-Flow beim ersten Start mit Boards, Themes, Features und Backup-Hinweis
- **Backup-Reminder** — Erinnert alle 7 Tage an JSON-Export, warnt vor Datenverlust bei Browser-Reset
- **Theme-Modal** — Theme-Picker als eigenes Modal aus Settings ausgelagert, eigener Header-Button
- **Accordion-Settings** — Alle Settings-Sektionen einklappbar mit Chevron (About/Danger Zone standardmäßig zu)

#### Verbesserungen

- Fonts von Google Fonts API auf lokale WOFF2-Dateien umgestellt (DSGVO)
- Ungenutzte Font-Dateien entfernt (~388 KB gespart)
- `innerHTML` komplett durch `createElement`/`createElementNS` ersetzt (XSS-Schutz)
- SVG-Icons via `createElementNS` statt Inline-HTML
- Drag & Drop: Inline-Styles durch CSS-Klassen ersetzt (`.drag-ghost`, `.drag-over`, `.dragging-source`)
- Suchleisten-Toggle von DATA nach BEHAVIOR verschoben
- Nicht implementiertes "Quick Save" UI-Element entfernt
- Onboarding wiederholbar über Settings → Help

#### Opera / Opera GX

- `manifest.opera.json` hinzugefügt (MV3 mit Workaround-Skripten)
- `src/js/opera/background.js` — Tab-Management gegen Opera Speed Dial
- `src/js/opera/redirect.js` — Content Script Redirect bei `document_start`

#### Firefox

- `manifest.firefox.json` auf Manifest V3 migriert
- `browser_specific_settings` mit Gecko-ID und `data_collection_permissions`

#### Build & CI

- GitHub Actions: Release erstellt jetzt 3 ZIP-Pakete (Chrome, Firefox, Opera)
- Quality-Check prüft alle 3 Manifests und Opera-Ordner

---

### v1.2.0 — 20.03.2026

- Projektstruktur in `src/js/`, `src/css/`, `assets/` aufgeteilt
- JS in 10 Module aufgeteilt (storage, state, themes, boards, drag, settings, search, sticky, data, app)
- Firefox-Kompatibilität (`manifest.firefox.json`, Manifest V3)
- Vivaldi bestätigt kompatibel
- Theme-Bildpfade korrigiert (Settings Preview)
- URL-Validierung bei Bookmark-Erstellung
- JSON-Import mit Board- und Bookmark-Struktur-Validierung
- XSS-Schutz: `createElement` statt `innerHTML` für Bookmarks
- Storage-Quota-Prüfung mit Warnung bei 8 MB+
- Event Delegation für Bookmark-Klicks (Performance)
- Responsive Design (Tablet 768px, Smartphone 480px)
- Sticky Note Header-Kollision behoben
- FileReader-Fehlerbehandlung für Hintergrundbild-Upload
- GitHub Actions: Security Scan, Code Quality, Release Automation
- 3 Themes ersetzt: Astronaut → Nebula, Cosmic Clock → Crescent, Void Mage → Event Horizon
- Alle Theme-Bilder lizenzrechtlich geprüft und dokumentiert
- LICENSE (CC BY-NC-SA 4.0), SECURITY.md und DISCLAIMER.md hinzugefügt

---

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

---

### v1.0.0 — 20.03.2026

- Initiales Release
- Boards & Bookmarks mit Drag & Drop
- 3 Themes (Nebula, Crescent, Event Horizon)
- HTML-Import (Browser-Lesezeichen)
- Settings Panel

---

**Hellion NewTab** — [Hellion Online Media](https://hellion-media.de) — JonKazama-Hellion