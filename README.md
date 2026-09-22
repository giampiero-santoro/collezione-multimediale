# MultiMedia Collector 📚🎵🎮

Un'applicazione web client-side (senza backend) per catalogare e gestire collezioni di Libri, Fumetti, Vinili, CD, DVD e Videogiochi.

## 🚀 Caratteristiche
- **Scanner Barcode (EAN / ISBN):** Lettura tramite fotocamera smartphone o webcam desktop via `html5-qrcode`.
- **Autocompilazione API:** Recupero automatico di dati e copertine via Google Books API e iTunes Search API.
- **Persistenza e Backup:** Salvataggio in `localStorage` ed esportazione/importazione JSON.
- **Filtri e Ricerca:** Ordinamento, filtri per categoria e ricerca testuale istantanea.
- **Tema Scuro:** Interfaccia responsive predisposta per Dark Mode.

## 📦 Installazione e Hosting su GitHub Pages
1. Fai il push dei file (`index.html`, `styles.css`, `app.js`) nella repository GitHub.
2. Vai su **Settings** > **Pages** della repository.
3. Seleziona il branch `main` (o `master`) e la cartella `/ (root)`.
4. Clicca su **Save**. Il tuo sito sarà visibile su `https://<tuo-utente>.github.io/<nome-repo>/`.
