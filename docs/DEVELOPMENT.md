# Development guide

Technical notes for anyone building on or maintaining the app. End-user information is in the [README](../README.md).

No build step, no dependencies: plain HTML, CSS and JavaScript, with Node 20+ for the tests and Python 3 for the data scripts.

### How the app behaves

#### Features

| | |
|---|---|
| **Remembers everything** | Every answer is logged (question, your selection, right/wrong, time taken). "Done vs not done" and "right vs wrong" are derived from that log. |
| **Today's session** | One tap: due reviews first (up to 60% of the session), then new questions, then any remaining reviews. |
| **Spaced repetition** | Right answers come back after 1, 3, 7, 14, then 30 days; a wrong answer makes the question due immediately. Set your test date and the intervals shrink so every question is revisited before the day. |
| **Mastered** | A question is mastered after 3 correct answers in a row. A wrong answer drops it back to "missed". |
| **Mock test** | 24 random questions, 45 minutes, pass at 18/24, no feedback until you finish, auto-submits at zero. Unanswered or half-answered questions count as wrong. Survives a refresh or closed tab. |
| **Practice modes** | Due for review · Weak spots · New questions · Saved · Random · any of the 18 original exams · Marathon. |
| **"Select 2" handling** | Tells you how many answers to pick and won't let you pick more, like the real test. |
| **Stats** | Readiness estimate, accuracy trend, 10-week activity map, per-exam progress, most-missed questions, mock history. |
| **Questions browser** | Search all questions and answers, filter by status or exam, add notes, star questions, or flag an answer that looks wrong. |
| **Works offline** | Installable on your phone's home screen. |

#### About the answers

The questions come from an **unofficial** third-party bank. Every question was checked against the handbook text. No answer key contradicted it. Where the handbook and current law differ, the **handbook answer is marked** (that is what the test follows) and a "Since the handbook" note says what changed. Examples: the Senedd now has 96 members (the handbook says 60), the jury upper age limit is now 75 (the handbook says 70), and individual electoral registration now covers all of Great Britain.

Exam 18 was written by the community rather than drawn from the handbook. Its typos, ambiguous wording and missing explanations were fixed using handbook wording, and a few multiple-choice options were replaced where a question had more than one defensible answer. Every change is listed in `source/corrections.json`, so each one can be reviewed or reverted.

## Running it locally

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>. It must be served over http; opening `index.html` directly won't load the question file.

Progress is saved **per address**: `localhost:8080`, `127.0.0.1:8080` and your deployed site each have their own copy. Pick one for real use, and use backup/merge to move between them.

## Deploying to GitHub Pages

1. Run `npm run release` (rebuilds the data, stamps the offline cache, runs the tests). All of it must pass.
2. Create a GitHub repository and push this folder to it (`.nojekyll` is included).
3. **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`.
4. After a minute the app is live at `https://<your-username>.github.io/<repo-name>/`.
5. On your phone, open the URL, then **Share → Add to Home Screen** (iPhone) or **Install app** (Android/Chrome).

All paths are relative, so it works from a sub-path.

> **Licence.** The code is MIT-licensed (see [`LICENSE`](../LICENSE)). The question data and handbook wording are third-party content and are *not* covered by it: see [`NOTICE.md`](../NOTICE.md).

### Updating after you deploy

Run `npm run release` before every push. It re-stamps `sw.js` with a version derived from the app's files. Browsers only fetch a new version when `sw.js` changes, and a test fails if you forget. Installed copies download the new version in the background, in full or not at all, then show a **"A new version is ready — Reload"** banner. They never reload under you mid-test.

## Keeping your progress safe

Progress lives in the browser on each device (`localStorage`). Layers of protection:

- **Several tabs / windows can't overwrite each other.** Every save first merges with whatever other tabs have stored; answers are append-only and unique, so nothing is lost or double-counted.
- **Finishing a test twice is harmless.** Answers and sessions have deterministic IDs, so a double tap, the clock expiring under a dialog, or a crash half-way through can't create duplicates.
- **Automatic snapshot** every 10 minutes or 25 answers, used automatically if the main data is ever unreadable. It never replaces a larger history with a smaller one. Unreadable data is set aside rather than overwritten.
- **Previous copies.** Before *Erase*, *Import & replace* or *Restore*, your current progress is saved to a list that nothing overwrites automatically. **Settings → Previous copies** brings it back. If a safety copy can't be saved (storage full), the destructive action is refused.
- **Storage protection.** The app asks the browser to mark its storage as persistent. On iPhone, install to the home screen: ordinary Safari tabs can be cleared after about 7 days of no use.
- **Visible failures.** If the browser refuses a save (full or blocked), a message appears immediately.
- **Backups.** A banner nudges you to back up after 60 changes or 7 days.

Caveat: all of these live in the same browser storage. They protect against bugs, mistakes and corruption, not against you clearing site data or losing the device, so **download a backup file now and then**.

### Moving progress between phone and laptop

There's no live sync yet. Use **Settings → Back up & move progress**:

1. Device A: **Download backup**, or **Share / save to Files** on a phone (save to iCloud Drive).
2. Device B: **Import & merge**, choose the file.

Merge is safe to repeat in any order and combines both histories. Do it once each way and both devices have everything. (Bookmarks and notes: the newest edit wins, and clearing one is remembered, so it won't come back.) **Import & replace** overwrites the device and is for restoring.

> **iPhone:** an app added to the home screen has its **own storage, separate from Safari**. Progress you made in Safari before installing won't be there. Export from Safari, install, then import into the installed app once.

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, install manifest, offline cache
css/styles.css                             styles (light/dark, mobile-first)
js/engine.js                               pure logic: scoring, spaced repetition, stats, validation, merge
js/store.js                                persistence, multi-tab merge, snapshots, previous copies, import/export
js/session.js                              practice + mock sessions, results screen
js/views/                                  home, practice, stats, questions, settings
data/questions.json                        generated question bank (do not edit by hand)
data/id-manifest.json                      guard: which answers each question ID points at
source/exams.json                          raw data from the upstream repo (untouched)
source/corrections.json                    every typo / explanation / note fix applied on top
scripts/build_data.py                      source + corrections → data/questions.json
scripts/stamp_sw.py                        stamps sw.js with a content-derived version
scripts/make_icons.py                      renders the PNG icons (needs Pillow)
tests/                                     engine, timezone, store, session and PWA/data tests
```

## Development

```bash
npm test               # all tests (Node 20+, no dependencies)
npm run build:data     # regenerate data/questions.json after editing source/corrections.json
npm run stamp          # re-stamp sw.js after changing any app file
npm run release        # build:data + stamp + test: run before every deploy
```

To fix a question, add an entry to `source/corrections.json` (fields: `text`, `ref`, `replace`, `options`, `note`) and run `npm run release`. The build **fails** if a correction doesn't match the text it expects.

Saved progress is keyed by question ID. `build:data` refuses to run if a rebuild would make an existing ID point at different options or answers; review the change, then use `--accept-key-changes`.

When you add a file under `js/`, `css/`, `icons/` or `data/`, add it to `SHELL` in `sw.js`. A test fails if you forget.

## Known limitations

- No live cross-device sync (manual merge only; the data model is built so sync can be added later).
- The mock test's clock uses the device clock, so changing the system time mid-test changes the time left.
- Attempts store which options you picked by position. If an answer key is ever corrected, history is not re-graded.
- The "readiness" figure is an estimate with fixed weights, not a prediction.
- Tested in desktop and phone-sized browser windows. Not yet tested on a physical iPhone or Android device.
