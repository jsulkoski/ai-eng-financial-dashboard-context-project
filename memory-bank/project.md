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

## Session Handoff (2026-10-31)

- Workspace is on branch `main` with a clean worktree. Recent commits: `e25950e` (Phase 1 verification trail) and `f4e7a77` (agent rules, project memory, rule-guided fix, and tests). Commits are local; check remote state before pushing.
- Frontend period label was changed to derive its range from `/api/metrics` movement dates. `formatPeriodLabel` is covered for empty input and unsorted cross-year data.
- Verification passed: focused Vitest (7 tests), frontend build, frontend lint, and the focused monthly-summary pytest. Build has a large-chunk advisory; pytest has a Starlette/httpx deprecation warning.
- To start the documented services, run `docker compose up --build`; confirm current port mappings with `docker compose ps`. The last known mappings were frontend `5173`, backend `8000`, and debugpy `5678`.
- Suggested resume point: visually inspect the dashboard and charts in a browser; that was not verified in this session. The full conversation should remain available in VS Code chat history, but this file is a summary rather than a transcript.
