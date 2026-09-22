/**
 * OEM 월별 매출원장 API 서비스
 */

import { getAuthHeaders, apiEnvironment } from './api'
import { httpError } from '~/utils/apiError'
import type {
  OemMonthlyLedgerResponse,
  OemLedgerPaymentRequest,
  OemLedgerPendingItem,
  OemPaymentDocumentInfo,
  OemPaymentAttachment
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

  // ==================== 지급요청서(서류) + 첨부파일 — 2026-09-22 ====================

  /** 지급요청서 발신 정보 (제조사 회사 정보 + 지난 입금 계좌) */
  async getDocumentInfo (oemCompanyId: number | null): Promise<OemPaymentDocumentInfo> {
    const params = new URLSearchParams()
    if (oemCompanyId) { params.set('oemCompanyId', String(oemCompanyId)) }
    const response = await fetch(`${this.getBaseUrl()}/document-info?${params}`, { headers: getAuthHeaders() })
    if (!response.ok) { throw httpError(response.status, '지급요청서 정보 조회') }
    return response.json()
  }

  /** 첨부파일 목록 */
  async listAttachments (oemCompanyId: number | null, yearMonth: string): Promise<OemPaymentAttachment[]> {
    const params = new URLSearchParams({ yearMonth })
    if (oemCompanyId) { params.set('oemCompanyId', String(oemCompanyId)) }
    const response = await fetch(`${this.getBaseUrl()}/attachments?${params}`, { headers: getAuthHeaders() })
    if (!response.ok) { throw httpError(response.status, '첨부파일 조회') }
    return response.json()
  }

  /**
   * 첨부파일 올리기 (한 번에 1개)
   * ⚠ multipart 라 Content-Type 을 직접 넣지 않는다 — 브라우저가 boundary 를 붙인다
   */
  async uploadAttachment (oemCompanyId: number | null, yearMonth: string, file: File): Promise<OemPaymentAttachment> {
    const form = new FormData()
    form.append('yearMonth', yearMonth)
    if (oemCompanyId) { form.append('oemCompanyId', String(oemCompanyId)) }
    form.append('file', file)
    const headers: Record<string, string> = { ...(getAuthHeaders() as Record<string, string>) }
    delete headers['Content-Type']
    const response = await fetch(`${this.getBaseUrl()}/attachments`, { method: 'POST', headers, body: form })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `파일 올리기에 실패했습니다 (${response.status})`)
    }
    return response.json()
  }

  /** 첨부파일 내려받기 — 원래 파일명으로 저장 */
  async downloadAttachment (attachment: OemPaymentAttachment): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/attachments/${attachment.attachmentId}/download`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) { throw httpError(response.status, '첨부파일 내려받기') }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => window.URL.revokeObjectURL(url), 1000) // 즉시 해제하면 크롬이 파일명·확장자를 잃는다
  }

  /** 첨부파일 삭제 (청구 전·반려 후에만) */
  async deleteAttachment (attachmentId: number): Promise<void> {
    const response = await fetch(`${this.getBaseUrl()}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `첨부파일 삭제에 실패했습니다 (${response.status})`)
    }
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
