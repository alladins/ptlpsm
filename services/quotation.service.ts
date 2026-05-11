/**
 * 견적관리 서비스
 */

import { QUOTATION_ENDPOINTS } from './api/endpoints/quotation.endpoints'
import { getAuthHeaders } from './api'

// ==================== 타입 정의 ====================

export interface QuotationSearchRequest {
  startDate?: string
  endDate?: string
  clientName?: string
  projectName?: string
  status?: string
  keyword?: string
  page?: number
  size?: number
}

export interface QuotationListResponse {
  quotationId: number
  quotationNo: string
  submitDate: string
  clientName: string
  projectName: string
  totalAmount: number
  status: string
  createdByName: string
  sentAt: string | null
  createdAt: string
}

export interface QuotationItem {
  qiId?: number
  quotationId?: number
  sortOrder?: number
  identificationNo?: string
  itemName: string
  specification?: string
  quantity?: number
  unitPrice?: number
  estimatePrice?: number
  remark?: string
  skuId?: string
}

export interface Quotation {
  quotationId: number
  quotationNo: string
  submitDate: string
  projectName: string
  clientCode: string
  clientName: string
  clientManager: string
  clientTel: string
  clientEmail: string
  companyId: number
  managerId: number
  totalAmount: number
  noteContent: string
  pdfPath: string
  status: string
  sentAt: string | null
  sentTo: string | null
  salesId: number
  createdBy: number
  createdByName: string
  createdAt: string
  updatedAt: string
  items: QuotationItem[]
}

export interface QuotationRequest {
  submitDate?: string
  projectName?: string
  clientCode?: string
  clientName?: string
  clientManager?: string
  clientTel?: string
  clientEmail?: string
  noteContent?: string
  salesId?: number
  items?: QuotationItem[]
}

export interface QuotationPageResponse {
  content: QuotationListResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

// ==================== 서비스 ====================

export const quotationService = {
  /**
   * 견적서 목록 조회
   */
  async getQuotationList(params: QuotationSearchRequest = {}): Promise<QuotationPageResponse> {
    const queryParams = new URLSearchParams()

    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.clientName) queryParams.append('clientName', params.clientName)
    if (params.projectName) queryParams.append('projectName', params.projectName)
    if (params.status) queryParams.append('status', params.status)
    if (params.keyword) queryParams.append('keyword', params.keyword)
    if (params.page !== undefined) queryParams.append('page', params.page.toString())
    if (params.size !== undefined) queryParams.append('size', params.size.toString())

    const url = `${QUOTATION_ENDPOINTS.list()}?${queryParams.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 목록 조회 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 견적서 상세 조회
   */
  async getQuotationById(id: number): Promise<Quotation> {
    const response = await fetch(QUOTATION_ENDPOINTS.detail(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 상세 조회 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 견적서 등록
   */
  async createQuotation(data: QuotationRequest): Promise<Quotation> {
    const response = await fetch(QUOTATION_ENDPOINTS.create(), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`견적서 등록 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 견적서 수정
   */
  async updateQuotation(id: number, data: QuotationRequest): Promise<Quotation> {
    const response = await fetch(QUOTATION_ENDPOINTS.update(id), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`견적서 수정 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * 견적서 삭제
   */
  async deleteQuotation(id: number): Promise<void> {
    const response = await fetch(QUOTATION_ENDPOINTS.delete(id), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 삭제 실패: ${response.status}`)
    }
  },

  /**
   * PDF 생성
   */
  async generatePdf(id: number): Promise<Quotation> {
    const response = await fetch(QUOTATION_ENDPOINTS.generatePdf(id), {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 PDF 생성 실패: ${response.status}`)
    }

    return await response.json()
  },

  /**
   * PDF 미리보기 (새 탭에서 브라우저 PDF 뷰어로 표시)
   */
  async previewPdf(id: number): Promise<void> {
    const response = await fetch(QUOTATION_ENDPOINTS.downloadPdf(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 PDF 미리보기 실패: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
  },

  /**
   * PDF 다운로드
   */
  async downloadPdf(id: number): Promise<void> {
    const response = await fetch(QUOTATION_ENDPOINTS.downloadPdf(id), {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`견적서 PDF 다운로드 실패: ${response.status}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Content-Disposition에서 파일명 추출
    const disposition = response.headers.get('Content-Disposition')
    let filename = '견적서.pdf'
    if (disposition) {
      const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/)
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1])
      }
    }

    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  /**
   * 이메일 발송
   */
  async sendEmail(id: number, data?: { subject: string, body: string, companyFileIds?: number[] }): Promise<void> {
    const response = await fetch(QUOTATION_ENDPOINTS.sendEmail(id), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`견적서 이메일 발송 실패: ${response.status}`)
    }
  },
}
