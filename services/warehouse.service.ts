/**
 * 창고 관리 API 서비스
 *
 * @created 2026-02-09
 * @description 창고 CRUD 기능 제공
 */

import { getAuthHeaders } from './api'
import { WAREHOUSE_ENDPOINTS } from './api/endpoints/warehouse.endpoints'
import type { Warehouse, WarehouseRequest } from '~/types/warehouse'

/**
 * 창고 서비스 클래스
 */
class WarehouseService {
  /**
   * 창고 목록 조회
   * @param includeInactive - 비활성 창고 포함 여부 (기본: false)
   * @returns 창고 목록
   */
  async getWarehouseList(includeInactive: boolean = false): Promise<Warehouse[]> {
    try {
      const queryParams = new URLSearchParams()
      if (includeInactive) {
        queryParams.append('includeInactive', 'true')
      }

      const url = `${WAREHOUSE_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('[warehouse.service] 목록 조회 요청:', { url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[warehouse.service] 목록 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('[warehouse.service] 목록 조회 성공:', data?.length || 0, '건')

      // data 래핑 처리
      if (data && data.data) {
        return data.data
      }
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('[warehouse.service] 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 창고 상세 조회
   * @param id - 창고 ID
   * @returns 창고 상세 정보
   */
  async getWarehouseById(id: number): Promise<Warehouse> {
    try {
      const url = WAREHOUSE_ENDPOINTS.detail(id)
      console.log('[warehouse.service] 상세 조회:', { id, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[warehouse.service] 상세 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고 상세 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      return data.data || data
    } catch (error) {
      console.error('[warehouse.service] getWarehouseById 에러:', error)
      throw error
    }
  }

  /**
   * 창고 등록
   * @param request - 창고 등록 요청 데이터
   * @returns 생성된 창고 정보
   */
  async createWarehouse(request: WarehouseRequest): Promise<Warehouse> {
    try {
      const url = WAREHOUSE_ENDPOINTS.create()
      console.log('[warehouse.service] 등록 요청:', { url, request })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[warehouse.service] 등록 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고 등록 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[warehouse.service] 등록 성공:', data)
      return data.data || data
    } catch (error) {
      console.error('[warehouse.service] createWarehouse 에러:', error)
      throw error
    }
  }

  /**
   * 창고 수정
   * @param id - 창고 ID
   * @param request - 창고 수정 요청 데이터
   * @returns 수정된 창고 정보
   */
  async updateWarehouse(id: number, request: WarehouseRequest): Promise<Warehouse> {
    try {
      const url = WAREHOUSE_ENDPOINTS.update(id)
      console.log('[warehouse.service] 수정 요청:', { url, id, request })

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[warehouse.service] 수정 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고 수정 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[warehouse.service] 수정 성공:', data)
      return data.data || data
    } catch (error) {
      console.error('[warehouse.service] updateWarehouse 에러:', error)
      throw error
    }
  }

  /**
   * 창고 삭제
   * @param id - 창고 ID
   */
  async deleteWarehouse(id: number): Promise<void> {
    try {
      const url = WAREHOUSE_ENDPOINTS.delete(id)
      console.log('[warehouse.service] 삭제 요청:', { url, id })

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[warehouse.service] 삭제 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`창고 삭제 실패: ${response.status} - ${errorText}`)
      }

      console.log('[warehouse.service] 삭제 성공')
    } catch (error) {
      console.error('[warehouse.service] deleteWarehouse 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const warehouseService = new WarehouseService()
