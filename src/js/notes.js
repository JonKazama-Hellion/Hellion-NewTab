/* =============================================
   HELLION NEWTAB — notes.js
   Notes: Freitext, Checklisten, Notebook-Sidebar
   ============================================= */

const Notes = {
  MAX_NOTES: 5,
  MAX_CHARS: 2500,
  STORAGE_KEY: 'widgetStates',
  /** @type {Array<Object>} */
  _notes: [],
  _saveTimer: null,

  /**
   * Notes aus Storage laden
   * @returns {Promise<Array>}
   */
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && Array.isArray(data.notes)) {
      this._notes = data.notes;
    }
    return this._notes;
  },

  /**
   * Alle Notes in Storage speichern
   */
  async save() {
    // Widget-States mit Note-Daten mergen
    const widgetStates = WidgetManager.save ? await WidgetManager.save() : [];

    // Note-Daten mit aktuellen Widget-Positionen mergen
    const merged = this._notes.map(note => {
      const ws = widgetStates.find(w => w.id === note.id);
      if (ws) {
        note.x = ws.x;
        note.y = ws.y;
        note.width = ws.width;
        note.height = ws.height;
        note.open = ws.open;
        note.title = ws.title;
      }
      return note;
    });

    // Calculator- und Timer-State beibehalten falls vorhanden
    const existing = await Store.get(this.STORAGE_KEY);
    const saveData = { notes: merged };
    if (existing && existing.calculator) {
      saveData.calculator = existing.calculator;
    }
    if (existing && existing.timer) {
      saveData.timer = existing.timer;
    }
    await Store.set(this.STORAGE_KEY, saveData);
  },

  /**
   * Debounced Save (fuer Auto-Save bei Input)
   */
  _debouncedSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), 500);
  },

  /**
   * Neue Note erstellen
   * @param {'text'|'checklist'} template
   * @returns {Promise<string|null>} widget-id oder null bei vollem Limit
   */
  async create(template) {
    if (this._notes.length >= this.MAX_NOTES) {
      await HellionDialog.alert(
        'Maximale Anzahl erreicht! Du kannst maximal ' + this.MAX_NOTES + ' Notes gleichzeitig haben. Lösche eine bestehende Note um eine neue zu erstellen.',
        { type: 'warning', title: 'Limit erreicht' }
      );
      return null;
    }

    const noteData = {
      id: 'note_' + uid(),
      title: template === 'checklist' ? 'Checkliste' : 'Note',
      content: '',
      template: template,
      x: 120 + (this._notes.length * 30),
      y: 80 + (this._notes.length * 30),
      width: 280,
      height: 220,
      open: true,
      checkedItems: [],
      checklistItems: []
    };

    this._notes.push(noteData);

    // Widget erstellen
    const widgetId = WidgetManager.create('note', {
      id: noteData.id,
      title: noteData.title,
      x: noteData.x,
      y: noteData.y,
      width: noteData.width,
      height: noteData.height,
      open: true
    });

    // Body rendern
    const body = WidgetManager.getBody(widgetId);
    if (body) this.renderBody(noteData, body);

    await this.save();
    return widgetId;
  },

  /**
   * Note-Body rendern (in Widget-Body einfuegen)
   * @param {Object} noteData
   * @param {HTMLElement} bodyEl
   */
  renderBody(noteData, bodyEl) {
    bodyEl.textContent = '';
    if (noteData.template === 'checklist') {
      this._renderChecklistBody(noteData, bodyEl);
    } else {
      this._renderTextBody(noteData, bodyEl);
    }
  },

  /**
   * Freitext-Body: Textarea mit Zeichenzaehler
   * @param {Object} noteData
   * @param {HTMLElement} bodyEl
   */
  _renderTextBody(noteData, bodyEl) {
    const textarea = document.createElement('textarea');
    textarea.className = 'widget-textarea';
    textarea.placeholder = 'Notiz schreiben...';
    textarea.spellcheck = false;
    textarea.value = noteData.content || '';
    textarea.maxLength = this.MAX_CHARS;

    const counter = document.createElement('span');
    counter.className = 'widget-char-count';
    counter.textContent = (noteData.content || '').length + ' / ' + this.MAX_CHARS;

    textarea.addEventListener('input', () => {
      noteData.content = textarea.value;
      const len = textarea.value.length;
      counter.textContent = len + ' / ' + this.MAX_CHARS;
      counter.classList.toggle('limit', len >= this.MAX_CHARS);

      // Auto-Titel aus erster Zeile
      const firstLine = textarea.value.split('\n')[0].trim().slice(0, 20);
      if (firstLine) {
        noteData.title = firstLine;
        const widgetEntry = WidgetManager._widgets.get(noteData.id);
        if (widgetEntry) {
          const titleEl = widgetEntry.el.querySelector('.widget-title');
          if (titleEl && titleEl.contentEditable !== 'true') {
            titleEl.textContent = firstLine;
          }
          widgetEntry.state.title = firstLine;
        }
      }

      this._debouncedSave();
    });

    bodyEl.append(textarea, counter);
  },

  /**
   * Checklisten-Body: Items mit Checkboxen
   * @param {Object} noteData
   * @param {HTMLElement} bodyEl
   */
  _renderChecklistBody(noteData, bodyEl) {
    const list = document.createElement('ul');
    list.className = 'widget-checklist';

    // Bestehende Items rendern
    if (!Array.isArray(noteData.checklistItems)) {
      noteData.checklistItems = [];
    }

    const renderItems = () => {
      list.textContent = '';
      noteData.checklistItems.forEach((item, idx) => {
        const li = this._createChecklistItem(noteData, item, idx, renderItems);
        list.appendChild(li);
      });
    };

    renderItems();

    // Eingabefeld fuer neue Items
    const addRow = document.createElement('div');
    addRow.className = 'checklist-add';

    const addInput = document.createElement('input');
    addInput.className = 'checklist-add-input';
    addInput.type = 'text';
    addInput.placeholder = 'Neues Item...';
    addInput.maxLength = 100;

    addInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const text = addInput.value.trim();
        if (!text) return;
        noteData.checklistItems.push({ text, checked: false });
        addInput.value = '';
        renderItems();
        this._updateChecklistContent(noteData);
        await this.save();
      }
    });

    addRow.appendChild(addInput);
    bodyEl.append(list, addRow);
  },

  /**
   * Einzelnes Checklisten-Item erstellen
   * @param {Object} noteData
   * @param {Object} item - { text, checked }
   * @param {number} idx
   * @param {Function} rerenderFn
   * @returns {HTMLElement}
   */
  _createChecklistItem(noteData, item, idx, rerenderFn) {
    const li = document.createElement('li');
    li.className = 'checklist-item' + (item.checked ? ' checked' : '');

    const checkbox = document.createElement('span');
    checkbox.className = 'checklist-checkbox';
    checkbox.textContent = item.checked ? '\u2713' : '';
    checkbox.addEventListener('click', async () => {
      item.checked = !item.checked;
      li.classList.toggle('checked', item.checked);
      checkbox.textContent = item.checked ? '\u2713' : '';
      this._updateChecklistContent(noteData);
      await this.save();
    });

    const text = document.createElement('span');
    text.className = 'checklist-text';
    text.textContent = item.text;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'checklist-remove';
    removeBtn.textContent = '\u2715';
    removeBtn.addEventListener('click', async () => {
      noteData.checklistItems.splice(idx, 1);
      rerenderFn();
      this._updateChecklistContent(noteData);
      await this.save();
    });

    li.append(checkbox, text, removeBtn);
    return li;
  },

  /**
   * Checklisten-Content fuer Export/Vorschau aktualisieren
   * @param {Object} noteData
   */
  _updateChecklistContent(noteData) {
    const total = noteData.checklistItems.length;
    const done = noteData.checklistItems.filter(i => i.checked).length;
    noteData.content = noteData.checklistItems.map(i => (i.checked ? '[x] ' : '[ ] ') + i.text).join('\n');

    // Auto-Titel: "X/Y erledigt" falls kein manueller Titel
    const widgetEntry = WidgetManager._widgets.get(noteData.id);
    if (widgetEntry) {
      const defaultTitle = done + '/' + total + ' erledigt';
      const titleEl = widgetEntry.el.querySelector('.widget-title');
      if (titleEl && titleEl.contentEditable !== 'true') {
        // Nur wenn Titel noch Standard ist
        if (noteData.title === 'Checkliste' || /^\d+\/\d+ erledigt$/.test(noteData.title)) {
          noteData.title = defaultTitle;
          titleEl.textContent = defaultTitle;
          widgetEntry.state.title = defaultTitle;
        }
      }
    }
  },

  /**
   * Note anhand ID finden
   * @param {string} id
   * @returns {Object|null}
   */
  getNote(id) {
    return this._notes.find(n => n.id === id) || null;
  },

  /**
   * Note loeschen
   * @param {string} id
   */
  async deleteNote(id) {
    const idx = this._notes.findIndex(n => n.id === id);
    if (idx === -1) return;

    const ok = await HellionDialog.confirm(
      'Note endgültig löschen? Das kann nicht rückgängig gemacht werden.',
      { type: 'danger', title: 'Note löschen', confirmText: 'Löschen' }
    );
    if (!ok) return;

    this._notes.splice(idx, 1);
    WidgetManager.close(id);
    await this.save();
  },

  /**
   * Note als .md exportieren
   * @param {Object} noteData
   */
  exportNote(noteData) {
    let md = '# ' + noteData.title + '\n\n';
    if (noteData.template === 'checklist') {
      noteData.checklistItems.forEach(item => {
        md += (item.checked ? '- [x] ' : '- [ ] ') + item.text + '\n';
      });
    } else {
      md += noteData.content || '';
    }
    md += '\n\n---\n*Exportiert aus Hellion Dashboard*\n';

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (noteData.title || 'note').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_') + '.md';
    a.click();
    URL.revokeObjectURL(url);
  },

  // ---- NOTEBOOK SIDEBAR ----

  /**
   * Notebook-Sidebar oeffnen
   */
  openNotebook() {
    const overlay = document.getElementById('notebookOverlay');
    const panel = document.getElementById('notebookPanel');
    if (overlay) overlay.classList.add('active');
    if (panel) panel.classList.add('open');
    this._renderNotebookSlots();
  },

  /**
   * Notebook-Sidebar schliessen
   */
  closeNotebook() {
    const overlay = document.getElementById('notebookOverlay');
    const panel = document.getElementById('notebookPanel');
    if (overlay) overlay.classList.remove('active');
    if (panel) panel.classList.remove('open');
  },

  /**
   * Notebook-Slots rendern
   */
  _renderNotebookSlots() {
    const container = document.getElementById('notebookSlots');
    const countEl = document.getElementById('notebookCount');
    if (!container) return;

    container.textContent = '';
    if (countEl) countEl.textContent = this._notes.length + ' / ' + this.MAX_NOTES;

    // Belegte Slots
    this._notes.forEach(note => {
      const slot = this._createNotebookSlot(note);
      container.appendChild(slot);
    });

    // Leere Slots
    const remaining = this.MAX_NOTES - this._notes.length;
    for (let i = 0; i < remaining; i++) {
      const emptySlot = this._createEmptySlot();
      container.appendChild(emptySlot);
    }
  },

  /**
   * Belegten Notebook-Slot erstellen
   * @param {Object} note
   * @returns {HTMLElement}
   */
  _createNotebookSlot(note) {
    const slot = document.createElement('div');
    slot.className = 'notebook-slot';

    // Header
    const header = document.createElement('div');
    header.className = 'notebook-slot-header';

    const title = document.createElement('span');
    title.className = 'notebook-slot-title';

    const typeIcon = document.createElement('span');
    typeIcon.className = 'notebook-slot-type';
    typeIcon.textContent = note.template === 'checklist' ? '\u2611' : '\u270E';
    title.append(typeIcon);
    title.append(document.createTextNode(' ' + note.title));

    header.appendChild(title);

    // Preview
    const preview = document.createElement('div');
    preview.className = 'notebook-slot-preview';
    if (note.template === 'checklist') {
      const total = note.checklistItems ? note.checklistItems.length : 0;
      const done = note.checklistItems ? note.checklistItems.filter(i => i.checked).length : 0;
      preview.textContent = done + '/' + total + ' erledigt';
    } else {
      preview.textContent = (note.content || '').slice(0, 50) || 'Leer';
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'notebook-slot-actions';

    const btnExport = document.createElement('button');
    btnExport.className = 'notebook-slot-btn';
    btnExport.textContent = 'Export';
    btnExport.addEventListener('click', (e) => {
      e.stopPropagation();
      this.exportNote(note);
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'notebook-slot-btn danger';
    btnDelete.textContent = '\uD83D\uDDD1';
    btnDelete.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.deleteNote(note.id);
      this._renderNotebookSlots();
    });

    actions.append(btnExport, btnDelete);
    slot.append(header, preview, actions);

    // Klick oeffnet Note als Widget
    slot.addEventListener('click', async () => {
      if (WidgetManager.isOpen(note.id)) {
        WidgetManager.bringToFront(note.id);
      } else {
        await WidgetManager.openWidget(note.id);
      }
      this.closeNotebook();
    });

    return slot;
  },

  /**
   * Leeren Notebook-Slot erstellen
   * @returns {HTMLElement}
   */
  _createEmptySlot() {
    const slot = document.createElement('div');
    slot.className = 'notebook-slot-empty';

    const label = document.createElement('span');
    label.textContent = '+ Note erstellen';
    slot.appendChild(label);

    // Klick zeigt Typ-Auswahl
    let chooserOpen = false;
    slot.addEventListener('click', () => {
      if (chooserOpen) return;
      chooserOpen = true;
      label.style.display = 'none';

      const chooser = document.createElement('div');
      chooser.className = 'notebook-type-chooser';

      const btnText = document.createElement('button');
      btnText.className = 'notebook-type-btn';
      btnText.textContent = '\u270E Freitext';
      btnText.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.create('text');
        this._renderNotebookSlots();
      });

      const btnCheck = document.createElement('button');
      btnCheck.className = 'notebook-type-btn';
      btnCheck.textContent = '\u2611 Checkliste';
      btnCheck.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.create('checklist');
        this._renderNotebookSlots();
      });

      chooser.append(btnText, btnCheck);
      slot.appendChild(chooser);
    });

    return slot;
  },

  // ---- TOOLBAR EVENTS ----

  /**
   * Widget-Toolbar initialisieren
   */
  initToolbar() {
    const toolbar = document.getElementById('widgetToolbar');
    if (!toolbar) return;

    toolbar.addEventListener('click', async (e) => {
      const btn = e.target.closest('.widget-toolbar-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'new-note') {
        await this.create('text');
      } else if (action === 'new-checklist') {
        await this.create('checklist');
      } else if (action === 'calculator') {
        Calculator.toggle();
      } else if (action === 'timer') {
        Timer.toggle();
      } else if (action === 'notebook') {
        this.openNotebook();
      }
    });
  },

  // ---- INIT ----

  /**
   * Notes-System initialisieren (ersetzt initStickyNote)
   */
  async init() {
    await this.load();

    // Widgets wiederherstellen
    await WidgetManager.restore((noteData, bodyEl) => {
      this.renderBody(noteData, bodyEl);
    });

    // Toolbar initialisieren
    this.initToolbar();

    // Notebook-Sidebar Events
    const notebookOverlay = document.getElementById('notebookOverlay');
    if (notebookOverlay) {
      notebookOverlay.addEventListener('click', () => this.closeNotebook());
    }
    const btnCloseNotebook = document.getElementById('btnCloseNotebook');
    if (btnCloseNotebook) {
      btnCloseNotebook.addEventListener('click', () => this.closeNotebook());
    }

    // Header btnNote oeffnet Notebook
    const btnNote = document.getElementById('btnNote');
    if (btnNote) {
      btnNote.addEventListener('click', () => this.openNotebook());
    }
  }
};
