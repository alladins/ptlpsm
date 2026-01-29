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
  SkuWithoutOemCost
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
    const response = await fetch(OEM_COST_ENDPOINTS.create(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `원가 등록 실패: ${response.status}`)
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
    const queryParams = reason ? `?reason=${encodeURIComponent(reason)}` : ''
    const response = await fetch(`${OEM_COST_ENDPOINTS.delete(id)}${queryParams}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`원가 삭제 실패: ${response.status}`)
    }
  }

  /**
   * 특정 SKU + OEM 조합의 변경 이력 조회
   */
  async getHistory(skuId: string, oemCompanyId: number): Promise<OemCostHistory[]> {
    const response = await fetch(OEM_COST_ENDPOINTS.history(skuId, oemCompanyId), {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`이력 조회 실패: ${response.status}`)
    }

    return response.json()
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
}

export const oemCostService = new OemCostService()
