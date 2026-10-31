# Project Memory

## Product

Financial Metrics Dashboard: a dashboard for reviewing income, expenses, profit, and profit margin, with monthly charts. It currently uses deterministic generated sample movements; it is not connected to a real financial data provider.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, and Recharts.
- Backend: FastAPI and Pydantic, served by Uvicorn; debugpy is enabled in the Docker image.
- Local orchestration: Docker Compose defines `frontend` and `backend`. The frontend's Vite config proxies `/api` requests to `backend:8000`.
- Tests: Vitest for frontend utilities; pytest and FastAPI `TestClient` for backend routes.

## Current Status

- The dashboard fetches `/api/metrics` and computes its KPIs and monthly chart data in the frontend. Additional backend analytics routes exist but are not currently used by the dashboard screen.
- The sample API generates 360 seeded movements, with dates based on the current date. On 2026-10-30, the observed API range was 2025-10-02 through 2026-09-28.
- The dashboard period label now derives its month range from returned movements; empty data and fetch failures use neutral status labels instead of a misleading fixed year.
- The period formatter has focused Vitest coverage for empty input and unsorted cross-year data. The monthly-summary route test also verifies chronological periods.
- Phase 1 mapping and HTTP smoke checks are recorded in the root `verification.md`; Docker Compose and key API paths were confirmed working. Visual browser rendering has not been checked.
