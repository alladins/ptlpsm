/**
 * 영업 상태 코드 composable (SALES_STATUS 그룹).
 *
 * createStatusComposable 팩토리로 공통 부분(캐시/로더/라벨/CSS/배지) 처리하고,
 * 영업 도메인 특화 진척도 메서드(progressOptions, getProgressIndex 등)를 확장.
 *
 * 상태 단계: 초기접촉 → 니즈파악 → 견적제출 → 계약협상 → 계약완료 → 납품완료 + 보류/실패
 */

import { computed } from 'vue'
import type { StatusOption } from '~/types/common'
import { SALES_PROGRESS_STEPS, SALES_SPECIAL_STATUSES } from '~/types/sales'
import { clearStatusCache, createStatusComposable } from './createStatusComposable'

const useStatusBase = createStatusComposable({
  groupCode: 'SALES_STATUS',
  autoMount: false
})

const SALES_PROGRESS_COLOR_MAP: Record<string, string> = {
  '초기접촉': '#6b7280',
  '니즈파악': '#3b82f6',
  '견적제출': '#6366f1',
  '계약협상': '#eab308',
  '계약완료': '#22c55e',
  '납품완료': '#10b981',
  '보류': '#f59e0b',
  '실패': '#ef4444'
}

export function useSalesStatus() {
  const base = useStatusBase()

  const progressOptions = computed<StatusOption[]>(() =>
    SALES_PROGRESS_STEPS.map((step) => ({ value: step.value, label: step.label }))
  )

  const getProgressIndex = (statusCode: string): number =>
    SALES_PROGRESS_STEPS.findIndex((s) => s.value === statusCode)

  const isSpecialStatus = (statusCode: string): boolean =>
    SALES_SPECIAL_STATUSES.includes(statusCode as any)

  const getProgressColor = (statusCode: string): string =>
    SALES_PROGRESS_COLOR_MAP[statusCode] || '#6b7280'

  return {
    ...base,
    progressOptions,
    getProgressIndex,
    isSpecialStatus,
    getProgressColor
  }
}

/** SALES_STATUS 캐시만 초기화 (호환). */
export function clearSalesStatusCache(): void {
  clearStatusCache('SALES_STATUS')
}