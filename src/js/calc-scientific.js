/* =============================================
   HELLION NEWTAB — calc-scientific.js
   Scientific-Modus für Calculator Widget
   ============================================= */

(function() {
  'use strict';

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

  let _keyboardExtHandler = null;

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

  function handleNegate() {
    const expr = Calculator._currentExpr;
    if (!expr && Calculator._lastResult) {
      const num = parseFloat(Calculator._lastResult);
      if (!isNaN(num)) {
        Calculator._currentExpr = String(-num);
        Calculator._lastResult = '';
        Calculator._updateDisplay();
      }
      return;
    }
    const match = expr.match(/(-?\d+\.?\d*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const negated = String(-num);
      Calculator._currentExpr = expr.slice(0, expr.length - match[1].length) + negated;
      Calculator._updateDisplay();
    }
  }

  function renderFormulaHelper(container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'calc-formula-helper';

    const label = document.createElement('div');
    label.className = 'calc-formula-label';
    label.textContent = t('calculator.sci.formulas');

    const select = document.createElement('select');
    select.className = 'calc-formula-select';

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

      const sciSection = document.createElement('div');
      renderSciButtons(sciSection);

      const stdButtons = Calculator._createButtons();
      const historyEl = Calculator._createHistoryPanel();

      const formulaSection = document.createElement('div');
      renderFormulaHelper(formulaSection);

      bodyEl.append(display, sciSection, stdButtons, historyEl, formulaSection);
      Calculator._updateDisplay();

      const entry = WidgetManager._widgets.get(Calculator.WIDGET_ID);
      if (entry) bindSciKeyboard(entry.el);
    },

    destroy() {
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
