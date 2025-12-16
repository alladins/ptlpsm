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
 * - Payments: GET/POST ${base}/{id}/payments
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
   * @returns GET /admin/funds/statistics?params
   */
  statistics: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/statistics`
  },

  /**
   * 주문 ID로 자금 정보 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/funds/by-order/{orderId}
   */
  byOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/funds/by-order/${orderId}`
  }
} as const
