/**
 * 자금 관리 Store (Pinia)
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 자금 관리, 기성금 요청, 통계 상태 관리
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fundService } from '~/services/fund.service'
import type {
  Fund,
  FundDetail,
  FundListItem,
  FundSearchParams,
  FundCreateRequest,
  FundUpdateRequest,
  FundStatistics,
  FundStatisticsParams,
  ProgressPaymentRequest,
  PaymentCreateRequest,
  AdvancePayment
} from '~/types/fund'

export const useFundStore = defineStore('fund', () => {
  // ============ State ============

  /** 자금 목록 */
  const list = ref<FundListItem[]>([])

  /** 자금 상세 정보 */
  const detail = ref<FundDetail | null>(null)

  /** 자금 통계 */
  const statistics = ref<FundStatistics | null>(null)

  /** 기성금 이력 */
  const payments = ref<ProgressPaymentRequest[]>([])

  /** 선급금 이력 */
  const advances = ref<AdvancePayment[]>([])

  /** 로딩 상태 */
  const loading = ref(false)

  /** 에러 메시지 */
  const error = ref<string | null>(null)

  /** 페이지네이션 (0-indexed, useDataTable과 동일) */
  const pagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })

  // ============ Computed ============

  /** 목록이 비어있는지 여부 */
  const isEmpty = computed(() => list.value.length === 0)

  /** 현재 페이지 */
  const currentPage = computed(() => pagination.value.page)

  /** 전체 항목 수 */
  const totalElements = computed(() => pagination.value.total)

  /** 선급금 신청 여부 (1회성이므로 이력이 있으면 true) */
  const hasAdvancePayment = computed(() => advances.value.length > 0)

  // ============ Actions ============

  /**
   * 자금 목록 조회
   */
  async function fetchList(params: FundSearchParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.getFunds(params)

      list.value = response.content
      pagination.value = {
        page: response.number, // 0-indexed 유지 (useDataTable과 동일)
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '자금 목록 조회 실패'
      console.error('자금 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 자금 상세 조회
   */
  async function fetchDetail(fundId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.getFundById(fundId)
      detail.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '자금 상세 조회 실패'
      console.error('자금 상세 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 주문 ID로 자금 정보 조회
   */
  async function fetchByOrderId(orderId: number): Promise<Fund | null> {
    try {
      const response = await fundService.getFundByOrderId(orderId)
      return response
    } catch (err) {
      console.error('주문별 자금 조회 실패:', err)
      return null
    }
  }

  /**
   * 자금 통계 조회
   */
  async function fetchStatistics(params: FundStatisticsParams) {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.getStatistics(params)
      statistics.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '자금 통계 조회 실패'
      console.error('자금 통계 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 자금 생성
   */
  async function createFund(data: FundCreateRequest): Promise<Fund | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.createFund(data)
      // 목록 새로고침
      await fetchList()
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '자금 생성 실패'
      console.error('자금 생성 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 자금 수정
   */
  async function updateFund(fundId: number, data: FundUpdateRequest): Promise<Fund | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.updateFund(fundId, data)
      // 상세 정보 새로고침
      if (detail.value?.fundId === fundId) {
        await fetchDetail(fundId)
      }
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '자금 수정 실패'
      console.error('자금 수정 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 기성금 이력 조회
   */
  async function fetchPayments(fundId: number) {
    try {
      const response = await fundService.getPayments(fundId)
      payments.value = response.content
    } catch (err) {
      console.error('기성금 이력 조회 실패:', err)
      payments.value = []
    }
  }

  /**
   * 선급금 이력 조회
   */
  async function fetchAdvances(fundId: number) {
    try {
      const response = await fundService.getAdvances(fundId)
      advances.value = response
    } catch (err) {
      console.error('선급금 이력 조회 실패:', err)
      advances.value = []
    }
  }

  /**
   * 기성금 요청
   */
  async function requestPayment(fundId: number, data: PaymentCreateRequest): Promise<ProgressPaymentRequest | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.requestPayment(fundId, data)
      // 이력 새로고침
      await fetchPayments(fundId)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '기성금 요청 실패'
      console.error('기성금 요청 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 기성금 승인
   */
  async function approvePayment(fundId: number, paymentId: number): Promise<ProgressPaymentRequest | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fundService.approvePayment(fundId, paymentId)
      // 이력 새로고침
      await fetchPayments(fundId)
      // 상세 정보 새로고침
      if (detail.value?.fundId === fundId) {
        await fetchDetail(fundId)
      }
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '기성금 승인 실패'
      console.error('기성금 승인 실패:', err)
      throw err
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
    statistics.value = null
    payments.value = []
    advances.value = []
    loading.value = false
    error.value = null
    pagination.value = {
      page: 0,
      size: 20,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // State
    list,
    detail,
    statistics,
    payments,
    advances,
    loading,
    error,
    pagination,

    // Computed
    isEmpty,
    currentPage,
    totalElements,
    hasAdvancePayment,

    // Actions
    fetchList,
    fetchDetail,
    fetchByOrderId,
    fetchStatistics,
    createFund,
    updateFund,
    fetchPayments,
    fetchAdvances,
    requestPayment,
    approvePayment,
    reset
  }
})
