# Component Specifications

Frontend component specs for three finance-team features. Types come from
[`api-types.ts`](./api-types.ts) and [`param-types.ts`](./param-types.ts), which are verified
against `/openapi.json`. The endpoint contract, constraints, and edge cases are in
[`README.md`](./README.md).

This folder is a specification only. It contains no React components or API calls.

## Conventions (taken from existing code)

| Topic | Rule | Source |
|---|---|---|
| Files | kebab-case `.tsx` under `src/components/<area>/`; one exported PascalCase component per file | `src/components/dashboard/*.tsx` |
| Props | a non-exported `interface <Name>Props` with an optional `loading?: boolean` | `kpi-row.tsx`, `income-outcome-chart.tsx` |
| Containers | `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` from `@/components/ui/card`; `Skeleton` from `@/components/ui/skeleton` for loading | `income-outcome-chart.tsx` |
| Charts | Recharts inside `ResponsiveContainer`, 280 px tall | `income-outcome-chart.tsx` |
| Money | `formatCurrency(value)` gives USD with 0 decimals, e.g. `$557,904` | `src/lib/financial-utils.ts` |
| Percent | `formatPercent(value)` gives 1 decimal, e.g. `36.3%`; pass a value already multiplied by 100 | `src/lib/financial-utils.ts` |
| Month label | `formatMonthYearLabel("2026-03")` returns `"Mar 2026"`. It is module-private today; export it from `financial-utils.ts` and reuse it, don't duplicate it | `src/lib/financial-utils.ts` |
| Data fetching | `fetch(`${API_BASE_URL}${path}`)` and a non-OK status throws, as in `fetchFinancialData` | `src/App.tsx` |
| Dates | Treat `YYYY-MM-DD` values as strings. Compare them with `<`/`>` on the string; never convert them with `new Date()` | `.agents/rules/frontend.md` |
| UI copy | English, matching the existing headings | `dashboard-header.tsx` |

Shared request rule: build the query string only from properties that are set. Never send an
empty parameter such as `start_date=`, because the API returns 422 for it. Only the latest
response for each request kind may update state: abort the previous request or ignore stale
responses.

### Shared helpers (pure functions, specified for `src/lib/`)

| Helper | Signature | Behavior |
|---|---|---|
| `validateDateRange` | `(range: DateRangeFilter) => string \| null` | Returns `"Start date must be on or before end date."` when both dates are set and `start_date > end_date`. Otherwise returns `null`. |
| `formatRangeLabel` | `(range: DateRangeFilter) => string` | Phrase that completes a sentence: `{}` → `"across all available dates"`; start only → `"from 2026-09-01"`; end only → `"through 2025-11-30"`; both → `"between 2026-01-01 and 2026-03-31"`. |
| `isOutsideAvailableRange` | `(range: DateRangeFilter, facets: Pick<FacetsResponse, 'min_date' \| 'max_date'>) => boolean` | `true` when `end_date < min_date` or `start_date > max_date`. A range like this returns no data. |

---

## Feature 1: Date range filter (home dashboard)

### Component tree

```
App (owns state; home view)
├── DashboardNav                 (Feature 3: view switcher)
├── DashboardHeader              (existing, unchanged)
├── DateRangeFilterBar           ← new
│   └── AvailableRangeHint       ← new
├── KPIRow                       (existing; fed by filtered movements)
├── IncomeOutcomeChart           (existing; fed by filtered movements)
├── ProfitPercentChart           (existing; fed by filtered movements)
└── AnomalyAlertsSection         (Feature 2)
```

### State in `App` (home view)

| State | Type | Initial | Notes |
|---|---|---|---|
| `dateRange` | `DateRangeFilter` | `{}` | The values in the inputs. `""` from an input is stored as an absent key, never as `""`. |
| `appliedRange` | `DateRangeFilter` | `{}` | The last range that passed validation and was sent to the API. KPIs, charts, and alerts always reflect this range. |
| `facets` | `FacetsResponse \| null` | `null` | Fetched once on mount from `GET /api/metrics/facets`. The API ignores filters, so don't refetch it. |
| `facetsStatus` | `'loading' \| 'ready' \| 'error'` | `'loading'` | |

Flow: on every `dateRange` change, run `validateDateRange`.
- If it returns `null`: set `appliedRange = dateRange`, then refetch
  `GET /api/metrics` with `MetricsParams` (dates only) and the alerts (Feature 2).
- If it returns an error: don't fetch. Keep the previous `appliedRange` and its data on screen.

KPIs, charts, and the header period label keep using the existing `computeKPIs`,
`computeMonthlyData`, and `formatPeriodLabel` on the returned movements. Don't change them.

### `DateRangeFilterBar`

File: `src/components/dashboard/date-range-filter-bar.tsx`. Also reused by Feature 3.

```ts
interface DateRangeFilterBarProps {
  /** Current input values; absent key = empty input. */
  value: DateRangeFilter
  /** Called with the next value; an emptied input removes its key (never `''`). */
  onChange: (next: DateRangeFilter) => void
  /** Dataset bounds from facets; `null` while loading or after a facets error. */
  availableRange: Pick<FacetsResponse, 'min_date' | 'max_date'> | null
  /** Facets request state, forwarded to `AvailableRangeHint`. */
  availableRangeStatus: 'loading' | 'ready' | 'error'
  /** Result of `validateDateRange(value)`; `null` when valid. */
  validationError: string | null
  /** Accessible group label, e.g. `"Dashboard date range"` or `"Comparison date range"`. */
  label: string
}
```

Rendering rules:

| Element | Rule |
|---|---|
| Start input | `<input type="date">` labelled "Start date". `value={value.start_date ?? ''}`. Set `min`/`max` to `availableRange.min_date`/`max_date` when available (this guides the picker but doesn't block typed values). |
| End input | `<input type="date">` labelled "End date". `value={value.end_date ?? ''}`. Set `min` to `value.start_date ?? availableRange.min_date` and `max` to `availableRange.max_date`. |
| Both empty | Valid. No date parameters are sent and the dashboard shows all data. Hide the active-range text and disable Clear. |
| Only one date set | Valid. Send only that parameter (verified as open-ended in the API). The active-range text reads `Showing data from 2026-09-01` or `Showing data through 2025-11-30`. |
| Both set and `start ≤ end` | Valid. Both parameters are sent and both bounds are inclusive. Text: `Showing data between 2026-01-01 and 2026-03-31` (all active-range text is `Showing data {formatRangeLabel(value)}`). |
| Both set and `start > end` | Invalid. Render `validationError` under the inputs with `role="alert"`, and set `aria-invalid="true"` on both inputs. No request is sent and the previous results stay on screen. |
| Range outside facets bounds | Valid and sent. The empty results then use each component's own empty state. Also show a muted note under the inputs: "Selected dates are outside the available data range." |
| Clear button | Calls `onChange({})`. Disabled when both inputs are empty. |
| When requests fire | Immediately on change. A native date input only reports `''` or a complete `YYYY-MM-DD`, so no Apply button or debounce is needed. |

### `AvailableRangeHint`

File: `src/components/dashboard/available-range-hint.tsx`. Rendered inside `DateRangeFilterBar`,
next to the inputs.

```ts
interface AvailableRangeHintProps {
  range: Pick<FacetsResponse, 'min_date' | 'max_date'> | null
  status: 'loading' | 'ready' | 'error'
}
```

| `status` | Renders |
|---|---|
| `'loading'` | `Skeleton` (`h-4 w-48`) |
| `'ready'` | `Available data: 2025-11-01 – 2026-10-28` (raw `YYYY-MM-DD`, matching the input format) |
| `'error'` | Muted text `Available date range unavailable`. The inputs stay enabled without `min`/`max`. |

### Existing components with filtered data (no prop changes)

| Filtered result | `DashboardHeader` | `KPIRow` | Charts |
|---|---|---|---|
| Loading | unchanged ("Loading period...") | `loading` | `loading` skeletons |
| Movements returned | `formatPeriodLabel(movements)` | `computeKPIs(movements)` | `computeMonthlyData(movements)` |
| `[]` (no movements in range) | `"No data"` | `$0` values | Existing "No data available to display" |
| Request error | `"Period unavailable"` | `metrics={null}` | Empty. The existing error banner is shown. |

---

## Feature 2: Anomaly alerts table (home dashboard)

Placed in `App` below the `Financial charts` section, full width, inside
`<section aria-label="Spending anomalies">`.

### `AnomalyAlertsSection`

File: `src/components/dashboard/anomaly-alerts-section.tsx`. A `Card` containing the title
"Spending anomalies", a description, a `ThresholdInput`, and an `AnomalyAlertsTable`.

```ts
interface AnomalyAlertsSectionProps {
  /** API rows for `appliedThreshold` + `appliedRange`; empty array before first load. */
  alerts: AlertsResponse
  /** Raw text currently in the threshold input (controlled). */
  thresholdInput: string
  /** Called on every keystroke with the raw text. */
  onThresholdInputChange: (next: string) => void
  /** Validation message for `thresholdInput`; `null` when valid. */
  thresholdError: string | null
  /** Threshold used for the rows currently shown (`AlertsParams['threshold']`). */
  appliedThreshold: number
  /** Range used for the rows currently shown; same object as Feature 1's `appliedRange`. */
  appliedRange: DateRangeFilter
  /** Number of months with movements in `appliedRange` (`computeMonthlyData(movements).length`). */
  monthsInRange: number
  loading?: boolean
  /** `true` when the last alerts request failed. */
  error?: boolean
}
```

Description text (it states the real API rule, see README):
`Months whose outcome exceeds the average of all earlier months in the selected range by more than {formatPercent(appliedThreshold * 100)}.`

### State in `App`

| State | Type | Initial |
|---|---|---|
| `thresholdInput` | `string` | `"0.3"` |
| `appliedThreshold` | `number` | `0.3` |
| `alerts` | `AlertsResponse` | `[]` |
| `alertsStatus` | `'loading' \| 'ready' \| 'error'` | `'loading'` |

Request: `GET /api/metrics/alerts` with
`AlertsParams = { threshold: appliedThreshold, group_by: 'month', ...appliedRange }`. Don't
send `business_type`. Refetch when `appliedThreshold` or `appliedRange` changes.

### `ThresholdInput`

File: `src/components/dashboard/threshold-input.tsx`.

```ts
interface ThresholdInputProps {
  /** Raw input text. */
  value: string
  onChange: (next: string) => void
  /** Validation message or `null`. */
  error: string | null
}
```

| Rule | Value |
|---|---|
| Element | `<input type="number" inputMode="decimal" min="0.01" max="1" step="0.01">` labelled "Spike threshold (ratio)" |
| Helper text | `0.30 = flag months 30% above baseline` (computed from the current valid value) |
| Valid | `Number(value)` is finite and `0.01 ≤ n ≤ 1.0`. This is a UI-only limit; the API accepts any value `≥ 0`. |
| Invalid | Empty, not a number, `< 0.01`, or `> 1.0`. Show `Enter a ratio between 0.01 and 1.00.` with `role="alert"`. Don't request; the table keeps the last valid results. |
| Apply | 300 ms after the last keystroke, if valid: `appliedThreshold = Number(value)` |

### `AnomalyAlertsTable`

File: `src/components/dashboard/anomaly-alerts-table.tsx`. A semantic `<table>`. The header row
is **always** rendered, including in loading, empty, and error states, so the table never
disappears.

```ts
interface AnomalyAlertsTableProps {
  rows: AlertEntry[]
  appliedThreshold: number
  appliedRange: DateRangeFilter
  monthsInRange: number
  loading?: boolean
  error?: boolean
}
```

| Column header | Field | Display |
|---|---|---|
| Period | `period` (`YYYY-MM`) | `formatMonthYearLabel(period)` → `Mar 2026` |
| Recorded outcome | `outcome_total` | `formatCurrency` |
| Baseline average | `baseline_average` | `formatCurrency`. Header tooltip/`title`: "Average outcome of all earlier months in the selected range". |
| Increase | `increase_ratio` | `+` + `formatPercent(increase_ratio * 100)` → `+36.3%`. Never divide by 100 and never recompute from other fields. |

Rows stay in API order (chronological). Don't re-sort or deduplicate them.

Conditional body (checked in this order; each one renders a single row spanning 4 columns):

| Condition | Body |
|---|---|
| `loading` | 3 skeleton rows |
| `error` | `Could not load spending anomalies. Try again later.` |
| `monthsInRange < 2` | `Not enough data: at least two months are needed to compare against a baseline.` (The API never flags the first month.) |
| `rows.length === 0` | **Empty state:** `No spending anomalies above {formatPercent(appliedThreshold * 100)} for {formatRangeLabel(appliedRange)}.` |
| otherwise | one row per `AlertEntry` |

---

## Feature 3: B2B vs B2C comparison view (new page)

### Navigation (no new dependency)

There is no router in `package.json`, so don't add one. `App` derives the view from
`window.location.hash` and listens to `hashchange`.

| Hash | View |
|---|---|
| `""`, `#/`, or anything unknown | Home dashboard (Features 1 and 2) |
| `#/b2b-vs-b2c` | `BusinessLineComparisonPage` |

### `DashboardNav`

File: `src/components/dashboard/dashboard-nav.tsx`. Rendered above `DashboardHeader` on both views.

```ts
type DashboardView = 'overview' | 'b2b-vs-b2c'
interface DashboardNavProps {
  current: DashboardView
}
```

Two links: `Overview` (`href="#/"`) and `B2B vs B2C` (`href="#/b2b-vs-b2c"`). The active link
gets `aria-current="page"`.

### `BusinessLineComparisonPage`

File: `src/components/comparison/business-line-comparison-page.tsx`. This is the container: it
owns its state and requests.

| State | Type | Initial | Notes |
|---|---|---|---|
| `dateRange` / `appliedRange` | `DateRangeFilter` | `{}` | Separate from the home dashboard; the two pages don't share a range. Same validation flow as Feature 1. |
| `facets` / `facetsStatus` | `FacetsResponse \| null` / status | `null` / `'loading'` | Fetched on mount |
| `b2b` / `b2c` | `TopCategoriesResponse` | `[]` | |
| `b2bStatus` / `b2cStatus` | `'loading' \| 'ready' \| 'error'` | `'loading'` | Tracked separately, because one line can fail on its own |

Requests: two parallel calls to `GET /api/metrics/categories/top`, one with
`TopCategoriesParams = { operation_type: 'income', limit: 5, business_type: 'B2B', ...appliedRange }`
and one with the same object but `business_type: 'B2C'`.

Layout, top to bottom:
1. Page title "B2B vs B2C revenue"
2. `DateRangeFilterBar` with `label="Comparison date range"`
3. `<div class="grid grid-cols-1 gap-4 md:grid-cols-2">` containing two `BusinessLineTopCategoriesPanel`s, B2B on the left and B2C on the right
4. `BusinessLineIncomeChart` at full width

### `BusinessLineTopCategoriesPanel`

File: `src/components/comparison/business-line-top-categories-panel.tsx`. A `Card` titled
`B2B: top income categories` (or `B2C: …`).

```ts
interface BusinessLineTopCategoriesPanelProps {
  businessType: BusinessType
  /** API response for this business line (≤ 5 entries, sorted by total_amount desc). */
  entries: TopCategoriesResponse
  /** `facets.categories`; `null` while facets is loading or failed. */
  categories: Category[] | null
  appliedRange: DateRangeFilter
  loading?: boolean
  error?: boolean
}
```

Derived values:
- `groupTotal = sum(entries[i].total_amount)`. Because `limit` 5 is at least the 5 categories in
  facets, this equals the business line's total income. Verified: B2B top-5 sum 615540.72 =
  `/api/metrics/b2b?operation_type=income` sum.
- `share = total_amount / groupTotal * 100`. Only computed when `groupTotal > 0`.
- `missingCategories = categories.filter(c => !entries.some(e => e.category === c))`, in facets
  order (alphabetical).

| Column header | Field | Display |
|---|---|---|
| Category | `category` | Capitalized API value: `sales` → `Sales` |
| Total income | `total_amount` | `formatCurrency` |
| % of group total | `share` (derived) | `formatPercent(share)` |

Conditional rendering. The header row is always rendered.

| Condition | Body | Footer |
|---|---|---|
| `loading` | 5 skeleton rows | none |
| `error` | `Could not load {businessType} income categories.` | none |
| `entries.length === 0` | **Empty top 5:** `No income recorded for {businessType} {formatRangeLabel(appliedRange)}.` No percentages are shown, which avoids dividing by zero. | `Total income: $0` |
| `1 ≤ entries.length < 5` | Only the returned rows. **Don't pad to 5** and don't show zero rows. Currently live: 2 rows (`sales`, `others`). | `Total income: {formatCurrency(groupTotal)}` |
| `entries.length === 5` | 5 rows | same |
| `categories` non-null and `missingCategories.length > 0` | (in addition to the above, unless loading or error) | Muted line: `No income: Administrative, Operational, Suppliers` |
| `categories === null` | | Omit the "No income" line |

### `BusinessLineIncomeChart`

File: `src/components/comparison/business-line-income-chart.tsx`. A `Card` titled "Total income by
business line" with a Recharts `BarChart` that has one bar per business line.

```ts
/** View model (not an API type): one bar. */
interface BusinessLineIncomeTotal {
  business_type: BusinessType
  /** Sum of that line's `CategoryEntry.total_amount`. */
  total_income: number
}
interface BusinessLineIncomeChartProps {
  /** Always two items, in order B2B, B2C. */
  data: [BusinessLineIncomeTotal, BusinessLineIncomeTotal]
  loading?: boolean
  /** Business lines whose request failed; empty array when none. */
  failed: BusinessType[]
}
```

| Condition | Renders |
|---|---|
| `loading` (either line still loading) | `Skeleton` `h-[280px]` |
| `failed.length > 0` | `Comparison unavailable: {failed.join(' and ')} data failed to load.` Partial data isn't charted, because it would mislead. |
| both `total_income === 0` | `No income to compare for {formatRangeLabel(appliedRange)}.` |
| one `total_income === 0` | Chart both bars; the zero bar renders at 0 |
| otherwise | X axis `B2B`, `B2C`; Y axis `formatCurrency`; tooltip shows `formatCurrency(total_income)` |

---

## Out of scope

Don't add a router, state library, or other new dependency. Don't change backend routes. Don't
change the existing KPI or monthly calculations. Don't persist filters in the URL or in storage.
