# Hellion Dashboard — Code Patterns & Conventions

> This document is intentionally written in English. Full German/English i18n support
> is planned for v2.0 — until then, English keeps the docs accessible to anyone
> who wants to contribute or fork the project.

---

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

All persistent data goes through the `Store` object. Never access `chrome.storage` or `localStorage` directly — `Store` handles the fallback between the two transparently and provides unified error handling when storage is full.

```javascript
// Reading
const boards = await Store.get('boards');    // Returns null if not found
const settings = await Store.get('settings');

// Writing
await Store.set('boards', boards);
await Store.set('settings', settings);

// Quota check (chrome.storage only, 10 MB limit)
await Store.checkQuota();
```

---

## Pattern: Event Delegation

One listener on the container, `closest()` to find the target. Much cleaner than attaching a listener to every single element, and it works automatically for dynamically added content.

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

Used in `boards.js` (board/bookmark events), `notes.js` (toolbar) and `calculator.js` (button grid).

---

## Pattern: createElement over innerHTML

Always build DOM with `document.createElement()`. This is the project's #1 security rule — `innerHTML` with user-provided content is an XSS risk, full stop.

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

All widget modules share the `widgetStates` storage key. Every module that writes to it must read first and preserve what's already there — otherwise modules silently overwrite each other's data.

```javascript
async save() {
  const data = await Store.get('widgetStates') || {};

  // Write your own data
  data.yourKey = { /* ... */ };

  // Don't replace the whole object — other modules live here too
  await Store.set('widgetStates', data);
}
```

See [widget-schema.md](widget-schema.md) for the full `widgetStates` structure.

---

## Pattern: Widget Lifecycle Hooks

Single-instance widgets (Calculator, Timer) need to react when they're closed, minimized, or reopened. They do this by wrapping `WidgetManager` methods in their `init()`.

```javascript
async init() {
  const prevClose = WidgetManager.close;
  const self = this;

  WidgetManager.close = function(id) {
    prevClose.call(WidgetManager, id);
    if (id === self.WIDGET_ID) {
      self.onClose();
    }
  };

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

Multiple widgets chain these wraps — Calculator wraps first, Timer wraps Calculator's already-wrapped version, and so on. Always call the previous method (`prevClose.call(...)`) or the chain breaks and other widgets stop responding.

---

## Pattern: Debounced Save

For frequent updates like typing in notes or dragging widgets, debouncing avoids hammering storage with a write on every keystroke.

```javascript
_saveTimer: null,

_debouncedSave() {
  clearTimeout(this._saveTimer);
  this._saveTimer = setTimeout(() => this.save(), 500);
}

// Use _debouncedSave() instead of save() for frequent events
textarea.addEventListener('input', () => {
  noteData.content = textarea.value;
  this._debouncedSave();
});
```

Used in `notes.js` (text editing) and `image-ref.js` (label editing).

---

## Pattern: Theme System

All themes use CSS Custom Properties in `[data-theme="name"]` blocks in `main.css`. There are currently 11 themes.

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

Never hardcode colors in JS. Let CSS handle it.

```javascript
// GOOD
element.classList.add('active');

// BAD — breaks every theme that isn't Nebula
element.style.color = '#7db3ff';
```

---

## Pattern: Onboarding Slides

The onboarding system in `onboarding.js` is data-driven. Each slide is a plain object — add a new slide by adding an object to the `slides` array, the `_render()` method handles the rest.

```javascript
{
  hero: '🎮',                    // Large emoji/icon
  title: 'Slide Title',
  text: 'Optional description',
  features: ['Item 1', ...],     // Optional bullet list
  showThemes: true,              // Optional theme grid
  interactive: 'gaming-board'    // Optional custom buttons
}
```

---

## Pattern: Dialog System

Custom dialogs replace native `alert()` and `confirm()` everywhere in the project.

```javascript
// Informational
await HellionDialog.alert('Message text', {
  type: 'info',   // 'info', 'success', 'warning', 'danger'
  title: 'Title'
});

// Yes/no
const ok = await HellionDialog.confirm('Are you sure?', {
  type: 'danger',
  title: 'Delete',
  confirmText: 'Delete',
  cancelText: 'Cancel'
});
if (ok) { /* user confirmed */ }
```

---

## Pattern: Pointer Events for Drag

Widget dragging and board reordering use the Pointer Events API instead of mouse events. The reason: Pointer Events work with both mouse and touch, and `setPointerCapture` keeps the events flowing even if the cursor leaves the element mid-drag.

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

---

## Pattern: Canvas API Image Processing

The image reference widget converts uploaded images to WebP locally in the browser — no external service, no upload, nothing leaves the device.

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
      URL.revokeObjectURL(objectUrl);   // Always free the object URL
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

Always call `URL.revokeObjectURL()` after the image has loaded — skipping it leaks memory.

---

## Coding Rules Summary

| Rule | Rationale |
|---|---|
| `createElement` only, never `innerHTML` | XSS prevention |
| All storage through `Store` | Browser compatibility + unified error handling |
| CSS variables, no hardcoded colors | Theme support across all 11 themes |
| Event delegation | Performance, works with dynamic content |
| `const`/`let`, never `var` | Block scoping |
| No external dependencies | Extension simplicity |
| No build step | Direct development, no toolchain to break |
| JSDoc comments on public functions | Documentation for contributors |
| URL validation before `href` | Security |
| Error handling on storage operations | Graceful failure |
| `URL.revokeObjectURL()` after Canvas ops | Memory management |

---

## Manifest Synchronization

Three manifest files must always stay in sync:

- `manifest.json` — Chrome, Edge, Brave, Vivaldi
- `manifest.firefox.json` — Firefox
- `manifest.opera.json` — Opera, Opera GX

Version numbers, permissions and content script entries need to be updated in all three. The CI quality check will catch drift, but it's cleaner not to let it get there in the first place.
