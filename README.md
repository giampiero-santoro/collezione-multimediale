# Teca — Catalogo personale della collezione

Applicazione web statica per catalogare libri, fumetti, vinili, CD, DVD, giochi e altro materiale da collezione: nessun server, nessun database esterno, nessuna build. Tutto il codice è HTML, CSS e JavaScript puri, pensato per essere ospitato gratuitamente su **GitHub Pages**.

## Come funziona

- **I dati restano nel tuo browser.** La collezione viene salvata in `localStorage`: non c'è alcun server che la riceve o la conserva. Se cambi browser, dispositivo o svuoti i dati di navigazione, la collezione locale va perduta — per questo l'app include l'export/import JSON (vedi sotto).
- **Aggiunta rapida via fotocamera.** Premendo "Aggiungi" → "Scansiona codice a barre" si attiva la fotocamera (tramite la libreria [html5-qrcode](https://github.com/mebjas/html5-qrcode)) per leggere il codice EAN/ISBN stampato sulla confezione.
- **Compilazione automatica della scheda:**
  - Se il codice è un **ISBN** (libri e fumetti), l'app interroga la **Google Books API** e, in caso di esito negativo, **Open Library** come riserva.
  - Per **musica e film** (codici EAN/UPC generici), l'app interroga **MusicBrainz** e, se trova una corrispondenza, tenta di recuperare anche la copertina dal Cover Art Archive collegato.
  - Se nessuna API trova corrispondenze, il codice a barre viene comunque salvato nel campo dedicato e puoi completare la scheda a mano.
- **Gestione completa (CRUD):** ogni card della griglia si apre in modifica con un click; è possibile aggiornare o eliminare l'elemento (con richiesta di conferma).
- **Ricerca, filtri e ordinamento:** barra di ricerca su titolo/autore, filtri a chip per categoria con conteggio elementi, ordinamento per data di aggiunta, titolo o anno.
- **Tema chiaro/scuro:** scuro di default, con interruttore in alto a destra; la preferenza viene ricordata.
- **Backup e ripristino:** dal menu con l'icona a ingranaggio puoi esportare l'intera collezione in un file `.json` (per sicurezza o per trasferirla su un altro dispositivo) e importarla in un secondo momento, scegliendo se sostituire o unire i dati esistenti.

## Struttura del progetto

```
├── index.html     → struttura della pagina, header, modali, griglia
├── styles.css      → stili complementari a Tailwind (badge categoria, scanner, animazioni)
├── app.js          → tutta la logica: storage, CRUD, filtri, scanner, chiamate API, import/export
└── README.md       → questo file
```

Nessuna dipendenza va installata: Tailwind CSS e html5-qrcode vengono caricati direttamente da CDN nell'`<head>` di `index.html`.

## Uso in locale

Basta aprire `index.html` in un browser moderno. Per usare la fotocamera (necessaria per lo scanner), la maggior parte dei browser richiede però che la pagina sia servita via `http://` o `https://` (non `file://`): per un test locale rapido puoi usare un piccolo server statico, ad esempio:

```bash
# Con Python già installato
python3 -m http.server 8080

# oppure con Node.js
npx serve .
```

e poi visitare `http://localhost:8080`.

## Pubblicazione su GitHub Pages

1. Crea un nuovo repository su GitHub (es. `teca-collezione`) e carica al suo interno i quattro file di questo progetto (`index.html`, `styles.css`, `app.js`, `README.md`), mantenendoli nella cartella principale (root) del repository.
2. Su GitHub, vai su **Settings → Pages** del repository.
3. In **Build and deployment → Source**, seleziona **Deploy from a branch**.
4. Scegli il branch `main` (o `master`) e la cartella `/ (root)`, poi salva.
5. Dopo qualche minuto, GitHub mostrerà l'indirizzo pubblico, tipicamente nella forma:
   ```
   https://<tuo-nome-utente>.github.io/<nome-repository>/
   ```
6. Apri quell'indirizzo da PC o da smartphone: essendo servito via `https://`, la fotocamera per lo scanner funzionerà correttamente (il browser chiederà il permesso di accesso alla fotocamera la prima volta).

Poiché tutti i percorsi dei file (`styles.css`, `app.js`) sono relativi, l'app funziona identica sia in locale che su GitHub Pages, indipendentemente dal nome del repository.

## Note su privacy e limiti delle API esterne

- Le uniche richieste di rete effettuate dall'app sono quelle verso Google Books, Open Library, MusicBrainz e Cover Art Archive, esclusivamente al momento della scansione o dell'inserimento manuale di un codice a barre: nessun dato della tua collezione viene inviato altrove.
- Le API pubbliche usate sono gratuite ma non garantiscono la copertura di ogni codice a barre (specialmente per edizioni rare, vinili di nicchia o prodotti regionali): in questi casi la scheda va semplicemente completata a mano.
- MusicBrainz applica un limite di frequenza alle richieste anonime: in caso di scansioni molto ravvicinate una ricerca potrebbe fallire temporaneamente — riprova dopo qualche secondo.
