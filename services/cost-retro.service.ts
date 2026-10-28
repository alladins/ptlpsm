import { apiClient } from '~/services/api/client'
import type {
  CostRetroCandidate,
  CostRetroRequest,
  CostRetroResult,
  CostRetroRun
} from '~/types/oem-cost'

const BASE = '/admin/oem-costs/retro'

/** 미리보기·적용은 하위 재계산(기성청구·기성 차수·원장)까지 돌려 오래 걸릴 수 있다 */
const LONG_TIMEOUT = 180000

/**
 * 원가 소급 — 원가표와 다른 단가로 등록된 과거 발주를 원가표대로 맞춘다 (2026-10-28)
 */
export const costRetroService = {
  /** 발주일 기준 원가표와 다른 발주 품목 */
  getCandidates (params: { oemCompanyId: number, from?: string, to?: string, skuId?: string }): Promise<CostRetroCandidate[]> {
    return apiClient.get<CostRetroCandidate[]>(`${BASE}/candidates`, params)
  },

  /** 미리보기 — 실제로 바꿔 본 결과, DB 는 그대로 */
  preview (request: CostRetroRequest): Promise<CostRetroResult> {
    return apiClient.post<CostRetroResult>(`${BASE}/preview`, request, { timeout: LONG_TIMEOUT })
  },

  /** 적용 — 미리보기의 previewToken 필수 */
  apply (request: CostRetroRequest): Promise<CostRetroResult> {
    return apiClient.post<CostRetroResult>(`${BASE}/apply`, request, { timeout: LONG_TIMEOUT })
  },

  getRuns (oemCompanyId?: number): Promise<CostRetroRun[]> {
    return apiClient.get<CostRetroRun[]>(`${BASE}/runs`, oemCompanyId ? { oemCompanyId } : {})
  },

  revert (runId: number): Promise<CostRetroResult> {
    return apiClient.post<CostRetroResult>(`${BASE}/runs/${runId}/revert`, {}, { timeout: LONG_TIMEOUT })
  }
}
