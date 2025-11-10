/**
 * 운송 관리 API 엔드포인트 (운송장/Waybills)
 *
 * MIGRATED FROM: transport.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - 권한 주석 추가
 *
 * 권한: 시스템관리자 (전체), OEM생산자 (본인 담당 건만)
 *       리드파워담당자 (특별한 경우만), 배송기사 (본인 건만 조회)
 *       조회전용 (조회만)
 *
 * NOTE: 백엔드에서 /waybills로 변경 예정
 *
 * API 패턴:
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
  },

  /**
   * 운송장 PDF 생성
   * @param transportId - 운송장 ID
   * @returns POST /admin/transport/{transportId}/generate-pdf
   */
  generatePdf: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/${transportId}/generate-pdf`
  },

  /**
   * 운송장 PDF 다운로드
   * @param transportId - 운송장 ID
   * @returns GET /admin/transport/{transportId}/receipt-pdf
   * @description Authorization 헤더 자동 추가됨 (api-interceptor.ts)
   */
  receiptPdf: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/transport/${transportId}/receipt-pdf`
  }
} as const
