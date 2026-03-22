# Hellion Dashboard — Design & Theme System

> This document is intentionally written in English. Full German/English i18n support
> is planned for v2.0 — until then, English keeps the docs accessible to anyone
> who wants to contribute or fork the project.

---

## Design Pillars

| Pillar | Description |
|---|---|
| **Immersion** | The interface feels like a HUD floating over the scene, not a foreign object sitting on top of it |
| **Visual Clarity** | Deliberate use of `blur` separates UI from background and reduces visual noise and cognitive load |
| **Harmony** | Every theme pulls its colors from the dominant light sources in its background image |

---

## Background Images — WebP Only

**All background images must be in WebP format.** This is an intentional architectural
decision to keep storage quota usage predictable and leave room for future features
(widgets, image references, etc.) that also compete for the 10 MB `chrome.storage` limit.

JPG, PNG and other formats are not accepted, so convert before adding a theme.

### Recommended Settings

| Quality | When to use |
|---|---|
| 85 | Default, good balance of size and sharpness |
| 80 | For images over 500 KB |
| 90 | For images with fine details (stars, in-game UI text) |

### Conversion Tools

**Squoosh** (squoosh.app) — browser-based, no install, nothing gets uploaded to external servers.
Drag in the image, pick WebP, set quality to 85, download. Done.

**cwebp** (command line):
```bash
cwebp -q 85 input.jpg -o output.webp
```

### Current Theme Images

| File | Status |
|---|---|
| `bg-nebula.webp` | ✅ WebP |
| `bg-crescent.webp` | ✅ WebP |
| `bg-event-horizon.webp` | ✅ WebP |
| `bg-merchantman.webp` | ✅ WebP |
| `bg-julia-jin.webp` | ✅ WebP |
| `bg-sc-sunset.webp` | ✅ WebP |
| `bg-hellion-hud.webp` | ✅ WebP |
| `bg-hellion-energy.webp` | ✅ WebP |
| `bg-satisfactory.webp` | ✅ WebP |
| `bg-avorion.webp` | ✅ WebP |
| `bg-scPolaris.webp` | ✅ WebP |

---

## Anatomy of a Theme

Every theme lives in `main.css` as a `[data-theme="name"]` block. Copy this template
to add a new one:

```css
[data-theme="your-theme-name"] {
  /* 1. ACCENTS — The light source */
  --accent:          #HEXCODE;             /* Main color (neon/light) */
  --accent-dim:      rgba(R, G, B, 0.12);  /* Subtle background tint */
  --accent-glow:     rgba(R, G, B, 0.08);  /* Glow for logo & clock */
  --border-accent:   rgba(R, G, B, 0.25);  /* Focus ring */

  /* 2. BASE — The foundation */
  --bg-primary:      #HEXCODE;             /* Darkest point in the image */
  --bg-board:        rgba(R, G, B, 0.55);  /* Glass effect on boards */
  --border:          rgba(R, G, B, 0.12);  /* Default border */

  /* 3. TEXT — Contrast */
  --text-primary:    #FFFFFF;              /* Readable, slightly tinted */
  --text-secondary:  #A0A0A0;             /* Desaturated, less visual weight */
  --text-muted:      #606060;             /* Barely visible, for hints */

  /* 4. OVERLAY — Vignette */
  --overlay-bg: radial-gradient(
    circle at center,
    transparent 0%,
    var(--bg-primary) 100%
  );

  /* 5. COMPONENT COLORS */
  --header-bg:          rgba(R, G, B, 0.94);
  --board-hover-border: rgba(R, G, B, 0.22);
  --toggle-on-bg:       rgba(R, G, B, 0.20);
  --logo-shadow:        rgba(R, G, B, 0.50);

  /* 6. FONTS */
  --font-display: 'Rajdhani', sans-serif;
  --font-body:    'Inter', sans-serif;
}

/* Theme-specific overrides */
[data-theme="your-theme-name"] .logo        { letter-spacing: 4px; }
[data-theme="your-theme-name"] .clock       { color: var(--accent); }
[data-theme="your-theme-name"] .board-title { text-transform: uppercase; }
[data-theme="your-theme-name"] .board       { backdrop-filter: blur(8px); }
[data-theme="your-theme-name"] .bm-item:hover { background: var(--accent-dim); }
```

After adding the CSS block, register the theme in `src/js/themes.js` and add a preview entry in the theme picker.

---

## UI Patterns

### Frosted Glass

Hardware-accelerated blur for readability on complex backgrounds:

```css
backdrop-filter: blur(8px);
```

Creates depth and visual calm behind text and UI elements. Standard value is `8px`. Only increase it when the background image has a lot of fine detail that competes with the UI.

### Clock Color

All themes set `color: var(--accent)` on the clock element. This is a consistent
detail across the entire theme system. Don't skip it for new themes.

```css
[data-theme="your-theme"] .clock { color: var(--accent); }
```

### Typography Hierarchy

| Font | Usage |
|---|---|
| **Rajdhani** | Display: clock, logo, titles. Anything that should feel like a system readout |
| **Inter** | Body: bookmark titles, lists, interactive elements |
| **Cinzel** | Fantasy: reserved for themes with a majestic or ancient aesthetic (Crescent, Julia & Jin) |

### Overlay Strategy

The overlay gradient determines what stays visible in the background image.

**Radial (default)** draws attention to the center and darkens edges:
```css
--overlay-bg: radial-gradient(circle at center, transparent 0%, var(--bg-primary) 100%);
```

**Linear** darkens top and bottom and leaves the middle open. Use when the subject
is horizontally centered and should stay visible (Satisfactory factory floor, SC Sunset horizon):
```css
--overlay-bg: linear-gradient(180deg, rgba(R,G,B,0.85) 0%, rgba(R,G,B,0.15) 50%, rgba(R,G,B,0.90) 100%);
```

Choose based on where the most important part of the image is, not by habit.

---

## Focus & Accessibility

For backgrounds with a lot of detail (many small elements, high contrast, busy textures),
increase board alpha and blur to reduce visual noise. This makes boards easier to scan,
especially for users with ADHD or attention sensitivities.

```css
--bg-board: rgba(R, G, B, 0.65);   /* Up from default 0.55 */
backdrop-filter: blur(12px);        /* Up from default 8px */
```

This was applied intentionally to the Satisfactory theme, because the factory floor screenshot
has a lot going on and needed more visual separation between background and UI.

---

## All 11 Themes

| Theme | File | Accent | Mood | Overlay |
|---|---|---|---|---|
| Nebula | `bg-nebula.webp` | `#b359ff` Magenta | Chill, Cosmic | Radial |
| Crescent | `bg-crescent.webp` | `#d4bd8a` Gold | Luxury, Night | Radial |
| Event Horizon | `bg-event-horizon.webp` | `#9d5cff` Purple | Deep Space, Void | Radial |
| Merchantman | `bg-merchantman.webp` | `#2eb8b8` Emerald | Industrial, Alien | Radial |
| Julia & Jin | `bg-julia-jin.webp` | `#7db3ff` Aetherial Blue | FFXIV Night | Linear |
| SC Sunset | `bg-sc-sunset.webp` | `#ff8c3d` Amber | Emotional, Horizon | Linear |
| Hellion HUD | `bg-hellion-hud.webp` | `#32ff6a` Neon Green | Tactical, Admin | Radial |
| Hellion Energy | `bg-hellion-energy.webp` | `#1eff8e` Acid Green | Overdrive, Power | Radial |
| Satisfactory | `bg-satisfactory.webp` | `#00b4d8` Cyan | Industrial Desert | Linear |
| Avorion | `bg-avorion.webp` | `#2ec4a0` Turquoise | Deep Void | Radial |
| Hellion Stealth | `bg-scPolaris.webp` | `#5ec2ff` Tech Blue | Tactical Recon | Radial |

### Theme Quirks Worth Knowing

**Julia & Jin** uses `Cinzel` as display font and a linear gradient. The subjects in
the screenshot are positioned left of center, so radial would soften them.

**Satisfactory** has increased board alpha (0.65) and stronger blur (12px), an intentional
ADHD optimization for a visually busy background.

**Avorion** uses `letter-spacing: 6px` on the logo for maximum HUD feel.

**Hellion Stealth** is the only theme with `border-left: 2px solid var(--accent)` on
`.bm-item:hover`. Every other theme uses background tinting only. This is intentional
and gives Stealth its tactical scanner character. Don't apply it to other themes.

---

## Registering a Theme in themes.js

The `THEMES` object in `src/js/themes.js` is the single source of truth for which
themes exist and which background image they use. CSS handles all the visual variables —
`themes.js` only needs the image path.

```javascript
const THEMES = {
  'nebula':           { bg: 'assets/themes/bg-nebula.webp' },
  'crescent':         { bg: 'assets/themes/bg-crescent.webp' },
  'event-horizon':    { bg: 'assets/themes/bg-event-horizon.webp' },
  'merchantman':      { bg: 'assets/themes/bg-merchantman.webp' },
  'julia-jin':        { bg: 'assets/themes/bg-julia-jin.webp' },
  'sc-sunset':        { bg: 'assets/themes/bg-sc-sunset.webp' },
  'hellion-hud':      { bg: 'assets/themes/bg-hellion-hud.webp' },
  'hellion-energy':   { bg: 'assets/themes/bg-hellion-energy.webp' },
  'satisfactory':     { bg: 'assets/themes/bg-satisfactory.webp' },
  'avorion':          { bg: 'assets/themes/bg-avorion.webp' },
  'hellion-stealth':  { bg: 'assets/themes/bg-scPolaris.webp' }
};
```

To add a new theme, add one line. The key must exactly match the `data-theme`
attribute in the CSS block. If they don't match, `applyTheme()` will silently
do nothing and no one will know why.

```javascript
// New theme: key must match [data-theme="your-theme-name"] in main.css
'your-theme-name': { bg: 'assets/themes/bg-your-theme.webp' }
```

### How applyTheme() works

```javascript
function applyTheme(themeName, skipBgOverride) {
  const theme = THEMES[themeName];
  if (!theme) return;

  // Sets data-theme on <html> — activates the matching CSS variable block
  document.documentElement.setAttribute('data-theme', themeName);

  // Applies the background image unless a custom background is active
  if (!skipBgOverride) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${theme.bg}')`;
  }

  // Updates the active state in the theme picker UI
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.value === themeName);
  });
}
```

The `skipBgOverride` flag exists for one specific case: when a user has set a custom
background image, switching themes should still update the CSS variables and the picker
UI, but not wipe their custom image. Pass `true` to skip the background update.

---

## Adding a Theme Card to newtab.html

The theme picker modal lives in `newtab.html` as `#themeOverlay`. Every theme
needs a card in the `.theme-grid` — without it the theme exists in CSS and JS
but never shows up in the UI.

Copy this block and add it inside `.theme-grid`, after the last existing card:

```html
<div class="theme-card" data-value="your-theme-name">
  <img class="theme-card-img" src="assets/themes/bg-your-theme.webp" alt="Your Theme" />
  <span class="theme-card-label">Your Theme</span>
  <span class="theme-card-check">✓</span>
</div>
```

Three things that must match exactly:

- `data-value` must match the key in `THEMES` in `themes.js`
- `data-value` must match the `[data-theme="..."]` attribute in `main.css`
- `src` must point to the correct WebP file in `assets/themes/`

The label shown in the picker can be shorter than the full theme name — "HUD" and
"Energy" are good examples of that. Keep it short enough to fit the card.

The `active` class is toggled by `applyTheme()` automatically, so don't add it
manually unless you want that theme to be the default on first load (Nebula currently
has it as fallback).

---

## Adding a New Theme — Checklist

- [ ] Background image converted to WebP (quality 85)
- [ ] Image added to `assets/themes/`
- [ ] CSS block added to `src/css/main.css`
- [ ] Theme registered in `src/js/themes.js` (one line, key + bg path)
- [ ] Theme card added to `.theme-grid` in `newtab.html` (data-value, img src, label)
- [ ] Theme added to theme table in `README.md`
- [ ] Theme added to theme table in this document
- [ ] Image credit added to Bild-Credits table in `README.md`
- [ ] `CHANGELOG.md` entry added

---

Developed by **[Hellion Online Media — Florian Wathling](https://hellion-media.de)** — JonKazama-Hellion
