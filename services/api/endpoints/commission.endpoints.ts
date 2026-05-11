/**
 * 커미션 관리 API 엔드포인트
 *
 * CREATED DATE: 2026-01-08
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Rates: GET/POST ${baseUrl}/admin/commission/rates/{year}
 * - Settlements: GET ${baseUrl}/admin/commission/settlements/fund/{fundId}
 * - Annual: GET ${baseUrl}/admin/commission/annual/{year}
 * - Payments: GET/POST ${baseUrl}/admin/commission/payments/{year}
 */

import { getApiBaseUrl } from '../config'

export const COMMISSION_ENDPOINTS = {
  // ============ 커미션율 설정 (Rates) ============

  /**
   * 연도별 커미션율 설정 조회
   * @param year - 연도
   * @returns GET /admin/commission/rates/{year}
   */
  rates: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/rates/${year}`
  },

  /**
   * 연도별 커미션율 설정 저장
   * @param year - 연도
   * @returns POST /admin/commission/rates/{year}
   */
  saveRates: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/rates/${year}`
  },

  // ============ 커미션 정산 (Settlements) ============

  /**
   * 커미션 정산 목록 조회
   * @returns GET /admin/commission/settlements?params
   */
  settlements: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements`
  },

  /**
   * 연도별 커미션 정산 목록 조회
   * @param year - 연도
   * @returns GET /admin/commission/settlements/year/{year}
   */
  settlementsByYear: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/year/${year}`
  },

  /**
   * 자금별 커미션 정산 상세 조회
   * @param fundId - 자금 ID
   * @returns GET /admin/commission/settlements/fund/{fundId}
   */
  settlementByFund: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/fund/${fundId}`
  },

  /**
   * 커미션 정산 상세 조회
   * @param settlementId - 정산 ID
   * @returns GET /admin/commission/settlements/{settlementId}
   */
  settlementDetail: (settlementId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/${settlementId}`
  },

  /**
   * 커미션 정산 확정
   * @param settlementId - 정산 ID
   * @returns POST /admin/commission/settlements/{settlementId}/confirm
   */
  confirmSettlement: (settlementId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/${settlementId}/confirm`
  },

  /**
   * 커미션 일괄 정산 확정
   * @returns POST /admin/commission/settlements/confirm-batch
   */
  confirmSettlementBatch: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/confirm-batch`
  },

  // ============ 연간 커미션 요약 (Annual) ============

  /**
   * 연간 커미션 요약 조회
   * @param year - 연도
   * @returns GET /admin/commission/annual/{year}
   */
  annual: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/annual/${year}`
  },

  /**
   * 커미션 대시보드 통계
   * @param year - 연도
   * @returns GET /admin/commission/dashboard/{year}
   */
  dashboard: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/dashboard/${year}`
  },

  // ============ 커미션 지급 (Payments) ============

  /**
   * 연도별 커미션 지급 이력 조회
   * @param year - 연도
   * @returns GET /admin/commission/payments/{year}
   */
  payments: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${year}`
  },

  /**
   * 커미션 지급 등록
   * @param year - 연도
   * @returns POST /admin/commission/payments/{year}
   */
  createPayment: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${year}`
  },

  /**
   * 커미션 지급 상세 조회
   * @param paymentId - 지급 ID
   * @returns GET /admin/commission/payments/detail/{paymentId}
   */
  paymentDetail: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/detail/${paymentId}`
  },

  /**
   * 커미션 지급 완료 처리
   * @param paymentId - 지급 ID
   * @returns POST /admin/commission/payments/{paymentId}/complete
   */
  completePayment: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${paymentId}/complete`
  },

  /**
   * 커미션 지급 취소
   * @param paymentId - 지급 ID
   * @returns POST /admin/commission/payments/{paymentId}/cancel
   */
  cancelPayment: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${paymentId}/cancel`
  },

  // ============ 통합 지급 (Unified Payments) ============

  /** 통합 지급 목록 조회 (가지급금+일반 함께) */
  paymentAll: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${year}/all`
  },

  /** 지급 수정 */
  updatePayment: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${paymentId}`
  },

  /** 지급 삭제 */
  deletePayment: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${paymentId}`
  },

  /** 지급이력 엑셀 내보내기 */
  exportPayments: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${year}/all/export`
  },

  // ============ 정산이력 확장 ============

  /** 정산이력 비고 수정 */
  updateSettlementRemarks: (settlementId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/${settlementId}/remarks`
  },

  /** 월별 커미션 집계 조회 */
  monthlySummary: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/year/${year}/monthly-summary`
  },

  /** 월별 커미션 집계 엑셀 내보내기 */
  exportMonthlySummary: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/year/${year}/monthly-summary/export`
  },

  /** 정산이력 일괄 재계산 */
  recalculateSettlements: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/year/${year}/recalculate`
  },

  /** 정산이력 엑셀 내보내기 */
  exportSettlements: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/settlements/year/${year}/export`
  },

  // ============ 중간정산 (Periodic Settlement) ============

  /**
   * 중간정산 생성
   * @returns POST /admin/commission/periodic-settlements
   */
  createPeriodicSettlement: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/periodic-settlements`
  },

  /**
   * 정산 이력 목록 조회
   * @returns GET /admin/commission/periodic-settlements?params
   */
  periodicSettlements: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/periodic-settlements`
  },

  /**
   * 정산 상세 조회
   * @param settlementId - 정산 ID
   * @returns GET /admin/commission/periodic-settlements/{settlementId}
   */
  periodicSettlementDetail: (settlementId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/periodic-settlements/${settlementId}`
  },

  // ============ 정산기간 (Periods) ============

  /** 정산기간 목록 조회 */
  periods: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/periods`
  },

  /** 활성 정산기간 조회 */
  activePeriod: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/periods/active`
  },

  // ============ 월별 스냅샷 (Monthly Snapshots) ============

  /** 정산기간별 월별 스냅샷 목록 */
  monthlySnapshots: (periodId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/monthly-snapshots/${periodId}`
  },

  /** 월별 스냅샷 생성 */
  generateMonthlySnapshot: (year: number, month: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/monthly-snapshots/${year}/${month}/generate`
  },

  /** 월별 스냅샷 확정 */
  confirmMonthlySnapshot: (year: number, month: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/monthly-snapshots/${year}/${month}/confirm`
  },

  /** 월별 영업담당자별 정산 상세 */
  monthlySnapshotDetails: (year: number, month: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/monthly-snapshots/${year}/${month}/details`
  },

  // ============ 가지급금 (Advance Payments) ============

  /**
   * 연도별 가지급금 목록 조회
   * @param year - 연도
   * @returns GET /admin/commission/payments/{year}/advance
   */
  advancePayments: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/${year}/advance`
  },

  /**
   * 가지급금 등록
   * @returns POST /admin/commission/payments/advance
   */
  createAdvancePayment: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/payments/advance`
  },

  // ============ 연말정산 (Annual Final Settlement) ============

  /**
   * 연말정산 시뮬레이션
   * @param year - 연도
   * @returns GET /admin/commission/annual/{year}/simulate
   */
  simulateFinalSettlement: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/annual/${year}/simulate`
  },

  /**
   * 연말정산 확정
   * @param year - 연도
   * @returns POST /admin/commission/annual/{year}/finalize
   */
  finalizeFinalSettlement: (year: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/commission/annual/${year}/finalize`
  }
} as const
