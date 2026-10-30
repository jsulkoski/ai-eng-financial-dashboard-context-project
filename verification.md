# Verification Trail

Checked against source and the running Compose stack on 2026-10-30.

- **Wrong claim:** The dashboard displays 2024 data. **Correction:** `frontend/src/App.tsx` hardcodes the label `2024 - Full Year`, but `GET /api/metrics` returned 360 seeded movements dated 2025-10-02 through 2026-09-28. The observed range is runtime-dependent.
- **Wrong claim:** The dashboard uses the 2024 data in `frontend/src/lib/mock-data.ts`. **Correction:** `frontend/src/App.tsx` fetches `/api/metrics` from the backend; that mock-data module is not imported there.