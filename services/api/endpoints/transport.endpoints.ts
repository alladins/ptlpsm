/**
 * 운송 관리 API 엔드포인트
 *
 * MIGRATED FROM: transport.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/admin/transport
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - ByShipment: GET ${base}/by-shipment/{shipmentId}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 */

import { getApiBaseUrl } from '../config'

export const TRANSPORT_ENDPOINTS = {
  /**
   * 운송장 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport`
  },

  /**
   * 운송장 상세 조회
   * @param transportId - 운송장 ID
   * @returns GET /admin/transport/{transportId}
   */
  detail: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/${transportId}`
  },

  /**
   * 출하 ID로 운송장 조회
   * @param shipmentId - 출하 ID
   * @returns GET /admin/transport/by-shipment/{shipmentId}
   */
  byShipment: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/by-shipment/${shipmentId}`
  },

  /**
   * 운송장 생성
   * @returns POST /admin/transport
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport`
  },

  /**
   * 운송장 수정
   * @param transportId - 운송장 ID
   * @returns PUT /admin/transport/{transportId}
   */
  update: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/${transportId}`
  },

  /**
   * 운송장 삭제
   * @param transportId - 운송장 ID
   * @returns DELETE /admin/transport/{transportId}
   */
  delete: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/${transportId}`
  }
} as const
