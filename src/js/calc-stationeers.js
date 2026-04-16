/* =============================================
   HELLION NEWTAB — calc-stationeers.js
   Stationeers Calculator Modus
   ============================================= */

(function() {
  'use strict';

  const R = 8314.46261815324;
  const COMBUSTION_ENERGY = 563452;
  const HEAT_CAP_PURE_FUEL = 61.9;
  const HEAT_CAP_DELTA = 172.615;
  const BATTERY_CAPACITY = 50000;

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

  function renderGas(container) {
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

    const fields = {};
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

    const tempHelper = document.createElement('div');
    tempHelper.className = 'calc-game-hint';
    container.appendChild(tempHelper);

    const resultOutput = createOutput('calculator.sta.result');
    container.appendChild(resultOutput.row);

    function calc() {
      const solveFor = solveSelect.value;

      GAS_VARS.forEach(v => {
        fields[v].input.disabled = (v === solveFor);
        fields[v].input.style.opacity = (v === solveFor) ? '0.5' : '1';
      });

      const P_kPa = parseFloat(fields.P.input.value) || 0;
      const P = P_kPa * 1000;
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

      const tempVal = parseFloat(fields.T.input.value) || 0;
      tempHelper.textContent = Calculator._formatResult(tempVal - 273.15) + ' \u00B0C';
    }

    GAS_VARS.forEach(v => {
      fields[v].input.addEventListener('input', calc);
    });
    solveSelect.addEventListener('change', calc);
    calc();
  }

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

  Calculator.registerMode('stationeers', {
    label: '\uD83D\uDE80',
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
