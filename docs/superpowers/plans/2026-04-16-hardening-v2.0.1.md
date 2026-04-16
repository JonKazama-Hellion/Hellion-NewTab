# Hellion NewTab v2.0.1 Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden v2.0.0 with security fixes, widget event-system refactoring, i18n completeness, and code quality improvements.

**Architecture:** Foundation-First — build the new widget event system first, then migrate widget modules onto it, then layer security, i18n, and quality fixes. Each task touches isolated files to avoid merge conflicts.

**Tech Stack:** Vanilla JavaScript ES2020, CSS Custom Properties, Browser Extension Manifest V3, no build step, no npm.

**Spec:** `docs/superpowers/specs/2026-04-16-hardening-v2.0.1-design.md`

**Testing:** No automated test framework. Each task includes manual browser-based verification steps. Load the extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked) after each task.

---

## File Map

| File | Tasks | Changes |
|---|---|---|
| `src/js/widgets.js` | 1, 2 | Add event system (`_emitter`, `on`, `off`), dispatch events in `close`/`minimize`/`openWidget`, replace `setTimeout` with `transitionend` |
| `src/js/calculator.js` | 3 | Replace monkey-patching (L692-728) with `WidgetManager.on()` listeners |
| `src/js/timer.js` | 3 | Replace monkey-patching (L723-758) with `WidgetManager.on()` listeners |
| `src/js/image-ref.js` | 3 | Replace monkey-patching (L463-498) with `WidgetManager.on()` listeners |
| `src/js/settings.js` | 4 | Add `isValidBgUrl()`, validate in `applySettings()` and file upload + URL input handlers |
| `src/js/data.js` | 5 | Add `isSafeUrl()`, immutable mapping, string length limits, Notes import via `Notes.init()` |
| `src/js/state.js` | 6 | Remove `getFaviconUrl()` |
| `src/js/boards.js` | 6 | Replace `<img>` favicon with local letter-div |
| `src/css/main.css` | 6, 7 | Replace `.bm-favicon`/`.bm-favicon-fallback` with `.bm-favicon-local`, add `@supports not` fallback, add `--bg-solid-fallback` per theme |
| `newtab.html` | 8 | Add 5x `data-i18n-title`, 3x `data-i18n` |
| `src/js/i18n.js` | 8 | Add 10 new keys to `STRINGS.de` and `STRINGS.en` (8 i18n + 2 bgUrl validation) |
| `src/js/app.js` | 9 | Store `setInterval` ID in variable |
| `manifest.json` | 9 | Version bump to 2.0.1 |
| `manifest.firefox.json` | 9 | Version bump to 2.0.1 |
| `manifest.opera.json` | 9 | Version bump to 2.0.1 |
| `CHANGELOG.md` | 9 | Add v2.0.1 entry |

---

### Task 1: Widget Event-System in WidgetManager

**Files:**
- Modify: `src/js/widgets.js:6-10` (add emitter + on/off)
- Modify: `src/js/widgets.js:143-148` (close — dispatch event)

- [ ] **Step 1: Add event emitter and on/off methods to WidgetManager**

In `src/js/widgets.js`, add three new properties after `STORAGE_KEY: 'widgetStates',` (line 10):

```javascript
  /** @type {EventTarget} Internes Event-System fuer Widget-Lifecycle */
  _emitter: new EventTarget(),

  /**
   * Event-Listener registrieren
   * @param {string} event - z.B. 'widget:close', 'widget:minimize', 'widget:open'
   * @param {Function} handler
   */
  on(event, handler) {
    this._emitter.addEventListener(event, handler);
  },

  /**
   * Event-Listener entfernen
   * @param {string} event
   * @param {Function} handler
   */
  off(event, handler) {
    this._emitter.removeEventListener(event, handler);
  },
```

- [ ] **Step 2: Dispatch `widget:close` event in close()**

Replace the `close` method (lines 143-148):

```javascript
  close(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry.el.remove();
    this._widgets.delete(id);
    this._emitter.dispatchEvent(new CustomEvent('widget:close', { detail: { id } }));
  },
```

Note: The event fires AFTER `el.remove()` and `_widgets.delete()`. Listeners must not access the widget entry.

- [ ] **Step 3: Verify event system loads without errors**

Reload the extension in the browser. Open the console (`F12`). Verify:
- No JavaScript errors on load
- `WidgetManager.on` is a function (type `WidgetManager.on` in console)
- `WidgetManager._emitter` is an EventTarget

- [ ] **Step 4: Commit**

```bash
git add src/js/widgets.js
git commit -m "refactor(widgets): add EventTarget-based lifecycle event system

Add _emitter, on(), off() to WidgetManager. Dispatch widget:close event
after close(). Foundation for removing monkey-patching from widget modules."
```

---

### Task 2: Minimize with transitionend + openWidget event dispatch

**Files:**
- Modify: `src/js/widgets.js:154-163` (minimize)
- Modify: `src/js/widgets.js:169-180` (openWidget)

- [ ] **Step 1: Replace setTimeout with transitionend in minimize()**

Replace the `minimize` method (lines 154-163):

```javascript
  async minimize(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry.state.open = false;
    entry._minimizing = true;
    entry.el.classList.add('widget-minimized');

    entry.el.addEventListener('transitionend', function onEnd(e) {
      if (e.target !== entry.el) return;
      entry.el.removeEventListener('transitionend', onEnd);
      if (entry._minimizing) {
        entry.el.style.display = 'none';
      }
      entry._minimizing = false;
    });

    this._emitter.dispatchEvent(new CustomEvent('widget:minimize', { detail: { id } }));
    await this.save();
  },
```

- [ ] **Step 2: Add race-condition guard and event dispatch to openWidget()**

Replace the `openWidget` method (lines 169-180):

```javascript
  async openWidget(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry._minimizing = false;
    entry.state.open = true;
    entry.el.style.display = 'flex';
    requestAnimationFrame(() => {
      entry.el.classList.remove('widget-minimized');
    });
    this.bringToFront(id);
    this._emitter.dispatchEvent(new CustomEvent('widget:open', { detail: { id } }));
    await this.save();
  },
```

Key change: `entry._minimizing = false` cancels any in-flight minimize transition.

- [ ] **Step 3: Verify minimize/open animation works**

Reload extension. Test:
1. Create a note → minimize it → verify it fades out and disappears
2. Click the note in the widget toolbar to reopen → verify it appears smoothly
3. Rapid test: minimize → immediately reopen before animation ends → verify no display glitch (the race condition fix)

- [ ] **Step 4: Commit**

```bash
git add src/js/widgets.js
git commit -m "fix(widgets): replace setTimeout with transitionend in minimize

Fixes race condition where openWidget() during the 250ms timeout would
be overridden. Uses _minimizing flag to cancel in-flight transitions.
Dispatches widget:minimize and widget:open events."
```

---

### Task 3: Migrate Calculator, Timer, ImageRef to Event Listeners

**Files:**
- Modify: `src/js/calculator.js:692-728`
- Modify: `src/js/timer.js:723-758`
- Modify: `src/js/image-ref.js:463-498`

- [ ] **Step 1: Replace monkey-patching in calculator.js**

Replace lines 692-728 (the three monkey-patching blocks in `init()`) with:

```javascript
    // Widget-Lifecycle-Events
    const self = this;
    WidgetManager.on('widget:close', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self.onClose();
      }
    });

    WidgetManager.on('widget:minimize', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self._isOpen = false;
        self.save();
      }
    });

    WidgetManager.on('widget:open', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self._isOpen = true;
        const body = WidgetManager.getBody(self.WIDGET_ID);
        if (body && body.children.length === 0) {
          self.renderBody(body);
        }
        const entry = WidgetManager._widgets.get(self.WIDGET_ID);
        if (entry) self._bindKeyboard(entry.el);
        self.save();
      }
    });
```

- [ ] **Step 2: Replace monkey-patching in timer.js**

Replace lines 723-758 (the three monkey-patching blocks in `init()`) with:

```javascript
    // Widget-Lifecycle-Events
    const self = this;
    WidgetManager.on('widget:close', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self.onClose();
      }
    });

    WidgetManager.on('widget:minimize', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self._isOpen = false;
        self.save();
      }
    });

    WidgetManager.on('widget:open', (e) => {
      if (e.detail.id === self.WIDGET_ID) {
        self._isOpen = true;
        const body = WidgetManager.getBody(self.WIDGET_ID);
        if (body && body.children.length === 0) {
          self.renderBody(body);
        }
        const entry = WidgetManager._widgets.get(self.WIDGET_ID);
        if (entry) self._bindKeyboard(entry.el);
        self.save();
      }
    });
```

- [ ] **Step 3: Replace monkey-patching in image-ref.js**

Replace lines 463-498 (the three monkey-patching blocks in `init()`) with:

```javascript
    // Widget-Lifecycle-Events
    const self = this;
    WidgetManager.on('widget:close', (e) => {
      const isImage = self._images.some(img => img.id === e.detail.id);
      if (isImage) {
        self.onClose(e.detail.id);
      }
    });

    WidgetManager.on('widget:minimize', (e) => {
      const isImage = self._images.some(img => img.id === e.detail.id);
      if (isImage) {
        self.save();
      }
    });

    WidgetManager.on('widget:open', (e) => {
      const imgData = self._images.find(img => img.id === e.detail.id);
      if (imgData) {
        const body = WidgetManager.getBody(e.detail.id);
        if (body && body.children.length === 0) {
          const dataUrl = self._getSessionImage(e.detail.id);
          self.renderBody(imgData, body, dataUrl);
        }
        self.save();
      }
    });
```

- [ ] **Step 4: Verify all three widget types work**

Reload extension. Test each widget type:

1. **Calculator:** Open → type a calculation → minimize → reopen → verify history is still there → close → reopen from toolbar
2. **Timer:** Open → set a time → minimize → reopen → verify time is preserved → close
3. **Image-Ref:** Enable in Settings → open image widget → add an image → minimize → reopen → verify image displays → close

Check console for any errors during all operations.

- [ ] **Step 5: Commit**

```bash
git add src/js/calculator.js src/js/timer.js src/js/image-ref.js
git commit -m "refactor(widgets): migrate Calculator, Timer, ImageRef to event listeners

Replace monkey-patching of WidgetManager.close/minimize/openWidget with
WidgetManager.on() event listeners. Eliminates 3-deep closure chain."
```

---

### Task 4: Security — URL Validation in settings.js

**Files:**
- Modify: `src/js/settings.js:52-95` (applySettings)
- Modify: `src/js/settings.js:166-175` (btnApplyBg handler)
- Modify: `src/js/settings.js:181-194` (bgFileInput handler)

- [ ] **Step 1: Add isValidBgUrl() helper**

Add this function at the top of `settings.js`, after the `closeThemeModal()` function (after line 24):

```javascript
/**
 * Prueft ob eine Background-URL sicher fuer CSS-Einbettung ist.
 * Erlaubt nur blob: und data:image/ Protokolle (aus File Upload).
 * @param {string} url
 * @returns {boolean}
 */
function isValidBgUrl(url) {
  return typeof url === 'string' && url.length > 0 &&
    (url.startsWith('blob:') || url.startsWith('data:image/'));
}
```

- [ ] **Step 2: Add validation in applySettings()**

Replace lines 92-94:

```javascript
  if (settings.bgUrl) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${settings.bgUrl}')`;
  }
```

With:

```javascript
  if (settings.bgUrl && isValidBgUrl(settings.bgUrl)) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${settings.bgUrl}')`;
  } else if (settings.bgUrl) {
    // Ungueltige URL im Storage — bereinigen
    settings.bgUrl = '';
  }
```

- [ ] **Step 3: Add validation in the URL-input handler (btnApplyBg)**

Replace lines 169-175:

```javascript
  document.getElementById('btnApplyBg').addEventListener('click', async () => {
    const url = document.getElementById('bgUrlInput').value.trim();
    settings.bgUrl = url;
    document.getElementById('bgLayer').style.backgroundImage = url ? `url('${url}')` : '';
    await saveSettings();
    document.getElementById('bgInputRow').classList.add('hidden');
  });
```

With:

```javascript
  document.getElementById('btnApplyBg').addEventListener('click', async () => {
    const url = document.getElementById('bgUrlInput').value.trim();
    if (url && !isValidBgUrl(url)) {
      await HellionDialog.alert(t('settings.bg_invalid_url'), { type: 'danger', title: t('settings.bg_invalid_url.title') });
      return;
    }
    settings.bgUrl = url;
    document.getElementById('bgLayer').style.backgroundImage = url ? `url('${url}')` : '';
    await saveSettings();
    document.getElementById('bgInputRow').classList.add('hidden');
  });
```

- [ ] **Step 4: Verify the file upload handler is already safe**

Read `settings.js:181-194`. The `FileReader.readAsDataURL(file)` produces a `data:image/...` string, which passes `isValidBgUrl()`. The handler at line 186 sets `settings.bgUrl = ev.target.result` — this is already valid output. No change needed here.

- [ ] **Step 5: Add i18n keys for the validation error dialog**

These keys will be added in Task 8 together with all other i18n keys. For now, note that we need:
- `settings.bg_invalid_url` — "Nur lokale Bilder (Upload) sind als Hintergrund erlaubt." / "Only local images (upload) are allowed as background."
- `settings.bg_invalid_url.title` — "Ungültige URL" / "Invalid URL"

- [ ] **Step 6: Verify background upload still works**

Reload extension. Test:
1. Open Theme Modal → upload a local image → verify it displays as background
2. Try entering `javascript:alert(1)` in the URL input → verify it's rejected with a dialog
3. Reload → verify the uploaded background persists

- [ ] **Step 7: Commit**

```bash
git add src/js/settings.js
git commit -m "fix(security): validate background URL before CSS injection

Add isValidBgUrl() that only allows blob: and data:image/ protocols.
Applied in applySettings() and the manual URL input handler.
Prevents CSS injection via manipulated bgUrl storage values."
```

---

### Task 5: Security + Quality — Data Import Hardening

**Files:**
- Modify: `src/js/data.js:33-127`

- [ ] **Step 1: Add isSafeUrl() helper at top of data.js**

Add after the `initDataButtons` function declaration (after line 6, before the function body):

Actually, add it inside the function before the event listeners, right after `if (!btnExport || !btnImport) return;` (after line 10):

```javascript
  /**
   * Prueft ob eine URL ein sicheres Protokoll hat.
   * Blockiert javascript:, data:, vbscript: etc.
   * @param {string} url
   * @returns {boolean}
   */
  function isSafeUrl(url) {
    try {
      const u = new URL(url);
      return ['http:', 'https:', 'ftp:'].includes(u.protocol);
    } catch {
      return false;
    }
  }
```

- [ ] **Step 2: Replace the mutable board/bookmark filter with immutable mapping**

Replace lines 41-52 (the `validBoards` filter block):

```javascript
      const validBoards = data.boards
        .filter(b => b && typeof b.title === 'string' && Array.isArray(b.bookmarks))
        .map(b => ({
          id: b.id || uid(),
          title: String(b.title).slice(0, 100),
          blurred: !!b.blurred,
          bookmarks: b.bookmarks
            .filter(bm => bm && typeof bm.title === 'string' && isSafeUrl(bm.url))
            .map(bm => ({
              id: bm.id || uid(),
              title: String(bm.title).slice(0, 200),
              url: bm.url,
              desc: String(bm.desc || '').slice(0, 500)
            }))
        }));
```

- [ ] **Step 3: Replace the mutable notes filter with immutable mapping**

Replace lines 68-71 (the `importNotes` filter):

```javascript
        const importNotes = data.notes
          .filter(n => n && n.id && n.template)
          .map(n => ({
            id: n.id,
            template: ['note', 'checklist'].includes(n.template) ? n.template : 'note',
            title: String(n.title || '').slice(0, 200),
            content: String(n.content || '').slice(0, 5000),
            x: typeof n.x === 'number' ? n.x : 120,
            y: typeof n.y === 'number' ? n.y : 80,
            width: typeof n.width === 'number' ? n.width : 280,
            height: typeof n.height === 'number' ? n.height : 220,
            open: n.open !== false,
            checklistItems: Array.isArray(n.checklistItems) ? n.checklistItems : []
          }));
```

- [ ] **Step 4: Replace direct Notes._notes mutation with Notes.init()**

Replace lines 76-81:

```javascript
        if (toImport.length > 0) {
          const merged = [...existingNotes, ...toImport];
          existingWidgets.notes = merged;
          Notes._notes = merged;
          notesImported = toImport.length;
        }
```

With:

```javascript
        if (toImport.length > 0) {
          const merged = [...existingNotes, ...toImport];
          existingWidgets.notes = merged;
          notesImported = toImport.length;
        }
```

Then after line 113 (`await Store.set('widgetStates', existingWidgets);`), add:

```javascript
      // Widget-Module neu aus Storage laden (kein direkter Zugriff auf Internals)
      if (notesImported > 0) await Notes.init();
      if (calcImported) await Calculator.load();
      if (timerImported) await Timer.load();
```

And remove the direct mutations at lines 93 and 107:
- Remove: `Calculator._history = existingWidgets.calculator.history;` (line 93)
- Remove: `Timer._presets = existingWidgets.timer.presets;` (line 107)

- [ ] **Step 5: Verify import functionality**

Reload extension. Test:
1. Export current data as JSON
2. Edit the exported JSON: add a bookmark with `javascript:alert(1)` URL → import → verify the bad bookmark is silently skipped
3. Import a normal JSON backup → verify boards, notes, calculator history, timer presets all appear correctly
4. Verify no console errors

- [ ] **Step 6: Commit**

```bash
git add src/js/data.js
git commit -m "fix(security): harden JSON import with URL validation and immutable mapping

Add isSafeUrl() to block javascript:/data: URLs in imported bookmarks.
Replace mutable object mutation with immutable .map() and string length limits.
Use Notes.init()/Calculator.load()/Timer.load() instead of direct _notes/_history
mutation after import."
```

---

### Task 6: Remove Google Favicons — Local Letter Icons

**Files:**
- Modify: `src/js/state.js:36-43` (remove `getFaviconUrl`)
- Modify: `src/js/boards.js:218-230` (replace favicon rendering)
- Modify: `src/css/main.css:565-571` (replace CSS classes)

- [ ] **Step 1: Remove getFaviconUrl() from state.js**

Delete lines 36-43 in `src/js/state.js`:

```javascript
function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
  } catch {
    return '';
  }
}
```

- [ ] **Step 2: Replace favicon rendering in boards.js**

Replace lines 218-230 in `src/js/boards.js`:

```javascript
  const favicon = document.createElement('img');
  favicon.className = 'bm-favicon';
  favicon.width = 14;
  favicon.height = 14;
  favicon.src = getFaviconUrl(bm.url);
  favicon.addEventListener('error', function() {
    this.classList.add('hidden');
    this.nextElementSibling.classList.remove('hidden');
  });

  const fallback = document.createElement('div');
  fallback.className = 'bm-favicon-fallback hidden';
  fallback.textContent = bm.title.charAt(0).toUpperCase();
```

With:

```javascript
  const favicon = document.createElement('div');
  favicon.className = 'bm-favicon-local';
  favicon.textContent = bm.title.charAt(0).toUpperCase();
  const hue = (bm.title.charCodeAt(0) * 137) % 360;
  favicon.style.backgroundColor = `hsl(${hue}, 45%, 35%)`;
```

Also update the `appendChild` calls below. The old code appends both `favicon` and `fallback`:

Find the line that appends the fallback (should be near line 243-244):
```javascript
  li.append(favicon, fallback, textDiv, deleteBtn);
```

Replace with:
```javascript
  li.append(favicon, textDiv, deleteBtn);
```

- [ ] **Step 3: Replace CSS classes in main.css**

Replace lines 565-571:

```css
.bm-favicon { width: 14px; height: 14px; flex-shrink: 0; border-radius: 2px; opacity: 0.85; }
.bm-favicon-fallback {
  width: 14px; height: 14px; flex-shrink: 0;
  background: var(--accent-dim); border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; color: var(--accent);
}
```

With:

```css
.bm-favicon-local {
  width: 16px; height: 16px; flex-shrink: 0;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 600;
  color: #fff;
  line-height: 1;
}
```

- [ ] **Step 4: Verify favicons display correctly**

Reload extension. Check:
1. All bookmarks show a colored letter icon
2. Different bookmark titles produce different colors
3. The icons are aligned and properly sized in all themes
4. No network requests to google.com in the Network tab (F12 → Network)
5. No console errors about `getFaviconUrl`

- [ ] **Step 5: Commit**

```bash
git add src/js/state.js src/js/boards.js src/css/main.css
git commit -m "feat(privacy): replace Google Favicons with local letter icons

Remove getFaviconUrl() and all external network requests. Bookmarks now
show a colored letter icon with deterministic hue based on title.
Eliminates privacy leak and Brave Shields compatibility issues."
```

---

### Task 7: backdrop-filter Fallback for Brave Shields

**Files:**
- Modify: `src/css/main.css` (add `--bg-solid-fallback` per theme + `@supports not` block)

- [ ] **Step 1: Add --bg-solid-fallback to each theme**

Add the variable to each theme's `[data-theme]` block. The value is an opaque version of `--bg-board`:

| Theme | Line | `--bg-solid-fallback` value |
|---|---|---|
| nebula | ~82 | `#0a060e` |
| crescent | ~108 | `#0c0b08` |
| event-horizon | ~137 | `#06040f` |
| merchantman | ~163 | `#040d0d` |
| julia-jin | ~189 | `#080c12` |
| sc-sunset | ~216 | `#0e0808` |
| hellion-hud | ~245 | `#04080c` |
| hellion-energy | ~278 | `#040a08` |
| satisfactory | ~310 | `#060a0c` |
| avorion | ~341 | `#040c0a` |
| hellion-stealth | ~371 | `#060a0e` |

Add `--bg-solid-fallback: <value>;` as the last variable in each theme block.

- [ ] **Step 2: Add @supports not block at the end of the general layout section**

Add after the existing board/widget styles, before the theme-specific sections (around line 75, before the first `[data-theme]` block):

```css
/* Fallback fuer Browser die backdrop-filter blockieren (z.B. Brave Shields) */
@supports not (backdrop-filter: blur(1px)) {
  .board,
  .widget,
  .settings-panel,
  .dialog-box,
  .theme-modal,
  .search-bar {
    background-color: var(--bg-solid-fallback, var(--bg-primary));
  }
}
```

- [ ] **Step 3: Verify fallback works**

Test in Brave with Shields set to aggressive. Or test by temporarily adding this CSS rule:
```css
.board { backdrop-filter: none !important; }
```
Verify that boards still have a visible background (opaque, not transparent).

- [ ] **Step 4: Commit**

```bash
git add src/css/main.css
git commit -m "fix(compat): add backdrop-filter fallback for Brave Shields

Add --bg-solid-fallback CSS variable to all 11 themes and a
@supports not (backdrop-filter) block. UI remains usable when
Brave Shields or strict fingerprinting settings block backdrop-filter."
```

---

### Task 8: Complete i18n Coverage

**Files:**
- Modify: `newtab.html:26-42` (add `data-i18n-title` to 5 header buttons)
- Modify: `newtab.html:198, 215, 374` (add `data-i18n` to 3 setting buttons)
- Modify: `src/js/i18n.js` (add 10 new keys — 8 from spec + 2 from Task 4)

- [ ] **Step 1: Add data-i18n-title to header buttons in newtab.html**

Line 26 — change:
```html
<button class="btn-icon" id="btnImport" title="Bookmarks importieren (HTML)">
```
To:
```html
<button class="btn-icon" id="btnImport" title="Bookmarks importieren (HTML)" data-i18n-title="header.import_title">
```

Line 30 — change:
```html
<button class="btn-icon" id="btnAddBoard" title="Neues Board hinzufügen">
```
To:
```html
<button class="btn-icon" id="btnAddBoard" title="Neues Board hinzufügen" data-i18n-title="header.board_title">
```

Line 34 — change:
```html
<button class="btn-icon" id="btnNote" title="Schnellnotiz">
```
To:
```html
<button class="btn-icon" id="btnNote" title="Schnellnotiz" data-i18n-title="header.note_title">
```

Line 38 — change:
```html
<button class="btn-icon" id="btnTheme" title="Darstellung & Theme">
```
To:
```html
<button class="btn-icon" id="btnTheme" title="Darstellung & Theme" data-i18n-title="header.theme_title">
```

Line 42 — change:
```html
<button class="btn-icon" id="btnSettings" title="Einstellungen">
```
To:
```html
<button class="btn-icon" id="btnSettings" title="Einstellungen" data-i18n-title="header.settings_title">
```

- [ ] **Step 2: Add data-i18n to settings buttons in newtab.html**

Line 198 — change:
```html
<button class="btn-small" id="btnRestartOnboarding">Start</button>
```
To:
```html
<button class="btn-small" id="btnRestartOnboarding" data-i18n="settings.onboarding_btn">Start</button>
```

Line 215 — change:
```html
<button class="btn-danger" id="btnResetAll">Reset</button>
```
To:
```html
<button class="btn-danger" id="btnResetAll" data-i18n="settings.reset_btn">Reset</button>
```

Line 374 — change:
```html
<button class="btn-small" id="btnBgFile">Upload</button>
```
To:
```html
<button class="btn-small" id="btnBgFile" data-i18n="settings.bg_upload_btn">Upload</button>
```

- [ ] **Step 3: Add new keys to STRINGS.de in i18n.js**

Add these keys to the `STRINGS.de` object, in the appropriate sections:

In the Header section:
```javascript
    'header.import_title':       'Bookmarks importieren (HTML)',
    'header.board_title':        'Neues Board hinzufügen',
    'header.note_title':         'Schnellnotiz',
    'header.theme_title':        'Darstellung & Theme',
    'header.settings_title':     'Einstellungen',
```

In the Settings section:
```javascript
    'settings.onboarding_btn':   'Start',
    'settings.reset_btn':        'Reset',
    'settings.bg_upload_btn':    'Upload',
    'settings.bg_invalid_url':   'Nur lokale Bilder (Upload) sind als Hintergrund erlaubt.',
    'settings.bg_invalid_url.title': 'Ungültige URL',
```

- [ ] **Step 4: Add new keys to STRINGS.en in i18n.js**

Add the matching English keys to `STRINGS.en`:

In the Header section:
```javascript
    'header.import_title':       'Import bookmarks (HTML)',
    'header.board_title':        'Add new board',
    'header.note_title':         'Quick note',
    'header.theme_title':        'Appearance & Theme',
    'header.settings_title':     'Settings',
```

In the Settings section:
```javascript
    'settings.onboarding_btn':   'Start',
    'settings.reset_btn':        'Reset',
    'settings.bg_upload_btn':    'Upload',
    'settings.bg_invalid_url':   'Only local images (upload) are allowed as background.',
    'settings.bg_invalid_url.title': 'Invalid URL',
```

- [ ] **Step 5: Verify translations**

Reload extension. Test:
1. Set language to English → hover over header buttons → verify English tooltips
2. Set language to German → hover → verify German tooltips
3. Open Settings → verify "Start", "Reset", "Upload" buttons have `data-i18n` attributes (inspect in DevTools)

- [ ] **Step 6: Commit**

```bash
git add newtab.html src/js/i18n.js
git commit -m "fix(i18n): complete missing translations for toolbar tooltips and button texts

Add data-i18n-title to 5 header buttons, data-i18n to 3 settings buttons.
Add 10 new keys to STRINGS.de and STRINGS.en including background URL
validation error messages."
```

---

### Task 9: Version Bump, Changelog, Clock Cleanup

**Files:**
- Modify: `src/js/app.js:135`
- Modify: `manifest.json:5`
- Modify: `manifest.firefox.json` (version field)
- Modify: `manifest.opera.json` (version field)
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Store clock interval ID in app.js**

Replace line 135 in `src/js/app.js`:

```javascript
  setInterval(tick, 1000);
```

With:

```javascript
  const clockInterval = setInterval(tick, 1000);
```

- [ ] **Step 2: Bump version in all three manifests**

In `manifest.json`, `manifest.firefox.json`, and `manifest.opera.json`, change:
```json
"version": "2.0.0",
```
To:
```json
"version": "2.0.1",
```

- [ ] **Step 3: Add CHANGELOG entry**

Add this block at the top of `CHANGELOG.md`, after the header and before the v2.0.0 entry:

```markdown
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

```

- [ ] **Step 4: Verify everything**

Full manual test:
1. Reload extension
2. Verify version in `chrome://extensions` shows 2.0.1
3. Open/close/minimize/reopen widgets of all types
4. Switch language DE/EN — all tooltips translate
5. Import/export JSON data
6. Upload background image
7. Check Network tab — zero external requests
8. Check Console — zero errors

- [ ] **Step 5: Commit**

```bash
git add src/js/app.js manifest.json manifest.firefox.json manifest.opera.json CHANGELOG.md
git commit -m "chore(release): bump version to v2.0.1 — hardening release

Security fixes, widget event system, local favicons, i18n completeness,
backdrop-filter fallback, code quality improvements. See CHANGELOG.md."
```
