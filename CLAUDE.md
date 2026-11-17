# Weak Link Training: project brief for Claude Code

Installable web app (PWA) for structural-balance strength training, built on Charles Poliquin's ratios and the principles Justin King describes. Personal tool for Matt and a few mates. Not affiliated with King, Built Better or STNDRD.

- Live: https://mattpedo-al.github.io/weak-link-training/
- Repo: https://github.com/mattpedo-AL/weak-link-training (public, GitHub Pages from `main`, root)

## History
Started as a Claude artifact that synced through the artifact `db` capability. Moved to a standalone app because people Matt shared the artifact with (outside his personal-plan org) only get view-level access and can't save. Bugs fixed along the way:
- Artifact db snapshots are frozen. Using them as state made every nested write (`P.prog.day = …`) throw in strict mode, so the day picker and "Finish → next day" silently did nothing. Not relevant now: there's no db.
- Lifts typed on Assess were reset to the example values on reload unless "Save assessment" was pressed (boot overwrote `P.lifts` while `P.example` was true). Fixed: editing any lift clears `P.example`.

## Architecture
Static files, no build step, no dependencies, no backend.
- `index.html`: shell, header, modals, hidden `#importFile` input
- `app.css`: glass UI, light/dark plus 5 "glass colour" themes
- `app.js`: everything else. Plain JS, `"use strict"`, string-template views re-rendered by `route()` on hash change (`#today #assess #plan #progress #method`)
- `sw.js`: service worker. Network-first for app files, cache-first for Google Fonts. **Bump `VERSION` on every change** so installed copies update.
- `manifest.webmanifest`, `icons/`

### State (localStorage, per device)
- `wl.profile`: `P` = {example, bw, lifts, screen, plan{days,hybrid,finisher}, prog{phase,week,day}, swaps, baseline, checkins[], assessments[], updatedAt}
- `wl.sessions`: array of {id, ts, date, day, phase, week, entries[{ex, sets[{w,r}]}]}
- `wl.draft`: in-progress set inputs for the current day
- `wl.mode`, `wl.glass`, `wl.lastBackup`, `wl.hideInstall`
- Backup: Program → Export backup / Restore. JSON `{app, version, exported, profile, sessions}`.

### Key logic in app.js
- `LIFTS` + `analyse()`: ratio scores vs close-grip bench / back squat, left-right gaps, ordered weak-link list
- `correctives()` + `FIX`/`SCREEN`/`DEFAULT_FIX`: D-series picks
- `DAYS`, `SPLITS` (3/4/5 days), `PHASES` (accumulation/intensification), `buildDay()`, `suggestLoad()` (Epley, tempo discount, deload 65%)
- `finish()`: logs the session, advances day, then week, then phase; re-test prompt after week 4
- Readiness: weekly check-in vs baseline (RHR +5, HRV −10%, sleep, soreness, stress) trims volume

## Testing
Serve the folder (`python3 -m http.server 8765`) and drive it with Playwright at a phone viewport (390×844). Flows to cover:
1. Pick a day → heading changes → survives reload
2. Fill reps, tick a set, Finish → "Session saved" → next day shown → survives reload
3. Type a lift on Assess → survives reload
4. Export → Reset → Import → data restored
5. Service worker controls the page; reload works offline
Also check for zero `pageerror` events.

## Known rough edges / ideas
- The sticky header's "Saved on this device" line has no background, so content scrolls visibly behind it.
- Ticking a set with empty reps and no reps placeholder logs nothing, silently.
- Session ids use `"s"+Date.now()`; fine for one device.
- No cross-device sync by design. If wanted later: Supabase (magic-link auth plus one row per user) is the planned route.

## Deploying
Commit to `main`. Pages redeploys in about a minute. Remember to bump `VERSION` in `sw.js`.
