/**
 * 방문자 추적 서비스.
 *
 * 페이지 진입 / 통계 조회 / 화이트리스트 / 알림 관리 통합.
 * 기존 localStorage-only 구현은 폐기하고 백엔드 API 호출로 전환.
 */

import { getAuthHeaders } from './api'
import { VISIT_ENDPOINTS } from './api/endpoints/visit.endpoints'
import type {
  ApiCallLog,
  CompanyIpUsage,
  CompanyTodayLive,
  HourDistribution,
  PagedResponse,
  UserTodayLive,
  VisitAlert,
  VisitAlertResolveRequest,
  VisitAlertStatus,
  VisitAlertType,
  VisitCompanyStatsDaily,
  VisitIpWhitelist,
  VisitIpWhitelistRequest,
  VisitRecordRequest,
  VisitUserStatsDaily
} from '~/types/visit'

/** 비로그인 페이지에서도 호출 가능하도록 익명 헤더 옵션 분기. */
function recordHeaders(): HeadersInit {
  if (process.client && localStorage.getItem('auth_access_token')) {
    return getAuthHeaders()
  }
  return { 'Content-Type': 'application/json' }
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.append(k, String(v))
    }
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const visitService = {
  // ==================== 수집 ====================

  /** 페이지 진입 기록. 미들웨어가 라우트 변경 시 호출. */
  async record(req: VisitRecordRequest): Promise<{ id: number }> {
    const response = await fetch(VISIT_ENDPOINTS.record(), {
      method: 'POST',
      headers: recordHeaders(),
      body: JSON.stringify(req)
    })
    if (!response.ok) {
      throw new Error(`방문 기록 실패: ${response.status}`)
    }
    return response.json()
  },

  // ==================== 회사별 통계 ====================

  async getCompanyStats(params: {
    startDate: string
    endDate: string
    companyId?: number
  }): Promise<VisitCompanyStatsDaily[]> {
    const url = `${VISIT_ENDPOINTS.companyStats()}${buildQuery(params)}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`회사별 통계 조회 실패: ${response.status}`)
    return response.json()
  },

  async getCompanyToday(): Promise<CompanyTodayLive[]> {
    const response = await fetch(VISIT_ENDPOINTS.companyToday(), { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`회사 오늘 통계 조회 실패: ${response.status}`)
    return response.json()
  },

  async getCompanyIps(companyId: number): Promise<CompanyIpUsage[]> {
    const response = await fetch(VISIT_ENDPOINTS.companyIps(companyId), { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`회사 IP 이력 조회 실패: ${response.status}`)
    return response.json()
  },

  // ==================== 사용자별 통계 ====================

  async getUserStats(params: {
    startDate: string
    endDate: string
    userId?: number
    companyId?: number
  }): Promise<VisitUserStatsDaily[]> {
    const url = `${VISIT_ENDPOINTS.userStats()}${buildQuery(params)}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`사용자별 통계 조회 실패: ${response.status}`)
    return response.json()
  },

  async getUserToday(): Promise<UserTodayLive[]> {
    const response = await fetch(VISIT_ENDPOINTS.userToday(), { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`사용자 오늘 통계 조회 실패: ${response.status}`)
    return response.json()
  },

  // ==================== 시간대 ====================

  async getHourDistribution(params: {
    targetDate: string
    companyId?: number
  }): Promise<HourDistribution[]> {
    const url = `${VISIT_ENDPOINTS.hourDistribution()}${buildQuery(params)}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`시간대 분포 조회 실패: ${response.status}`)
    return response.json()
  },

  // ==================== API 호출 로그 ====================

  async getApiCalls(params: {
    userId?: number
    companyId?: number
    from?: string
    to?: string
    page?: number
    size?: number
  }): Promise<PagedResponse<ApiCallLog>> {
    const url = `${VISIT_ENDPOINTS.apiCalls()}${buildQuery(params)}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`API 호출 로그 조회 실패: ${response.status}`)
    return response.json()
  },

  // ==================== 화이트리스트 ====================

  async getWhitelist(companyId: number, listType?: 'WHITE' | 'BLACK'): Promise<VisitIpWhitelist[]> {
    const url = `${VISIT_ENDPOINTS.whitelist()}${buildQuery({ companyId, listType })}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`화이트리스트 조회 실패: ${response.status}`)
    return response.json()
  },

  async getActiveBlocks(): Promise<VisitIpWhitelist[]> {
    const response = await fetch(VISIT_ENDPOINTS.whitelistBlocks(), { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`활성 BLACK 조회 실패: ${response.status}`)
    return response.json()
  },

  async createWhitelist(req: VisitIpWhitelistRequest): Promise<{ id: number }> {
    const response = await fetch(VISIT_ENDPOINTS.whitelist(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(req)
    })
    if (!response.ok) throw new Error(`화이트리스트 등록 실패: ${response.status}`)
    return response.json()
  },

  async updateWhitelist(id: number, req: VisitIpWhitelistRequest): Promise<void> {
    const response = await fetch(VISIT_ENDPOINTS.whitelistById(id), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(req)
    })
    if (!response.ok) throw new Error(`화이트리스트 수정 실패: ${response.status}`)
  },

  async deleteWhitelist(id: number): Promise<void> {
    const response = await fetch(VISIT_ENDPOINTS.whitelistById(id), {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`화이트리스트 삭제 실패: ${response.status}`)
  },

  // ==================== 알림 ====================

  async getAlerts(params: {
    status?: VisitAlertStatus
    alertType?: VisitAlertType
    from?: string
    to?: string
    page?: number
    size?: number
  }): Promise<PagedResponse<VisitAlert>> {
    const url = `${VISIT_ENDPOINTS.alerts()}${buildQuery(params)}`
    const response = await fetch(url, { headers: getAuthHeaders() })
    if (!response.ok) throw new Error(`알림 조회 실패: ${response.status}`)
    return response.json()
  },

  async resolveAlert(id: number, req: VisitAlertResolveRequest): Promise<void> {
    const response = await fetch(VISIT_ENDPOINTS.resolveAlert(id), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(req)
    })
    if (!response.ok) throw new Error(`알림 처리 실패: ${response.status}`)
  }
}
