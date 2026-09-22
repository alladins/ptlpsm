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
   * 발주서 목록 엑셀 다운로드
   * @returns GET /admin/purchase-orders/export?params
   */
  exportExcel: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/export`
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
   * 출하에 연결된 발주서 목록
   * 출하 사후 처리에서 가공비를 넣을 발주서를 고를 때 쓴다.
   * 발주와 출하는 1:1 이 아니라 여러 건이 나올 수 있다.
   * @returns GET /admin/purchase-orders/by-shipment/{shipmentId}
   */
  byShipment: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/by-shipment/${shipmentId}`
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
   * 가공비 확정 (출하 사후 처리)
   *
   * ⚠ update(PUT) 를 쓰면 안 된다. 그쪽은 발주서 전체를 덮는 API 라
   *   제조사·발주일이 지워진다. 가공비만 고칠 때는 반드시 이 경로를 쓸 것.
   * @returns PATCH /admin/purchase-orders/{poId}/processing-fee
   */
  updateProcessingFee: (poId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/purchase-orders/${poId}/processing-fee`
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
