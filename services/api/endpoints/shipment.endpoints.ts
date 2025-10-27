/**
 * 출하 관리 API 엔드포인트
 *
 * MIGRATED FROM: shipment.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/admin/shipments
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - ByOrder: GET ${base}/by-order/{deliveryRequestNo}
 */

import { getApiBaseUrl } from '../config'

export const SHIPMENT_ENDPOINTS = {
  /**
   * 발주번호 기준 출하 현황 조회
   * @param deliveryRequestNo - 발주번호
   * @returns GET /admin/shipments/by-order/{deliveryRequestNo}
   */
  byOrder: (deliveryRequestNo: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/by-order/${deliveryRequestNo}`
  },

  /**
   * 출하 목록 조회
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '0')
   * queryParams.append('size', '10')
   * fetch(`${SHIPMENT_ENDPOINTS.list()}?${queryParams}`)
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments`
  },

  /**
   * 출하 상세 조회 (발주 정보 포함)
   * @param shipmentId - 출하 ID
   * @returns GET /admin/shipments/{shipmentId}
   */
  detail: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}`
  },

  /**
   * 출하 생성
   * @returns POST /admin/shipments
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments`
  },

  /**
   * 출하 수정
   * @param shipmentId - 출하 ID
   * @returns PUT /admin/shipments/{shipmentId}
   */
  update: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}`
  },

  /**
   * 출하 삭제
   * @param shipmentId - 출하 ID
   * @returns DELETE /admin/shipments/{shipmentId}
   */
  delete: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}`
  }
} as const
