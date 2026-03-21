/* =============================================
   HELLION NEWTAB — boards.js
   Board & Bookmark Rendering, Modals
   ============================================= */

let pendingBookmarkBoardId = null;
let pendingRenameCallback  = null;

// ---- RENDER ----
function renderBoards() {
  const wrapper = document.getElementById('boardsWrapper');
  wrapper.innerHTML = '';

  if (boards.length === 0) {
    wrapper.innerHTML = `<div class="empty-state">
      No boards yet. Click <strong style="color:var(--accent)">+ Board</strong> to create one,
      or use <strong style="color:var(--accent)">Import</strong> to load your browser bookmarks.
    </div>`;
    return;
  }

  boards.forEach(board => wrapper.appendChild(createBoardEl(board)));
  initBoardDragDrop();
}

function createBoardEl(board) {
  const div = document.createElement('div');
  div.className = 'board' + (board.blurred ? ' blurred' : '');
  div.dataset.boardId = board.id;

  // Header
  const header = document.createElement('div');
  header.className = 'board-header';
  header.innerHTML = `
    <span class="board-drag-handle" title="Board verschieben">
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
        <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
        <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
      </svg>
    </span>
    <span class="board-title" title="${escHtml(board.title)}">${escHtml(board.title)}</span>
    <div class="board-actions">
      <button class="board-action-btn btn-blur-board"   title="${board.blurred ? 'Unblur' : 'Blur (privat)'}">🔒</button>
      <button class="board-action-btn btn-rename-board" title="Umbenennen">✎</button>
      <button class="board-action-btn btn-delete-board" title="Löschen">✕</button>
    </div>
  `;

  // Blur-Overlay
  const blurOverlay = document.createElement('div');
  blurOverlay.className = 'board-blur-overlay';
  div.appendChild(blurOverlay);

  header.querySelector('.btn-blur-board').addEventListener('click', async e => {
    e.stopPropagation();
    board.blurred = !board.blurred;
    div.classList.toggle('blurred', board.blurred);
    e.currentTarget.title = board.blurred ? 'Unblur' : 'Blur (privat)';
    await saveBoards();
  });

  blurOverlay.addEventListener('click', async () => {
    board.blurred = false;
    div.classList.remove('blurred');
    header.querySelector('.btn-blur-board').title = 'Blur (privat)';
    await saveBoards();
  });

  header.querySelector('.btn-rename-board').addEventListener('click', e => {
    e.stopPropagation();
    openRenameModal(board.title, async newName => {
      if (!newName.trim()) return;
      board.title = newName.trim();
      await saveBoards();
      renderBoards();
    });
  });

  header.querySelector('.btn-delete-board').addEventListener('click', e => {
    e.stopPropagation();
    if (confirm(`Board "${board.title}" löschen?`)) {
      boards = boards.filter(b => b.id !== board.id);
      saveBoards().then(renderBoards);
    }
  });

  // Bookmark List
  const list = document.createElement('ul');
  list.className = 'board-list';
  list.dataset.boardId = board.id;

  const visibleCount = settings.hideExtra ? settings.visibleCount : board.bookmarks.length;
  const visible = board.bookmarks.slice(0, visibleCount);
  const hidden  = board.bookmarks.slice(visibleCount);

  visible.forEach(bm => list.appendChild(createBmEl(bm)));

  div.appendChild(header);
  div.appendChild(list);

  // Event Delegation für Bookmark-Klicks und -Löschungen
  bindBoardListEvents(list, board);

  // Show More
  if (hidden.length > 0) {
    let expanded = false;
    let hiddenEls = [];
    const showMoreBtn = document.createElement('button');
    showMoreBtn.className = 'show-more-btn';
    showMoreBtn.textContent = `Show ${hidden.length} more…`;
    showMoreBtn.addEventListener('click', () => {
      if (!expanded) {
        hidden.forEach(bm => { const el = createBmEl(bm); hiddenEls.push(el); list.appendChild(el); });
        showMoreBtn.textContent = 'Show less';
        expanded = true;
      } else {
        hiddenEls.forEach(el => el.remove());
        hiddenEls = [];
        showMoreBtn.textContent = `Show ${hidden.length} more…`;
        expanded = false;
      }
    });
    div.appendChild(showMoreBtn);
  }

  // Add Bookmark
  const addBtn = document.createElement('button');
  addBtn.className = 'add-bm-btn';
  addBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add link`;
  addBtn.addEventListener('click', () => openAddBookmarkModal(board.id));
  div.appendChild(addBtn);

  initBookmarkDragDrop(list, board);
  return div;
}

function createBmEl(bm) {
  const li = document.createElement('li');
  li.className = 'bm-item';
  li.dataset.bmId = bm.id;
  li.dataset.bmUrl = bm.url;
  li.draggable = true;

  const favicon = document.createElement('img');
  favicon.className = 'bm-favicon';
  favicon.width = 14;
  favicon.height = 14;
  favicon.src = getFaviconUrl(bm.url);
  favicon.addEventListener('error', function() {
    this.style.display = 'none';
    this.nextElementSibling.style.display = 'flex';
  });

  const fallback = document.createElement('div');
  fallback.className = 'bm-favicon-fallback';
  fallback.style.display = 'none';
  fallback.textContent = bm.title.charAt(0).toUpperCase();

  const textDiv = document.createElement('div');
  textDiv.className = 'bm-text';
  const titleSpan = document.createElement('span');
  titleSpan.className = 'bm-title';
  titleSpan.title = bm.title;
  titleSpan.textContent = bm.title;
  const descSpan = document.createElement('span');
  descSpan.className = 'bm-desc';
  descSpan.textContent = bm.desc || '';
  textDiv.appendChild(titleSpan);
  textDiv.appendChild(descSpan);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'bm-delete';
  deleteBtn.title = 'Entfernen';
  deleteBtn.textContent = '✕';

  li.appendChild(favicon);
  li.appendChild(fallback);
  li.appendChild(textDiv);
  li.appendChild(deleteBtn);

  return li;
}

// Event Delegation: Ein Listener pro Board-Liste statt pro Bookmark
function bindBoardListEvents(list, board) {
  list.addEventListener('click', async e => {
    const bmItem = e.target.closest('.bm-item');
    if (!bmItem) return;

    // Delete-Button geklickt
    if (e.target.closest('.bm-delete')) {
      e.stopPropagation();
      const bmId = bmItem.dataset.bmId;
      board.bookmarks = board.bookmarks.filter(b => b.id !== bmId);
      await saveBoards();
      renderBoards();
      return;
    }

    // Bookmark-Link geklickt
    const url = bmItem.dataset.bmUrl;
    if (url) {
      window.open(url, settings.newTab ? '_blank' : '_self', 'noopener,noreferrer');
    }
  });
}

// ---- MODALS ----
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openAddBoardModal() {
  document.getElementById('newBoardName').value = '';
  openModal('addBoardOverlay');
  setTimeout(() => document.getElementById('newBoardName').focus(), 50);
}

function openAddBookmarkModal(boardId) {
  pendingBookmarkBoardId = boardId;
  ['newBmTitle','newBmUrl','newBmDesc'].forEach(id => document.getElementById(id).value = '');
  openModal('addBookmarkOverlay');
  setTimeout(() => document.getElementById('newBmTitle').focus(), 50);
}

function openRenameModal(currentName, callback) {
  pendingRenameCallback = callback;
  document.getElementById('renameInput').value = currentName;
  openModal('renameOverlay');
  setTimeout(() => { const i = document.getElementById('renameInput'); i.focus(); i.select(); }, 50);
}

// ---- BOOKMARK HTML IMPORT ----
function parseBookmarkHtml(html) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(html, 'text/html');
  const result = [];

  function parseFolder(dlEl, folderName) {
    const bms = [];
    dlEl.querySelectorAll(':scope > dt').forEach(dt => {
      const a  = dt.querySelector(':scope > a');
      const h3 = dt.querySelector(':scope > h3');
      if (a && a.href) {
        bms.push({ id: uid(), title: a.textContent.trim() || a.href, url: a.href, desc: '' });
      } else if (h3) {
        const subDl = dt.querySelector(':scope > dl');
        if (subDl) {
          const sub = parseFolder(subDl, h3.textContent.trim());
          if (sub.bookmarks.length > 0) result.push(sub);
        }
      }
    });
    return { id: uid(), title: folderName || 'Imported', bookmarks: bms };
  }

  const topDts = doc.querySelectorAll('body > dl > dt, body > p > dl > dt');
  if (topDts.length === 0) {
    const allLinks = [];
    doc.querySelectorAll('a').forEach(a => {
      if (a.href && !a.href.startsWith('place:'))
        allLinks.push({ id: uid(), title: a.textContent.trim() || a.href, url: a.href, desc: '' });
    });
    if (allLinks.length > 0) result.push({ id: uid(), title: 'Imported Bookmarks', bookmarks: allLinks });
  } else {
    doc.querySelectorAll('body > dl > dt, body > p > dl > dt').forEach(dt => {
      const h3 = dt.querySelector(':scope > h3');
      const dl = dt.querySelector(':scope > dl');
      if (h3 && dl) {
        const folder = parseFolder(dl, h3.textContent.trim());
        if (folder.bookmarks.length > 0) result.push(folder);
      }
    });
  }
  return result;
}