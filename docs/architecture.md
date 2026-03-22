# Hellion Dashboard — Architecture

## Overview

Hellion Dashboard is a browser extension (NewTab replacement) built with **Vanilla JavaScript ES2020**, **CSS Custom Properties**, and **zero dependencies**. No build step, no framework, no bundler — files are loaded directly via `<script>` tags.

**Storage:** `chrome.storage.local` with `localStorage` fallback.
**Manifest:** V3 for Chromium browsers, V3 for Firefox (separate manifest).

---

## File Structure

```
HOM_NewTab_Project/
├── newtab.html              # Single HTML entry point
├── manifest.json            # Chrome/Edge/Brave/Vivaldi (MV3)
├── manifest.firefox.json    # Firefox (MV3)
├── manifest.opera.json      # Opera/Opera GX (MV3 + workarounds)
├── src/
│   ├── css/
│   │   └── main.css         # All styles, themes, responsive breakpoints
│   └── js/
│       ├── storage.js        # Storage abstraction layer
│       ├── state.js          # Global state, defaults, helpers
│       ├── themes.js         # Theme definitions & application
│       ├── boards.js         # Board/bookmark rendering & events
│       ├── drag.js           # Drag & drop (Pointer Events API)
│       ├── settings.js       # Settings panel, toggles, theme picker
│       ├── search.js         # Search bar (Google, DuckDuckGo, Bing)
│       ├── widgets.js        # Widget manager (registry, drag, resize)
│       ├── notes.js          # Notes/checklists (multi-instance widgets)
│       ├── calculator.js     # Calculator widget (single-instance)
│       ├── timer.js          # Timer/countdown widget (single-instance)
│       ├── image-ref.js      # Image reference widget (multi-instance)
│       ├── onboarding.js     # First-run onboarding flow
│       ├── data.js           # JSON export/import (backup & restore)
│       ├── app.js            # Init, clock, global events (entry point)
│       └── dialog.js         # Custom dialog system (alert, confirm)
├── assets/
│   ├── icons/                # Extension icons (16-512px)
│   └── themes/               # Theme background images
└── docs/                     # Documentation (you are here)
```

---

## Module Responsibilities

Each module has exactly one responsibility. They communicate through global references (no import/export — this is a browser extension without a bundler).

| Module | Responsibility |
|---|---|
| `storage.js` | **Only** place that touches `chrome.storage` / `localStorage`. All other modules go through `Store.get()` / `Store.set()`. |
| `state.js` | Global `boards` and `settings` arrays, default values, `uid()`, `escHtml()`, `getFaviconUrl()`. |
| `themes.js` | Theme CSS variable application. 8 themes, each with its own `[data-theme]` block in CSS. |
| `boards.js` | Renders boards and bookmarks. Event delegation on board containers. |
| `drag.js` | Board and bookmark reordering via Pointer Events API. |
| `settings.js` | Settings panel UI, toggle handlers, theme modal, background upload. |
| `search.js` | Search bar with engine switching (Google, DuckDuckGo, Bing). |
| `widgets.js` | Widget manager — creates DOM, handles drag/resize/z-index, provides registry. See [widget-schema.md](widget-schema.md). |
| `notes.js` | Notes and checklists as widgets. Multi-instance (max 5). Notebook sidebar. Also handles widget toolbar events. |
| `calculator.js` | Calculator widget. Single-instance. Shunting-yard expression parser (no `eval()`). |
| `timer.js` | Timer/countdown widget. Single-instance. Presets, Web Audio API alarm, tab-title blink. |
| `image-ref.js` | Image reference widget. Multi-instance (max 3). Canvas API WebP conversion, sessionStorage for image data. |
| `onboarding.js` | Multi-slide onboarding flow. Gaming starter board opt-in. |
| `data.js` | JSON export/import with validation. Handles boards, notes, calculator history, timer presets. |
| `app.js` | Entry point. Calls `init()` on DOMContentLoaded. Clock, global event binding. |
| `dialog.js` | `HellionDialog.alert()` and `HellionDialog.confirm()` — custom styled dialogs replacing native browser dialogs. |

---

## Init Sequence

```
DOMContentLoaded
  → init()
    → Store.get('boards')          # Load saved boards
    → Store.get('settings')        # Load saved settings
    → applySettings()              # Apply theme, toggles, etc.
    → renderBoards()               # Render all boards
    → startClock()                 # Start clock/date display
    → bindGlobalEvents()           # Header buttons, modals
    → bindSettingsEvents()         # Settings toggles, theme picker
    → initSearch()                 # Search bar
    → migrateSticky()              # Legacy sticky note migration
    → Notes.init()                 # Notes + widget toolbar
    → Calculator.init()            # Calculator widget
    → Timer.init()                 # Timer widget
    → ImageRef.init()              # Image reference widget
    → initDataButtons()            # Export/import buttons
    → Onboarding check             # First-run onboarding
```

---

## Script Load Order

Scripts are loaded in `newtab.html` in dependency order:

```html
<script src="src/js/dialog.js"></script>
<script src="src/js/storage.js"></script>
<script src="src/js/state.js"></script>
<script src="src/js/themes.js"></script>
<script src="src/js/boards.js"></script>
<script src="src/js/drag.js"></script>
<script src="src/js/settings.js"></script>
<script src="src/js/search.js"></script>
<script src="src/js/onboarding.js"></script>
<script src="src/js/widgets.js"></script>
<script src="src/js/notes.js"></script>
<script src="src/js/calculator.js"></script>
<script src="src/js/timer.js"></script>
<script src="src/js/image-ref.js"></script>
<script src="src/js/data.js"></script>
<script src="src/js/app.js"></script>
```

**Rule:** A module may only reference modules loaded before it.

---

## Z-Index Hierarchy

| Layer | z-index | Elements |
|---|---|---|
| Background | 0-2 | `#bgLayer`, boards |
| Search bar | 90 | `.search-bar-wrapper` |
| Widgets + Toolbar | 100+ | `.widget`, `.widget-toolbar` |
| Header | 100 | `#header` |
| Settings panel | 200 | `#settingsPanel` |
| Dialogs / Modals | 300 | `.hellion-dialog-overlay`, modals |
| Onboarding | 400 | `#onboardingOverlay` |

Widgets use incrementing z-index (`WidgetManager._topZ++`) to stack above each other on click.

---

## Storage Keys

| Key | Type | Content |
|---|---|---|
| `boards` | Array | Board objects with bookmarks |
| `settings` | Object | User preferences (theme, toggles, etc.) |
| `widgetStates` | Object | All widget data (see [widget-schema.md](widget-schema.md)) |
| `onboardingDone` | Boolean | Whether onboarding has been completed |
| `lastBackupReminder` | Number | Timestamp of last backup reminder |

---

## Browser Compatibility

| Browser | Engine | Manifest |
|---|---|---|
| Chrome | Chromium MV3 | `manifest.json` |
| Edge | Chromium MV3 | `manifest.json` |
| Brave | Chromium MV3 | `manifest.json` |
| Vivaldi | Chromium MV3 | `manifest.json` |
| Opera / GX | Chromium MV3 | `manifest.opera.json` |
| Firefox | Gecko MV3 | `manifest.firefox.json` |

Changes affecting manifest fields must be synchronized across all three manifest files.
