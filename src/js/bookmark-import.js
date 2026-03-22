/* =============================================
   HELLION NEWTAB — bookmark-import.js
   Direkt-Import von Browser-Lesezeichen
   via chrome.bookmarks.getTree() / browser.bookmarks.getTree()
   ============================================= */

const BrowserBookmarkImport = {

  /** Initialisiert den Import-Button */
  init() {
    const btn = document.getElementById('btnBrowserImport');
    const row = document.getElementById('browserImportRow');
    if (!btn || !row) return;

    // API-Verfuegbarkeit pruefen (nicht vorhanden im normalen Browser-Tab)
    const api = this._getApi();
    if (!api) {
      row.style.display = 'none';
      return;
    }

    btn.addEventListener('click', () => this._openFolderModal());
  },

  /**
   * Gibt die Bookmarks-API zurueck (Chrome oder Firefox)
   * @returns {object|null}
   */
  _getApi() {
    if (typeof chrome !== 'undefined' && chrome.bookmarks) return chrome.bookmarks;
    if (typeof browser !== 'undefined' && browser.bookmarks) return browser.bookmarks;
    return null;
  },

  /** Oeffnet das Ordner-Auswahl Modal */
  async _openFolderModal() {
    const api = this._getApi();
    if (!api) return;

    let tree;
    try {
      tree = await api.getTree();
    } catch (err) {
      await HellionDialog.alert(
        'Zugriff auf Browser-Lesezeichen nicht möglich. Stelle sicher, dass die Extension die nötigen Berechtigungen hat.',
        { type: 'warning', title: 'Lesezeichen-Import' }
      );
      return;
    }

    const folders = this._extractFolders(tree[0]);
    if (folders.length === 0) {
      await HellionDialog.alert(
        'Keine Lesezeichen-Ordner gefunden.',
        { type: 'warning', title: 'Lesezeichen-Import' }
      );
      return;
    }

    this._renderModal(folders);
  },

  /**
   * Extrahiert alle Ordner rekursiv aus dem Bookmark-Baum
   * @param {object} node - Bookmark-Tree Node
   * @param {number} depth - Einrueckungstiefe
   * @returns {Array}
   */
  _extractFolders(node, depth) {
    if (depth === undefined) depth = 0;
    const result = [];

    if (!node.children) return result;

    for (const child of node.children) {
      if (child.children) {
        const bookmarkCount = child.children.filter(function(c) { return c.url; }).length;
        const subfolderCount = child.children.filter(function(c) { return c.children; }).length;

        result.push({
          id: child.id,
          title: child.title || 'Unbenannt',
          depth: depth,
          bookmarkCount: bookmarkCount,
          subfolderCount: subfolderCount,
          node: child
        });

        const subFolders = this._extractFolders(child, depth + 1);
        for (const sf of subFolders) {
          result.push(sf);
        }
      }
    }

    return result;
  },

  /**
   * Rendert das Ordner-Auswahl Modal
   * @param {Array} folders - Liste der Ordner
   */
  _renderModal(folders) {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'bm-import-overlay';
    overlay.id = 'bmImportOverlay';

    const modal = document.createElement('div');
    modal.className = 'bm-import-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'bm-import-header';

    const title = document.createElement('span');
    title.textContent = 'Browser-Lesezeichen importieren';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bm-import-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => this._closeModal());
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // Info
    const info = document.createElement('div');
    info.className = 'bm-import-info';
    info.textContent = 'Wähle die Ordner aus, die als Boards importiert werden sollen. Jeder Ordner wird ein eigenes Board.';
    modal.appendChild(info);

    // Ordner-Liste
    const list = document.createElement('div');
    list.className = 'bm-import-list';

    for (const folder of folders) {
      const row = document.createElement('label');
      row.className = 'bm-import-folder';
      row.style.paddingLeft = (12 + folder.depth * 20) + 'px';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'bm-import-checkbox';
      checkbox.dataset.folderId = folder.id;
      row.appendChild(checkbox);

      const label = document.createElement('span');
      label.className = 'bm-import-folder-name';
      label.textContent = folder.title;
      row.appendChild(label);

      const meta = document.createElement('span');
      meta.className = 'bm-import-folder-meta';
      const parts = [];
      if (folder.bookmarkCount > 0) {
        parts.push(folder.bookmarkCount + ' Link' + (folder.bookmarkCount !== 1 ? 's' : ''));
      }
      if (folder.subfolderCount > 0) {
        parts.push(folder.subfolderCount + ' Ordner');
      }
      if (parts.length === 0) {
        parts.push('leer');
      }
      meta.textContent = parts.join(', ');
      row.appendChild(meta);

      list.appendChild(row);
    }

    modal.appendChild(list);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'bm-import-footer';

    const selectAll = document.createElement('button');
    selectAll.className = 'btn-secondary';
    selectAll.textContent = 'Alle auswählen';
    selectAll.addEventListener('click', () => {
      const boxes = list.querySelectorAll('.bm-import-checkbox');
      const allChecked = Array.from(boxes).every(function(cb) { return cb.checked; });
      boxes.forEach(function(cb) { cb.checked = !allChecked; });
      selectAll.textContent = allChecked ? 'Alle auswählen' : 'Alle abwählen';
    });
    footer.appendChild(selectAll);

    const importBtn = document.createElement('button');
    importBtn.className = 'btn-primary';
    importBtn.textContent = 'Importieren';
    importBtn.addEventListener('click', () => this._importSelected(folders));
    footer.appendChild(importBtn);

    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animation
    requestAnimationFrame(() => overlay.classList.add('active'));
  },

  /** Schliesst das Modal */
  _closeModal() {
    const overlay = document.getElementById('bmImportOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 250);
  },

  /**
   * Importiert die ausgewaehlten Ordner als Boards
   * @param {Array} folders - Alle Ordner
   */
  async _importSelected(folders) {
    const checkboxes = document.querySelectorAll('.bm-import-checkbox:checked');
    if (checkboxes.length === 0) {
      await HellionDialog.alert(
        'Bitte wähle mindestens einen Ordner aus.',
        { type: 'warning', title: 'Lesezeichen-Import' }
      );
      return;
    }

    // Bestehende URLs sammeln fuer Duplikat-Erkennung
    const existingUrls = new Set();
    for (const board of boards) {
      for (const bm of board.bookmarks) {
        existingUrls.add(bm.url);
      }
    }

    const selectedIds = new Set();
    checkboxes.forEach(function(cb) { selectedIds.add(cb.dataset.folderId); });

    let totalImported = 0;
    let totalSkipped = 0;
    let boardsCreated = 0;

    for (const folder of folders) {
      if (!selectedIds.has(folder.id)) continue;

      const bookmarks = [];
      for (const child of folder.node.children) {
        if (!child.url) continue;

        // Nur http/https URLs
        try {
          const parsed = new URL(child.url);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;
        } catch (e) {
          continue;
        }

        // Duplikat-Check
        if (existingUrls.has(child.url)) {
          totalSkipped++;
          continue;
        }

        bookmarks.push({
          id: uid(),
          title: child.title || child.url,
          url: child.url,
          desc: ''
        });

        existingUrls.add(child.url);
        totalImported++;
      }

      if (bookmarks.length === 0) continue;

      boards.push({
        id: uid(),
        title: folder.title,
        bookmarks: bookmarks,
        blurred: false
      });
      boardsCreated++;
    }

    if (boardsCreated > 0) {
      await saveBoards();
      renderBoards();
    }

    this._closeModal();

    // Ergebnis-Dialog
    const lines = [];
    lines.push(boardsCreated + ' Board' + (boardsCreated !== 1 ? 's' : '') + ' erstellt');
    lines.push(totalImported + ' Lesezeichen importiert');
    if (totalSkipped > 0) {
      lines.push(totalSkipped + ' Duplikat' + (totalSkipped !== 1 ? 'e' : '') + ' übersprungen');
    }

    await HellionDialog.alert(
      lines.join('\n'),
      { type: 'success', title: 'Import abgeschlossen' }
    );
  }
};
