# Architecture and API Reference

## Runtime Overview

Docker Compose starts two services:

- `frontend`: React and Vite, published on port 5173.
- `backend`: FastAPI served by Uvicorn on port 8000. The backend image also starts `debugpy` on port 5678.

The browser loads the dashboard from Vite. `frontend/vite.config.ts` proxies `/api` requests to `http://backend:8000` inside Compose. The API reference is available at `/docs` while the backend is running; `/health` returns `{"status":"ok"}`.

Start the services with `docker compose up --build`. See the README for URLs and test commands.

## Data and Ownership

`backend/app/routes.py` defines the API models and generates 360 synthetic movements (30 for each month number) using seed `42`. Movement dates are based on `date.today()`. The data is regenerated for requests; there is no database, persistence, or live financial provider.

A movement contains:

| Field | Meaning |
| --- | --- |
| `create_date` | Calendar date serialized as `YYYY-MM-DD` |
| `amount` | Numeric movement amount |
| `operation_type` | `income` or `outcome` |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, or `others` |
| `business_type` | `B2B` or `B2C` |

Date filters are inclusive of both `start_date` and `end_date`. Movement-list endpoints return records in chronological order. FastAPI rejects unsupported `Literal` query values with HTTP 422.

`frontend/src/App.tsx` currently fetches only `GET /api/metrics`. It computes KPIs and monthly chart data through `frontend/src/lib/financial-utils.ts`; other analytics routes below are available to callers but are not used by the dashboard screen. The matching TypeScript movement and metric shapes are in `frontend/src/lib/financial-types.ts`.

## API Routes

All routes use generated sample data. Query date values use ISO `YYYY-MM-DD` format.

| Method and path | Query parameters | Response |
| --- | --- | --- |
| `GET /health` | None | `{"status":"ok"}` |
| `GET /api/metrics` | Optional `start_date`, `end_date`, `category`, `operation_type` | Chronologically sorted movement list |
| `GET /api/metrics/facets` | None | `operation_types`, `business_types`, `categories`, `min_date`, `max_date` |
| `GET /api/metrics/summary` | `group_by` (`day`, `week`, `month`; default `month`); optional `start_date`, `end_date`, `category`, `operation_type`, `business_type` | List of `{period, income, outcome, net}` |
| `GET /api/metrics/categories/top` | `operation_type` (default `outcome`); `limit` (1-20, default 5); optional `start_date`, `end_date`, `business_type` | Categories ranked by total amount, descending |
| `GET /api/metrics/comparison` | Required `start_date`, `end_date`; optional `business_type` | `{current_period, previous_period, delta_abs, delta_pct}` |
| `GET /api/metrics/alerts` | `threshold` (default `0.3`, minimum 0); `group_by` (default `month`); optional `start_date`, `end_date`, `business_type` | Outcome increases against the average of prior grouped periods |
| `GET /api/metrics/b2b` | Optional `start_date`, `end_date`, `category`, `operation_type` | Chronologically sorted B2B movement list |
| `GET /api/metrics/b2c` | Optional `start_date`, `end_date`, `category`, `operation_type` | Chronologically sorted B2C movement list |

The comparison route compares the requested net value with the immediately preceding period of matching duration. `delta_pct` is `null` when the previous net is zero. Alert ratios are relative increases, and an alert is emitted only when the increase exceeds the threshold and a positive historical baseline exists.

Use the interactive FastAPI docs at `/docs` for the live schema and request controls; the route signatures and Pydantic response models in `backend/app/routes.py` are authoritative.

## Frontend Calculations

`frontend/src/lib/financial-utils.ts` owns dashboard financial calculations:

- `computeKPIs`: sums income and outcome, calculates profit as income minus outcome, and profit percent as profit divided by income (zero when income is zero).
- `computeMonthlyData`: aggregates income and outcome by calendar year-month and calculates monthly profit percent using the same zero-income rule.
- `formatPeriodLabel`: derives the displayed period from the earliest and latest movement dates; empty input returns `No data`.

Date strings are calendar dates, not timestamps. Monthly grouping uses the `YYYY-MM` portion directly to avoid timezone-dependent date shifts.

## Tests

Run backend route tests in the Compose environment from the repository root:

```bash
docker compose run --rm backend pytest -q
```

Run frontend checks after installing the locked dependencies:

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

Backend route tests are in `backend/tests/test_routes.py`; frontend calculation tests are in `frontend/src/lib/financial-utils.test.ts`.
