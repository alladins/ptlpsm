import { apiEnvironment, getAuthHeaders } from './api'
import { SALES_ENDPOINTS } from './api/endpoints/sales.endpoints'
import type { SalesForecast, SalesForecastRequest } from '~/types/sales'
import { httpError } from '~/utils/apiError'

/**
 * 영업 예측 서비스
 */
export const salesForecastService = {
  /**
   * 예측 전체 목록 조회
   */
  async getAllForecasts(): Promise<SalesForecast[]> {
    try {
      const url = SALES_ENDPOINTS.forecast.list()

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw httpError(response.status, '예측 목록 조회')
      }

      return await response.json()
    } catch (error) {
      console.error('예측 목록 조회 오류:', error)
      throw error
    }
  },

  /**
   * 예측 ID로 조회
   */
  async getForecastById(id: number): Promise<SalesForecast> {
    try {
      const url = SALES_ENDPOINTS.forecast.detail(id)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw httpError(response.status, '예측 상세 조회')
      }

      return await response.json()
    } catch (error) {
      console.error('예측 상세 조회 오류:', error)
      throw error
    }
  },

  /**
   * 수주 ID로 예측 조회
   */
  async getForecastBySalesId(salesId: number): Promise<SalesForecast> {
    try {
      const url = SALES_ENDPOINTS.forecast.bySalesId(salesId)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw httpError(response.status, '수주 예측 조회')
      }

      return await response.json()
    } catch (error) {
      console.error('수주 예측 조회 오류:', error)
      throw error
    }
  },

  /**
   * 확률별 예측 조회
   */
  async getForecastsByProbability(probability: string): Promise<SalesForecast[]> {
    try {
      const url = SALES_ENDPOINTS.forecast.byProbability(probability)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw httpError(response.status, '확률별 예측 조회')
      }

      return await response.json()
    } catch (error) {
      console.error('확률별 예측 조회 오류:', error)
      throw error
    }
  },

  /**
   * 예측 등록
   */
  async createForecast(request: SalesForecastRequest): Promise<SalesForecast> {
    try {
      const url = SALES_ENDPOINTS.forecast.create()

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw httpError(response.status, '예측 등록')
      }

      return await response.json()
    } catch (error) {
      console.error('예측 등록 오류:', error)
      throw error
    }
  },

  /**
   * 예측 수정
   */
  async updateForecast(id: number, request: SalesForecastRequest): Promise<SalesForecast> {
    try {
      const url = SALES_ENDPOINTS.forecast.update(id)

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw httpError(response.status, '예측 수정')
      }

      return await response.json()
    } catch (error) {
      console.error('예측 수정 오류:', error)
      throw error
    }
  },

  /**
   * 예측 삭제
   */
  async deleteForecast(id: number): Promise<void> {
    try {
      const url = SALES_ENDPOINTS.forecast.delete(id)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw httpError(response.status, '예측 삭제')
      }
    } catch (error) {
      console.error('예측 삭제 오류:', error)
      throw error
    }
  },

  /**
   * 확률 옵션 가져오기
   */
  getProbabilityOptions() {
    return [
      { value: '높음', label: '높음' },
      { value: '중간', label: '중간' },
      { value: '낮음', label: '낮음' },
    ]
  }
}
