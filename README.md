# BUGTRACK

A full-stack Chrome bug reporting system. A Manifest V3 extension silently watches pages and turns real-world failures into structured, deduplicated bug reports — each enriched with AI-style root-cause analysis, a recorded reproduction, a Playwright test, and passive health/security scans — then surfaces them in a GSAP-animated analytics dashboard ("WIRETAP").

```
extension/     Chrome MV3 extension (recorder, annotator, scanner)
server/        Express + MongoDB API (analysis, dedup, GitHub, stats)
dashboard/     React + Vite + GSAP dashboard
tools/         dev scripts (icon generator, live end-to-end check)
```

## Quick start (single project)

Everything lives in this one folder, and the whole app runs as a single unit.

### Option A — one command, full stack (Docker)

```bash
docker compose up --build -d     # starts MongoDB + the app (UI + API) on :8787
docker compose exec app node src/jobs/seed.js   # first run only: load demo bugs
```

Open http://localhost:8787 — the dashboard and API are served by one container.

### Option B — one process, no Docker

```bash
npm run setup        # install server + dashboard dependencies
npm run mongo        # start MongoDB (Docker Compose)
npm run start        # build the dashboard and serve UI + API together on :8787
```

The API server serves the built dashboard itself, so a single Node process runs the entire project.

### Option C — development mode (hot reload, two processes)

```bash
npm run setup
npm run mongo
npm run seed          # load 20 demo bugs (BUG-1042 … BUG-1061)
npm run dev:server    # API on http://localhost:8787   (terminal 1)
npm run dev:dashboard # UI on  http://localhost:5173   (terminal 2)
npm run e2e           # optional: live end-to-end pipeline check (29 assertions)
```

Then load the extension: `chrome://extensions` → Developer mode → **Load unpacked** → `extension/`.

## Architecture

- **Extension** — a content script injected into every page intercepts `console.error`, failed `fetch`/XHR, `unhandledrejection`, and mixed-content warnings; it also records user interactions (click/input/keydown/submit/navigate) as reproduction steps with safe, redacted selectors. The popup exposes live meters, a DOM inspector (point-and-pick element), a passive health/security scanner (Lighthouse-style scores + security header checks), and a canvas annotator for screenshots.
- **API** — reports are fingerprinted (`sha256` of normalized diagnostics) and deduplicated against open bugs of the same project, so repeat occurrences increment `occurrences` instead of creating noise. A deterministic rule-based engine generates root-cause analysis, confidence, likely source location, and fix suggestions. `GET /api/bugs` powers the analytics, including priority/status distribution, 14-day trend, top errors, affected pages, and browsers.
- **Dashboard** — light-paper WIRETAP aesthetic with dark-mode toggle, custom cursor, ticker marquee, magnetic buttons, animated counters and charts (GSAP + ScrollTrigger). Per-bug views show the AI analysis, reproduction steps with generated Playwright code, Console/Network/Security/Element/Health tabs, comment thread, history timeline, controls (status/priority/assignee), screenshot viewer with annotation overlay, and one-click GitHub issue export.

## Prerequisites

- Node.js 20+ (tested on v22)
- Docker Desktop running (for MongoDB) — or a local MongoDB on `mongodb://localhost:27017`
- Chrome (for the extension)

## 1. Database

```bash
docker compose up -d
# container: bugtrack-mongo on port 27017
```

## 2. API server

```bash
cd server
npm install
cp .env.example .env        # optional: set BUGTRACK_API_KEY, GITHUB_TOKEN, GITHUB_REPO
npm run seed                # loads 20 demo bugs (BUG-1042 … BUG-1061)
npm run dev                 # http://localhost:8787
```

Optional env in `.env`:

- `BUGTRACK_API_KEY` — requires `x-api-key` header on write endpoints
- `GITHUB_TOKEN` / `GITHUB_REPO` — enables one-click GitHub issue export (`POST /api/bugs/:id/github`)

Run tests:

```bash
npm test                    # 26 integration tests (mongodb-memory-server)
```

## 3. Dashboard

```bash
cd dashboard
npm install
npm run dev                 # http://localhost:5173 (proxies /api → :8787)
```

## 4. Extension (manual testing)

1. Open `chrome://extensions`, enable **Developer mode**.
2. **Load unpacked** → `extension/` folder.
3. On any page: open the extension, trigger some errors, hit **Report bug** (or use the annotated screenshot flow).
4. Watch new reports appear in the dashboard within seconds.

## API surface

```
GET    /api/health
GET    /api/stats                          # analytics + priority/status distributions
GET    /api/bugs?status=&priority=&search=&sort=&page=&limit=
POST   /api/bugs                           # dedups by fingerprint, runs analysis
GET    /api/bugs/:id
PATCH  /api/bugs/:id                       # status/priority/assignee + history
POST   /api/bugs/:id/comments
POST   /api/bugs/:id/github                # export as GitHub issue
POST   /api/explain                        # local "explain this error" (rule-based)
GET    /api/screenshots/:filename
```

## Design system (WIRETAP)

Signal-console aesthetic: Unbounded / Space Mono / Space Grotesk typography, paper-grid + noise texture, red `#e6002e` accent, REC dots, ticker marquee, magnetic hover, clip-path page wipes. Default light theme with full dark-mode toggle in the nav.
