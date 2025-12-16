/**
 * 기성/납품확인 차수 서비스
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 기성 청구 및 납품완료 처리를 위한 차수(Baseline) 관련 API 호출 서비스
 */

import { BASELINE_ENDPOINTS } from './api/endpoints/baseline.endpoints'
import type {
  Baseline,
  BaselineListItem,
  BaselineListResponse,
  BaselineCreateRequest,
  CurrentQuantitySnapshot,
  QuantityChangeRecord,
  DeliveryConfirmation
} from '~/types/baseline'

export const baselineService = {
  /**
   * 주문별 차수 목록 조회
   */
  async getBaselinesByOrderId(orderId: number): Promise<BaselineListItem[]> {
    try {
      const url = BASELINE_ENDPOINTS.listByOrder(orderId)
      console.log('차수 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result
      }

      // 페이징 응답 처리
      if (result.content) {
        return result.content
      }

      // data 래핑 처리
      if (result.data) {
        return Array.isArray(result.data) ? result.data : result.data.content || []
      }

      return []
    } catch (error) {
      console.error('차수 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * 차수 상세 조회 (스냅샷 포함)
   */
  async getBaselineById(baselineId: number): Promise<Baseline | null> {
    try {
      const url = BASELINE_ENDPOINTS.detail(baselineId)
      console.log('차수 상세 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('차수 상세 조회 실패:', error)
      return null
    }
  },

  /**
   * 최근 차수 조회
   */
  async getLatestBaseline(orderId: number): Promise<Baseline | null> {
    try {
      const url = BASELINE_ENDPOINTS.latestByOrder(orderId)
      console.log('최근 차수 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 차수가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('최근 차수 조회 실패:', error)
      return null
    }
  },

  /**
   * 기성/납품완료 차수 생성
   */
  async createBaseline(orderId: number, data: BaselineCreateRequest): Promise<Baseline> {
    try {
      const url = BASELINE_ENDPOINTS.create(orderId)
      console.log('차수 생성 API 호출:', url, data)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('차수 생성 실패:', error)
      throw error
    }
  },

  /**
   * 현재 수량 스냅샷 조회
   * @description 기성 청구 모달에서 현재 시점의 납품/출하 수량 조회
   */
  async getCurrentQuantities(orderId: number): Promise<CurrentQuantitySnapshot | null> {
    try {
      const url = BASELINE_ENDPOINTS.currentQuantities(orderId)
      console.log('현재 수량 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('현재 수량 조회 실패:', error)
      return null
    }
  },

  /**
   * 수량 변경 이력 조회
   * @description 특정 날짜 이후 발생한 수량 변경 이력 조회
   */
  async getQuantityChanges(orderId: number, baselineId?: number): Promise<{
    historyList: any[]
    itemSummary: any[]
  }> {
    try {
      let url = BASELINE_ENDPOINTS.quantityChanges(orderId)
      if (baselineId) {
        url += `?baselineId=${baselineId}`
      }
      console.log('수량 변경 이력 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data || result

      return {
        historyList: data.historyList || data.changes || [],
        itemSummary: data.itemSummary || data.summary || []
      }
    } catch (error) {
      console.error('수량 변경 이력 조회 실패:', error)
      return { historyList: [], itemSummary: [] }
    }
  },

  /**
   * 차수 목록 조회 (검색 파라미터 포함)
   */
  async getBaselines(params: { orderId?: number; page?: number; size?: number } = {}): Promise<BaselineListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params.orderId) queryParams.append('orderId', params.orderId.toString())
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.size) queryParams.append('size', params.size.toString())

      const url = `${BASELINE_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('차수 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 페이징 응답 처리
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as BaselineListResponse
      }

      // data 래핑 처리
      if (result.data) {
        return result.data
      }

      // 배열 응답을 페이징 형식으로 변환
      if (Array.isArray(result)) {
        return {
          content: result,
          totalElements: result.length,
          totalPages: 1,
          size: result.length,
          number: 0,
          first: true,
          last: true,
          empty: result.length === 0
        }
      }

      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
      }
    } catch (error) {
      console.error('차수 목록 조회 실패:', error)
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
      }
    }
  },

  /**
   * 납품확인서 조회
   */
  async getDeliveryConfirmation(baselineId: number): Promise<DeliveryConfirmation | null> {
    try {
      const url = BASELINE_ENDPOINTS.deliveryConfirmation(baselineId)
      console.log('납품확인서 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 납품확인서가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('납품확인서 조회 실패:', error)
      return null
    }
  }
}

/**
 * 차수 표시명 생성 유틸리티
 * @param baselineType - 차수 유형 (PROGRESS/FINAL)
 * @param baselineSeq - 차수 순번
 * @returns 표시명 (예: "기성 1차", "납품완료")
 */
export function getBaselineDisplayName(baselineType: string, baselineSeq: number): string {
  if (baselineType === 'FINAL') {
    return '납품완료'
  }
  return `기성 ${baselineSeq}차`
}
