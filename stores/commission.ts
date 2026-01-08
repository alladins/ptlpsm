/**
 * 커미션 관리 Store (Pinia)
 *
 * CREATED DATE: 2026-01-08
 *
 * @description 커미션율 설정, 정산, 지급 상태 관리
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as commissionService from '~/services/commission.service'
import type {
  CommissionRateConfig,
  CommissionRateUpdateRequest,
  CommissionSettlement,
  CommissionSettlementSearchParams,
  AnnualCommissionSummary,
  CommissionDashboardStats,
  CommissionPayment,
  CommissionPaymentSearchParams,
  CommissionPaymentCreateRequest,
  CommissionPaymentCompleteRequest,
  FundCommissionDetail
} from '~/types/commission'

export const useCommissionStore = defineStore('commission', () => {
  // ============ State ============

  /** 연도별 커미션율 설정 */
  const rateConfig = ref<CommissionRateConfig | null>(null)

  /** 정산 목록 */
  const settlements = ref<CommissionSettlement[]>([])

  /** 연간 커미션 요약 */
  const annualSummary = ref<AnnualCommissionSummary | null>(null)

  /** 대시보드 통계 */
  const dashboardStats = ref<CommissionDashboardStats | null>(null)

  /** 지급 목록 */
  const payments = ref<CommissionPayment[]>([])

  /** 현재 조회 연도 */
  const selectedYear = ref(new Date().getFullYear())

  /** 로딩 상태 */
  const loading = ref(false)

  /** 에러 메시지 */
  const error = ref<string | null>(null)

  /** 정산 페이지네이션 */
  const settlementPagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })

  /** 지급 페이지네이션 */
  const paymentPagination = ref({
    page: 0,
    size: 20,
    total: 0,
    totalPages: 0
  })

  // ============ Computed ============

  /** 정산 목록이 비어있는지 */
  const isSettlementsEmpty = computed(() => settlements.value.length === 0)

  /** 지급 목록이 비어있는지 */
  const isPaymentsEmpty = computed(() => payments.value.length === 0)

  /** 현재 적용 중인 커미션 구간 목록 */
  const currentTiers = computed(() => rateConfig.value?.tiers || [])

  /** 연간 총 커미션 금액 */
  const totalCommissionAmount = computed(() => annualSummary.value?.totalCommissionAmount || 0)

  /** 연간 지급 완료 금액 */
  const totalPaidAmount = computed(() => annualSummary.value?.totalPaidAmount || 0)

  /** 연간 미지급 금액 */
  const totalUnpaidAmount = computed(() => annualSummary.value?.totalUnpaidAmount || 0)

  /** 월별 데이터 */
  const monthlyData = computed(() => annualSummary.value?.monthlyData || [])

  /** 분기별 데이터 */
  const quarterlyData = computed(() => annualSummary.value?.quarterlyData || [])

  // ============ Actions ============

  /**
   * 연도 설정
   */
  function setYear(year: number) {
    selectedYear.value = year
  }

  /**
   * 연도별 커미션율 설정 조회
   */
  async function fetchRateConfig(year?: number) {
    const targetYear = year || selectedYear.value
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.getCommissionRates(targetYear)
      rateConfig.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '커미션율 조회 실패'
      console.error('커미션율 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 연도별 커미션율 설정 저장
   */
  async function saveRateConfig(year: number, request: CommissionRateUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await commissionService.saveCommissionRates(year, request)
      if (success) {
        // 설정 새로고침
        await fetchRateConfig(year)
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '커미션율 저장 실패'
      console.error('커미션율 저장 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 정산 목록 조회
   */
  async function fetchSettlements(params: CommissionSettlementSearchParams = {}) {
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.getCommissionSettlements({
        year: params.year || selectedYear.value,
        ...params
      })

      settlements.value = response.content
      settlementPagination.value = {
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '정산 목록 조회 실패'
      console.error('정산 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 자금별 커미션 정산 상세 조회
   */
  async function fetchSettlementByFund(fundId: number): Promise<FundCommissionDetail | null> {
    try {
      return await commissionService.getCommissionSettlementByFund(fundId)
    } catch (err) {
      console.error('자금별 정산 조회 실패:', err)
      return null
    }
  }

  /**
   * 커미션 정산 확정
   */
  async function confirmSettlement(settlementId: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await commissionService.confirmCommissionSettlement(settlementId)
      if (success) {
        // 목록 새로고침
        await fetchSettlements()
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '정산 확정 실패'
      console.error('정산 확정 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 일괄 정산 확정
   */
  async function confirmSettlementBatch(settlementIds: number[]): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await commissionService.confirmCommissionSettlementBatch(settlementIds)
      if (success) {
        // 목록 새로고침
        await fetchSettlements()
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '일괄 정산 확정 실패'
      console.error('일괄 정산 확정 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 연간 커미션 요약 조회
   */
  async function fetchAnnualSummary(year?: number) {
    const targetYear = year || selectedYear.value
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.getAnnualCommissionSummary(targetYear)
      annualSummary.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '연간 요약 조회 실패'
      console.error('연간 요약 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 대시보드 통계 조회
   */
  async function fetchDashboardStats(year?: number) {
    const targetYear = year || selectedYear.value
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.getCommissionDashboardStats(targetYear)
      dashboardStats.value = response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '대시보드 통계 조회 실패'
      console.error('대시보드 통계 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 지급 목록 조회
   */
  async function fetchPayments(year?: number, params: CommissionPaymentSearchParams = {}) {
    const targetYear = year || selectedYear.value
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.getCommissionPayments(targetYear, params)

      payments.value = response.content
      paymentPagination.value = {
        page: response.number,
        size: response.size,
        total: response.totalElements,
        totalPages: response.totalPages
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '지급 목록 조회 실패'
      console.error('지급 목록 조회 실패:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 지급 등록
   */
  async function createPayment(
    year: number,
    request: CommissionPaymentCreateRequest
  ): Promise<CommissionPayment | null> {
    loading.value = true
    error.value = null

    try {
      const response = await commissionService.createCommissionPayment(year, request)
      // 목록 새로고침
      await fetchPayments(year)
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : '지급 등록 실패'
      console.error('지급 등록 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 지급 완료 처리
   */
  async function completePayment(
    paymentId: number,
    request: CommissionPaymentCompleteRequest
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await commissionService.completeCommissionPayment(paymentId, request)
      if (success) {
        // 목록 새로고침
        await fetchPayments()
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '지급 완료 처리 실패'
      console.error('지급 완료 처리 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 커미션 지급 취소
   */
  async function cancelPayment(paymentId: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const success = await commissionService.cancelCommissionPayment(paymentId)
      if (success) {
        // 목록 새로고침
        await fetchPayments()
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '지급 취소 실패'
      console.error('지급 취소 실패:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 상태 초기화
   */
  function reset() {
    rateConfig.value = null
    settlements.value = []
    annualSummary.value = null
    dashboardStats.value = null
    payments.value = []
    selectedYear.value = new Date().getFullYear()
    loading.value = false
    error.value = null
    settlementPagination.value = {
      page: 0,
      size: 20,
      total: 0,
      totalPages: 0
    }
    paymentPagination.value = {
      page: 0,
      size: 20,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // State
    rateConfig,
    settlements,
    annualSummary,
    dashboardStats,
    payments,
    selectedYear,
    loading,
    error,
    settlementPagination,
    paymentPagination,

    // Computed
    isSettlementsEmpty,
    isPaymentsEmpty,
    currentTiers,
    totalCommissionAmount,
    totalPaidAmount,
    totalUnpaidAmount,
    monthlyData,
    quarterlyData,

    // Actions
    setYear,
    fetchRateConfig,
    saveRateConfig,
    fetchSettlements,
    fetchSettlementByFund,
    confirmSettlement,
    confirmSettlementBatch,
    fetchAnnualSummary,
    fetchDashboardStats,
    fetchPayments,
    createPayment,
    completePayment,
    cancelPayment,
    reset
  }
})
