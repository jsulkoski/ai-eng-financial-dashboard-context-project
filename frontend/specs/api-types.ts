/**
 * API response types for the three frontend features specified in this folder.
 *
 * Source of truth: the running backend's `GET /openapi.json` (`/docs`), schemas
 * `MetricsFacets`, `MetricsAlert`, `TopCategoryItem`, `FinancialMovement`, and
 * `HTTPValidationError`, cross-checked with live responses on 2026-11-15.
 * Every property listed here is `required` in OpenAPI; none is nullable.
 *
 * Enum unions mirror `frontend/src/lib/financial-types.ts` and
 * `backend/app/routes.py`. Keep all three aligned (see `.agents/rules/`).
 */

/**
 * Calendar date serialized as `YYYY-MM-DD` (OpenAPI `format: date`), e.g. `"2026-03-15"`.
 * Not a timestamp: never parse with `new Date(value)` and local getters, as that
 * shifts the day in negative-offset timezones. Compare as strings (lexicographic
 * order equals chronological order for this format).
 */
export type IsoDateString = string

/** Movement direction. OpenAPI enum: `"income" | "outcome"`. */
export type OperationType = 'income' | 'outcome'

/** Business line. OpenAPI enum: `"B2B" | "B2C"` (case-sensitive; `"b2b"` returns 422). */
export type BusinessType = 'B2B' | 'B2C'

/** Movement category. OpenAPI enum: `"suppliers" | "sales" | "operational" | "administrative" | "others"`. */
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'

/** Aggregation bucket for summary/alerts. OpenAPI enum: `"day" | "week" | "month"` (default `"month"`). */
export type GroupBy = 'day' | 'week' | 'month'

/**
 * One generated financial movement. Response item of `GET /api/metrics`
 * (Feature 1 refetches this list with the date range applied).
 */
export interface FinancialMovement {
  /** Movement date, `YYYY-MM-DD`. */
  create_date: IsoDateString
  /** Positive amount in USD; direction is given by `operation_type`. */
  amount: number
  /** `"income"` or `"outcome"`. */
  operation_type: OperationType
  /** One of the five {@link Category} values. */
  category: Category
  /** `"B2B"` or `"B2C"`. */
  business_type: BusinessType
}

/** `GET /api/metrics` response: movements in chronological order; `[]` when nothing matches. */
export type MetricsResponse = FinancialMovement[]

/**
 * `GET /api/metrics/facets` response (OpenAPI schema `MetricsFacets`).
 * Used by Feature 1 (date range reference) and Feature 3 (category list and date range).
 * Describes the whole generated dataset: the endpoint takes no query parameters,
 * so values never change with the user's filters.
 */
export interface FacetsResponse {
  /** Distinct operation types present, alphabetically sorted. Observed: `["income", "outcome"]`. */
  operation_types: OperationType[]
  /** Distinct business lines present, alphabetically sorted. Observed: `["B2B", "B2C"]`. */
  business_types: BusinessType[]
  /**
   * Distinct categories present, alphabetically sorted. Global list (no per-business-line split).
   * Observed: `["administrative", "operational", "others", "sales", "suppliers"]`.
   */
  categories: Category[]
  /** Earliest `create_date` in the dataset, `YYYY-MM-DD`. Shifts daily (data is generated from `date.today()`). */
  min_date: IsoDateString
  /** Latest `create_date` in the dataset, `YYYY-MM-DD`. Always ≥ `min_date`. */
  max_date: IsoDateString
}

/**
 * One anomaly row from `GET /api/metrics/alerts` (OpenAPI schema `MetricsAlert`). Feature 2.
 * A period is returned only when `increase_ratio > threshold` (strict).
 */
export interface AlertEntry {
  /**
   * Period key, format depends on `group_by`: `YYYY-MM` for `month` (used by Feature 2),
   * `YYYY-Www` ISO week for `week` (e.g. `2025-W46`), `YYYY-MM-DD` for `day`.
   */
  period: string
  /** Total outcome recorded in `period`, USD, rounded to 2 decimals. Always > `baseline_average`. */
  outcome_total: number
  /**
   * Mean outcome of **all** earlier non-empty periods inside the requested date range,
   * USD, rounded to 2 decimals. Not a rolling 3-period average (PM wording; see README).
   * Always > 0 (periods with a zero baseline are never returned).
   */
  baseline_average: number
  /**
   * `(outcome_total - baseline_average) / baseline_average` as a fraction rounded to 4 decimals
   * (e.g. `0.3632` = 36.32 %). Always > the requested `threshold`. Multiply by 100 to display.
   */
  increase_ratio: number
}

/** `GET /api/metrics/alerts` response: chronological by `period`; `[]` when no period exceeds the threshold. */
export type AlertsResponse = AlertEntry[]

/**
 * One row from `GET /api/metrics/categories/top` (OpenAPI schema `TopCategoryItem`). Feature 3.
 */
export interface CategoryEntry {
  /** Category name, one of {@link Category}. Display as-is (lowercase API value) or via a label map. */
  category: Category
  /** Echo of the requested `operation_type`; always `"income"` for Feature 3. */
  operation_type: OperationType
  /** Sum of `amount` for this category, operation type, business line, and date range; USD, 2 decimals, > 0. */
  total_amount: number
}

/**
 * `GET /api/metrics/categories/top` response: sorted by `total_amount` descending, at most `limit`
 * entries. Categories with no matching movements are omitted (not zero-filled), so the array can be
 * shorter than `limit` or empty (`[]`).
 */
export type TopCategoriesResponse = CategoryEntry[]

/** One FastAPI validation error item (OpenAPI schema `ValidationError`). */
export interface ValidationErrorItem {
  /** Path to the invalid input, e.g. `["query", "start_date"]`. */
  loc: Array<string | number>
  /** Human-readable message, e.g. `"Input should be greater than or equal to 0"`. */
  msg: string
  /** Machine-readable error code, e.g. `"date_from_datetime_parsing"`, `"literal_error"`. */
  type: string
  /** The rejected raw input; untyped in OpenAPI. */
  input?: unknown
  /** Extra context, e.g. `{ "ge": 1 }`; untyped object in OpenAPI. */
  ctx?: Record<string, unknown>
}

/** HTTP 422 body returned by every endpoint above when a query parameter is invalid. */
export interface ValidationErrorResponse {
  /** One entry per invalid parameter. */
  detail: ValidationErrorItem[]
}
