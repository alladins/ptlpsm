/**
 * OEM 월별 매출원장 API 서비스
 */

import { getAuthHeaders, apiEnvironment } from './api'
import type { OemMonthlyLedgerResponse, OemLedgerPaymentRequest } from '~/types/oem-ledger'

class OemLedgerService {
  private getBaseUrl(): string {
    return `${apiEnvironment.getApiBaseUrl()}/admin/oem/ledger`
  }

  /**
   * 월별 매출원장 조회
   */
  async getMonthlyLedger(oemCompanyId: number, yearMonth: string): Promise<OemMonthlyLedgerResponse> {
    const params = new URLSearchParams({
      oemCompanyId: oemCompanyId.toString(),
      yearMonth
    })
    const response = await fetch(`${this.getBaseUrl()}?${params}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
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
   * 지급 완료 (관리자)
   */
  async completePaymentRequest(paymentId: number, paidAmount: number, paidDate: string): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/payment-request/${paymentId}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paidAmount, paidDate })
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
