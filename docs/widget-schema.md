# Hellion Dashboard — Widget Schema

## Overview

The widget system provides draggable, resizable floating panels managed by `WidgetManager` (`src/js/widgets.js`). Each widget type has its own module that handles content rendering and state management.

---

## Widget Types

| Type | Module | Instance | Max | Storage |
|---|---|---|---|---|
| `note` | `notes.js` | Multi | 5 | Persistent (`widgetStates.notes`) |
| `calculator` | `calculator.js` | Single | 1 | Persistent (`widgetStates.calculator`) |
| `timer` | `timer.js` | Single | 1 | Persistent (`widgetStates.timer`) |
| `image` | `image-ref.js` | Multi | 3 | Meta: persistent, Image data: sessionStorage |

---

## WidgetManager API

### `create(type, config) → string`

Creates a widget and appends it to the DOM.

```javascript
const id = WidgetManager.create('note', {
  id: 'note_abc123',       // Optional, auto-generated if omitted
  title: 'My Note',        // Default: 'Note'
  x: 120,                  // Left position in px
  y: 80,                   // Top position in px
  width: 280,              // Width in px (min: 200)
  height: 220,             // Height in px (min: 150)
  open: true               // Visible state (default: true)
});
```

### `getBody(id) → HTMLElement | null`

Returns the `.widget-body` element for content rendering.

```javascript
const body = WidgetManager.getBody('widget_calculator');
if (body) Calculator.renderBody(body);
```

### `getState(id) → Object | null`

Returns the current widget state (position, size, open status).

```javascript
const state = WidgetManager.getState('widget_timer');
// → { id, type, title, x, y, width, height, open }
```

### `close(id)`

Permanently removes a widget from the DOM and registry.

### `minimize(id)`

Hides a widget with animation. Widget remains in registry with `open: false`.

### `openWidget(id)`

Restores a minimized widget with animation.

### `bringToFront(id)`

Increments z-index to bring widget above all others.

### `save() → Array`

Returns an array of all `type: 'note'` widget states. Used by `Notes.save()` to merge with note content data.

### `restore(renderCallback)`

Loads widget states from storage and recreates all note widgets. Only handles notes — single-instance widgets (calculator, timer) restore themselves in their own `init()`.

---

## Shared Storage Key: `widgetStates`

All widget modules share a single storage key. Each module's `save()` method must preserve other modules' data.

```javascript
// Structure of widgetStates
{
  notes: [
    {
      id: 'note_abc123',
      title: 'My Note',
      content: 'Hello world',
      template: 'text',         // 'text' or 'checklist'
      x: 120, y: 80,
      width: 280, height: 220,
      open: true,
      checklistItems: [],       // For checklist template
      checkedItems: []          // Checked item IDs
    }
  ],
  calculator: {
    x: 400, y: 120,
    width: 280, height: 400,
    open: false,
    history: [
      { expr: '2 + 3', result: '5' }
    ]
  },
  timer: {
    x: 600, y: 80,
    width: 260, height: 360,
    open: false,
    muted: false,
    presets: [
      { name: 'Forschung', seconds: 2700 }
    ]
  },
  imageRef: {
    images: [
      {
        id: 'image_0',
        label: 'Bauplan',
        x: 200, y: 120,
        width: 320, height: 280,
        open: true
      }
    ]
  }
}
```

### Save Pattern — Preserving Other Modules' Data

Every module that saves to `widgetStates` must read existing data first and preserve keys it doesn't own:

```javascript
// Example from notes.js
async save() {
  const existing = await Store.get(this.STORAGE_KEY);
  const saveData = { notes: mergedNotes };

  // Preserve other modules
  if (existing && existing.calculator) saveData.calculator = existing.calculator;
  if (existing && existing.timer) saveData.timer = existing.timer;
  if (existing && existing.imageRef) saveData.imageRef = existing.imageRef;

  await Store.set(this.STORAGE_KEY, saveData);
}
```

---

## Creating a New Widget Type

### Step 1: Choose Single or Multi-Instance

- **Single-instance** (like Calculator, Timer): One widget with a fixed ID. `toggle()` opens/closes.
- **Multi-instance** (like Notes, ImageRef): Multiple widgets with dynamic IDs. `create()` adds new ones.

### Step 2: Create the Module (`src/js/your-widget.js`)

```javascript
const YourWidget = {
  WIDGET_ID: 'widget_yourwidget',   // Fixed ID for single-instance
  STORAGE_KEY: 'widgetStates',
  _isOpen: false,

  // Load state from storage
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.yourWidget) {
      // Restore your state
    }
  },

  // Save state, preserving other modules
  async save() {
    const data = await Store.get(this.STORAGE_KEY) || {};
    if (data.notes === undefined) data.notes = [];

    const widgetState = WidgetManager.getState(this.WIDGET_ID);
    data.yourWidget = {
      x: widgetState ? widgetState.x : 400,
      y: widgetState ? widgetState.y : 120,
      width: widgetState ? widgetState.width : 280,
      height: widgetState ? widgetState.height : 300,
      open: this._isOpen,
      // ... your custom data
    };

    await Store.set(this.STORAGE_KEY, data);
  },

  // Open widget
  async open() {
    if (this._isOpen) {
      WidgetManager.bringToFront(this.WIDGET_ID);
      return;
    }

    const data = await Store.get(this.STORAGE_KEY);
    const saved = (data && data.yourWidget) ? data.yourWidget : {};

    WidgetManager.create('yourwidget', {
      id: this.WIDGET_ID,
      title: 'Your Widget',
      x: saved.x || 400,
      y: saved.y || 120,
      width: saved.width || 280,
      height: saved.height || 300,
      open: true
    });

    const body = WidgetManager.getBody(this.WIDGET_ID);
    if (body) this.renderBody(body);

    this._isOpen = true;
    await this.save();
  },

  // Toggle open/close
  async toggle() {
    if (this._isOpen) {
      const entry = WidgetManager._widgets.get(this.WIDGET_ID);
      if (entry && entry.state.open) {
        await WidgetManager.minimize(this.WIDGET_ID);
        this._isOpen = false;
        await this.save();
      } else if (entry) {
        await WidgetManager.openWidget(this.WIDGET_ID);
        this._isOpen = true;
        await this.save();
      }
    } else {
      await this.open();
    }
  },

  // Render widget content
  renderBody(bodyEl) {
    bodyEl.textContent = '';
    // Build your UI with createElement (never innerHTML!)
  },

  // Initialize and hook into lifecycle
  async init() {
    await this.load();

    // Restore if was open last time
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.yourWidget && data.yourWidget.open) {
      await this.open();
    }

    // Hook into close event
    const self = this;
    const prevClose = WidgetManager.close;
    WidgetManager.close = function(id) {
      prevClose.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self._isOpen = false;
        self.save();
      }
    };

    // Hook into minimize event
    const prevMinimize = WidgetManager.minimize;
    WidgetManager.minimize = async function(id) {
      await prevMinimize.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self._isOpen = false;
        await self.save();
      }
    };

    // Hook into open event
    const prevOpen = WidgetManager.openWidget;
    WidgetManager.openWidget = async function(id) {
      await prevOpen.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self._isOpen = true;
        const body = WidgetManager.getBody(self.WIDGET_ID);
        if (body && body.children.length === 0) {
          self.renderBody(body);
        }
        await self.save();
      }
    };
  }
};
```

### Step 3: Integration Checklist

1. **`newtab.html`** — Add `<script>` tag (after `widgets.js`, before `data.js`)
2. **`newtab.html`** — Add toolbar button: `<button class="widget-toolbar-btn" data-action="your-action">`
3. **`notes.js`** — Add toolbar handler in `initToolbar()`: `} else if (action === 'your-action') { YourWidget.toggle(); }`
4. **`notes.js`** — Preserve your data in `save()`: `if (existing && existing.yourWidget) saveData.yourWidget = existing.yourWidget;`
5. **`app.js`** — Add `await YourWidget.init();` to the init sequence
6. **`src/css/main.css`** — Add widget-specific CSS styles
7. **`data.js`** — Add export/import logic (if data should be included in backups)

---

## Widget DOM Structure

Every widget created by `WidgetManager.create()` has this structure:

```html
<div class="widget" data-widget-id="widget_abc123"
     style="left: 120px; top: 80px; width: 280px; height: 220px;">
  <div class="widget-header">
    <span class="widget-title">Title</span>
    <div class="widget-actions">
      <button class="widget-btn widget-minimize">─</button>
      <button class="widget-btn widget-close">✕</button>
    </div>
  </div>
  <div class="widget-body">
    <!-- Your content goes here (via renderBody) -->
  </div>
  <div class="widget-resize-handle"></div>
</div>
```

- **Header** is the drag handle (Pointer Events)
- **Title** supports double-click to edit (contentEditable, max 20 chars)
- **Body** is where your module renders content
- **Resize handle** appears on hover (bottom-right corner)
