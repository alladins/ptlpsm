/**
 * OEM 원가 관리 서비스
 */

import { OEM_COST_ENDPOINTS } from './api/endpoints/oem-cost.endpoints'
import { getAuthHeaders } from './api'
import type {
  OemCost,
  OemCostListItem,
  OemCostHistory,
  OemCostCreateRequest,
  OemCostUpdateRequest,
  OemCostSearchParams,
  OemCostStatistics,
  OemCostPageResponse,
  OemCostTreePageResponse,
  SkuWithoutOemCost,
  AffectedOrder,
  RecalcResult
} from '~/types/oem-cost'

class OemCostService {
  /**
   * 원가 목록 조회 (페이지네이션)
   */
  async getList(params: OemCostSearchParams = {}): Promise<OemCostPageResponse> {
    const queryParams = new URLSearchParams()

    if (params.skuId) queryParams.append('skuId', params.skuId)
    if (params.oemCompanyId) queryParams.append('oemCompanyId', params.oemCompanyId.toString())
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.status) queryParams.append('status', params.status)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${OEM_COST_ENDPOINTS.list()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`원가 목록 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 트리 구조 목록 조회 (SKU 부모 → OEM 자식)
   */
  async getTreeList(params: OemCostSearchParams = {}): Promise<OemCostTreePageResponse> {
    const queryParams = new URLSearchParams()

    if (params.skuId) queryParams.append('skuId', params.skuId)
    if (params.oemCompanyId) queryParams.append('oemCompanyId', params.oemCompanyId.toString())
    if (params.keyword) queryParams.append('skuName', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${OEM_COST_ENDPOINTS.tree()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`트리 목록 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 원가 목록 엑셀 다운로드 (검색 조건 연동, 페이징 미적용 전체 행)
   */
  async exportExcel(params: OemCostSearchParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()

    if (params.skuId) { queryParams.append('skuId', params.skuId) }
    if (params.oemCompanyId) { queryParams.append('oemCompanyId', params.oemCompanyId.toString()) }
    if (params.keyword) { queryParams.append('skuName', params.keyword) }
    if (params.costSourceType) { queryParams.append('costSourceType', params.costSourceType) }

    const url = `${OEM_COST_ENDPOINTS.exportExcel()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }

    return response.blob()
  }

  /**
   * 원가 상세 조회
   */
  async getDetail(id: number): Promise<OemCost> {
    const response = await fetch(OEM_COST_ENDPOINTS.detail(id), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`원가 상세 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * SKU별 OEM 원가 목록
   */
  async getBySkuId(skuId: string): Promise<OemCost[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.bySku(skuId), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`SKU별 원가 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * OEM별 SKU 원가 목록
   */
  async getByOemId(oemCompanyId: number): Promise<OemCost[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.byOem(oemCompanyId), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`OEM별 원가 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 원가 등록
   */
  async create(data: OemCostCreateRequest): Promise<OemCost> {
    console.log('[OemCostService] create 요청:', JSON.stringify(data, null, 2))
    const response = await fetch(OEM_COST_ENDPOINTS.create(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[OemCostService] create 실패:', response.status, errorData)
      // Validation 에러의 경우 details에 필드별 에러가 담김
      let errorMessage = errorData.message || errorData.error || `원가 등록 실패: ${response.status}`
      if (errorData.details) {
        const detailMessages = Object.entries(errorData.details)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')
        errorMessage = `${errorMessage} (${detailMessages})`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * 원가 수정
   */
  async update(id: number, data: OemCostUpdateRequest): Promise<OemCost> {
    const response = await fetch(OEM_COST_ENDPOINTS.update(id), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `원가 수정 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 원가 삭제 (soft delete)
   */
  async delete(id: number, reason?: string): Promise<void> {
    const queryParams = reason ? `?changeReason=${encodeURIComponent(reason)}` : ''
    const response = await fetch(`${OEM_COST_ENDPOINTS.delete(id)}${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`원가 삭제 실패: ${response.status}`)
    }
  }

  /**
   * 특정 SKU + OEM 조합의 적용구간 조회 — 만료된 과거 구간 포함
   *
   * ★ 목록(트리)에도 만료 구간이 함께 나오지만, 그건 SKU 단위로 펼쳐진 화면이다.
   *   한 공급사의 구간만 모아 보거나 고칠 때는 이 메서드를 쓴다.
   * ⚠ getHistory(변경 이력)와 다른 것이다.
   *   이력은 "누가 언제 왜 고쳤나" 감사 로그, 이건 "언제부터 언제까지 얼마" 구간표다.
   *
   * ※ 현재 호출처 없음 — 이력 모달의 적용구간 표를 걷어내면서(목록 화면과 중복)
   *   쓰이지 않게 됐다. 백엔드 /admin/oem-costs/periods 와 함께 남겨 둔다.
   */
  async getPeriods(skuId: string, oemCompanyId?: number): Promise<OemCost[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.periods(skuId, oemCompanyId), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`적용구간 조회 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 특정 SKU + OEM 조합의 변경 이력 조회
   *
   * ⚠ 시스템 일괄 적재를 포함한 전량이 온다. 화면에서 감추더라도
   *   적용기간 역산에는 전량이 필요하므로 여기서 거르지 않는다.
   */
  async getHistory(skuId: string, oemCompanyId: number): Promise<OemCostHistory[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.history(skuId, oemCompanyId), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`이력 조회 실패: ${response.status}`)
    }

    const result = await response.json()
    return result.list || result.content || result.data || result
  }

  /**
   * SKU 전체 OEM 변경 이력 조회 (oemCompanyId 없이)
   */
  async getHistoryBySku(skuId: string): Promise<OemCostHistory[]> {
    const url = `${OEM_COST_ENDPOINTS.historyAll()}?skuId=${encodeURIComponent(skuId)}&size=100`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`SKU 이력 조회 실패: ${response.status}`)
    }

    const result = await response.json()
    return result.list || result.content || result.data || result
  }

  /**
   * 특정 원가의 변경 이력 조회
   */
  async getHistoryById(id: number): Promise<OemCostHistory[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.historyById(id), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`이력 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 통계 조회
   */
  async getStatistics(): Promise<OemCostStatistics> {
    const response = await fetch(OEM_COST_ENDPOINTS.statistics(), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`통계 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 원가 미설정 SKU 목록
   */
  async getSkusWithoutCost(): Promise<SkuWithoutOemCost[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.skusWithoutCost(), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`미설정 SKU 조회 실패: ${response.status}`)
    }

    return response.json()
  }
  /**
   * 영향받는 주문 목록 조회 (원가 변경 시 재계산 대상)
   */
  async getAffectedOrders(skuId: string, oemCompanyId: number, startDate?: string, endDate?: string): Promise<AffectedOrder[]> {
    const params = new URLSearchParams({ skuId, oemCompanyId: oemCompanyId.toString() })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const url = `${OEM_COST_ENDPOINTS.affectedOrders()}?${params.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`영향 주문 조회 실패: ${response.status}`)
    }

    return response.json()
  }

  /**
   * 선택 재계산 실행
   */
  async recalculateSelected(deliveryDoneIds: number[]): Promise<RecalcResult[]> {
    const url = OEM_COST_ENDPOINTS.recalculate()
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deliveryDoneIds)
    })

    if (!response.ok) {
      throw new Error(`재계산 실패: ${response.status}`)
    }

    return response.json()
  }
}

export const oemCostService = new OemCostService()
