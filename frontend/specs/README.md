# Frontend Specs: Data Contract

This is the data contract for three finance-team features on the financial dashboard. Read it
alongside:

- [`api-types.ts`](./api-types.ts): response types
- [`param-types.ts`](./param-types.ts): query parameter types
- [`components.md`](./components.md): components, props, and rendering states
- [`contract-samples.ts`](./contract-samples.ts): live payloads type-checked against the types above

**Scope:** specification only. Implementers build the React components and API calls from
these files. Backend changes are out of scope.

**Verification:** every endpoint, field, parameter, and constraint below was checked against the
running backend's `/docs` (`GET /openapi.json`) and live calls on 2026-11-15. The trail is in
[`../../verification.md`](../../verification.md).

To re-check the types, run in this folder:

```bash
cd frontend/specs && npx tsc --noEmit
```

## Global rules (all features)

| Rule | Detail |
|---|---|
| Base URL | `${import.meta.env.VITE_API_BASE_URL ?? ''}` + path, as in `src/App.tsx`. In dev, Vite proxies `/api` to the backend. |
| Method | Every endpoint below is `GET` with query-string parameters only, no body. |
| Date format | `YYYY-MM-DD` strings (OpenAPI `format: date`). Bounds are **inclusive**. Malformed or impossible dates (`2026/01/01`, `2026-02-30`) → HTTP 422. |
| Empty parameters | Omit a parameter that has no value. `start_date=` (empty string) → HTTP 422 `date_from_datetime_parsing`. |
| Inverted ranges | `start_date > end_date` is **not** rejected; the API returns `200` with `[]`. The UI validates the range and doesn't send the request (see `components.md`). |
| Enums | Case-sensitive. `business_type=b2b` → HTTP 422 `literal_error`. |
| Errors | Invalid parameters → HTTP 422 with `ValidationErrorResponse`. Any non-2xx status is treated as a failed request; the UI shows that component's error state, not the API message. |
| Data nature | Values are synthetic, generated from `date.today()` with a fixed seed. They are not live or persisted. `min_date`/`max_date` move forward daily; **never hard-code dates**. |
| Stale responses | Only the latest request of each kind may update the UI. |

## Endpoint summary

| Feature | Endpoint | Params type | Response type |
|---|---|---|---|
| 1, 3 | `GET /api/metrics/facets` | none | `FacetsResponse` |
| 1 | `GET /api/metrics` | `MetricsParams` (sends only the `DateRangeFilter` fields) | `MetricsResponse` (`FinancialMovement[]`) |
| 2 | `GET /api/metrics/alerts` | `AlertsParams` | `AlertsResponse` (`AlertEntry[]`) |
| 3 | `GET /api/metrics/categories/top` | `TopCategoriesParams` | `TopCategoriesResponse` (`CategoryEntry[]`) |

## PM brief vs API: resolved mismatches

| PM wording | Actual API (verified) | Resolution in these specs |
|---|---|---|
| "filters extension on the existing metrics endpoint" | `GET /api/metrics` already accepts `start_date`/`end_date` | Reuse it. No new endpoint. |
| Alerts column "rolling average of the previous 3 periods" | `baseline_average` = mean of **all** earlier non-empty periods inside the requested range (2026-03: 55334.29 cumulative vs 59977.58 for rolling-3) | Column is labelled "Baseline average" and the copy describes the real rule. A true rolling-3 average needs a backend change; this is a follow-up for the PM and backend. |
| "percentage increase" | `increase_ratio` is a fraction with 4 decimals | Display `increase_ratio * 100` with 1 decimal |
| Threshold "between 0.01 and 1.0" | API: `number`, `minimum: 0`, no maximum | The UI enforces 0.01–1.0; the API isn't changed |
| "top 5 income categories" | Results omit zero-total categories; income exists only in `sales` and `others` today | Render only the returned rows (currently 2); no padding |
| "available categories for each group must come from the facets endpoint" | `facets.categories` is one global list with no `business_type` parameter | Both panels use the same list to name categories that have no income |
| "percentage of the group total" | No total field in the API | Group total = sum of returned `total_amount`. This is exact because `limit=5` ≥ the 5 facets categories. |

---

## Feature 1: Date range filter (home dashboard)

### `GET /api/metrics/facets`

Query parameters: none. Any parameters sent are ignored, so the values never reflect filters.
Fetch once per page mount.

Response `FacetsResponse` (all fields required):

| Field | Type | Meaning / valid values |
|---|---|---|
| `min_date` | `IsoDateString` | Earliest movement date in the dataset, `YYYY-MM-DD` (observed `2025-11-01`) |
| `max_date` | `IsoDateString` | Latest movement date, `YYYY-MM-DD`, ≥ `min_date` (observed `2026-10-28`) |
| `categories` | `Category[]` | Alphabetical: `administrative, operational, others, sales, suppliers` |
| `business_types` | `BusinessType[]` | `["B2B", "B2C"]` |
| `operation_types` | `OperationType[]` | `["income", "outcome"]` |

### `GET /api/metrics`

| Param | Type | Required | Constraints |
|---|---|---|---|
| `start_date` | `IsoDateString` | no | Real calendar date `YYYY-MM-DD`; inclusive lower bound |
| `end_date` | `IsoDateString` | no | Same format; inclusive upper bound; ≥ `start_date` when both are set (UI-enforced) |
| `category`, `operation_type` | enums | no | Exist in the API but **not sent** by Feature 1 |

Response `MetricsResponse`: `FinancialMovement[]` in chronological order, or `[]`.

| Field | Type | Values |
|---|---|---|
| `create_date` | `IsoDateString` | `YYYY-MM-DD` calendar date (not a timestamp) |
| `amount` | `number` | Positive USD |
| `operation_type` | `OperationType` | `income` \| `outcome` |
| `category` | `Category` | `suppliers` \| `sales` \| `operational` \| `administrative` \| `others` |
| `business_type` | `BusinessType` | `B2B` \| `B2C` |

### Edge cases

| # | Case | API behavior (verified) | UI must show |
|---|---|---|---|
| 1.1 | Both inputs empty | No date parameters → all 360 movements | Full dashboard; Clear disabled; no active-range text |
| 1.2 | Only start date set | `?start_date=2026-09-01` → movements from that date to `max_date` | `Showing data from 2026-09-01`; KPIs, charts, and alerts filtered |
| 1.3 | Only end date set | `?end_date=2025-11-30` → movements from `min_date` to that date | `Showing data through 2025-11-30` |
| 1.4 | Start after end | `200 []` (not an error) | Inline `Start date must be on or before end date.` (`role="alert"`); **no request**; previous data stays |
| 1.5 | Range outside facets bounds | `200 []` | Note "Selected dates are outside the available data range."; KPIs `$0`; charts "No data available to display"; header "No data" |
| 1.6 | Same start and end date | Inclusive; one day's movements | Normal rendering for that day |
| 1.7 | Facets request fails | n/a | `Available date range unavailable`; inputs still work without `min`/`max` |

---

## Feature 2: Anomaly alerts table (home dashboard)

### `GET /api/metrics/alerts`

| Param | Type | Required (API) | Sent by Feature 2 | Constraints |
|---|---|---|---|---|
| `threshold` | `number` | no (default `0.3`) | **always** | API: `≥ 0`, no max. UI: `0.01 ≤ n ≤ 1.0`, default `0.3` |
| `group_by` | `GroupBy` | no (default `month`) | always `"month"` | `day` \| `week` \| `month` |
| `start_date` | `IsoDateString` | no | when set in Feature 1 | inclusive |
| `end_date` | `IsoDateString` | no | when set in Feature 1 | inclusive |
| `business_type` | `BusinessType` | no | never | `B2B` \| `B2C` |

Response `AlertsResponse`: `AlertEntry[]` in chronological order, or `[]`.

| Field | Type | Meaning | Display |
|---|---|---|---|
| `period` | `string` | `YYYY-MM` when `group_by=month` (`YYYY-Www` for week, `YYYY-MM-DD` for day) | `Mar 2026` |
| `outcome_total` | `number` | Outcome in that period, USD (2 dp) | `formatCurrency` |
| `baseline_average` | `number` | Mean outcome of all earlier non-empty periods **within the requested range**, > 0 | `formatCurrency` |
| `increase_ratio` | `number` | `(outcome_total - baseline_average) / baseline_average`, 4 dp, always `> threshold` | `+{ratio*100 to 1 dp}%` |

Detection rule: periods are evaluated in order and the first period has no baseline, so it never
alerts. A period is returned when `increase_ratio > threshold` (strictly greater). Because the
baseline only uses periods inside the range, **changing `start_date` can add or remove alerts**.
For example, 2026-03 has a baseline of 55334.29 with no range and 38276.88 from 2026-01-01.

### Edge cases

| # | Case | API behavior (verified) | UI must show |
|---|---|---|---|
| 2.1 | No anomalies for the threshold | `threshold=5` → `200 []` | Table header plus a single row: `No spending anomalies above {pct} {range}.` The table never disappears. |
| 2.2 | Fewer than 2 months in range | Single-month range → `[]` | `Not enough data: at least two months are needed to compare against a baseline.` |
| 2.3 | Threshold outside 0.01–1.0, empty, or not a number | (not sent; API would accept `5` and reject `-1` / `abc` with 422) | `Enter a ratio between 0.01 and 1.00.`; no request for the invalid value, and the table and helper keep the last applied threshold. A later valid date change still refetches with that applied threshold. |
| 2.4 | Date range from Feature 1 is invalid (start > end) | (not sent) | Table keeps the last valid results |
| 2.5 | Request fails | non-2xx | Table header plus a single row: `Could not load spending anomalies. Try again later.` |
| 2.6 | Threshold exactly equals a period's ratio | Strict `>`, so that period is not returned | Not listed (expected) |

---

## Feature 3: B2B vs B2C comparison view (new page `#/b2b-vs-b2c`)

### `GET /api/metrics/facets`

Same as Feature 1. Feature 3 uses `categories` (to name categories with no income) and
`min_date`/`max_date` (the available-range hint).

### `GET /api/metrics/categories/top` (called twice in parallel, once per business line)

| Param | Type | Required (API) | Sent by Feature 3 | Constraints |
|---|---|---|---|---|
| `operation_type` | `OperationType` | no (**default `outcome`**) | always `"income"` | `income` \| `outcome` |
| `limit` | `number` (integer) | no (default `5`) | always `5` | `1 ≤ limit ≤ 20`; `0` or `21` → 422 |
| `business_type` | `BusinessType` | no (omitted = both lines) | `"B2B"`, then `"B2C"` | case-sensitive |
| `start_date` | `IsoDateString` | no | when set on this page | inclusive |
| `end_date` | `IsoDateString` | no | when set on this page | inclusive |

Response `TopCategoriesResponse`: `CategoryEntry[]` sorted by `total_amount` descending, at most
`limit` entries, or `[]`. Categories with no matching income are **omitted**.

| Field | Type | Meaning | Display |
|---|---|---|---|
| `category` | `Category` | Category name | Capitalized: `Sales` |
| `operation_type` | `OperationType` | Echo of the request; always `income` here | not displayed |
| `total_amount` | `number` | Income for the category, business line, and range; USD (2 dp), > 0 | `formatCurrency` |

Derived values (UI-side):
- Group total = sum of that line's `total_amount`.
- Share = `total_amount / groupTotal * 100`.
- Chart bar = group total per business line.

Observed with no range: B2B `sales` 557903.97 and `others` 57636.75 (total 615540.72); B2C
`sales` 574193.41 and `others` 68412.74 (total 642606.15).

### Edge cases

| # | Case | API behavior (verified) | UI must show |
|---|---|---|---|
| 3.1 | Fewer than 5 income categories (current data) | 2 entries per line | Only the 2 rows (no padding), shares summing to ~100%, and a footer `No income: Administrative, Operational, Suppliers` from `facets.categories` |
| 3.2 | No income for a line in range | `200 []` | That panel: header plus `No income recorded for B2B {range}.`, `Total income: $0`, and no percentages |
| 3.3 | No income for either line | both `[]` | Both panels empty as in 3.2; chart replaced by `No income to compare for {range}.` |
| 3.4 | One line's request fails | non-2xx for one call | That panel shows `Could not load B2C income categories.`; the other panel renders normally; the chart shows `Comparison unavailable: B2C data failed to load.` |
| 3.5 | Start after end | `200 []` (not an error) | Same inline validation as Feature 1; no requests; previous results stay |
| 3.6 | Facets fails | n/a | Panels render without the "No income" footer; the range hint shows `Available date range unavailable` |

---

## Implementation checklist for a coding agent

1. Import types from `frontend/specs/*.ts` or copy them into `src/lib/`. Keep the enums aligned with
   `src/lib/financial-types.ts` and `backend/app/routes.py`.
2. Add the pure helpers listed in `components.md` (`validateDateRange`, `formatRangeLabel`,
   `isOutsideAvailableRange`). Export `formatMonthYearLabel`. Add Vitest cases beside
   `financial-utils.test.ts` for every edge case above that a helper decides.
3. Build the components exactly as named in `components.md`. No new dependencies.
4. Validate with `npm test`, `npm run lint`, and `npm run build` in `frontend/`.
