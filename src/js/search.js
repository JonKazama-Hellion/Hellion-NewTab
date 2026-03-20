/* =============================================
   HELLION NEWTAB — search.js
   Suchleiste: Google / DuckDuckGo / Bing
   ============================================= */

function initSearch() {
  const input  = document.getElementById('searchInput');
  const submit = document.getElementById('searchSubmit');
  const toggle = document.getElementById('searchEngineToggle');
  const icon   = document.getElementById('searchEngineIcon');
  if (!input) return;

  const engines = {
    google: { label: 'G', url: 'https://www.google.com/search?q=' },
    ddg:    { label: '⊙', url: 'https://duckduckgo.com/?q=' },
    bing:   { label: 'B', url: 'https://www.bing.com/search?q=' },
  };

  function updateIcon() {
    icon.textContent = engines[settings.searchEngine]?.label ?? 'G';
  }
  updateIcon();

  function doSearch() {
    const q = input.value.trim();
    if (!q) return;
    const engine = engines[settings.searchEngine] ?? engines.google;
    window.open(engine.url + encodeURIComponent(q), settings.newTab ? '_blank' : '_self');
    input.value = '';
  }

  toggle.addEventListener('click', async () => {
    const keys = Object.keys(engines);
    settings.searchEngine = keys[(keys.indexOf(settings.searchEngine) + 1) % keys.length];
    updateIcon();
    await saveSettings();
  });

  submit.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}
