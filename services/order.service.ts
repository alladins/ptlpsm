import { apiEnvironment } from '~/services/api'
import type { OrderDetailResponse } from '~/types/order'
import { ORDER_ENDPOINTS } from './api/endpoints/order.endpoints'

// MIGRATED: 2025-01-25 - URL을 ORDER_ENDPOINTS로 이전

export interface OrderSearchResponse {
  content: OrderDetailResponse[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface OrderSearchRequest {
  startDate?: string
  endDate?: string
  contractId?: string
  client?: string
  salesId?: number
  page?: number
  size?: number
  sort?: string
}

export const orderService = {
  /**
   * 발주 목록 조회
   */
  async getOrders(params: OrderSearchRequest = {}): Promise<OrderSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      // 검색 파라미터 추가
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.contractId) queryParams.append('contractId', params.contractId)
      if (params.client) queryParams.append('client', params.client)
      if (params.salesId) queryParams.append('salesId', params.salesId.toString())

      // 페이징 파라미터
      const page = params.page || 1
      const size = params.size || 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      // 정렬 파라미터
      if (params.sort) queryParams.append('sort', params.sort)

      const url = `${ORDER_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('API 호출 URL:', url)
      
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
      
      // 백엔드 API 응답 구조 확인 및 처리
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      // 응답이 직접 페이징 데이터인 경우
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as OrderSearchResponse
      }
      
      // 응답이 ApiResponse 형태인 경우
      if (result.data) {
        return result.data
      }
      
      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('발주 목록 조회 실패:', error)
      // 개발 환경에서는 빈 응답 반환
      return {
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: 10,
        number: 1
      }
    }
  },

  /**
   * 발주번호로 검색
   */
  async searchOrders(params: {
    client?: string
    itemKeyword?: string
    page?: number
    size?: number
  } = {}): Promise<OrderSearchResponse> {
    try {
      const queryParams = new URLSearchParams()

      // 검색 파라미터 추가
      if (params.client) queryParams.append('client', params.client)
      if (params.itemKeyword) queryParams.append('itemKeyword', params.itemKeyword)

      // 페이징 파라미터
      const page = params.page || 1
      const size = params.size || 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      const url = `${ORDER_ENDPOINTS.search()}?${queryParams.toString()}`
      console.log('API 호출 URL:', url)
      
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
      
      // 백엔드 API 응답 구조 확인 및 처리
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      // 응답이 직접 페이징 데이터인 경우
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as OrderSearchResponse
      }
      
      // 응답이 ApiResponse 형태인 경우
      if (result.data) {
        return result.data
      }
      
      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('발주 목록 조회 실패:', error)
      // 개발 환경에서는 빈 응답 반환
      return {
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: 10,
        number: 1
      }
    }
  },

  /**
   * 발주 상세 정보 조회
   */
  async getOrderDetail(orderId: number): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.detail(orderId)
      
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
      
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      return result.data || result
    } catch (error) {
      console.error('발주 상세 정보 조회 실패:', error)
      throw error
    }
  },

  /**
   * 발주 등록
   */
  async createOrder(formData: FormData): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.create()
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      return result.data || result
    } catch (error) {
      console.error('발주 등록 실패:', error)
      throw error
    }
  },

  /**
   * 발주 수정
   */
  async updateOrder(orderId: number, formData: FormData): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.update(orderId)
      
      const response = await fetch(url, {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      return result.data || result
    } catch (error) {
      console.error('발주 수정 실패:', error)
      throw error
    }
  },

  /**
   * 발주 삭제
   */
  async deleteOrder(orderId: number): Promise<void> {
    try {
      const url = ORDER_ENDPOINTS.delete(orderId)
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
    } catch (error) {
      console.error('발주 삭제 실패:', error)
      throw error
    }
  },

  /**
   * PDF 파일 업로드 및 텍스트 추출
   */
  async uploadOrderPdf(file: File): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.uploadPdf()
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success === false) {
        throw new Error(result.message || 'API 호출 실패')
      }
      
      return result.data || result
    } catch (error) {
      console.error('PDF 업로드 실패:', error)
      throw error
    }
  }
}