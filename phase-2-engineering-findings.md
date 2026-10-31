# Phase 2: Engineering Findings and Proposed Rules

## Scope

These findings are retained because each is tied to a concrete implementation, test, or documented workflow. Each proposed rule cites the repository fact that motivates it.

## Architecture

- **Finding:** The dashboard fetches `GET /api/metrics` in `frontend/src/App.tsx` and calculates KPI and monthly chart values in `frontend/src/lib/financial-utils.ts`. The backend also exposes summary, comparison, category, alert, B2B, and B2C routes in `backend/app/routes.py`, but the dashboard does not call those routes. `frontend/src/lib/mock-data.ts` exists but is not imported by the screen.
  **Risk:** Adding parallel calculations or silently changing data sources can make displayed metrics disagree.
  **Proposed rule:** Before changing dashboard data flow or financial calculations, identify the authoritative source and whether the change belongs in the API or frontend utilities. Do not silently substitute local mock data or duplicate calculations across layers.

- **Finding:** `backend/app/routes.py` defines API enums and the `FinancialMovement` Pydantic model; `frontend/src/lib/financial-types.ts` separately declares the corresponding TypeScript union types and interface.
  **Risk:** The API contract can drift between backend validation/serialization and frontend assumptions.
  **Proposed rule:** When changing a movement field or enum value, update and verify both representations, then cover the contract in `backend/tests/test_routes.py` and any affected frontend tests.

## Data and Date Semantics

- **Finding:** `generate_mock_movements(seed=42)` in `backend/app/routes.py` creates 360 records using `date.today()`. The API is generated sample data, not a financial provider or persistent store.
  **Risk:** Treating observed dates or values as permanent, live, or persisted data can produce misleading UI and documentation.
  **Proposed rule:** Describe the current backend as deterministic generated sample data; date-range observations must be labeled as runtime observations, not fixed API guarantees.

- **Finding:** The backend movement model uses Python `date`, serialized as a date-only value. `computeMonthlyData` in `frontend/src/lib/financial-utils.ts` parses `create_date` with `new Date(...)` and reads local year/month.
  **Risk:** JavaScript interprets ISO date-only strings as UTC, so local getters in some time zones can group a movement into the previous month.
  **Proposed rule:** Handle `create_date` as a calendar date, not a timestamp; avoid timezone-dependent month grouping and add a boundary regression test when changing this logic.

- **Finding:** `filter_movements_by_date` uses inclusive `>=` and `<=` comparisons, and movement-list routes sort by `create_date`. The route tests assert range-edge inclusion and sorted B2B/B2C results.
  **Risk:** A filter or ordering change can silently omit edge-day records or destabilize chart periods.
  **Proposed rule:** Preserve inclusive date bounds and chronological movement ordering unless the API contract is intentionally changed and its route tests are updated.

## Testing

- **Finding:** Backend route coverage is in `backend/tests/test_routes.py` using pytest and FastAPI `TestClient`; frontend financial utility coverage is colocated in `frontend/src/lib/financial-utils.test.ts` using Vitest. Tests cover inclusive date bounds, sorted periods, and unsorted cross-year frontend data.
  **Risk:** Changes to shared aggregation, ordering, or API behavior can regress without checks at the owning layer.
  **Proposed rule:** Add or update tests beside the owning behavior: route/contract tests for backend changes and utility tests for frontend calculations or formatting. Use the existing frontend `test`, `lint`, and `build` scripts for affected frontend changes.

## Naming

- **Finding:** Frontend component filenames in `frontend/src/components/dashboard/` use kebab-case (for example, `kpi-row.tsx` and `income-outcome-chart.tsx`); backend modules use snake_case (`backend/app/main.py`, `backend/app/routes.py`).
  **Risk:** Inconsistent names make files harder to locate and can diverge from the existing import patterns.
  **Proposed rule:** Preserve kebab-case for frontend component files and snake_case for Python modules; follow the existing directory ownership rather than introducing a second naming convention.

## Documentation and DX

- **Finding:** `README.md` documents `docker compose up --build`, frontend port 5173, backend port 8000, and API docs at `/docs`. `docker-compose.yml` names the services `frontend` and `backend`; `frontend/vite.config.ts` proxies `/api` to `http://backend:8000`.
  **Risk:** Starting Vite outside Compose while relying on the Compose-only hostname `backend` can make API calls fail.
  **Proposed rule:** Treat Compose as the documented default run path. When documenting or supporting standalone Vite use, configure `VITE_API_BASE_URL` to a reachable backend origin rather than assuming Compose DNS.

- **Finding:** `verification.md` dates its smoke-check observations and explicitly distinguishes the observed API date range from runtime-dependent behavior.
  **Risk:** Undated observations can become stale and be mistaken for invariant behavior.
  **Proposed rule:** Date environment-dependent verification results and separate observed values from code-level guarantees; update the trail when rerunning those checks.
