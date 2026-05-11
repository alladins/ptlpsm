/**
 * 접근로그 서비스
 * @description 접근로그 조회 및 통계 관련 서비스
 */

import { getLocalDateString } from '~/utils/format'
import { ACCESS_LOG_ENDPOINTS } from './api/endpoints/access-log.endpoints'
import { getAuthHeaders } from './api'
import type {
  AccessLog,
  AccessLogSearchParams,
  AccessLogListResponse,
  AccessLogStatistics
} from '~/types/access-log'

/**
 * 쿼리스트링 빌더.
 * `new URL()` 은 base URL 이 절대경로일 때만 동작하는데, 환경에 따라 endpoint 가
 * 상대경로(예: `/api/admin/access-logs`)인 경우가 있어 `new URL()` 생성자가
 * "Invalid URL" 로 깨진다. URLSearchParams 로 직접 조립.
 */
function appendQuery(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.append(k, String(v))
    }
  })
  const qs = search.toString()
  return qs ? `${endpoint}?${qs}` : endpoint
}

export const accessLogService = {
  /**
   * 접근로그 목록 조회
   * @param params - 검색 파라미터
   * @returns 접근로그 목록 및 페이지 정보
   */
  async getAccessLogs(params?: AccessLogSearchParams): Promise<AccessLogListResponse> {
    const url = appendQuery(ACCESS_LOG_ENDPOINTS.list(), params as Record<string, unknown>)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`접근로그 조회 실패: ${response.statusText}`)
    }

    return response.json()
  },

  /**
   * 접근로그 통계 계산 (프론트엔드에서 계산)
   * @param logs - 접근로그 목록
   * @returns 통계 정보
   */
  calculateStatistics(logs: AccessLog[]): AccessLogStatistics {
    const today = getLocalDateString()
    const todayLogs = logs.filter(log => log.accessTime.startsWith(today))

    // 오늘 접속자 수 (고유 사용자)
    const uniqueUsers = new Set(todayLogs.map(l => l.username))

    // 로그인 관련 로그
    const loginLogs = todayLogs.filter(l =>
      l.accessUrl.includes('/login') || l.accessUrl.includes('/auth')
    )

    return {
      todayVisitors: uniqueUsers.size,
      successLogins: loginLogs.filter(l => l.statusCode === 200).length,
      failedLogins: loginLogs.filter(l => l.statusCode !== 200).length,
      errorCount: todayLogs.filter(l => l.statusCode >= 400).length
    }
  },

  /**
   * 엑셀 다운로드
   * @param params - 검색 파라미터
   * @returns Blob 데이터
   */
  async exportExcel(params?: AccessLogSearchParams): Promise<Blob> {
    const url = appendQuery(ACCESS_LOG_ENDPOINTS.exportExcel(), params as Record<string, unknown>)

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.statusText}`)
    }

    return response.blob()
  },

  /**
   * 날짜 포맷팅
   * @param dateString - ISO 날짜 문자열
   * @returns 포맷된 날짜 문자열
   */
  formatDateTime(dateString: string): string {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  /**
   * User-Agent에서 브라우저 정보 추출
   * @param userAgent - User-Agent 문자열
   * @returns 브라우저 정보
   */
  parseBrowserInfo(userAgent: string): string {
    if (!userAgent) return '-'

    // Chrome
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/)
      return match ? `Chrome ${match[1]}` : 'Chrome'
    }
    // Edge
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/)
      return match ? `Edge ${match[1]}` : 'Edge'
    }
    // Firefox
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/)
      return match ? `Firefox ${match[1]}` : 'Firefox'
    }
    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/)
      return match ? `Safari ${match[1]}` : 'Safari'
    }

    return userAgent.substring(0, 30) + '...'
  }
}
