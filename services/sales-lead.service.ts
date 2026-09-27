/**
 * 영업관리 5단계-A 서비스 — 나라장터 낙찰·계약 수집 (공모·낙찰 수집)
 *
 * apiClient 사용 (인증 헤더·쿼리 문자열·에러 정규화 자동).
 * 에러 시 ApiError.message 에 백엔드 메시지가 그대로 들어온다 → 화면에서 그대로 보여줄 것.
 */
import { getApiBaseUrl, getAuthHeaders } from './api'
import { apiClient, ApiError } from '~/services/api/client'
import type {
  ImportKind,
  LeadBizType,
  LeadDigestGroup,
  SalesCollectRun,
  SalesCollectStatus,
  SalesLead,
  SalesLeadPage,
  SalesLeadSearchParams
} from '~/types/sales-lead'

const BASE = '/admin/sales-leads'

export const salesLeadService = {
  /** 목록 — leadKind 를 비우면 설계+공사, 'ALL' 이면 전체 */
  search (params: SalesLeadSearchParams): Promise<SalesLeadPage> {
    return apiClient.get<SalesLeadPage>(BASE, { ...params })
  },

  /** 상세 (원천 응답 rawJson 포함) */
  get (leadId: number): Promise<SalesLead> {
    return apiClient.get<SalesLead>(`${BASE}/${leadId}`)
  },

  /** 아침 요약 미리보기 — date 생략 시 오늘(KST) */
  digest (date?: string): Promise<LeadDigestGroup[]> {
    return apiClient.get<LeadDigestGroup[]>(`${BASE}/digest`, { date })
  },

  /** 수집 상태 (키 설정·진행 중·막힌 이유) */
  getStatus (): Promise<SalesCollectStatus> {
    return apiClient.get<SalesCollectStatus>(`${BASE}/collect/status`)
  },

  /** 최근 실행 기록 */
  getRuns (limit = 50): Promise<SalesCollectRun[]> {
    return apiClient.get<SalesCollectRun[]>(`${BASE}/collect/runs`, { limit })
  },

  /** 지금 수집 — 백그라운드로 시작하고 상태를 돌려준다. 막혀 있으면 400 + 이유 */
  startCollect (windowDays?: number): Promise<SalesCollectStatus> {
    const query = windowDays ? `?windowDays=${windowDays}` : ''
    return apiClient.post<SalesCollectStatus>(`${BASE}/collect${query}`)
  },

  /**
   * 원천 응답 붙여넣기 적재 (시스템관리자만)
   *
   * 백엔드가 본문을 @RequestBody String 으로 받으므로 붙여넣은 문자열을 **그대로** 보내야 한다.
   * apiClient.post 는 본문을 JSON.stringify 해서 문자열이 따옴표로 한 번 더 감싸지므로 fetch 를 직접 쓴다.
   */
  async importRaw (kind: ImportKind, bizType: LeadBizType, json: string): Promise<SalesCollectRun> {
    const query = new URLSearchParams({ kind, bizType }).toString()
    const response = await fetch(`${getApiBaseUrl()}${BASE}/collect/import?${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: json
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, errorData.message || `HTTP 오류: ${response.status}`, errorData)
    }
    return await response.json() as SalesCollectRun
  }
}
