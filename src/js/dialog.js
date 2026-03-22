/* =============================================
   HELLION NEWTAB — dialog.js
   Custom Dialog System (ersetzt native alert/confirm)
   ============================================= */

const HellionDialog = {
  /** SVG-Icons je nach Dialog-Typ */
  _icons: {
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    danger: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
  },

  /**
   * Erzeugt das SVG-Icon-Element
   * @param {string} type - info | success | warning | danger
   * @returns {SVGElement}
   */
  _createIcon(type) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.className.baseVal = 'dialog-icon type-' + type;
    // SVG-Pfade müssen per innerHTML gesetzt werden (kein User-Input, nur statische Pfade)
    svg.innerHTML = this._icons[type] || this._icons.info;
    return svg;
  },

  /**
   * Erstellt und zeigt einen Dialog
   * @param {Object} config
   * @returns {Promise<boolean>}
   */
  _show(config) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'dialog-overlay';

      const box = document.createElement('div');
      box.className = 'dialog-box';

      // Header
      const header = document.createElement('div');
      header.className = 'dialog-header';
      header.appendChild(this._createIcon(config.type));
      const titleSpan = document.createElement('span');
      titleSpan.textContent = config.title;
      header.appendChild(titleSpan);

      // Body
      const body = document.createElement('div');
      body.className = 'dialog-body';
      body.textContent = config.message;

      // Actions
      const actions = document.createElement('div');
      actions.className = 'dialog-actions';

      function cleanup(result) {
        overlay.classList.remove('active');
        document.removeEventListener('keydown', keyHandler);
        setTimeout(() => overlay.remove(), 200);
        resolve(result);
      }

      // Cancel-Button (nur bei confirm)
      if (config.isConfirm) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = config.cancelText;
        cancelBtn.addEventListener('click', () => cleanup(false));
        actions.appendChild(cancelBtn);
      }

      // Confirm/OK-Button
      const confirmBtn = document.createElement('button');
      confirmBtn.className = config.type === 'danger' && config.isConfirm ? 'btn-danger' : 'btn-primary';
      confirmBtn.textContent = config.confirmText;
      confirmBtn.addEventListener('click', () => cleanup(config.isConfirm ? true : undefined));
      actions.appendChild(confirmBtn);

      box.append(header, body, actions);
      overlay.appendChild(box);

      // Overlay-Klick schließt
      overlay.addEventListener('click', e => {
        if (e.target === overlay) cleanup(config.isConfirm ? false : undefined);
      });

      // Keyboard
      function keyHandler(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          cleanup(config.isConfirm ? true : undefined);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cleanup(config.isConfirm ? false : undefined);
        }
      }
      document.addEventListener('keydown', keyHandler);

      document.body.appendChild(overlay);
      // Nächster Frame für CSS-Transition
      requestAnimationFrame(() => {
        overlay.classList.add('active');
        confirmBtn.focus();
      });
    });
  },

  /**
   * Zeigt einen Alert-Dialog (ersetzt window.alert)
   * @param {string} message - Nachricht
   * @param {Object} [options] - { title, confirmText, type }
   * @returns {Promise<void>}
   */
  alert(message, options) {
    const opts = options || {};
    return this._show({
      message,
      title: opts.title || t('dialog.default_title'),
      confirmText: opts.confirmText || 'OK',
      cancelText: '',
      type: opts.type || 'info',
      isConfirm: false
    });
  },

  /**
   * Zeigt einen Confirm-Dialog (ersetzt window.confirm)
   * @param {string} message - Nachricht
   * @param {Object} [options] - { title, confirmText, cancelText, type }
   * @returns {Promise<boolean>}
   */
  confirm(message, options) {
    const opts = options || {};
    return this._show({
      message,
      title: opts.title || t('dialog.confirm_title'),
      confirmText: opts.confirmText || 'OK',
      cancelText: opts.cancelText || t('dialog.cancel'),
      type: opts.type || 'info',
      isConfirm: true
    });
  }
};
