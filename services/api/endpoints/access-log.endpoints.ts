/**
 * 접근로그 API 엔드포인트
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/access-logs
 * - List: GET ${base}?params
 * - Export: GET ${base}/export
 */

import { getApiBaseUrl } from '../config'

export const ACCESS_LOG_ENDPOINTS = {
  /**
   * 접근로그 목록 조회
   * @returns GET /admin/access-logs
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/access-logs`
  },

  /**
   * 접근로그 통계 조회
   * @returns GET /admin/access-logs/statistics
   */
  statistics: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/access-logs/statistics`
  },

  /**
   * 엑셀 다운로드
   * @returns GET /admin/access-logs/export
   */
  exportExcel: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/access-logs/export`
  }
} as const
