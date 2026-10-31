# Frontend Dashboard Rules

## Scope

Applies to dashboard data loading, financial calculations, date formatting, and UI components under `frontend/src/`, especially `App.tsx`, `lib/financial-types.ts`, and `lib/financial-utils.ts`.

## Rationale

`App.tsx` fetches `/api/metrics`; the separate `lib/mock-data.ts` is not used by the dashboard. KPI and monthly calculations live in `lib/financial-utils.ts`, with colocated Vitest coverage. Backend `create_date` values are calendar dates serialized as `YYYY-MM-DD`, not timestamps.

## Guidance

- Use the backend response as the dashboard data source. Do not silently switch to `lib/mock-data.ts`.
- Keep `FinancialMovement` and its enum values aligned with `backend/app/routes.py` and `lib/financial-types.ts`; check both sides when changing the API contract.
- Keep KPI, monthly aggregation, and period-label logic in `lib/financial-utils.ts`. Update `lib/financial-utils.test.ts` when changing those behaviors.
- Treat `create_date` as a calendar date, not a timestamp. Do not group it through timezone-dependent local date getters; add a regression test for date and year boundaries when changing date handling.
- Derive the displayed period from returned movements. The API uses `date.today()`, so a hard-coded calendar range becomes stale.
- Prefer the existing frontend scripts over new dependencies for routine validation: `npm test -- <test-file>`, `npm run lint`, and `npm run build`.
