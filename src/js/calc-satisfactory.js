/* =============================================
   HELLION NEWTAB — calc-satisfactory.js
   Satisfactory Calculator Modus
   ============================================= */

(function() {
  'use strict';

  const POWER_EXPONENT = 1.321928;
  const SUB_MODES = ['itemsPerMin', 'power', 'machines'];
  let _activeSubMode = 'itemsPerMin';

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

    [itemsField, timeField, clockField].forEach(f => f.input.addEventListener('input', calc));
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

    [basePowerField, clockField].forEach(f => f.input.addEventListener('input', calc));
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

    [targetField, itemsField, timeField, clockField, basePowerField].forEach(f => f.input.addEventListener('input', calc));
    container.append(targetField.row, itemsField.row, timeField.row, clockField.row, basePowerField.row, machinesOutput.row, totalPowerOutput.row);
    calc();
  }

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

  function renderSubMode(container) {
    container.textContent = '';
    switch (_activeSubMode) {
      case 'itemsPerMin': renderItemsPerMin(container); break;
      case 'power':       renderPower(container); break;
      case 'machines':    renderMachines(container); break;
    }
  }

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

        const bar = document.createElement('div');
        bar.className = 'calc-game-subtabs';

        SUB_MODES.forEach(mode => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'calc-game-subtab' + (mode === _activeSubMode ? ' active' : '');
          btn.textContent = t('calculator.sat.tab.' + mode);
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
