# Collezione Multimediale

Archivio digitale locale per gestire la tua collezione multimediale: libri, fumetti, musica, film/DVD, giochi e altri pezzi.

## Descrizione

L'applicazione permette di:

- aggiungere elementi manualmente con titolo, autore, categoria, anno, collocazione, condizione, prezzo e note
- eseguire scansioni ISBN/codici a barre con fotocamera
- completare automaticamente i dati tramite Google Books API per i libri
- cercare e filtrare per categoria e condizione
- ordinare la collezione per titolo o anno
- alternare il tema chiaro/scuro
- esportare e importare backup in JSON e CSV
- salvare tutto in `localStorage` nel browser

## Tecnologie

- HTML5
- JavaScript moderno (ES6+)
- Tailwind CSS via CDN
- html5-qrcode per lo scanner
- Google Books API per ISBN
- localStorage per persistenza locale

## Come avviare

1. Apri `index.html` nel browser, oppure trascina la pagina nella scheda del browser
2. In alternativa, puoi servirlo localmente con un semplice server statico:

```bash
python3 -m http.server 8000
```

Poi apri `http://localhost:8000`.

Per GitHub Pages:
- crea un repository
- carica `index.html`, `styles.css`, `app.js` e `README.md`
- vai su Settings → Pages e seleziona il branch corretto

## Struttura dei file

```text
collezione-multimediale/
├── index.html    # struttura della pagina e modali
├── styles.css    # stili e tema
├── app.js        # logica applicativa e storage
├── README.md     # documentazione
└── .gitignore    # file ignorati da Git
```

## Note utili

- I dati sono salvati localmente nel browser e non richiedono backend
- La Google Books API può essere soggetta a limitazioni e restrizioni in ambiente commerciale
- Sono disponibili backup JSON e CSV per esportare la collezione e trasferirla tra dispositivi
