/* =============================================
   HELLION NEWTAB — data.js
   JSON Export / Import (Backup & Restore)
   ============================================= */

function initDataButtons() {
  const btnExport = document.getElementById('btnExportJSON');
  const btnImport = document.getElementById('btnImportJSON');
  const jsonInput = document.getElementById('jsonImportInput');
  if (!btnExport || !btnImport) return;

  // Export
  btnExport.addEventListener('click', () => {
    const data = { version: '1.2.0', exported: new Date().toISOString(), boards, settings };
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
      if (!confirm(`${validBoards.length} Boards importieren? Bestehende Daten bleiben erhalten.`)) return;
      boards = [...boards, ...validBoards];
      await saveBoards();
      renderBoards();
      alert(`✓ ${validBoards.length} Board(s) importiert.`);
    } catch (err) {
      alert('Fehler beim Import: ' + err.message);
    }
    e.target.value = '';
  });
}
