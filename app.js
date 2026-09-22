/**
 * Collezione Multimediale - App Logic
 */
(() => {
  let collection = JSON.parse(localStorage.getItem('mediaCollection')) || [];
  let sortDirection = 1;

  const grid = document.getElementById('collectionGrid');
  const emptyState = document.getElementById('emptyState');
  const searchBar = document.getElementById('searchBar');
  const filterCat = document.getElementById('filterCategoria');
  const btnSort = document.getElementById('btnSort');

  function save() {
    localStorage.setItem('mediaCollection', JSON.stringify(collection));
    render();
  }

  function getBadgeClass(cat) { return `badge badge-${cat || 'altro'}`; }
  function getCategoryLabel(cat) {
    const map = { libri: 'Libro', fumetti: 'Fumetto', musica: 'Musica', video: 'Video', altro: 'Altro' };
    return map[cat] || 'Altro';
  }

  // ---------- MODALS ----------
  function openModal(modalId) { document.getElementById(modalId).classList.remove('hidden'); }
  function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal.id); });
  });
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', e => { const overlay = e.target.closest('.modal-overlay'); if (overlay) closeModal(overlay.id); });
  });
  function openManualForm() { openModal('manualModal'); document.getElementById('fTitolo').focus(); }
  function closeManualForm() { closeModal('manualModal'); }

  // ---------- SCANNER ----------
  let scannerInstance = null;
  function openScanner() {
    openModal('scannerModal');
    if (typeof html5qrcode === 'undefined') { alert('Libreria scanner non caricata'); return; }
    scannerInstance = new html5.QRCode(document.getElementById('reader'));
    scannerInstance.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250, aspectRatio: 1.0 },
      (decodedText) => { document.getElementById('scannerStatus').textContent = 'Codice: ' + decodedText; scannerInstance.stop().then(() => {}); enrichFromBarcode(decodedText); },
      () => {});
  }
  function closeScanner() { closeModal('scannerModal'); if (scannerInstance) { try { scannerInstance.stop(); } catch(e) {} scannerInstance.clear(); } }
  async function enrichFromBarcode(code) {
    closeScanner();
    const isbn = code.replace(/[^0-9X]/g, '');
    try {
      const res = await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn);
      const data = await res.json();
      if (data.items && data.items.length) {
        const v = data.items[0].volumeInfo;
        addItem({ titolo: v.title || '', categoria: 'libri', autore: v.authors ? v.authors.join(', ') : '',
          anno: v.publishedDate ? v.publishedDate.split('-')[0] : '', copertina: v.imageLinks?.thumbnail || '',
          note: v.description ? v.description.slice(0, 200) : '' });
        return;
      }
    } catch (e) { console.error(e); }
    openManualForm(); document.getElementById('fTitolo').value = code;
  }

  // ---------- EXPORT / IMPORT ----------
  function exportCollection() {
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'collezione-multimediale.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function importCollection() { document.getElementById('importInput').click(); }
  document.getElementById('importInput').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => { try { collection = JSON.parse(reader.result); save(); } catch(err) { alert('File JSON non valido'); } };
    reader.readAsText(file); e.target.value = '';
  });

  // ---------- SORT ----------
  const sortOrder = document.createElement('div');
  sortOrder.id = 'sortOrder'; sortOrder.innerHTML = '<button onclick="setSort(\'titolo\', 1)">Titolo ↑</button><button onclick="setSort(\'titolo\', -1)">Titolo ↓</button>';
  btnSort.insertAdjacentElement('afterend', sortOrder);
  window.setSort = (field, direction) => { sortDirection = direction; render(); sortOrder.classList.remove('active'); };
  btnSort.addEventListener('click', e => { e.stopPropagation(); sortOrder.classList.toggle('active'); });

  // ---------- THEME ----------
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) { themeBtn.addEventListener('click', () => document.body.classList.toggle('light')); }

  // ---------- EVENTS ----------
  searchBar.addEventListener('input', render); filterCat.addEventListener('change', render);

  // ---------- FORM SUBMIT ----------
  document.getElementById('manualForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('manualForm').dataset.editId;
    const item = { titolo: document.getElementById('fTitolo').value.trim(), categoria: document.getElementById('fCat').value,
      autore: document.getElementById('fAutore').value.trim(), anno: document.getElementById('fAnno').value.trim(),
      copertina: document.getElementById('fImmagine').value.trim(), note: document.getElementById('fNote').value.trim() };
    if (!item.titolo) return;
    if (editId) updateItem(parseInt(editId), item); else addItem(item);
    closeManualForm(); document.getElementById('manualForm').reset(); delete document.getElementById('manualForm').dataset.editId;
  });

  // ---------- INIT ----------
  render();
})();
window.removeItem = removeItem;
window.openEditModal = openEditModal;
window.openManualForm = openManualForm;
window.closeManualForm = closeManualForm;
window.openScanner = openScanner;
window.closeScanner = closeScanner;
window.exportCollection = exportCollection;
window.importCollection = importCollection;
