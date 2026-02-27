/**
 * OEM 지급 관리 API 엔드포인트
 *
 * @created 2026-02-09
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/payments
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - ByPo: GET ${base}/by-po/{poId}
 * - Create: POST ${base}
 * - Delete: DELETE ${base}/{id}
 * - SummaryOem: GET ${base}/summary/oem
 * - SummaryOemById: GET ${base}/summary/oem/{oemCompanyId}
 */

import { getApiBaseUrl } from '../config'

export const PAYMENT_ENDPOINTS = {
  /**
   * 지급 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments`
  },

  /**
   * 지급 상세 조회
   * @param paymentId - 지급 ID
   * @returns GET /admin/payments/{paymentId}
   */
  detail: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments/${paymentId}`
  },

  /**
   * 발주서별 지급 목록 조회
   * @param poId - 발주서 ID
   * @returns GET /admin/payments/by-po/{poId}
   */
  byPo: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments/by-po/${poId}`
  },

  /**
   * 지급 등록
   * @returns POST /admin/payments
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments`
  },

  /**
   * 지급 삭제
   * @param paymentId - 지급 ID
   * @returns DELETE /admin/payments/{paymentId}
   */
  delete: (paymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments/${paymentId}`
  },

  /**
   * OEM 제조사별 지급 요약
   * @returns GET /admin/payments/summary/oem
   */
  summaryOem: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments/summary/oem`
  },

  /**
   * 특정 OEM 제조사 지급 요약
   * @param oemCompanyId - OEM 제조사 ID
   * @returns GET /admin/payments/summary/oem/{oemCompanyId}
   */
  summaryOemById: (oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/payments/summary/oem/${oemCompanyId}`
  }
} as const
