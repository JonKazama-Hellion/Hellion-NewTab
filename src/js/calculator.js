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

  // ---- STORAGE ----

  /**
   * Calculator-State aus Storage laden
   */
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.calculator) {
      this._history = Array.isArray(data.calculator.history) ? data.calculator.history : [];
    }
  },

  /**
   * Calculator-State in Storage speichern
   * Bestehende Notes-Daten bleiben erhalten
   */
  async save() {
    const data = await Store.get(this.STORAGE_KEY) || {};
    const notesState = Array.isArray(data.notes) ? data.notes : [];

    // Widget-Position aus WidgetManager holen
    const widgetState = WidgetManager.getState(this.WIDGET_ID);
    const calcData = {
      x: widgetState ? widgetState.x : 400,
      y: widgetState ? widgetState.y : 120,
      width: widgetState ? widgetState.width : 280,
      height: widgetState ? widgetState.height : 400,
      open: this._isOpen,
      history: this._history.slice(0, this.MAX_HISTORY)
    };

    await Store.set(this.STORAGE_KEY, { notes: notesState, calculator: calcData });
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
      title: 'Taschenrechner',
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
    this._isOpen = false;
    this._unbindKeyboard();
    this._displayExprEl = null;
    this._displayResultEl = null;
    await this.save();
  },

  // ---- UI RENDERING ----

  /**
   * Calculator-Body rendern (in Widget-Body einfuegen)
   * @param {HTMLElement} bodyEl
   */
  renderBody(bodyEl) {
    bodyEl.textContent = '';
    bodyEl.style.padding = '8px';
    bodyEl.style.display = 'flex';
    bodyEl.style.flexDirection = 'column';

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
    title.textContent = 'History';
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
      case '/': {
        // Wenn gerade ein Ergebnis angezeigt wird, damit weiterrechnen
        if (this._lastResult && this._currentExpr === '') {
          this._currentExpr = this._lastResult;
          this._lastResult = '';
        }
        // Doppelte Operatoren verhindern (letzten ersetzen)
        const last = this._currentExpr.slice(-1);
        if (/[+\-*/%]/.test(last)) {
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
      this._lastResult = 'Fehler';
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
      const sanitized = expr.replace(/[^0-9+\-*/.%()]/g, '');
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

      // Klammern
      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch });
        i++;
        continue;
      }

      // Unbekanntes Zeichen
      return null;
    }

    return tokens;
  },

  /**
   * Rekursiver Descent Parser mit Operator-Precedence
   * @param {Array} tokens
   * @returns {number|null}
   */
  _parseExpression(tokens) {
    let pos = 0;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    // Expression: Term (('+' | '-') Term)*
    function parseExpr() {
      let left = parseTerm();
      if (left === null) return null;

      while (pos < tokens.length) {
        const t = peek();
        if (!t || t.type !== 'op' || (t.value !== '+' && t.value !== '-')) break;
        consume();
        const right = parseTerm();
        if (right === null) return null;
        left = t.value === '+' ? left + right : left - right;
      }
      return left;
    }

    // Term: Factor (('*' | '/' | '%') Factor)*
    function parseTerm() {
      let left = parseFactor();
      if (left === null) return null;

      while (pos < tokens.length) {
        const t = peek();
        if (!t || t.type !== 'op' || (t.value !== '*' && t.value !== '/' && t.value !== '%')) break;
        consume();
        const right = parseFactor();
        if (right === null) return null;
        if (t.value === '*') {
          left = left * right;
        } else if (t.value === '/') {
          if (right === 0) return null;
          left = left / right;
        } else {
          left = left % right;
        }
      }
      return left;
    }

    // Factor: Number | '(' Expression ')'
    function parseFactor() {
      const t = peek();
      if (!t) return null;

      if (t.type === 'number') {
        consume();
        return t.value;
      }

      if (t.type === 'paren' && t.value === '(') {
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
      .replace(/\//g, '\u00F7');
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

    // Wenn Calculator beim letzten Mal offen war, wiederherstellen
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.calculator && data.calculator.open) {
      await this.open();
    }

    // Close-Event abfangen: WidgetManager.close() ueberschreiben
    const origClose = WidgetManager.close.bind(WidgetManager);
    const self = this;
    WidgetManager.close = function(id) {
      origClose(id);
      if (id === self.WIDGET_ID) {
        self.onClose();
      }
    };

    // Minimize-Event abfangen
    const origMinimize = WidgetManager.minimize.bind(WidgetManager);
    WidgetManager.minimize = async function(id) {
      await origMinimize(id);
      if (id === self.WIDGET_ID) {
        self._isOpen = false;
        await self.save();
      }
    };

    // Open-Event abfangen
    const origOpen = WidgetManager.openWidget.bind(WidgetManager);
    WidgetManager.openWidget = async function(id) {
      await origOpen(id);
      if (id === self.WIDGET_ID) {
        self._isOpen = true;
        // Body neu rendern (war durch minimize entfernt)
        const body = WidgetManager.getBody(self.WIDGET_ID);
        if (body && body.children.length === 0) {
          self.renderBody(body);
        }
        const entry = WidgetManager._widgets.get(self.WIDGET_ID);
        if (entry) self._bindKeyboard(entry.el);
        await self.save();
      }
    };
  }
};
