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
  LeadKeywordGroup,
  LeadProgressLog,
  LeadProgressUpdateRequest,
  SalesCollectRun,
  SalesCollectStatus,
  SalesLead,
  SalesLeadPage,
  SalesLeadRegionTree,
  SalesLeadSearchParams
} from '~/types/sales-lead'

const BASE = '/admin/sales-leads'

export const salesLeadService = {
  /** 목록 — leadKind 를 비우면 설계+공사, 'ALL' 이면 전체 */
  search (params: SalesLeadSearchParams): Promise<SalesLeadPage> {
    return apiClient.get<SalesLeadPage>(BASE, { ...params })
  },

  /** 권역 트리 — 목록과 같은 검색 조건(권역 선택·페이지 제외)의 권역별 수 */
  getRegionTree (params: Omit<SalesLeadSearchParams, 'page' | 'size' | 'regionId' | 'unassigned' | 'unresolved'>): Promise<SalesLeadRegionTree> {
    return apiClient.get<SalesLeadRegionTree>(`${BASE}/region-tree`, { ...params })
  },

  /** 상세 (원천 응답 rawJson 포함) */
  get (leadId: number): Promise<SalesLead> {
    return apiClient.get<SalesLead>(`${BASE}/${leadId}`)
  },

  /**
   * 영업 진행 상태 변경 — 갱신된 리드(상세와 같은 형태)를 돌려준다
   * 이어진 계약 행을 보내도 서버가 대표 행(낙찰 행)에 저장한다.
   * 막히면 400 + 이유 («다른 사람이 먼저 바꿨습니다…», «포기 사유를 적어 주세요» 등)
   */
  updateProgress (leadId: number, req: LeadProgressUpdateRequest): Promise<SalesLead> {
    return apiClient.put<SalesLead>(`${BASE}/${leadId}/progress`, req)
  },

  /** 영업 진행 변경 이력 (최신순) */
  getProgressLog (leadId: number): Promise<LeadProgressLog[]> {
    return apiClient.get<LeadProgressLog[]>(`${BASE}/${leadId}/progress-log`)
  },

  /** 아침 요약 미리보기 — date 생략 시 오늘(KST) */
  digest (date?: string): Promise<LeadDigestGroup[]> {
    return apiClient.get<LeadDigestGroup[]>(`${BASE}/digest`, { date })
  },

  /** 분류 키워드 5묶음 (사용 안 함 포함) */
  getKeywords (): Promise<LeadKeywordGroup[]> {
    return apiClient.get<LeadKeywordGroup[]>(`${BASE}/keywords`)
  },

  /** 키워드 추가 — 바뀐 5묶음을 돌려준다 */
  addKeyword (groupCode: string, word: string): Promise<LeadKeywordGroup[]> {
    const query = new URLSearchParams({ groupCode, word }).toString()
    return apiClient.post<LeadKeywordGroup[]>(`${BASE}/keywords?${query}`)
  },

  removeKeyword (groupCode: string, code: string): Promise<LeadKeywordGroup[]> {
    const query = new URLSearchParams({ groupCode, code }).toString()
    return apiClient.delete<LeadKeywordGroup[]>(`${BASE}/keywords?${query}`)
  },

  setKeywordUse (groupCode: string, code: string, use: boolean): Promise<LeadKeywordGroup[]> {
    const query = new URLSearchParams({ groupCode, code, use: String(use) }).toString()
    return apiClient.put<LeadKeywordGroup[]>(`${BASE}/keywords/use?${query}`)
  },

  /** 최근 days 일 리드를 지금 키워드로 다시 분류 (백그라운드) */
  reclassify (days: number): Promise<SalesCollectStatus> {
    return apiClient.post<SalesCollectStatus>(`${BASE}/reclassify?days=${days}`)
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
   * 과거 수집 — 시작일~종료일(KST, yyyy-MM-dd)의 낙찰·계약만 받는다 (입찰공고 보강 없음)
   * 기간 제약(최대 92일·오늘까지·3년 전까지)을 어기면 400 + 이유
   */
  startBackfill (fromDate: string, toDate: string): Promise<SalesCollectStatus> {
    const query = new URLSearchParams({ fromDate, toDate }).toString()
    return apiClient.post<SalesCollectStatus>(`${BASE}/collect?${query}`)
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
