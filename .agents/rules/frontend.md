# Frontend Rules

- Treat the backend response as the dashboard's data source. `frontend/src/App.tsx` fetches `/api/metrics`; `frontend/src/lib/mock-data.ts` exists but is not imported by the screen. Do not silently switch between these sources.
- Keep financial aggregation and date-label logic in `frontend/src/lib/financial-utils.ts`. It already owns `computeKPIs` and `computeMonthlyData`; update the colocated `financial-utils.test.ts` when changing those behaviors.
- Derive displayed periods from returned data rather than hard-coding calendar dates. The backend generates dates relative to the current date, while `App.tsx` previously labeled the view `2024 - Full Year`.
- Use the existing frontend scripts and avoid adding dependencies for small changes: `npm test -- <test-file>` runs Vitest, `npm run lint` runs ESLint, and `npm run build` type-checks and builds.
