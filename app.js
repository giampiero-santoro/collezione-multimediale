/* =========================================================================
   app.js — Teca
   Logica dell'applicazione: nessuna dipendenza da build tool, solo
   JavaScript ES6+ eseguito direttamente nel browser.

   Indice del file:
   1. Configurazione e costanti (categorie, chiavi di storage)
   2. Stato dell'applicazione e persistenza in localStorage
   3. Utility varie (escape HTML, toast, id univoci, data)
   4. Rendering: griglia collezione, filtri categoria, statistiche
   5. CRUD: apertura modali, salvataggio, eliminazione
   6. Scanner codici a barre (html5-qrcode)
   7. Arricchimento dati via API esterne (Google Books, Open Library,
      MusicBrainz)
   8. Import / Export JSON
   9. Tema chiaro/scuro
   10. Inizializzazione e collegamento degli event listener
   ========================================================================= */

/* ============================ 1. CONFIGURAZIONE ========================= */

// Definizione delle categorie gestite dall'app: etichetta mostrata,
// classe CSS per la barra colorata sulla card e colore esadecimale
// usato per i pallini nei filtri (stessi colori definiti in styles.css).
const CATEGORIES = {
  libro:    { label: 'Libro',    barClass: 'cat-libro',    color: '#6f9f7d' },
  fumetto:  { label: 'Fumetto',  barClass: 'cat-fumetto',  color: '#d4844a' },
  vinile:   { label: 'Vinile',   barClass: 'cat-vinile',   color: '#b06bb0' },
  cd:       { label: 'CD',       barClass: 'cat-cd',       color: '#5b9bd1' },
  dvd:      { label: 'DVD',      barClass: 'cat-dvd',      color: '#cf5c5c' },
  gioco:    { label: 'Gioco',    barClass: 'cat-gioco',    color: '#4fb0a5' },
  altro:    { label: 'Altro',    barClass: 'cat-altro',    color: '#9a9498' },
};

const STORAGE_KEY = 'teca-collezione';   // chiave localStorage per i dati
const THEME_KEY   = 'teca-theme';        // chiave localStorage per il tema

/* ==================== 2. STATO E PERSISTENZA LOCALSTORAGE =============== */

// Stato "vivo" dell'applicazione, tenuto in memoria e sincronizzato con
// localStorage ad ogni modifica.
const state = {
  collection: [],          // array di oggetti { id, title, category, author, year, notes, cover, barcode, dateAdded }
  search: '',
  activeCategory: 'all',
  sort: 'date-desc',
  editingId: null,         // id dell'elemento attualmente in modifica (null = nuovo elemento)
  pendingDeleteId: null,   // id in attesa di conferma di eliminazione
};

/** Carica la collezione salvata in localStorage (array vuoto se assente o corrotta). */
function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Errore nella lettura della collezione salvata:', err);
    return [];
  }
}

/** Salva l'intera collezione corrente in localStorage. */
function persistCollection() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.collection));
}

/* ================================ 3. UTILITY ============================ */

/** Genera un id univoco senza dipendere da librerie esterne. */
function generateId() {
  return 'itm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/** Sanifica una stringa prima di inserirla come testo in innerHTML. */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Mostra una notifica toast in basso a destra, che scompare da sola. */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const colors = {
    info:    'bg-ink-800 text-ink-50',
    success: 'bg-brass-600 text-ink-950',
    error:   'bg-red-600 text-white',
  };
  const toast = document.createElement('div');
  toast.className = `toast px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${colors[type] || colors.info}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.25s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 260);
  }, 2600);
}

/** Restituisce le iniziali del titolo, usate come copertina di fallback. */
function initialsFromTitle(title) {
  if (!title) return '?';
  const words = title.trim().split(/\s+/).slice(0, 2);
  return words.map(w => w[0].toUpperCase()).join('');
}

/* ============================ 4. RENDERING =============================== */

/** Ricalcola e mostra la lista filtrata + ordinata della collezione. */
function renderGrid() {
  const grid = document.getElementById('collection-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyStateSub = document.getElementById('empty-state-sub');
  const statsBar = document.getElementById('stats-bar');

  // 1. Filtro per categoria attiva
  let items = state.collection.filter(item =>
    state.activeCategory === 'all' || item.category === state.activeCategory
  );

  // 2. Filtro per testo di ricerca (titolo o autore, case-insensitive)
  const query = state.search.trim().toLowerCase();
  if (query) {
    items = items.filter(item =>
      (item.title || '').toLowerCase().includes(query) ||
      (item.author || '').toLowerCase().includes(query)
    );
  }

  // 3. Ordinamento
  const sorters = {
    'date-desc':  (a, b) => b.dateAdded - a.dateAdded,
    'date-asc':   (a, b) => a.dateAdded - b.dateAdded,
    'title-asc':  (a, b) => (a.title || '').localeCompare(b.title || '', 'it'),
    'title-desc': (a, b) => (b.title || '').localeCompare(a.title || '', 'it'),
    'year-desc':  (a, b) => (b.year || 0) - (a.year || 0),
    'year-asc':   (a, b) => (a.year || 0) - (b.year || 0),
  };
  items = [...items].sort(sorters[state.sort] || sorters['date-desc']);

  // 4. Statistiche testuali sopra la griglia
  const totalCount = state.collection.length;
  statsBar.textContent = query || state.activeCategory !== 'all'
    ? `${items.length} risultat${items.length === 1 ? 'o' : 'i'} su ${totalCount} nella collezione`
    : `${totalCount} element${totalCount === 1 ? 'o' : 'i'} in collezione`;

  // 5. Stato vuoto: collezione mai popolata vs nessun risultato per il filtro
  if (items.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
    emptyStateSub.textContent = totalCount === 0
      ? 'Aggiungi il primo elemento inquadrando un codice a barre oppure inserendo i dati a mano.'
      : 'Nessun elemento corrisponde alla ricerca o al filtro selezionato.';
    return;
  }
  emptyState.classList.add('hidden');
  emptyState.classList.remove('flex');

  // 6. Costruzione delle card
  grid.innerHTML = items.map(item => {
    const cat = CATEGORIES[item.category] || CATEGORIES.altro;
    const coverHtml = item.cover
      ? `<img src="${escapeHtml(item.cover)}" alt="" loading="lazy"
           class="w-full h-full object-cover"
           onerror="this.replaceWith(Object.assign(document.createElement('div'), {
             className: 'cover-fallback w-full h-full bg-ink-200 dark:bg-ink-800 text-ink-500 dark:text-ink-400 text-2xl',
             textContent: ${JSON.stringify(initialsFromTitle(item.title))}
           }))">`
      : `<div class="cover-fallback w-full h-full bg-ink-200 dark:bg-ink-800 text-ink-500 dark:text-ink-400 text-2xl">${escapeHtml(initialsFromTitle(item.title))}</div>`;

    return `
      <button data-id="${item.id}" class="item-card group text-left rounded-xl overflow-hidden border border-ink-300/50 dark:border-ink-700/70 bg-white/50 dark:bg-ink-900/60 hover:border-brass-400/60 hover:shadow-lg dark:hover:shadow-black/30 shadow-sm">
        <span class="category-bar ${cat.barClass}"></span>
        <div class="aspect-[2/3] w-full overflow-hidden bg-ink-100 dark:bg-ink-800">
          ${coverHtml}
        </div>
        <div class="p-3">
          <p class="text-[11px] font-medium mb-1" style="color:${cat.color}">${escapeHtml(cat.label)}</p>
          <p class="font-serif italic font-medium leading-snug line-clamp-2">${escapeHtml(item.title)}</p>
          <p class="text-xs text-ink-500 dark:text-ink-400 mt-1 line-clamp-1">${escapeHtml(item.author || '')}${item.author && item.year ? ' · ' : ''}${item.year || ''}</p>
        </div>
      </button>
    `;
  }).join('');
}

/** Costruisce la barra dei filtri per categoria, con conteggio elementi. */
function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  const counts = state.collection.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const allBtn = makeFilterChip('all', 'Tutti', state.collection.length, null);
  const chips = Object.entries(CATEGORIES).map(([key, cat]) =>
    makeFilterChip(key, cat.label, counts[key] || 0, cat.color)
  );

  container.innerHTML = [allBtn, ...chips].join('');
}

/** Genera l'HTML di un singolo chip di filtro categoria. */
function makeFilterChip(key, label, count, color) {
  const active = state.activeCategory === key;
  const baseClasses = active
    ? 'bg-brass-500 text-ink-950 border-brass-500'
    : 'bg-transparent border-ink-300/60 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-200/50 dark:hover:bg-ink-800';
  const dot = color ? `<span class="cat-dot" style="background-color:${color}"></span>` : '';
  return `
    <button data-category="${key}" class="filter-chip inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${baseClasses}">
      ${dot}${escapeHtml(label)}
      <span class="opacity-60">${count}</span>
    </button>
  `;
}

/* ================================ 5. CRUD ================================ */

/** Popola le opzioni <select> di categoria nel form (eseguito una sola volta). */
function populateCategorySelect() {
  const select = document.getElementById('field-category');
  select.innerHTML = Object.entries(CATEGORIES)
    .map(([key, cat]) => `<option value="${key}">${escapeHtml(cat.label)}</option>`)
    .join('');
}

/** Resetta e apre il modale per l'inserimento di un nuovo elemento. */
function openAddModal(prefill = {}) {
  state.editingId = null;
  document.getElementById('modal-title').textContent = 'Nuovo elemento';
  document.getElementById('btn-delete-item').classList.add('hidden');
  document.getElementById('item-form').reset();
  document.getElementById('field-id').value = '';
  document.getElementById('lookup-status').classList.add('hidden');
  updateCoverPreview('');

  // Applica eventuali valori pre-compilati (es. dopo una scansione)
  if (prefill.title)    document.getElementById('field-title').value = prefill.title;
  if (prefill.author)   document.getElementById('field-author').value = prefill.author;
  if (prefill.year)     document.getElementById('field-year').value = prefill.year;
  if (prefill.notes)    document.getElementById('field-notes').value = prefill.notes;
  if (prefill.cover)  { document.getElementById('field-cover').value = prefill.cover; updateCoverPreview(prefill.cover); }
  if (prefill.category) document.getElementById('field-category').value = prefill.category;
  if (prefill.barcode)   document.getElementById('field-barcode').value = prefill.barcode;

  openModal('item-modal');
}

/** Apre il modale in modalità modifica, precompilato con i dati dell'elemento. */
function openEditModal(id) {
  const item = state.collection.find(i => i.id === id);
  if (!item) return;

  state.editingId = id;
  document.getElementById('modal-title').textContent = 'Modifica elemento';
  document.getElementById('btn-delete-item').classList.remove('hidden');
  document.getElementById('lookup-status').classList.add('hidden');

  document.getElementById('field-id').value = item.id;
  document.getElementById('field-title').value = item.title || '';
  document.getElementById('field-category').value = item.category || 'altro';
  document.getElementById('field-year').value = item.year || '';
  document.getElementById('field-author').value = item.author || '';
  document.getElementById('field-barcode').value = item.barcode || '';
  document.getElementById('field-notes').value = item.notes || '';
  document.getElementById('field-cover').value = item.cover || '';
  updateCoverPreview(item.cover || '');

  openModal('item-modal');
}

/** Aggiorna l'anteprima della copertina nel form in base all'URL inserito. */
function updateCoverPreview(url) {
  const img = document.getElementById('cover-preview');
  const placeholder = document.getElementById('cover-placeholder');
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
    img.onerror = () => { img.classList.add('hidden'); placeholder.classList.remove('hidden'); };
  } else {
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
}

/** Gestisce l'invio del form: crea o aggiorna un elemento della collezione. */
function handleFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('field-title').value.trim();
  if (!title) return; // il campo required del browser dovrebbe già bloccare questo caso

  const payload = {
    title,
    category: document.getElementById('field-category').value,
    author: document.getElementById('field-author').value.trim(),
    year: document.getElementById('field-year').value ? Number(document.getElementById('field-year').value) : null,
    notes: document.getElementById('field-notes').value.trim(),
    cover: document.getElementById('field-cover').value.trim(),
    barcode: document.getElementById('field-barcode').value.trim(),
  };

  if (state.editingId) {
    // Modifica: aggiorna l'elemento esistente mantenendo id e data di aggiunta originali
    const index = state.collection.findIndex(i => i.id === state.editingId);
    if (index !== -1) {
      state.collection[index] = { ...state.collection[index], ...payload };
    }
    showToast('Elemento aggiornato', 'success');
  } else {
    // Nuovo elemento
    state.collection.push({
      id: generateId(),
      dateAdded: Date.now(),
      ...payload,
    });
    showToast('Elemento aggiunto alla collezione', 'success');
  }

  persistCollection();
  renderCategoryFilters();
  renderGrid();
  closeModal('item-modal');
}

/** Apre il modale di conferma per l'eliminazione dell'elemento in modifica. */
function requestDeleteCurrentItem() {
  if (!state.editingId) return;
  state.pendingDeleteId = state.editingId;
  openModal('confirm-modal');
}

/** Esegue l'eliminazione confermata dall'utente. */
function confirmDelete() {
  if (!state.pendingDeleteId) return;
  state.collection = state.collection.filter(i => i.id !== state.pendingDeleteId);
  persistCollection();
  state.pendingDeleteId = null;
  renderCategoryFilters();
  renderGrid();
  closeModal('confirm-modal');
  closeModal('item-modal');
  showToast('Elemento eliminato', 'success');
}

/* Apertura/chiusura generica dei modali (aggiungono/rimuovono le classi Tailwind) */
function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.querySelector(':scope > div').classList.add('modal-panel-animate');
}
function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  if (id === 'item-modal') stopScanner(); // non lasciare la fotocamera accesa in background
}

/* ======================= 6. SCANNER CODICI A BARRE ======================= */

let html5QrCodeInstance = null;

/** Avvia la fotocamera e inizia la lettura dei codici a barre. */
async function startScanner() {
  const wrapper = document.getElementById('scanner-wrapper');
  const status = document.getElementById('scanner-status');
  wrapper.classList.remove('hidden');
  status.textContent = 'Inquadra il codice a barre con la fotocamera.';

  try {
    html5QrCodeInstance = new Html5Qrcode('scanner-reader');
    const config = {
      fps: 10,
      qrbox: { width: 260, height: 140 },
      // Limitiamo ai formati usati da libri, fumetti, musica e film:
      // ISBN e EAN/UPC sono quasi sempre codificati come EAN-13/EAN-8/UPC-A.
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    };
    await html5QrCodeInstance.start(
      { facingMode: 'environment' },   // preferisci la fotocamera posteriore su smartphone
      config,
      onScanSuccess,
      () => { /* nessun codice rilevato in questo frame: nulla da fare */ }
    );
  } catch (err) {
    console.error('Errore di accesso alla fotocamera:', err);
    showToast('Impossibile accedere alla fotocamera. Verifica i permessi del browser.', 'error');
    wrapper.classList.add('hidden');
  }
}

/** Ferma lo scanner e libera la fotocamera. */
async function stopScanner() {
  const wrapper = document.getElementById('scanner-wrapper');
  if (html5QrCodeInstance) {
    try {
      await html5QrCodeInstance.stop();
      html5QrCodeInstance.clear();
    } catch (err) {
      // La fotocamera potrebbe essere già stata fermata: non è un errore bloccante
    }
    html5QrCodeInstance = null;
  }
  wrapper.classList.add('hidden');
}

/** Callback invocata quando viene letto con successo un codice a barre. */
function onScanSuccess(decodedText) {
  stopScanner();
  document.getElementById('field-barcode').value = decodedText;
  lookupBarcode(decodedText);
}

/* ================== 7. ARRICCHIMENTO DATI VIA API ESTERNE ================ */

/** Mostra un messaggio di stato sotto il pulsante di scansione nel form. */
function setLookupStatus(message, type) {
  const el = document.getElementById('lookup-status');
  const colors = {
    info:    'text-ink-500 dark:text-ink-400',
    success: 'text-brass-600 dark:text-brass-300',
    warn:    'text-amber-600 dark:text-amber-400',
  };
  el.className = `text-sm text-center mt-2 ${colors[type] || colors.info}`;
  el.textContent = message;
  el.classList.remove('hidden');
}

/** Rimuove spazi, trattini e ogni carattere che non sia una cifra (o la X finale di alcuni ISBN-10). */
function cleanCode(code) {
  return (code || '').replace(/[^0-9Xx]/g, '');
}

/** Un codice è considerato un ISBN se ha 10 o 13 cifre (EAN-13 dei libri inizia con 978/979). */
function looksLikeIsbn(code) {
  const digits = cleanCode(code);
  if (digits.length === 10) return true;
  if (digits.length === 13 && (digits.startsWith('978') || digits.startsWith('979'))) return true;
  return false;
}

/** Punto di ingresso: prova le API in cascata secondo il tipo di codice individuato. */
async function lookupBarcode(rawCode) {
  const code = cleanCode(rawCode);
  if (!code) {
    setLookupStatus('Inserisci un codice valido prima di cercare.', 'warn');
    return;
  }
  // Tiene il campo coerente col valore pulito (senza spazi/trattini) usato per la ricerca
  document.getElementById('field-barcode').value = code;

  setLookupStatus('Ricerca dei dati in corso...', 'info');
  console.info('[Teca] Avvio ricerca per il codice:', code, '— sembra un ISBN:', looksLikeIsbn(code));

  try {
    let result = null;

    if (looksLikeIsbn(code)) {
      // Libri e fumetti: prima Open Library, poi Google Books come riserva
      result = await tryOpenLibrary(code);
      console.info('[Teca] Risultato Open Library:', result);
      if (!result) {
        result = await tryGoogleBooks(code);
        console.info('[Teca] Risultato Google Books:', result);
      }
      if (result && !result.category) result.category = 'libro';
    }

    if (!result) {
      // Musica, film o codice non riconosciuto come ISBN: prova MusicBrainz
      result = await tryMusicBrainz(code);
      console.info('[Teca] Risultato MusicBrainz:', result);
    }

    if (result) {
      applyLookupResult(result);
      setLookupStatus('Dati trovati e compilati automaticamente. Controlla e completa se necessario.', 'success');
    } else {
      setLookupStatus('Nessun dato trovato online per questo codice: completa i campi manualmente.', 'warn');
    }
  } catch (err) {
    // Un errore qui è quasi sempre di rete/CORS: si vede il dettaglio nella console del browser (F12).
    console.error('[Teca] Errore durante la ricerca del codice:', err);
    setLookupStatus('Errore di connessione alle API (vedi console): completa i campi manualmente.', 'warn');
  }
}

/** Interroga la Google Books API per un ISBN. */
async function tryGoogleBooks(isbn) {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`);
  if (!response.ok) {
    console.warn('[Teca] Google Books ha risposto con stato', response.status);
    return null;
  }
  const data = await response.json();
  const info = data.items && data.items[0] && data.items[0].volumeInfo;
  if (!info) return null;

  return {
    title: info.title || '',
    author: (info.authors || []).join(', '),
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null,
    notes: info.description ? info.description.slice(0, 500) : '',
    cover: info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '').replace('http://', 'https://') : '',
    barcode: isbn,
  };
}

/** Interroga Open Library come riserva quando Google Books non ha risultati. */
async function tryOpenLibrary(isbn) {
  const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`);
  if (!response.ok) {
    console.warn('[Teca] Open Library ha risposto con stato', response.status);
    return null;
  }
  const data = await response.json();
  const info = data[`ISBN:${isbn}`];
  if (!info) return null;

  return {
    title: info.title || '',
    author: (info.authors || []).map(a => a.name).join(', '),
    year: info.publish_date ? parseInt((info.publish_date.match(/\d{4}/) || [])[0], 10) || null : null,
    notes: '',
    cover: info.cover ? (info.cover.large || info.cover.medium || '') : '',
    barcode: isbn,
  };
}

/** Interroga MusicBrainz tramite il codice a barre (EAN/UPC) per musica e film. */
async function tryMusicBrainz(barcode) {
  const response = await fetch(`https://musicbrainz.org/ws/2/release/?query=barcode:${encodeURIComponent(barcode)}&fmt=json&limit=1`);
  if (!response.ok) {
    console.warn('[Teca] MusicBrainz ha risposto con stato', response.status);
    return null;
  }
  const data = await response.json();
  const release = data.releases && data.releases[0];
  if (!release) return null;

  const artist = (release['artist-credit'] || []).map(a => a.name).join(', ');
  let cover = '';
  // La copertina, se disponibile, vive nel Cover Art Archive collegato all'MBID.
  // Non blocchiamo l'attesa su questa chiamata: assegniamo l'URL diretto,
  // che il browser caricherà da solo (con fallback automatico alle iniziali
  // in caso di assenza, gestito da onerror nella card).
  if (release.id) {
    cover = `https://coverartarchive.org/release/${release.id}/front-250`;
  }

  return {
    title: release.title || '',
    author: artist,
    year: release.date ? parseInt(release.date.slice(0, 4), 10) : null,
    notes: '',
    cover,
    barcode,
    category: 'cd', // Ipotesi di default per un supporto musicale: modificabile a mano (es. Vinile)
  };
}

/** Applica il risultato di una ricerca API ai campi del form, senza sovrascrivere il titolo se già presente durante una modifica. */
function applyLookupResult(result) {
  if (result.title)  document.getElementById('field-title').value = result.title;
  if (result.author) document.getElementById('field-author').value = result.author;
  if (result.year)   document.getElementById('field-year').value = result.year;
  if (result.notes)  document.getElementById('field-notes').value = result.notes;
  if (result.category) document.getElementById('field-category').value = result.category;
  if (result.cover) {
    document.getElementById('field-cover').value = result.cover;
    updateCoverPreview(result.cover);
  }
}

/* ========================= 8. IMPORT / EXPORT JSON ======================== */

/** Scarica un file .json con l'intera collezione corrente. */
function exportCollection() {
  const dataStr = JSON.stringify(state.collection, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `teca-collezione-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup esportato', 'success');
}

/** Legge un file .json selezionato dall'utente e lo importa nella collezione. */
function importCollectionFromFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error('Il file non contiene un array valido');

      // Normalizza i record importati, garantendo un id univoco per ognuno
      const existingIds = new Set(state.collection.map(i => i.id));
      const normalized = imported.map(item => {
        const id = item.id && !existingIds.has(item.id) ? item.id : generateId();
        existingIds.add(id);
        return {
          id,
          title: item.title || 'Senza titolo',
          category: CATEGORIES[item.category] ? item.category : 'altro',
          author: item.author || '',
          year: item.year || null,
          notes: item.notes || '',
          cover: item.cover || '',
          barcode: item.barcode || '',
          dateAdded: item.dateAdded || Date.now(),
        };
      });

      const replace = window.confirm(
        `Trovati ${normalized.length} elementi nel file.\n\nOK = sostituisci l'intera collezione attuale\nAnnulla = unisci con quella esistente`
      );

      state.collection = replace ? normalized : [...state.collection, ...normalized];
      persistCollection();
      renderCategoryFilters();
      renderGrid();
      showToast('Importazione completata', 'success');
    } catch (err) {
      console.error('Errore durante l\'importazione:', err);
      showToast('File non valido: importazione annullata', 'error');
    }
  };
  reader.readAsText(file);
}

/* ============================ 9. TEMA CHIARO/SCURO ======================== */

function applyTheme(theme) {
  const html = document.documentElement;
  const sunIcon = document.getElementById('icon-sun');
  const moonIcon = document.getElementById('icon-moon');

  if (theme === 'dark') {
    html.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    html.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

/* ======================= 10. INIZIALIZZAZIONE E LISTENER ================== */

function init() {
  // Tema: scuro di default, salvo preferenza salvata in precedenza
  applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

  // Dati
  state.collection = loadCollection();
  populateCategorySelect();
  renderCategoryFilters();
  renderGrid();

  // --- Header: tema, menu, aggiunta ---
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  const menuDropdown = document.getElementById('menu-dropdown');
  document.getElementById('menu-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menuDropdown.classList.add('hidden'));

  document.getElementById('btn-export').addEventListener('click', () => {
    exportCollection();
    menuDropdown.classList.add('hidden');
  });
  const importInput = document.getElementById('import-file-input');
  document.getElementById('btn-import').addEventListener('click', () => {
    importInput.click();
    menuDropdown.classList.add('hidden');
  });
  importInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      importCollectionFromFile(e.target.files[0]);
      e.target.value = ''; // permette di ri-selezionare lo stesso file in futuro
    }
  });

  document.getElementById('btn-open-add').addEventListener('click', () => openAddModal());

  // --- Ricerca, ordinamento, filtri categoria ---
  document.getElementById('search-input').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderGrid();
  });
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });
  document.getElementById('category-filters').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    state.activeCategory = chip.dataset.category;
    renderCategoryFilters();
    renderGrid();
  });

  // --- Griglia: click su una card apre la modifica (delegazione eventi) ---
  document.getElementById('collection-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.item-card');
    if (!card) return;
    openEditModal(card.dataset.id);
  });

  // --- Modale elemento: form, chiusura, eliminazione ---
  document.getElementById('item-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-close-modal').addEventListener('click', () => closeModal('item-modal'));
  document.getElementById('btn-cancel-item').addEventListener('click', () => closeModal('item-modal'));
  document.getElementById('field-cover').addEventListener('input', (e) => updateCoverPreview(e.target.value.trim()));
  document.getElementById('btn-delete-item').addEventListener('click', requestDeleteCurrentItem);

  // Chiusura modale cliccando sullo sfondo semi-trasparente
  document.getElementById('item-modal').addEventListener('click', (e) => {
    if (e.target.id === 'item-modal') closeModal('item-modal');
  });

  // --- Modale conferma eliminazione ---
  document.getElementById('btn-cancel-delete').addEventListener('click', () => {
    state.pendingDeleteId = null;
    closeModal('confirm-modal');
  });
  document.getElementById('btn-confirm-delete').addEventListener('click', confirmDelete);

  // --- Ricerca manuale del codice a barre (senza fotocamera) ---
  document.getElementById('btn-lookup-barcode').addEventListener('click', () => {
    lookupBarcode(document.getElementById('field-barcode').value);
  });
  document.getElementById('field-barcode').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // evita che Invio invii l'intero form
      lookupBarcode(e.target.value);
    }
  });

  // --- Scanner ---
  document.getElementById('btn-toggle-scanner').addEventListener('click', () => {
    const wrapper = document.getElementById('scanner-wrapper');
    if (wrapper.classList.contains('hidden')) {
      startScanner();
    } else {
      stopScanner();
    }
  });
}

// Avvio dell'applicazione una volta che il DOM è pronto
document.addEventListener('DOMContentLoaded', init);
