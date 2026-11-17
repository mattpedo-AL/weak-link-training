# Weak Link Training

Installable web app (PWA). Static files only, so there's no build step and no server code.

- Data is stored on each person's device (localStorage). Use **Program → Backup** to export or restore.
- Works offline once opened (service worker `sw.js`).
- To update: edit the files, then bump `VERSION` in `sw.js` so installed copies pick up the change.

Hosted with GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.
