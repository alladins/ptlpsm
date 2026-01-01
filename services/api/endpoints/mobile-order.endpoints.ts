/**
 * 모바일 주문 요청 API 엔드포인트
 *
 * CREATED DATE: 2025-12-09
 *
 * 권한:
 * - 모바일: 시공사 담당자 (SITE_MANAGER) - 본인 요청만
 * - 관리자: 시스템관리자, 리드파워 담당자 (전체)
 *
 * API 패턴:
 * - Mobile:
 *   - List: GET /mobile/order-requests
 *   - Create: POST /mobile/order-requests
 *   - Detail: GET /mobile/order-requests/{id}
 * - Admin:
 *   - List: GET /admin/order-requests
 *   - Approve: POST /admin/order-requests/{id}/approve
 *   - Reject: POST /admin/order-requests/{id}/reject
 */

import { getApiBaseUrl } from '../config'

export const MOBILE_ORDER_ENDPOINTS = {
  // ============ 모바일 (현장소장용) ============

  /**
   * 내 주문 요청 목록 조회 (현장소장)
   * @returns GET /mobile/order-requests
   */
  myRequests: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/mobile/order-requests`
  },

  /**
   * 주문 요청 생성 (현장소장)
   * @returns POST /mobile/order-requests
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/mobile/order-requests`
  },

  /**
   * 주문 요청 상세 조회 (현장소장)
   * @param requestId - 요청 ID
   * @returns GET /mobile/order-requests/{requestId}
   */
  detail: (requestId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/mobile/order-requests/${requestId}`
  },

  // ============ 관리자용 ============

  /**
   * 전체 주문 요청 목록 조회 (관리자)
   * @returns GET /admin/order-requests?params
   */
  adminList: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/order-requests`
  },

  /**
   * 주문 요청 상세 조회 (관리자)
   * @param requestId - 요청 ID
   * @returns GET /admin/order-requests/{requestId}
   */
  adminDetail: (requestId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/order-requests/${requestId}`
  },

  /**
   * 주문 요청 승인 (관리자)
   * @param requestId - 요청 ID
   * @returns POST /admin/order-requests/{requestId}/approve
   */
  approve: (requestId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/order-requests/${requestId}/approve`
  },

  /**
   * 주문 요청 반려 (관리자)
   * @param requestId - 요청 ID
   * @returns POST /admin/order-requests/{requestId}/reject
   */
  reject: (requestId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/order-requests/${requestId}/reject`
  }
} as const
