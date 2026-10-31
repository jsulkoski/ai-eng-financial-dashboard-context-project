# Backend Rules

- Keep API contracts explicit. `backend/app/routes.py` uses Pydantic response models, `Literal` types, and FastAPI `Query` parameters; preserve these validation and response-shape conventions when extending routes.
- The current API is backed by generated sample data, not a database. `generate_mock_movements(seed=42)` creates the records; movement-list endpoints return them in chronological order. Do not imply that these values come from a live financial system or introduce persistence without a task requiring it.
- Preserve the date-filter contract: `filter_movements_by_date` includes both `start_date` and `end_date` (`>=` / `<=`), and movement-list routes sort results chronologically. `test_filter_movements_by_date_includes_range_edges` and the B2B/B2C route tests assert these behaviors.
- Keep API enum values synchronized with the frontend unions in `frontend/src/lib/financial-types.ts`: backend `OperationType`, `Category`, `BusinessType`, and `GroupBy` are `Literal` types in this module, while the first three are also declared in TypeScript. The facets and filtering tests in `backend/tests/test_routes.py` cover the accepted values.
- Add or update route coverage in `backend/tests/test_routes.py`, which uses FastAPI `TestClient` and pytest. Run the focused backend tests after route or contract changes.
