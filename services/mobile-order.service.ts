/**
 * 모바일 주문 요청 서비스
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 현장소장 모바일 주문 요청 및 관리자 처리 관련 API 호출 서비스
 */

import { MOBILE_ORDER_ENDPOINTS } from './api/endpoints/mobile-order.endpoints'
import type {
  MobileOrderRequest,
  MobileOrderRequestListItem,
  MobileOrderRequestListResponse,
  MobileOrderCreateRequest,
  OrderRequestSearchParams,
  OrderRequestApproveRequest,
  OrderRequestRejectRequest
} from '~/types/mobile-order'

export const mobileOrderService = {
  // ============ 모바일 (현장소장용) ============

  /**
   * 내 주문 요청 목록 조회 (현장소장)
   */
  async getMyRequests(): Promise<MobileOrderRequestListItem[]> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.myRequests()
      console.log('내 요청 목록 API 호출:', url)

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
      console.error('내 요청 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * 주문 요청 생성 (현장소장)
   */
  async createRequest(data: MobileOrderCreateRequest): Promise<MobileOrderRequest> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.create()
      console.log('주문 요청 생성 API 호출:', url, data)

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
      console.error('주문 요청 생성 실패:', error)
      throw error
    }
  },

  /**
   * 주문 요청 상세 조회 (현장소장)
   */
  async getRequestDetail(requestId: number): Promise<MobileOrderRequest | null> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.detail(requestId)
      console.log('요청 상세 API 호출:', url)

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
      console.error('요청 상세 조회 실패:', error)
      return null
    }
  },

  // ============ 관리자용 ============

  /**
   * 전체 주문 요청 목록 조회 (관리자)
   */
  async getAllRequests(params: OrderRequestSearchParams = {}): Promise<MobileOrderRequestListResponse> {
    try {
      const queryParams = new URLSearchParams()

      // 검색 파라미터 추가
      if (params.search) queryParams.append('search', params.search)
      if (params.status) queryParams.append('status', params.status)
      if (params.urgency) queryParams.append('urgency', params.urgency)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)

      // 페이징 파라미터
      const page = params.page || 1
      const size = params.size || 20
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      // 정렬 파라미터
      if (params.sort) queryParams.append('sort', params.sort)

      const url = `${MOBILE_ORDER_ENDPOINTS.adminList()}?${queryParams.toString()}`
      console.log('관리자 요청 목록 API 호출:', url)

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
        return result as MobileOrderRequestListResponse
      }

      if (result.data) {
        return result.data
      }

      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('관리자 요청 목록 조회 실패:', error)
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
   * 주문 요청 상세 조회 (관리자)
   */
  async getAdminRequestDetail(requestId: number): Promise<MobileOrderRequest | null> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.adminDetail(requestId)
      console.log('관리자 요청 상세 API 호출:', url)

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
      console.error('관리자 요청 상세 조회 실패:', error)
      return null
    }
  },

  /**
   * 주문 요청 승인 (관리자)
   */
  async approveRequest(requestId: number, data: OrderRequestApproveRequest): Promise<MobileOrderRequest> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.approve(requestId)
      console.log('요청 승인 API 호출:', url, data)

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
      console.error('요청 승인 실패:', error)
      throw error
    }
  },

  /**
   * 주문 요청 반려 (관리자)
   */
  async rejectRequest(requestId: number, data: OrderRequestRejectRequest): Promise<MobileOrderRequest> {
    try {
      const url = MOBILE_ORDER_ENDPOINTS.reject(requestId)
      console.log('요청 반려 API 호출:', url, data)

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
      console.error('요청 반려 실패:', error)
      throw error
    }
  }
}
