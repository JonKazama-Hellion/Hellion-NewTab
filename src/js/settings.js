/* =============================================
   HELLION NEWTAB — settings.js
   Settings Panel: Toggles, Hintergrund, Theme-Picker
   ============================================= */

function openSettings()  {
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsOverlay').classList.add('active');
}
function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsOverlay').classList.remove('active');
}

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
  document.getElementById('visibleCountRow').style.opacity = settings.hideExtra ? '1' : '0.4';

  // showSearch: undefined (alter Save) → true
  if (settings.showSearch === undefined) settings.showSearch = true;
  const searchWrapper = document.getElementById('searchBarWrapper');
  if (searchWrapper) searchWrapper.classList.toggle('hidden', !settings.showSearch);
  const showSearchEl = document.getElementById('settingShowSearch');
  if (showSearchEl) showSearchEl.checked = settings.showSearch;

  applyTheme(settings.theme || 'astronaut', !!settings.bgUrl);

  if (settings.bgUrl) {
    document.getElementById('bgLayer').style.backgroundImage = `url('${settings.bgUrl}')`;
  }
}

function bindSettingsEvents() {
  // Panel
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);
  document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
  document.getElementById('btnSettings').addEventListener('click', openSettings);

  // Theme-Picker
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

  // Toggles
  const toggleMap = {
    settingCompact:   v => { settings.compact       = v; document.body.classList.toggle('compact', v); },
    settingShorten:   v => { settings.shortenTitles = v; document.body.classList.toggle('shorten-titles', v); },
    settingNewTab:    v => { settings.newTab         = v; },
    settingShowDesc:  v => { settings.showDesc       = v; document.body.classList.toggle('show-desc', v); },
    settingHideExtra: v => {
      settings.hideExtra = v;
      document.getElementById('visibleCountRow').style.opacity = v ? '1' : '0.4';
      renderBoards();
    },
    settingShowSearch: v => {
      settings.showSearch = v;
      document.getElementById('searchBarWrapper').classList.toggle('hidden', !v);
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

  // Background URL
  document.getElementById('btnChangeBg').addEventListener('click', () => {
    const row = document.getElementById('bgInputRow');
    row.style.display = row.style.display === 'none' ? 'flex' : 'none';
  });
  document.getElementById('btnApplyBg').addEventListener('click', async () => {
    const url = document.getElementById('bgUrlInput').value.trim();
    settings.bgUrl = url;
    document.getElementById('bgLayer').style.backgroundImage = url ? `url('${url}')` : '';
    await saveSettings();
    document.getElementById('bgInputRow').style.display = 'none';
  });

  // Background File Upload
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
      alert('Fehler beim Lesen der Datei. Bitte eine andere Datei wählen.');
    };
    reader.readAsDataURL(file);
  });

  // Reset All
  document.getElementById('btnResetAll').addEventListener('click', async () => {
    if (!confirm('Wirklich alle Boards und Einstellungen löschen? Nicht rückgängig machbar.')) return;
    boards   = [];
    settings = { compact: false, shortenTitles: false, newTab: true, showDesc: false,
                 hideExtra: false, visibleCount: 10, bgUrl: '', theme: 'astronaut',
                 showSearch: true, searchEngine: 'google' };
    await saveBoards();
    await saveSettings();
    applySettings();
    renderBoards();
    closeSettings();
  });
}
