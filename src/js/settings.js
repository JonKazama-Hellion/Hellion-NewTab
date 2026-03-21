/* =============================================
   HELLION NEWTAB — settings.js
   Settings Panel, Theme-Modal, Accordion, Toggles
   ============================================= */

// ---- SETTINGS PANEL ----
function openSettings()  {
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsOverlay').classList.add('active');
}
function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsOverlay').classList.remove('active');
}

// ---- THEME MODAL ----
function openThemeModal() {
  const overlay = document.getElementById('themeOverlay');
  overlay.classList.add('active');
}
function closeThemeModal() {
  const overlay = document.getElementById('themeOverlay');
  overlay.classList.remove('active');
}

// ---- ACCORDION ----
function initAccordion() {
  const defaultOpen = new Set(['appearance', 'behavior', 'widgets', 'data', 'help']);
  const sections = document.querySelectorAll('.settings-section[data-section]');

  sections.forEach(section => {
    const name = section.dataset.section;
    const title = section.querySelector('.settings-section-title');

    if (defaultOpen.has(name)) {
      section.classList.add('open');
    }

    title.addEventListener('click', () => {
      section.classList.toggle('open');
    });

    title.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        section.classList.toggle('open');
      }
    });
  });
}

// ---- APPLY SETTINGS ----
function applySettings() {
  const body = document.body;
  body.classList.toggle('compact',        settings.compact);
  body.classList.toggle('shorten-titles', settings.shortenTitles);
  body.classList.toggle('show-desc',      settings.showDesc);

  document.getElementById('settingCompact').checked      = settings.compact;
  document.getElementById('settingShorten').checked      = settings.shortenTitles;
  document.getElementById('settingNewTab').checked       = settings.newTab;
  document.getElementById('settingShowDesc').checked     = settings.showDesc;
  document.getElementById('settingHideExtra').checked    = settings.hideExtra;
  document.getElementById('settingVisibleCount').value   = String(settings.visibleCount);
  document.getElementById('visibleCountRow').classList.toggle('dim', !settings.hideExtra);

  // showSearch: undefined (alter Save) → true
  if (settings.showSearch === undefined) settings.showSearch = true;
  const searchWrapper = document.getElementById('searchBarWrapper');
  if (searchWrapper) searchWrapper.classList.toggle('hidden', !settings.showSearch);
  const showSearchEl = document.getElementById('settingShowSearch');
  if (showSearchEl) showSearchEl.checked = settings.showSearch;

  // Image-Ref Toggle
  if (settings.imageRefEnabled === undefined) settings.imageRefEnabled = false;
  const imgRefCheckbox = document.getElementById('settingImageRef');
  if (imgRefCheckbox) imgRefCheckbox.checked = settings.imageRefEnabled;
  const imgRefBtn = document.querySelector('[data-action="image-ref"]');
  if (imgRefBtn) imgRefBtn.classList.toggle('hidden', !settings.imageRefEnabled);

  // Toolbar-Position
  document.body.classList.toggle('toolbar-left', settings.toolbarPos === 'left');
  const toolbarPosEl = document.getElementById('settingToolbarPos');
  if (toolbarPosEl) toolbarPosEl.value = settings.toolbarPos || 'right';

  applyTheme(settings.theme || 'nebula', !!settings.bgUrl);

  if (settings.bgUrl) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${settings.bgUrl}')`;
  }
}

// ---- BIND EVENTS ----
function bindSettingsEvents() {
  // Settings Panel
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);
  document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
  document.getElementById('btnSettings').addEventListener('click', openSettings);

  // Theme Modal
  document.getElementById('btnTheme').addEventListener('click', openThemeModal);
  document.getElementById('btnCloseTheme').addEventListener('click', closeThemeModal);
  document.getElementById('themeOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('themeOverlay')) closeThemeModal();
  });

  // Theme-Picker (Cards im Theme-Modal)
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', async () => {
      const name = card.dataset.value;
      if (!name || name === settings.theme) return;
      settings.theme  = name;
      settings.bgUrl  = '';
      document.getElementById('bgUrlInput').value = '';
      applyTheme(name, false);
      await saveSettings();
    });
  });

  // Accordion initialisieren
  initAccordion();

  // Toggles
  const toggleMap = {
    settingCompact:   v => { settings.compact       = v; document.body.classList.toggle('compact', v); },
    settingShorten:   v => { settings.shortenTitles = v; document.body.classList.toggle('shorten-titles', v); },
    settingNewTab:    v => { settings.newTab         = v; },
    settingShowDesc:  v => { settings.showDesc       = v; document.body.classList.toggle('show-desc', v); },
    settingHideExtra: v => {
      settings.hideExtra = v;
      document.getElementById('visibleCountRow').classList.toggle('dim', !v);
      renderBoards();
    },
    settingShowSearch: v => {
      settings.showSearch = v;
      document.getElementById('searchBarWrapper').classList.toggle('hidden', !v);
    },
    settingImageRef: v => {
      settings.imageRefEnabled = v;
      const imgBtn = document.querySelector('[data-action="image-ref"]');
      if (imgBtn) imgBtn.classList.toggle('hidden', !v);
    }
  };

  Object.entries(toggleMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', async e => {
        fn(e.target.checked);
        await saveSettings();
      });
    }
  });

  document.getElementById('settingVisibleCount').addEventListener('change', async e => {
    settings.visibleCount = parseInt(e.target.value, 10);
    await saveSettings();
    renderBoards();
  });

  // Background URL (im Theme-Modal)
  document.getElementById('btnChangeBg').addEventListener('click', () => {
    document.getElementById('bgInputRow').classList.toggle('hidden');
  });
  document.getElementById('btnApplyBg').addEventListener('click', async () => {
    const url = document.getElementById('bgUrlInput').value.trim();
    settings.bgUrl = url;
    document.getElementById('bgLayer').style.backgroundImage = url ? `url('${url}')` : '';
    await saveSettings();
    document.getElementById('bgInputRow').classList.add('hidden');
  });

  // Background File Upload (im Theme-Modal)
  document.getElementById('btnBgFile').addEventListener('click', () => {
    document.getElementById('bgFileInput').click();
  });
  document.getElementById('bgFileInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      settings.bgUrl = ev.target.result;
      document.getElementById('bgLayer').style.backgroundImage = `url('${ev.target.result}')`;
      await saveSettings();
    };
    reader.onerror = () => {
      HellionDialog.alert('Fehler beim Lesen der Datei. Bitte eine andere Datei wählen.', { type: 'danger', title: 'Dateifehler' });
    };
    reader.readAsDataURL(file);
  });

  // Toolbar-Position Setting
  const toolbarPosEl = document.getElementById('settingToolbarPos');
  if (toolbarPosEl) {
    toolbarPosEl.value = settings.toolbarPos || 'right';
    toolbarPosEl.addEventListener('change', async (e) => {
      settings.toolbarPos = e.target.value;
      document.body.classList.toggle('toolbar-left', e.target.value === 'left');
      await saveSettings();
    });
  }

  // Onboarding wiederholen
  document.getElementById('btnRestartOnboarding').addEventListener('click', () => {
    closeSettings();
    Onboarding.start();
  });

  // Reset All
  document.getElementById('btnResetAll').addEventListener('click', async () => {
    const ok = await HellionDialog.confirm(
      'Wirklich alle Boards und Einstellungen löschen? Das kann nicht rückgängig gemacht werden.',
      { type: 'danger', title: 'Alles zurücksetzen', confirmText: 'Alles löschen' }
    );
    if (!ok) return;
    boards   = [];
    settings = { compact: false, shortenTitles: false, newTab: true, showDesc: false,
                 hideExtra: false, visibleCount: 10, bgUrl: '', theme: 'nebula',
                 showSearch: true, searchEngine: 'google', toolbarPos: 'right',
                 imageRefEnabled: false };
    await saveBoards();
    await saveSettings();
    applySettings();
    renderBoards();
    closeSettings();
  });
}
