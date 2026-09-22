/**
 * OEM 월별 매출원장 API 서비스
 */

import { getAuthHeaders, apiEnvironment } from './api'
import { httpError } from '~/utils/apiError'
import type {
  OemMonthlyLedgerResponse,
  OemLedgerPaymentRequest,
  OemLedgerPendingItem
} from '~/types/oem-ledger'

class OemLedgerService {
  private getBaseUrl(): string {
    return `${apiEnvironment.getApiBaseUrl()}/admin/oem/ledger`
  }

  /**
   * 월별 매출원장 조회
   */
  async getMonthlyLedger(oemCompanyId: number | null, yearMonth: string): Promise<OemMonthlyLedgerResponse> {
    const params = new URLSearchParams({ yearMonth })
    if (oemCompanyId) {
      params.set('oemCompanyId', oemCompanyId.toString())
    }
    const response = await fetch(`${this.getBaseUrl()}?${params}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  /**
   * 월별 매출원장 엑셀 다운로드 (원장 + 원가이력 2시트)
   */
  async exportExcel(oemCompanyId: number | null, yearMonth: string): Promise<Blob> {
    const params = new URLSearchParams({ yearMonth })
    if (oemCompanyId) {
      params.set('oemCompanyId', oemCompanyId.toString())
    }
    const response = await fetch(`${this.getBaseUrl()}/export?${params}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw httpError(response.status, '엑셀 다운로드')
    return response.blob()
  }

  /**
   * 조회 가능 월 목록
   */
  async getAvailableMonths(oemCompanyId: number): Promise<string[]> {
    const params = new URLSearchParams({
      oemCompanyId: oemCompanyId.toString()
    })
    const response = await fetch(`${this.getBaseUrl()}/months?${params}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  /**
   * 지급 요청
   */
  async createPaymentRequest(request: OemLedgerPaymentRequest): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }

  /**
   * 확인 대기 청구 목록 (관리자 전용)
   *
   * ★ 제조사 계정으로 부르면 403 이다. 전 제조사의 청구 금액이 담기는 목록이라
   *   SecurityConfig 에서 OEM_MANAGER 를 막아 뒀다. 화면에서 관리자일 때만 호출할 것.
   */
  async getPendingPaymentRequests(): Promise<OemLedgerPendingItem[]> {
    const response = await fetch(`${this.getBaseUrl()}/payment-requests/pending`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  /**
   * 지급 확인 (관리자)
   */
  async confirmPaymentRequest(paymentId: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}/confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }

  /**
   * 지급 확인 취소 (관리자) — CONFIRMED 를 PENDING 으로 되돌린다
   */
  async revertConfirmPaymentRequest(paymentId: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}/revert-confirm`, {
      method: 'PUT',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }

  /**
   * 지급 요청 반려 (관리자) — 사유 필수
   */
  async rejectPaymentRequest(paymentId: number, rejectReason: string): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rejectReason })
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }

  /**
   * 지급 완료 (관리자)
   */
  /**
   * ★ oemCompanyId · yearMonth 도 함께 보낸다.
   *   경로의 paymentId 로 대상이 정해지지만, 백엔드가 이 둘을 필수(@NotNull)로 검증한다.
   *   빠뜨리면 «입력값 검증에 실패했습니다» 만 뜨고 무엇이 빠졌는지 화면에 안 나온다.
   */
  async completePaymentRequest(
    paymentId: number,
    paidAmount: number,
    paidDate: string,
    oemCompanyId: number,
    yearMonth: string
  ): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paidAmount, paidDate, oemCompanyId, yearMonth })
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }

  /**
   * 지급 요청 취소
   */
  async cancelPaymentRequest(paymentId: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
  }
}

export const oemLedgerService = new OemLedgerService()
