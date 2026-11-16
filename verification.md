# Verification Trail

## Dashboard accessibility and browser verification (2026-11-16)

Checked against the running Docker Compose frontend and API using headless Chromium 159 / Playwright.

- The first browser run uncovered horizontal overflow on narrow screens: the visually hidden chart tables themselves used the `sr-only` utility, whose absolute positioning allowed their intrinsic table width to expand the document. Wrapped each semantic table in a clipped `.sr-only` container instead. At 375px and 320px, both `document.documentElement.scrollWidth` and `document.body.scrollWidth` now equal the viewport width, and chart cards remain within the viewport.
- Frontend and `GET /api/metrics` returned HTTP 200. The UI rendered an H1 and two H2 chart headings; both named chart regions resolved their `aria-labelledby` references; both semantic tables rendered 12 data rows. The visible period (`Nov 2025 - Oct 2026` in this run) matched the date range calculated from the API response (360 generated movements).
- Keyboard check: the first Tab focused “Skip to main content”; Enter moved focus to `#main-content`.
- API-failure check: aborting the metrics request showed the alert, displayed “Period unavailable”, cleared `aria-busy`, and did not leave stale chart tables.
- No browser page errors or console errors were observed. Desktop (1440px), mobile (375px), and narrow mobile (320px) screenshots were captured during the run. Screen-reader software was not used; this is not a screen-reader certification.
- Chromium initially could not start because the environment lacked `libatk-1.0.so.0`. Installed Playwright's Linux browser dependencies with `python -m playwright install --with-deps chromium`; Chromium then launched successfully. No repository dependency changes were needed for this environment setup.

Checked against source and the running Compose stack on 2026-10-30.

- **Wrong claim:** The dashboard displays 2024 data. **Correction:** `frontend/src/App.tsx` hardcodes the label `2024 - Full Year`, but `GET /api/metrics` returned 360 seeded movements dated 2025-10-02 through 2026-09-28. The observed range is runtime-dependent.
- **Wrong claim:** The dashboard uses the 2024 data in `frontend/src/lib/mock-data.ts`. **Correction:** `frontend/src/App.tsx` fetches `/api/metrics` from the backend; that mock-data module is not imported there.
- **Follow-up:** The period label now derives from the returned movement dates via `formatPeriodLabel`; empty data and fetch failures avoid displaying a false date. The focused Vitest file passes (7 tests), the frontend build and lint pass, and the monthly-summary pytest passes with chronological-period coverage. The build reports a large-chunk advisory; pytest reports a Starlette/httpx deprecation warning.

## Frontend Specs — API Exploration (2026-11-15)

Checked against `GET /openapi.json`, `/docs`, and live calls to the Compose backend. Status key: ✅ verified, ❌ PM wording differs from the API (resolved in `frontend/specs/`), ❓ unverified.

| Claim | Status | Evidence |
|---|---|---|
| `GET /api/metrics/facets` returns the dataset date range | ✅ | `MetricsFacets` has required `min_date`/`max_date` (`format: date`); observed `2025-11-01`..`2026-10-28`. The endpoint takes no query parameters (`?start_date=` is ignored). |
| `GET /api/metrics` accepts `start_date`/`end_date` as `YYYY-MM-DD` | ✅ | Both optional; bounds are inclusive (`start_date=end_date=2025-11-01` returned that day). Start-only and end-only are open-ended. |
| Empty or malformed dates are tolerated | ❌ | `start_date=` (empty), `2026/01/01`, and `2026-02-30` return 422. Empty inputs must be omitted from the query string. |
| An inverted range is rejected by the API | ❌ | `start_date > end_date` returns `200 []` on `/api/metrics`, `/alerts`, and `/categories/top`; the UI must validate it. |
| Alerts use a "rolling average of the previous 3 periods" | ❌ | `baseline_average` is the mean of **all** prior non-empty periods inside the requested range (2026-03: API 55334.29 = cumulative mean; rolling-3 would be 59977.58). The baseline changes with `start_date`. |
| Alerts return a "percentage increase" | ❌ | The field is `increase_ratio` (a fraction, 4 decimals, e.g. `0.3632`); the UI multiplies by 100. A period alerts only when `increase_ratio > threshold` (strict); the first period never alerts. |
| Threshold range 0.01–1.0 | ❌ | OpenAPI: `threshold` is `number`, `minimum: 0`, default `0.3`, no maximum (`threshold=-1` returns 422; `threshold=5` returns `[]`). The 0.01–1.0 range is UI-only validation. |
| `GET /api/metrics/categories/top?operation_type=income&limit=5` can split by business line | ✅ | Optional `business_type` (`B2B`/`B2C`, case-sensitive; `b2b` returns 422); `limit` is an integer 1–20 (default 5); `operation_type` defaults to `outcome`. |
| Each business line has 5 income categories | ❌ | Only `sales` and `others` have income in the generated data; each call returns 2 entries. Categories with no income are omitted, not zero-filled. |
| The top-5 sum equals the business-line income total | ✅ | `limit=5` ≥ 5 categories in facets. B2B 615540.72 equals the `/api/metrics/b2b?operation_type=income` sum; B2B + B2C = 1258146.87 = all income. |
| Facets provides per-group categories | ❌ | `categories` is one global, alphabetically sorted list; there is no `business_type` parameter. Both panels use the same list. |
| Frontend fetch pattern | ✅ | `frontend/src/App.tsx` calls `fetch(`${API_BASE_URL}/api/metrics`)` and computes KPIs and charts client-side. There is no router dependency in `frontend/package.json`. |
