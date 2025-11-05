/**
 * 영업 상태 코드 Composable (완전 DB 기반)
 *
 * 코드 관리 시스템의 SALES_STATUS 그룹에서 한글 상태 코드를 로드하여 사용
 * CSS 클래스와 배지 색상도 DB에서 관리
 *
 * 영업 모듈 전용 상태: 진행중, 완료, 취소, 보류 (한글)
 *
 * 사용 예시:
 * const { statusOptions, getStatusLabel, getStatusClass } = useSalesStatus()
 * await loadStatusCodes()
 *
 * // 드롭다운 옵션으로 사용
 * <select v-model="status">
 *   <option v-for="option in statusOptions" :key="option.value" :value="option.value">
 *     {{ option.label }}
 *   </option>
 * </select>
 *
 * // 상태 라벨 표시
 * <span>{{ getStatusLabel('진행중') }}</span>
 *
 * // 상태별 CSS 클래스
 * <span :class="getStatusClass('완료')">완료</span>
 */

import { ref, computed } from 'vue'
import { codeService } from '~/services/code.service'
import type { StatusCode, StatusOption } from '~/types/common'

// 캐시 (전역)
let cachedStatusCodes: StatusCode[] | null = null
let cachePromise: Promise<StatusCode[]> | null = null

/**
 * 영업 상태 코드 Composable
 */
export function useSalesStatus() {
  // 반응형 상태
  const statusCodes = ref<StatusCode[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * DB에서 SALES_STATUS 코드 로드 및 캐싱
   */
  const loadStatusCodes = async (): Promise<void> => {
    // 캐시가 있으면 반환
    if (cachedStatusCodes) {
      statusCodes.value = cachedStatusCodes
      return
    }

    // 로딩 중이면 대기
    if (cachePromise) {
      statusCodes.value = await cachePromise
      return
    }

    try {
      loading.value = true
      error.value = null

      // DB에서 로드 (Promise 저장)
      cachePromise = codeService.getCodeDetails('SALES_STATUS').then(response => {
        console.log('🔍 [useSalesStatus] 백엔드 응답:', response)
        const mapped = response.map((detail: any) => ({
          code: detail.code,
          codeName: detail.codeName,
          description: detail.description || '',
          cssClass: detail.cssClass || 'status-default',
          badgeClass: detail.badgeClass || 'bg-gray-100 text-gray-800',
          sortOrder: detail.sortOrder || 0
        }))
        console.log('🔍 [useSalesStatus] 매핑된 데이터:', mapped)
        return mapped
      })

      // 결과 저장
      cachedStatusCodes = await cachePromise
      statusCodes.value = cachedStatusCodes
      console.log('✅ [useSalesStatus] 캐시 저장 완료:', cachedStatusCodes)
    } catch (err) {
      console.error('Failed to load sales status codes:', err)
      error.value = 'Failed to load status codes'
      cachedStatusCodes = []
      statusCodes.value = []
    } finally {
      loading.value = false
      cachePromise = null
    }
  }

  /**
   * 드롭다운 옵션 (computed)
   */
  const statusOptions = computed<StatusOption[]>(() => {
    const options = statusCodes.value.map(status => ({
      value: status.code,
      label: status.codeName
    }))
    console.log('🔍 [useSalesStatus] statusOptions computed:', options)
    return options
  })

  /**
   * 상태 코드로 라벨 조회
   */
  const getStatusLabel = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found?.codeName || statusCode
  }

  /**
   * 상태 코드로 CSS 클래스 조회
   */
  const getStatusClass = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found?.cssClass || 'status-default'
  }

  /**
   * 상태 코드로 배지 클래스 조회
   */
  const getStatusBadgeClass = (statusCode: string): string => {
    const found = statusCodes.value.find(s => s.code === statusCode)
    return found?.badgeClass || 'bg-gray-100 text-gray-800'
  }

  return {
    // 상태
    statusCodes,
    loading,
    error,

    // 옵션
    statusOptions,

    // 메서드
    loadStatusCodes,
    getStatusLabel,
    getStatusClass,
    getStatusBadgeClass
  }
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearSalesStatusCache() {
  cachedStatusCodes = null
  cachePromise = null
}
