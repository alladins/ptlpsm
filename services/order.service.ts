import { apiEnvironment, getAuthHeaders } from '~/services/api'
import type { OrderDetailResponse } from '~/types/order'
import type { MobileOrderRequest } from '~/types/mobile-order'
import { ORDER_ENDPOINTS } from './api/endpoints/order.endpoints'
import { getApiBaseUrl } from './api/config'

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
  projectName?: string  // 사업명 (프로젝트명) — 발주 선택 모달 검색용
  keyword?: string  // 검색어 (프로젝트명, 담당자명 등)
  status?: string  // 주문 상태 (PENDING/IN_PROGRESS/PENDING_SIGNATURE/COMPLETED)
  salesId?: number
  page?: number
  size?: number
  sort?: string
  shippableOnly?: boolean  // 출하 가능한 발주만 조회
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
      if (params.projectName) queryParams.append('projectName', params.projectName)
      if (params.keyword) queryParams.append('keyword', params.keyword)
      if (params.status) queryParams.append('status', params.status)
      if (params.salesId) queryParams.append('salesId', params.salesId.toString())
      if (params.shippableOnly) queryParams.append('shippableOnly', 'true')

      // 페이징 파라미터 (Spring은 0-based)
      const page = params.page ?? 0
      const size = params.size || 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      // 정렬 파라미터
      if (params.sort) queryParams.append('sort', params.sort)

      const url = `${ORDER_ENDPOINTS.list()}?${queryParams.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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
      console.error('❌ [getOrders] 발주 목록 조회 실패:', error)
      // 개발 환경에서는 빈 응답 반환
      return {
        content: [],
        totalElements: 0,
        totalPages: 1,
        size: 10,
        number: 0
      }
    }
  },

  /**
   * 납품요구 목록 엑셀 다운로드 (검색 조건 연동, 페이징 미적용 전체 행)
   * - JWT 인증 헤더 필수 (getAuthHeaders) → blob 으로 직접 다운로드
   */
  async exportExcel(params: OrderSearchRequest = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.client) queryParams.append('client', params.client)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.status) queryParams.append('status', params.status)
    if (params.salesId) queryParams.append('salesId', params.salesId.toString())
    if (params.sort) queryParams.append('sort', params.sort)

    const url = `${ORDER_ENDPOINTS.exportExcel()}?${queryParams.toString()}`
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 실패: ${response.status}`)
    }

    return response.blob()
  },

  /**
   * 납품요구 금액 합계 조회 (검색 조건 연동)
   */
  async getOrderSummary(params: OrderSearchRequest = {}): Promise<{ totalAmount: number }> {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.client) queryParams.append('client', params.client)
      if (params.projectName) queryParams.append('projectName', params.projectName)
      if (params.keyword) queryParams.append('keyword', params.keyword)
      if (params.status) queryParams.append('status', params.status)
      if (params.salesId) queryParams.append('salesId', params.salesId.toString())

      const url = `${ORDER_ENDPOINTS.summary()}?${queryParams.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ [getOrderSummary] 납품요구 금액 합계 조회 실패:', error)
      return { totalAmount: 0 }
    }
  },

  /**
   * 기준번호(base) family 목록 조회 (본계약-변경계약 트리 보강용)
   * 현재 목록 페이지에 등장한 납품요구번호의 기준번호 집합을 받아 같은 family 전체를 반환한다.
   */
  async getOrdersByBases(bases: string[]): Promise<OrderDetailResponse[]> {
    // 빈 배열이면 호출 생략
    const uniqueBases = Array.from(new Set((bases || []).filter(Boolean)))
    if (uniqueBases.length === 0) {
      return []
    }
    try {
      const queryParams = new URLSearchParams()
      // Spring @RequestParam List<String> 은 콤마 구분 또는 반복 파라미터 모두 허용
      queryParams.append('bases', uniqueBases.join(','))

      const url = `${ORDER_ENDPOINTS.families()}?${queryParams.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      // 백엔드는 List<OrderResponse> 를 그대로 반환
      if (Array.isArray(result)) {
        return result as OrderDetailResponse[]
      }
      if (Array.isArray(result?.data)) {
        return result.data as OrderDetailResponse[]
      }
      return []
    } catch (error) {
      console.error('❌ [getOrdersByBases] family 조회 실패:', error)
      return []
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

      // 페이징 파라미터 (Spring은 0-based)
      const page = params.page ?? 0
      const size = params.size || 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      const url = `${ORDER_ENDPOINTS.search()}?${queryParams.toString()}`
      console.log('API 호출 URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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
   * 원본 조달청 발주서 PDF 를 새 탭에서 미리보기
   * - 인증 헤더 필요로 직접 링크 불가 → fetch 후 Blob URL 생성
   * - 404 시 사용자에게 "원본 PDF 미등록 발주" 안내
   */
  async openOriginalPdf(orderId: number): Promise<void> {
    const url = ORDER_ENDPOINTS.originalPdf(orderId)
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    if (response.status === 404) {
      throw new Error('이 발주에는 원본 PDF 가 등록되어 있지 않습니다.')
    }
    if (!response.ok) {
      throw new Error(`원본 PDF 를 불러오지 못했습니다 (status ${response.status}).`)
    }
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const opened = window.open(blobUrl, '_blank')
    if (!opened) {
      // 팝업 차단 시 같은 탭으로 폴백
      window.location.href = blobUrl
    }
    // Blob URL 은 새 탭이 PDF 를 충분히 로드한 뒤 해제
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
  },

  /**
   * 발주 상세 정보 조회
   */
  async getOrderDetail(orderId: number): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.detail(orderId)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
  },

  /**
   * 변경계약/추가계약 생성
   */
  async createAmendment(orderId: number, contractType: string, formData: FormData): Promise<OrderDetailResponse> {
    try {
      const url = ORDER_ENDPOINTS.createAmendment(orderId)
      const queryParams = new URLSearchParams()
      queryParams.append('contractType', contractType)

      const response = await fetch(`${url}?${queryParams.toString()}`, {
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
      console.error('변경계약 생성 실패:', error)
      throw error
    }
  }
}