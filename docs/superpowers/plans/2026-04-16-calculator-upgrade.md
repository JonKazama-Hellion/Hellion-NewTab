# Calculator Upgrade v2.1.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Calculator widget with 5 new modes — Scientific, Unit Converter, Satisfactory, Factorio, Stationeers — using a tab-based architecture with mode registration pattern.

**Architecture:** Each mode lives in its own IIFE file that calls `Calculator.registerMode()`. The core `calculator.js` gains a `_modes` Map, tab-bar rendering, and `switchMode()` logic. The Shunting-Yard parser is extended with `^` (power) and `sqrt()` (function). All new files load between `calculator.js` and `timer.js` in newtab.html.

**Tech Stack:** Vanilla JS ES2020, CSS Custom Properties, chrome.storage.local via Store, i18n via t() helper

**Spec:** `docs/superpowers/specs/2026-04-16-calculator-upgrade-design.md`

---

### Task 1: Tab-System im Calculator Core

**Files:**
- Modify: `src/js/calculator.js` (全 Datei — Tab-System, registerMode, switchMode, Standard-Mode-Extraktion)
- Modify: `src/css/main.css:1284` (neue CSS-Klassen nach bestehenden Calculator-Styles)

**Kontext:** Aktuell rendert `Calculator.renderBody()` direkt das Standard-UI (Display + Buttons + History). Wir refactoren das zu einem Tab-System: `renderBody()` baut Tab-Bar + Mode-Container, dann delegiert an den aktiven Modus. Der Standard-Modus wird als interner Modus registriert. Externe Modi registrieren sich per `Calculator.registerMode()`.

- [ ] **Step 1: Neue Properties und registerMode() hinzufügen**

In `calculator.js`, nach `_keydownHandler: null,` (Zeile 19) folgende Properties ergänzen:

```javascript
_modes: new Map(),
_activeMode: 'standard',
_tabBarEl: null,
```

Neue Methode nach `_keydownHandler` Block:

```javascript
/**
 * Modus registrieren (wird von externen Mode-Dateien aufgerufen)
 * @param {string} name - Eindeutiger Modus-Name
 * @param {Object} config - { label, shortName, titleKey, render(bodyEl), destroy() }
 */
registerMode(name, config) {
  this._modes.set(name, config);
  // Tab-Bar aktualisieren falls Widget bereits offen
  if (this._tabBarEl) this._renderTabBar();
},
```

- [ ] **Step 2: Standard-Modus als internen Modus registrieren**

Am Ende der `init()` Methode (vor dem Schließen des Objekts), nach den Event-Listener-Registrierungen, den Standard-Modus registrieren:

```javascript
// Standard-Modus intern registrieren
this._modes.set('standard', {
  label: '🔢',
  shortName: 'Std',
  titleKey: 'calculator.tab.standard',
  render: (bodyEl) => this._renderStandardMode(bodyEl),
  destroy: () => {
    // Standard-Modus hat keinen speziellen Cleanup
    this._displayExprEl = null;
    this._displayResultEl = null;
  }
});
```

- [ ] **Step 3: renderBody() refactoren — Tab-Bar + Mode-Container**

Die bestehende `renderBody()` Methode komplett ersetzen:

```javascript
/**
 * Calculator-Body rendern: Tab-Bar + aktiver Modus
 * @param {HTMLElement} bodyEl
 */
renderBody(bodyEl) {
  bodyEl.textContent = '';
  bodyEl.style.padding = '0';
  bodyEl.style.display = 'flex';
  bodyEl.style.flexDirection = 'column';
  bodyEl.style.height = '100%';

  // Tab-Bar
  const tabBar = document.createElement('div');
  tabBar.className = 'calc-tab-bar';
  this._tabBarEl = tabBar;
  this._renderTabBar();

  // Mode-Body Container
  const modeBody = document.createElement('div');
  modeBody.className = 'calc-mode-body';

  bodyEl.append(tabBar, modeBody);

  // Aktiven Modus rendern
  const mode = this._modes.get(this._activeMode);
  if (mode) {
    mode.render(modeBody);
  }
},
```

- [ ] **Step 4: _renderTabBar() und _updateTabBar() erstellen**

```javascript
/**
 * Tab-Bar mit Buttons aus _modes Map befüllen
 */
_renderTabBar() {
  if (!this._tabBarEl) return;
  // Alle bisherigen Tabs entfernen
  while (this._tabBarEl.firstChild) {
    this._tabBarEl.removeChild(this._tabBarEl.firstChild);
  }

  this._modes.forEach((config, name) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'calc-tab' + (name === this._activeMode ? ' active' : '');
    tab.dataset.mode = name;

    const icon = document.createElement('span');
    icon.className = 'calc-tab-icon';
    icon.textContent = config.label;

    const label = document.createElement('span');
    label.className = 'calc-tab-label';
    label.textContent = config.shortName;

    tab.append(icon, label);
    tab.addEventListener('click', () => this.switchMode(name));
    this._tabBarEl.appendChild(tab);
  });
},

/**
 * Aktiven Tab visuell markieren (ohne Neuaufbau)
 */
_updateTabBar() {
  if (!this._tabBarEl) return;
  const tabs = this._tabBarEl.querySelectorAll('.calc-tab');
  tabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === this._activeMode);
  });
},
```

- [ ] **Step 5: switchMode() erstellen**

```javascript
/**
 * Modus wechseln
 * @param {string} name - Ziel-Modus
 */
async switchMode(name) {
  if (name === this._activeMode) return;
  const mode = this._modes.get(name);
  if (!mode) return;

  // Alten Modus aufräumen
  const oldMode = this._modes.get(this._activeMode);
  if (oldMode && oldMode.destroy) oldMode.destroy();

  this._activeMode = name;

  // Mode-Body leeren und neu rendern
  const entry = WidgetManager._widgets.get(this.WIDGET_ID);
  if (!entry) return;
  const modeBody = entry.el.querySelector('.calc-mode-body');
  if (!modeBody) return;
  modeBody.textContent = '';
  mode.render(modeBody);

  // Tab-UI aktualisieren
  this._updateTabBar();

  // Auto-Resize für komplexe Modi
  const isComplex = name !== 'standard';
  if (isComplex) {
    const state = WidgetManager.getState(this.WIDGET_ID);
    if (state) {
      const newW = Math.max(state.width, 320);
      const newH = Math.max(state.height, 480);
      if (newW !== state.width || newH !== state.height) {
        WidgetManager.resize(this.WIDGET_ID, newW, newH);
      }
    }
  }

  // Keyboard neu binden
  this._unbindKeyboard();
  if (name === 'standard' || name === 'scientific') {
    if (entry) this._bindKeyboard(entry.el);
  }

  await this.save();
},
```

- [ ] **Step 6: _renderStandardMode() extrahieren**

Neue Methode, die den bisherigen `renderBody()` Inhalt enthält (Display + Buttons + History):

```javascript
/**
 * Standard-Modus UI rendern
 * @param {HTMLElement} bodyEl
 */
_renderStandardMode(bodyEl) {
  bodyEl.style.padding = '8px';
  bodyEl.style.display = 'flex';
  bodyEl.style.flexDirection = 'column';
  bodyEl.style.flex = '1';
  bodyEl.style.overflow = 'hidden';

  // Display
  const display = document.createElement('div');
  display.className = 'calc-display';

  const exprEl = document.createElement('div');
  exprEl.className = 'calc-expression';
  this._displayExprEl = exprEl;

  const resultEl = document.createElement('div');
  resultEl.className = 'calc-result';
  resultEl.textContent = '0';
  this._displayResultEl = resultEl;

  display.append(exprEl, resultEl);

  // Buttons
  const buttonsEl = this._createButtons();

  // History
  const historyEl = this._createHistoryPanel();

  bodyEl.append(display, buttonsEl, historyEl);

  // Aktuellen State anzeigen
  this._updateDisplay();
},
```

- [ ] **Step 7: save() und load() um activeMode erweitern**

In `save()`, `calcData` um `activeMode` erweitern:

```javascript
const calcData = {
  x: widgetState ? widgetState.x : 400,
  y: widgetState ? widgetState.y : 120,
  width: widgetState ? widgetState.width : 280,
  height: widgetState ? widgetState.height : 400,
  open: this._isOpen,
  activeMode: this._activeMode,
  history: this._history.slice(0, this.MAX_HISTORY)
};
```

In `load()`, activeMode wiederherstellen:

```javascript
async load() {
  const data = await Store.get(this.STORAGE_KEY);
  if (data && data.calculator) {
    this._history = Array.isArray(data.calculator.history) ? data.calculator.history : [];
    if (data.calculator.activeMode) {
      this._activeMode = data.calculator.activeMode;
    }
  }
},
```

In `onClose()`, alten Modus aufräumen:

```javascript
async onClose() {
  // Aktiven Modus aufräumen
  const mode = this._modes.get(this._activeMode);
  if (mode && mode.destroy) mode.destroy();

  this._isOpen = false;
  this._unbindKeyboard();
  this._tabBarEl = null;
  this._displayExprEl = null;
  this._displayResultEl = null;
  await this.save();
},
```

- [ ] **Step 8: CSS für Tab-Bar und Mode-Body**

In `src/css/main.css`, nach dem `.calc-history-item .calc-h-result` Block (Zeile 1283), vor den Timer-Styles einfügen:

```css
/* Calculator Tab System */
.calc-tab-bar {
  display: flex;
  background: rgba(0,0,0,0.2);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
  flex-shrink: 0;
}
.calc-tab-bar::-webkit-scrollbar {
  display: none;
}
.calc-tab {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--text-muted);
  font-size: 11px;
  font-family: 'Rajdhani', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.calc-tab:hover {
  color: var(--text-secondary);
}
.calc-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}
.calc-tab-icon {
  font-size: 12px;
}
.calc-tab-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.calc-mode-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
```

- [ ] **Step 9: i18n-Key für Standard-Tab**

In `src/js/i18n.js`, nach `'calculator.error'` in beiden Sprachen:

DE:
```javascript
'calculator.tab.standard':   'Standard',
```

EN:
```javascript
'calculator.tab.standard':   'Standard',
```

- [ ] **Step 10: Testen**

1. Extension in Chrome laden
2. Calculator öffnen → Tab-Bar mit einem Tab "🔢 Std" sichtbar
3. Calculator schließen und wieder öffnen → State bleibt erhalten
4. Standard-Rechner funktioniert wie vorher (Buttons, History, Keyboard)

- [ ] **Step 11: Commit**

```bash
git add src/js/calculator.js src/css/main.css src/js/i18n.js
git commit -m "feat(calculator): Tab-System mit registerMode() und switchMode()"
```

---

### Task 2: Parser-Erweiterung — ^ und sqrt

**Files:**
- Modify: `src/js/calculator.js` — `_evaluate()`, `_tokenize()`, `_parseExpression()` innere Funktionen

**Kontext:** Der Shunting-Yard-Parser kennt aktuell nur `+`, `-`, `*`, `/`, `%`. Wir fügen `^` (Potenz, rechts-assoziativ) und `sqrt` (unäre Funktion) hinzu. Die neue Hierarchie: `parseExpr(+,-)` → `parseTerm(*,/,%)` → `parsePower(^)` → `parseFactor(number | parens | func)`.

- [ ] **Step 1: Sanitizer erweitern**

In `_evaluate()`, die Sanitizer-Regex erweitern um `^` und Buchstaben (für `sqrt`):

```javascript
_evaluate(expr) {
  try {
    // Nur erlaubte Zeichen (inkl. ^ und sqrt-Buchstaben)
    const sanitized = expr.replace(/[^0-9+\-*/.%()^a-z]/g, '');
    if (!sanitized) return null;

    const tokens = this._tokenize(sanitized);
    if (!tokens) return null;

    return this._parseExpression(tokens);
  } catch {
    return null;
  }
},
```

- [ ] **Step 2: Tokenizer um ^ und sqrt erweitern**

In `_tokenize()`, nach dem Operator-Block (`if (/[+\-*/%]/.test(ch))`) und vor dem Klammern-Block, `^` als Operator erkennen. Vor dem Zahlen-Block `sqrt` als Funktion erkennen:

```javascript
_tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // Funktion: sqrt
    if (expr.substring(i, i + 4) === 'sqrt') {
      tokens.push({ type: 'func', value: 'sqrt' });
      i += 4;
      continue;
    }

    // Zahl (inkl. Dezimal)
    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return null;
      tokens.push({ type: 'number', value: parsed });
      continue;
    }

    // Potenz-Operator
    if (ch === '^') {
      tokens.push({ type: 'op', value: '^' });
      i++;
      continue;
    }

    // Operator
    if (/[+\-*/%]/.test(ch)) {
      // Negativer Vorzeichen-Check: am Anfang oder nach Operator/oeffnender Klammer
      if (ch === '-') {
        const prev = tokens[tokens.length - 1];
        if (!prev || prev.type === 'op' || (prev.type === 'paren' && prev.value === '(')) {
          let num = '-';
          i++;
          while (i < expr.length && /[0-9.]/.test(expr[i])) {
            num += expr[i];
            i++;
          }
          if (num === '-') return null;
          const parsed = parseFloat(num);
          if (isNaN(parsed)) return null;
          tokens.push({ type: 'number', value: parsed });
          continue;
        }
      }
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // Klammern
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    // Unbekannte Buchstaben überspringen (können Reste von Funktionsnamen sein)
    if (/[a-z]/.test(ch)) {
      return null;
    }

    // Unbekanntes Zeichen
    return null;
  }

  return tokens;
},
```

- [ ] **Step 3: Parser um parsePower() und Funktions-Support erweitern**

Die `_parseExpression()` Methode komplett ersetzen. `parseTerm()` ruft jetzt `parsePower()` statt `parseFactor()` auf. `parsePower()` ist rechts-assoziativ. `parseFactor()` prüft auf Funktionen:

```javascript
_parseExpression(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  // Expression: Term (('+' | '-') Term)*
  function parseExpr() {
    let left = parseTerm();
    if (left === null) return null;

    while (pos < tokens.length) {
      const tk = peek();
      if (!tk || tk.type !== 'op' || (tk.value !== '+' && tk.value !== '-')) break;
      consume();
      const right = parseTerm();
      if (right === null) return null;
      left = tk.value === '+' ? left + right : left - right;
    }
    return left;
  }

  // Term: Power (('*' | '/' | '%') Power)*
  function parseTerm() {
    let left = parsePower();
    if (left === null) return null;

    while (pos < tokens.length) {
      const tk = peek();
      if (!tk || tk.type !== 'op' || (tk.value !== '*' && tk.value !== '/' && tk.value !== '%')) break;
      consume();
      const right = parsePower();
      if (right === null) return null;
      if (tk.value === '*') {
        left = left * right;
      } else if (tk.value === '/') {
        if (right === 0) return null;
        left = left / right;
      } else {
        left = left % right;
      }
    }
    return left;
  }

  // Power: Factor ('^' Power)?  — rechts-assoziativ durch Rekursion
  function parsePower() {
    let base = parseFactor();
    if (base === null) return null;

    const tk = peek();
    if (tk && tk.type === 'op' && tk.value === '^') {
      consume();
      const exp = parsePower(); // Rechts-assoziativ!
      if (exp === null) return null;
      return Math.pow(base, exp);
    }
    return base;
  }

  // Factor: func '(' Expression ')' | Number | '(' Expression ')'
  function parseFactor() {
    const tk = peek();
    if (!tk) return null;

    // Funktion: sqrt(...)
    if (tk.type === 'func') {
      const funcName = tk.value;
      consume();
      // Erwarte öffnende Klammer
      const open = peek();
      if (!open || open.type !== 'paren' || open.value !== '(') return null;
      consume();
      const val = parseExpr();
      if (val === null) return null;
      const close = peek();
      if (close && close.type === 'paren' && close.value === ')') {
        consume();
      }
      if (funcName === 'sqrt') {
        if (val < 0) return null; // Keine negativen Wurzeln
        return Math.sqrt(val);
      }
      return null;
    }

    if (tk.type === 'number') {
      consume();
      return tk.value;
    }

    if (tk.type === 'paren' && tk.value === '(') {
      consume();
      const val = parseExpr();
      if (val === null) return null;
      const closing = peek();
      if (closing && closing.type === 'paren' && closing.value === ')') {
        consume();
      }
      return val;
    }

    return null;
  }

  const result = parseExpr();

  // Alle Tokens muessen verbraucht sein
  if (pos < tokens.length) return null;

  if (result === null || !isFinite(result)) return null;
  return result;
},
```

- [ ] **Step 4: _handleKey() um ^ erweitern**

Im `default`-case der `_handleKey()` Methode, nach dem Ziffern-Check, `^` als Operator behandeln. In den Operator-Case (die bestehende `case '%': case '+': ...` Kette), `'^'` hinzufügen:

```javascript
case '%':
case '+':
case '-':
case '*':
case '/':
case '^': {
  // Wenn gerade ein Ergebnis angezeigt wird, damit weiterrechnen
  if (this._lastResult && this._currentExpr === '') {
    this._currentExpr = this._lastResult;
    this._lastResult = '';
  }
  // Doppelte Operatoren verhindern (letzten ersetzen)
  const last = this._currentExpr.slice(-1);
  if (/[+\-*/%^]/.test(last)) {
    this._currentExpr = this._currentExpr.slice(0, -1) + key;
  } else {
    this._currentExpr += key;
  }
  break;
}
```

- [ ] **Step 5: _formatExpression() um ^ erweitern**

```javascript
_formatExpression(expr) {
  return expr
    .replace(/\*/g, '\u00D7')
    .replace(/\//g, '\u00F7')
    .replace(/sqrt\(/g, '√(');
},
```

- [ ] **Step 6: Testen**

1. Calculator öffnen
2. `2^10` eingeben → Ergebnis: 1024
3. `2^3^2` eingeben → Ergebnis: 512 (rechts-assoziativ)
4. In Browser-Console: Calculator._evaluate('sqrt(144)') → 12
5. `3+sqrt(16)` → 7
6. `sqrt(-4)` → Fehler

- [ ] **Step 7: Commit**

```bash
git add src/js/calculator.js
git commit -m "feat(calculator): Parser um ^ (Potenz) und sqrt() erweitern"
```

---

### Task 3: Scientific-Modus

**Files:**
- Create: `src/js/calc-scientific.js`
- Modify: `newtab.html:509` (Script-Tag nach calculator.js einfügen)
- Modify: `src/js/i18n.js` (neue Keys)
- Modify: `src/css/main.css` (Scientific-spezifische Styles)

**Kontext:** Der Scientific-Modus erweitert den Standard-Rechner um 6 wissenschaftliche Buttons (√, x², xⁿ, π, e, ±) und einen Formel-Helfer mit 6 vorgefertigten Formeln. Er nutzt den gleichen `_handleKey()`/`_calculate()` Flow des Cores.

- [ ] **Step 1: calc-scientific.js erstellen**

```javascript
/* =============================================
   HELLION NEWTAB — calc-scientific.js
   Scientific-Modus für Calculator Widget
   ============================================= */

(function() {
  'use strict';

  /** Formel-Definitionen */
  const FORMULAS = [
    {
      key: 'circle_area',
      fields: [{ key: 'radius', default: '' }],
      calc: (vals) => Math.PI * vals.radius * vals.radius
    },
    {
      key: 'circle_circumference',
      fields: [{ key: 'radius', default: '' }],
      calc: (vals) => 2 * Math.PI * vals.radius
    },
    {
      key: 'celsius_to_fahrenheit',
      fields: [{ key: 'temp', default: '' }],
      calc: (vals) => (vals.temp * 9 / 5) + 32
    },
    {
      key: 'fahrenheit_to_celsius',
      fields: [{ key: 'temp', default: '' }],
      calc: (vals) => (vals.temp - 32) * 5 / 9
    },
    {
      key: 'pythagoras',
      fields: [{ key: 'a', default: '' }, { key: 'b', default: '' }],
      calc: (vals) => Math.sqrt(vals.a * vals.a + vals.b * vals.b)
    },
    {
      key: 'percentage',
      fields: [{ key: 'value', default: '' }, { key: 'percent', default: '' }],
      calc: (vals) => vals.value * vals.percent / 100
    }
  ];

  /** Keyboard-Handler Referenz für Cleanup */
  let _keyboardExtHandler = null;

  /**
   * Scientific-Buttons rendern
   * @param {HTMLElement} container
   */
  function renderSciButtons(container) {
    const grid = document.createElement('div');
    grid.className = 'calc-buttons calc-sci-buttons';

    const buttons = [
      ['√',  'sqrt',   'operator'],
      ['x²', 'square', 'operator'],
      ['xⁿ', 'power',  'operator'],
      ['π',  'pi',     'operator'],
      ['e',  'euler',  'operator'],
      ['±',  'negate', 'operator']
    ];

    buttons.forEach(([label, value, cls]) => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn' + (cls ? ' ' + cls : '');
      btn.textContent = label;
      btn.type = 'button';
      btn.addEventListener('click', () => handleSciKey(value));
      grid.appendChild(btn);
    });

    container.appendChild(grid);
  }

  /**
   * Scientific-Taste verarbeiten
   * @param {string} key
   */
  function handleSciKey(key) {
    switch (key) {
      case 'sqrt':
        Calculator._currentExpr += 'sqrt(';
        Calculator._updateDisplay();
        break;
      case 'square':
        Calculator._currentExpr += '^2';
        Calculator._updateDisplay();
        break;
      case 'power':
        Calculator._handleKey('^');
        break;
      case 'pi':
        Calculator._currentExpr += '3.14159265359';
        Calculator._updateDisplay();
        break;
      case 'euler':
        Calculator._currentExpr += '2.71828182846';
        Calculator._updateDisplay();
        break;
      case 'negate':
        handleNegate();
        break;
    }
  }

  /**
   * Vorzeichen-Wechsel: letzten numerischen Wert negieren
   */
  function handleNegate() {
    const expr = Calculator._currentExpr;
    if (!expr && Calculator._lastResult) {
      // Ergebnis negieren
      const num = parseFloat(Calculator._lastResult);
      if (!isNaN(num)) {
        Calculator._currentExpr = String(-num);
        Calculator._lastResult = '';
        Calculator._updateDisplay();
      }
      return;
    }
    // Letzte Zahl in der Expression finden und negieren
    const match = expr.match(/(-?\d+\.?\d*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const negated = String(-num);
      Calculator._currentExpr = expr.slice(0, expr.length - match[1].length) + negated;
      Calculator._updateDisplay();
    }
  }

  /**
   * Formel-Helfer UI rendern
   * @param {HTMLElement} container
   */
  function renderFormulaHelper(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'calc-formula-helper';

    const label = document.createElement('div');
    label.className = 'calc-formula-label';
    label.textContent = t('calculator.sci.formulas');

    const select = document.createElement('select');
    select.className = 'calc-formula-select';

    // Leer-Option
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t('calculator.sci.select_formula');
    select.appendChild(emptyOpt);

    FORMULAS.forEach((f, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = t('calculator.sci.formula.' + f.key);
      select.appendChild(opt);
    });

    const inputsContainer = document.createElement('div');
    inputsContainer.className = 'calc-formula-inputs';

    const resultContainer = document.createElement('div');
    resultContainer.className = 'calc-formula-result';

    select.addEventListener('change', () => {
      // Inputs leeren
      while (inputsContainer.firstChild) {
        inputsContainer.removeChild(inputsContainer.firstChild);
      }
      resultContainer.textContent = '';

      const idx = parseInt(select.value, 10);
      if (isNaN(idx)) return;

      const formula = FORMULAS[idx];
      renderFormulaInputs(formula, inputsContainer, resultContainer);
    });

    wrapper.append(label, select, inputsContainer, resultContainer);
    container.appendChild(wrapper);
  }

  /**
   * Formel-Eingabefelder und Live-Ergebnis rendern
   * @param {Object} formula
   * @param {HTMLElement} inputsEl
   * @param {HTMLElement} resultEl
   */
  function renderFormulaInputs(formula, inputsEl, resultEl) {
    const inputs = {};

    formula.fields.forEach(field => {
      const row = document.createElement('div');
      row.className = 'calc-formula-row';

      const lbl = document.createElement('label');
      lbl.textContent = t('calculator.sci.field.' + field.key);

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.className = 'calc-formula-input';
      inp.placeholder = '0';
      inp.step = 'any';
      inputs[field.key] = inp;

      inp.addEventListener('input', () => {
        recalcFormula(formula, inputs, resultEl);
      });

      row.append(lbl, inp);
      inputsEl.appendChild(row);
    });
  }

  /**
   * Formel-Ergebnis live berechnen
   * @param {Object} formula
   * @param {Object} inputs - { key: HTMLInputElement }
   * @param {HTMLElement} resultEl
   */
  function recalcFormula(formula, inputs, resultEl) {
    const vals = {};
    let allValid = true;

    for (const field of formula.fields) {
      const v = parseFloat(inputs[field.key].value);
      if (isNaN(v)) { allValid = false; break; }
      vals[field.key] = v;
    }

    if (!allValid) {
      resultEl.textContent = '';
      return;
    }

    const result = formula.calc(vals);
    if (result === null || !isFinite(result)) {
      resultEl.textContent = t('calculator.error');
      return;
    }

    resultEl.textContent = '= ' + Calculator._formatResult(result);
  }

  /**
   * Keyboard-Erweiterung für Scientific-Modus
   * @param {HTMLElement} widgetEl
   */
  function bindSciKeyboard(widgetEl) {
    _keyboardExtHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.target.contentEditable === 'true') return;

      if (e.key === 'p') {
        handleSciKey('pi');
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === '^') {
        handleSciKey('power');
        e.preventDefault();
        e.stopPropagation();
      }
    };
    widgetEl.addEventListener('keydown', _keyboardExtHandler);
  }

  // Modus registrieren
  Calculator.registerMode('scientific', {
    label: '📐',
    shortName: 'Sci',
    titleKey: 'calculator.tab.scientific',

    render(bodyEl) {
      bodyEl.style.padding = '8px';
      bodyEl.style.display = 'flex';
      bodyEl.style.flexDirection = 'column';
      bodyEl.style.flex = '1';
      bodyEl.style.overflow = 'hidden';

      // Display (gemeinsam mit Standard)
      const display = document.createElement('div');
      display.className = 'calc-display';

      const exprEl = document.createElement('div');
      exprEl.className = 'calc-expression';
      Calculator._displayExprEl = exprEl;

      const resultEl = document.createElement('div');
      resultEl.className = 'calc-result';
      resultEl.textContent = Calculator._lastResult || '0';
      Calculator._displayResultEl = resultEl;

      display.append(exprEl, resultEl);

      // Scientific-Buttons (2x3 Grid)
      const sciSection = document.createElement('div');
      renderSciButtons(sciSection);

      // Standard-Buttons (4x5 Grid)
      const stdButtons = Calculator._createButtons();

      // History
      const historyEl = Calculator._createHistoryPanel();

      // Formel-Helfer
      const formulaSection = document.createElement('div');
      renderFormulaHelper(formulaSection);

      bodyEl.append(display, sciSection, stdButtons, historyEl, formulaSection);
      Calculator._updateDisplay();

      // Keyboard erweitern
      const entry = WidgetManager._widgets.get(Calculator.WIDGET_ID);
      if (entry) bindSciKeyboard(entry.el);
    },

    destroy() {
      // Keyboard-Extension entfernen
      if (_keyboardExtHandler) {
        const entry = WidgetManager._widgets.get(Calculator.WIDGET_ID);
        if (entry) {
          entry.el.removeEventListener('keydown', _keyboardExtHandler);
        }
        _keyboardExtHandler = null;
      }
      Calculator._displayExprEl = null;
      Calculator._displayResultEl = null;
    }
  });
})();
```

- [ ] **Step 2: Script-Tag in newtab.html einfügen**

Nach Zeile 509 (`<script src="src/js/calculator.js"></script>`):

```html
  <script src="src/js/calc-scientific.js"></script>
```

- [ ] **Step 3: CSS für Scientific-Modus**

In `src/css/main.css`, nach den Tab-System Styles:

```css
/* Calculator Scientific Mode */
.calc-sci-buttons {
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 4px;
}
.calc-formula-helper {
  border-top: 1px solid var(--border);
  padding-top: 8px;
  margin-top: 4px;
}
.calc-formula-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.calc-formula-select {
  width: 100%;
  padding: 4px 6px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  font-family: 'Rajdhani', sans-serif;
  margin-bottom: 6px;
}
.calc-formula-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.calc-formula-row label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 50px;
}
.calc-formula-input {
  flex: 1;
  padding: 4px 6px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  font-family: 'Rajdhani', sans-serif;
}
.calc-formula-result {
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
  font-family: 'Rajdhani', monospace;
  text-align: right;
  min-height: 20px;
  padding: 2px 0;
}
```

- [ ] **Step 4: i18n-Keys für Scientific**

In `src/js/i18n.js`, DE-Block nach `'calculator.tab.standard'`:

```javascript
'calculator.tab.scientific':         'Wissenschaftlich',
'calculator.sci.formulas':           'Formel-Helfer',
'calculator.sci.select_formula':     'Formel wählen…',
'calculator.sci.formula.circle_area':         'Kreisfläche (π×r²)',
'calculator.sci.formula.circle_circumference':'Kreisumfang (2πr)',
'calculator.sci.formula.celsius_to_fahrenheit':'°C → °F',
'calculator.sci.formula.fahrenheit_to_celsius':'°F → °C',
'calculator.sci.formula.pythagoras':          'Pythagoras (√(a²+b²))',
'calculator.sci.formula.percentage':          'Prozentwert',
'calculator.sci.field.radius':       'Radius',
'calculator.sci.field.temp':         'Temperatur',
'calculator.sci.field.a':            'Seite a',
'calculator.sci.field.b':            'Seite b',
'calculator.sci.field.value':        'Wert',
'calculator.sci.field.percent':      'Prozent',
```

EN-Block nach `'calculator.tab.standard'`:

```javascript
'calculator.tab.scientific':         'Scientific',
'calculator.sci.formulas':           'Formula Helper',
'calculator.sci.select_formula':     'Choose formula…',
'calculator.sci.formula.circle_area':         'Circle Area (π×r²)',
'calculator.sci.formula.circle_circumference':'Circle Circumference (2πr)',
'calculator.sci.formula.celsius_to_fahrenheit':'°C → °F',
'calculator.sci.formula.fahrenheit_to_celsius':'°F → °C',
'calculator.sci.formula.pythagoras':          'Pythagoras (√(a²+b²))',
'calculator.sci.formula.percentage':          'Percentage',
'calculator.sci.field.radius':       'Radius',
'calculator.sci.field.temp':         'Temperature',
'calculator.sci.field.a':            'Side a',
'calculator.sci.field.b':            'Side b',
'calculator.sci.field.value':        'Value',
'calculator.sci.field.percent':      'Percent',
```

- [ ] **Step 5: Testen**

1. Calculator öffnen → 2 Tabs sichtbar (Std, Sci)
2. Sci-Tab klicken → 6 Scientific-Buttons + Standard-Grid + Formel-Helfer
3. √ klicken → `sqrt(` im Display, 9 eingeben, `)` eingeben, = → 3
4. π klicken → 3.14159265359 im Display
5. Formel-Dropdown "Kreisfläche" wählen → Radius-Feld, r=5 → = 78.5398...
6. `p`-Taste → Pi einfügen
7. `^`-Taste → Potenz-Operator

- [ ] **Step 6: Commit**

```bash
git add src/js/calc-scientific.js newtab.html src/css/main.css src/js/i18n.js
git commit -m "feat(calculator): Scientific-Modus mit Formel-Helfer"
```

---

### Task 4: Unit-Converter

**Files:**
- Create: `src/js/calc-converter.js`
- Modify: `newtab.html` (Script-Tag nach calc-scientific.js)
- Modify: `src/js/i18n.js` (neue Keys)
- Modify: `src/css/main.css` (Converter-spezifische Styles)

**Kontext:** 6 Kategorien (Länge, Gewicht, Temperatur, Volumen, Geschwindigkeit, Fläche) mit toBase/fromBase Pattern. Temperatur als Spezialfall. Live-Update bei Eingabe, Swap-Button, Schnellreferenz.

- [ ] **Step 1: calc-converter.js erstellen**

```javascript
/* =============================================
   HELLION NEWTAB — calc-converter.js
   Unit-Converter Modus für Calculator Widget
   ============================================= */

(function() {
  'use strict';

  // ---- UNIT DEFINITIONS ----

  const CATEGORIES = {
    length: {
      titleKey: 'calculator.conv.cat.length',
      baseUnit: 'm',
      units: {
        mm:  { toBase: v => v / 1000,       fromBase: v => v * 1000 },
        cm:  { toBase: v => v / 100,        fromBase: v => v * 100 },
        m:   { toBase: v => v,              fromBase: v => v },
        km:  { toBase: v => v * 1000,       fromBase: v => v / 1000 },
        in:  { toBase: v => v * 0.0254,     fromBase: v => v / 0.0254 },
        ft:  { toBase: v => v * 0.3048,     fromBase: v => v / 0.3048 },
        yd:  { toBase: v => v * 0.9144,     fromBase: v => v / 0.9144 },
        mi:  { toBase: v => v * 1609.344,   fromBase: v => v / 1609.344 }
      }
    },
    weight: {
      titleKey: 'calculator.conv.cat.weight',
      baseUnit: 'g',
      units: {
        mg:  { toBase: v => v / 1000,       fromBase: v => v * 1000 },
        g:   { toBase: v => v,              fromBase: v => v },
        kg:  { toBase: v => v * 1000,       fromBase: v => v / 1000 },
        t:   { toBase: v => v * 1000000,    fromBase: v => v / 1000000 },
        oz:  { toBase: v => v * 28.3495,    fromBase: v => v / 28.3495 },
        lb:  { toBase: v => v * 453.592,    fromBase: v => v / 453.592 }
      }
    },
    temperature: {
      titleKey: 'calculator.conv.cat.temperature',
      baseUnit: null, // Spezialfall
      units: { '\u00B0C': null, '\u00B0F': null, 'K': null },
      convert(value, from, to) {
        if (from === to) return value;
        const key = from + '_' + to;
        const conversions = {
          '\u00B0C_\u00B0F': v => (v * 9 / 5) + 32,
          '\u00B0C_K':  v => v + 273.15,
          '\u00B0F_\u00B0C': v => (v - 32) * 5 / 9,
          '\u00B0F_K':  v => (v - 32) * 5 / 9 + 273.15,
          'K_\u00B0C':  v => v - 273.15,
          'K_\u00B0F':  v => (v - 273.15) * 9 / 5 + 32
        };
        const fn = conversions[key];
        return fn ? fn(value) : null;
      }
    },
    volume: {
      titleKey: 'calculator.conv.cat.volume',
      baseUnit: 'ml',
      units: {
        ml:       { toBase: v => v,               fromBase: v => v },
        L:        { toBase: v => v * 1000,         fromBase: v => v / 1000 },
        'm\u00B3':{ toBase: v => v * 1000000,      fromBase: v => v / 1000000 },
        'gal(US)':{ toBase: v => v * 3785.41,      fromBase: v => v / 3785.41 },
        'gal(UK)':{ toBase: v => v * 4546.09,      fromBase: v => v / 4546.09 },
        'ft\u00B3':{ toBase: v => v * 28316.8,     fromBase: v => v / 28316.8 }
      }
    },
    speed: {
      titleKey: 'calculator.conv.cat.speed',
      baseUnit: 'm/s',
      units: {
        'm/s':  { toBase: v => v,             fromBase: v => v },
        'km/h': { toBase: v => v / 3.6,      fromBase: v => v * 3.6 },
        'mph':  { toBase: v => v * 0.44704,   fromBase: v => v / 0.44704 },
        'kn':   { toBase: v => v * 0.514444,  fromBase: v => v / 0.514444 }
      }
    },
    area: {
      titleKey: 'calculator.conv.cat.area',
      baseUnit: 'm\u00B2',
      units: {
        'mm\u00B2': { toBase: v => v / 1000000,     fromBase: v => v * 1000000 },
        'cm\u00B2': { toBase: v => v / 10000,        fromBase: v => v * 10000 },
        'm\u00B2':  { toBase: v => v,                fromBase: v => v },
        'km\u00B2': { toBase: v => v * 1000000,      fromBase: v => v / 1000000 },
        'ha':       { toBase: v => v * 10000,         fromBase: v => v / 10000 },
        'acre':     { toBase: v => v * 4046.86,       fromBase: v => v / 4046.86 },
        'ft\u00B2': { toBase: v => v * 0.092903,     fromBase: v => v / 0.092903 },
        'in\u00B2': { toBase: v => v * 0.00064516,   fromBase: v => v / 0.00064516 }
      }
    }
  };

  const CATEGORY_ORDER = ['length', 'weight', 'temperature', 'volume', 'speed', 'area'];

  // ---- STATE ----

  let _currentCategory = 'length';
  let _fromUnit = 'cm';
  let _toUnit = 'in';
  let _fromInput = null;
  let _toInput = null;
  let _refEl = null;

  // ---- CONVERSION ----

  /**
   * Wert konvertieren
   * @param {number} value
   * @param {string} from - Quelleinheit
   * @param {string} to - Zieleinheit
   * @returns {number|null}
   */
  function convert(value, from, to) {
    const cat = CATEGORIES[_currentCategory];
    if (!cat) return null;

    if (cat.convert) {
      return cat.convert(value, from, to);
    }

    const fromDef = cat.units[from];
    const toDef = cat.units[to];
    if (!fromDef || !toDef) return null;

    const base = fromDef.toBase(value);
    return toDef.fromBase(base);
  }

  /**
   * Live-Berechnung auslösen
   */
  function recalc() {
    if (!_fromInput || !_toInput) return;
    const val = parseFloat(_fromInput.value);
    if (isNaN(val)) {
      _toInput.value = '';
      updateReference();
      return;
    }
    const result = convert(val, _fromUnit, _toUnit);
    if (result === null) {
      _toInput.value = '';
    } else {
      _toInput.value = Calculator._formatResult(result);
    }
    updateReference();
  }

  /**
   * Schnellreferenz aktualisieren
   */
  function updateReference() {
    if (!_refEl) return;
    _refEl.textContent = '';

    const r1 = convert(1, _fromUnit, _toUnit);
    const r2 = convert(1, _toUnit, _fromUnit);

    if (r1 !== null) {
      const line1 = document.createElement('div');
      line1.textContent = '1 ' + _fromUnit + ' = ' + Calculator._formatResult(r1) + ' ' + _toUnit;
      _refEl.appendChild(line1);
    }
    if (r2 !== null) {
      const line2 = document.createElement('div');
      line2.textContent = '1 ' + _toUnit + ' = ' + Calculator._formatResult(r2) + ' ' + _fromUnit;
      _refEl.appendChild(line2);
    }
  }

  /**
   * Unit-Selects für aktuelle Kategorie befüllen
   * @param {HTMLSelectElement} selectEl
   * @param {string} selectedUnit
   */
  function populateUnitSelect(selectEl, selectedUnit) {
    while (selectEl.firstChild) {
      selectEl.removeChild(selectEl.firstChild);
    }
    const cat = CATEGORIES[_currentCategory];
    if (!cat) return;

    const units = Object.keys(cat.units);
    units.forEach(unit => {
      const opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      if (unit === selectedUnit) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  /**
   * Kategorie-spezifische Defaults für Units
   * @param {string} catKey
   * @returns {{ from: string, to: string }}
   */
  function getDefaultUnits(catKey) {
    const defaults = {
      length: { from: 'cm', to: 'in' },
      weight: { from: 'kg', to: 'lb' },
      temperature: { from: '\u00B0C', to: '\u00B0F' },
      volume: { from: 'L', to: 'gal(US)' },
      speed: { from: 'km/h', to: 'mph' },
      area: { from: 'm\u00B2', to: 'ft\u00B2' }
    };
    return defaults[catKey] || { from: Object.keys(CATEGORIES[catKey].units)[0], to: Object.keys(CATEGORIES[catKey].units)[1] };
  }

  /**
   * State aus Storage laden
   */
  async function loadState() {
    const data = await Store.get(Calculator.STORAGE_KEY);
    if (data && data.calculator && data.calculator.converter) {
      const s = data.calculator.converter;
      if (s.lastCategory && CATEGORIES[s.lastCategory]) _currentCategory = s.lastCategory;
      if (s.fromUnit) _fromUnit = s.fromUnit;
      if (s.toUnit) _toUnit = s.toUnit;
    }
  }

  /**
   * State in Storage speichern
   */
  async function saveState() {
    const data = await Store.get(Calculator.STORAGE_KEY) || {};
    if (!data.calculator) data.calculator = {};
    data.calculator.converter = {
      lastCategory: _currentCategory,
      fromUnit: _fromUnit,
      toUnit: _toUnit
    };
    await Store.set(Calculator.STORAGE_KEY, data);
  }

  // ---- REGISTRATION ----

  Calculator.registerMode('converter', {
    label: '⚖️',
    shortName: 'Unit',
    titleKey: 'calculator.tab.converter',

    render(bodyEl) {
      bodyEl.style.padding = '8px';
      bodyEl.style.display = 'flex';
      bodyEl.style.flexDirection = 'column';
      bodyEl.style.gap = '8px';

      loadState().then(() => {
        buildUI(bodyEl);
      });
    },

    destroy() {
      _fromInput = null;
      _toInput = null;
      _refEl = null;
      saveState();
    }
  });

  /**
   * Converter-UI aufbauen
   * @param {HTMLElement} bodyEl
   */
  function buildUI(bodyEl) {
    // Kategorie-Dropdown
    const catSelect = document.createElement('select');
    catSelect.className = 'calc-conv-select';

    CATEGORY_ORDER.forEach(catKey => {
      const opt = document.createElement('option');
      opt.value = catKey;
      opt.textContent = t(CATEGORIES[catKey].titleKey);
      if (catKey === _currentCategory) opt.selected = true;
      catSelect.appendChild(opt);
    });

    // From-Zeile
    const fromRow = document.createElement('div');
    fromRow.className = 'calc-conv-row';

    _fromInput = document.createElement('input');
    _fromInput.type = 'number';
    _fromInput.className = 'calc-conv-input';
    _fromInput.placeholder = '0';
    _fromInput.step = 'any';

    const fromSelect = document.createElement('select');
    fromSelect.className = 'calc-conv-unit';
    populateUnitSelect(fromSelect, _fromUnit);

    fromRow.append(_fromInput, fromSelect);

    // Swap-Button
    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'calc-conv-swap';
    swapBtn.textContent = '\u21C5';
    swapBtn.title = t('calculator.conv.swap');

    // To-Zeile
    const toRow = document.createElement('div');
    toRow.className = 'calc-conv-row';

    _toInput = document.createElement('input');
    _toInput.type = 'text';
    _toInput.className = 'calc-conv-input';
    _toInput.readOnly = true;
    _toInput.placeholder = '0';

    const toSelect = document.createElement('select');
    toSelect.className = 'calc-conv-unit';
    populateUnitSelect(toSelect, _toUnit);

    toRow.append(_toInput, toSelect);

    // Schnellreferenz
    _refEl = document.createElement('div');
    _refEl.className = 'calc-conv-ref';

    // Event Listeners
    _fromInput.addEventListener('input', () => recalc());

    fromSelect.addEventListener('change', () => {
      _fromUnit = fromSelect.value;
      recalc();
      saveState();
    });

    toSelect.addEventListener('change', () => {
      _toUnit = toSelect.value;
      recalc();
      saveState();
    });

    swapBtn.addEventListener('click', () => {
      const tmpUnit = _fromUnit;
      _fromUnit = _toUnit;
      _toUnit = tmpUnit;
      populateUnitSelect(fromSelect, _fromUnit);
      populateUnitSelect(toSelect, _toUnit);
      // Swap-Wert übernehmen
      const currentVal = _toInput.value;
      if (currentVal) {
        _fromInput.value = currentVal;
      }
      recalc();
      saveState();
    });

    catSelect.addEventListener('change', () => {
      _currentCategory = catSelect.value;
      const defaults = getDefaultUnits(_currentCategory);
      _fromUnit = defaults.from;
      _toUnit = defaults.to;
      populateUnitSelect(fromSelect, _fromUnit);
      populateUnitSelect(toSelect, _toUnit);
      _fromInput.value = '';
      _toInput.value = '';
      updateReference();
      saveState();
    });

    bodyEl.append(catSelect, fromRow, swapBtn, toRow, _refEl);

    // Initiale Referenz anzeigen
    updateReference();
  }
})();
```

- [ ] **Step 2: Script-Tag in newtab.html einfügen**

Nach dem `calc-scientific.js` Script-Tag:

```html
  <script src="src/js/calc-converter.js"></script>
```

- [ ] **Step 3: CSS für Converter**

In `src/css/main.css`, nach den Scientific-Styles:

```css
/* Calculator Converter Mode */
.calc-conv-select {
  width: 100%;
  padding: 6px 8px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Rajdhani', sans-serif;
}
.calc-conv-row {
  display: flex;
  gap: 6px;
}
.calc-conv-input {
  flex: 1;
  padding: 8px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 16px;
  font-family: 'Rajdhani', monospace;
}
.calc-conv-input:read-only {
  color: var(--accent);
  font-weight: 600;
}
.calc-conv-unit {
  width: 80px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 12px;
  font-family: 'Rajdhani', sans-serif;
}
.calc-conv-swap {
  align-self: center;
  width: 36px;
  height: 28px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--accent);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
}
.calc-conv-swap:hover {
  background: var(--accent-dim);
}
.calc-conv-ref {
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 0;
  border-top: 1px solid var(--border);
}
```

- [ ] **Step 4: i18n-Keys für Converter**

DE-Block:

```javascript
'calculator.tab.converter':          'Umrechner',
'calculator.conv.swap':              'Einheiten tauschen',
'calculator.conv.cat.length':        'Länge',
'calculator.conv.cat.weight':        'Gewicht',
'calculator.conv.cat.temperature':   'Temperatur',
'calculator.conv.cat.volume':        'Volumen',
'calculator.conv.cat.speed':         'Geschwindigkeit',
'calculator.conv.cat.area':          'Fläche',
```

EN-Block:

```javascript
'calculator.tab.converter':          'Converter',
'calculator.conv.swap':              'Swap units',
'calculator.conv.cat.length':        'Length',
'calculator.conv.cat.weight':        'Weight',
'calculator.conv.cat.temperature':   'Temperature',
'calculator.conv.cat.volume':        'Volume',
'calculator.conv.cat.speed':         'Speed',
'calculator.conv.cat.area':          'Area',
```

- [ ] **Step 5: Testen**

1. Calculator öffnen → 3 Tabs sichtbar (Std, Sci, Unit)
2. Unit-Tab klicken → Kategorie-Dropdown, Eingabe-Feld, Ergebnis
3. 100 cm eingeben → 39.3701 in
4. Swap-Button → cm und in tauschen, Wert übernehmen
5. Kategorie zu Temperatur wechseln → °C und °F als Units
6. 100 °C → 212 °F
7. 0 °F → -17.7778 °C

- [ ] **Step 6: Commit**

```bash
git add src/js/calc-converter.js newtab.html src/css/main.css src/js/i18n.js
git commit -m "feat(calculator): Unit-Converter mit 6 Kategorien"
```

---

### Task 5: Satisfactory Calculator

**Files:**
- Create: `src/js/calc-satisfactory.js`
- Modify: `newtab.html` (Script-Tag nach calc-converter.js)
- Modify: `src/js/i18n.js` (neue Keys)
- Modify: `src/css/main.css` (Game-Calculator shared Styles)

**Kontext:** 3 Sub-Modi: Items/Min, Overclock Power, Machines. Power-Exponent: 1.321928 (Update 8 Wert). Shared CSS-Klassen `.calc-game-*` werden hier definiert und von Factorio/Stationeers wiederverwendet.

- [ ] **Step 1: calc-satisfactory.js erstellen**

```javascript
/* =============================================
   HELLION NEWTAB — calc-satisfactory.js
   Satisfactory Calculator Modus
   ============================================= */

(function() {
  'use strict';

  const POWER_EXPONENT = 1.321928;

  const SUB_MODES = ['itemsPerMin', 'power', 'machines'];
  let _activeSubMode = 'itemsPerMin';

  // ---- SHARED HELPERS ----

  /**
   * Sub-Tab-Leiste erstellen
   * @param {HTMLElement} container
   * @param {Array<string>} modes
   * @param {string} activeMode
   * @param {string} i18nPrefix
   * @param {Function} onSwitch
   */
  function createSubTabs(container, modes, activeMode, i18nPrefix, onSwitch) {
    const bar = document.createElement('div');
    bar.className = 'calc-game-subtabs';

    modes.forEach(mode => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calc-game-subtab' + (mode === activeMode ? ' active' : '');
      btn.textContent = t(i18nPrefix + mode);
      btn.dataset.mode = mode;
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.calc-game-subtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSwitch(mode);
      });
      bar.appendChild(btn);
    });

    container.appendChild(bar);
  }

  /**
   * Eingabefeld mit Label erstellen
   * @param {string} labelKey - i18n-Key
   * @param {number} defaultVal
   * @param {Object} opts - { step, min, max }
   * @returns {{ row: HTMLElement, input: HTMLInputElement }}
   */
  function createField(labelKey, defaultVal, opts) {
    opts = opts || {};
    const row = document.createElement('div');
    row.className = 'calc-game-field';

    const label = document.createElement('label');
    label.textContent = t(labelKey);

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'calc-game-input';
    input.value = defaultVal;
    if (opts.step) input.step = opts.step;
    if (opts.min !== undefined) input.min = opts.min;
    if (opts.max !== undefined) input.max = opts.max;

    row.append(label, input);
    return { row, input };
  }

  /**
   * Ergebnis-Zeile erstellen
   * @param {string} labelKey
   * @returns {{ row: HTMLElement, value: HTMLElement }}
   */
  function createOutput(labelKey) {
    const row = document.createElement('div');
    row.className = 'calc-game-output';

    const label = document.createElement('span');
    label.textContent = t(labelKey);

    const value = document.createElement('span');
    value.className = 'calc-game-value';

    row.append(label, value);
    return { row, value };
  }

  // ---- SUB-MODE RENDERERS ----

  function renderItemsPerMin(container) {
    const itemsField = createField('calculator.sat.items_per_craft', 1, { step: 1, min: 1 });
    const timeField = createField('calculator.sat.craft_time', 4, { step: 0.1, min: 0.1 });
    const clockField = createField('calculator.sat.clock_speed', 100, { step: 1, min: 1, max: 250 });

    const output = createOutput('calculator.sat.output_per_min');

    function calc() {
      const items = parseFloat(itemsField.input.value) || 0;
      const time = parseFloat(timeField.input.value) || 1;
      const clock = parseFloat(clockField.input.value) || 100;
      const result = (items * 60) / time * (clock / 100);
      output.value.textContent = Calculator._formatResult(result) + ' items/min';
    }

    [itemsField, timeField, clockField].forEach(f => {
      f.input.addEventListener('input', calc);
    });

    container.append(itemsField.row, timeField.row, clockField.row, output.row);
    calc();
  }

  function renderPower(container) {
    const basePowerField = createField('calculator.sat.base_power', 30, { step: 1, min: 0.1 });
    const clockField = createField('calculator.sat.clock_speed', 100, { step: 1, min: 1, max: 250 });

    const powerOutput = createOutput('calculator.sat.power_usage');
    const effOutput = createOutput('calculator.sat.efficiency');

    function calc() {
      const basePower = parseFloat(basePowerField.input.value) || 0;
      const clock = parseFloat(clockField.input.value) || 100;
      const ratio = clock / 100;
      const power = basePower * Math.pow(ratio, POWER_EXPONENT);
      const effPerItem = Math.pow(ratio, POWER_EXPONENT - 1);

      powerOutput.value.textContent = Calculator._formatResult(power) + ' MW';

      if (clock > 100) {
        const overhead = (effPerItem - 1) * 100;
        effOutput.value.textContent = '+' + Calculator._formatResult(overhead) + '% ' + t('calculator.sat.per_item');
        effOutput.row.style.display = '';
      } else {
        effOutput.row.style.display = 'none';
      }
    }

    [basePowerField, clockField].forEach(f => {
      f.input.addEventListener('input', calc);
    });

    container.append(basePowerField.row, clockField.row, powerOutput.row, effOutput.row);
    calc();
  }

  function renderMachines(container) {
    const targetField = createField('calculator.sat.target_output', 60, { step: 1, min: 1 });
    const itemsField = createField('calculator.sat.items_per_craft', 1, { step: 1, min: 1 });
    const timeField = createField('calculator.sat.craft_time', 4, { step: 0.1, min: 0.1 });
    const clockField = createField('calculator.sat.clock_speed', 100, { step: 1, min: 1, max: 250 });
    const basePowerField = createField('calculator.sat.base_power', 30, { step: 1, min: 0.1 });

    const machinesOutput = createOutput('calculator.sat.machines_needed');
    const totalPowerOutput = createOutput('calculator.sat.total_power');

    function calc() {
      const target = parseFloat(targetField.input.value) || 0;
      const items = parseFloat(itemsField.input.value) || 1;
      const time = parseFloat(timeField.input.value) || 1;
      const clock = parseFloat(clockField.input.value) || 100;
      const basePower = parseFloat(basePowerField.input.value) || 0;

      const ratio = clock / 100;
      const itemsPerMin = (items * 60) / time * ratio;
      const machines = itemsPerMin > 0 ? Math.ceil(target / itemsPerMin) : 0;
      const totalPower = machines * basePower * Math.pow(ratio, POWER_EXPONENT);

      machinesOutput.value.textContent = machines;
      totalPowerOutput.value.textContent = Calculator._formatResult(totalPower) + ' MW';
    }

    [targetField, itemsField, timeField, clockField, basePowerField].forEach(f => {
      f.input.addEventListener('input', calc);
    });

    container.append(targetField.row, itemsField.row, timeField.row, clockField.row, basePowerField.row, machinesOutput.row, totalPowerOutput.row);
    calc();
  }

  // ---- STATE ----

  async function loadState() {
    const data = await Store.get(Calculator.STORAGE_KEY);
    if (data && data.calculator && data.calculator.satisfactory) {
      const s = data.calculator.satisfactory;
      if (s.lastSubMode && SUB_MODES.includes(s.lastSubMode)) _activeSubMode = s.lastSubMode;
    }
  }

  async function saveState() {
    const data = await Store.get(Calculator.STORAGE_KEY) || {};
    if (!data.calculator) data.calculator = {};
    data.calculator.satisfactory = { lastSubMode: _activeSubMode };
    await Store.set(Calculator.STORAGE_KEY, data);
  }

  // ---- RENDER ----

  function renderSubMode(container) {
    container.textContent = '';
    switch (_activeSubMode) {
      case 'itemsPerMin': renderItemsPerMin(container); break;
      case 'power':       renderPower(container); break;
      case 'machines':    renderMachines(container); break;
    }
  }

  // ---- REGISTRATION ----

  Calculator.registerMode('satisfactory', {
    label: '⚙️',
    shortName: 'SAT',
    titleKey: 'calculator.tab.satisfactory',

    render(bodyEl) {
      bodyEl.style.padding = '8px';
      bodyEl.style.display = 'flex';
      bodyEl.style.flexDirection = 'column';
      bodyEl.style.gap = '8px';

      loadState().then(() => {
        const subContent = document.createElement('div');
        subContent.className = 'calc-game-content';

        createSubTabs(bodyEl, SUB_MODES, _activeSubMode, 'calculator.sat.tab.', (mode) => {
          _activeSubMode = mode;
          renderSubMode(subContent);
          saveState();
        });

        bodyEl.appendChild(subContent);
        renderSubMode(subContent);
      });
    },

    destroy() {
      saveState();
    }
  });
})();
```

- [ ] **Step 2: Script-Tag in newtab.html**

Nach dem `calc-converter.js` Script-Tag:

```html
  <script src="src/js/calc-satisfactory.js"></script>
```

- [ ] **Step 3: Shared Game-Calculator CSS**

In `src/css/main.css`, nach den Converter-Styles:

```css
/* Calculator Game Modes (shared) */
.calc-game-subtabs {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.calc-game-subtab {
  flex: 1;
  padding: 5px 4px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 10px;
  font-family: 'Rajdhani', sans-serif;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.15s;
}
.calc-game-subtab:hover {
  color: var(--text-secondary);
}
.calc-game-subtab.active {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}
.calc-game-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.calc-game-field label {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 90px;
  flex-shrink: 0;
}
.calc-game-input {
  flex: 1;
  padding: 5px 8px;
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  font-family: 'Rajdhani', monospace;
}
.calc-game-output {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-top: 4px;
}
.calc-game-output span:first-child {
  font-size: 11px;
  color: var(--text-muted);
}
.calc-game-value {
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
  font-family: 'Rajdhani', monospace;
}
.calc-game-warning {
  font-size: 10px;
  color: var(--danger);
  padding: 2px 0;
}
.calc-game-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

- [ ] **Step 4: i18n-Keys für Satisfactory**

DE-Block:

```javascript
'calculator.tab.satisfactory':       'Satisfactory',
'calculator.sat.tab.itemsPerMin':    'Items/Min',
'calculator.sat.tab.power':          'Strom',
'calculator.sat.tab.machines':       'Maschinen',
'calculator.sat.items_per_craft':    'Items/Craft',
'calculator.sat.craft_time':         'Craftzeit (s)',
'calculator.sat.clock_speed':        'Taktrate (%)',
'calculator.sat.base_power':         'Grundleistung (MW)',
'calculator.sat.target_output':      'Ziel Output/Min',
'calculator.sat.output_per_min':     'Output',
'calculator.sat.power_usage':        'Stromverbrauch',
'calculator.sat.efficiency':         'Effizienz',
'calculator.sat.per_item':           'pro Item',
'calculator.sat.machines_needed':    'Maschinen benötigt',
'calculator.sat.total_power':        'Gesamtleistung',
```

EN-Block:

```javascript
'calculator.tab.satisfactory':       'Satisfactory',
'calculator.sat.tab.itemsPerMin':    'Items/Min',
'calculator.sat.tab.power':          'Power',
'calculator.sat.tab.machines':       'Machines',
'calculator.sat.items_per_craft':    'Items/Craft',
'calculator.sat.craft_time':         'Craft Time (s)',
'calculator.sat.clock_speed':        'Clock Speed (%)',
'calculator.sat.base_power':         'Base Power (MW)',
'calculator.sat.target_output':      'Target Output/Min',
'calculator.sat.output_per_min':     'Output',
'calculator.sat.power_usage':        'Power Usage',
'calculator.sat.efficiency':         'Efficiency',
'calculator.sat.per_item':           'per item',
'calculator.sat.machines_needed':    'Machines needed',
'calculator.sat.total_power':        'Total Power',
```

- [ ] **Step 5: Testen**

1. SAT-Tab klicken → 3 Sub-Tabs (Items/Min, Strom, Maschinen)
2. Items/Min: 1 Item, 4s Craft, 100% → 15 items/min
3. Power: 30 MW Base, 250% Clock → ~115 MW (wegen Exponent 1.321928)
4. Machines: 60 Target, 1 Item, 4s, 100%, 30 MW → 4 Maschinen, 120 MW

- [ ] **Step 6: Commit**

```bash
git add src/js/calc-satisfactory.js newtab.html src/css/main.css src/js/i18n.js
git commit -m "feat(calculator): Satisfactory Calculator mit Overclock-Power"
```

---

### Task 6: Factorio Calculator

**Files:**
- Create: `src/js/calc-factorio.js`
- Modify: `newtab.html` (Script-Tag nach calc-satisfactory.js)
- Modify: `src/js/i18n.js` (neue Keys)

**Kontext:** 3 Sub-Modi: Ratio, Belt, Machines. Assembler-Speeds: Asm1=0.5, Asm2=0.75, Asm3=1.25. Belt-Throughput: Yellow=15/s, Red=30/s, Blue=45/s. Nutzt die shared `.calc-game-*` CSS-Klassen aus Task 5.

- [ ] **Step 1: calc-factorio.js erstellen**

```javascript
/* =============================================
   HELLION NEWTAB — calc-factorio.js
   Factorio Calculator Modus
   ============================================= */

(function() {
  'use strict';

  const ASSEMBLERS = [
    { key: 'asm1', speed: 0.5 },
    { key: 'asm2', speed: 0.75 },
    { key: 'asm3', speed: 1.25 }
  ];

  const BELTS = [
    { key: 'yellow', throughput: 15, perSide: 7.5 },
    { key: 'red',    throughput: 30, perSide: 15 },
    { key: 'blue',   throughput: 45, perSide: 22.5 }
  ];

  const SUB_MODES = ['ratio', 'belt', 'machines'];
  let _activeSubMode = 'ratio';

  /**
   * Assembler-Dropdown erstellen
   * @param {string} selectedKey
   * @returns {{ row: HTMLElement, select: HTMLSelectElement }}
   */
  function createAssemblerSelect(selectedKey) {
    const row = document.createElement('div');
    row.className = 'calc-game-field';

    const label = document.createElement('label');
    label.textContent = t('calculator.fac.assembler');

    const select = document.createElement('select');
    select.className = 'calc-game-input';

    ASSEMBLERS.forEach(asm => {
      const opt = document.createElement('option');
      opt.value = asm.key;
      opt.textContent = t('calculator.fac.asm.' + asm.key) + ' (' + asm.speed + 'x)';
      if (asm.key === selectedKey) opt.selected = true;
      select.appendChild(opt);
    });

    row.append(label, select);
    return { row, select };
  }

  /**
   * Belt-Dropdown erstellen
   * @param {string} selectedKey
   * @returns {{ row: HTMLElement, select: HTMLSelectElement }}
   */
  function createBeltSelect(selectedKey) {
    const row = document.createElement('div');
    row.className = 'calc-game-field';

    const label = document.createElement('label');
    label.textContent = t('calculator.fac.belt');

    const select = document.createElement('select');
    select.className = 'calc-game-input';

    BELTS.forEach(belt => {
      const opt = document.createElement('option');
      opt.value = belt.key;
      opt.textContent = t('calculator.fac.belt.' + belt.key) + ' (' + belt.throughput + '/s)';
      if (belt.key === selectedKey) opt.selected = true;
      select.appendChild(opt);
    });

    row.append(label, select);
    return { row, select };
  }

  function getAssemblerSpeed(key) {
    const asm = ASSEMBLERS.find(a => a.key === key);
    return asm ? asm.speed : 1;
  }

  function getBelt(key) {
    return BELTS.find(b => b.key === key) || BELTS[0];
  }

  /**
   * Findet den kleinsten Belt der den Throughput schafft
   * @param {number} throughput
   * @returns {Object|null}
   */
  function findSmallestBelt(throughput) {
    for (const belt of BELTS) {
      if (belt.throughput >= throughput) return belt;
    }
    return null;
  }

  // ---- Field/Output helpers (reuse pattern from Satisfactory) ----

  function createField(labelKey, defaultVal, opts) {
    opts = opts || {};
    const row = document.createElement('div');
    row.className = 'calc-game-field';
    const label = document.createElement('label');
    label.textContent = t(labelKey);
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'calc-game-input';
    input.value = defaultVal;
    if (opts.step) input.step = opts.step;
    if (opts.min !== undefined) input.min = opts.min;
    row.append(label, input);
    return { row, input };
  }

  function createOutput(labelKey) {
    const row = document.createElement('div');
    row.className = 'calc-game-output';
    const label = document.createElement('span');
    label.textContent = t(labelKey);
    const value = document.createElement('span');
    value.className = 'calc-game-value';
    row.append(label, value);
    return { row, value };
  }

  // ---- SUB-MODE RENDERERS ----

  function renderRatio(container) {
    const asmSelect = createAssemblerSelect('asm3');
    const outputField = createField('calculator.fac.recipe_output', 1, { step: 1, min: 1 });
    const timeField = createField('calculator.fac.recipe_time', 1, { step: 0.1, min: 0.1 });

    const perSecOutput = createOutput('calculator.fac.items_per_sec');
    const perMinOutput = createOutput('calculator.fac.items_per_min');

    function calc() {
      const speed = getAssemblerSpeed(asmSelect.select.value);
      const output = parseFloat(outputField.input.value) || 0;
      const time = parseFloat(timeField.input.value) || 1;
      const perSec = output * speed / time;
      const perMin = perSec * 60;
      perSecOutput.value.textContent = Calculator._formatResult(perSec) + ' /s';
      perMinOutput.value.textContent = Calculator._formatResult(perMin) + ' /min';
    }

    [outputField, timeField].forEach(f => f.input.addEventListener('input', calc));
    asmSelect.select.addEventListener('change', calc);

    container.append(asmSelect.row, outputField.row, timeField.row, perSecOutput.row, perMinOutput.row);
    calc();
  }

  function renderBelt(container) {
    const beltSelect = createBeltSelect('yellow');
    const consumeField = createField('calculator.fac.consume_per_sec', 1, { step: 0.1, min: 0.1 });

    const machinesOutput = createOutput('calculator.fac.machines_per_belt');
    const utilOutput = createOutput('calculator.fac.belt_utilization');

    function calc() {
      const belt = getBelt(beltSelect.select.value);
      const consume = parseFloat(consumeField.input.value) || 1;
      const machines = Math.floor(belt.throughput / consume);
      const util = (consume * machines) / belt.throughput * 100;
      machinesOutput.value.textContent = machines;
      utilOutput.value.textContent = Calculator._formatResult(util) + '%';
    }

    consumeField.input.addEventListener('input', calc);
    beltSelect.select.addEventListener('change', calc);

    container.append(beltSelect.row, consumeField.row, machinesOutput.row, utilOutput.row);
    calc();
  }

  function renderMachines(container) {
    const asmSelect = createAssemblerSelect('asm3');
    const targetField = createField('calculator.fac.target_output_sec', 10, { step: 0.1, min: 0.1 });
    const outputField = createField('calculator.fac.recipe_output', 1, { step: 1, min: 1 });
    const timeField = createField('calculator.fac.recipe_time', 1, { step: 0.1, min: 0.1 });

    const machinesOutput = createOutput('calculator.fac.machines_needed');
    const beltOutput = createOutput('calculator.fac.belt_needed');

    function calc() {
      const speed = getAssemblerSpeed(asmSelect.select.value);
      const target = parseFloat(targetField.input.value) || 0;
      const output = parseFloat(outputField.input.value) || 1;
      const time = parseFloat(timeField.input.value) || 1;

      const perMachine = output * speed / time;
      const machines = perMachine > 0 ? Math.ceil(target / perMachine) : 0;
      const totalThroughput = machines * perMachine;
      const belt = findSmallestBelt(totalThroughput);

      machinesOutput.value.textContent = machines;
      if (belt) {
        const util = (totalThroughput / belt.throughput) * 100;
        beltOutput.value.textContent = t('calculator.fac.belt.' + belt.key) + ' (' + Calculator._formatResult(util) + '%)';
      } else {
        beltOutput.value.textContent = t('calculator.fac.exceeds_belt');
      }
    }

    [targetField, outputField, timeField].forEach(f => f.input.addEventListener('input', calc));
    asmSelect.select.addEventListener('change', calc);

    container.append(asmSelect.row, targetField.row, outputField.row, timeField.row, machinesOutput.row, beltOutput.row);
    calc();
  }

  // ---- STATE ----

  async function loadState() {
    const data = await Store.get(Calculator.STORAGE_KEY);
    if (data && data.calculator && data.calculator.factorio) {
      const s = data.calculator.factorio;
      if (s.lastSubMode && SUB_MODES.includes(s.lastSubMode)) _activeSubMode = s.lastSubMode;
    }
  }

  async function saveState() {
    const data = await Store.get(Calculator.STORAGE_KEY) || {};
    if (!data.calculator) data.calculator = {};
    data.calculator.factorio = { lastSubMode: _activeSubMode };
    await Store.set(Calculator.STORAGE_KEY, data);
  }

  function renderSubMode(container) {
    container.textContent = '';
    switch (_activeSubMode) {
      case 'ratio':    renderRatio(container); break;
      case 'belt':     renderBelt(container); break;
      case 'machines': renderMachines(container); break;
    }
  }

  // ---- REGISTRATION ----

  Calculator.registerMode('factorio', {
    label: '🏭',
    shortName: 'FAC',
    titleKey: 'calculator.tab.factorio',

    render(bodyEl) {
      bodyEl.style.padding = '8px';
      bodyEl.style.display = 'flex';
      bodyEl.style.flexDirection = 'column';
      bodyEl.style.gap = '8px';

      loadState().then(() => {
        const subContent = document.createElement('div');
        subContent.className = 'calc-game-content';

        // Sub-Tab helper aus Satisfactory ist nicht verfügbar (IIFE-Scope),
        // daher lokale Implementierung
        const bar = document.createElement('div');
        bar.className = 'calc-game-subtabs';

        SUB_MODES.forEach(mode => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'calc-game-subtab' + (mode === _activeSubMode ? ' active' : '');
          btn.textContent = t('calculator.fac.tab.' + mode);
          btn.dataset.mode = mode;
          btn.addEventListener('click', () => {
            bar.querySelectorAll('.calc-game-subtab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _activeSubMode = mode;
            renderSubMode(subContent);
            saveState();
          });
          bar.appendChild(btn);
        });

        bodyEl.append(bar, subContent);
        renderSubMode(subContent);
      });
    },

    destroy() {
      saveState();
    }
  });
})();
```

- [ ] **Step 2: Script-Tag in newtab.html**

Nach dem `calc-satisfactory.js` Script-Tag:

```html
  <script src="src/js/calc-factorio.js"></script>
```

- [ ] **Step 3: i18n-Keys für Factorio**

DE-Block:

```javascript
'calculator.tab.factorio':           'Factorio',
'calculator.fac.tab.ratio':          'Ratio',
'calculator.fac.tab.belt':           'Belt',
'calculator.fac.tab.machines':       'Maschinen',
'calculator.fac.assembler':          'Assembler',
'calculator.fac.asm.asm1':           'Assembler 1',
'calculator.fac.asm.asm2':           'Assembler 2',
'calculator.fac.asm.asm3':           'Assembler 3',
'calculator.fac.belt':               'Belt-Typ',
'calculator.fac.belt.yellow':        'Gelb',
'calculator.fac.belt.red':           'Rot',
'calculator.fac.belt.blue':          'Blau',
'calculator.fac.recipe_output':      'Rezept-Output',
'calculator.fac.recipe_time':        'Rezeptzeit (s)',
'calculator.fac.consume_per_sec':    'Verbrauch/s',
'calculator.fac.target_output_sec':  'Ziel Output/s',
'calculator.fac.items_per_sec':      'Items/s',
'calculator.fac.items_per_min':      'Items/min',
'calculator.fac.machines_per_belt':  'Maschinen/Belt',
'calculator.fac.belt_utilization':   'Belt-Auslastung',
'calculator.fac.machines_needed':    'Maschinen benötigt',
'calculator.fac.belt_needed':        'Belt benötigt',
'calculator.fac.exceeds_belt':       'Übersteigt max. Belt',
```

EN-Block:

```javascript
'calculator.tab.factorio':           'Factorio',
'calculator.fac.tab.ratio':          'Ratio',
'calculator.fac.tab.belt':           'Belt',
'calculator.fac.tab.machines':       'Machines',
'calculator.fac.assembler':          'Assembler',
'calculator.fac.asm.asm1':           'Assembler 1',
'calculator.fac.asm.asm2':           'Assembler 2',
'calculator.fac.asm.asm3':           'Assembler 3',
'calculator.fac.belt':               'Belt Type',
'calculator.fac.belt.yellow':        'Yellow',
'calculator.fac.belt.red':           'Red',
'calculator.fac.belt.blue':          'Blue',
'calculator.fac.recipe_output':      'Recipe Output',
'calculator.fac.recipe_time':        'Recipe Time (s)',
'calculator.fac.consume_per_sec':    'Consume/s',
'calculator.fac.target_output_sec':  'Target Output/s',
'calculator.fac.items_per_sec':      'Items/s',
'calculator.fac.items_per_min':      'Items/min',
'calculator.fac.machines_per_belt':  'Machines/Belt',
'calculator.fac.belt_utilization':   'Belt Utilization',
'calculator.fac.machines_needed':    'Machines needed',
'calculator.fac.belt_needed':        'Belt needed',
'calculator.fac.exceeds_belt':       'Exceeds max belt',
```

- [ ] **Step 4: Testen**

1. FAC-Tab klicken → 3 Sub-Tabs (Ratio, Belt, Maschinen)
2. Ratio: Asm3 (1.25x), 1 Output, 1s → 1.25/s, 75/min
3. Belt: Yellow (15/s), 1/s consume → 15 Machines, 100%
4. Machines: Asm3, 10/s target, 1 output, 1s → 8 machines, Blue (22.2%)

- [ ] **Step 5: Commit**

```bash
git add src/js/calc-factorio.js newtab.html src/js/i18n.js
git commit -m "feat(calculator): Factorio Calculator mit Assembler-Ratios"
```

---

### Task 7: Stationeers Calculator

**Files:**
- Create: `src/js/calc-stationeers.js`
- Modify: `newtab.html` (Script-Tag nach calc-factorio.js)
- Modify: `src/js/i18n.js` (neue Keys)
- Modify: `src/css/main.css` (Stationeers-spezifische Styles)

**Kontext:** 4 Sub-Modi: Gas (PV=nRT), Furnace, Solar/Battery, Atmosphere. R=8314.46261815324, Combustion Energy=563452 J/mol. Komplexester Modus. Nutzt shared `.calc-game-*` CSS.

- [ ] **Step 1: calc-stationeers.js erstellen**

```javascript
/* =============================================
   HELLION NEWTAB — calc-stationeers.js
   Stationeers Calculator Modus
   ============================================= */

(function() {
  'use strict';

  // ---- CONSTANTS ----
  const R = 8314.46261815324;          // L·Pa / (mol·K)
  const COMBUSTION_ENERGY = 563452;    // J/mol bei 95% Effizienz
  const HEAT_CAP_PURE_FUEL = 61.9;    // J/(mol·K) für 1:2 O₂:H₂
  const HEAT_CAP_DELTA = 172.615;     // 0.95 × (243.6 − 61.9)
  const BATTERY_CAPACITY = 50000;     // Ws (Station Battery)

  const HEAT_CAPS = [
    { gas: 'O\u2082',        cp: 21.1 },
    { gas: 'H\u2082',        cp: 20.4 },
    { gas: 'CO\u2082',       cp: 28.2 },
    { gas: 'N\u2082',        cp: 20.6 },
    { gas: 'H\u2082O',       cp: 72.0 },
    { gas: 'N\u2082O',       cp: 23.0 },
    { gas: 'Pollutant', cp: 24.8 }
  ];

  const GAS_VARS = ['P', 'V', 'n', 'T'];
  const SUB_MODES = ['gas', 'furnace', 'solar', 'atmo'];
  let _activeSubMode = 'gas';

  // ---- Field/Output helpers ----

  function createField(labelKey, defaultVal, opts) {
    opts = opts || {};
    const row = document.createElement('div');
    row.className = 'calc-game-field';
    const label = document.createElement('label');
    label.textContent = t(labelKey);
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'calc-game-input';
    input.value = defaultVal;
    if (opts.step) input.step = opts.step;
    if (opts.min !== undefined) input.min = opts.min;
    if (opts.max !== undefined) input.max = opts.max;
    if (opts.disabled) input.disabled = true;
    row.append(label, input);
    return { row, input };
  }

  function createOutput(labelKey) {
    const row = document.createElement('div');
    row.className = 'calc-game-output';
    const label = document.createElement('span');
    label.textContent = t(labelKey);
    const value = document.createElement('span');
    value.className = 'calc-game-value';
    row.append(label, value);
    return { row, value };
  }

  // ---- GAS (PV=nRT) ----

  function renderGas(container) {
    // Solve-for Dropdown
    const solveRow = document.createElement('div');
    solveRow.className = 'calc-game-field';
    const solveLabel = document.createElement('label');
    solveLabel.textContent = t('calculator.sta.solve_for');
    const solveSelect = document.createElement('select');
    solveSelect.className = 'calc-game-input';

    GAS_VARS.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = t('calculator.sta.var.' + v);
      solveSelect.appendChild(opt);
    });

    solveRow.append(solveLabel, solveSelect);
    container.appendChild(solveRow);

    // Eingabefelder für alle 4 Variablen
    const fields = {};
    const units = { P: 'kPa', V: 'L', n: 'mol', T: 'K' };
    const defaults = { P: 101.325, V: 1000, n: 1, T: 293.15 };

    GAS_VARS.forEach(v => {
      const f = createField(
        'calculator.sta.var.' + v + '_label',
        defaults[v],
        { step: 'any' }
      );
      fields[v] = f;
      container.appendChild(f.row);
    });

    // Hilfstext für Temperatur
    const tempHelper = document.createElement('div');
    tempHelper.className = 'calc-game-hint';
    container.appendChild(tempHelper);

    const resultOutput = createOutput('calculator.sta.result');
    container.appendChild(resultOutput.row);

    function calc() {
      const solveFor = solveSelect.value;

      // Felder aktivieren/deaktivieren
      GAS_VARS.forEach(v => {
        fields[v].input.disabled = (v === solveFor);
        fields[v].input.style.opacity = (v === solveFor) ? '0.5' : '1';
      });

      const P_kPa = parseFloat(fields.P.input.value) || 0;
      const P = P_kPa * 1000; // kPa → Pa
      const V = parseFloat(fields.V.input.value) || 0;
      const n = parseFloat(fields.n.input.value) || 0;
      const T = parseFloat(fields.T.input.value) || 0;

      let result = null;
      let unit = '';

      switch (solveFor) {
        case 'P':
          if (V > 0) { result = (n * R * T) / V; result /= 1000; unit = 'kPa'; }
          break;
        case 'V':
          if (P > 0) { result = (n * R * T) / P; unit = 'L'; }
          break;
        case 'n':
          if (R * T > 0) { result = (P * V) / (R * T); unit = 'mol'; }
          break;
        case 'T':
          if (n * R > 0) { result = (P * V) / (n * R); unit = 'K'; }
          break;
      }

      if (result !== null && isFinite(result)) {
        fields[solveFor].input.value = Calculator._formatResult(result);
        resultOutput.value.textContent = Calculator._formatResult(result) + ' ' + unit;
      } else {
        resultOutput.value.textContent = '-';
      }

      // Temperatur-Hilfstext
      const tempVal = parseFloat(fields.T.input.value) || 0;
      tempHelper.textContent = Calculator._formatResult(tempVal - 273.15) + ' \u00B0C';
    }

    // Events
    GAS_VARS.forEach(v => {
      fields[v].input.addEventListener('input', calc);
    });
    solveSelect.addEventListener('change', calc);
    calc();
  }

  // ---- FURNACE ----

  function renderFurnace(container) {
    const fuelField = createField('calculator.sta.fuel_ratio', 0.5, { step: 0.01, min: 0, max: 1 });
    const tempField = createField('calculator.sta.start_temp', 293.15, { step: 1, min: 0 });
    const pressField = createField('calculator.sta.start_pressure', 101.325, { step: 0.1, min: 0 });

    const tempOutput = createOutput('calculator.sta.temp_after');
    const pressOutput = createOutput('calculator.sta.pressure_after');
    const warningEl = document.createElement('div');
    warningEl.className = 'calc-game-warning';

    function calc() {
      const fuel = parseFloat(fuelField.input.value) || 0;
      const T_vor = parseFloat(tempField.input.value) || 293.15;
      const P_vor = parseFloat(pressField.input.value) || 101.325;

      warningEl.textContent = '';
      if (fuel < 0.05) {
        warningEl.textContent = t('calculator.sta.warn_low_fuel');
      }
      if (P_vor < 10) {
        warningEl.textContent += (warningEl.textContent ? ' ' : '') + t('calculator.sta.warn_low_pressure');
      }

      const specificHeat = HEAT_CAP_PURE_FUEL;
      const T_nach = (T_vor * specificHeat + fuel * COMBUSTION_ENERGY) / (specificHeat + fuel * HEAT_CAP_DELTA);
      const P_nach = P_vor * T_nach * (1 + 5.7 * fuel) / T_vor;

      tempOutput.value.textContent = Calculator._formatResult(T_nach) + ' K (' + Calculator._formatResult(T_nach - 273.15) + ' \u00B0C)';
      pressOutput.value.textContent = Calculator._formatResult(P_nach) + ' kPa';
    }

    [fuelField, tempField, pressField].forEach(f => f.input.addEventListener('input', calc));

    container.append(fuelField.row, tempField.row, pressField.row, warningEl, tempOutput.row, pressOutput.row);
    calc();
  }

  // ---- SOLAR / BATTERY ----

  function renderSolar(container) {
    const panelField = createField('calculator.sta.panels', 12, { step: 1, min: 1 });
    const wattField = createField('calculator.sta.watts_per_panel', 500, { step: 10, min: 1 });
    const dayField = createField('calculator.sta.day_length', 600, { step: 1, min: 1 });
    const nightField = createField('calculator.sta.night_length', 600, { step: 1, min: 1 });
    const consumeField = createField('calculator.sta.consumption', 2000, { step: 10, min: 0 });

    const genOutput = createOutput('calculator.sta.generation');
    const surplusOutput = createOutput('calculator.sta.surplus');
    const nightOutput = createOutput('calculator.sta.night_energy');
    const battOutput = createOutput('calculator.sta.batteries_needed');

    function calc() {
      const panels = parseFloat(panelField.input.value) || 0;
      const wpp = parseFloat(wattField.input.value) || 0;
      const nightLen = parseFloat(nightField.input.value) || 0;
      const consume = parseFloat(consumeField.input.value) || 0;

      const generation = panels * wpp;
      const surplus = generation - consume;
      const nightEnergy = consume * nightLen;
      const batteries = nightEnergy > 0 ? Math.ceil(nightEnergy / BATTERY_CAPACITY) : 0;

      genOutput.value.textContent = Calculator._formatResult(generation) + ' W';

      surplusOutput.value.textContent = Calculator._formatResult(surplus) + ' W';
      if (surplus < 0) {
        surplusOutput.value.style.color = 'var(--danger)';
      } else {
        surplusOutput.value.style.color = '';
      }

      nightOutput.value.textContent = Calculator._formatResult(nightEnergy) + ' Ws';
      battOutput.value.textContent = batteries;
    }

    [panelField, wattField, dayField, nightField, consumeField].forEach(f => f.input.addEventListener('input', calc));

    container.append(panelField.row, wattField.row, dayField.row, nightField.row, consumeField.row,
                     genOutput.row, surplusOutput.row, nightOutput.row, battOutput.row);
    calc();
  }

  // ---- ATMOSPHERE / MIXER ----

  function renderAtmo(container) {
    const targetField = createField('calculator.sta.target_temp', 293.15, { step: 1 });
    const gas1Field = createField('calculator.sta.gas1_temp', 200, { step: 1 });
    const gas2Field = createField('calculator.sta.gas2_temp', 400, { step: 1 });

    const m1Output = createOutput('calculator.sta.mixer_input1');
    const m2Output = createOutput('calculator.sta.mixer_input2');

    function calc() {
      const T0 = parseFloat(targetField.input.value) || 0;
      const T1 = parseFloat(gas1Field.input.value) || 0;
      const T2 = parseFloat(gas2Field.input.value) || 0;

      const denom = Math.abs(T1 - T0) + Math.abs(T2 - T0);
      if (denom === 0) {
        m1Output.value.textContent = '50%';
        m2Output.value.textContent = '50%';
        return;
      }

      const M1 = Math.abs(T2 - T0) / denom;
      const M2 = 1 - M1;

      m1Output.value.textContent = Calculator._formatResult(M1 * 100) + '%';
      m2Output.value.textContent = Calculator._formatResult(M2 * 100) + '%';
    }

    [targetField, gas1Field, gas2Field].forEach(f => f.input.addEventListener('input', calc));

    container.append(targetField.row, gas1Field.row, gas2Field.row, m1Output.row, m2Output.row);
    calc();

    // Aufklappbare Wärmekapazität-Referenz
    const details = document.createElement('details');
    details.className = 'calc-game-details';

    const summary = document.createElement('summary');
    summary.textContent = t('calculator.sta.heat_cap_ref');
    details.appendChild(summary);

    const table = document.createElement('table');
    table.className = 'calc-game-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thGas = document.createElement('th');
    thGas.textContent = t('calculator.sta.gas');
    const thCp = document.createElement('th');
    thCp.textContent = 'Cp (J/mol\u00B7K)';
    headerRow.append(thGas, thCp);
    thead.appendChild(headerRow);

    const tbody = document.createElement('tbody');
    HEAT_CAPS.forEach(entry => {
      const tr = document.createElement('tr');
      const tdGas = document.createElement('td');
      tdGas.textContent = entry.gas;
      const tdCp = document.createElement('td');
      tdCp.textContent = entry.cp;
      tr.append(tdGas, tdCp);
      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    details.appendChild(table);
    container.appendChild(details);
  }

  // ---- STATE ----

  async function loadState() {
    const data = await Store.get(Calculator.STORAGE_KEY);
    if (data && data.calculator && data.calculator.stationeers) {
      const s = data.calculator.stationeers;
      if (s.lastSubMode && SUB_MODES.includes(s.lastSubMode)) _activeSubMode = s.lastSubMode;
    }
  }

  async function saveState() {
    const data = await Store.get(Calculator.STORAGE_KEY) || {};
    if (!data.calculator) data.calculator = {};
    data.calculator.stationeers = { lastSubMode: _activeSubMode };
    await Store.set(Calculator.STORAGE_KEY, data);
  }

  function renderSubMode(container) {
    container.textContent = '';
    switch (_activeSubMode) {
      case 'gas':     renderGas(container); break;
      case 'furnace': renderFurnace(container); break;
      case 'solar':   renderSolar(container); break;
      case 'atmo':    renderAtmo(container); break;
    }
  }

  // ---- REGISTRATION ----

  Calculator.registerMode('stationeers', {
    label: '🚀',
    shortName: 'STA',
    titleKey: 'calculator.tab.stationeers',

    render(bodyEl) {
      bodyEl.style.padding = '8px';
      bodyEl.style.display = 'flex';
      bodyEl.style.flexDirection = 'column';
      bodyEl.style.gap = '8px';

      loadState().then(() => {
        const subContent = document.createElement('div');
        subContent.className = 'calc-game-content';

        const bar = document.createElement('div');
        bar.className = 'calc-game-subtabs';

        SUB_MODES.forEach(mode => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'calc-game-subtab' + (mode === _activeSubMode ? ' active' : '');
          btn.textContent = t('calculator.sta.tab.' + mode);
          btn.dataset.mode = mode;
          btn.addEventListener('click', () => {
            bar.querySelectorAll('.calc-game-subtab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _activeSubMode = mode;
            renderSubMode(subContent);
            saveState();
          });
          bar.appendChild(btn);
        });

        bodyEl.append(bar, subContent);
        renderSubMode(subContent);
      });
    },

    destroy() {
      saveState();
    }
  });
})();
```

- [ ] **Step 2: Script-Tag in newtab.html**

Nach dem `calc-factorio.js` Script-Tag:

```html
  <script src="src/js/calc-stationeers.js"></script>
```

- [ ] **Step 3: CSS für Stationeers-spezifische Elemente**

In `src/css/main.css`, nach den Game-Calculator shared Styles:

```css
/* Calculator Stationeers specifics */
.calc-game-hint {
  font-size: 10px;
  color: var(--text-muted);
  font-style: italic;
  margin-top: -4px;
  text-align: right;
}
.calc-game-details {
  border-top: 1px solid var(--border);
  padding-top: 6px;
  margin-top: 4px;
}
.calc-game-details summary {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.calc-game-table {
  width: 100%;
  font-size: 11px;
  border-collapse: collapse;
  margin-top: 4px;
}
.calc-game-table th {
  text-align: left;
  color: var(--text-muted);
  font-weight: 600;
  padding: 2px 6px;
  border-bottom: 1px solid var(--border);
}
.calc-game-table td {
  padding: 2px 6px;
  color: var(--text-secondary);
}
.calc-game-table tr:nth-child(even) td {
  background: rgba(0,0,0,0.1);
}
```

- [ ] **Step 4: i18n-Keys für Stationeers**

DE-Block:

```javascript
'calculator.tab.stationeers':        'Stationeers',
'calculator.sta.tab.gas':            'Gas',
'calculator.sta.tab.furnace':        'Ofen',
'calculator.sta.tab.solar':          'Solar',
'calculator.sta.tab.atmo':           'Atmo',
'calculator.sta.solve_for':          'Gesucht',
'calculator.sta.var.P':              'Druck (P)',
'calculator.sta.var.V':              'Volumen (V)',
'calculator.sta.var.n':              'Stoffmenge (n)',
'calculator.sta.var.T':              'Temperatur (T)',
'calculator.sta.var.P_label':        'Druck (kPa)',
'calculator.sta.var.V_label':        'Volumen (L)',
'calculator.sta.var.n_label':        'Stoffmenge (mol)',
'calculator.sta.var.T_label':        'Temperatur (K)',
'calculator.sta.result':             'Ergebnis',
'calculator.sta.fuel_ratio':         'Fuel-Anteil (0-1)',
'calculator.sta.start_temp':         'Start-Temperatur (K)',
'calculator.sta.start_pressure':     'Start-Druck (kPa)',
'calculator.sta.temp_after':         'T nach Zündung',
'calculator.sta.pressure_after':     'P nach Zündung',
'calculator.sta.warn_low_fuel':      '⚠ Fuel unter 5%',
'calculator.sta.warn_low_pressure':  '⚠ Druck unter 10 kPa',
'calculator.sta.panels':             'Anzahl Panels',
'calculator.sta.watts_per_panel':    'Watt/Panel',
'calculator.sta.day_length':         'Taglänge (s)',
'calculator.sta.night_length':       'Nachtlänge (s)',
'calculator.sta.consumption':        'Verbrauch (W)',
'calculator.sta.generation':         'Erzeugung',
'calculator.sta.surplus':            'Überschuss',
'calculator.sta.night_energy':       'Nacht-Energie',
'calculator.sta.batteries_needed':   'Batterien benötigt',
'calculator.sta.target_temp':        'Ziel-Temperatur (K)',
'calculator.sta.gas1_temp':          'Gas 1 Temperatur (K)',
'calculator.sta.gas2_temp':          'Gas 2 Temperatur (K)',
'calculator.sta.mixer_input1':       'Mixer Input 1',
'calculator.sta.mixer_input2':       'Mixer Input 2',
'calculator.sta.heat_cap_ref':       'Wärmekapazitäten (Referenz)',
'calculator.sta.gas':                'Gas',
```

EN-Block:

```javascript
'calculator.tab.stationeers':        'Stationeers',
'calculator.sta.tab.gas':            'Gas',
'calculator.sta.tab.furnace':        'Furnace',
'calculator.sta.tab.solar':          'Solar',
'calculator.sta.tab.atmo':           'Atmo',
'calculator.sta.solve_for':          'Solve for',
'calculator.sta.var.P':              'Pressure (P)',
'calculator.sta.var.V':              'Volume (V)',
'calculator.sta.var.n':              'Amount (n)',
'calculator.sta.var.T':              'Temperature (T)',
'calculator.sta.var.P_label':        'Pressure (kPa)',
'calculator.sta.var.V_label':        'Volume (L)',
'calculator.sta.var.n_label':        'Amount (mol)',
'calculator.sta.var.T_label':        'Temperature (K)',
'calculator.sta.result':             'Result',
'calculator.sta.fuel_ratio':         'Fuel Ratio (0-1)',
'calculator.sta.start_temp':         'Start Temperature (K)',
'calculator.sta.start_pressure':     'Start Pressure (kPa)',
'calculator.sta.temp_after':         'T after ignition',
'calculator.sta.pressure_after':     'P after ignition',
'calculator.sta.warn_low_fuel':      '⚠ Fuel below 5%',
'calculator.sta.warn_low_pressure':  '⚠ Pressure below 10 kPa',
'calculator.sta.panels':             'Panel Count',
'calculator.sta.watts_per_panel':    'Watts/Panel',
'calculator.sta.day_length':         'Day Length (s)',
'calculator.sta.night_length':       'Night Length (s)',
'calculator.sta.consumption':        'Consumption (W)',
'calculator.sta.generation':         'Generation',
'calculator.sta.surplus':            'Surplus',
'calculator.sta.night_energy':       'Night Energy',
'calculator.sta.batteries_needed':   'Batteries needed',
'calculator.sta.target_temp':        'Target Temperature (K)',
'calculator.sta.gas1_temp':          'Gas 1 Temperature (K)',
'calculator.sta.gas2_temp':          'Gas 2 Temperature (K)',
'calculator.sta.mixer_input1':       'Mixer Input 1',
'calculator.sta.mixer_input2':       'Mixer Input 2',
'calculator.sta.heat_cap_ref':       'Heat Capacities (Reference)',
'calculator.sta.gas':                'Gas',
```

- [ ] **Step 5: Testen**

1. STA-Tab klicken → 4 Sub-Tabs (Gas, Ofen, Solar, Atmo)
2. Gas: P gesucht, V=1000, n=1, T=293.15 → P=2437.66 kPa (Stationeers-R ist groß!)
3. Furnace: Fuel=0.5, T=293K, P=101kPa → hohe Temperatur nach Zündung
4. Solar: 12 Panels, 500W, 600s Tag/Nacht, 2000W → 6000W Gen, 4000W Surplus, 24 Batteries
5. Atmo: Target=300K, Gas1=200K, Gas2=400K → M1=50%, M2=50%
6. Wärmekapazität-Tabelle aufklappbar

- [ ] **Step 6: Commit**

```bash
git add src/js/calc-stationeers.js newtab.html src/css/main.css src/js/i18n.js
git commit -m "feat(calculator): Stationeers Calculator mit Gas/Furnace/Solar/Atmo"
```

---

### Task 8: Version Bump und CHANGELOG

**Files:**
- Modify: `manifest.json` — Version → 2.1.0
- Modify: `manifest.firefox.json` — Version → 2.1.0
- Modify: `manifest.opera.json` — Version → 2.1.0
- Modify: `newtab.html` — Version-String → 2.1.0
- Modify: `src/js/data.js` — Export-Version → 2.1.0
- Modify: `src/js/app.js` — Backup-Version → 2.1.0
- Modify: `CHANGELOG.md` — v2.1.0 Eintrag

- [ ] **Step 1: Manifests aktualisieren**

In allen drei Manifest-Dateien:
```json
"version": "2.1.0"
```

- [ ] **Step 2: newtab.html Version-String**

Den bestehenden Version-String von "2.0.1" auf "2.1.0" ändern.

- [ ] **Step 3: data.js Export-Version**

```javascript
version: '2.1.0',
```

- [ ] **Step 4: app.js Backup-Version**

```javascript
version: '2.1.0',
```

- [ ] **Step 5: CHANGELOG.md Eintrag**

Am Anfang der Datei (nach dem Header):

```markdown
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
```

- [ ] **Step 6: Commit**

```bash
git add manifest.json manifest.firefox.json manifest.opera.json newtab.html src/js/data.js src/js/app.js CHANGELOG.md
git commit -m "feat(release): Version auf v2.1.0 bumpen — Calculator Upgrade"
```
