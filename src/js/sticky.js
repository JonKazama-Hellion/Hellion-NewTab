/* =============================================
   HELLION NEWTAB — sticky.js
   Sticky Note: draggable, persistent
   ============================================= */

function initStickyNote() {
  const note     = document.getElementById('stickyNote');
  const body     = document.getElementById('stickyNoteBody');
  const header   = document.getElementById('stickyNoteHeader');
  const btnClose = document.getElementById('stickyNoteClose');
  const btnNote  = document.getElementById('btnNote');
  if (!note || !body) return;

  // Gespeicherten Text & Position laden
  Store.get('stickyNote').then(val => { if (val) body.value = val; });
  Store.get('stickyPos').then(pos => {
    if (pos) {
      note.style.right = 'auto'; note.style.bottom = 'auto';
      note.style.left = pos.x + 'px'; note.style.top = pos.y + 'px';
    }
  });
  Store.get('stickyVisible').then(vis => { if (vis) note.classList.add('visible'); });

  // Text speichern (debounced)
  let saveTimer;
  body.addEventListener('input', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => Store.set('stickyNote', body.value), 600);
  });

  // Toggle
  btnNote.addEventListener('click', async () => {
    const visible = note.classList.toggle('visible');
    await Store.set('stickyVisible', visible);
    if (visible) body.focus();
  });
  btnClose.addEventListener('click', async () => {
    note.classList.remove('visible');
    await Store.set('stickyVisible', false);
  });

  // Drag via Pointer Events
  header.style.cursor = 'grab';
  header.addEventListener('pointerdown', e => {
    if (e.target === btnClose || e.target.closest('.sticky-note-close')) return;
    e.preventDefault();
    header.setPointerCapture(e.pointerId);
    header.style.cursor = 'grabbing';

    const rect = note.getBoundingClientRect();
    note.style.right  = 'auto'; note.style.bottom = 'auto';
    note.style.left   = rect.left + 'px'; note.style.top = rect.top + 'px';

    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;

    function onMove(ev) {
      const maxX = window.innerWidth  - note.offsetWidth;
      const maxY = window.innerHeight - note.offsetHeight;
      note.style.left = Math.max(0, Math.min(maxX, ev.clientX - offX)) + 'px';
      note.style.top  = Math.max(48, Math.min(maxY, ev.clientY - offY)) + 'px';
    }

    async function onUp() {
      header.style.cursor = 'grab';
      header.releasePointerCapture(e.pointerId);
      header.removeEventListener('pointermove', onMove);
      header.removeEventListener('pointerup', onUp);
      await Store.set('stickyPos', {
        x: parseFloat(note.style.left),
        y: parseFloat(note.style.top)
      });
    }

    header.addEventListener('pointermove', onMove);
    header.addEventListener('pointerup', onUp);
  });
}
