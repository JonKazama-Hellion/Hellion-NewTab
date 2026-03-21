/* =============================================
   HELLION NEWTAB — app.js
   Einstiegspunkt: Init, Clock, globale Events
   ============================================= */

async function init() {
  const savedBoards   = await Store.get('boards');
  const savedSettings = await Store.get('settings');

  boards = savedBoards ?? getDefaultBoards();
  if (savedSettings) Object.assign(settings, savedSettings);

  applySettings();
  renderBoards();
  startClock();
  bindGlobalEvents();
  bindSettingsEvents();
  initSearch();
  initStickyNote();
  initDataButtons();
  Store.checkQuota();

  // Onboarding beim ersten Start
  const onboardingDone = await Store.get('onboardingDone');
  if (!onboardingDone) {
    Onboarding.start();
  } else {
    // Backup-Reminder (nur wenn Onboarding schon durch ist)
    await checkBackupReminder();
  }
}

// ---- BACKUP REMINDER ----
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 Tage

async function checkBackupReminder() {
  const lastReminder = await Store.get('lastBackupReminder');
  const now = Date.now();

  // Beim allerersten Mal: Timestamp setzen, aber noch nicht nerven
  if (!lastReminder) {
    await Store.set('lastBackupReminder', now);
    return;
  }

  if (now - lastReminder < BACKUP_INTERVAL_MS) return;

  // Nur erinnern wenn es Boards gibt die sich lohnen zu sichern
  if (boards.length === 0) return;

  const doBackup = await HellionDialog.confirm(
    'Du hast seit über einer Woche kein Backup gemacht. Beim Löschen der Browserdaten gehen deine Boards verloren. Jetzt sichern?',
    { type: 'warning', title: 'Backup-Erinnerung', confirmText: 'Jetzt sichern', cancelText: 'Später' }
  );

  if (doBackup) {
    // JSON-Export auslösen (gleiche Logik wie btnExportJSON)
    const data = { version: '1.5.2', exported: new Date().toISOString(), boards, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'hellion-newtab-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Timestamp immer aktualisieren (egal ob gesichert oder "Später")
  await Store.set('lastBackupReminder', now);
}

// ---- CLOCK & DATE ----
function startClock() {
  const DAYS   = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

  function tick() {
    const now = new Date();
    document.getElementById('clock').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('date').textContent =
      `${DAYS[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')}. ${MONTHS[now.getMonth()]}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ---- GLOBALE EVENTS (Header-Buttons, Modals, Import) ----
function bindGlobalEvents() {
  // Header
  document.getElementById('btnAddBoard').addEventListener('click', openAddBoardModal);
  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('importInput').click();
  });

  // HTML Bookmark Import
  document.getElementById('importInput').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const imported = parseBookmarkHtml(await file.text());
    if (imported.length === 0) {
      await HellionDialog.alert('Keine Bookmarks in dieser Datei gefunden.', { type: 'warning', title: 'Import' });
      return;
    }
    boards = [...boards, ...imported];
    await saveBoards();
    renderBoards();
    e.target.value = '';
    await HellionDialog.alert(
      `${imported.length} Board(s) mit ${imported.reduce((s,b) => s + b.bookmarks.length, 0)} Bookmarks importiert.`,
      { type: 'success', title: 'Import erfolgreich' }
    );
  });

  // Add Board Modal
  document.getElementById('btnCancelBoard').addEventListener('click', () => closeModal('addBoardOverlay'));
  document.getElementById('addBoardOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('addBoardOverlay')) closeModal('addBoardOverlay');
  });
  document.getElementById('btnConfirmBoard').addEventListener('click', async () => {
    const name = document.getElementById('newBoardName').value.trim();
    if (!name) return;
    boards.push({ id: uid(), title: name, bookmarks: [] });
    await saveBoards();
    renderBoards();
    closeModal('addBoardOverlay');
  });
  document.getElementById('newBoardName').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmBoard').click();
    if (e.key === 'Escape') closeModal('addBoardOverlay');
  });

  // Add Bookmark Modal
  document.getElementById('btnCancelBookmark').addEventListener('click', () => closeModal('addBookmarkOverlay'));
  document.getElementById('addBookmarkOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('addBookmarkOverlay')) closeModal('addBookmarkOverlay');
  });
  document.getElementById('btnConfirmBookmark').addEventListener('click', async () => {
    const title = document.getElementById('newBmTitle').value.trim();
    const url   = document.getElementById('newBmUrl').value.trim();
    const desc  = document.getElementById('newBmDesc').value.trim();
    if (!title || !url) return;
    try { new URL(url); } catch { await HellionDialog.alert('Ungültige URL. Bitte mit https:// beginnen.', { type: 'warning', title: 'URL ungültig' }); return; }
    const board = boards.find(b => b.id === pendingBookmarkBoardId);
    if (!board) return;
    board.bookmarks.push({ id: uid(), title, url, desc });
    await saveBoards();
    renderBoards();
    closeModal('addBookmarkOverlay');
  });
  document.getElementById('newBmUrl').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmBookmark').click();
    if (e.key === 'Escape') closeModal('addBookmarkOverlay');
  });

  // Rename Modal
  document.getElementById('btnCancelRename').addEventListener('click', () => closeModal('renameOverlay'));
  document.getElementById('renameOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('renameOverlay')) closeModal('renameOverlay');
  });
  document.getElementById('btnConfirmRename').addEventListener('click', () => {
    const val = document.getElementById('renameInput').value.trim();
    if (pendingRenameCallback) pendingRenameCallback(val);
    pendingRenameCallback = null;
    closeModal('renameOverlay');
  });
  document.getElementById('renameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnConfirmRename').click();
    if (e.key === 'Escape') closeModal('renameOverlay');
  });
}

document.addEventListener('DOMContentLoaded', init);
