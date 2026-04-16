/* =============================================
   HELLION NEWTAB — calculator.js
   Taschenrechner Widget: Expression-Parsing,
   History, Tastatureingabe
   ============================================= */

const Calculator = {
  WIDGET_ID: 'widget_calculator',
  STORAGE_KEY: 'widgetStates',
  MAX_HISTORY: 10,

  /** @type {Array<{expr: string, result: string}>} */
  _history: [],
  _currentExpr: '',
  _lastResult: '',
  _isOpen: false,
  _displayExprEl: null,
  _displayResultEl: null,
  _keydownHandler: null,
  _modes: new Map(),
  _activeMode: 'standard',
  _tabBarEl: null,

  // ---- MODE REGISTRY ----

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

  // ---- STORAGE ----

  /**
   * Calculator-State aus Storage laden
   */
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.calculator) {
      this._history = Array.isArray(data.calculator.history) ? data.calculator.history : [];
      if (data.calculator.activeMode) {
        this._activeMode = data.calculator.activeMode;
      }
    }
  },

  /**
   * Calculator-State in Storage speichern
   * Bestehende Notes-Daten bleiben erhalten
   */
  async save() {
    const data = await Store.get(this.STORAGE_KEY) || {};

    // Widget-Position aus WidgetManager holen
    const widgetState = WidgetManager.getState(this.WIDGET_ID);
    data.calculator = {
      x: widgetState ? widgetState.x : 400,
      y: widgetState ? widgetState.y : 120,
      width: widgetState ? widgetState.width : 280,
      height: widgetState ? widgetState.height : 400,
      open: this._isOpen,
      activeMode: this._activeMode,
      history: this._history.slice(0, this.MAX_HISTORY)
    };

    await Store.set(this.STORAGE_KEY, data);
  },

  // ---- WIDGET LIFECYCLE ----

  /**
   * Calculator oeffnen oder in Vordergrund bringen
   */
  async open() {
    if (this._isOpen) {
      WidgetManager.bringToFront(this.WIDGET_ID);
      return;
    }

    // Gespeicherte Position laden
    const data = await Store.get(this.STORAGE_KEY);
    const saved = (data && data.calculator) ? data.calculator : {};

    const widgetId = WidgetManager.create('calculator', {
      id: this.WIDGET_ID,
      title: t('calculator.title'),
      x: saved.x || 400,
      y: saved.y || 120,
      width: saved.width || 280,
      height: saved.height || 400,
      open: true
    });

    const body = WidgetManager.getBody(widgetId);
    if (body) this.renderBody(body);

    this._isOpen = true;

    // Keyboard-Events binden
    const entry = WidgetManager._widgets.get(this.WIDGET_ID);
    if (entry) this._bindKeyboard(entry.el);

    await this.save();
  },

  /**
   * Calculator toggle: oeffnen oder minimieren
   */
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

  /**
   * Wird aufgerufen wenn Widget geschlossen wird
   */
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

  // ---- UI RENDERING ----

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

  /**
   * Tab-Bar mit Buttons aus _modes Map befüllen
   */
  _renderTabBar() {
    if (!this._tabBarEl) return;
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
    if (isComplex && entry) {
      const state = entry.state;
      if (state) {
        const newW = Math.max(state.width, 320);
        const newH = Math.max(state.height, 480);
        if (newW !== state.width || newH !== state.height) {
          entry.el.style.width = newW + 'px';
          entry.el.style.height = newH + 'px';
          state.width = newW;
          state.height = newH;
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

  /**
   * Button-Grid erstellen (4x5)
   * @returns {HTMLElement}
   */
  _createButtons() {
    const grid = document.createElement('div');
    grid.className = 'calc-buttons';

    // Button-Layout: [label, value, cssClass]
    const buttons = [
      ['C',  'clear',     'clear'],
      ['()', 'paren',     'operator'],
      ['%',  '%',         'operator'],
      ['\u00F7', '/',     'operator'],
      ['7',  '7',         ''],
      ['8',  '8',         ''],
      ['9',  '9',         ''],
      ['\u00D7', '*',     'operator'],
      ['4',  '4',         ''],
      ['5',  '5',         ''],
      ['6',  '6',         ''],
      ['\u2212', '-',     'operator'],
      ['1',  '1',         ''],
      ['2',  '2',         ''],
      ['3',  '3',         ''],
      ['+',  '+',         'operator'],
      ['0',  '0',         ''],
      ['.',  '.',         ''],
      ['\u232B', 'backspace', ''],
      ['=',  '=',         'equals']
    ];

    buttons.forEach(([label, value, cls]) => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn' + (cls ? ' ' + cls : '');
      btn.textContent = label;
      btn.type = 'button';
      btn.addEventListener('click', () => this._handleKey(value));
      grid.appendChild(btn);
    });

    return grid;
  },

  /**
   * History-Panel erstellen
   * @returns {HTMLElement}
   */
  _createHistoryPanel() {
    const container = document.createElement('div');
    container.className = 'calc-history';
    container.id = 'calcHistoryPanel';

    const title = document.createElement('div');
    title.className = 'calc-history-title';
    title.textContent = t('calculator.history');
    container.appendChild(title);

    this._renderHistoryItems(container);

    return container;
  },

  /**
   * History-Items rendern
   * @param {HTMLElement} container
   */
  _renderHistoryItems(container) {
    // Alte Items entfernen (nur die .calc-history-item Elemente)
    const oldItems = container.querySelectorAll('.calc-history-item');
    oldItems.forEach(item => item.remove());

    if (this._history.length === 0) return;

    // Neueste zuerst
    const reversed = [...this._history].reverse();
    reversed.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'calc-history-item';

      const exprSpan = document.createElement('span');
      exprSpan.textContent = entry.expr;

      const resultSpan = document.createElement('span');
      resultSpan.className = 'calc-h-result';
      resultSpan.textContent = '= ' + entry.result;

      item.append(exprSpan, resultSpan);

      // Klick uebernimmt Ergebnis als neue Eingabe
      item.addEventListener('click', () => {
        this._currentExpr = entry.result;
        this._lastResult = '';
        this._updateDisplay();
      });

      container.appendChild(item);
    });
  },

  // ---- INPUT HANDLING ----

  /**
   * Taste verarbeiten
   * @param {string} key
   */
  _handleKey(key) {
    switch (key) {
      case 'clear':
        this._currentExpr = '';
        this._lastResult = '';
        break;

      case 'backspace':
        this._currentExpr = this._currentExpr.slice(0, -1);
        break;

      case '=':
        this._calculate();
        return;

      case 'paren': {
        // Smarte Klammern: oeffnende wenn noetig, sonst schliessende
        const openCount = (this._currentExpr.match(/\(/g) || []).length;
        const closeCount = (this._currentExpr.match(/\)/g) || []).length;
        const lastChar = this._currentExpr.slice(-1);
        if (openCount <= closeCount || /[+\-*/%(]$/.test(lastChar) || this._currentExpr === '') {
          this._currentExpr += '(';
        } else {
          this._currentExpr += ')';
        }
        break;
      }

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

      case '.': {
        // Doppelten Dezimalpunkt im letzten Zahlenblock verhindern
        const parts = this._currentExpr.split(/[+\-*/%()]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.includes('.')) break;
        this._currentExpr += key;
        break;
      }

      default:
        // Ziffern 0-9
        if (/^[0-9]$/.test(key)) {
          // Wenn ein Ergebnis da ist und User eine Zahl tippt, neue Berechnung starten
          if (this._lastResult && this._currentExpr === '') {
            this._lastResult = '';
          }
          this._currentExpr += key;
        }
        break;
    }

    this._updateDisplay();
  },

  /**
   * Berechnung ausfuehren
   */
  async _calculate() {
    if (!this._currentExpr) return;

    const result = this._evaluate(this._currentExpr);
    if (result === null) {
      this._lastResult = t('calculator.error');
      this._updateDisplay();
      return;
    }

    const resultStr = this._formatResult(result);
    this._addHistory(this._currentExpr, resultStr);
    this._lastResult = resultStr;

    // Display aktualisieren
    if (this._displayExprEl) {
      this._displayExprEl.textContent = this._formatExpression(this._currentExpr) + ' =';
    }
    if (this._displayResultEl) {
      this._displayResultEl.textContent = resultStr;
    }

    this._currentExpr = '';

    // History-Panel aktualisieren
    const historyPanel = document.getElementById('calcHistoryPanel');
    if (historyPanel) this._renderHistoryItems(historyPanel);

    await this.save();
  },

  // ---- EXPRESSION PARSER (Shunting-Yard, KEIN eval!) ----

  /**
   * Expression sicher auswerten
   * @param {string} expr
   * @returns {number|null}
   */
  _evaluate(expr) {
    try {
      // Nur erlaubte Zeichen
      const sanitized = expr.replace(/[^0-9+\-*/.%()^a-z]/g, '');
      if (!sanitized) return null;

      const tokens = this._tokenize(sanitized);
      if (!tokens) return null;

      return this._parseExpression(tokens);
    } catch {
      return null;
    }
  },

  /**
   * Expression in Tokens aufteilen
   * @param {string} expr
   * @returns {Array|null}
   */
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

      // Operator
      if (/[+\-*/%]/.test(ch)) {
        // Negativer Vorzeichen-Check: am Anfang oder nach Operator/oeffnender Klammer
        if (ch === '-') {
          const prev = tokens[tokens.length - 1];
          if (!prev || prev.type === 'op' || (prev.type === 'paren' && prev.value === '(')) {
            // Negatives Vorzeichen → als Teil der naechsten Zahl lesen
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

      // Potenz-Operator
      if (ch === '^') {
        tokens.push({ type: 'op', value: '^' });
        i++;
        continue;
      }

      // Klammern
      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch });
        i++;
        continue;
      }

      // Unbekannte Buchstaben
      if (/[a-z]/.test(ch)) {
        return null;
      }

      // Unbekanntes Zeichen
      return null;
    }

    return tokens;
  },

  /**
   * Rekursiver Descent Parser mit Operator-Precedence
   * Hierarchie: parseExpr (+/-) → parseTerm (*\/%) → parsePower (^) → parseFactor
   * @param {Array} tokens
   * @returns {number|null}
   */
  _parseExpression(tokens) {
    let pos = 0;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

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

    // Power: Factor ('^' Power)?  — rechts-assoziativ via Rekursion
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
          if (val < 0) return null; // Negativer Radikand nicht erlaubt
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

  // ---- FORMATTING ----

  /**
   * Ergebnis formatieren (maximal 10 Dezimalstellen, trailing Nullen entfernen)
   * @param {number} num
   * @returns {string}
   */
  _formatResult(num) {
    if (Number.isInteger(num)) return num.toString();
    // Maximal 10 Dezimalstellen, trailing Nullen weg
    const str = num.toFixed(10).replace(/\.?0+$/, '');
    return str;
  },

  /**
   * Expression fuer Anzeige formatieren (× statt *, ÷ statt /)
   * @param {string} expr
   * @returns {string}
   */
  _formatExpression(expr) {
    return expr
      .replace(/\*/g, '\u00D7')
      .replace(/\//g, '\u00F7')
      .replace(/sqrt\(/g, '\u221A(');
  },

  // ---- DISPLAY ----

  /**
   * Display aktualisieren
   */
  _updateDisplay() {
    if (this._displayExprEl) {
      if (this._lastResult) {
        // Ergebnis-Modus: Expression oben, Ergebnis gross
        // (wird von _calculate() direkt gesetzt)
      } else {
        this._displayExprEl.textContent = '';
      }
    }
    if (this._displayResultEl) {
      if (this._lastResult && this._currentExpr === '') {
        this._displayResultEl.textContent = this._lastResult;
      } else {
        this._displayResultEl.textContent = this._formatExpression(this._currentExpr) || '0';
      }
    }
  },

  // ---- HISTORY ----

  /**
   * History-Eintrag hinzufuegen
   * @param {string} expr
   * @param {string} result
   */
  _addHistory(expr, result) {
    this._history.push({
      expr: this._formatExpression(expr),
      result: result
    });
    // Limit einhalten
    if (this._history.length > this.MAX_HISTORY) {
      this._history = this._history.slice(-this.MAX_HISTORY);
    }
  },

  // ---- KEYBOARD ----

  /**
   * Tastatur-Events binden
   * @param {HTMLElement} widgetEl
   */
  _bindKeyboard(widgetEl) {
    this._unbindKeyboard();

    this._keydownHandler = (e) => {
      // Nur reagieren wenn Calculator-Widget fokussiert ist
      // (d.h. nicht wenn User in Textarea/Input tippt)
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.target.contentEditable === 'true') return;

      const key = e.key;
      let handled = false;

      if (/^[0-9]$/.test(key)) {
        this._handleKey(key);
        handled = true;
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        this._handleKey(key);
        handled = true;
      } else if (key === '.') {
        this._handleKey('.');
        handled = true;
      } else if (key === '%') {
        this._handleKey('%');
        handled = true;
      } else if (key === '(' || key === ')') {
        this._handleKey('paren');
        handled = true;
      } else if (key === 'Enter' || key === '=') {
        this._handleKey('=');
        handled = true;
      } else if (key === 'Backspace') {
        this._handleKey('backspace');
        handled = true;
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        this._handleKey('clear');
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    widgetEl.addEventListener('keydown', this._keydownHandler);
    // Widget fokussierbar machen
    widgetEl.tabIndex = 0;
    widgetEl.focus();
  },

  /**
   * Keyboard-Events entfernen
   */
  _unbindKeyboard() {
    if (this._keydownHandler) {
      const entry = WidgetManager._widgets.get(this.WIDGET_ID);
      if (entry) {
        entry.el.removeEventListener('keydown', this._keydownHandler);
      }
      this._keydownHandler = null;
    }
  },

  // ---- INIT ----

  /**
   * Calculator initialisieren (aus app.js aufgerufen)
   */
  async init() {
    await this.load();

    // Standard-Modus ZUERST registrieren, bevor open() aufgerufen wird
    this._modes.set('standard', {
      label: '🔢',
      shortName: 'Std',
      titleKey: 'calculator.tab.standard',
      render: (bodyEl) => this._renderStandardMode(bodyEl),
      destroy: () => {
        this._displayExprEl = null;
        this._displayResultEl = null;
      }
    });

    // Wenn Calculator beim letzten Mal offen war, wiederherstellen
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.calculator && data.calculator.open) {
      await this.open();
    }

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
  }
};
