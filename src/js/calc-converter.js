/* =============================================
   HELLION NEWTAB — calc-converter.js
   Unit-Converter Modus für Calculator Widget
   ============================================= */

(function() {
  'use strict';

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
      baseUnit: null,
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

  let _currentCategory = 'length';
  let _fromUnit = 'cm';
  let _toUnit = 'in';
  let _fromInput = null;
  let _toInput = null;
  let _refEl = null;

  /**
   * Converts a value from one unit to another within the current category.
   * @param {number} value
   * @param {string} from
   * @param {string} to
   * @returns {number|null}
   */
  function convert(value, from, to) {
    const cat = CATEGORIES[_currentCategory];
    if (!cat) return null;
    if (cat.convert) return cat.convert(value, from, to);
    const fromDef = cat.units[from];
    const toDef = cat.units[to];
    if (!fromDef || !toDef) return null;
    const base = fromDef.toBase(value);
    return toDef.fromBase(base);
  }

  /**
   * Recalculates the output field and reference lines based on current input.
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
   * Updates the reference conversion lines below the inputs.
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
   * Populates a unit <select> element with options for the current category.
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
   * Returns sensible default from/to units for a given category key.
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
   * Loads persisted converter state from storage.
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
   * Persists current converter state to storage (read-before-write).
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

  /**
   * Builds the converter UI and appends it to the widget body element.
   * @param {HTMLElement} bodyEl
   */
  function buildUI(bodyEl) {
    const catSelect = document.createElement('select');
    catSelect.className = 'calc-conv-select';

    CATEGORY_ORDER.forEach(catKey => {
      const opt = document.createElement('option');
      opt.value = catKey;
      opt.textContent = t(CATEGORIES[catKey].titleKey);
      if (catKey === _currentCategory) opt.selected = true;
      catSelect.appendChild(opt);
    });

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

    const swapBtn = document.createElement('button');
    swapBtn.type = 'button';
    swapBtn.className = 'calc-conv-swap';
    swapBtn.textContent = '\u21C5';
    swapBtn.title = t('calculator.conv.swap');

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

    _refEl = document.createElement('div');
    _refEl.className = 'calc-conv-ref';

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
    updateReference();
  }

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
})();
