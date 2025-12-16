/**
 * 기성/납품확인 차수 Store (Pinia)
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 기성 청구 및 납품완료 처리를 위한 차수 상태 관리
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { baselineService, getBaselineDisplayName } from '~/services/baseline.service'
import type {
  Baseline,
  BaselineListItem,
  BaselineCreateRequest,
  CurrentQuantitySnapshot,
  QuantityChangeRecord,
  DeliveryConfirmation
} from '~/types/baseline'

export const useBaselineStore = defineStore('baseline', () => {
  // ============ State ============

  /** 차수 목록 */
  const list = ref<BaselineListItem[]>([])

  /** 차수 상세 정보 */
  const detail = ref<Baseline | null>(null)

  /** 현재 수량 스냅샷 */
  const currentQuantities = ref<CurrentQuantitySnapshot | null>(null)

  /** 수량 변경 이력 */
  const quantityChanges = ref<QuantityChangeRecord[]>([])

  /** 납품확인서 정보 */
  const deliveryConfirmation = ref<DeliveryConfirmation | null>(null)

  /** 로딩 상태 */
  const loading = ref(false)

  /** 에러 메시지 */
  const error = ref<string | null>(null)

  // ============ Computed ============

  /** 차수 목록이 비어있는지 여부 */
  const isEmpty = computed(() => list.value.length === 0)

  /** 최근 차수 */
  const latestBaseline = computed(() => {
    if (list.value.length === 0) return null
    return list.value[list.value.length - 1]
  })

  /** 다음 차수 번호 */
  const nextBaselineSeq = computed(() => {
    if (list.value.length === 0) return 1
    const progressBaselines = list.value.filter(b => b.baselineType === 'PROGRESS')
    return progressBaselines.length + 1
  })

  /** 수량 변경이 있는지 여부 */
  const hasQuantityChanges = computed(() => quantityChanges.value.length > 0)

  // ============ Actions ============

  /**
   * 주문별 차수 목록 조회
   */
  async function fetchList(orderId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await baselineService.getBaselinesByOrderId(orderId)

      // 표시명 추가
      list.value = response.map(item => ({
        ...item,
        displayName: getBaselineDisplayName(item.baselineType, item.baselineSeq)
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : '차수 목록 조회 실패'
      console.error('차수 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 차수 상세 조회
   */
  async function fetchDetail(baselineId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await baselineService.getBaselineById(baselineId)
      detail.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '차수 상세 조회 실패'
      console.error('차수 상세 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 현재 수량 스냅샷 조회
   */
  async function fetchCurrentQuantities(orderId: number) {
    try {
      const response = await baselineService.getCurrentQuantities(orderId)
      currentQuantities.value = response
    } catch (err) {
      console.error('현재 수량 조회 실패:', err)
      currentQuantities.value = null
    }
  }

  /**
   * 수량 변경 이력 조회
   */
  async function fetchQuantityChanges(orderId: number, sinceDate?: string) {
    try {
      const response = await baselineService.getQuantityChanges(orderId, sinceDate)
      quantityChanges.value = response
    } catch (err) {
      console.error('수량 변경 이력 조회 실패:', err)
      quantityChanges.value = []
    }
  }

  /**
   * 기성/납품완료 차수 생성
   */
  async function createBaseline(orderId: number, data: BaselineCreateRequest): Promise<Baseline | null> {
    loading.value = true
    error.value = null

    try {
      const response = await baselineService.createBaseline(orderId, data)
      // 목록 새로고침
      await fetchList(orderId)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '차수 생성 실패'
      console.error('차수 생성 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 납품확인서 조회
   */
  async function fetchDeliveryConfirmation(baselineId: number) {
    try {
      const response = await baselineService.getDeliveryConfirmation(baselineId)
      deliveryConfirmation.value = response
    } catch (err) {
      console.error('납품확인서 조회 실패:', err)
      deliveryConfirmation.value = null
    }
  }

  /**
   * 기성 청구 모달용 데이터 로드
   * @description 기성 청구 모달에서 필요한 모든 데이터를 한번에 로드
   */
  async function loadProgressPaymentData(orderId: number) {
    loading.value = true
    error.value = null

    try {
      // 병렬로 데이터 조회
      const [baselines, quantities] = await Promise.all([
        baselineService.getBaselinesByOrderId(orderId),
        baselineService.getCurrentQuantities(orderId)
      ])

      // 차수 목록 설정
      list.value = baselines.map(item => ({
        ...item,
        displayName: getBaselineDisplayName(item.baselineType, item.baselineSeq)
      }))

      // 현재 수량 설정
      currentQuantities.value = quantities

      // 이전 차수가 있으면 변경 이력 조회
      const latestProgress = baselines
        .filter(b => b.baselineType === 'PROGRESS')
        .sort((a, b) => b.baselineSeq - a.baselineSeq)[0]

      if (latestProgress) {
        await fetchQuantityChanges(orderId, latestProgress.baselineDate)
      } else {
        quantityChanges.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '데이터 로드 실패'
      console.error('기성 청구 데이터 로드 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 상태 초기화
   */
  function reset() {
    list.value = []
    detail.value = null
    currentQuantities.value = null
    quantityChanges.value = []
    deliveryConfirmation.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    list,
    detail,
    currentQuantities,
    quantityChanges,
    deliveryConfirmation,
    loading,
    error,

    // Computed
    isEmpty,
    latestBaseline,
    nextBaselineSeq,
    hasQuantityChanges,

    // Actions
    fetchList,
    fetchDetail,
    fetchCurrentQuantities,
    fetchQuantityChanges,
    createBaseline,
    fetchDeliveryConfirmation,
    loadProgressPaymentData,
    reset
  }
})
