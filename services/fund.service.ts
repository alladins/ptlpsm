/**
 * 자금 관리 서비스
 *
 * CREATED DATE: 2025-12-09
 *
 * @description 자금 관리, 기성금 요청, 통계 관련 API 호출 서비스
 */

import { getLocalDateString } from '~/utils/format'
import { getAuthHeaders } from './api'
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
  OemPaymentCompleteRequest,
  // 자금 계산 요약
  FundSummary
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
   * 자금 계산 요약 조회
   * @description 총 계약금액, OEM 원가+배송비, 수금 금액 누계, 예상 원가금액 등 계산 필드 포함
   */
  async getFundSummary(fundId: number): Promise<FundSummary | null> {
    try {
      const url = FUND_ENDPOINTS.summary(fundId)
      console.log('자금 계산 요약 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('자금 계산 요약 조회 실패:', error)
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
   * 선급금 삭제
   * - 입금확인(PAID) 상태가 아닌 경우만 삭제 가능
   * - 삭제 시 PDF 파일도 함께 삭제됨
   */
  async deleteAdvance(fundId: number, advanceId: number): Promise<{ message: string }> {
    try {
      const url = FUND_ENDPOINTS.deleteAdvance(fundId, advanceId)
      console.log('선급금 삭제 API 호출:', url)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('선급금 삭제 실패:', error)
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
   * 잔금 등록 (progress_payment_requests에 BALANCE 레코드 생성)
   * - 납품완료 상태에서만 가능
   * - 승인 불필요, 바로 입금확인 가능
   * @returns 생성된 잔금 요청 정보 (requestId 포함)
   */
  async createBalancePayment(fundId: number, data: { amount: number; requestDate?: string; remarks?: string }): Promise<ProgressPaymentRequest> {
    try {
      const url = FUND_ENDPOINTS.createBalance(fundId)
      console.log('잔금 등록 API 호출:', url, data)

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fundId: fundId,
          requestAmount: data.amount,
          requestDate: data.requestDate || getLocalDateString(),
          remarks: data.remarks
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('잔금 등록 실패:', error)
      throw error
    }
  },

  /**
   * 잔금 입금확인 (Deprecated)
   * @deprecated 대신 createBalancePayment → confirmPayment 흐름 사용 권장
   */
  async confirmBalance(fundId: number, data: { paidAmount: number; paidDate: string; bankAccount?: string; remarks?: string }): Promise<void> {
    try {
      // 쿼리스트링으로 파라미터 전송 (백엔드 @RequestParam 대응)
      // 백엔드는 'paymentDate' 파라미터명 사용
      const queryParams = new URLSearchParams()
      queryParams.append('paymentDate', data.paidDate)
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
   * OEM 제조사 목록 조회 (해당 자금에 연결된 출하 기준)
   */
  async getOemCompanies(fundId: number): Promise<Array<{ companyId: number; companyName: string }>> {
    try {
      const url = FUND_ENDPOINTS.oemCompanies(fundId)
      console.log('OEM 제조사 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error('OEM 제조사 목록 조회 실패:', error)
      return []
    }
  },

  /**
   * OEM 지급 목록 조회
   */
  async getOemPayments(fundId: number): Promise<OemPayment[]> {
    try {
      const url = FUND_ENDPOINTS.oemPayments(fundId)
      console.log('OEM 지급 목록 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // 서버 응답을 프론트엔드 타입으로 변환하는 매핑 함수
      const mapServerToOemPayment = (item: any): OemPayment => ({
        oemPaymentId: item.paymentId || item.oemPaymentId || item.historyId,
        fundId: item.fundId,
        paymentId: item.requestId,
        paymentSeq: item.paymentSeq || 1,
        scheduledAmount: item.paymentAmount || item.scheduledAmount || 0,
        paidAmount: item.paidAmount || null,
        scheduledDate: item.paymentDate || item.scheduledDate || '',
        paidDate: item.paidDate || null,
        oemCompanyName: item.oemCompanyName,
        oemCompanyId: item.oemCompanyId,
        bankAccount: item.bankAccount,
        status: item.status || 'PENDING',  // 서버 상태값: PENDING | PAID
        remarks: item.remarks,
        createdAt: item.createdAt
      })

      // 배열 응답 처리
      if (Array.isArray(result)) {
        return result.map(mapServerToOemPayment)
      }

      // data 래핑 처리
      if (result.data) {
        const data = Array.isArray(result.data) ? result.data : []
        return data.map(mapServerToOemPayment)
      }

      // content 래핑 처리 (페이징)
      if (result.content) {
        return result.content.map(mapServerToOemPayment)
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
        headers: getAuthHeaders(),
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
   * OEM 지급 완료 처리 (입금확인)
   */
  async confirmOemPayment(fundId: number, oemPaymentId: number, data: OemPaymentCompleteRequest): Promise<OemPayment> {
    try {
      const url = FUND_ENDPOINTS.confirmOemPayment(fundId, oemPaymentId)
      console.log('OEM 입금확인 API 호출:', url, data)

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('OEM 입금확인 처리 실패:', error)
      throw error
    }
  },

  /**
   * OEM 지급 삭제
   * DELETE /admin/funds/{fundId}/oem-payments/{oemPaymentId}
   */
  async deleteOemPayment(fundId: number, oemPaymentId: number): Promise<void> {
    try {
      const url = FUND_ENDPOINTS.oemPaymentDetail(fundId, oemPaymentId)
      console.log('OEM 지급 삭제 API 호출:', url)

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('OEM 지급 삭제 실패:', error)
      throw error
    }
  },

  // ============ OEM 원가 재계산 ============

  /**
   * OEM 원가 재계산 미리보기 (DB 변경 없음)
   */
  async previewOemCostRecalculation(fundId: number): Promise<import('~/types/fund').OemCostRecalcPreview> {
    const url = FUND_ENDPOINTS.previewOemCostRecalculation(fundId)
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`재계산 미리보기 실패: ${response.status}`)
    }

    return response.json()
  },

  /**
   * OEM 원가 재계산 실행
   */
  async recalculateOemCost(fundId: number): Promise<any> {
    const url = FUND_ENDPOINTS.recalculateOemCost(fundId)
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`재계산 실패: ${response.status}`)
    }

    return response.json()
  },

  /**
   * 잔금 정보 조회
   */
  async getBalance(fundId: number): Promise<BalanceInfo | null> {
    try {
      const url = FUND_ENDPOINTS.createBalance(fundId)
      console.log('잔금 정보 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('잔금 정보 조회 실패:', error)
      return null
    }
  },

  /**
   * 잔금 신청
   */
  async requestBalance(fundId: number, data: BalanceCreateRequest): Promise<ProgressPaymentRequest> {
    try {
      const url = FUND_ENDPOINTS.createBalance(fundId)
      console.log('잔금 신청 API 호출:', url, data)

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('잔금 신청 실패:', error)
      throw error
    }
  },

  /**
   * 선급금 버튼 활성화 가능 여부 확인
   * GET /admin/funds/by-order/{orderId}/advance-payment-eligible
   */
  async checkAdvancePaymentEligible(orderId: number): Promise<{ eligible: boolean; reason: string; hasPdfFile: boolean; signedReceiptCount: number }> {
    try {
      const url = FUND_ENDPOINTS.advancePaymentEligible(orderId)
      console.log('선급금 버튼 활성화 조건 확인 API 호출:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (error) {
      console.error('선급금 버튼 활성화 조건 확인 실패:', error)
      return {
        eligible: false,
        reason: 'API 호출 실패',
        hasPdfFile: false,
        signedReceiptCount: 0
      }
    }
  }
}
