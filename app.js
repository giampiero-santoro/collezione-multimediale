/**
 * Collezione Multimediale - App Logic
 */
(() => {
  const STORAGE_KEY = 'mediaCollection';
  const THEME_KEY = 'mediaTheme';
  const DEFAULT_SORT_FIELD = 'titolo';

  let collection = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let sortField = DEFAULT_SORT_FIELD;
  let sortDirection = 1;
  let tableView = false;

  const grid = document.getElementById('collectionGrid');
  const emptyState = document.getElementById('emptyState');
  const searchBar = document.getElementById('searchBar');
  const filterCat = document.getElementById('filterCategoria');
  const filterCondition = document.getElementById('filterCondizione');
  const btnSort = document.getElementById('btnSort');
  const manualForm = document.getElementById('manualForm');
  const importInput = document.getElementById('importInput');
  const themeBtn = document.getElementById('themeBtn');
  const clearBtn = document.getElementById('btnClear');
  const csvBtn = document.getElementById('btnCsv');
  const toggleViewBtn = document.getElementById('btnToggleView');
  const toast = document.getElementById('toast');
  const summaryTotal = document.getElementById('summaryTotal');
  const statTotalItems = document.getElementById('statTotalItems');
  const statTotalSpent = document.getElementById('statTotalSpent');
  const statLibri = document.getElementById('statLibri');
  const statMusica = document.getElementById('statMusica');

  const categoryMap = {
    libri: 'Libro',
    fumetti: 'Fumetto',
    musica: 'Musica',
    video: 'Video',
    altro: 'Altro'
  };

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function iconSvg(name) {
    const icons = {
      scan: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9V7a2 2 0 0 1 2-2h2"/><path d="M15 3h2a2 2 0 0 1 2 2v2"/><path d="M3 15v2a2 2 0 0 0 2 2h2"/><path d="M21 15v2a2 2 0 0 1-2 2h-2"/><path d="M7 9h10v6H7z"/><path d="M9 9V6"/><path d="M15 9V6"/></svg>',
      plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
      export: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 18 5 5 5-5"/><path d="M5 21h14"/></svg>',
      import: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9"/><path d="m7 15 5-5 5 5"/><path d="M5 3h14"/></svg>',
      trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
      sort: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 15 5 5 5-5"/><path d="M12 20V4"/></svg>',
      list: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
      sun: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/></svg>',
      moon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 0 1 11.2 3a9 9 0 1 0 9.8 9.8Z"/></svg>',
      edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>',
      calendar: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>',
      tag: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12 12 20 4 12V4h8z"/><path d="M9 9h.01"/></svg>',
      package: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 3 7l9 5 9-5-9-5Z"/><path d="M3 7v10l9 5 9-5V7"/><path d="M12 12v10"/></svg>',
      pin: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
      euro: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h11"/><path d="M4 14.5h11"/><path d="M15 4a4 4 0 0 1 0 8"/><path d="M15 12a4 4 0 0 1 0 8"/></svg>'
    };
    return icons[name] || '';
  }

  function normalizeCategory(cat) {
    return categoryMap[cat] ? cat : 'altro';
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => toast.classList.add('hidden'), 2200);
  }

  function saveCollection() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    render();
  }

  function getBadgeClass(cat) {
    return `badge badge-${normalizeCategory(cat)}`;
  }

  function getCategoryLabel(cat) {
    return categoryMap[normalizeCategory(cat)] || 'Altro';
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      const overlay = event.target.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });

  function syncQuickCategoryButtons(selectedCategory = document.getElementById('fCat').value) {
    document.querySelectorAll('.scan-category-btn').forEach(btn => {
      const isActive = btn.dataset.category === selectedCategory;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  function setManualCategory(category) {
    const select = document.getElementById('fCat');
    if (!select) return;
    if (category && Array.from(select.options).some(option => option.value === category)) {
      select.value = category;
    }
    syncQuickCategoryButtons(select.value);
  }

  function buildItemFromForm() {
    return {
      titolo: document.getElementById('fTitolo').value.trim(),
      categoria: document.getElementById('fCat').value,
      autore: document.getElementById('fAutore').value.trim(),
      anno: document.getElementById('fAnno').value.trim(),
      copertina: document.getElementById('fImmagine').value.trim(),
      condizione: document.getElementById('fCondizione').value,
      quantita: Number(document.getElementById('fQuantita').value) || 1,
      collocazione: document.getElementById('fCollocazione').value.trim(),
      prezzo: document.getElementById('fPrezzo').value.trim(),
      note: document.getElementById('fNote').value.trim()
    };
  }

  function openManualForm(prefill = {}) {
    manualForm.reset();
    delete manualForm.dataset.editId;
    delete manualForm.dataset.scannedCode;

    if (prefill.titolo) {
      document.getElementById('fTitolo').value = prefill.titolo;
    }
    if (prefill.categoria) {
      setManualCategory(prefill.categoria);
    } else {
      syncQuickCategoryButtons(document.getElementById('fCat').value);
    }
    if (prefill.note) {
      document.getElementById('fNote').value = prefill.note;
    }
    if (prefill.code) {
      manualForm.dataset.scannedCode = String(prefill.code);
    }

    document.getElementById('manualModal').querySelector('h2').textContent = 'Aggiungi elemento';
    openModal('manualModal');
    document.getElementById('fTitolo').focus();
  }

  function closeManualForm() {
    closeModal('manualModal');
    manualForm.reset();
    delete manualForm.dataset.editId;
    delete manualForm.dataset.scannedCode;
    syncQuickCategoryButtons('libri');
    document.getElementById('manualModal').querySelector('h2').textContent = 'Aggiungi elemento';
  }

  function getCoverUrl(value) {
    if (!value) return 'https://placehold.co/300x450/1f2937/ffffff?text=Copertina';
    return value;
  }

  function buildItemCard(item) {
    const badgeClass = getBadgeClass(item.categoria);
    const categoryLabel = getCategoryLabel(item.categoria);
    const title = escapeHtml(item.titolo || 'Titolo sconosciuto');
    const author = escapeHtml(item.autore || 'Autore sconosciuto');
    const year = item.anno ? escapeHtml(item.anno) : 'Anno sconosciuto';
    const condition = item.condizione ? `<span class="meta-pill">${iconSvg('tag')} ${escapeHtml(item.condizione)}</span>` : '';
    const quantity = item.quantita && Number(item.quantita) > 1 ? `<span class="meta-pill">${iconSvg('package')} ${escapeHtml(item.quantita)}</span>` : '';
    const location = item.collocazione ? `<span class="meta-pill">${iconSvg('pin')} ${escapeHtml(item.collocazione)}</span>` : '';
    const price = item.prezzo ? `<span class="meta-pill">${iconSvg('euro')} €${escapeHtml(Number(item.prezzo).toFixed(2))}</span>` : '';
    const note = item.note ? `<p class="mt-2 text-sm text-slate-300">${escapeHtml(item.note)}</p>` : '';
    const cover = escapeHtml(getCoverUrl(item.copertina));

    return `
      <article class="card h-full">
        <div class="flex items-center justify-between mb-3">
          <span class="${badgeClass}">${categoryLabel}</span>
          <div class="flex gap-2">
            <button type="button" class="text-xs text-slate-300 hover:text-purple-300" onclick="openEditModal(${item.id})" aria-label="Modifica">${iconSvg('edit')}</button>
            <button type="button" class="text-xs text-slate-300 hover:text-red-400" onclick="removeItem(${item.id})" aria-label="Elimina">${iconSvg('trash')}</button>
          </div>
        </div>
        <img src="${cover}" alt="${title}" class="cover" loading="lazy">
        <h3 class="font-semibold text-lg leading-snug">${title}</h3>
        <p class="text-sm text-slate-400 mt-1">${author}</p>
        <div class="meta-row">
          <span class="meta-pill">${iconSvg('calendar')} ${year}</span>
          ${condition}
          ${quantity}
          ${location}
          ${price}
        </div>
        ${note}
      </article>
    `;
  }

  function getFilteredItems() {
    const query = searchBar.value.trim().toLowerCase();
    const category = filterCat.value;
    const condition = filterCondition.value;

    return [...collection]
      .filter(item => {
        const matchesCategory = category === 'tutti' || item.categoria === category;
        const matchesCondition = condition === 'tutte' || item.condizione === condition;
        const searchableText = [
          item.titolo,
          item.autore,
          item.collocazione,
          item.note,
          item.condizione,
          item.categoria
        ].join(' ').toLowerCase();
        const matchesQuery = !query || searchableText.includes(query);
        return matchesCategory && matchesCondition && matchesQuery;
      })
      .sort((a, b) => {
        const aValue = (a[sortField] || '').toString().toLowerCase();
        const bValue = (b[sortField] || '').toString().toLowerCase();

        if (sortField === 'anno') {
          return (Number(a.anno || 0) - Number(b.anno || 0)) * sortDirection;
        }

        if (aValue < bValue) return -1 * sortDirection;
        if (aValue > bValue) return 1 * sortDirection;
        return 0;
      });
  }

  function renderSummary() {
    const total = collection.length;
    const byCategory = Object.keys(categoryMap).reduce((acc, key) => {
      acc[key] = collection.filter(item => item.categoria === key).length;
      return acc;
    }, {});
    const totalSpent = collection.reduce((sum, item) => {
      const value = Number(item.prezzo);
      return Number.isFinite(value) ? sum + value * Number(item.quantita || 1) : sum;
    }, 0);

    const summaryText = Object.entries(byCategory)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${categoryMap[key]}: ${count}`)
      .join(' · ') || 'Nessun elemento';

    summaryTotal.textContent = `${total}`;
    summaryTotal.title = summaryText;
    statTotalItems.textContent = `${total}`;
    statTotalSpent.textContent = `€${totalSpent.toFixed(2).replace('.', ',')}`;
    statLibri.textContent = `${byCategory.libri || 0}`;
    statMusica.textContent = `${byCategory.musica || 0}`;
  }

  function buildTableMarkup(items) {
    if (!items.length) return '<div class="text-center py-8 text-slate-400">Nessun risultato</div>';

    const rows = items.map(item => `
      <tr>
        <td>${escapeHtml(item.titolo || '')}</td>
        <td>${escapeHtml(item.autore || '')}</td>
        <td>${escapeHtml(getCategoryLabel(item.categoria))}</td>
        <td>${escapeHtml(item.condizione || '')}</td>
        <td>${escapeHtml(item.collocazione || '')}</td>
        <td>${escapeHtml(item.prezzo ? `€${Number(item.prezzo).toFixed(2)}` : '')}</td>
        <td>
          <button type="button" class="table-action" onclick="openEditModal(${item.id})" aria-label="Modifica">${iconSvg('edit')}</button>
          <button type="button" class="table-action danger" onclick="removeItem(${item.id})" aria-label="Elimina">${iconSvg('trash')}</button>
        </td>
      </tr>
    `).join('');

    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titolo</th>
              <th>Autore</th>
              <th>Categoria</th>
              <th>Condizione</th>
              <th>Collocazione</th>
              <th>Prezzo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function render() {
    const items = getFilteredItems();
    renderSummary();

    if (!items.length) {
      emptyState.classList.remove('hidden');
      grid.innerHTML = '';
      return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = tableView ? buildTableMarkup(items) : items.map(buildItemCard).join('');
    toggleViewBtn.innerHTML = `${iconSvg(tableView ? 'list' : 'list')} <span>${tableView ? 'Vista card' : 'Vista tabella'}</span>`;
  }

  function addItem(item) {
    const newItem = {
      id: Date.now() + Math.random(),
      titolo: item.titolo || '',
      categoria: normalizeCategory(item.categoria),
      autore: item.autore || '',
      anno: item.anno || '',
      copertina: item.copertina || '',
      condizione: item.condizione || '',
      quantita: item.quantita || 1,
      collocazione: item.collocazione || '',
      prezzo: item.prezzo || '',
      note: item.note || ''
    };

    if (!newItem.titolo) return;
    collection.unshift(newItem);
    saveCollection();
  }

  function updateItem(id, item) {
    const index = collection.findIndex(entry => Number(entry.id) === Number(id));
    if (index === -1) return;

    collection[index] = {
      ...collection[index],
      titolo: item.titolo || '',
      categoria: normalizeCategory(item.categoria),
      autore: item.autore || '',
      anno: item.anno || '',
      copertina: item.copertina || '',
      condizione: item.condizione || '',
      quantita: item.quantita || 1,
      collocazione: item.collocazione || '',
      prezzo: item.prezzo || '',
      note: item.note || ''
    };

    saveCollection();
  }

  function removeItem(id) {
    const itemToRemove = collection.find(item => Number(item.id) === Number(id));
    if (!itemToRemove) return;

    const confirmed = window.confirm(`Rimuovere "${itemToRemove.titolo}" dalla collezione?`);
    if (!confirmed) return;

    collection = collection.filter(item => Number(item.id) !== Number(id));
    saveCollection();
  }

  function clearCollection() {
    if (!collection.length) return;

    const confirmed = window.confirm('Svuotare completamente la collezione?');
    if (!confirmed) return;

    collection = [];
    saveCollection();
    showToast('Collezione svuotata');
  }

  function setSort(field, direction) {
    sortField = field;
    sortDirection = direction;
    render();
    sortOrder.classList.remove('active');
    const directionLabel = direction === 1 ? 'crescente' : 'decrescente';
    const fieldLabel = field === 'titolo' ? 'Titolo' : 'Anno';
    btnSort.innerHTML = `${iconSvg('sort')} <span>Ordina (${fieldLabel} ${directionLabel})</span>`;
    btnSort.setAttribute('aria-label', `Ordina per ${field === 'titolo' ? 'titolo' : 'anno'} ${direction === 1 ? 'crescente' : 'decrescente'}`);
  }

  function openEditModal(id) {
    const item = collection.find(entry => Number(entry.id) === Number(id));
    if (!item) return;

    manualForm.dataset.editId = String(item.id);
    document.getElementById('fTitolo').value = item.titolo || '';
    document.getElementById('fCat').value = normalizeCategory(item.categoria);
    document.getElementById('fAutore').value = item.autore || '';
    document.getElementById('fAnno').value = item.anno || '';
    document.getElementById('fImmagine').value = item.copertina || '';
    document.getElementById('fCondizione').value = item.condizione || '';
    document.getElementById('fQuantita').value = item.quantita || 1;
    document.getElementById('fPrezzo').value = item.prezzo || '';
    document.getElementById('fCollocazione').value = item.collocazione || '';
    document.getElementById('fNote').value = item.note || '';
    document.getElementById('manualModal').querySelector('h2').textContent = 'Modifica elemento';
    openModal('manualModal');
    document.getElementById('fTitolo').focus();
  }

  // ---------- SCANNER ----------
  let scannerInstance = null;

  function closeScanner() {
    closeModal('scannerModal');
    if (scannerInstance) {
      try {
        if (scannerInstance.controls && typeof scannerInstance.controls.stop === 'function') {
          scannerInstance.controls.stop();
        }
      } catch (error) {}
      try {
        if (scannerInstance.reader && typeof scannerInstance.reader.reset === 'function') {
          scannerInstance.reader.reset();
        }
      } catch (error) {}
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.innerHTML = '';
      }
      scannerInstance = null;
    }
  }

  function openScanner() {
    openModal('scannerModal');
    const statusEl = document.getElementById('scannerStatus');
    statusEl.textContent = 'Posiziona il codice a barre davanti alla fotocamera';

    if (typeof ZXingBrowser === 'undefined' || !ZXingBrowser.BrowserMultiFormatReader) {
      statusEl.textContent = 'Scanner non disponibile. Controlla la connessione o inserisci il codice manualmente.';
      setTimeout(() => {
        closeScanner();
        openManualForm();
      }, 1400);
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusEl.textContent = 'Questo browser non supporta l’accesso alla fotocamera. Usa inserimento manuale.';
      setTimeout(() => {
        closeScanner();
        openManualForm();
      }, 1400);
      return;
    }

    if (scannerInstance) {
      closeScanner();
    }

    const readerElement = document.getElementById('reader');
    if (!readerElement) return;
    readerElement.innerHTML = '<video id="scannerVideo" playsinline autoplay muted style="width:100%;max-height:320px;border-radius:12px;background:#000;"></video>';

    const videoElement = document.getElementById('scannerVideo');
    const codeReader = new ZXingBrowser.BrowserMultiFormatReader();

    ZXingBrowser.BrowserCodeReader.listVideoInputDevices()
      .then((videoInputDevices) => {
        const selectedDeviceId = videoInputDevices[0]?.deviceId || undefined;

        if (!selectedDeviceId) {
          statusEl.textContent = 'Nessuna webcam rilevata. Prova a usare un dispositivo con fotocamera.';
          setTimeout(() => {
            closeScanner();
            openManualForm();
          }, 1600);
          return;
        }

        codeReader.decodeFromVideoDevice(selectedDeviceId, videoElement, (result, error, controls) => {
          if (result) {
            statusEl.textContent = `Codice: ${result.getText()}`;
            scannerInstance = { reader: codeReader, controls };
            controls.stop();
            enrichFromBarcode(result.getText());
            return;
          }

          if (error && error.name !== 'NotFoundException') {
            console.debug(error);
          }
        }).then((controls) => {
          scannerInstance = { reader: codeReader, controls };
        }).catch((error) => {
          console.error('Scanner error:', error);
          statusEl.textContent = 'Impossibile avviare la fotocamera. Verifica i permessi del browser e riprova.';
          setTimeout(() => {
            closeScanner();
            openManualForm();
          }, 1800);
        });
      })
      .catch((error) => {
        console.error('Scanner init error:', error);
        statusEl.textContent = 'Impossibile inizializzare il lettore barcode.';
        setTimeout(() => {
          closeScanner();
          openManualForm();
        }, 1600);
      });
  }

  function normalizeBarcode(code) {
    return String(code || '').trim().replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  function looksLikeIsbn(code) {
    const cleaned = normalizeBarcode(code);
    return /^[0-9]{10}([0-9X])?$|^[0-9]{13}$/.test(cleaned);
  }

  function inferBarcodeCategory(code) {
    const cleaned = normalizeBarcode(code);
    if (!cleaned) return 'altro';

    if (/^(978|979)/.test(cleaned) || /^[0-9]{10}([0-9X])?$|^[0-9]{13}$/.test(cleaned)) {
      return 'libri';
    }

    if (/^[0-9]{12,13}$/.test(cleaned) && cleaned.startsWith('7') || /^[0-9]{12,13}$/.test(cleaned) && cleaned.startsWith('8') || /^[0-9]{12,13}$/.test(cleaned) && cleaned.startsWith('9')) {
      return 'musica';
    }

    if (/^[0-9]{12,13}$/.test(cleaned) && cleaned.startsWith('0')) {
      return 'video';
    }

    return 'altro';
  }

  async function enrichFromBarcode(code) {
    closeScanner();
    const cleanedCode = normalizeBarcode(code);

    if (!cleanedCode) {
      openManualForm({ titolo: String(code || '').trim() || 'Codice scansionato' });
      return;
    }

    const detectedCategory = inferBarcodeCategory(cleanedCode);

    if (detectedCategory === 'libri' && looksLikeIsbn(cleanedCode)) {
      try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedCode}`);
        const data = await response.json();

        if (data.items && data.items.length) {
          const volume = data.items[0].volumeInfo;
          addItem({
            titolo: volume.title || cleanedCode,
            categoria: 'libri',
            autore: volume.authors ? volume.authors.join(', ') : '',
            anno: volume.publishedDate ? volume.publishedDate.split('-')[0] : '',
            copertina: volume.imageLinks?.thumbnail || '',
            note: volume.description ? volume.description.slice(0, 200) : `ISBN: ${cleanedCode}`
          });
          return;
        }
      } catch (error) {
        console.error('Errore Google Books:', error);
      }
    }

    openManualForm({
      titolo: cleanedCode,
      categoria: detectedCategory,
      code: cleanedCode,
      note: `Codice scansionato: ${cleanedCode}`
    });
  }

  function exportCollection() {
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'collezione-multimediale.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    showToast('JSON esportato');
  }

  function exportCsv() {
    const items = getFilteredItems();
    const headers = ['Titolo', 'Autore', 'Categoria', 'Anno', 'Condizione', 'Quantità', 'Collocazione', 'Prezzo', 'Note'];
    const rows = items.map(item => [
      item.titolo || '',
      item.autore || '',
      getCategoryLabel(item.categoria),
      item.anno || '',
      item.condizione || '',
      item.quantita || 1,
      item.collocazione || '',
      item.prezzo || '',
      item.note || ''
    ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'collezione-multimediale.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    showToast('CSV esportato');
  }

  function importCollection() {
    importInput.click();
  }

  // ---------- IMPORT / EXPORT / THEME / SORT ----------
  const sortOrder = document.createElement('div');
  sortOrder.id = 'sortOrder';
  sortOrder.innerHTML = `
    <button type="button" data-field="titolo" data-direction="1">Titolo ↑</button>
    <button type="button" data-field="titolo" data-direction="-1">Titolo ↓</button>
    <button type="button" data-field="anno" data-direction="1">Anno ↑</button>
    <button type="button" data-field="anno" data-direction="-1">Anno ↓</button>
  `;
  btnSort.insertAdjacentElement('afterend', sortOrder);

  sortOrder.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-field]');
    if (!btn) return;
    setSort(btn.dataset.field, Number(btn.dataset.direction));
  });

  btnSort.addEventListener('click', (event) => {
    event.stopPropagation();
    sortOrder.classList.toggle('active');
  });

  toggleViewBtn.addEventListener('click', () => {
    tableView = !tableView;
    render();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#btnSort') && !event.target.closest('#sortOrder')) {
      sortOrder.classList.remove('active');
    }
  });

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.body.classList.toggle('light', isLight);
    themeBtn.innerHTML = iconSvg(isLight ? 'moon' : 'sun');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  }

  themeBtn.addEventListener('click', () => {
    applyTheme(document.body.classList.contains('light') ? 'dark' : 'light');
  });

  applyTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark');

  importInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported)) throw new Error('Dati non validi');
        collection = imported.map(item => ({
          id: Number(item.id) || Date.now() + Math.random(),
          titolo: item.titolo || 'Titolo sconosciuto',
          categoria: normalizeCategory(item.categoria),
          autore: item.autore || '',
          anno: item.anno || '',
          copertina: item.copertina || '',
          condizione: item.condizione || '',
          quantita: item.quantita || 1,
          collocazione: item.collocazione || '',
          prezzo: item.prezzo || '',
          note: item.note || ''
        }));
        saveCollection();
        showToast('Collezione importata');
      } catch (error) {
        alert('File JSON non valido');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  });

  document.querySelectorAll('.scan-category-btn').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.category;
      setManualCategory(category);

      if (manualForm.dataset.scannedCode && !manualForm.dataset.editId) {
        const item = buildItemFromForm();
        if (!item.titolo) return;
        addItem({ ...item, categoria: category, note: item.note || `Codice scansionato: ${manualForm.dataset.scannedCode}` });
        showToast(`Elemento salvato come ${getCategoryLabel(category)}`);
        closeManualForm();
      }
    });
  });

  document.getElementById('fCat').addEventListener('change', () => {
    syncQuickCategoryButtons(document.getElementById('fCat').value);
  });

  document.getElementById('btnManual').addEventListener('click', () => openManualForm());
  document.getElementById('btnScan').addEventListener('click', openScanner);
  document.getElementById('btnExport').addEventListener('click', exportCollection);
  csvBtn.addEventListener('click', exportCsv);
  document.getElementById('btnImport').addEventListener('click', importCollection);
  clearBtn.addEventListener('click', clearCollection);
  searchBar.addEventListener('input', render);
  filterCat.addEventListener('change', render);
  filterCondition.addEventListener('change', render);

  manualForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const item = buildItemFromForm();

    if (!item.titolo) return;

    if (form.dataset.editId) {
      updateItem(form.dataset.editId, item);
      showToast('Elemento aggiornato');
    } else {
      addItem(item);
      showToast('Elemento aggiunto');
    }

    closeManualForm();
    document.getElementById('manualModal').querySelector('h2').textContent = 'Aggiungi elemento';
  });

  window.removeItem = removeItem;
  window.openEditModal = openEditModal;
  window.openManualForm = openManualForm;
  window.closeManualForm = closeManualForm;
  window.openScanner = openScanner;
  window.closeScanner = closeScanner;
  window.exportCollection = exportCollection;
  window.importCollection = importCollection;
  window.clearCollection = clearCollection;
  window.exportCsv = exportCsv;

  // ---------- INIT ----------
  setSort('titolo', 1);
  render();
})();
