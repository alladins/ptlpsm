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
  }
} as const
