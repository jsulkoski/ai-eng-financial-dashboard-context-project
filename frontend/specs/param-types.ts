/**
 * Query parameter types for the three frontend features.
 *
 * Source of truth: `GET /openapi.json` (`/docs`) parameter lists, verified with live calls on 2026-11-15.
 * Serialization rule for every type below: omit a property that is `undefined` or empty.
 * Never send `start_date=` (empty), because the API answers 422 `date_from_datetime_parsing`.
 */
import type { BusinessType, Category, GroupBy, IsoDateString, OperationType } from './api-types'

/**
 * Optional inclusive date range shared by all three features.
 * Both fields are optional and independent:
 * - neither set: no date filtering (all available data);
 * - only `start_date`: from that date through the latest data;
 * - only `end_date`: from the earliest data through that date;
 * - both set: inclusive on both ends; the UI must ensure `start_date <= end_date`
 *   (the API does not reject inverted ranges; it silently returns empty results).
 */
export interface DateRangeFilter {
  /**
   * Inclusive lower bound, `YYYY-MM-DD` (e.g. `"2026-01-01"`). Must be a real calendar date;
   * `2026/01/01` or `2026-02-30` return 422. May fall outside the facets range (yields fewer/no results).
   */
  start_date?: IsoDateString
  /**
   * Inclusive upper bound, `YYYY-MM-DD` (e.g. `"2026-03-31"`). Same format rules as `start_date`;
   * when both are set it must be ≥ `start_date`.
   */
  end_date?: IsoDateString
}

/**
 * `GET /api/metrics` query (Feature 1). The dashboard sends only the date range;
 * `category` and `operation_type` exist in OpenAPI but are not used by these specs.
 */
export interface MetricsParams extends DateRangeFilter {
  /** Optional category filter; one of {@link Category}. Not sent by Feature 1. */
  category?: Category
  /** Optional direction filter: `"income"` or `"outcome"`. Not sent by Feature 1 (KPIs need both). */
  operation_type?: OperationType
}

/** `GET /api/metrics/alerts` query (Feature 2). */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Spike ratio: a period alerts when `(outcome - baseline) / baseline > threshold`.
   * API: `number`, `minimum: 0`, default `0.3`, no maximum.
   * UI contract (stricter): always sent; a decimal between `0.01` and `1.0` inclusive, default `0.3`.
   */
  threshold: number
  /**
   * Aggregation bucket: `"day" | "week" | "month"`; API default `"month"`.
   * Feature 2 always sends `"month"` to match the dashboard's monthly charts.
   */
  group_by?: GroupBy
  /** Optional business line: `"B2B"` or `"B2C"`. Not sent by Feature 2 (the home dashboard covers both). */
  business_type?: BusinessType
}

/** `GET /api/metrics/categories/top` query (Feature 3, one request per business line). */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * `"income"` or `"outcome"`. Feature 3 always sends `"income"`.
   * Required here because the API default is `"outcome"`, the wrong value for Feature 3.
   */
  operation_type: OperationType
  /** Maximum entries returned: integer from `1` to `20` inclusive (API default `5`). Feature 3 sends `5`. */
  limit: number
  /**
   * Business line, `"B2B"` or `"B2C"` (case-sensitive). Optional in the API (omitted = both lines);
   * Feature 3 always sends it, one request per line.
   */
  business_type?: BusinessType
}
