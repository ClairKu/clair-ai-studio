# AGENTS.md

## Cursor Cloud specific instructions

Clair's Studio (`clair-ai-studio`) is a **client-side-only static SPA** built with Vite. There is **no backend, database, server, or auth service** — all state is persisted in the browser via `localStorage`. To exercise the product end to end you only need to run the single dev server.

### Services & commands

There is one runnable service (the dev server). Standard commands live in `package.json` `scripts`; do not duplicate them elsewhere.

| Task | Command | Notes |
| --- | --- | --- |
| Run (dev) | `npm run dev` | Vite dev server on `http://localhost:5173/` |
| Test | `npm test` | `node --test tests/*.test.mjs` plus the `validate-*.mjs` scripts. This is also the closest thing to a lint step — there is **no** separate lint script. |
| Build | `npm run build` | Runs validators + `build-search-index.mjs`, then `vite build` |
| Preview build | `npm run preview` | Serves the built output on `http://localhost:4173/` |

### Non-obvious gotchas

- `npm run build` writes into the committed `docs/` directory (GitHub Pages output, `base: './'`) and regenerates `public/search-index.json`. If the current checkout is in sync these files may be regenerated identically (no diff); do not commit incidental build churn unless it is intended.
- The dependency `xlsx` is installed from the SheetJS CDN tarball (`https://cdn.sheetjs.com/...`), not the npm registry, so `npm install` needs outbound network access to that host.
- The ~104 seed reports are **in-code defaults**, not stored in `localStorage`. On a fresh page load `localStorage['clair-service-report-workbench-v1']` is empty/`null` until the first mutation (e.g. a save) triggers `saveState()`, which then persists the full set. An empty storage key on first load is expected, not a bug.
- The main input "Save" action (`saveIntakeToLibrary` / `inspectSaveTarget`) only accepts **pasted HTML content, an attached file, or a URL**. Plain non-HTML text with no file/URL is rejected by design with the toast "请上传支持的档案、粘贴内容，或输入可正常访问的网址". URLs whose host is a known permission target (e.g. `docs.qq.com`, `feishu.cn`, `yingmi-inc.com`) are accepted offline without a network fetch; other URLs are fetched to check reachability.
