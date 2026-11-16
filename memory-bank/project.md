# Project Memory

## Product

The README describes a financial metrics dashboard. The current screen in `frontend/src/App.tsx` displays income/outcome KPIs and monthly charts, with calculations in `frontend/src/lib/financial-utils.ts`.

The API in `backend/app/routes.py` generates synthetic financial movements. It is not connected to a live financial provider or database; do not describe the sample values as real or persistent financial data.

## Tech Stack

- Frontend: TypeScript and React (`frontend/package.json` declares React `^19.2.4`), Vite `^8.0.4`, Tailwind CSS `^4.2.2`, Recharts `^3.8.1`, and `lucide-react` `^1.8.0`. Vitest, ESLint, and TypeScript provide test, lint, and build tooling.
- Backend: Python with FastAPI, Pydantic, and Uvicorn; `debugpy` is enabled by `backend/Dockerfile`.
- Containers: `docker-compose.yml` defines `frontend` and `backend`. The Dockerfiles use Node 24 Alpine and Python 3.13 slim. Vite proxies `/api` to `http://backend:8000`; Compose publishes frontend port 5173, backend port 8000, and debugpy port 5678.
- Tests: Vitest for frontend utilities; pytest and FastAPI `TestClient` for backend routes. Frontend scripts are `npm test`, `npm run lint`, and `npm run build`.

## Current Status

- `frontend/src/App.tsx` fetches `/api/metrics` and computes KPI and monthly chart values in the frontend. The backend also exposes facets, summaries, top categories, comparisons, alerts, and B2B/B2C routes; the current dashboard screen does not call those analytics routes.
- `generate_mock_movements(seed=42)` creates 360 movements using `date.today()`. Observed ranges: 2025-10-02 through 2026-09-28 on 2026-10-30, and 2025-11-01 through 2026-10-28 on 2026-11-15. The range moves daily; it is not a fixed guarantee.
- Frontend specifications for three planned features (date range filter, anomaly alerts table, B2B vs B2C comparison) are in `frontend/specs/` on branch `feature/frontend-specs`. They are verified against `/openapi.json`; type-check with `cd frontend/specs && npx tsc --noEmit`. They are not implemented yet.
- `GET /api/metrics/alerts` `baseline_average` is the mean of all earlier periods within the requested range, not a rolling window. Inverted date ranges return `200 []` rather than 422 on every endpoint checked.
- The displayed period is derived from returned movement dates. `computeMonthlyData` groups `YYYY-MM-DD` dates by their year-month string, avoiding timezone-dependent local date conversion.
- Phase 1 Compose and HTTP smoke-check results are recorded in `verification.md`. The dashboard has not had a visual browser verification.
- Phase 3 validation on 2026-10-31: backend route tests passed (16 tests); frontend tests passed (8 tests), and frontend lint/build passed. The build reported a JavaScript chunk over its 500 kB advisory threshold.
- Installing the locked frontend dependencies for Phase 3 reported 26 npm audit findings, including 8 high-severity findings. These findings have not been triaged; verify the current audit report before making dependency changes.

## Next Checks

- Re-run the dashboard browser checks in an environment with Chromium's Linux runtime libraries installed. On 2026-11-16, Playwright could not launch because `libatk-1.0.so.0` is missing; browser and visual verification therefore remain unverified.
- Review the npm audit findings using the current lockfile before any dependency upgrade.

## Accessibility and Agent Skills (2026-11-16)

- Applied the repository's accessibility skill guidance to the dashboard: a visible-on-focus skip link, clear loading status, an error alert outside the busy main region, focus-visible styling, semantic chart headings/regions, and screen-reader data tables. Decorative icons and skeletons are hidden from assistive technology. Empty chart arrays have an explicit empty state; non-empty all-zero data still renders so visual and tabular representations remain consistent.
- Added static document title, description, and theme-color metadata in `frontend/index.html`. Vercel's React best-practices skill was reviewed, but this is a Vite SPA rather than Next.js; no Next.js-only image/font/server-rendering changes were introduced. The existing large-chunk build advisory remains unaddressed because no measured optimization justified changing primary chart loading.
- Discovered the additional `anthropics/skills@webapp-testing` skill via `npx skills find testing` and installed it under `.agents/skills/webapp-testing`; its Playwright guidance informs `.skills/dashboard-qa/SKILL.md`. `skills-lock.json` records the installed skills. `AGENTS.md` now tells agents to discover both shared `.agents/skills` and internal `.skills`.
- Frontend verification on 2026-11-16: `npm test` passed (8 tests), `npm run lint` passed, and `npm run build` passed with a Vite advisory for a 586.40 kB minified JS chunk (175.59 kB gzip). Compose smoke checks returned HTTP 200 for the frontend and API; the API returned 360 generated movements with the expected data shape.
- Browser verification was attempted with Python Playwright against the running frontend, but Chromium could not start because the environment lacks `libatk-1.0.so.0`. The first attempt also had a sync/async syntax error and did not execute. Do not report screenshots, keyboard behavior, mobile layout, screen-reader behavior, or browser-console results as verified until a successful browser run. Static checks and HTTP smoke checks are not substitutes for that verification.
- Financial definitions and date semantics remain those in `frontend/src/lib/financial-utils.ts`: income/outcome sums, profit as income minus outcome, margin as profit divided by income (zero when income is zero), year-month grouping by the date-only string, zero-decimal USD display, and one-decimal percentage display. API values remain synthetic, not live or persistent.

## Handoff

Phase 2 engineering findings are in `phase-2-engineering-findings.md`; project-specific contributor guidance is in `.agents/rules/`. This file is a project summary, not a chat transcript; full chat availability depends on the VS Code chat history feature.
