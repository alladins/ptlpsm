/**
 * 메시지 히스토리 API 엔드포인트
 *
 * CREATED DATE: 2025-11-30
 *
 * API 패턴:
 * - Base: /api/basic/message-history
 * - List: GET ${base} (페이징 검색)
 * - Detail: GET ${base}/{messageId}
 * - ByTransport: GET ${base}/transport/{transportId}
 * - ByDelivery: GET ${base}/delivery/{deliveryId}
 * - Resend: POST ${base}/{messageId}/resend
 */

import { getApiBaseUrl } from '../config'

export const MESSAGE_HISTORY_ENDPOINTS = {
  /**
   * 메시지 이력 검색 (페이징)
   * @returns GET /api/basic/message-history
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-history`
  },

  /**
   * 메시지 상세 조회
   * @param messageId 메시지 ID
   * @returns GET /api/basic/message-history/{messageId}
   */
  detail: (messageId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-history/${messageId}`
  },

  /**
   * 운송장별 메시지 이력 조회
   * @param transportId 운송장 ID
   * @returns GET /api/basic/message-history/transport/{transportId}
   */
  byTransport: (transportId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-history/transport/${transportId}`
  },

  /**
   * 납품확인별 메시지 이력 조회
   * @param deliveryId 납품확인 ID
   * @returns GET /api/basic/message-history/delivery/{deliveryId}
   */
  byDelivery: (deliveryId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-history/delivery/${deliveryId}`
  },

  /**
   * 실패 메시지 재발송
   * @param messageId 메시지 ID
   * @returns POST /api/basic/message-history/{messageId}/resend
   */
  resend: (messageId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/message-history/${messageId}/resend`
  }
} as const
