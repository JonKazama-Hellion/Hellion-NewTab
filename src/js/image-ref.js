/* =============================================
   HELLION NEWTAB — image-ref.js
   Bild-Referenz Widget: Session-only Bildanzeige
   mit Canvas API WebP-Konvertierung
   ============================================= */

const ImageRef = {
  MAX_IMAGES: 3,
  STORAGE_KEY: 'widgetStates',
  SESSION_KEY: 'imageRefData',

  /** @type {Array<{id: string, label: string, x: number, y: number, width: number, height: number, open: boolean}>} */
  _images: [],
  _saveTimer: null,

  // ---- STORAGE (persistent: Position/Meta) ----

  /**
   * Widget-Meta aus persistentem Storage laden
   */
  async load() {
    const data = await Store.get(this.STORAGE_KEY);
    if (data && data.imageRef && Array.isArray(data.imageRef.images)) {
      this._images = data.imageRef.images;
    }
  },

  /**
   * Widget-Meta persistent speichern
   * Bestehende Notes, Calculator, Timer bleiben erhalten
   */
  async save() {
    const data = await Store.get(this.STORAGE_KEY) || {};
    if (data.notes === undefined) data.notes = [];

    // Positionen aus WidgetManager aktualisieren
    const updated = this._images.map(img => {
      const ws = WidgetManager.getState(img.id);
      if (ws) {
        img.x = ws.x;
        img.y = ws.y;
        img.width = ws.width;
        img.height = ws.height;
        img.open = ws.open;
      }
      return img;
    });

    data.imageRef = { images: updated };
    await Store.set(this.STORAGE_KEY, data);
  },

  /**
   * Debounced Save
   */
  _debouncedSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.save(), 500);
  },

  // ---- SESSION STORAGE (Bilddaten) ----

  /**
   * Bilddaten in sessionStorage speichern
   */
  _saveSession() {
    try {
      const sessionData = {};
      this._images.forEach(img => {
        const dataUrl = this._getSessionImage(img.id);
        if (dataUrl) sessionData[img.id] = dataUrl;
      });
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('ImageRef: sessionStorage Write fehlgeschlagen', e);
    }
  },

  /**
   * Bilddaten aus sessionStorage laden
   * @returns {Object} - { id: dataUrl, ... }
   */
  _loadSessionAll() {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      console.warn('ImageRef: sessionStorage Read fehlgeschlagen', e);
      return {};
    }
  },

  /**
   * Einzelnes Bild aus sessionStorage lesen
   * @param {string} id
   * @returns {string|null}
   */
  _getSessionImage(id) {
    const all = this._loadSessionAll();
    return all[id] || null;
  },

  /**
   * Einzelnes Bild in sessionStorage setzen
   * @param {string} id
   * @param {string} dataUrl
   */
  _setSessionImage(id, dataUrl) {
    try {
      const all = this._loadSessionAll();
      all[id] = dataUrl;
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('ImageRef: sessionStorage Write fehlgeschlagen', e);
      HellionDialog.alert(
        t('imageref.storage_error'),
        { type: 'danger', title: t('imageref.storage_error.title') }
      );
    }
  },

  /**
   * Einzelnes Bild aus sessionStorage entfernen
   * @param {string} id
   */
  _removeSessionImage(id) {
    try {
      const all = this._loadSessionAll();
      delete all[id];
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('ImageRef: sessionStorage Remove fehlgeschlagen', e);
    }
  },

  // ---- WIDGET LIFECYCLE ----

  /**
   * Neues Bild-Widget erstellen (oeffnet File-Dialog)
   */
  async create() {
    if (!settings.imageRefEnabled) return;

    if (this._images.length >= this.MAX_IMAGES) {
      await HellionDialog.alert(
        t('imageref.limit', { max: this.MAX_IMAGES }),
        { type: 'warning', title: t('imageref.limit.title') }
      );
      return;
    }

    // Freie ID finden
    const usedIds = new Set(this._images.map(i => i.id));
    let slotId = null;
    for (let i = 0; i < this.MAX_IMAGES; i++) {
      const candidate = 'image_' + i;
      if (!usedIds.has(candidate)) {
        slotId = candidate;
        break;
      }
    }
    if (!slotId) return;

    // File-Dialog
    const file = await this._pickFile();
    if (!file) return;

    // Bild verarbeiten
    let dataUrl;
    try {
      dataUrl = await this._processFile(file);
    } catch (err) {
      await HellionDialog.alert(
        t('imageref.load_error', { error: err.message }),
        { type: 'danger', title: t('imageref.load_error.title') }
      );
      return;
    }

    // In sessionStorage speichern
    this._setSessionImage(slotId, dataUrl);

    // Meta erstellen
    const imageData = {
      id: slotId,
      label: '',
      x: 200 + (this._images.length * 40),
      y: 120 + (this._images.length * 30),
      width: 320,
      height: 280,
      open: true
    };
    this._images.push(imageData);

    // Widget erstellen
    this._createWidget(imageData, dataUrl);
    await this.save();
  },

  /**
   * Widget im DOM erstellen
   * @param {Object} imageData
   * @param {string|null} dataUrl
   */
  _createWidget(imageData, dataUrl) {
    WidgetManager.create('image', {
      id: imageData.id,
      title: imageData.label || t('imageref.title'),
      x: imageData.x,
      y: imageData.y,
      width: imageData.width,
      height: imageData.height,
      open: imageData.open !== false
    });

    const body = WidgetManager.getBody(imageData.id);
    if (body) this.renderBody(imageData, body, dataUrl);
  },

  /**
   * Widget geschlossen — Daten aufraeumen
   * @param {string} id
   */
  async onClose(id) {
    this._removeSessionImage(id);
    this._images = this._images.filter(img => img.id !== id);
    await this.save();
  },

  // ---- UI RENDERING ----

  /**
   * Widget-Body rendern
   * @param {Object} imageData
   * @param {HTMLElement} bodyEl
   * @param {string|null} dataUrl
   */
  renderBody(imageData, bodyEl, dataUrl) {
    bodyEl.textContent = '';
    const container = document.createElement('div');
    container.className = 'imgref-container';

    if (dataUrl) {
      // Bild anzeigen
      const wrapper = document.createElement('div');
      wrapper.className = 'imgref-img-wrapper';

      const img = document.createElement('img');
      img.className = 'imgref-img';
      img.src = dataUrl;
      img.alt = imageData.label || t('imageref.title');
      wrapper.appendChild(img);

      // Bild ersetzen Button
      const replaceBtn = document.createElement('button');
      replaceBtn.className = 'imgref-replace-btn';
      replaceBtn.type = 'button';
      replaceBtn.textContent = t('imageref.replace');
      replaceBtn.addEventListener('click', async () => {
        const file = await this._pickFile();
        if (!file) return;
        try {
          const newDataUrl = await this._processFile(file);
          this._setSessionImage(imageData.id, newDataUrl);
          this.renderBody(imageData, bodyEl, newDataUrl);
        } catch (err) {
          await HellionDialog.alert(
            t('imageref.load_error', { error: err.message }),
            { type: 'danger', title: t('imageref.load_error.title') }
          );
        }
      });

      container.append(wrapper, replaceBtn);
    } else {
      // Drop-Zone (kein Bild vorhanden)
      const dropzone = this._createDropzone(imageData, bodyEl);
      container.appendChild(dropzone);
    }

    // Label-Input
    const label = document.createElement('input');
    label.className = 'imgref-label';
    label.type = 'text';
    label.placeholder = t('imageref.label_placeholder');
    label.maxLength = 100;
    label.value = imageData.label || '';

    label.addEventListener('input', () => {
      const text = label.value.trim().slice(0, 100);
      imageData.label = text;

      // Widget-Titel aktualisieren
      const entry = WidgetManager._widgets.get(imageData.id);
      if (entry) {
        const titleEl = entry.el.querySelector('.widget-title');
        if (titleEl) titleEl.textContent = text || t('imageref.title');
        entry.state.title = text || t('imageref.title');
      }

      this._debouncedSave();
    });

    container.appendChild(label);
    bodyEl.appendChild(container);
  },

  /**
   * Drop-Zone erstellen (fuer leere Widgets / neue Bilder)
   * @param {Object} imageData
   * @param {HTMLElement} bodyEl
   * @returns {HTMLElement}
   */
  _createDropzone(imageData, bodyEl) {
    const dropzone = document.createElement('div');
    dropzone.className = 'imgref-dropzone';

    const icon = document.createElement('div');
    icon.className = 'imgref-dropzone-icon';
    icon.textContent = '\uD83D\uDDBC\uFE0F';

    const text = document.createElement('span');
    text.textContent = t('imageref.dropzone');

    dropzone.append(icon, text);

    // Klick -> File-Dialog
    dropzone.addEventListener('click', async () => {
      const file = await this._pickFile();
      if (!file) return;
      try {
        const dataUrl = await this._processFile(file);
        this._setSessionImage(imageData.id, dataUrl);
        this.renderBody(imageData, bodyEl, dataUrl);
        await this.save();
      } catch (err) {
        await HellionDialog.alert(
          t('imageref.load_error', { error: err.message }),
          { type: 'danger', title: t('imageref.load_error.title') }
        );
      }
    });

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');

      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) {
        await HellionDialog.alert(
          t('imageref.invalid_file'),
          { type: 'warning', title: t('imageref.invalid_file.title') }
        );
        return;
      }

      try {
        const dataUrl = await this._processFile(file);
        this._setSessionImage(imageData.id, dataUrl);
        this.renderBody(imageData, bodyEl, dataUrl);
        await this.save();
      } catch (err) {
        await HellionDialog.alert(
          t('imageref.load_error', { error: err.message }),
          { type: 'danger', title: t('imageref.load_error.title') }
        );
      }
    });

    return dropzone;
  },

  // ---- FILE HANDLING ----

  /**
   * File-Dialog oeffnen
   * @returns {Promise<File|null>}
   */
  _pickFile() {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', () => {
        resolve(input.files[0] || null);
      });
      // Cancel erkennen
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
  },

  /**
   * Bild per Canvas API zu WebP konvertieren
   * @param {File} file
   * @returns {Promise<string>} WebP DataURL
   */
  _processFile(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const webpUrl = canvas.toDataURL('image/webp', 0.85);
          URL.revokeObjectURL(objectUrl);
          resolve(webpUrl);
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(t('imageref.load_error', { error: 'unknown' })));
      };

      img.src = objectUrl;
    });
  },

  // ---- INIT ----

  /**
   * ImageRef initialisieren (aus app.js aufgerufen)
   */
  async init() {
    await this.load();

    // Widgets wiederherstellen (nur wenn Feature aktiviert)
    if (settings.imageRefEnabled && this._images.length > 0) {
      const sessionData = this._loadSessionAll();

      this._images.forEach(imageData => {
        if (imageData.open !== false) {
          const dataUrl = sessionData[imageData.id] || null;
          this._createWidget(imageData, dataUrl);
        }
      });
    }

    // Widget-Lifecycle-Events
    const self = this;
    WidgetManager.on('widget:close', (e) => {
      const isImage = self._images.some(img => img.id === e.detail.id);
      if (isImage) {
        self.onClose(e.detail.id);
      }
    });

    WidgetManager.on('widget:minimize', (e) => {
      const isImage = self._images.some(img => img.id === e.detail.id);
      if (isImage) {
        self.save();
      }
    });

    WidgetManager.on('widget:open', (e) => {
      const imgData = self._images.find(img => img.id === e.detail.id);
      if (imgData) {
        const body = WidgetManager.getBody(e.detail.id);
        if (body && body.children.length === 0) {
          const dataUrl = self._getSessionImage(e.detail.id);
          self.renderBody(imgData, body, dataUrl);
        }
        self.save();
      }
    });
  }
};
