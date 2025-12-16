/**
 * 출하 관리 API 엔드포인트
 *
 * MIGRATED FROM: shipment.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - 권한 주석 추가
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *       OEM생산자 (본인 담당 건만 조회), 조회전용 (조회만)
 *
 * API 패턴:
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
  },

  // ========================================
  // 추가변경 관련 API
  // ========================================

  /**
   * 추가변경 실행
   * @param shipmentId - 출하 ID
   * @returns POST /admin/shipments/{shipmentId}/additional-change
   */
  additionalChange: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}/additional-change`
  },

  /**
   * 수량 변경 이력 조회
   * @param shipmentId - 출하 ID
   * @returns GET /admin/shipments/{shipmentId}/quantity-history
   */
  getChangeHistory: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}/quantity-history`
  },

  /**
   * 이전 인수증 목록 조회 (관리자용)
   * @param shipmentId - 출하 ID
   * @returns GET /admin/shipments/{shipmentId}/previous-receipts
   */
  getPreviousReceipts: (shipmentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/shipments/${shipmentId}/previous-receipts`
  }
} as const
