/**
 * 알림 관리 API 엔드포인트
 */

import { getApiBaseUrl } from '../config'

export const NOTIFICATION_ENDPOINTS = {
  /**
   * 내 알림 목록 조회 (최근 10건)
   * @returns GET /admin/notifications
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/notifications`
  },

  /**
   * 안 읽은 알림 수 조회
   * @returns GET /admin/notifications/unread-count
   */
  unreadCount: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/notifications/unread-count`
  },

  /**
   * 개별 알림 읽음 처리
   * @param id - 알림 ID
   * @returns PUT /admin/notifications/{id}/read
   */
  markRead: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/notifications/${id}/read`
  },

  /**
   * 모든 알림 읽음 처리
   * @returns PUT /admin/notifications/read-all
   */
  markAllRead: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/notifications/read-all`
  }
} as const
