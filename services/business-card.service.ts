/**
 * 명함관리 서비스
 */

import { BUSINESS_CARD_ENDPOINTS } from './api/endpoints/business-card.endpoints'
import { getAuthHeaders } from './api'

// ==================== 타입 정의 ====================

export interface BusinessCardSearchRequest {
  dminsttCd?: string
  dminsttNm?: string
  contactNm?: string
  keyword?: string
  page?: number
  size?: number
}

export interface BusinessCardResponse {
  cardId: number
  dminsttCd: string
  dminsttNm: string
  contactNm: string
  contactTel: string
  contactEmail: string
  memo: string
  ownerId: number
  ownerName: string
  useYn: string
  createdAt: string
  updatedAt: string
}

export interface BusinessCardRequest {
  dminsttCd?: string
  dminsttNm: string
  contactNm: string
  contactTel?: string
  contactEmail?: string
  memo?: string
}

export interface BusinessCardPageResponse {
  content: BusinessCardResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ==================== 서비스 ====================

export const businessCardService = {
  /**
   * 명함 목록 조회
   */
  async getBusinessCardList(params: BusinessCardSearchRequest = {}): Promise<BusinessCardPageResponse> {
    const queryParams = new URLSearchParams()

    if (params.dminsttCd) queryParams.append('dminsttCd', params.dminsttCd)
    if (params.dminsttNm) queryParams.append('dminsttNm', params.dminsttNm)
    if (params.contactNm) queryParams.append('contactNm', params.contactNm)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${BUSINESS_CARD_ENDPOINTS.list()}?${queryParams.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`명함 목록 조회 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 명함 상세 조회
   */
  async getBusinessCardById(id: number): Promise<BusinessCardResponse> {
    const response = await fetch(BUSINESS_CARD_ENDPOINTS.detail(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`명함 상세 조회 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 기관별 명함 조회 (선택 모달용)
   */
  async getBusinessCardsByOrg(params: BusinessCardSearchRequest = {}): Promise<BusinessCardPageResponse> {
    const queryParams = new URLSearchParams()

    if (params.dminsttCd) queryParams.append('dminsttCd', params.dminsttCd)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${BUSINESS_CARD_ENDPOINTS.byOrg()}?${queryParams.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`기관별 명함 조회 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 명함 등록
   */
  async createBusinessCard(data: BusinessCardRequest): Promise<BusinessCardResponse> {
    const response = await fetch(BUSINESS_CARD_ENDPOINTS.create(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `명함 등록 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 명함 수정
   */
  async updateBusinessCard(id: number, data: BusinessCardRequest): Promise<BusinessCardResponse> {
    const response = await fetch(BUSINESS_CARD_ENDPOINTS.update(id), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `명함 수정 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 명함 삭제
   */
  async deleteBusinessCard(id: number): Promise<void> {
    const response = await fetch(BUSINESS_CARD_ENDPOINTS.delete(id), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`명함 삭제 실패: ${response.status}`)
    }
  },

  /**
   * 명함 자동 저장 (견적서/영업일지에서 호출)
   */
  async autoSave(data: BusinessCardRequest): Promise<void> {
    const response = await fetch(BUSINESS_CARD_ENDPOINTS.autoSave(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.warn('명함 자동 저장 실패:', response.status)
    }
  },
}
