# Backend API Rules

## Scope

Applies to API routes, response models, generated financial data, and backend route tests, primarily in `backend/app/routes.py` and `backend/tests/test_routes.py`.

## Rationale

`routes.py` defines the FastAPI contract with Pydantic response models, `Literal` types, and `Query` parameters. Its sample records are generated from a fixed seed but use `date.today()`, so record values are not live financial data and their date range changes over time.

## Guidance

- Keep request parameters and response shapes explicit with the existing Pydantic, `Literal`, and `Query` patterns. Unsupported enum values should remain rejected by FastAPI validation.
- When changing `FinancialMovement` fields or enum values, update the corresponding declarations in `frontend/src/lib/financial-types.ts` and cover the contract in `backend/tests/test_routes.py`.
- Treat `generate_mock_movements(seed=42)` as generated sample data, not a live provider or persistent store. Preserve chronological movement-list results.
- Preserve inclusive date bounds: `filter_movements_by_date` includes both `start_date` and `end_date`. If changing this contract, update its range-edge test and route coverage.
- Add route tests beside the implementation using the existing pytest and FastAPI `TestClient` patterns. Run the focused backend route tests after route or contract changes.
