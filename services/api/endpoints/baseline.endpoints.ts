/**
 * 기성/납품확인 차수 API 엔드포인트
 *
 * CREATED DATE: 2025-12-09
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - List by Order: GET /admin/orders/{orderId}/baselines
 * - Create: POST /admin/orders/{orderId}/baselines
 * - Detail: GET /admin/baselines/{id}
 * - Delivery Confirmation: GET /admin/baselines/{id}/delivery-confirmation
 * - Current Quantities: GET /admin/orders/{orderId}/current-quantities
 * - Quantity Changes: GET /admin/orders/{orderId}/quantity-changes
 */

import { getApiBaseUrl } from '../config'

export const BASELINE_ENDPOINTS = {
  /**
   * 차수 목록 조회 (검색 파라미터 포함)
   * @returns GET /admin/baselines
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines`
  },

  /**
   * 주문별 차수 목록 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/baselines
   */
  listByOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/baselines`
  },

  /**
   * 기성/납품완료 차수 생성
   * @param orderId - 주문 ID
   * @returns POST /admin/orders/{orderId}/baselines
   */
  create: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/baselines`
  },

  /**
   * 차수 상세 조회 (스냅샷 포함)
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}
   */
  detail: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}`
  },

  /**
   * 납품확인서 조회
   * @param baselineId - 차수 ID
   * @returns GET /admin/baselines/{baselineId}/delivery-confirmation
   */
  deliveryConfirmation: (baselineId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/baselines/${baselineId}/delivery-confirmation`
  },

  /**
   * 현재 수량 스냅샷 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/current-quantities
   */
  currentQuantities: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/current-quantities`
  },

  /**
   * 수량 변경 이력 조회 (이전 차수 이후)
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/quantity-changes?since={date}
   */
  quantityChanges: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/quantity-changes`
  },

  /**
   * 최근 차수 조회
   * @param orderId - 주문 ID
   * @returns GET /admin/orders/{orderId}/baselines/latest
   */
  latestByOrder: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}/baselines/latest`
  }
} as const
