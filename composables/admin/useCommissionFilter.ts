/**
 * 커미션 페이지 공통 필터 Composable
 *
 * 목적:
 * - 커미션 관련 페이지(payments, settlements, dashboard)의 공통 로직 추출
 * - 연도 선택, 로딩 상태, 데이터 로드 래퍼 관리
 *
 * 사용 예시:
 * ```typescript
 * const { selectedYear, loading, availableYears, minYear, maxYear, changeYear, loadData } =
 *   useCommissionFilter({
 *     loadFunction: async () => {
 *       await commissionStore.fetchPayments(selectedYear.value, { page: 0, size: 20 })
 *     }
 *   })
 * ```
 */

import { ref, computed } from 'vue'

export interface UseCommissionFilterOptions {
  /** 데이터 로드 함수 (loading 토글은 composable이 처리) */
  loadFunction: () => Promise<void>
  /** 연도 범위 시작 (기본: 현재연도 - 4) */
  yearRangeStart?: number
  /** 연도 범위 끝 (기본: 현재연도 + 1) */
  yearRangeEnd?: number
}

export function useCommissionFilter(options: UseCommissionFilterOptions) {
  const currentYear = new Date().getFullYear()

  // 상태
  const selectedYear = ref(currentYear)
  const loading = ref(true)

  // 연도 범위
  const minYear = options.yearRangeStart ?? (currentYear - 4)
  const maxYear = options.yearRangeEnd ?? (currentYear + 1)

  // select 드롭다운용 연도 목록 (내림차순)
  const availableYears = computed(() => {
    const count = maxYear - minYear + 1
    return Array.from({ length: count }, (_, i) => maxYear - i)
  })

  /**
   * 연도 변경 (chevron 버튼용)
   * @param delta - 변경 값 (-1: 이전, +1: 다음)
   */
  const changeYear = (delta: number) => {
    const newYear = selectedYear.value + delta
    if (newYear >= minYear && newYear <= maxYear) {
      selectedYear.value = newYear
      loadData()
    }
  }

  /**
   * 데이터 로드 래퍼 (loading 토글 + 에러 핸들링)
   */
  const loadData = async () => {
    loading.value = true
    try {
      await options.loadFunction()
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    selectedYear,
    loading,
    availableYears,
    minYear,
    maxYear,
    changeYear,
    loadData
  }
}
