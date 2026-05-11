/**
 * 공통 상태 코드 composable (COMMON_STATUS 그룹).
 *
 * createStatusComposable 팩토리로 생성 — 캐시·로더·라벨/CSS/배지 헬퍼는 팩토리 공통.
 * onMounted 자동 로드 + cssClass kebab-case fallback 사용.
 */

import { clearStatusCache, createStatusComposable } from './createStatusComposable'

export const useCommonStatus = createStatusComposable({
  groupCode: 'COMMON_STATUS',
  autoMount: true,
  fallbackCssClass: (code) => `status-${code.toLowerCase().replace(/_/g, '-')}`
})

/** COMMON_STATUS 캐시만 초기화 (호환). */
export function clearCommonStatusCache(): void {
  clearStatusCache('COMMON_STATUS')
}
