/**
 * Compile-time contract evidence: payloads captured verbatim from the running backend
 * (2026-11-15) are checked with `satisfies` against the spec types. If a field name or type
 * in `api-types.ts` drifts from the live API, `npx tsc --noEmit` in this folder fails.
 * Also asserts the spec enums/movement type stay identical to `src/lib/financial-types.ts`.
 * Not runtime code; nothing imports this file.
 */
import type {
  AlertsResponse,
  FacetsResponse,
  FinancialMovement,
  MetricsResponse,
  TopCategoriesResponse,
  ValidationErrorResponse,
} from './api-types'
import type { AlertsParams, DateRangeFilter, TopCategoriesParams } from './param-types'
import type { FinancialMovement as AppFinancialMovement } from '../src/lib/financial-types'

// GET /api/metrics/facets
export const facetsSample = {
  operation_types: ['income', 'outcome'],
  business_types: ['B2B', 'B2C'],
  categories: ['administrative', 'operational', 'others', 'sales', 'suppliers'],
  min_date: '2025-11-01',
  max_date: '2026-10-28',
} satisfies FacetsResponse

// GET /api/metrics?start_date=2025-11-01&end_date=2025-11-01
export const metricsSample = [
  { create_date: '2025-11-01', amount: 5465.56, operation_type: 'income', category: 'sales', business_type: 'B2C' },
] satisfies MetricsResponse

// GET /api/metrics/alerts?threshold=0.3&start_date=2026-01-01&end_date=2026-10-31
export const alertsSample = [
  { period: '2026-03', outcome_total: 88076.9, baseline_average: 38276.88, increase_ratio: 1.301 },
  { period: '2026-06', outcome_total: 80212.01, baseline_average: 51426.41, increase_ratio: 0.5597 },
  { period: '2026-08', outcome_total: 82189.37, baseline_average: 56834.8, increase_ratio: 0.4461 },
] satisfies AlertsResponse

// GET /api/metrics/alerts?threshold=5
export const alertsEmptySample = [] satisfies AlertsResponse

// GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B
export const topCategoriesB2BSample = [
  { category: 'sales', operation_type: 'income', total_amount: 557903.97 },
  { category: 'others', operation_type: 'income', total_amount: 57636.75 },
] satisfies TopCategoriesResponse

// GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C
export const topCategoriesB2CSample = [
  { category: 'sales', operation_type: 'income', total_amount: 574193.41 },
  { category: 'others', operation_type: 'income', total_amount: 68412.74 },
] satisfies TopCategoriesResponse

// GET /api/metrics/categories/top?limit=0  (HTTP 422)
export const validationErrorSample = {
  detail: [
    {
      type: 'greater_than_equal',
      loc: ['query', 'limit'],
      msg: 'Input should be greater than or equal to 1',
      input: '0',
      ctx: { ge: 1 },
    },
  ],
} satisfies ValidationErrorResponse

// Request params exactly as each feature sends them.
export const emptyRangeParams = {} satisfies DateRangeFilter
export const startOnlyParams = { start_date: '2026-09-01' } satisfies DateRangeFilter
export const alertsParamsSample = {
  threshold: 0.3,
  group_by: 'month',
  start_date: '2026-01-01',
  end_date: '2026-10-31',
} satisfies AlertsParams
export const topCategoriesParamsSample = {
  operation_type: 'income',
  limit: 5,
  business_type: 'B2B',
} satisfies TopCategoriesParams

// Drift guard: spec FinancialMovement must equal the app's FinancialMovement in both directions.
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
export const movementTypesAligned: Equal<FinancialMovement, AppFinancialMovement> = true
