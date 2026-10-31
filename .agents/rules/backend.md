# Backend Rules

- Keep API contracts explicit. `backend/app/routes.py` uses Pydantic response models, `Literal` types, and FastAPI `Query` parameters; preserve these validation and response-shape conventions when extending routes.
- The current API is backed by generated sample data, not a database. `generate_mock_movements(seed=42)` creates the records; movement-list endpoints return them in chronological order. Do not imply that these values come from a live financial system or introduce persistence without a task requiring it.
- Add or update route coverage in `backend/tests/test_routes.py`, which uses FastAPI `TestClient` and pytest. Run the focused backend tests after route or contract changes.
