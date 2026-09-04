/**
 * 접근로그 서비스
 * @description 접근로그 조회 및 통계 관련 서비스
 */

import { formatDate } from '~/utils/format'
import { ACCESS_LOG_ENDPOINTS } from './api/endpoints/access-log.endpoints'
import { getAuthHeaders } from './api'
import type {
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
   * 접근로그 요약 통계 조회 (백엔드 집계)
   *
   * 과거에는 현재 페이지에 불러온 로그(기본 20건)만으로 프론트에서 계산해
   * 전체 수치와 맞지 않았다. DB 에서 집계한 값을 사용한다.
   * 기준일은 KST 오늘(00:00~24:00) — 백엔드가 UTC 범위로 변환해 집계한다.
   */
  async getStatistics(): Promise<AccessLogStatistics> {
    const response = await fetch(ACCESS_LOG_ENDPOINTS.statistics(), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`접근로그 통계 조회 실패: ${response.statusText}`)
    }

    return response.json()
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

    // ⚠️ 백엔드는 시각을 UTC 로 저장·응답한다(JVM·DB 세션 모두 UTC).
    //    타임존 표기가 없는 문자열이라 new Date() 로 파싱하면 브라우저 로컬시각으로
    //    해석되어 변환이 일어나지 않고, 화면에 9시간 이른 시각이 찍힌다.
    //    → 공통 유틸(parseUtcDate + timeZone: 'Asia/Seoul')을 사용해 KST 로 변환한다.
    return formatDate(dateString, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Seoul'
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
