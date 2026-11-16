---
name: dashboard-qa
description: Run reliable pre-merge QA for this repository's financial dashboard, separating frontend unit/static checks from Compose-backed runtime and browser accessibility verification.
---

# Dashboard pre-merge QA

## Objective

Establish whether a dashboard change is ready to merge by checking the relevant financial calculations, frontend static quality, and—separately—the dashboard running against its API. Report what was actually verified and what remains unverified.

## Required inputs

- The proposed change or target commit, including its changed files.
- Repository root and the ability to run the project's existing frontend scripts.
- For runtime verification, Docker Compose and a browser available to the verifier.

If Docker or a browser is unavailable, say so and report that verification step as **not run**; do not imply unit tests or HTTP checks are browser verification.

## Procedure

1. **Establish scope and constraints**
   - Read `AGENTS.md`, `.agents/rules/frontend.md`, and `memory-bank/project.md` before assessing or changing code.
   - Inspect the diff and identify whether it changes calculations, date handling, loading/error behavior, dashboard components, API integration, or other frontend behavior.
   - For API contract changes, compare frontend types and usage with `backend/app/routes.py`; do not infer the contract from mock data.
   - Treat `frontend/src/lib/mock-data.ts` as unused by the dashboard unless the implementation explicitly changes. The current `frontend/src/App.tsx` fetches `GET /api/metrics`.

2. **Run focused frontend unit tests**
   - From `frontend/`, run the test file relevant to the change; for financial calculations and labels:
     ```sh
     npm test -- src/lib/financial-utils.test.ts
     ```
   - If the change affects additional tested behavior, run the relevant existing tests too. Run the full frontend suite with `npm test` when the change is broad or its test scope is unclear.
   - Review or add tests in `frontend/src/lib/financial-utils.test.ts` for changed KPI, monthly aggregation, period-label, or formatter behavior.
   - Preserve the date contract: `create_date` is a date-only `YYYY-MM-DD` calendar value, not a timestamp. Do not group it using timezone-dependent local date getters. If date handling changes, cover month/year boundaries with regression tests.
   - Check that the displayed period remains derived from returned movements. The backend generates data using `date.today()`, so observed dates can move; do not assert a fixed calendar range.

3. **Run lint and production build as separate static checks**
   - From `frontend/`, run:
     ```sh
     npm run lint
     npm run build
     ```
   - These check linting and TypeScript/Vite production compilation. They do **not** demonstrate that the app works against the running API or that its rendered UI is accessible.
   - Record failures and build advisories accurately. Do not treat an advisory as a failure unless the project or change sets a relevant blocking threshold.

4. **Verify the running app with the default Compose setup**
   - Use the repository's `docker-compose.yml` as the default integration environment. From the repository root, start or rebuild services as appropriate:
     ```sh
     docker compose up --build -d
     docker compose ps
     ```
   - `docker-compose.yml` defines `frontend` and `backend`; frontend is published on port `5173`, backend on `8000`, and Vite proxies `/api` to `http://backend:8000`. Do not substitute a standalone frontend with mock data for this integration check.
   - Check both endpoints:
     ```sh
     curl -fsS -o /tmp/dashboard.html -w 'frontend_http=%{http_code}\\n' http://localhost:5173/
     curl -fsS -o /tmp/metrics.json -w 'metrics_http=%{http_code}\\n' http://localhost:8000/api/metrics
     ```
     Confirm the frontend responds successfully and metrics is valid JSON containing the movement data consumed by the dashboard. If needed, inspect Compose logs to diagnose service or proxy failures.
   - Treat metrics as generated synthetic data, not live, persistent financial records. Their date range is runtime-dependent; verify the UI against API-returned dates rather than dates in earlier verification runs.

5. **Verify the running dashboard in a browser**
   - Open `http://localhost:5173/` while Compose services are running. This is distinct from tests, lint, build, and `curl`.
   - Confirm the dashboard finishes loading, presents KPI values and both monthly charts from API data, and displays a period consistent with returned movements. Check the browser console and network requests for failures.
   - Exercise the unavailable-backend state when practical: UI should show error feedback and avoid presenting a false period as valid data.
   - Check keyboard accessibility: reach and activate the skip link, confirm focus moves to main content, and verify focusable controls work without a pointer.
   - Inspect narrow and wide viewports for clipping, overlap, and chart/layout failures. Do not claim screen-reader verification unless it was actually performed.
   - Record browser, viewport(s), and accessibility checks actually performed. An HTTP response alone is not visual or accessibility verification.

6. **Report evidence and limitations**
   - List exact commands run and whether each passed, failed, or was not run.
   - Separate **unit tests**, **lint/build**, **Compose/API runtime checks**, and **browser/accessibility verification**.
   - Include relevant failures, advisories, and unverified checks. Do not turn a partial check into an overall pass.

## Expected output

A concise pre-merge QA report containing:

- Change scope and relevant financial/date/API constraints checked.
- Results for focused or full frontend tests, lint, and build, with commands.
- Compose service and HTTP/API smoke-check results.
- Browser observations, including viewport and keyboard/accessibility checks actually performed—or an explicit statement browser verification was not run.
- Outstanding failures, warnings, or verification limitations, followed by a clear **ready**, **not ready**, or **partially verified** assessment.

## Acceptance criteria

- Relevant existing frontend tests pass, or failures are reported with command and details.
- `npm run lint` and `npm run build` results are reported independently of runtime verification.
- When runtime verification is available, Compose services start and frontend and metrics API respond successfully; API response is checked as the dashboard's data source.
- When browser verification is available, loading, displayed data/period, practical error feedback, keyboard behavior, and narrow/wide layout are checked and reported based on observation.
- No fixed data-date expectation, timezone-dependent date grouping, or claim that synthetic data is live or persistent is introduced.
- The report clearly identifies skipped checks; tests, compilation, or HTTP smoke checks are never represented as proof of visual or accessibility correctness.
