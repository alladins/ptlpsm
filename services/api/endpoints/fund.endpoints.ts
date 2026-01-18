/**
 * 자금 관리 API 엔드포인트
 *
 * CREATED DATE: 2025-12-09
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/funds
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Payments (기성금): GET/POST ${base}/{id}/payments
 * - Advances (선급금): GET/POST ${base}/{id}/advances
 * - Balance (잔금): GET ${base}/{id}/balance, POST ${base}/{id}/balance/request
 * - Statistics: GET ${base}/statistics
 */

import { getApiBaseUrl } from '../config'

export const FUND_ENDPOINTS = {
  /**
   * 자금 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds`
  },

  /**
   * 자금 상세 조회
   * @param fundId - 자금 ID
   * @returns GET /admin/funds/{fundId}
   */
  detail: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}`
  },

  /**
   * 자금 등록
   * @returns POST /admin/funds
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds`
  },

  /**
   * 자금 수정
   * @param fundId - 자금 ID
   * @returns PUT /admin/funds/{fundId}
   */
  update: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}`
  },

  /**
   * 기성금 이력 조회
   * @param fundId - 자금 ID
   * @returns GET /admin/funds/{fundId}/payments
   */
  payments: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/payments`
  },

  /**
   * 기성금 요청 생성
   * @param fundId - 자금 ID
   * @returns POST /admin/funds/{fundId}/payments
   */
  createPayment: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/payments`
  },

  /**
   * 기성금 승인
   * @param fundId - 자금 ID
   * @param paymentId - 기성금 요청 ID
   * @returns POST /admin/funds/{fundId}/payments/{paymentId}/approve
   */
  approvePayment: (fundId: number, paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/payments/${paymentId}/approve`
  },

  /**
   * 자금 통계 조회
   * @returns GET /admin/statistics/fund?params
   */
  statistics: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/statistics/fund`
  },

  /**
   * 주문 ID로 자금 정보 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/funds/by-order/{orderId}
   */
  byOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/by-order/${orderId}`
  },

  // ============ 선급금 (Advances) ============

  /**
   * 선급금 목록 조회
   * @param fundId - 자금 ID
   * @returns GET /admin/funds/{fundId}/advances
   */
  advances: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances`
  },

  /**
   * 선급금 신청
   * @param fundId - 자금 ID
   * @returns POST /admin/funds/{fundId}/advances
   */
  createAdvance: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances`
  },

  /**
   * 선급금 상세 조회
   * @param fundId - 자금 ID
   * @param advanceId - 선급금 ID
   * @returns GET /admin/funds/{fundId}/advances/{advanceId}
   */
  advanceDetail: (fundId: number, advanceId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances/${advanceId}`
  },

  /**
   * 선급금 승인
   * @param fundId - 자금 ID
   * @param advanceId - 선급금 ID
   * @returns POST /admin/funds/{fundId}/advances/{advanceId}/approve
   */
  approveAdvance: (fundId: number, advanceId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances/${advanceId}/approve`
  },

  /**
   * 선급금 수금 확인
   * @param fundId - 자금 ID
   * @param advanceId - 선급금 ID
   * @returns POST /admin/funds/{fundId}/advances/{advanceId}/confirm
   */
  confirmAdvance: (fundId: number, advanceId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances/${advanceId}/confirm`
  },

  /**
   * 선급금 문서 업로드
   * @param fundId - 자금 ID
   * @param advanceId - 선급금 ID
   * @returns POST /admin/funds/{fundId}/advances/{advanceId}/documents
   */
  uploadAdvanceDocument: (fundId: number, advanceId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/advances/${advanceId}/documents`
  },

  // ============ 잔금 (Balance) ============

  /**
   * 잔금 입금확인
   * - 잔금은 별도 신청/승인 프로세스 없음
   * - 납품완료 후 입금확인만 처리
   * @param fundId - 자금 ID
   * @returns POST /admin/funds/{fundId}/balance/confirm
   */
  confirmBalance: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/balance/confirm`
  },

  // ============ 기성금 추가 (Payments) ============

  /**
   * 기성금 수금 확인
   * @param fundId - 자금 ID
   * @param paymentId - 기성금 요청 ID
   * @returns POST /admin/funds/{fundId}/payments/{paymentId}/confirm
   */
  confirmPayment: (fundId: number, paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/payments/${paymentId}/confirm`
  },

  // ============ OEM 지급 (OEM Payments) ============

  /**
   * OEM 지급 목록 조회
   * @param fundId - 자금 ID
   * @returns GET /admin/funds/{fundId}/oem-payments
   */
  oemPayments: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/oem-payments`
  },

  /**
   * OEM 지급 등록
   * @param fundId - 자금 ID
   * @returns POST /admin/funds/{fundId}/oem-payments
   */
  createOemPayment: (fundId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/oem-payments`
  },

  /**
   * OEM 지급 상세 조회
   * @param fundId - 자금 ID
   * @param oemPaymentId - OEM 지급 ID
   * @returns GET /admin/funds/{fundId}/oem-payments/{oemPaymentId}
   */
  oemPaymentDetail: (fundId: number, oemPaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/oem-payments/${oemPaymentId}`
  },

  /**
   * OEM 지급 수정
   * @param fundId - 자금 ID
   * @param oemPaymentId - OEM 지급 ID
   * @returns PUT /admin/funds/{fundId}/oem-payments/{oemPaymentId}
   */
  updateOemPayment: (fundId: number, oemPaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/oem-payments/${oemPaymentId}`
  },

  /**
   * OEM 지급 완료 처리 (입금확인)
   * @param fundId - 자금 ID
   * @param oemPaymentId - OEM 지급 ID
   * @returns PUT /admin/funds/{fundId}/oem-payments/{oemPaymentId}/confirm
   */
  confirmOemPayment: (fundId: number, oemPaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/${fundId}/oem-payments/${oemPaymentId}/confirm`
  }
} as const
