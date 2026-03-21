/* =============================================
   HELLION NEWTAB — state.js
   Globaler State, Default-Werte, Hilfsfunktionen
   ============================================= */

let boards = [];

let settings = {
  compact:       false,
  shortenTitles: false,
  newTab:        true,
  showDesc:      false,
  hideExtra:     false,
  visibleCount:  10,
  bgUrl:         '',
  theme:         'nebula',
  showSearch:    true,
  searchEngine:  'google',
  toolbarPos:    'right',
  imageRefEnabled: false
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getFaviconUrl(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=16`;
  } catch {
    return '';
  }
}

function getDefaultBoards() {
  return [
    {
      id: uid(),
      title: 'Getting Started',
      bookmarks: [
        { id: uid(), title: 'GitHub',        url: 'https://github.com',              desc: '' },
        { id: uid(), title: 'MDN Web Docs',  url: 'https://developer.mozilla.org',   desc: '' },
        { id: uid(), title: 'Next.js Docs',  url: 'https://nextjs.org/docs',         desc: '' },
      ],
      blurred: false
    }
  ];
}

async function saveBoards() {
  await Store.set('boards', boards);
}

async function saveSettings() {
  await Store.set('settings', settings);
}
