/* =============================================
   HELLION NEWTAB — widgets.js
   Widget-Manager: Registry, Drag, Resize, Z-Index, Persistierung
   ============================================= */

const WidgetManager = {
  /** @type {Map<string, {el: HTMLElement, type: string, state: Object}>} */
  _widgets: new Map(),
  _topZ: 51,
  STORAGE_KEY: 'widgetStates',

  /**
   * Widget erstellen und in DOM einfuegen
   * @param {string} type - 'note'
   * @param {Object} config - { id, title, x, y, width, height, open }
   * @returns {string} widget-id
   */
  create(type, config) {
    const id = config.id || ('widget_' + uid());
    const state = {
      id,
      type,
      title: config.title || 'Note',
      x: config.x || 120,
      y: config.y || 80,
      width: config.width || 280,
      height: config.height || 220,
      open: config.open !== false
    };

    const el = this._buildDOM(state);
    document.body.appendChild(el);

    this._widgets.set(id, { el, type, state });
    this._initDrag(el);
    this._initResize(el);
    this.bringToFront(id);

    return id;
  },

  /**
   * Widget-DOM erzeugen (createElement, kein innerHTML)
   * @param {Object} state
   * @returns {HTMLElement}
   */
  _buildDOM(state) {
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.widgetId = state.id;
    widget.style.left = state.x + 'px';
    widget.style.top = state.y + 'px';
    widget.style.width = state.width + 'px';
    widget.style.height = state.height + 'px';

    // Header
    const header = document.createElement('div');
    header.className = 'widget-header';

    const title = document.createElement('span');
    title.className = 'widget-title';
    title.textContent = state.title;

    // Doppelklick auf Titel zum Editieren
    title.addEventListener('dblclick', () => {
      title.contentEditable = 'true';
      title.focus();
      // Text selektieren
      const range = document.createRange();
      range.selectNodeContents(title);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    title.addEventListener('blur', async () => {
      title.contentEditable = 'false';
      const newTitle = title.textContent.trim().slice(0, 20);
      title.textContent = newTitle || 'Note';
      const entry = this._widgets.get(state.id);
      if (entry) {
        entry.state.title = title.textContent;
        await this.save();
      }
    });
    title.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        title.blur();
      }
    });

    const actions = document.createElement('div');
    actions.className = 'widget-actions';

    const btnMin = document.createElement('button');
    btnMin.className = 'widget-btn widget-minimize';
    btnMin.title = 'Minimieren';
    btnMin.textContent = '\u2500';
    btnMin.addEventListener('click', () => this.minimize(state.id));

    const btnClose = document.createElement('button');
    btnClose.className = 'widget-btn widget-close';
    btnClose.title = 'Schließen';
    btnClose.textContent = '\u2715';
    btnClose.addEventListener('click', () => this.close(state.id));

    actions.append(btnMin, btnClose);
    header.append(title, actions);

    // Body
    const body = document.createElement('div');
    body.className = 'widget-body';

    // Resize Handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'widget-resize-handle';

    widget.append(header, body, resizeHandle);

    // Klick auf Widget bringt es nach vorne
    widget.addEventListener('pointerdown', () => {
      this.bringToFront(state.id);
    });

    return widget;
  },

  /**
   * Widget-Body-Element holen
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  getBody(id) {
    const entry = this._widgets.get(id);
    if (!entry) return null;
    return entry.el.querySelector('.widget-body');
  },

  /**
   * Widget entfernen (endgueltig loeschen)
   * @param {string} id
   */
  close(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry.el.remove();
    this._widgets.delete(id);
  },

  /**
   * Widget minimieren (aus DOM verstecken, bleibt im Notebook)
   * @param {string} id
   */
  async minimize(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry.state.open = false;
    entry.el.classList.add('widget-minimized');
    setTimeout(() => {
      entry.el.style.display = 'none';
    }, 250);
    await this.save();
  },

  /**
   * Widget oeffnen (aus minimiertem Zustand wiederherstellen)
   * @param {string} id
   */
  async openWidget(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    entry.state.open = true;
    entry.el.style.display = 'flex';
    // Naechster Frame fuer Animation
    requestAnimationFrame(() => {
      entry.el.classList.remove('widget-minimized');
    });
    this.bringToFront(id);
    await this.save();
  },

  /**
   * Widget in den Vordergrund bringen
   * @param {string} id
   */
  bringToFront(id) {
    const entry = this._widgets.get(id);
    if (!entry) return;
    this._topZ++;
    entry.el.style.zIndex = this._topZ;
  },

  /**
   * Drag initialisieren (Pointer Events auf Header)
   * @param {HTMLElement} widgetEl
   */
  _initDrag(widgetEl) {
    const header = widgetEl.querySelector('.widget-header');
    const self = this;

    header.addEventListener('pointerdown', function onDown(e) {
      if (e.target.closest('.widget-btn') || e.target.closest('.widget-title[contenteditable="true"]')) return;
      e.preventDefault();
      header.setPointerCapture(e.pointerId);

      const rect = widgetEl.getBoundingClientRect();
      const offX = e.clientX - rect.left;
      const offY = e.clientY - rect.top;

      function onMove(ev) {
        const maxX = window.innerWidth - widgetEl.offsetWidth;
        const maxY = window.innerHeight - widgetEl.offsetHeight;
        widgetEl.style.left = Math.max(0, Math.min(maxX, ev.clientX - offX)) + 'px';
        widgetEl.style.top = Math.max(48, Math.min(maxY, ev.clientY - offY)) + 'px';
      }

      async function onUp() {
        header.releasePointerCapture(e.pointerId);
        header.removeEventListener('pointermove', onMove);
        header.removeEventListener('pointerup', onUp);
        // State aktualisieren
        const id = widgetEl.dataset.widgetId;
        const entry = self._widgets.get(id);
        if (entry) {
          entry.state.x = parseFloat(widgetEl.style.left);
          entry.state.y = parseFloat(widgetEl.style.top);
          await self.save();
        }
      }

      header.addEventListener('pointermove', onMove);
      header.addEventListener('pointerup', onUp);
    });
  },

  /**
   * Resize initialisieren (Pointer Events auf Handle)
   * @param {HTMLElement} widgetEl
   */
  _initResize(widgetEl) {
    const handle = widgetEl.querySelector('.widget-resize-handle');
    const self = this;

    handle.addEventListener('pointerdown', function onDown(e) {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);

      const startW = widgetEl.offsetWidth;
      const startH = widgetEl.offsetHeight;
      const startX = e.clientX;
      const startY = e.clientY;

      function onMove(ev) {
        widgetEl.style.width = Math.max(200, startW + (ev.clientX - startX)) + 'px';
        widgetEl.style.height = Math.max(150, startH + (ev.clientY - startY)) + 'px';
      }

      async function onUp() {
        handle.releasePointerCapture(e.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        const id = widgetEl.dataset.widgetId;
        const entry = self._widgets.get(id);
        if (entry) {
          entry.state.width = widgetEl.offsetWidth;
          entry.state.height = widgetEl.offsetHeight;
          await self.save();
        }
      }

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    });
  },

  /**
   * Alle Widget-States aus Storage laden und wiederherstellen
   * @param {Function} renderCallback - Funktion die den Body rendert (noteData, bodyEl)
   */
  async restore(renderCallback) {
    const data = await Store.get(this.STORAGE_KEY);
    if (!data || !Array.isArray(data.notes)) return;

    for (const noteData of data.notes) {
      const id = this.create('note', {
        id: noteData.id,
        title: noteData.title,
        x: noteData.x,
        y: noteData.y,
        width: noteData.width,
        height: noteData.height,
        open: noteData.open
      });

      // Body rendern lassen (von Notes-Modul)
      if (renderCallback) {
        const body = this.getBody(id);
        if (body) renderCallback(noteData, body);
      }

      // Falls minimiert, sofort verstecken
      if (!noteData.open) {
        const entry = this._widgets.get(id);
        if (entry) {
          entry.el.classList.add('widget-minimized');
          entry.el.style.display = 'none';
        }
      }
    }
  },

  /**
   * Alle Widget-States speichern
   */
  async save() {
    const notes = [];
    for (const [id, entry] of this._widgets) {
      if (entry.type === 'note') {
        notes.push({
          ...entry.state,
          // Zusaetzliche Note-Daten werden von Notes.save() ergaenzt
        });
      }
    }
    // Nicht direkt speichern — Notes-Modul merged die Daten
    return notes;
  },

  /**
   * Widget-State fuer eine bestimmte ID holen
   * @param {string} id
   * @returns {Object|null}
   */
  getState(id) {
    const entry = this._widgets.get(id);
    return entry ? entry.state : null;
  },

  /**
   * Pruefen ob Widget offen ist
   * @param {string} id
   * @returns {boolean}
   */
  isOpen(id) {
    const entry = this._widgets.get(id);
    return entry ? entry.state.open : false;
  },

  /**
   * Anzahl aller Widgets
   * @returns {number}
   */
  count() {
    return this._widgets.size;
  },

  /**
   * Alle Widget-IDs
   * @returns {string[]}
   */
  getAllIds() {
    return Array.from(this._widgets.keys());
  }
};
