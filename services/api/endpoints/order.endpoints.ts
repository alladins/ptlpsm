/**
 * 발주 관리 API 엔드포인트
 *
 * MIGRATED FROM: order.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/admin/orders
 * - List: GET ${base}?params
 * - Search: GET ${base}/search?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - UploadPdf: POST ${base}/upload-pdf
 */

import { getApiBaseUrl } from '../config'

export const ORDER_ENDPOINTS = {
  /**
   * 발주 목록 조회
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '1')
   * queryParams.append('size', '10')
   * fetch(`${ORDER_ENDPOINTS.list()}?${queryParams}`)
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders`
  },

  /**
   * 발주 검색
   * @returns Base URL for search query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('client', '고객명')
   * fetch(`${ORDER_ENDPOINTS.search()}?${queryParams}`)
   */
  search: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/search`
  },

  /**
   * 발주 상세 조회
   * @param orderId - 발주 ID
   * @returns GET /admin/orders/{orderId}
   */
  detail: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}`
  },

  /**
   * 발주 등록
   * @returns POST /admin/orders
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders`
  },

  /**
   * 발주 수정
   * @param orderId - 발주 ID
   * @returns PUT /admin/orders/{orderId}
   */
  update: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}`
  },

  /**
   * 발주 삭제
   * @param orderId - 발주 ID
   * @returns DELETE /admin/orders/{orderId}
   */
  delete: (orderId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/${orderId}`
  },

  /**
   * PDF 파일 업로드 및 텍스트 추출
   * @returns POST /admin/orders/upload-pdf
   */
  uploadPdf: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/orders/upload-pdf`
  }
} as const
