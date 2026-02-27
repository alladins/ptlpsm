/**
 * OEM 지급 관리 API 서비스
 *
 * @created 2026-02-09
 * @description OEM 제조사 지급 CRUD 및 요약 조회 기능 제공
 */

import { getAuthHeaders } from './api'
import { PAYMENT_ENDPOINTS } from './api/endpoints/payment.endpoints'
import type {
  Payment,
  PaymentRequest,
  PaymentListFilter,
  PaymentSummary
} from '~/types/payment'

/**
 * 지급 서비스 클래스
 */
class PaymentService {
  /**
   * 지급 목록 조회
   * @param filter - 검색 필터
   * @returns 페이지네이션된 지급 목록
   */
  async getPaymentList(filter: PaymentListFilter): Promise<{
    content: Payment[]
    totalElements: number
    totalPages: number
    pageNumber: number
    pageSize: number
  }> {
    try {
      const queryParams = new URLSearchParams()

      // 필수 파라미터 (0-based pagination)
      queryParams.append('page', (filter.page ?? 0).toString())
      queryParams.append('size', (filter.size ?? 10).toString())

      // 선택적 파라미터
      if (filter.poId !== undefined && filter.poId !== null) {
        queryParams.append('poId', filter.poId.toString())
      }
      if (filter.oemCompanyId !== undefined && filter.oemCompanyId !== null) {
        queryParams.append('oemCompanyId', filter.oemCompanyId.toString())
      }
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate)
      }
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate)
      }

      const url = `${PAYMENT_ENDPOINTS.list()}?${queryParams.toString()}`
      console.log('[payment.service] 목록 조회 요청:', { url, method: 'GET', filter })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] 목록 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`지급 목록 조회 실패: ${response.status}`)
      }

      const data = await response.json()

      // 서버 응답이 배열로 오는 경우 페이지네이션 형식으로 변환
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
      console.error('[payment.service] 목록 조회 중 오류:', error)
      throw error
    }
  }

  /**
   * 지급 상세 조회
   * @param paymentId - 지급 ID
   * @returns 지급 상세 정보
   */
  async getPaymentById(paymentId: number): Promise<Payment> {
    try {
      const url = PAYMENT_ENDPOINTS.detail(paymentId)
      console.log('[payment.service] 상세 조회:', { paymentId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] 상세 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`지급 상세 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[payment.service] getPaymentById 에러:', error)
      throw error
    }
  }

  /**
   * 발주서별 지급 목록 조회
   * @param poId - 발주서 ID
   * @returns 해당 발주서의 지급 목록
   */
  async getPaymentsByPoId(poId: number): Promise<Payment[]> {
    try {
      const url = PAYMENT_ENDPOINTS.byPo(poId)
      console.log('[payment.service] 발주서별 지급 조회:', { poId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] 발주서별 지급 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`발주서별 지급 조회 실패: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : (data.content || [])
    } catch (error) {
      console.error('[payment.service] getPaymentsByPoId 에러:', error)
      throw error
    }
  }

  /**
   * 지급 등록
   * @param request - 지급 등록 요청 데이터
   * @returns 생성된 지급 정보
   */
  async createPayment(request: PaymentRequest): Promise<Payment> {
    try {
      const url = PAYMENT_ENDPOINTS.create()
      console.log('[payment.service] 등록 요청:', { url, method: 'POST', request })

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] 등록 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`지급 등록 실패: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[payment.service] 등록 성공:', data)
      return data
    } catch (error) {
      console.error('[payment.service] createPayment 에러:', error)
      throw error
    }
  }

  /**
   * 지급 삭제
   * @param paymentId - 지급 ID
   */
  async deletePayment(paymentId: number): Promise<void> {
    try {
      const url = PAYMENT_ENDPOINTS.delete(paymentId)
      console.log('[payment.service] 삭제 요청:', { url, method: 'DELETE', paymentId })

      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] 삭제 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`지급 삭제 실패: ${response.status} - ${errorText}`)
      }

      console.log('[payment.service] 삭제 성공')
    } catch (error) {
      console.error('[payment.service] deletePayment 에러:', error)
      throw error
    }
  }

  /**
   * OEM 제조사별 지급 요약 조회
   * @returns OEM 제조사별 지급 요약 목록
   */
  async getPaymentSummaryByOem(): Promise<PaymentSummary[]> {
    try {
      const url = PAYMENT_ENDPOINTS.summaryOem()
      console.log('[payment.service] OEM 지급 요약 조회:', { url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] OEM 지급 요약 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 지급 요약 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[payment.service] getPaymentSummaryByOem 에러:', error)
      throw error
    }
  }

  /**
   * 특정 OEM 제조사 지급 요약 조회
   * @param oemCompanyId - OEM 제조사 ID
   * @returns 해당 OEM 제조사의 지급 요약
   */
  async getPaymentSummaryByOemId(oemCompanyId: number): Promise<PaymentSummary> {
    try {
      const url = PAYMENT_ENDPOINTS.summaryOemById(oemCompanyId)
      console.log('[payment.service] OEM 제조사별 지급 요약 조회:', { oemCompanyId, url })

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[payment.service] OEM 제조사별 지급 요약 조회 실패:', {
          status: response.status,
          error: errorText
        })
        throw new Error(`OEM 제조사별 지급 요약 조회 실패: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[payment.service] getPaymentSummaryByOemId 에러:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 export
export const paymentService = new PaymentService()
