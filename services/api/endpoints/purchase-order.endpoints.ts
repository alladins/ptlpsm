/**
 * 발주서 관리 API 엔드포인트
 *
 * @created 2026-02-09
 * @updated 2026-02-09
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/purchase-orders
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - Issue: POST ${base}/{id}/issue
 * - Produce: POST ${base}/{id}/produce
 */

import { getApiBaseUrl } from '../config'

export const PURCHASE_ORDER_ENDPOINTS = {
  /**
   * 발주서 목록 조회
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '0')
   * queryParams.append('size', '10')
   * fetch(`${PURCHASE_ORDER_ENDPOINTS.list()}?${queryParams}`)
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders`
  },

  /**
   * 발주서 상세 조회
   * @param poId - 발주서 ID
   * @returns GET /admin/purchase-orders/{poId}
   */
  detail: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}`
  },

  /**
   * 발주서 생성
   * @returns POST /admin/purchase-orders
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders`
  },

  /**
   * 발주서 수정
   * @param poId - 발주서 ID
   * @returns PUT /admin/purchase-orders/{poId}
   */
  update: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}`
  },

  /**
   * 발주서 삭제
   * @param poId - 발주서 ID
   * @returns DELETE /admin/purchase-orders/{poId}
   */
  delete: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}`
  },

  /**
   * 발주서 발행
   * @param poId - 발주서 ID
   * @returns POST /admin/purchase-orders/{poId}/issue
   */
  issue: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/issue`
  },

  /**
   * 본사 바로 입고
   * @param poId - 발주서 ID
   * @returns POST /admin/purchase-orders/{poId}/direct-stock-in
   */
  directStockIn: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/direct-stock-in`
  },

  /**
   * 발주서 접수
   * @param poId - 발주서 ID
   * @returns POST /admin/purchase-orders/{poId}/accept
   */
  accept: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/accept`
  },

  /**
   * 발주서 반려 영향 분석
   * @param poId - 발주서 ID
   * @returns GET /admin/purchase-orders/{poId}/reject-impact
   */
  rejectImpact: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/reject-impact`
  },

  /**
   * 발주서 반려
   * @param poId - 발주서 ID
   * @returns POST /admin/purchase-orders/{poId}/reject
   */
  reject: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/reject`
  },

  /**
   * 생산완료 체크
   * @param poId - 발주서 ID
   * @returns POST /admin/purchase-orders/{poId}/produce
   */
  produce: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/produce`
  },

  /**
   * 발주서 PDF 다운로드
   * @param poId - 발주서 ID
   * @returns GET /admin/purchase-orders/{poId}/pdf
   */
  pdf: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/pdf`
  }
} as const
