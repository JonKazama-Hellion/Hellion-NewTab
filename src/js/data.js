/* =============================================
   HELLION NEWTAB — data.js
   JSON Export / Import (Backup & Restore)
   ============================================= */

function initDataButtons() {
  const btnExport = document.getElementById('btnExportJSON');
  const btnImport = document.getElementById('btnImportJSON');
  const jsonInput = document.getElementById('jsonImportInput');
  if (!btnExport || !btnImport) return;

  /**
   * Prueft ob eine URL ein sicheres Protokoll hat.
   * Blockiert javascript:, data:, vbscript: etc.
   * @param {string} url
   * @returns {boolean}
   */
  function isSafeUrl(url) {
    try {
      const u = new URL(url);
      return ['http:', 'https:', 'ftp:'].includes(u.protocol);
    } catch {
      return false;
    }
  }

  // Export (inkl. Notes)
  btnExport.addEventListener('click', async () => {
    const widgetData = await Store.get('widgetStates');
    const data = {
      version: '2.0.1',
      exported: new Date().toISOString(),
      boards,
      settings,
      notes: widgetData && Array.isArray(widgetData.notes) ? widgetData.notes : [],
      calculator: widgetData && widgetData.calculator ? widgetData.calculator.history || [] : [],
      timerPresets: widgetData && widgetData.timer ? widgetData.timer.presets || [] : []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `hellion-newtab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  btnImport.addEventListener('click', () => jsonInput.click());
  jsonInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.boards)) throw new Error(t('data.invalid_format'));
      const validBoards = data.boards
        .filter(b => b && typeof b.title === 'string' && Array.isArray(b.bookmarks))
        .map(b => ({
          id: b.id || uid(),
          title: String(b.title).slice(0, 100),
          blurred: !!b.blurred,
          bookmarks: b.bookmarks
            .filter(bm => bm && typeof bm.title === 'string' && isSafeUrl(bm.url))
            .map(bm => ({
              id: bm.id || uid(),
              title: String(bm.title).slice(0, 200),
              url: bm.url,
              desc: String(bm.desc || '').slice(0, 500)
            }))
        }));
      if (validBoards.length === 0) throw new Error(t('data.no_boards'));
      const ok = await HellionDialog.confirm(
        t('data.import_confirm', { count: validBoards.length }),
        { type: 'info', title: t('data.import_confirm.title') }
      );
      if (!ok) return;
      boards = [...boards, ...validBoards];
      await saveBoards();
      renderBoards();

      // Notes importieren (falls vorhanden)
      let notesImported = 0;
      const existingWidgets = await Store.get('widgetStates') || {};
      if (Array.isArray(data.notes) && data.notes.length > 0) {
        const existingNotes = Array.isArray(existingWidgets.notes) ? existingWidgets.notes : [];
        const importNotes = data.notes
          .filter(n => n && n.id && n.template)
          .map(n => ({
            id: n.id,
            template: ['note', 'checklist'].includes(n.template) ? n.template : 'note',
            title: String(n.title || '').slice(0, 200),
            content: String(n.content || '').slice(0, 5000),
            x: typeof n.x === 'number' ? n.x : 120,
            y: typeof n.y === 'number' ? n.y : 80,
            width: typeof n.width === 'number' ? n.width : 280,
            height: typeof n.height === 'number' ? n.height : 220,
            open: n.open !== false,
            checklistItems: Array.isArray(n.checklistItems) ? n.checklistItems : []
          }));
        // Limit beachten
        const spaceLeft = Notes.MAX_NOTES - existingNotes.length;
        const toImport = importNotes.slice(0, spaceLeft);
        if (toImport.length > 0) {
          const merged = [...existingNotes, ...toImport];
          existingWidgets.notes = merged;
          notesImported = toImport.length;
        }
      }

      // Calculator-History importieren (falls vorhanden)
      let calcImported = false;
      if (Array.isArray(data.calculator) && data.calculator.length > 0) {
        const calcHistory = data.calculator.filter(h => h && typeof h.expr === 'string' && typeof h.result === 'string');
        if (calcHistory.length > 0) {
          if (!existingWidgets.calculator) {
            existingWidgets.calculator = { x: 400, y: 120, width: 280, height: 400, open: false, history: [] };
          }
          existingWidgets.calculator.history = calcHistory.slice(0, Calculator.MAX_HISTORY);
          calcImported = true;
        }
      }

      // Timer-Presets importieren (falls vorhanden)
      let timerImported = false;
      if (Array.isArray(data.timerPresets) && data.timerPresets.length > 0) {
        const validPresets = data.timerPresets.filter(p => p && typeof p.name === 'string' && typeof p.seconds === 'number');
        if (validPresets.length > 0) {
          if (!existingWidgets.timer) {
            existingWidgets.timer = { x: 600, y: 80, width: 260, height: 360, open: false, presets: [] };
          }
          existingWidgets.timer.presets = validPresets.slice(0, Timer.MAX_PRESETS);
          timerImported = true;
        }
      }

      // Gemeinsam speichern
      await Store.set('widgetStates', existingWidgets);

      // Widget-Module neu aus Storage laden (kein direkter Zugriff auf Internals)
      if (notesImported > 0) await Notes.init();
      if (calcImported) await Calculator.load();
      if (timerImported) await Timer.load();

      const noteMsg = notesImported > 0 ? t('data.notes_suffix', { count: notesImported }) : '';
      const calcMsg = calcImported ? t('data.calc_suffix') : '';
      const timerMsg = timerImported ? t('data.timer_suffix') : '';
      await HellionDialog.alert(
        t('data.import_success', { boards: validBoards.length, notes: noteMsg, calc: calcMsg, timer: timerMsg }),
        { type: 'success', title: t('data.import_success.title') }
      );
    } catch (err) {
      await HellionDialog.alert(t('data.import_error', { error: err.message }), { type: 'danger', title: t('data.import_error.title') });
    }
    e.target.value = '';
  });
}
