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

  function findSmallestBelt(throughput) {
    for (const belt of BELTS) {
      if (belt.throughput >= throughput) return belt;
    }
    return null;
  }

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
