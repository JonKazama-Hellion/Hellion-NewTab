/* =============================================
   HELLION NEWTAB — timer.js
   Timer / Countdown Widget: Presets, Alarm,
   Tab-Titel-Blink
   ============================================= */

const Timer = {
  WIDGET_ID: 'widget_timer',
  STORAGE_KEY: 'widgetStates',
  MAX_PRESETS: 5,

  /** @type {Array<{name: string, seconds: number}>} */
  _presets: [],
  _isOpen: false,
  _seconds: 0,
  _remaining: 0,
  _intervalId: null,
  _running: false,
  _finished: false,
  _blinkIntervalId: null,
  _originalTitle: '',
  _keydownHandler: null,
  _muted: false,

  // UI-Referenzen
  _timeEl: null,
  _muteBtn: null,
  _inputEl: null,
  _inputRow: null,
  _btnStart: null,
  _btnPause: null,
  _btnReset: null,

  // ---- STORAGE ----

  /**
   * Timer-State aus Storage laden
   */
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.timer) {
      this._presets = Array.isArray(data.timer.presets) ? data.timer.presets : [];
      if (typeof data.timer.muted === 'boolean') this._muted = data.timer.muted;
    }
  },

  /**
   * Timer-State in Storage speichern
   * Bestehende Notes + Calculator bleiben erhalten
   */
  async save() {
    const data = await Store.get(this.STORAGE_KEY) || {};
    if (data.notes === undefined) data.notes = [];

    const widgetState = WidgetManager.getState(this.WIDGET_ID);
    data.timer = {
      x: widgetState ? widgetState.x : 600,
      y: widgetState ? widgetState.y : 80,
      width: widgetState ? widgetState.width : 260,
      height: widgetState ? widgetState.height : 360,
      open: this._isOpen,
      presets: this._presets.slice(0, this.MAX_PRESETS),
      muted: this._muted
    };

    await Store.set(this.STORAGE_KEY, data);
  },

  // ---- WIDGET LIFECYCLE ----

  /**
   * Timer-Widget oeffnen oder in Vordergrund bringen
   */
  async open() {
    if (this._isOpen) {
      WidgetManager.bringToFront(this.WIDGET_ID);
      return;
    }

    const data = await Store.get(this.STORAGE_KEY);
    const saved = (data && data.timer) ? data.timer : {};

    WidgetManager.create('timer', {
      id: this.WIDGET_ID,
      title: 'Timer',
      x: saved.x || 600,
      y: saved.y || 80,
      width: saved.width || 260,
      height: saved.height || 360,
      open: true
    });

    const body = WidgetManager.getBody(this.WIDGET_ID);
    if (body) this.renderBody(body);

    this._isOpen = true;

    const entry = WidgetManager._widgets.get(this.WIDGET_ID);
    if (entry) this._bindKeyboard(entry.el);

    await this.save();
  },

  /**
   * Timer toggle: oeffnen oder minimieren
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
    this._stopCountdown();
    this._stopAlarm();
    this._timeEl = null;
    this._inputEl = null;
    this._inputRow = null;
    this._btnStart = null;
    this._btnPause = null;
    this._btnReset = null;
    this._muteBtn = null;
    await this.save();
  },

  // ---- UI RENDERING ----

  /**
   * Timer-Body rendern
   * @param {HTMLElement} bodyEl
   */
  renderBody(bodyEl) {
    bodyEl.textContent = '';
    bodyEl.style.padding = '8px';
    bodyEl.style.display = 'flex';
    bodyEl.style.flexDirection = 'column';

    // Display
    const display = document.createElement('div');
    display.className = 'timer-display';

    const timeEl = document.createElement('div');
    timeEl.className = 'timer-time';
    timeEl.textContent = '00:00';
    this._timeEl = timeEl;
    display.appendChild(timeEl);

    // Input
    const inputRow = document.createElement('div');
    inputRow.className = 'timer-input-row';
    this._inputRow = inputRow;

    const input = document.createElement('input');
    input.className = 'timer-input';
    input.type = 'text';
    input.placeholder = 'mm:ss';
    input.maxLength = 8;
    this._inputEl = input;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._applyInput();
        this._start();
      }
    });

    inputRow.appendChild(input);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'timer-controls';

    const btnStart = document.createElement('button');
    btnStart.className = 'timer-ctrl-btn primary';
    btnStart.type = 'button';
    btnStart.textContent = 'Start';
    btnStart.addEventListener('click', () => {
      if (!this._running && this._remaining === 0) {
        this._applyInput();
      }
      this._start();
    });
    this._btnStart = btnStart;

    const btnPause = document.createElement('button');
    btnPause.className = 'timer-ctrl-btn';
    btnPause.type = 'button';
    btnPause.textContent = 'Pause';
    btnPause.disabled = true;
    btnPause.addEventListener('click', () => this._pause());
    this._btnPause = btnPause;

    const btnReset = document.createElement('button');
    btnReset.className = 'timer-ctrl-btn danger';
    btnReset.type = 'button';
    btnReset.textContent = 'Reset';
    btnReset.addEventListener('click', () => this._reset());
    this._btnReset = btnReset;

    controls.append(btnStart, btnPause, btnReset);

    // Mute Toggle (in Controls-Zeile)
    const muteBtn = document.createElement('button');
    muteBtn.className = 'timer-mute-btn';
    muteBtn.type = 'button';
    this._muteBtn = muteBtn;
    this._updateMuteBtn();
    muteBtn.addEventListener('click', async () => {
      this._muted = !this._muted;
      this._updateMuteBtn();
      await this.save();
    });
    controls.appendChild(muteBtn);

    // Presets
    const presetsEl = this._createPresetsPanel();

    bodyEl.append(display, inputRow, controls, presetsEl);

    // State wiederherstellen
    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Presets-Panel erstellen
   * @returns {HTMLElement}
   */
  _createPresetsPanel() {
    const container = document.createElement('div');
    container.className = 'timer-presets';
    container.id = 'timerPresetsPanel';

    const header = document.createElement('div');
    header.className = 'timer-presets-header';

    const title = document.createElement('span');
    title.className = 'timer-presets-title';
    title.textContent = 'Presets';

    const addBtn = document.createElement('button');
    addBtn.className = 'timer-preset-add';
    addBtn.type = 'button';
    addBtn.textContent = '+';
    addBtn.title = 'Preset speichern';
    addBtn.addEventListener('click', () => this._showAddPreset(container));

    header.append(title, addBtn);
    container.appendChild(header);

    this._renderPresetItems(container);

    return container;
  },

  /**
   * Preset-Items rendern
   * @param {HTMLElement} container
   */
  _renderPresetItems(container) {
    // Alte Items entfernen
    const oldItems = container.querySelectorAll('.timer-preset-item, .timer-add-row');
    oldItems.forEach(item => item.remove());

    this._presets.forEach((preset, idx) => {
      const item = document.createElement('div');
      item.className = 'timer-preset-item';

      const name = document.createElement('span');
      name.className = 'timer-preset-name';
      name.textContent = preset.name;

      const time = document.createElement('span');
      time.className = 'timer-preset-time';
      time.textContent = this._formatTime(preset.seconds);

      const del = document.createElement('button');
      del.className = 'timer-preset-del';
      del.type = 'button';
      del.textContent = '\u2715';
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this._deletePreset(idx);
        this._renderPresetItems(container);
      });

      item.append(name, time, del);

      // Klick laedt Preset
      item.addEventListener('click', () => {
        this._loadPreset(preset);
      });

      container.appendChild(item);
    });
  },

  /**
   * Add-Preset UI anzeigen
   * @param {HTMLElement} container
   */
  _showAddPreset(container) {
    // Nur einmal anzeigen
    if (container.querySelector('.timer-add-row')) return;

    if (this._presets.length >= this.MAX_PRESETS) {
      HellionDialog.alert(
        'Maximale Anzahl erreicht! Du kannst maximal ' + this.MAX_PRESETS + ' Presets speichern.',
        { type: 'warning', title: 'Limit erreicht' }
      );
      return;
    }

    // Aktuelle Zeit als Vorlage
    const currentSeconds = this._remaining > 0 ? this._seconds : 0;
    if (currentSeconds === 0 && this._inputEl) {
      const parsed = this._parseTimeInput(this._inputEl.value);
      if (parsed === 0) {
        HellionDialog.alert(
          'Gib zuerst eine Zeit ein, bevor du ein Preset speicherst.',
          { type: 'info', title: 'Keine Zeit' }
        );
        return;
      }
    }

    const row = document.createElement('div');
    row.className = 'timer-add-row';

    const nameInput = document.createElement('input');
    nameInput.className = 'timer-add-input';
    nameInput.type = 'text';
    nameInput.placeholder = 'Name...';
    nameInput.maxLength = 20;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'timer-add-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'OK';

    const doAdd = async () => {
      const name = nameInput.value.trim();
      if (!name) return;

      let secs = this._seconds;
      if (secs === 0 && this._inputEl) {
        secs = this._parseTimeInput(this._inputEl.value);
      }
      if (secs === 0) return;

      await this._addPreset(name, secs);
      this._renderPresetItems(container);
    };

    confirmBtn.addEventListener('click', doAdd);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doAdd();
      if (e.key === 'Escape') row.remove();
    });

    row.append(nameInput, confirmBtn);
    container.appendChild(row);
    nameInput.focus();
  },

  // ---- TIMER LOGIC ----

  /**
   * Input-Feld auslesen und als Sekunden setzen
   */
  _applyInput() {
    if (!this._inputEl) return;
    const secs = this._parseTimeInput(this._inputEl.value);
    if (secs > 0) {
      this._seconds = secs;
      this._remaining = secs;
    }
  },

  /**
   * Timer starten
   */
  _start() {
    if (this._running) return;
    if (this._remaining <= 0) return;

    // Falls gerade Alarm laeuft, stoppen
    if (this._finished) {
      this._stopAlarm();
      this._finished = false;
    }

    this._running = true;
    this._updateControls();

    // Input verstecken
    if (this._inputRow) this._inputRow.style.display = 'none';

    this._intervalId = setInterval(() => this._tick(), 1000);
  },

  /**
   * Timer pausieren
   */
  _pause() {
    if (!this._running) return;
    this._running = false;
    this._stopCountdown();
    this._updateControls();
  },

  /**
   * Timer zuruecksetzen
   */
  _reset() {
    this._stopCountdown();
    this._stopAlarm();
    this._running = false;
    this._finished = false;
    this._remaining = 0;
    this._seconds = 0;

    // Input wieder anzeigen
    if (this._inputRow) this._inputRow.style.display = 'flex';
    if (this._inputEl) this._inputEl.value = '';

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Jede Sekunde: remaining verringern, Display aktualisieren
   */
  _tick() {
    this._remaining--;

    if (this._remaining <= 0) {
      this._remaining = 0;
      this._stopCountdown();
      this._running = false;
      this._finished = true;
      this._onFinish();
    }

    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Interval stoppen
   */
  _stopCountdown() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  /**
   * Timer abgelaufen — Alarm + Tab-Blink
   */
  _onFinish() {
    if (!this._muted) this._playAlarm();
    this._startTitleBlink();
  },

  /**
   * Akustisches Signal (Browser Audio API, kein externer Request)
   */
  _playAlarm() {
    try {
      const ctx = new AudioContext();
      [0, 0.3, 0.6].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.07;
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      console.warn('Timer: Audio nicht verfuegbar', e);
    }
  },

  /**
   * Tab-Titel blinken lassen
   */
  _startTitleBlink() {
    this._originalTitle = document.title;
    this._blinkIntervalId = setInterval(() => {
      document.title = document.title === '[!] Timer abgelaufen'
        ? this._originalTitle
        : '[!] Timer abgelaufen';
    }, 1000);
  },

  /**
   * Tab-Titel Blink und Alarm stoppen
   */
  _stopAlarm() {
    if (this._blinkIntervalId) {
      clearInterval(this._blinkIntervalId);
      this._blinkIntervalId = null;
      document.title = this._originalTitle || 'Hellion Dashboard';
    }
    this._finished = false;
    this._updateDisplay();
    this._updateControls();
  },

  /**
   * Mute-Button Text/Titel aktualisieren
   */
  _updateMuteBtn() {
    if (!this._muteBtn) return;
    this._muteBtn.textContent = this._muted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
    this._muteBtn.title = this._muted ? 'Ton einschalten' : 'Ton ausschalten';
    this._muteBtn.classList.toggle('muted', this._muted);
  },

  // ---- DISPLAY ----

  /**
   * Zeitanzeige aktualisieren
   */
  _updateDisplay() {
    if (!this._timeEl) return;
    this._timeEl.textContent = this._formatTime(this._remaining);
    this._timeEl.classList.toggle('finished', this._finished);
  },

  /**
   * Button-States aktualisieren
   */
  _updateControls() {
    if (this._btnStart) {
      this._btnStart.disabled = this._running;
      this._btnStart.textContent = this._finished ? 'Neustart' : 'Start';
    }
    if (this._btnPause) {
      this._btnPause.disabled = !this._running;
    }
  },

  // ---- PRESETS ----

  /**
   * Preset hinzufuegen
   * @param {string} name
   * @param {number} seconds
   */
  async _addPreset(name, seconds) {
    if (this._presets.length >= this.MAX_PRESETS) return;
    this._presets.push({ name, seconds });
    await this.save();
  },

  /**
   * Preset loeschen
   * @param {number} index
   */
  async _deletePreset(index) {
    this._presets.splice(index, 1);
    await this.save();
  },

  /**
   * Preset laden (Zeit setzen)
   * @param {Object} preset - { name, seconds }
   */
  _loadPreset(preset) {
    // Falls laufend, erst stoppen
    this._stopCountdown();
    this._stopAlarm();
    this._running = false;
    this._finished = false;

    this._seconds = preset.seconds;
    this._remaining = preset.seconds;

    if (this._inputRow) this._inputRow.style.display = 'none';

    this._updateDisplay();
    this._updateControls();
  },

  // ---- FORMATTING ----

  /**
   * Sekunden in Zeitformat umwandeln
   * @param {number} totalSeconds
   * @returns {string} "05:30" oder "1:05:30"
   */
  _formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');

    if (h > 0) {
      return h + ':' + mm + ':' + ss;
    }
    return mm + ':' + ss;
  },

  /**
   * Zeit-String in Sekunden parsen
   * Akzeptiert: "5:30", "05:30", "1:05:30", "90" (Sekunden)
   * @param {string} str
   * @returns {number}
   */
  _parseTimeInput(str) {
    const trimmed = (str || '').trim();
    if (!trimmed) return 0;

    const parts = trimmed.split(':');

    if (parts.length === 1) {
      // Nur Zahl = Sekunden
      const secs = parseInt(parts[0], 10);
      return isNaN(secs) ? 0 : Math.max(0, secs);
    }

    if (parts.length === 2) {
      // mm:ss
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (isNaN(m) || isNaN(s)) return 0;
      return Math.max(0, m * 60 + s);
    }

    if (parts.length === 3) {
      // hh:mm:ss
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
      return Math.max(0, h * 3600 + m * 60 + s);
    }

    return 0;
  },

  // ---- KEYBOARD ----

  /**
   * Tastatur-Events binden
   * @param {HTMLElement} widgetEl
   */
  _bindKeyboard(widgetEl) {
    this._unbindKeyboard();

    this._keydownHandler = (e) => {
      // Nicht reagieren wenn User in Input tippt
      if (e.target.tagName === 'INPUT') return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (this._running) {
          this._pause();
        } else if (this._remaining > 0) {
          this._start();
        }
      } else if (e.key === 'Escape' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        this._reset();
      }
    };

    widgetEl.addEventListener('keydown', this._keydownHandler);
    widgetEl.tabIndex = 0;
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
   * Timer initialisieren (aus app.js aufgerufen)
   */
  async init() {
    await this.load();

    // Wenn Timer beim letzten Mal offen war, wiederherstellen
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.timer && data.timer.open) {
      await this.open();
    }

    // Close-Event abfangen
    const origClose = WidgetManager.close.bind(WidgetManager);
    const self = this;
    const prevClose = WidgetManager.close;
    WidgetManager.close = function(id) {
      prevClose.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self.onClose();
      }
    };

    // Minimize-Event abfangen
    const prevMinimize = WidgetManager.minimize;
    WidgetManager.minimize = async function(id) {
      await prevMinimize.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self._isOpen = false;
        await self.save();
      }
    };

    // Open-Event abfangen
    const prevOpen = WidgetManager.openWidget;
    WidgetManager.openWidget = async function(id) {
      await prevOpen.call(WidgetManager, id);
      if (id === self.WIDGET_ID) {
        self._isOpen = true;
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
