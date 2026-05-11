/**
 * 코드 그룹별 상태 코드 composable 팩토리.
 *
 * useCommonStatus / useSalesStatus 등 동일 패턴(전역 캐시 + 라벨/CSS/배지 헬퍼)을
 * 그룹 키별로 일괄 생성. 빈 캐시 저장 버그 (구 useSalesStatus) 도 함께 수정.
 *
 * 사용:
 *   export const useCommonStatus = createStatusComposable({
 *     groupCode: 'COMMON_STATUS',
 *     autoMount: true,
 *     fallbackCssClass: code => `status-${code.toLowerCase().replace(/_/g, '-')}`
 *   })
 */

import { computed, onMounted, ref } from 'vue'
import { codeService } from '~/services/code.service'
import type { StatusCode, StatusOption } from '~/types/common'

/** 그룹 키별 단일 모듈 스코프 캐시. */
const cache = new Map<string, StatusCode[]>()
const pending = new Map<string, Promise<StatusCode[]>>()

/**
 * 캐시 초기화. 인자가 있으면 해당 그룹만, 없으면 전체.
 * 테스트나 강제 리로드용.
 */
export function clearStatusCache(groupCode?: string): void {
  if (groupCode) {
    cache.delete(groupCode)
    pending.delete(groupCode)
  } else {
    cache.clear()
    pending.clear()
  }
}

export interface CreateStatusOptions {
  /** 코드 그룹 키 (예: 'COMMON_STATUS', 'SALES_STATUS') */
  groupCode: string
  /** onMounted 시 자동 로드 (기본 false) */
  autoMount?: boolean
  /** cssClass 누락 시 fallback 생성 */
  fallbackCssClass?: (code: string) => string
  /** badgeClass 누락 시 fallback */
  fallbackBadgeClass?: string
}

const DEFAULT_BADGE_CLASS = 'bg-gray-100 text-gray-800'

/**
 * 그룹 키별 상태 composable 빌더. 반환값은 `useXxxStatus()` 형태의 함수.
 * 동일 그룹의 캐시는 모든 호출처가 공유.
 */
export function createStatusComposable(options: CreateStatusOptions) {
  const { groupCode, autoMount = false, fallbackCssClass, fallbackBadgeClass = DEFAULT_BADGE_CLASS } = options

  return function useStatus() {
    const statusCodes = ref<StatusCode[]>(cache.get(groupCode) ?? [])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const statusOptions = computed<StatusOption[]>(() =>
      statusCodes.value.map((c) => ({ value: c.code, label: c.codeName }))
    )

    async function loadStatusCodes(): Promise<void> {
      const cached = cache.get(groupCode)
      if (cached) {
        statusCodes.value = cached
        return
      }

      const inflight = pending.get(groupCode)
      if (inflight) {
        statusCodes.value = await inflight
        return
      }

      loading.value = true
      error.value = null
      const promise = codeService.getCodeDetails(groupCode).then((response) => {
        const mapped: StatusCode[] = response.map((detail: any) => ({
          code: detail.code,
          codeName: detail.codeName,
          description: detail.description || '',
          cssClass: detail.cssClass || (fallbackCssClass ? fallbackCssClass(detail.code) : 'status-default'),
          badgeClass: detail.badgeClass || fallbackBadgeClass,
          sortOrder: detail.sortOrder || 0
        }))
        cache.set(groupCode, mapped)
        return mapped
      })
      pending.set(groupCode, promise)

      try {
        statusCodes.value = await promise
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Unknown error'
        // 실패 시 캐시에 저장하지 않음 — 다음 호출에서 재시도 가능
        throw e
      } finally {
        loading.value = false
        pending.delete(groupCode)
      }
    }

    function getStatusLabel(code: string): string {
      return statusCodes.value.find((s) => s.code === code)?.codeName || code
    }

    function getStatusClass(code: string): string {
      const found = statusCodes.value.find((s) => s.code === code)
      if (found?.cssClass) return found.cssClass
      return fallbackCssClass ? fallbackCssClass(code) : 'status-default'
    }

    function getStatusBadgeClass(code: string): string {
      return statusCodes.value.find((s) => s.code === code)?.badgeClass || fallbackBadgeClass
    }

    if (autoMount) {
      onMounted(() => {
        loadStatusCodes().catch(() => {
          // 자동 마운트 실패는 호출자가 별도로 처리하지 않음 (error ref 로 노출)
        })
      })
    }

    return {
      statusCodes,
      statusOptions,
      loading,
      /** useCommonStatus 호환 alias. */
      isLoading: loading,
      error,
      loadStatusCodes,
      getStatusLabel,
      getStatusClass,
      getStatusBadgeClass
    }
  }
}
