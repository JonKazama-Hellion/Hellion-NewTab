# ⬡ Hellion Dashboard v2.0.0

![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20ES2020-F7DF1E?logo=javascript&logoColor=black)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-orange)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-448f45)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-ff5e5b?logo=ko-fi)](https://ko-fi.com/hellionmedia)

**No account. No subscription. No cloud. All data stays 100% local.**

A personal bookmark dashboard as a browser extension.
Boards, drag & drop, 11 themes, search bar, widget system with notes, calculator, timer and more.
Full DE/EN language support with runtime switching. All in the browser, all offline.
No external data transmission, no trackers, no analytics, no ads.

Developed by **[Hellion Online Media — Florian Wathling](https://hellion-media.de)** — JonKazama-Hellion.

---

## What this extension is NOT

- No cloud sync and no account system
- No data collection or telemetry
- No third-party dependencies or build tools
- No network traffic except favicon fetching (Google Favicons API)

## What this extension IS

A local, private NewTab replacement for all major browsers.
Bookmarks are stored in `chrome.storage.local`, nothing leaves the browser.
What you see is what's saved. No magic.

---

## Features

### Boards & Bookmarks

- Boards as groups for links, sortable via drag & drop
- Bookmarks with favicon, title and optional description
- Hide boards with the blur button (privacy mode)
- HTML import from browser bookmarks (Chrome, Edge, Firefox)
- JSON export & import (backup & restore)

### Search Bar

- Google, DuckDuckGo or Bing, switchable with a click
- Toggleable via Settings

### Widget System

- **Notes & Checklists** — Floating note widgets with text or checklist template (max. 5)
- **Calculator** — Shunting-yard parser (no `eval()`), history, keyboard input
- **Timer / Countdown** — Saveable presets, Web Audio API alarm, mute toggle, tab title blinks on completion
- **Image Reference** — Images as floating reference widgets, Canvas API WebP conversion (max. 3, enable in Settings)
- **Notebook Sidebar** — All notes at a glance
- **Widget Toolbar** — Floating buttons for quick access, position (left/right) configurable in Settings
- All widgets: draggable, resizable, z-index stacking on click

### 11 Themes

| Theme | Accent | Style |
|---|---|---|
| Nebula | `#b359ff` Magenta | Cosmic Nebula |
| Crescent | `#d4bd8a` Gold | Minimalist Night |
| Event Horizon | `#9d5cff` Purple | Deep Space |
| Merchantman | `#2eb8b8` Emerald | Industrial Sci-Fi |
| Julia & Jin | `#7db3ff` Aetherial Blue | FFXIV Night |
| SC Sunset | `#ff8c3d` Amber | Planet-Side |
| Hellion HUD | `#32ff6a` Neon Green | Circuit Board |
| Hellion Energy | `#1eff8e` Acid Green | Tactical |
| Satisfactory | `#00b4d8` Cyan | Industrial Desert |
| Avorion | `#2ec4a0` Turquoise | Deep Void |
| Hellion Stealth | `#5ec2ff` Tech Blue | Tactical Recon |

### Image Credits

| Theme | Source | License |
|---|---|---|
| Nebula | [Temel / mrwashingt0n](https://pixabay.com/de/users/mrwashingt0n-15745216/) on Pixabay | Pixabay License (free) |
| Crescent | [Daniil Silantev](https://unsplash.com) on Unsplash | Unsplash License (free) |
| Event Horizon | Own work, still frame from [hellion-initiative.online](https://hellion-initiative.online) | Hellion Online Media |
| Merchantman | [Roberts Space Industries](https://robertsspaceindustries.com), made by the community | RSI Community Content |
| SC Sunset | Screenshot from Star Citizen by Cloud Imperium Games | Fan Content |
| Julia & Jin | Own work, Final Fantasy XIV screenshot, edited in Photoshop | Hellion Online Media |
| Hellion HUD | Own work, AI-generated and post-processed for hellion-media.de | Hellion Online Media |
| Hellion Energy | Own work, AI-generated for hellion-media.de | Hellion Online Media |
| Satisfactory | Screenshot from Satisfactory by Coffee Stain Studios | Fan Content |
| Avorion | Own work, screenshot from Avorion, Hellion Initiative ship | Hellion Online Media |
| Hellion Stealth | Screenshot from Star Citizen by Cloud Imperium Games | Fan Content |

### Language Support (i18n)

- German and English with runtime switching via Settings
- Auto-detect from browser language, manual override available
- All UI elements, dialogs, onboarding and widget labels fully translated

### Onboarding & Dialogs

- 7-step welcome flow on first launch with widget explanation and optional gaming starter board
- Custom frosted glass dialogs instead of native browser popups
- Backup reminder every 7 days (warns about data loss on browser reset)

### Appearance & Settings

- **Appearance modal** (header button), theme picker, background image and all display options in one modal
- **Settings panel** (header button), widgets, data & help, danger zone
- **About footer**, developer info, license and support links permanently visible
- Compact mode, shorten titles, search bar toggle, open links in new tab, descriptions, hide extra bookmarks
- JSON export & import (backup & restore)
- Onboarding repeatable
- Language setting: German, English or auto-detect

---

## Browser Compatibility

| Browser | Status | Manifest |
|---|---|---|
| Chrome | ✅ Compatible | V3 (`manifest.json`) |
| Edge | ✅ Compatible | V3 (`manifest.json`) |
| Brave | ✅ Compatible | V3 (`manifest.json`) |
| Opera | ✅ Compatible | V3 (`manifest.opera.json`) |
| Opera GX | ✅ Compatible | V3 (`manifest.opera.json`) |
| Vivaldi | ✅ Compatible | V3 (`manifest.json`) |
| Firefox | ✅ Compatible | V3 (`manifest.firefox.json`) |

> **Firefox note:** From v1.2.0 onwards the extension runs on Manifest V3, identical to Chrome/Edge.
> `manifest.firefox.json` remains a separate file for Firefox-specific adjustments.

---

## Installation

### Chrome / Edge / Brave / Vivaldi

```text
1. Download the repository as ZIP or git clone
2. Open chrome://extensions (or edge:// / brave://)
3. Enable developer mode
4. Click "Load unpacked" and select the folder containing manifest.json
5. Open a new tab
```

### Opera / Opera GX

```bash
# Use manifest.opera.json as manifest.json:
copy manifest.opera.json manifest.json   # Windows
cp manifest.opera.json manifest.json     # Linux/Mac
```

```text
1. Open opera://extensions
2. Enable developer mode
3. Click "Load unpacked" and select the folder
4. Open a new tab
```

> **Opera note:** Opera GX prioritizes Speed Dial, the included workaround
> takes over the new tab page reliably. Details: [src/js/opera/README.md](src/js/opera/README.md)

### Firefox

```bash
# Use manifest.firefox.json as manifest.json:
copy manifest.firefox.json manifest.json   # Windows
cp manifest.firefox.json manifest.json     # Linux/Mac
```

```text
1. Open about:debugging#/runtime/this-firefox
2. Click "Load Temporary Add-on"
3. Select the manifest.json from the project folder
```

> **Note:** Temporary add-ons are removed on browser restart.
> For permanent installation a signed `.xpi` file is required.

---

## Importing Browser Bookmarks

| Browser | Export path |
|---|---|
| Chrome / Edge | Settings → Bookmarks → Export bookmarks |
| Firefox | Bookmarks → All Bookmarks → Import and Backup → Export Bookmarks to HTML |

Load the exported `.html` file via the **Import** button in the extension.

---

## Privacy

- No external data transmission (except Google Favicons API for icons)
- Storage in `chrome.storage.local` (Chromium) or `browser.storage.local` (Firefox)
- No trackers, no analytics, no ads
- No cookies, no session data
- Storage quota check warns at 8 MB+ (limit: 10 MB)
- Permissions: `storage`, `bookmarks` (all browsers) + `tabs` (Opera / Opera GX only)

---

## Tech Stack

| Component | Details |
|---|---|
| Language | JavaScript (Vanilla ES2020, no frameworks) |
| Styling | CSS Custom Properties (theme system) |
| Fonts | Local fonts (Rajdhani, Inter, Cinzel) |
| Storage | `chrome.storage.local` / `localStorage` fallback |
| Favicons | Google Favicons API (`/s2/favicons`) |
| Drag & Drop | Pointer Events API (native) |
| Build | No build step, runs directly |
| CI/CD | GitHub Actions (security, quality, release) |

---

## Architecture

```text
hellion-newtab/
├── manifest.json                   # Chrome, Edge, Brave, Vivaldi (MV3)
├── manifest.firefox.json           # Firefox (MV3)
├── manifest.opera.json             # Opera / Opera GX (MV3 + workaround)
├── newtab.html                     # Main HTML (UI structure, modals, settings panel)
├── LICENSE                         # CC BY-NC-SA 4.0
├── CHANGELOG.md                    # Version history
├── SECURITY.md                     # Security policy and reporting
├── DISCLAIMER.md                   # Disclaimer and legal
│
├── _locales/
│   ├── de/messages.json            # Manifest-level i18n (German)
│   └── en/messages.json            # Manifest-level i18n (English)
│
├── src/
│   ├── js/
│   │   ├── storage.js              # Storage abstraction + quota check
│   │   ├── state.js                # Global state, defaults, helpers
│   │   ├── i18n.js                 # Internationalization (DE/EN, ~220+ keys, t() helper)
│   │   ├── dialog.js               # Custom dialog system (HellionDialog.alert/confirm)
│   │   ├── themes.js               # Theme definitions & application (11 themes)
│   │   ├── boards.js               # Board/bookmark rendering, event delegation, modals
│   │   ├── drag.js                 # Drag & drop (Pointer Events, board + bookmark)
│   │   ├── settings.js             # Settings panel, appearance modal, accordion
│   │   ├── search.js               # Search bar (Google, DuckDuckGo, Bing)
│   │   ├── widgets.js              # Widget manager (registry, drag, resize, z-index)
│   │   ├── notes.js                # Notes & checklists (multi-instance, max. 5)
│   │   ├── calculator.js           # Calculator (shunting-yard, history)
│   │   ├── timer.js                # Timer/countdown (presets, Web Audio alarm)
│   │   ├── image-ref.js            # Image reference widget (Canvas API, sessionStorage)
│   │   ├── data.js                 # JSON export / import with validation
│   │   ├── onboarding.js           # 7-step welcome flow + gaming board
│   │   ├── app.js                  # Init, clock, global events (entry point)
│   │   └── opera/                  # Opera GX workaround scripts
│   │       ├── background.js       # Tab management against Speed Dial
│   │       └── redirect.js         # Content script redirect
│   └── css/
│       └── main.css                # Styles + 11 themes + responsive breakpoints
│
├── assets/
│   ├── fonts/                      # Local fonts (Rajdhani, Inter, Cinzel)
│   ├── themes/                     # 11 theme background images (WebP only)
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
├── docs/
│   ├── architecture.md             # Project architecture and init sequence
│   ├── widget-schema.md            # Widget system API and schema reference
│   ├── patterns.md                 # Code patterns and conventions
│   └── style-guide.md              # Design system and theme documentation
│
└── .github/
    └── workflows/
        ├── security.yml            # CodeQL analysis + dependency review
        ├── quality.yml             # Structure, manifest, syntax, version consistency
        └── release.yml             # ZIP packages (Chrome + Firefox + Opera) + SHA256
```

### Design Principles

- **Zero Dependencies** — No npm, no build, no framework. Runs directly
- **Privacy First** — All data local, no server contact
- **Modular** — 16 JS files with clear responsibilities
- **Responsive** — Tablet (768px) and smartphone (480px) breakpoints
- **Secure** — `createElement` instead of `innerHTML`, URL validation, storage error handling
- **Event Delegation** — One listener per board list instead of per bookmark (performance)
- **Theme System** — CSS Custom Properties, 11 themes, custom background support

---

## GitHub Actions

### Security Scan (`security.yml`)

- **CodeQL analysis** — Static security analysis for JavaScript
- **Dependency review** — Checks pull requests for known vulnerabilities
- **Schedule** — Automatically weekly (Monday 06:00 UTC) + on push/PR

### Code Quality (`quality.yml`)

- **Project structure** — All required files and folders present
- **Manifest validation** — JSON syntax, version, permissions
- **JavaScript syntax check** — `node --check` for all JS files
- **Version consistency** — manifest.json, manifest.firefox.json and newtab.html must match
- **Icon check** — All extension icons present

### Release (`release.yml`)

- **Trigger** — On Git tag (`v*`)
- **Packages** — Chrome ZIP + Firefox ZIP + Opera ZIP (all MV3)
- **Checksums** — SHA256 for all artifacts
- **GitHub Release** — Automatic with installation instructions

```bash
# Create a release:
git tag v2.0.0
git push origin v2.0.0
# → GitHub Action automatically creates release with ZIP files
```

---

## Development

```bash
# Clone the repository
git clone https://github.com/JonKazama-Hellion/Hellion-NewTab.git

# Load the extension in your browser (see Installation)

# After changes: reload the extension
chrome://extensions → Hellion NewTab → Reload
```

No build step needed. Change files, reload extension, done.

---

## Security

Please do **not** report security vulnerabilities through public GitHub issues.
Details on reporting, response times and security architecture: [SECURITY.md](SECURITY.md)

---

## License & Legal

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

- Free for private use
- Sharing and modification allowed with attribution
- Commercial use without permission prohibited

Full license: [LICENSE](LICENSE) | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

| | |
|---|---|
| **Developer** | Florian Wathling |
| **Company** | Hellion Online Media |
| **Web** | [hellion-media.de](https://hellion-media.de) |
| **Imprint** | [hellion-media.de/impressum](https://hellion-media.de/impressum) |
| **Bug Reports** | [kontakt@hellion-media.de](mailto:kontakt@hellion-media.de?subject=Hellion%20NewTab%20%E2%80%93%20Bug%20Report) |
| **Security** | [SECURITY.md](SECURITY.md) |
| **Support** | [Ko-fi](https://ko-fi.com/hellionmedia) |

---

### Use of AI

**Claude:** Code analysis, bug fixing, documentation and proofreading.
**Me:** Architecture, features and logic are planned, thought through and written by me.

Details: [DISCLAIMER.md](DISCLAIMER.md)

---

> Full version history: [CHANGELOG.md](CHANGELOG.md)

**Hellion NewTab** — [Hellion Online Media](https://hellion-media.de) — JonKazama-Hellion
