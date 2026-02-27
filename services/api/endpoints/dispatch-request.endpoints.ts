/**
 * 출고요청 관리 API 엔드포인트
 *
 * @created 2026-02-09
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/dispatch-requests
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - ByShipment: GET ${base}/by-shipment/{shipmentId}
 * - Create: POST ${base}
 * - Confirm: POST ${base}/{id}/confirm
 * - Dispatch: POST ${base}/{id}/dispatch
 * - Delete: DELETE ${base}/{id}
 */

import { getApiBaseUrl } from '../config'

export const DISPATCH_REQUEST_ENDPOINTS = {
  /**
   * 출고요청 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests`
  },

  /**
   * 출고요청 상세 조회
   * @param id - 출고요청 ID
   * @returns GET /admin/dispatch-requests/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/${id}`
  },

  /**
   * 출하 ID로 출고요청 조회
   * @param shipmentId - 출하 ID
   * @returns GET /admin/dispatch-requests/by-shipment/{shipmentId}
   */
  byShipment: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/by-shipment/${shipmentId}`
  },

  /**
   * OEM 재고/발주서 가용성 확인
   * @param shipmentId - 출하 ID
   * @param oemCompanyId - OEM 제조사 ID
   * @returns GET /admin/dispatch-requests/check-availability?shipmentId=&oemCompanyId=
   */
  checkAvailability: (shipmentId: number, oemCompanyId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/check-availability?shipmentId=${shipmentId}&oemCompanyId=${oemCompanyId}`
  },

  /**
   * 출하 품목 재고 현황 확인
   * @param shipmentId - 출하 ID
   * @returns GET /admin/dispatch-requests/inventory-status/{shipmentId}
   */
  inventoryStatus: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/inventory-status/${shipmentId}`
  },

  /**
   * 출고요청 생성
   * @returns POST /admin/dispatch-requests
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests`
  },

  /**
   * 출고요청 확인
   * @param id - 출고요청 ID
   * @returns POST /admin/dispatch-requests/{id}/confirm
   */
  confirm: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/${id}/confirm`
  },

  /**
   * 출고요청 발송처리 (재고 차감 포함)
   * @param id - 출고요청 ID
   * @returns POST /admin/dispatch-requests/{id}/dispatch
   */
  dispatch: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/${id}/dispatch`
  },

  /**
   * 출고요청 삭제
   * @param id - 출고요청 ID
   * @returns DELETE /admin/dispatch-requests/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/dispatch-requests/${id}`
  }
} as const
