/* =============================================
   HELLION NEWTAB — data.js
   JSON Export / Import (Backup & Restore)
   ============================================= */

function initDataButtons() {
  const btnExport = document.getElementById('btnExportJSON');
  const btnImport = document.getElementById('btnImportJSON');
  const jsonInput = document.getElementById('jsonImportInput');
  if (!btnExport || !btnImport) return;

  // Export (inkl. Notes)
  btnExport.addEventListener('click', async () => {
    const widgetData = await Store.get('widgetStates');
    const data = {
      version: '1.6.0',
      exported: new Date().toISOString(),
      boards,
      settings,
      notes: widgetData && Array.isArray(widgetData.notes) ? widgetData.notes : []
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
      if (!Array.isArray(data.boards)) throw new Error('Ungültiges Format');
      const validBoards = data.boards.filter(b => {
        if (!b || typeof b.title !== 'string' || !Array.isArray(b.bookmarks)) return false;
        b.id = b.id || uid();
        b.blurred = !!b.blurred;
        b.bookmarks = b.bookmarks.filter(bm => {
          if (!bm || typeof bm.title !== 'string' || typeof bm.url !== 'string') return false;
          bm.id = bm.id || uid();
          bm.desc = bm.desc || '';
          return true;
        });
        return true;
      });
      if (validBoards.length === 0) throw new Error('Keine gültigen Boards gefunden');
      const ok = await HellionDialog.confirm(
        `${validBoards.length} Boards importieren? Bestehende Daten bleiben erhalten.`,
        { type: 'info', title: 'JSON Import' }
      );
      if (!ok) return;
      boards = [...boards, ...validBoards];
      await saveBoards();
      renderBoards();

      // Notes importieren (falls vorhanden)
      let notesImported = 0;
      if (Array.isArray(data.notes) && data.notes.length > 0) {
        const existingWidgets = await Store.get('widgetStates');
        const existingNotes = (existingWidgets && Array.isArray(existingWidgets.notes)) ? existingWidgets.notes : [];
        const importNotes = data.notes.filter(n => {
          if (!n || !n.id || !n.template) return false;
          n.checklistItems = Array.isArray(n.checklistItems) ? n.checklistItems : [];
          return true;
        });
        // Limit beachten
        const spaceLeft = Notes.MAX_NOTES - existingNotes.length;
        const toImport = importNotes.slice(0, spaceLeft);
        if (toImport.length > 0) {
          const merged = [...existingNotes, ...toImport];
          await Store.set('widgetStates', { notes: merged });
          Notes._notes = merged;
          notesImported = toImport.length;
        }
      }

      const noteMsg = notesImported > 0 ? ` + ${notesImported} Note(s)` : '';
      await HellionDialog.alert(
        `${validBoards.length} Board(s)${noteMsg} erfolgreich importiert.`,
        { type: 'success', title: 'Import erfolgreich' }
      );
    } catch (err) {
      await HellionDialog.alert('Fehler beim Import: ' + err.message, { type: 'danger', title: 'Import fehlgeschlagen' });
    }
    e.target.value = '';
  });
}
