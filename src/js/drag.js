/* =============================================
   HELLION NEWTAB — drag.js
   Drag & Drop via Pointer Events
   Boards: Reihenfolge per Handle
   Bookmarks: Reihenfolge innerhalb eines Boards
   ============================================= */

// ---- BOARD DRAG (Pointer Events) ----
function initBoardDragDrop() {
  const wrapper = document.getElementById('boardsWrapper');
  let dragging  = null;
  let placeholder = null;

  function getInsertTarget(clientX, clientY) {
    const boardEls = Array.from(wrapper.querySelectorAll('.board:not(.dragging)'));
    for (const b of boardEls) {
      const r = b.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        return { el: b, before: clientX < r.left + r.width / 2 };
      }
    }
    return null;
  }

  wrapper.querySelectorAll('.board').forEach(boardEl => {
    const handle = boardEl.querySelector('.board-drag-handle');
    if (!handle) return;

    handle.style.cursor = 'grab';

    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = 'grabbing';

      const rect = boardEl.getBoundingClientRect();

      // Ghost
      const ghost = boardEl.cloneNode(true);
      ghost.className += ' drag-ghost';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      ghost.style.width = rect.width + 'px';
      ghost.style.height = rect.height + 'px';
      document.body.appendChild(ghost);

      // Placeholder
      placeholder = document.createElement('div');
      placeholder.className = 'board-placeholder';
      placeholder.style.cssText = `width:${rect.width}px; height:${rect.height}px;`;
      boardEl.parentNode.insertBefore(placeholder, boardEl);
      boardEl.classList.add('dragging');

      dragging = { el: boardEl, ghost,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      };
    });

    handle.addEventListener('pointermove', e => {
      if (!dragging || dragging.el !== boardEl) return;
      e.preventDefault();
      dragging.ghost.style.left = (e.clientX - dragging.offsetX) + 'px';
      dragging.ghost.style.top  = (e.clientY - dragging.offsetY) + 'px';

      const target = getInsertTarget(e.clientX, e.clientY);
      if (target && target.el !== boardEl) {
        target.before
          ? target.el.parentNode.insertBefore(placeholder, target.el)
          : target.el.parentNode.insertBefore(placeholder, target.el.nextSibling);
      }
    });

    handle.addEventListener('pointerup', async () => {
      if (!dragging || dragging.el !== boardEl) return;
      handle.style.cursor = 'grab';
      placeholder.parentNode.insertBefore(boardEl, placeholder);
      placeholder.remove(); placeholder = null;
      boardEl.classList.remove('dragging');
      dragging.ghost.remove();
      dragging = null;

      // Neue Reihenfolge aus DOM ablesen
      const newOrder = Array.from(wrapper.querySelectorAll('.board'))
        .map(el => el.dataset.boardId).filter(Boolean);
      boards.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      await saveBoards();
    });

    handle.addEventListener('pointercancel', () => {
      if (!dragging) return;
      dragging.ghost.remove();
      if (placeholder) { placeholder.remove(); placeholder = null; }
      boardEl.classList.remove('dragging');
      dragging = null;
      handle.style.cursor = 'grab';
    });
  });
}

// ---- BOOKMARK DRAG (innerhalb eines Boards) ----
function initBookmarkDragDrop(listEl, board) {
  let dragSrcBmId = null;

  listEl.addEventListener('dragstart', e => {
    const item = e.target.closest('.bm-item');
    if (!item) return;
    dragSrcBmId = item.dataset.bmId;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => item.classList.add('dragging-source'), 0);
  });

  listEl.addEventListener('dragend', e => {
    const item = e.target.closest('.bm-item');
    if (item) item.classList.remove('dragging-source');
  });

  listEl.addEventListener('dragover', e => {
    e.preventDefault();
    const item = e.target.closest('.bm-item');
    if (item) item.classList.add('drag-over');
  });

  listEl.addEventListener('dragleave', e => {
    const item = e.target.closest('.bm-item');
    if (item) item.classList.remove('drag-over');
  });

  listEl.addEventListener('drop', async e => {
    e.preventDefault(); e.stopPropagation();
    const item = e.target.closest('.bm-item');
    if (!item) return;
    item.classList.remove('drag-over');
    const targetBmId = item.dataset.bmId;
    if (!dragSrcBmId || dragSrcBmId === targetBmId) return;
    const srcIdx = board.bookmarks.findIndex(b => b.id === dragSrcBmId);
    const tgtIdx = board.bookmarks.findIndex(b => b.id === targetBmId);
    const [moved] = board.bookmarks.splice(srcIdx, 1);
    board.bookmarks.splice(tgtIdx, 0, moved);
    await saveBoards();
    renderBoards();
  });
}
