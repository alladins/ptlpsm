/**
 * 출고요청 관리 API 서비스
 *
 * @created 2026-02-09
 * @description 출고요청 CRUD 및 상태 관리 기능 제공
 */

import { getAuthHeaders } from './api'
import { DISPATCH_REQUEST_ENDPOINTS } from './api/endpoints/dispatch-request.endpoints'
import type {
  DispatchAvailabilityResponse,
  DispatchRequest,
  DispatchRequestCreateInput,
  DispatchRequestListFilter,
  InventoryStatusResponse
} from '~/types/dispatch-request'

/**
 * 출고요청 서비스 클래스
 */
class DispatchRequestService {
  /**
   * 출고요청 목록 조회
   * @param filter - 검색 필터
   * @returns 출고요청 목록
   */
  async getDispatchRequestList(filter: DispatchRequestListFilter): Promise<{
    content: DispatchRequest[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()

      // 페이징 파라미터
      queryParams.append('page', (filter.page ?? 0).toString())
      queryParams.append('size', (filter.size ?? 10).toString())

      // 선택적 파라미터
      if (filter.shipmentId !== undefined) {
        queryParams.append('shipmentId', filter.shipmentId.toString())
      }
      if (filter.oemCompanyId !== undefined) {
        queryParams.append('oemCompanyId', filter.oemCompanyId.toString())
      }
      if (filter.status) {
        queryParams.append('status', filter.status)
      }
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate)
      }
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate)
      }

      const url = `${DISPATCH_REQUEST_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('[dispatch-request.service] 목록 조회 요청:', { url, filter })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 목록 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()

      // 서버 응답이 배열인 경우 페이지네이션 형식으로 변환
      if (Array.isArray(data)) {
        return {
          content: data,
          totalElements: data.length,
          totalPages: 1,
          pageNumber: 0,
          pageSize: data.length
        }
      }

      return {
        content: data.content || [],
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        pageNumber: data.number ?? 0,
        pageSize: data.size ?? 10
      }
    } catch (error) {
      console.error('[dispatch-request.service] 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 출고요청 상세 조회
   * @param id - 출고요청 ID
   * @returns 출고요청 상세 정보
   */
  async getDispatchRequestById(id: number): Promise<DispatchRequest> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.detail(id)
      console.log('[dispatch-request.service] 상세 조회:', { id, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 상세 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 상세 조회 실패: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[dispatch-request.service] getDispatchRequestById 에러:', error)
      throw error
    }
  }

  /**
   * 출하 ID로 출고요청 조회
   * @param shipmentId - 출하 ID
   * @returns 해당 출하의 출고요청 (없으면 null)
   */
  async getDispatchRequestByShipmentId(shipmentId: number): Promise<DispatchRequest | null> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.byShipment(shipmentId)
      console.log('[dispatch-request.service] 출하별 조회:', { shipmentId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (response.status === 404) {
        // 출고요청 없음
        return null
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 출하별 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 조회 실패: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[dispatch-request.service] getDispatchRequestByShipmentId 에러:', error)
      throw error
    }
  }

  /**
   * OEM 재고/발주서 가용성 확인
   * @param shipmentId - 출하 ID
   * @param oemCompanyId - OEM 제조사 ID
   * @returns 가용성 확인 결과
   */
  async checkAvailability(shipmentId: number, oemCompanyId: number): Promise<DispatchAvailabilityResponse> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.checkAvailability(shipmentId, oemCompanyId)
      console.log('[dispatch-request.service] 가용성 확인 요청:', { shipmentId, oemCompanyId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 가용성 확인 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`가용성 확인 실패: ${response.status} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[dispatch-request.service] checkAvailability 에러:', error)
      throw error
    }
  }

  /**
   * 출하 품목 재고 현황 확인 (출고요청 사전 체크)
   * @param shipmentId - 출하 ID
   * @returns 재고 현황 확인 결과
   */
  async checkInventoryStatus(shipmentId: number, physicalOnly?: boolean): Promise<InventoryStatusResponse> {
    let url = DISPATCH_REQUEST_ENDPOINTS.inventoryStatus(shipmentId)
    if (physicalOnly) {
      url += '?physicalOnly=true'
    }
    console.log('[dispatch-request.service] 재고 현황 확인 요청:', { shipmentId, physicalOnly, url })

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[dispatch-request.service] 재고 현황 확인 실패:', {
        status: response.status,
        error: errorText
      })
      throw new Error(`재고 현황 확인 실패: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 출고요청 생성
   * @param input - 출고요청 생성 요청 데이터
   * @returns 생성된 출고요청 정보
   */
  async createDispatchRequest(input: DispatchRequestCreateInput): Promise<DispatchRequest> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.create()
      console.log('[dispatch-request.service] 생성 요청:', { url, input })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 생성 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 생성 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[dispatch-request.service] 생성 성공:', data)
      return data
    } catch (error) {
      console.error('[dispatch-request.service] createDispatchRequest 에러:', error)
      throw error
    }
  }

  /**
   * 출고요청 확인
   * @param id - 출고요청 ID
   * @returns 확인된 출고요청 정보
   */
  async confirmDispatchRequest(id: number): Promise<DispatchRequest> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.confirm(id)
      console.log('[dispatch-request.service] 확인 요청:', { id, url })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 확인 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 확인 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[dispatch-request.service] 확인 성공:', data)
      return data
    } catch (error) {
      console.error('[dispatch-request.service] confirmDispatchRequest 에러:', error)
      throw error
    }
  }

  /**
   * 발송처리 (재고 차감 포함)
   * @param id - 출고요청 ID
   * @returns 발송처리된 출고요청 정보
   */
  async dispatchAndDeductStock(id: number): Promise<DispatchRequest> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.dispatch(id)
      console.log('[dispatch-request.service] 발송처리 요청:', { id, url })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 발송처리 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발송처리 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[dispatch-request.service] 발송처리 성공:', data)
      return data
    } catch (error) {
      console.error('[dispatch-request.service] dispatchAndDeductStock 에러:', error)
      throw error
    }
  }

  /**
   * 출고요청 삭제
   * @param id - 출고요청 ID
   */
  async deleteDispatchRequest(id: number): Promise<void> {
    try {
      const url = DISPATCH_REQUEST_ENDPOINTS.delete(id)
      console.log('[dispatch-request.service] 삭제 요청:', { id, url })

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[dispatch-request.service] 삭제 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`출고요청 삭제 실패: ${response.status} - ${errorText}`)
      }

      console.log('[dispatch-request.service] 삭제 성공')
    } catch (error) {
      console.error('[dispatch-request.service] deleteDispatchRequest 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const dispatchRequestService = new DispatchRequestService()
