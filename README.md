# Collezione Multimediale

App web locale per il **collezionismo multimediale** — libri, fumetti, vinili, CD, DVD, giochi e altro.

## 📋 Descrizione

Gestisci la tua collezione multimediale in modo semplice e visivo. L'app supporta:

- **Aggiunta manuale** di elementi (titolo, categoria, autore, anno, note, copertina)
- **Scanner codici a barre / ISBN** tramite fotocamera (libri)
- **Autocompilazione** tramite Google Books API
- **Ricerca e filtri** per categoria, titolo, autore
- **Ordinamento** per titolo o anno
- **Dark mode** con toggle
- **Backup/Restore** tramite esportazione/importazione JSON
- **Persistenza locale** tramite `localStorage`

## 🛠️ Tecnologie

- HTML5
- JavaScript puro (ES6+)
- Tailwind CSS (via CDN)
- html5-qrcode (scanner codici a barre)
- Google Books API (autocompilazione per ISBN)
- localStorage (persistenza dati)

## 🚀 Come avviare

1. Apri `index.html` nel browser (o trascinalo nella scheda)
2. Oppure per GitHub Pages:
   - Crea un repository su GitHub
   - Carica i file `index.html`, `styles.css`, `app.js`, `README.md`
   - Vai su **Settings → Pages** e seleziona il branch `main`

## 📁 Struttura dei file

```
collezione-multimediale/
├── index.html    # Struttura principale
├── styles.css    # Stili personalizzati
├── app.js        # Logica applicativa
└── README.md     # Questo file
```

## 📝 Note

- Tutti i dati sono salvati localmente nel browser
- Per la ricerca ISBN, la Google Books API richiede una chiave API per uso commerciale (puoi usarla gratuitamente per volumi limitati)
- Il backup JSON è esportabile e importabile per trasferire la collezione tra dispositivi
