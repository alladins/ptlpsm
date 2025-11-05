/**
 * 공통 상태 코드 Composable (완전 DB 기반)
 *
 * 코드 관리 시스템의 COMMON_STATUS 그룹에서 상태 코드를 로드하여 사용
 * CSS 클래스와 배지 색상도 DB에서 관리
 *
 * 사용 예시:
 * const { statusOptions, getStatusLabel, getStatusClass, getStatusBadgeClass } = useCommonStatus()
 *
 * // 드롭다운 옵션으로 사용
 * <select v-model="status">
 *   <option v-for="option in statusOptions" :key="option.value" :value="option.value">
 *     {{ option.label }}
 *   </option>
 * </select>
 *
 * // 상태 라벨 표시
 * <span>{{ getStatusLabel('PENDING') }}</span>
 *
 * // 상태별 CSS 클래스
 * <span :class="getStatusClass('COMPLETED')">완료</span>
 *
 * // 배지 스타일
 * <span :class="getStatusBadgeClass('PENDING')">대기</span>
 */

import { ref, computed, onMounted } from 'vue'
import { codeService } from '~/services/code.service'
import type { StatusCode, StatusOption } from '~/types/common'

// 캐시 (전역)
let cachedStatusCodes: StatusCode[] | null = null
let cachePromise: Promise<StatusCode[]> | null = null

/**
 * 공통 상태 코드 로드 함수 (캐싱 적용)
 * DB 연결 필수 - fallback 없음
 */
async function loadCommonStatusCodes(): Promise<StatusCode[]> {
  // 이미 캐시된 데이터가 있으면 반환
  if (cachedStatusCodes) {
    return cachedStatusCodes
  }

  // 이미 로딩 중이면 같은 Promise 반환 (중복 요청 방지)
  if (cachePromise) {
    return cachePromise
  }

  // 새로운 로딩 시작
  cachePromise = (async () => {
    const response = await codeService.getCodeDetails('COMMON_STATUS')

    // 응답 데이터 매핑 (DB 필드 포함)
    cachedStatusCodes = response.map((detail: any) => ({
      code: detail.code,
      codeName: detail.codeName,
      description: detail.description || '',
      cssClass: detail.cssClass || `status-${detail.code.toLowerCase().replace(/_/g, '-')}`,
      badgeClass: detail.badgeClass || 'bg-gray-100 text-gray-800',
      sortOrder: detail.sortOrder || 0
    }))

    return cachedStatusCodes
  })()

  try {
    return await cachePromise
  } finally {
    cachePromise = null
  }
}

/**
 * 공통 상태 코드 Composable
 */
export function useCommonStatus() {
  const statusCodes = ref<StatusCode[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 드롭다운 옵션 (computed)
  const statusOptions = computed<StatusOption[]>(() => {
    return statusCodes.value.map(code => ({
      value: code.code,
      label: code.codeName
    }))
  })

  /**
   * 상태 코드로 라벨(한글명) 조회
   */
  const getStatusLabel = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found ? found.codeName : statusCode
  }

  /**
   * 상태 코드로 CSS 클래스 반환 (DB 기반)
   */
  const getStatusClass = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found?.cssClass || `status-${statusCode.toLowerCase().replace(/_/g, '-')}`
  }

  /**
   * 상태 코드로 배지 색상 반환 (DB 기반)
   */
  const getStatusBadgeClass = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found?.badgeClass || 'bg-gray-100 text-gray-800'
  }

  /**
   * 상태 코드 로드
   */
  const loadStatusCodes = async () => {
    isLoading.value = true
    error.value = null

    try {
      statusCodes.value = await loadCommonStatusCodes()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      console.error('Error loading status codes:', e)
      // DB 연결 실패 시 에러를 throw하여 호출자에게 알림
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // 컴포넌트 마운트 시 자동 로드
  onMounted(() => {
    loadStatusCodes()
  })

  return {
    // 상태
    statusCodes,
    statusOptions,
    isLoading,
    error,

    // 메서드
    getStatusLabel,
    getStatusClass,
    getStatusBadgeClass,
    loadStatusCodes
  }
}

/**
 * 공통 상태 코드 캐시 초기화 (테스트나 강제 리로드용)
 */
export function clearCommonStatusCache() {
  cachedStatusCodes = null
  cachePromise = null
}
