# Hellion Dashboard — Code Patterns & Conventions

## Core Principles

- **Vanilla JS ES2020** — No frameworks, no TypeScript, no build step
- **Zero dependencies** — Everything is built from scratch
- **`createElement` only** — Never use `innerHTML` (XSS prevention)
- **CSS Custom Properties** — No hardcoded colors, everything through `var(--name)`
- **Event delegation** — One listener per container, not per element
- **Storage abstraction** — All storage access through `Store.get()` / `Store.set()`

---

## Pattern: Storage Abstraction

**File:** `src/js/storage.js`

All persistent data goes through the `Store` object. Never access `chrome.storage` or `localStorage` directly.

```javascript
// Reading
const boards = await Store.get('boards');       // Returns null if not found
const settings = await Store.get('settings');

// Writing
await Store.set('boards', boards);
await Store.set('settings', settings);

// Quota check (chrome.storage only, 10 MB limit)
await Store.checkQuota();
```

**Why?** The `Store` handles the chrome.storage / localStorage fallback transparently. It also provides unified error handling (shows a dialog when storage is full).

---

## Pattern: Event Delegation

Instead of attaching listeners to each element, attach one to the container and use `closest()` to find the target.

```javascript
// GOOD — one listener, handles all bookmarks
container.addEventListener('click', (e) => {
  const bmItem = e.target.closest('.bm-item');
  if (!bmItem) return;
  const id = bmItem.dataset.id;
  // Handle click
});

// BAD — listener per element
bookmarks.forEach(bm => {
  bm.addEventListener('click', handler);  // Don't do this!
});
```

**Used in:** `boards.js` (board/bookmark events), `notes.js` (toolbar), `calculator.js` (button grid)

---

## Pattern: createElement over innerHTML

Always build DOM with `document.createElement()`. This prevents XSS and is the project's #1 security rule.

```javascript
// GOOD
const link = document.createElement('a');
link.href = bookmark.url;
link.textContent = bookmark.title;
container.appendChild(link);

// BAD — XSS risk!
container.innerHTML = `<a href="${url}">${title}</a>`;
```

---

## Pattern: Shared Storage Key

Multiple widget modules share the `widgetStates` key. Every module must read-before-write and preserve other modules' data.

```javascript
async save() {
  const data = await Store.get('widgetStates') || {};

  // Write your own data
  data.yourKey = { /* ... */ };

  // DON'T overwrite — the key already contains other modules' data
  await Store.set('widgetStates', data);
}
```

See [widget-schema.md](widget-schema.md) for the full `widgetStates` structure.

---

## Pattern: Widget Lifecycle Hooks

Single-instance widgets (Calculator, Timer) need to know when they're closed, minimized, or reopened. They wrap `WidgetManager` methods in their `init()`:

```javascript
async init() {
  // Wrap close
  const prevClose = WidgetManager.close;
  const self = this;
  WidgetManager.close = function(id) {
    prevClose.call(WidgetManager, id);
    if (id === self.WIDGET_ID) {
      self.onClose();
    }
  };

  // Wrap minimize
  const prevMinimize = WidgetManager.minimize;
  WidgetManager.minimize = async function(id) {
    await prevMinimize.call(WidgetManager, id);
    if (id === self.WIDGET_ID) {
      self._isOpen = false;
      await self.save();
    }
  };
}
```

**Important:** Multiple widgets chain these wraps. Calculator wraps first, Timer wraps Calculator's already-wrapped version, and so on. The chain must not break.

---

## Pattern: Debounced Save

For frequent updates (typing in notes, moving widgets), use debounced saves to avoid excessive storage writes:

```javascript
_saveTimer: null,

_debouncedSave() {
  clearTimeout(this._saveTimer);
  this._saveTimer = setTimeout(() => this.save(), 500);
}

// Usage: call _debouncedSave() instead of save() for frequent events
textarea.addEventListener('input', () => {
  noteData.content = textarea.value;
  this._debouncedSave();
});
```

**Used in:** `notes.js` (text editing), `image-ref.js` (label editing)

---

## Pattern: Theme System

All themes use CSS Custom Properties defined in `[data-theme="name"]` blocks:

```css
[data-theme="nebula"] {
  --bg-primary: #0a0e17;
  --bg-board: rgba(15, 20, 35, 0.65);
  --text-primary: #e0e6f0;
  --accent: #7db3ff;
  --border: rgba(125, 179, 255, 0.12);
  /* ... more variables */
}
```

**Never hardcode colors in JS.** Use CSS classes or variables:

```javascript
// GOOD — let CSS handle colors
element.classList.add('active');

// BAD — hardcoded color
element.style.color = '#7db3ff';
```

8 themes are available: Nebula, Crescent, Event Horizon, Merchantman, Julia & Jin, SC Sunset, Hellion HUD, Hellion Energy.

---

## Pattern: Onboarding Slides

The onboarding system (`onboarding.js`) uses a data-driven slide array. Each slide is an object with rendering hints:

```javascript
{
  hero: '🎮',                    // Large emoji/icon
  title: 'Slide Title',          // Heading
  text: 'Description...',        // Optional text paragraph
  features: ['Item 1', ...],     // Optional bullet list
  showThemes: true,              // Optional theme grid
  interactive: 'gaming-board'    // Optional custom buttons
}
```

The `_render()` method reads these properties and builds the DOM. To add a new slide, just add an object to the `slides` array.

---

## Pattern: Dialog System

Custom dialogs replace native `alert()` and `confirm()`:

```javascript
// Alert (informational)
await HellionDialog.alert('Message text', {
  type: 'info',        // 'info', 'success', 'warning', 'danger'
  title: 'Title'
});

// Confirm (yes/no)
const ok = await HellionDialog.confirm('Are you sure?', {
  type: 'danger',
  title: 'Delete',
  confirmText: 'Delete',     // Custom button text
  cancelText: 'Cancel'
});
if (ok) { /* user confirmed */ }
```

---

## Pattern: Pointer Events for Drag

Widget dragging and board reordering use the Pointer Events API (not mouse events):

```javascript
element.addEventListener('pointerdown', (e) => {
  element.setPointerCapture(e.pointerId);

  function onMove(ev) {
    // Update position
  }

  function onUp() {
    element.releasePointerCapture(e.pointerId);
    element.removeEventListener('pointermove', onMove);
    element.removeEventListener('pointerup', onUp);
  }

  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
});
```

**Why Pointer Events over Mouse Events?** They work with both mouse and touch, and `setPointerCapture` ensures events continue even if the cursor leaves the element.

---

## Pattern: Canvas API Image Processing

The image reference widget converts uploaded images to WebP for smaller size:

```javascript
_processFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const webpUrl = canvas.toDataURL('image/webp', 0.85);
      URL.revokeObjectURL(objectUrl);
      resolve(webpUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image could not be loaded'));
    };

    img.src = objectUrl;
  });
}
```

**Important:** Always call `URL.revokeObjectURL()` to free memory.

---

## Coding Rules Summary

| Rule | Rationale |
|---|---|
| `createElement` only, never `innerHTML` | XSS prevention |
| All storage through `Store` | Browser compatibility |
| CSS variables, no hardcoded colors | Theme support |
| Event delegation | Performance, dynamic content |
| `const`/`let`, never `var` | Block scoping |
| No external dependencies | Extension simplicity |
| No build step | Direct development |
| JSDoc comments on public functions | Documentation |
| URL validation before `href` | Security |
| Error handling on storage operations | Graceful failure |

---

## Manifest Synchronization

Three manifest files must stay in sync:

- `manifest.json` — Chrome, Edge, Brave, Vivaldi
- `manifest.firefox.json` — Firefox
- `manifest.opera.json` — Opera, Opera GX

When changing version numbers, permissions, or content script entries, update all three files.
