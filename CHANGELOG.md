# ⬡ Hellion Dashboard — Changelog

All notable changes per version. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

> Changelog entries can be written in English or German. English preferred for consistency.

---

## [2.1.0] — 2026-04-16

### Added
- **Calculator Tab-System:** 6 Modi über Tab-Leiste erreichbar (Standard, Scientific, Unit, SAT, FAC, STA)
- **Scientific-Modus:** Wurzel, Potenz, Pi, Euler, Vorzeichen-Wechsel + Formel-Helfer (Kreis, Pythagoras, Prozent, Temperatur)
- **Unit-Converter:** 6 Kategorien (Länge, Gewicht, Temperatur, Volumen, Geschwindigkeit, Fläche) mit Live-Konvertierung und Swap
- **Satisfactory Calculator:** Items/Min, Overclock-Power (Exponent 1.321928), Maschinen-Rechner
- **Factorio Calculator:** Assembler-Ratios, Belt-Throughput, Maschinen-Rechner mit Belt-Empfehlung
- **Stationeers Calculator:** Idealgas (PV=nRT), Furnace/Verbrennung, Solar/Batterie-Dimensionierung, Atmosphären-Mixer

### Changed
- Parser um `^` (Potenz, rechts-assoziativ) und `sqrt()` erweitert
- Calculator-Widget Auto-Resize auf 320×480 für komplexe Modi
- ~110 neue i18n-Keys (DE + EN)

---

### v2.0.1 — 16.04.2026

#### Security

- **Background URL validation** — Only `blob:` and `data:image/` protocols allowed in CSS `backgroundImage` (prevents CSS injection via manipulated storage)
- **Import URL validation** — `javascript:`, `data:`, and other unsafe protocols are blocked during JSON import
- **Immutable import mapping** — Imported boards, bookmarks, and notes are sanitized with explicit field selection and string length limits

#### Fixed

- **Widget minimize race condition** — Replaced `setTimeout` with `transitionend` event; `openWidget()` during animation no longer causes display glitch
- **Notes import mutation** — Import now uses `Notes.init()` instead of directly setting `Notes._notes`
- **Complete i18n coverage** — 5 header button tooltips and 3 settings button texts now have `data-i18n` attributes (10 new translation keys)

#### Changed

- **Widget event system** — `WidgetManager` now dispatches `widget:close`, `widget:minimize`, `widget:open` CustomEvents via `EventTarget`. Calculator, Timer, and ImageRef use `WidgetManager.on()` instead of monkey-patching
- **Local favicon icons** — Replaced Google Favicons API with local colored letter icons (deterministic hue per title). Zero external network requests, Brave Shields compatible
- **backdrop-filter fallback** — `@supports not (backdrop-filter)` block with `--bg-solid-fallback` per theme for Brave Shields compatibility
- **Clock interval cleanup** — `setInterval` ID stored in variable

---

### v2.0.0 — 22.03.2026

#### New Features

- **Internationalization (i18n)** — Full DE/EN language support with runtime switching
- Language setting in Settings panel: German, English or Auto-detect (browser language)
- `i18n.js` module with ~220+ string keys, `t(key, vars?)` helper and `data-i18n` HTML attributes
- `_locales/de/` and `_locales/en/` for manifest-level i18n (`__MSG_extName__`, `__MSG_extDesc__`)
- `<html lang>` attribute updates dynamically when language changes
- All modules migrated: dialog, boards, onboarding, notes, calculator, timer, image-ref, data, bookmark-import, storage, settings, widgets, app

#### Technical

- New script load order: `storage → state → i18n → dialog → ...`
- `applyLanguage()` scans DOM for `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`
- Onboarding slides use i18n keys instead of hardcoded text (rendered at display time)
- Clock day/month names via i18n keys instead of hardcoded arrays
- `resolveLang()` helper for DRY language resolution (auto → browser detect)

---

### v1.10.0 — 22.03.2026

#### Themes

- **3 new themes** — Satisfactory (Industrial Desert), Avorion (Deep Void) and Hellion Stealth (Tactical Recon)
- Now **11 themes** total, each with its own accent colors, overlays and font styles
- Satisfactory has increased board alpha (0.65) and stronger blur (12px), a deliberate choice for better readability on a visually busy background
- Avorion uses a radial gradient overlay so the ship in the center of the image stays visible
- Hellion Stealth is the only theme with a `border-left` hover effect in tactical scanner style

---

### v1.9.0 — 22.03.2026

#### New Features

- **Onboarding reworked** — 7 slides instead of 6, new slide explains the widget toolbar with all widgets
- **Gaming Starter Board** — Opt-in during onboarding: pre-filled board with links to Satisfactory, Factorio, Avorion, Minecraft and Star Citizen
- **Settings redesign** — Settings panel slimmed down to 3 sections (Widgets, Data & Help, Danger Zone)
- **Appearance modal** — Theme picker and all display settings combined in one modal instead of spread across the panel
- **Fixed about footer** — Developer info, license and links are now permanently visible at the bottom of the settings panel
- **Project documentation** — `docs/architecture.md`, `docs/widget-schema.md` and `docs/patterns.md` for anyone who wants to fork or contribute

#### Improvements

- All labels and descriptions unified in German, no more language mix
- Dropdown options use theme colors instead of white browser default
- Firefox update URL for store publishing added to `manifest.firefox.json`

---

### v1.8.0 — 21.03.2026

#### New Features

- **Image Reference Widget** — Drop images as floating reference widgets (max. 3 at once)
- Canvas API WebP conversion for smaller file sizes, all local in the browser
- Two-layer storage: metadata persistent, image data session-only (sessionStorage)
- Load images via drag & drop or file dialog
- Labels editable with debounced save
- Feature is off by default, enable via Settings → Widgets

---

### v1.7.1 — 21.03.2026

#### Improvements

- **Timer mute toggle** — Alarm can be muted via icon button without restarting the timer
- Alarm volume reduced to 7%, 30% was a bit much
- Mute state is saved and persists on next open

---

### v1.7.0 — 21.03.2026

#### New Features

- **Calculator widget** — Shunting-yard parser (no `eval()`), history of last calculations, keyboard input
- **Timer/countdown widget** — Saveable presets, Web Audio API alarm, tab title blinks when timer completes
- **Widget z-index fix** — Widgets now correctly render above the search bar (z-index 100+)

---

### v1.6.0 — 21.03.2026

#### New Features

- **Widget system** — Draggable, resizable floating panels managed by WidgetManager
- **Notes & checklists** — Multi-instance widgets (max. 5) with text and checklist template, Markdown support, export as `.md`
- **Notebook sidebar** — All notes at a glance, quick access via toolbar
- **Widget toolbar** — Floating buttons on the side for quick access to all widgets, position (left/right) configurable in Settings
- **Sticky note migration** — Old sticky notes are automatically migrated to the new widget system on first launch

#### Improvements

- Ko-fi support link added to the about section and `FUNDING.yml`

---

### v1.5.2 — 21.03.2026

#### New Features

- **Custom dialog system** — Native `confirm()` and `alert()` replaced with frosted glass dialogs (`dialog.js`)
- **Onboarding** — 6-step welcome flow on first launch with explanations for boards, themes, features and a backup reminder
- **Backup reminder** — Reminds every 7 days to run a JSON export and warns about data loss on browser reset
- **Theme modal** — Theme picker moved to its own modal with its own header button
- **Accordion settings** — All settings sections collapsible (About and Danger Zone closed by default)

#### Improvements

- Fonts migrated from Google Fonts API to local WOFF2 files (GDPR, ~388 KB saved)
- `innerHTML` fully replaced with `createElement` and `createElementNS` (XSS protection)
- SVG icons now via `createElementNS` instead of inline HTML
- Drag & drop uses CSS classes instead of inline styles (`.drag-ghost`, `.drag-over`, `.dragging-source`)
- Search bar toggle moved from DATA to BEHAVIOR section
- Unimplemented "Quick Save" UI element removed
- Onboarding repeatable via Settings → Help

#### Opera / Opera GX

- `manifest.opera.json` added (MV3 with workaround scripts)
- `src/js/opera/background.js` monitors tabs and redirects away from Opera Speed Dial
- `src/js/opera/redirect.js` fires as content script at `document_start`

#### Firefox

- `manifest.firefox.json` migrated to Manifest V3
- `browser_specific_settings` with Gecko ID and `data_collection_permissions` added

#### Build & CI

- GitHub Actions release now builds 3 ZIP packages (Chrome, Firefox, Opera)
- Quality check validates all 3 manifests and the Opera folder

---

### v1.2.0 — 20.03.2026

- Project structure split into `src/js/`, `src/css/` and `assets/`
- JS split into 10 modules (storage, state, themes, boards, drag, settings, search, sticky, data, app)
- Firefox compatibility (`manifest.firefox.json`, Manifest V3)
- Vivaldi confirmed compatible
- Theme image paths fixed (settings preview)
- URL validation on bookmark creation
- JSON import validates board and bookmark structure
- XSS protection: `createElement` instead of `innerHTML` for bookmarks
- Storage quota check with warning at 8 MB+
- Event delegation for bookmark clicks (performance)
- Responsive design (tablet 768px, smartphone 480px)
- Sticky note header collision fixed
- FileReader error handling for background image upload
- GitHub Actions: security scan, code quality, release automation
- 3 themes replaced: Astronaut → Nebula, Cosmic Clock → Crescent, Void Mage → Event Horizon
- All theme images checked and documented for license compliance
- LICENSE (CC BY-NC-SA 4.0), SECURITY.md and DISCLAIMER.md added

---

### v1.1.0 — 20.03.2026

- 5 new themes (Merchantman, Julia & Jin, SC Sunset, Hellion HUD, Hellion Energy)
- Search bar (Google, DuckDuckGo, Bing)
- Sticky note widget
- JSON export & import
- Date next to the clock
- About / imprint in settings
- Board blur function (privacy mode)
- Drag & drop migrated to Pointer Events API
- Opera / Opera GX compatibility

---

### v1.0.0 — 20.03.2026

- Initial release
- Boards & bookmarks with drag & drop
- 3 themes (Nebula, Crescent, Event Horizon)
- HTML import (browser bookmarks)
- Settings panel

---

**Hellion NewTab** — [Hellion Online Media](https://hellion-media.de) — JonKazama-Hellion
