/**
 * 영업관리 › 조달 영업 현황 서비스 — 나라장터 쇼핑몰 납품요구(단열재)
 *
 * apiClient 사용 (인증 헤더·쿼리 문자열·에러 정규화 자동). 에러 메시지는 ApiError.message 를 그대로 보여줄 것.
 */
import { apiClient } from '~/services/api/client'
import type { LeadKeywordGroup } from '~/types/sales-lead'
import type {
  MallCollectStatus,
  MallDashboard,
  MallItemPage,
  MallItemSearchParams,
  MallStatRow
} from '~/types/procurement-status'

const BASE = '/admin/procurement-status'

export const procurementStatusService = {
  /** 대시보드 — year 를 비우면 가장 최근 연도, target 을 비우면 전체 품명 */
  getDashboard (year?: number | null, target?: string | null): Promise<MallDashboard> {
    const params: Record<string, string | number> = {}
    if (year) { params.year = year }
    if (target) { params.target = target }
    return apiClient.get<MallDashboard>(`${BASE}/dashboard`, params)
  },

  /** 한 시도의 시군구 × 업체 */
  getSigungu (year: number, sidoCd: string, target?: string | null): Promise<MallStatRow[]> {
    const params: Record<string, string | number> = { year, sidoCd }
    if (target) { params.target = target }
    return apiClient.get<MallStatRow[]>(`${BASE}/sigungu`, params)
  },

  /** 한 시군구의 수요기관 × 업체 (sigunguCd NONE = 시군구 없는 기관) */
  getOrgs (year: number, sidoCd: string, sigunguCd: string, target?: string | null): Promise<MallStatRow[]> {
    const params: Record<string, string | number> = { year, sidoCd, sigunguCd }
    if (target) { params.target = target }
    return apiClient.get<MallStatRow[]>(`${BASE}/orgs`, params)
  },

  searchItems (params: MallItemSearchParams): Promise<MallItemPage> {
    const q: Record<string, string | number> = {}
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') { q[k] = v as string | number }
    })
    return apiClient.get<MallItemPage>(`${BASE}/items`, q)
  },

  // ── 관리자 (리드파워) ──

  getStatus (): Promise<MallCollectStatus> {
    return apiClient.get<MallCollectStatus>(`${BASE}/collect/status`)
  },

  /** 과거 수집 (fromDate·toDate yyyy-MM-dd) 또는 최근 N일 */
  collect (opts: { fromDate?: string, toDate?: string, windowDays?: number }): Promise<MallCollectStatus> {
    const q = new URLSearchParams()
    Object.entries(opts).forEach(([k, v]) => { if (v !== undefined && v !== '') { q.set(k, String(v)) } })
    return apiClient.post<MallCollectStatus>(`${BASE}/collect?${q.toString()}`)
  },

  getTargets (): Promise<LeadKeywordGroup> {
    return apiClient.get<LeadKeywordGroup>(`${BASE}/targets`)
  },

  addTarget (word: string): Promise<LeadKeywordGroup> {
    return apiClient.post<LeadKeywordGroup>(`${BASE}/targets?${new URLSearchParams({ word }).toString()}`)
  },

  removeTarget (code: string): Promise<LeadKeywordGroup> {
    return apiClient.delete<LeadKeywordGroup>(`${BASE}/targets?${new URLSearchParams({ code }).toString()}`)
  },

  setTargetUse (code: string, use: boolean): Promise<LeadKeywordGroup> {
    return apiClient.put<LeadKeywordGroup>(`${BASE}/targets/use?${new URLSearchParams({ code, use: String(use) }).toString()}`)
  }
}
