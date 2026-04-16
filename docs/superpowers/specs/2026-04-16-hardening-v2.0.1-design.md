# Hellion NewTab v2.0.1 — Hardening Release Design

**Datum:** 2026-04-16
**Autor:** Florian Wathling / Claude Code
**Status:** Approved
**Scope:** Security, Stability, i18n, Code Quality
**Strategie:** Foundation First (Event-System zuerst, dann darauf aufbauen)

---

## Kontext

Umfassender Audit von v2.0.0 hat Findings in vier Kategorien ergeben:
- 3 Sicherheitslücken (HOCH)
- 2 Stabilitätsprobleme (Race Conditions)
- 8 fehlende i18n-Attribute
- 3 Code-Qualität-Items

Dieses Design beschreibt alle Fixes als zusammenhängendes Hardening-Release.

---

## Sektion 1: Widget Event-System

### Problem

Calculator (`calculator.js:692-728`), Timer (`timer.js:723-758`) und ImageRef (`image-ref.js:463-498`) überschreiben `WidgetManager.close`, `.minimize` und `.openWidget` durch Monkey-Patching in ihrer `init()`. Das erzeugt eine 3-stufige Closure-Kette pro Methode. Funktional korrekt, aber fragil und schwer debugbar.

### Lösung

WidgetManager bekommt ein internes Event-System basierend auf `EventTarget`.

**Neue API in `widgets.js`:**

```javascript
_emitter: new EventTarget(),

on(event, handler) {
  this._emitter.addEventListener(event, handler);
},

off(event, handler) {
  this._emitter.removeEventListener(event, handler);
},
```

**Events:**

| Event | Feuert nach | Detail |
|---|---|---|
| `widget:close` | `entry.el.remove()` + `_widgets.delete(id)` | `{ id }` | **Achtung:** Element bereits entfernt, Listener dürfen nicht auf Widget-Entry zugreifen |
| `widget:minimize` | State-Änderung + Animation + Save | `{ id }` |
| `widget:open` | State-Änderung + Display-Reset + Save | `{ id }` |

**Migration der Widget-Module:**

Das gesamte Monkey-Patching wird ersetzt durch `WidgetManager.on()` Aufrufe:

```javascript
// Beispiel: Calculator.init()
WidgetManager.on('widget:close', (e) => {
  if (e.detail.id === self.WIDGET_ID) self.onClose();
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
    if (body && body.children.length === 0) self.renderBody(body);
    self.save();
  }
});
```

ImageRef folgt dem gleichen Pattern, prüft aber per `self._images.some(img => img.id === id)` statt gegen eine feste WIDGET_ID.

**Load-Order:** Kein Problem. `widgets.js` wird vor allen Widget-Modulen geladen. Die Module rufen `WidgetManager.on()` in ihrer `init()` auf, die erst in `app.js` aufgerufen wird.

### Betroffene Dateien

- `src/js/widgets.js` — Event-System hinzufügen, Events in close/minimize/openWidget dispatchen
- `src/js/calculator.js` — Monkey-Patching (Z. 692-728) durch Event-Listener ersetzen
- `src/js/timer.js` — Monkey-Patching (Z. 723-758) durch Event-Listener ersetzen
- `src/js/image-ref.js` — Monkey-Patching (Z. 463-498) durch Event-Listener ersetzen

---

## Sektion 2: Minimize-Animation mit `transitionend`

### Problem

`WidgetManager.minimize()` (`widgets.js:154-163`) setzt `display: none` nach 250ms `setTimeout`. Wenn `openWidget()` in diesen 250ms aufgerufen wird, überschreibt der Timeout das `display: flex` wieder (Race Condition).

### Lösung

`setTimeout` wird durch `transitionend` Event ersetzt. Eine `_minimizing` Flag verhindert die Race Condition.

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
  }, { once: false });

  this._emitter.dispatchEvent(new CustomEvent('widget:minimize', { detail: { id } }));
  await this.save();
},

async openWidget(id) {
  const entry = this._widgets.get(id);
  if (!entry) return;
  entry._minimizing = false;  // Race Condition verhindert
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

**Warum `_minimizing` Flag:** Robuster als `clearTimeout`, weil sie unabhängig von der CSS-Transition-Duration funktioniert.

**Fallback:** Falls `transitionend` nicht feuert (kein Transition definiert), bleibt das Widget sichtbar mit der Klasse. Akzeptabel, da alle Widgets in `main.css` eine Transition haben.

### Betroffene Dateien

- `src/js/widgets.js` — `minimize()` und `openWidget()` umschreiben

---

## Sektion 3: Security Fixes

### 3a: URL-Injection in backgroundImage

**Datei:** `src/js/settings.js:93`
**Problem:** `settings.bgUrl` wird unvalidiert in CSS-Template-Literal eingefügt.

**Fix:** Protokoll-Whitelist. Nur `blob:` und `data:image/` erlauben (die einzigen Protokolle die der Upload erzeugt).

```javascript
function isValidBgUrl(url) {
  return typeof url === 'string' &&
    (url.startsWith('blob:') || url.startsWith('data:image/'));
}
```

Validierung an zwei Stellen: `applySettings()` und beim Speichern nach Upload.

### 3b: URL-Validierung beim JSON-Import

**Datei:** `src/js/data.js:45-49`
**Problem:** Importierte Bookmark-URLs werden nicht auf Protokoll geprüft. `javascript:` oder `data:` URLs kommen durch.

**Fix:** Protokoll-Whitelist für importierte URLs.

```javascript
function isSafeUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:', 'ftp:'].includes(u.protocol);
  } catch {
    return false;
  }
}
```

Integration in die Bookmark-Filter-Logik: `if (!bm || typeof bm.title !== 'string' || !isSafeUrl(bm.url)) return false;`

Ungültige Bookmarks werden still übersprungen.

### 3c: Objekt-Mutation im Import

**Datei:** `src/js/data.js:43-48`
**Problem:** `b.id = b.id || uid()` mutiert das geparste JSON-Objekt direkt. Keine Längenvalidierung.

**Fix:** Immutable Mapping mit expliziter Feldauswahl und String-Längen-Limits.

```javascript
.map(bm => ({
  id: bm.id || uid(),
  title: String(bm.title).slice(0, 200),
  url: bm.url,
  desc: String(bm.desc || '').slice(0, 500)
}));
```

Analog für Boards:

```javascript
.map(b => ({
  id: b.id || uid(),
  title: String(b.title).slice(0, 100),
  blurred: !!b.blurred,
  bookmarks: /* bereits sanitized, siehe oben */
}));
```

Notes-Felder beim Import werden ebenfalls sanitized:

```javascript
.filter(n => n && n.id && n.template)
.map(n => ({
  id: n.id,
  template: ['note', 'checklist'].includes(n.template) ? n.template : 'note',
  title: String(n.title || '').slice(0, 200),
  content: String(n.content || '').slice(0, 5000),
  checklistItems: Array.isArray(n.checklistItems) ? n.checklistItems : []
}));
```

### Betroffene Dateien

- `src/js/settings.js` — `isValidBgUrl()` + Validierung in `applySettings()`
- `src/js/data.js` — `isSafeUrl()` + immutable Mapping + Längen-Limits

---

## Sektion 4: Lokale Favicons

### Problem

`getFaviconUrl()` (`state.js:36-43`) ruft Google Favicons API auf. Brave Shields blockiert das. Jeder Bookmark erzeugt einen fehlgeschlagenen Netzwerk-Request. Zusätzlich leakt jeder Hostname an Google.

### Lösung

Kein externer Request mehr. `getFaviconUrl()` wird entfernt. Bookmarks zeigen ein farbiges Buchstaben-Icon (erster Buchstabe des Titels).

**state.js:** `getFaviconUrl()` löschen.

**boards.js:** Statt `<img>` + Error-Fallback nur noch ein `<div>`:

```javascript
const favicon = document.createElement('div');
favicon.className = 'bm-favicon-local';
favicon.textContent = bm.title.charAt(0).toUpperCase();
// Deterministische Farbe pro Buchstabe
const hue = (bm.title.charCodeAt(0) * 137) % 360;
favicon.style.backgroundColor = `hsl(${hue}, 45%, 35%)`;
```

Inline-Style für `backgroundColor` ist hier gerechtfertigt, weil der Wert dynamisch pro Bookmark berechnet wird. Restliche Styles (Größe, Border-Radius, Schrift) kommen aus CSS.

**main.css:** `.bm-favicon` und `.bm-favicon-fallback` ersetzen durch `.bm-favicon-local`.

### Was entfällt

- `getFaviconUrl()` in `state.js`
- `<img class="bm-favicon">` Erzeugung in `boards.js`
- Error-Listener für Favicon-Loads
- `.bm-favicon` und `.bm-favicon-fallback` CSS-Regeln
- Der einzige externe Netzwerk-Request der Extension

### Betroffene Dateien

- `src/js/state.js` — `getFaviconUrl()` entfernen
- `src/js/boards.js` — Favicon-Rendering umbauen
- `src/css/main.css` — CSS-Klassen tauschen

---

## Sektion 5: i18n-Lücken schließen

### 5a: Toolbar-Buttons — fehlende `data-i18n-title`

Fünf Header-Buttons (`newtab.html:26-42`) haben hardcodierte deutsche `title`-Attribute.

| Button | Key | DE | EN |
|---|---|---|---|
| `#btnImport` | `header.import_title` | Bookmarks importieren (HTML) | Import bookmarks (HTML) |
| `#btnAddBoard` | `header.board_title` | Neues Board hinzufügen | Add new board |
| `#btnNote` | `header.note_title` | Schnellnotiz | Quick note |
| `#btnTheme` | `header.theme_title` | Darstellung & Theme | Appearance & Theme |
| `#btnSettings` | `header.settings_title` | Einstellungen | Settings |

**Fix:** `data-i18n-title` Attribute hinzufügen. `applyLanguage()` erkennt diese automatisch.

### 5b: Button-Texte ohne i18n

Drei Settings-Buttons haben hardcodierte Texte.

| Button | Key | DE | EN |
|---|---|---|---|
| `#btnRestartOnboarding` | `settings.onboarding_btn` | Start | Start |
| `#btnResetAll` | `settings.reset_btn` | Reset | Reset |
| `#btnBgFile` | `settings.bg_upload_btn` | Upload | Upload |

Aktuell in beiden Sprachen identisch, aber `data-i18n` wird für Konsistenz und zukünftige Erweiterbarkeit gesetzt.

### Betroffene Dateien

- `newtab.html` — 5x `data-i18n-title`, 3x `data-i18n` hinzufügen
- `src/js/i18n.js` — 8 neue Keys in `STRINGS.de` und `STRINGS.en`

---

## Sektion 6: Code-Qualität

### 6a: Notes-Mutation beim Import

**Datei:** `src/js/data.js:~79`
**Problem:** `Notes._notes = merged` setzt das interne Array direkt, umgeht `Notes.save()`.

**Fix:** Nach dem Speichern in `widgetStates` wird `Notes.init()` aufgerufen statt das interne Array direkt zu manipulieren.

```javascript
existingWidgets.notes = merged;
await Store.set('widgetStates', existingWidgets);
await Notes.init();  // Neu aus Storage laden + UI rendern
```

### 6b: `backdrop-filter` Fallback

**Datei:** `src/css/main.css`
**Problem:** 24 Stellen mit `backdrop-filter`. Brave Shields kann das blockieren.

**Fix:** Zentraler `@supports not` Block mit solidem Hintergrund-Fallback:

```css
@supports not (backdrop-filter: blur(1px)) {
  .board,
  .widget,
  .settings-panel,
  .dialog-box,
  .theme-modal {
    background-color: var(--bg-solid-fallback);
  }
}
```

Jedes Theme bekommt `--bg-solid-fallback` als deckende Variante der Glassmorphism-Farbe.

### 6c: Clock Interval Cleanup

**Datei:** `src/js/app.js:135`
**Problem:** `setInterval(tick, 1000)` ID wird nicht gespeichert.

**Fix:** Interval-ID in Variable speichern. Niedrigste Priorität, da der Interval mit dem Tab stirbt.

```javascript
let _clockInterval = null;
_clockInterval = setInterval(tick, 1000);
```

### Betroffene Dateien

- `src/js/data.js` — Notes-Import über `Notes.init()` statt direkter Mutation
- `src/css/main.css` — `@supports not` Block + `--bg-solid-fallback` pro Theme
- `src/js/app.js` — Interval-ID speichern

---

## Implementierungsreihenfolge (Foundation First)

1. **Event-System** in `widgets.js` bauen
2. **Widget-Module** auf Events migrieren (`calculator.js`, `timer.js`, `image-ref.js`)
3. **Minimize mit `transitionend`** in `widgets.js`
4. **Security Fixes** in `settings.js` und `data.js`
5. **Lokale Favicons** in `state.js`, `boards.js`, `main.css`
6. **i18n-Lücken** in `newtab.html` und `i18n.js`
7. **Code-Qualität** in `data.js`, `main.css`, `app.js`
8. **Version Bump** auf 2.0.1 in allen drei Manifests + CHANGELOG

## Betroffene Dateien (Gesamt)

| Datei | Sektionen |
|---|---|
| `src/js/widgets.js` | 1, 2 |
| `src/js/calculator.js` | 1 |
| `src/js/timer.js` | 1 |
| `src/js/image-ref.js` | 1 |
| `src/js/settings.js` | 3a |
| `src/js/data.js` | 3b, 3c, 6a |
| `src/js/state.js` | 4 |
| `src/js/boards.js` | 4 |
| `src/js/i18n.js` | 5 |
| `src/js/app.js` | 6c |
| `src/css/main.css` | 4, 6b |
| `newtab.html` | 5 |
| `manifest.json` | 8 |
| `manifest.firefox.json` | 8 |
| `manifest.opera.json` | 8 |
| `CHANGELOG.md` | 8 |
