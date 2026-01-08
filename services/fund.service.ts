/**
 * 자금 관리 서비스
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 자금 관리, 기성금 요청, 통계 관련 API 호출 서비스
 */

import { FUND_ENDPOINTS } from './api/endpoints/fund.endpoints'
import type {
  Fund,
  FundDetail,
  FundListItem,
  FundListResponse,
  FundSearchParams,
  FundCreateRequest,
  FundUpdateRequest,
  FundStatistics,
  FundStatisticsParams,
  ProgressPaymentRequest,
  PaymentListResponse,
  PaymentCreateRequest,
  // 선급금 관련
  AdvancePayment,
  AdvanceListResponse,
  AdvanceCreateRequest,
  AdvanceApproveRequest,
  AdvanceConfirmRequest,
  // 잔금 관련
  BalanceInfo,
  BalanceRequest,
  BalanceCreateRequest,
  BalanceApproveRequest,
  BalanceConfirmRequest,
  // OEM 지급 관련
  OemPayment,
  OemPaymentCreateRequest,
  OemPaymentCompleteRequest
} from '~/types/fund'

export const fundService = {
  /**
   * 자금 목록 조회
   */
  async getFunds(params: FundSearchParams = {}): Promise<FundListResponse> {
    try {
      const queryParams = new URLSearchParams()

      // 검색 파라미터 추가
      if (params.search) queryParams.append('search', params.search)
      if (params.deliveryRequestNo) queryParams.append('deliveryRequestNo', params.deliveryRequestNo)
      // projectName으로 통일 (siteName은 projectName으로 변환)
      const projectNameParam = params.projectName || params.siteName
      if (projectNameParam) queryParams.append('projectName', projectNameParam)
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)

      // 페이징 파라미터 (0-based)
      const page = params.page ?? 0
      const size = params.size || 20
      queryParams.append('page', page.toString())
      queryParams.append('size', size.toString())

      // 정렬 파라미터
      if (params.sort) queryParams.append('sort', params.sort)

      const url = `${FUND_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('자금 목록 API 호출:', url)

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

      // 응답 구조 처리
      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as FundListResponse
      }

      if (result.data) {
        return result.data
      }

      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('자금 목록 조회 실패:', error)
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
   * 자금 상세 조회
   */
  async getFundById(fundId: number): Promise<FundDetail | null> {
    try {
      const url = FUND_ENDPOINTS.detail(fundId)
      console.log('자금 상세 API 호출:', url)

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
      console.error('자금 상세 조회 실패:', error)
      return null
    }
  },

  /**
   * 주문 ID로 자금 정보 조회
   */
  async getFundByOrderId(orderId: number): Promise<Fund | null> {
    try {
      const url = FUND_ENDPOINTS.byOrder(orderId)
      console.log('주문별 자금 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 자금 정보가 없는 경우
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('주문별 자금 조회 실패:', error)
      return null
    }
  },

  /**
   * 자금 생성
   */
  async createFund(data: FundCreateRequest): Promise<Fund> {
    try {
      const url = FUND_ENDPOINTS.create()
      console.log('자금 생성 API 호출:', url)

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
      console.error('자금 생성 실패:', error)
      throw error
    }
  },

  /**
   * 자금 수정
   */
  async updateFund(fundId: number, data: FundUpdateRequest): Promise<Fund> {
    try {
      const url = FUND_ENDPOINTS.update(fundId)
      console.log('자금 수정 API 호출:', url)

      const response = await fetch(url, {
        method: 'PUT',
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
      console.error('자금 수정 실패:', error)
      throw error
    }
  },

  /**
   * 기성금 이력 조회
   */
  async getPayments(fundId: number): Promise<PaymentListResponse> {
    try {
      const url = FUND_ENDPOINTS.payments(fundId)
      console.log('기성금 이력 API 호출:', url)

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

      if (result.content && typeof result.totalElements !== 'undefined') {
        return result as PaymentListResponse
      }

      if (result.data) {
        return result.data
      }

      // 배열로 반환되는 경우 처리
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

      throw new Error('알 수 없는 API 응답 구조입니다.')
    } catch (error) {
      console.error('기성금 이력 조회 실패:', error)
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
   * 기성금 요청 생성
   */
  async requestPayment(fundId: number, data: PaymentCreateRequest): Promise<ProgressPaymentRequest> {
    try {
      const url = FUND_ENDPOINTS.createPayment(fundId)
      console.log('기성금 요청 API 호출:', url)

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
      console.error('기성금 요청 실패:', error)
      throw error
    }
  },

  /**
   * 기성금 승인
   */
  async approvePayment(fundId: number, paymentId: number): Promise<ProgressPaymentRequest> {
    try {
      const url = FUND_ENDPOINTS.approvePayment(fundId, paymentId)
      console.log('기성금 승인 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성금 승인 실패:', error)
      throw error
    }
  },

  /**
   * 자금 통계 조회
   */
  async getStatistics(params: FundStatisticsParams): Promise<FundStatistics | null> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('periodType', params.periodType)

      if (params.periodType === 'MONTHS' && params.months) {
        queryParams.append('months', params.months.toString())
      } else if (params.periodType === 'QUARTER') {
        if (params.year) queryParams.append('year', params.year.toString())
        if (params.quarter) queryParams.append('quarter', params.quarter.toString())
      } else if (params.periodType === 'YEAR' && params.year) {
        queryParams.append('year', params.year.toString())
      }

      const url = `${FUND_ENDPOINTS.statistics()}?${queryParams.toString()}`
      console.log('자금 통계 API 호출:', url)

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
      console.error('자금 통계 조회 실패:', error)
      return null
    }
  },

  // ============ 선급금 (Advance Payment) ============

  /**
   * 선급금 목록 조회
   */
  async getAdvances(fundId: number): Promise<AdvancePayment[]> {
    try {
      const url = FUND_ENDPOINTS.advances(fundId)
      console.log('선급금 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result
      }

      // data 래핑 처리
      if (result.data) {
        return Array.isArray(result.data) ? result.data : []
      }

      // content 래핑 처리 (페이징)
      if (result.content) {
        return result.content
      }

      return []
    } catch (error) {
      console.error('선급금 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * 선급금 신청
   */
  async requestAdvance(fundId: number, data: AdvanceCreateRequest): Promise<AdvancePayment> {
    try {
      const url = FUND_ENDPOINTS.createAdvance(fundId)
      console.log('선급금 신청 API 호출:', url, data)

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
      console.error('선급금 신청 실패:', error)
      throw error
    }
  },

  /**
   * 선급금 승인
   */
  async approveAdvance(fundId: number, advanceId: number, data: AdvanceApproveRequest): Promise<AdvancePayment> {
    try {
      const url = FUND_ENDPOINTS.approveAdvance(fundId, advanceId)
      console.log('선급금 승인 API 호출:', url, data)

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
      console.error('선급금 승인 실패:', error)
      throw error
    }
  },

  /**
   * 선급금 수금 확인
   * 백엔드가 @RequestParam으로 받으므로 쿼리스트링으로 전송
   */
  async confirmAdvance(fundId: number, advanceId: number, data: AdvanceConfirmRequest): Promise<AdvancePayment> {
    try {
      // 쿼리스트링으로 파라미터 전송 (백엔드 @RequestParam 대응)
      const queryParams = new URLSearchParams()
      queryParams.append('paymentDate', data.paymentDate)
      queryParams.append('paidAmount', data.paidAmount.toString())
      if (data.bankAccount) queryParams.append('bankAccount', data.bankAccount)
      if (data.remarks) queryParams.append('remarks', data.remarks)

      const url = `${FUND_ENDPOINTS.confirmAdvance(fundId, advanceId)}?${queryParams.toString()}`
      console.log('선급금 수금 확인 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('선급금 수금 확인 실패:', error)
      throw error
    }
  },

  /**
   * 선급금 문서 업로드
   */
  async uploadAdvanceDocument(fundId: number, advanceId: number, formData: FormData): Promise<any> {
    try {
      const url = FUND_ENDPOINTS.uploadAdvanceDocument(fundId, advanceId)
      console.log('선급금 문서 업로드 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        body: formData, // multipart/form-data
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('선급금 문서 업로드 실패:', error)
      throw error
    }
  },

  // ============ 잔금 (Balance) ============

  /**
   * 잔금 입금확인
   * - 잔금은 별도 신청/승인 프로세스 없음
   * - 납품완료 후 입금확인만 처리
   */
  async confirmBalance(fundId: number, data: { paidAmount: number; paidDate: string; bankAccount?: string; remarks?: string }): Promise<void> {
    try {
      // 쿼리스트링으로 파라미터 전송 (백엔드 @RequestParam 대응)
      const queryParams = new URLSearchParams()
      queryParams.append('paidDate', data.paidDate)
      queryParams.append('paidAmount', data.paidAmount.toString())
      if (data.bankAccount) queryParams.append('bankAccount', data.bankAccount)
      if (data.remarks) queryParams.append('remarks', data.remarks)

      const url = `${FUND_ENDPOINTS.confirmBalance(fundId)}?${queryParams.toString()}`
      console.log('잔금 입금확인 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('잔금 입금확인 실패:', error)
      throw error
    }
  },

  // ============ 기성금 수금 확인 (추가) ============

  /**
   * 기성금 수금 확인
   * 백엔드가 @RequestParam으로 받으므로 쿼리스트링으로 전송
   */
  async confirmPayment(fundId: number, paymentId: number, data: { paidAmount: number; paymentDate: string; bankAccount?: string; remarks?: string }): Promise<ProgressPaymentRequest> {
    try {
      // 쿼리스트링으로 파라미터 전송 (백엔드 @RequestParam 대응)
      const queryParams = new URLSearchParams()
      queryParams.append('paymentDate', data.paymentDate)
      queryParams.append('paidAmount', data.paidAmount.toString())
      if (data.bankAccount) queryParams.append('bankAccount', data.bankAccount)
      if (data.remarks) queryParams.append('remarks', data.remarks)

      const url = `${FUND_ENDPOINTS.confirmPayment(fundId, paymentId)}?${queryParams.toString()}`
      console.log('기성금 수금 확인 API 호출:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('기성금 수금 확인 실패:', error)
      throw error
    }
  },

  // ============ OEM 지급 (OEM Payments) ============

  /**
   * OEM 지급 목록 조회
   */
  async getOemPayments(fundId: number): Promise<OemPayment[]> {
    try {
      const url = FUND_ENDPOINTS.oemPayments(fundId)
      console.log('OEM 지급 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result
      }

      // data 래핑 처리
      if (result.data) {
        return Array.isArray(result.data) ? result.data : []
      }

      // content 래핑 처리 (페이징)
      if (result.content) {
        return result.content
      }

      return []
    } catch (error) {
      console.error('OEM 지급 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * OEM 지급 등록
   */
  async createOemPayment(fundId: number, data: OemPaymentCreateRequest): Promise<OemPayment> {
    try {
      const url = FUND_ENDPOINTS.createOemPayment(fundId)
      console.log('OEM 지급 등록 API 호출:', url, data)

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
      console.error('OEM 지급 등록 실패:', error)
      throw error
    }
  },

  /**
   * OEM 지급 완료 처리
   */
  async completeOemPayment(fundId: number, oemPaymentId: number, data: OemPaymentCompleteRequest): Promise<OemPayment> {
    try {
      const url = FUND_ENDPOINTS.completeOemPayment(fundId, oemPaymentId)
      console.log('OEM 지급 완료 API 호출:', url, data)

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
      console.error('OEM 지급 완료 처리 실패:', error)
      throw error
    }
  }
}
