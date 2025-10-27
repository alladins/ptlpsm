/**
 * 납품 관리 API 엔드포인트
 *
 * CREATED DATE: 2025-10-27
 *
 * API 패턴:
 * - Admin Base: ${baseUrl}/admin/deliveries
 * - Mobile Base: ${baseUrl}/m/delivery
 *
 * Admin APIs:
 * - Create: POST ${adminBase}
 * - List: GET ${adminBase}?params
 * - Detail: GET ${adminBase}/{id}
 *
 * Mobile APIs:
 * - GetByToken: GET ${mobileBase}/{token}
 * - UploadSignature: POST ${mobileBase}/{token}/signature
 * - UploadPhotos: POST ${mobileBase}/{token}/photos
 * - Confirm: POST ${mobileBase}/{token}/confirm
 */

import { getApiBaseUrl } from '../config'

export const DELIVERY_ENDPOINTS = {
  /**
   * 납품 생성 및 토큰 발급 (Admin용)
   * @returns POST /admin/deliveries
   * @example
   * fetch(DELIVERY_ENDPOINTS.create(), {
   *   method: 'POST',
   *   body: JSON.stringify({ transportId: 123 })
   * })
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries`
  },

  /**
   * 납품 목록 조회 (Admin용)
   * @returns Base URL for query parameters
   * @example
   * const queryParams = new URLSearchParams()
   * queryParams.append('page', '0')
   * queryParams.append('size', '10')
   * fetch(`${DELIVERY_ENDPOINTS.list()}?${queryParams}`)
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries`
  },

  /**
   * 납품 상세 조회 (Admin용)
   * @param deliveryId - 납품 ID
   * @returns GET /admin/deliveries/{deliveryId}
   */
  detail: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/deliveries/${deliveryId}`
  },

  /**
   * 토큰으로 납품 정보 조회 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns GET /m/delivery/{token}
   */
  getByToken: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}`
  },

  /**
   * 서명 이미지 업로드 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/signature
   */
  uploadSignature: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/signature`
  },

  /**
   * 사진 업로드 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/photos
   */
  uploadPhotos: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/photos`
  },

  /**
   * 납품 완료 처리 (Mobile용)
   * @param token - 접근 토큰 (UUID)
   * @returns POST /m/delivery/{token}/confirm
   */
  confirm: (token: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/m/delivery/${token}/confirm`
  }
} as const
