/* =============================================
   HELLION NEWTAB — app.js
   Einstiegspunkt: Init, Clock, globale Events
   ============================================= */

async function init() {
  const savedBoards   = await Store.get('boards');
  const savedSettings = await Store.get('settings');

  boards = savedBoards ?? getDefaultBoards();
  if (savedSettings) Object.assign(settings, savedSettings);

  I18n.init();
  applySettings();
  renderBoards();
  startClock();
  bindGlobalEvents();
  bindSettingsEvents();
  initSearch();
  await migrateSticky();
  await Notes.init();
  await Calculator.init();
  await Timer.init();
  await ImageRef.init();
  BrowserBookmarkImport.init();
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

// ---- STICKY NOTE MIGRATION ----
async function migrateSticky() {
  const stickyText = await Store.get('stickyNote');
  const stickyPos = await Store.get('stickyPos');
  const existingWidgets = await Store.get('widgetStates');

  // Nur migrieren wenn alte Daten vorhanden UND noch keine Widgets existieren
  if (!stickyText && !stickyPos) return;
  if (existingWidgets && Array.isArray(existingWidgets.notes) && existingWidgets.notes.length > 0) return;

  const noteData = {
    id: 'note_' + uid(),
    title: (stickyText || '').split('\n')[0].trim().slice(0, 20) || 'Note',
    content: stickyText || '',
    template: 'text',
    x: stickyPos ? stickyPos.x : 120,
    y: stickyPos ? stickyPos.y : 80,
    width: 280,
    height: 220,
    open: true,
    checkedItems: [],
    checklistItems: []
  };

  await Store.set('widgetStates', { notes: [noteData] });

  // Alte Keys aufraeumen
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove(['stickyNote', 'stickyPos', 'stickyVisible']);
    } else {
      localStorage.removeItem('stickyNote');
      localStorage.removeItem('stickyPos');
      localStorage.removeItem('stickyVisible');
    }
  } catch (e) {
    console.warn('Sticky-Migration: Alte Keys konnten nicht entfernt werden', e);
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
    t('app.backup_reminder'),
    { type: 'warning', title: t('app.backup_reminder.title'), confirmText: t('app.backup_now'), cancelText: t('app.backup_later') }
  );

  if (doBackup) {
    // JSON-Export auslösen (gleiche Logik wie btnExportJSON)
    const widgetData = await Store.get('widgetStates');
    const notesData = (widgetData && Array.isArray(widgetData.notes)) ? widgetData.notes : [];
    const calcHistory = (widgetData && widgetData.calculator) ? widgetData.calculator.history || [] : [];
    const timerPresets = (widgetData && widgetData.timer) ? widgetData.timer.presets || [] : [];
    const data = { version: '2.1.0', exported: new Date().toISOString(), boards, settings, notes: notesData, calculator: calcHistory, timerPresets };
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
  const DAY_KEYS   = ['clock.days.sun','clock.days.mon','clock.days.tue','clock.days.wed','clock.days.thu','clock.days.fri','clock.days.sat'];
  const MONTH_KEYS = ['clock.months.jan','clock.months.feb','clock.months.mar','clock.months.apr','clock.months.may','clock.months.jun','clock.months.jul','clock.months.aug','clock.months.sep','clock.months.oct','clock.months.nov','clock.months.dec'];

  function tick() {
    const now = new Date();
    document.getElementById('clock').textContent =
      `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('date').textContent =
      `${t(DAY_KEYS[now.getDay()])}, ${String(now.getDate()).padStart(2,'0')}. ${t(MONTH_KEYS[now.getMonth()])}`;
  }
  tick();
  const clockInterval = setInterval(tick, 1000);
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
      await HellionDialog.alert(t('app.no_bookmarks'), { type: 'warning', title: t('app.import_title') });
      return;
    }
    boards = [...boards, ...imported];
    await saveBoards();
    renderBoards();
    e.target.value = '';
    await HellionDialog.alert(
      t('app.html_import_success', { count: imported.length, total: imported.reduce((s,b) => s + b.bookmarks.length, 0) }),
      { type: 'success', title: t('app.import_success_title') }
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
    try { new URL(url); } catch { await HellionDialog.alert(t('app.invalid_url'), { type: 'warning', title: t('app.invalid_url.title') }); return; }
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
