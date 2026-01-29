import { apiEnvironment, getAuthHeaders } from './api'
import { demandOrganizationService } from './demand-organization.service'
import { SALES_ENDPOINTS } from './api/endpoints/sales.endpoints'
import { codeService } from './code.service'

// MIGRATED: 2025-01-25 - URL을 SALES_ENDPOINTS로 이전

// 영업관리 타입 정의
export interface Sales {
  id?: number
  customerNm: string
  customerTel?: string
  customerEmail?: string
  salesTitle: string
  salesContent?: string
  contractAmount?: number // 계약금액
  salesStatus: string
  expectedDeliveryDate?: string // 예상납품요구일
  expectedDeliveryDeadline?: string // 예상상납품기한
  contractFilePath?: string
  contractFileNm?: string
  contractFileSize?: number
  dminsttCd?: string // 수요기관코드
  dminsttNm?: string // 수요기관명
  delYn?: string // 삭제여부
  useYn: string
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  remark?: string
}

export interface SalesSearchRequest {
  keyword?: string
  customerNm?: string
  salesTitle?: string
  salesStatus?: string
  expectedDeliveryDateFrom?: string
  expectedDeliveryDateTo?: string
  expectedDeliveryDeadlineFrom?: string
  expectedDeliveryDeadlineTo?: string
  useYn?: string
  page?: number
  size?: number
}

export interface SalesListResponse {
  content: Sales[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface SalesRequest {
  customerNm: string
  customerTel?: string
  customerEmail?: string
  salesTitle: string
  salesContent?: string
  contractAmount?: number // 계약금액
  salesStatus?: string
  expectedDeliveryDate?: string // 예상납품요구일
  expectedDeliveryDeadline?: string // 예상상납품기한
  dminsttCd?: string // 수요기관코드
  dminsttNm?: string // 수요기관명
  remark?: string
  useYn?: string
}

export interface SalesUpdateRequest {
  customerNm?: string
  customerTel?: string
  customerEmail?: string
  salesTitle?: string
  salesContent?: string
  contractAmount?: number // 계약금액
  salesStatus?: string
  expectedDeliveryDate?: string // 예상납품요구일
  expectedDeliveryDeadline?: string // 예상납품기한
  dminsttCd?: string // 수요기관코드
  dminsttNm?: string // 수요기관명
  useYn?: string
  remark?: string
}

// 품목 관리 타입 정의
export interface SalesItem {
  id?: number
  salesId: number
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  itemSpecification?: string
  unit?: string
  unitPrice: number
  quantity: number
  amount: number // 금액 (단가 * 수량)
  sortOrder?: number
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
}

export interface SalesItemRequest {
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  itemSpecification?: string
  unit?: string
  unitPrice: number
  quantity: number
  sortOrder?: number
}

// 이력 관리 타입 정의
export interface SalesHistory {
  id?: number
  salesId: number
  changeType: 'CONTENT' | 'STATUS' | 'AMOUNT'
  beforeValue?: string
  afterValue?: string
  changeReason?: string
  createdBy?: string
  createdAt?: string
}

export const salesService = {
  /**
   * API 연결 상태 확인
   */
  async checkApiConnection(): Promise<boolean> {
    try {
      const baseUrl = apiEnvironment.getApiBaseUrl()
      console.log('🔍 영업관리 API 연결 확인:', baseUrl)
      
      // 영업관리 API 엔드포인트
      const testUrl = `${SALES_ENDPOINTS.list()}?page=0&size=1`
      console.log('📡 테스트 URL:', testUrl)
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: getAuthHeaders(),
        })
        
        console.log('📊 API 응답 상태:', response.status, response.statusText)
        
        if (response.ok) {
          console.log('✅ 영업관리 API 연결 성공')
          return true
        }

        console.log('❌ 영업관리 API 연결 실패:', response.status, response.statusText)
        return false
      } catch (error) {
        console.log('❌ 영업관리 API 연결 오류:', error)
        return false
      }
    } catch (error) {
      console.error('🚨 영업관리 API 연결 확인 실패:', error)
      console.error('🔧 에러 상세:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      return false
    }
  },

  /**
   * 영업관리 목록 조회
   */
  async getSalesList(params: SalesSearchRequest = {}): Promise<SalesListResponse> {
    try {
      const baseUrl = apiEnvironment.getApiBaseUrl()
      console.log('🔍 영업관리 목록 조회 시작:', baseUrl)

      const queryParams = new URLSearchParams()
      
      // 검색 파라미터 추가
      if (params.keyword) queryParams.append('keyword', params.keyword)
      if (params.customerNm) queryParams.append('customerNm', params.customerNm)
      if (params.salesTitle) queryParams.append('salesTitle', params.salesTitle)
      if (params.salesStatus) queryParams.append('salesStatus', params.salesStatus)
      
      // 날짜 형식 처리 (ISO 8601)
      if (params.expectedDeliveryDateFrom) {
        const date = new Date(params.expectedDeliveryDateFrom)
        queryParams.append('expectedDeliveryDateFrom', date.toISOString())
      }
      if (params.expectedDeliveryDateTo) {
        const date = new Date(params.expectedDeliveryDateTo)
        date.setHours(23, 59, 59, 999) // 종료일은 해당일의 마지막 시간으로 설정
        queryParams.append('expectedDeliveryDateTo', date.toISOString())
      }
      if (params.expectedDeliveryDeadlineFrom) {
        const date = new Date(params.expectedDeliveryDeadlineFrom)
        queryParams.append('expectedDeliveryDeadlineFrom', date.toISOString())
      }
      if (params.expectedDeliveryDeadlineTo) {
        const date = new Date(params.expectedDeliveryDeadlineTo)
        date.setHours(23, 59, 59, 999) // 종료일은 해당일의 마지막 시간으로 설정
        queryParams.append('expectedDeliveryDeadlineTo', date.toISOString())
      }
      
      if (params.useYn) queryParams.append('useYn', params.useYn)
      
      // 페이징 파라미터 기본값 처리
      const page = params.page !== undefined ? params.page : 0
      const size = params.size !== undefined ? params.size : 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      const url = `${SALES_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('📡 영업관리 목록 조회 URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      console.log('📊 영업관리 목록 조회 응답:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없습니다.')
        console.error('❌ 영업관리 목록 조회 실패:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        })
        throw new Error(`영업관리 목록 조회 실패: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 영업관리 목록 조회 성공:', result)
      
      
      
      return result
    } catch (error) {
      console.error('🚨 영업관리 목록 조회 오류:', error)
      console.error('🔧 에러 상세:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  },

  /**
   * 영업관리 상세 조회
   */
  async getSalesById(id: number): Promise<Sales> {
    try {
      const url = SALES_ENDPOINTS.detail(id)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`영업관리 상세 조회 실패: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      

      return result
    } catch (error) {
      console.error('영업관리 상세 조회 오류:', error)
      throw error
    }
  },

  /**
   * 영업관리 등록
   */
  async createSales(salesData: SalesRequest): Promise<Sales> {
    try {
      const url = SALES_ENDPOINTS.create()

      // 날짜 형식 처리 (ISO 8601)
      const processedData = {
        ...salesData,
        expectedDeliveryDate: salesData.expectedDeliveryDate ? new Date(salesData.expectedDeliveryDate).toISOString() : undefined,
        expectedDeliveryDeadline: salesData.expectedDeliveryDeadline ? new Date(salesData.expectedDeliveryDeadline).toISOString() : undefined,
      }
      
      console.log('📡 영업관리 등록 요청 URL:', url)
      console.log('📤 영업관리 등록 요청 데이터:', processedData)
      console.log('🔍 dminsttNm 필드 확인:', {
        dminsttCd: processedData.dminsttCd,
        dminsttNm: processedData.dminsttNm,
        hasDminsttNm: 'dminsttNm' in processedData,
        dminsttNmType: typeof processedData.dminsttNm
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(processedData),
      })

      console.log('📊 영업관리 등록 응답:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없습니다.')
        console.error('❌ 영업관리 등록 실패:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        })
        throw new Error(`영업관리 등록 실패: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 영업관리 등록 성공:', result)
      
      return result
    } catch (error) {
      console.error('🚨 영업관리 등록 오류:', error)
      console.error('🔧 에러 상세:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  },

  /**
   * 영업관리 수정
   */
  async updateSales(id: number, salesData: SalesUpdateRequest): Promise<Sales> {
    try {
      const url = SALES_ENDPOINTS.update(id)

      // 날짜 형식 처리 (ISO 8601)
      const processedData = {
        ...salesData,
        expectedDeliveryDate: salesData.expectedDeliveryDate ? new Date(salesData.expectedDeliveryDate).toISOString() : undefined,
        expectedDeliveryDeadline: salesData.expectedDeliveryDeadline ? new Date(salesData.expectedDeliveryDeadline).toISOString() : undefined,
      }
      
      console.log('📡 영업관리 수정 요청 URL:', url)
      console.log('📤 영업관리 수정 요청 데이터:', processedData)
      console.log('🔍 dminsttNm 필드 확인 (수정):', {
        dminsttCd: processedData.dminsttCd,
        dminsttNm: processedData.dminsttNm,
        hasDminsttNm: 'dminsttNm' in processedData,
        dminsttNmType: typeof processedData.dminsttNm
      })
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(processedData),
      })

      console.log('📊 영업관리 수정 응답:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없습니다.')
        console.error('❌ 영업관리 수정 실패:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        })
        throw new Error(`영업관리 수정 실패: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 영업관리 수정 성공:', result)
      
      return result
    } catch (error) {
      console.error('🚨 영업관리 수정 오류:', error)
      console.error('🔧 에러 상세:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  },

  /**
   * 영업관리 삭제
   */
  async deleteSales(id: number): Promise<void> {
    try {
      const url = SALES_ENDPOINTS.delete(id)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`영업관리 삭제 실패: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('영업관리 삭제 오류:', error)
      throw error
    }
  },

  /**
   * 계약서 파일 업로드
   */
  async uploadContractFile(id: number, file: File): Promise<Sales> {
    try {
      const url = SALES_ENDPOINTS.uploadContractFile(id)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`계약서 파일 업로드 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('계약서 파일 업로드 오류:', error)
      throw error
    }
  },

  /**
   * 계약서 파일 다운로드
   */
  async downloadContractFile(id: number): Promise<Blob> {
    try {
      const url = SALES_ENDPOINTS.contractFile(id)

      const response = await fetch(url, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error(`계약서 파일 다운로드 실패: ${response.status} ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('계약서 파일 다운로드 오류:', error)
      throw error
    }
  },

  /**
   * 영업상태 옵션 가져오기 (DB 기반)
   * SALES_STATUS 코드 그룹에서 한글 상태 코드 조회
   */
  async getSalesStatusOptions() {
    try {
      const response = await codeService.getCodeDetails('SALES_STATUS')
      return response.map((detail: any) => ({
        value: detail.code,
        label: detail.codeName
      }))
    } catch (error) {
      console.error('Failed to load sales status options:', error)
      // Fallback: 빈 배열 반환
      return []
    }
  },

  /**
   * 사용여부 옵션 가져오기
   */
  getUseYnOptions() {
    return [
      { value: 'Y', label: '사용' },
      { value: 'N', label: '미사용' },
    ]
  },



  /**
   * 품목 목록 조회
   */
  async getSalesItems(salesId: number): Promise<SalesItem[]> {
    try {
      const url = SALES_ENDPOINTS.items(salesId)
      console.log('📡 품목 목록 조회 URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        },
      })

      console.log('📊 품목 목록 조회 응답:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없습니다.')
        console.error('❌ 품목 목록 조회 실패:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        })
        throw new Error(`품목 목록 조회 실패: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ 품목 목록 조회 성공:', result)
      
      return result
    } catch (error) {
      console.error('🚨 품목 목록 조회 오류:', error)
      console.error('🔧 에러 상세:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  },

  /**
   * 품목 추가
   */
  async addSalesItem(salesId: number, itemData: SalesItemRequest): Promise<SalesItem> {
    try {
      const url = SALES_ENDPOINTS.createItem(salesId)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        throw new Error(`품목 추가 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('품목 추가 오류:', error)
      throw error
    }
  },

  /**
   * 품목 수정
   */
  async updateSalesItem(salesId: number, itemId: number, itemData: SalesItemRequest): Promise<SalesItem> {
    try {
      const url = SALES_ENDPOINTS.updateItem(salesId, itemId)

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })

      if (!response.ok) {
        throw new Error(`품목 수정 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('품목 수정 오류:', error)
      throw error
    }
  },

  /**
   * 품목 삭제
   */
  async deleteSalesItem(salesId: number, itemId: number): Promise<void> {
    try {
      const url = SALES_ENDPOINTS.deleteItem(salesId, itemId)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`품목 삭제 실패: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('품목 삭제 오류:', error)
      throw error
    }
  },

  /**
   * 영업관리 이력 조회
   */
  async getSalesHistory(salesId: number): Promise<SalesHistory[]> {
    try {
      const url = SALES_ENDPOINTS.history(salesId)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`이력 조회 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('이력 조회 오류:', error)
      throw error
    }
  },

  /**
   * 영업관리 복원
   */
  async restoreSales(salesId: number): Promise<Sales> {
    try {
      const url = SALES_ENDPOINTS.restore(salesId)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`영업관리 복원 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('영업관리 복원 오류:', error)
      throw error
    }
  },

  /**
   * 삭제된 영업관리 목록 조회
   */
  async getDeletedSalesList(params: SalesSearchRequest = {}): Promise<SalesListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // 검색 파라미터 추가
      if (params.keyword) queryParams.append('keyword', params.keyword)
      if (params.customerNm) queryParams.append('customerNm', params.customerNm)
      if (params.salesTitle) queryParams.append('salesTitle', params.salesTitle)
      if (params.salesStatus) queryParams.append('salesStatus', params.salesStatus)
      
      // 페이징 파라미터
      const page = params.page !== undefined ? params.page : 0
      const size = params.size !== undefined ? params.size : 10
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      const fullUrl = `${SALES_ENDPOINTS.deleted()}?${queryParams.toString()}`

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`삭제된 영업관리 목록 조회 실패: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('삭제된 영업관리 목록 조회 오류:', error)
      throw error
    }
  }
}
