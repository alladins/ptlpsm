import { getAuthHeaders } from './api'
import { NOTIFICATION_ENDPOINTS } from './api/endpoints/notification.endpoints'
import type { Notification } from '~/types/notification'

/**
 * 알림 서비스
 */
export const notificationService = {
  /**
   * 내 알림 목록 조회 (최근 10건)
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(NOTIFICATION_ENDPOINTS.list(), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  /**
   * 안 읽은 알림 수 조회
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(NOTIFICATION_ENDPOINTS.unreadCount(), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  /**
   * 개별 알림 읽음 처리
   */
  async markAsRead(id: number): Promise<void> {
    const response = await fetch(NOTIFICATION_ENDPOINTS.markRead(id), {
      method: 'PUT',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  },

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(): Promise<void> {
    const response = await fetch(NOTIFICATION_ENDPOINTS.markAllRead(), {
      method: 'PUT',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  }
}
