# Clean AI

A Windows desktop app that tidies folders and shows where your disk space went.
Everything runs on the machine it is installed on: no accounts, no cloud, no
telemetry. The one network call is the licence key check against Lemon
Squeezy (`checkKeyRemote` in `src/main/main.js`).

## Running it

Double-click **Clean AI** on the Desktop (or `Clean AI.lnk` in this folder).

From a terminal:

```bash
npm start
```

## What it does

**File Organizer** — scans the folders you choose and groups files into
`Photos`, `Videos`, `Music`, `Documents`, `Installers`, `Archives`, `Other`.

- *Review mode* (default): you see the whole plan and press Apply before
  anything moves.
- *Auto mode*: confident matches are filed straight after a scan.
- Anything ambiguous — unknown extension, no extension — is never guessed at.
  It goes to a "Needs your call" list where you pick the destination.
- Junk (temp files, crash dumps, `Thumbs.db`) is kept out of that list and gets
  its own screen instead.

**Duplicates** — grouped by size, then a 64 KB quick hash, then a full SHA-256.
Only byte-identical files are ever reported, so identical copies under different
names are caught and near-misses are not.

**Old & junk** — files untouched for 6+ months (configurable), plus obvious
leftovers. Suggestions only; you select what goes.

**Dashboard** — drive usage donut, a squarified treemap of what is eating space,
largest folders and files, and headline counts.

**Activity log** — every move, rename and removal, with old path, new path and
timestamp. Each row has an Undo button that puts the file back where it was. The
log is stored locally and survives restarts.

## Safety model

- Nothing is deleted outright. "Remove" moves files into a quarantine folder
  inside the app's data directory, so undo always has something to restore.
  Emptying quarantine is a separate, explicit action in Settings.
- Moves never overwrite. A name collision becomes `report (2).pdf`.
- Moves across drives fall back to copy-then-delete, so `EXDEV` cannot lose a
  file.
- The scanner skips Windows, Program Files, AppData, `$Recycle.Bin`,
  `node_modules`, `.git` and similar, and never follows symlinks.
- The renderer runs with `contextIsolation` on and no Node access. Its entire
  capability surface is the list in `src/main/preload.js`.
- The page's CSP has `default-src 'none'` and `connect-src 'none'`. Fonts are
  bundled locally rather than fetched from Google.

## Layout

```
src/main/
  main.js         window, IPC handlers, app state
  preload.js      the contextBridge API (the app's full capability list)
  store.js        settings + activity log, atomic JSON writes
  scanner.js      directory walk, old-file and junk detection
  categories.js   extension to category map
  organizer.js    plan building, moves, quarantine, undo
  duplicates.js   size -> quick hash -> full hash
  disk.js         drive stats, folder sizes, scan summaries
src/renderer/
  index.html      views
  styles.css      dark theme
  renderer.js     all UI logic, including the squarified treemap
  fonts/          Inter, Space Grotesk, JetBrains Mono (latin subsets)
assets/
  icon.ico/.png   app icon
  make_icon.py    regenerates the icon (needs Pillow)
```

Settings, the activity log and quarantine live in
`%APPDATA%\clean-ai\data\`.

## Development

```bash
CLEAN_AI_DEBUG=1 npm start
```

Renderer console output, preload errors and load failures are printed to the
terminal. Add `CLEAN_AI_SHOT=<path.png>` to have the window screenshot itself
shortly after load.

## Packaging

`npm run dist` expects electron-builder, which is not installed yet:

```bash
npm i -D electron-builder
```
