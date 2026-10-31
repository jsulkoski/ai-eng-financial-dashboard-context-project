# Verification Trail

Checked against source and the running Compose stack on 2026-10-30.

- **Wrong claim:** The dashboard displays 2024 data. **Correction:** `frontend/src/App.tsx` hardcodes the label `2024 - Full Year`, but `GET /api/metrics` returned 360 seeded movements dated 2025-10-02 through 2026-09-28. The observed range is runtime-dependent.
- **Wrong claim:** The dashboard uses the 2024 data in `frontend/src/lib/mock-data.ts`. **Correction:** `frontend/src/App.tsx` fetches `/api/metrics` from the backend; that mock-data module is not imported there.
- **Follow-up:** The period label now derives from the returned movement dates via `formatPeriodLabel`; empty data and fetch failures avoid displaying a false date. The focused Vitest file passes (7 tests), the frontend build and lint pass, and the monthly-summary pytest passes with chronological-period coverage. The build reports a large-chunk advisory; pytest reports a Starlette/httpx deprecation warning.
