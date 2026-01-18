/**
 * 선급금 PDF 서비스
 *
 * CREATED DATE: 2025-12-17
 *
 * @description 선급금 관련 PDF 생성 및 다운로드 API 호출 서비스
 */

import { getAuthHeaders } from './api'
import { ADVANCE_PAYMENT_ENDPOINTS } from './api/endpoints/advance-payment.endpoints'
import type { AdvancePdfType } from '~/types/fund'

export const advancePaymentService = {
  /**
   * 5종 PDF 일괄 생성
   * @param advancePaymentId - 선급금 ID
   * @returns 생성된 PDF 경로 정보 (Map<documentType, filePath>)
   */
  async generatePdfs(advancePaymentId: number): Promise<Record<string, string>> {
    try {
      const url = ADVANCE_PAYMENT_ENDPOINTS.generatePdfs(advancePaymentId)
      console.log('선급금 PDF 일괄 생성 API 호출:', url)

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
      console.error('선급금 PDF 일괄 생성 실패:', error)
      throw error
    }
  },

  /**
   * 단일 PDF 생성
   * @param advancePaymentId - 선급금 ID
   * @param pdfType - PDF 유형
   * @returns 생성된 PDF 경로
   */
  async generatePdf(advancePaymentId: number, pdfType: AdvancePdfType): Promise<string> {
    try {
      // pdfType을 URL용 소문자로 변환 (APPLICATION -> application)
      const urlType = pdfType.toLowerCase().replace(/_/g, '-')
      const url = ADVANCE_PAYMENT_ENDPOINTS.generatePdf(advancePaymentId, urlType)
      console.log('선급금 단일 PDF 생성 API 호출:', url)

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
      console.error(`선급금 PDF 생성 실패 (${pdfType}):`, error)
      throw error
    }
  },

  /**
   * PDF 다운로드 URL 반환
   * @param advancePaymentId - 선급금 ID
   * @param pdfType - PDF 유형
   * @returns PDF 다운로드 URL
   */
  getPdfUrl(advancePaymentId: number, pdfType: AdvancePdfType): string {
    const urlMap: Record<AdvancePdfType, (id: number) => string> = {
      APPLICATION: ADVANCE_PAYMENT_ENDPOINTS.applicationPdf,
      USAGE_PLAN: ADVANCE_PAYMENT_ENDPOINTS.usagePlanPdf,
      USAGE_AGREEMENT: ADVANCE_PAYMENT_ENDPOINTS.usageAgreementPdf,
      USAGE_PLEDGE: ADVANCE_PAYMENT_ENDPOINTS.usagePledgePdf,
      SETTLEMENT: ADVANCE_PAYMENT_ENDPOINTS.settlementPdf
    }
    return urlMap[pdfType](advancePaymentId)
  },

  /**
   * 선급금신청서 PDF URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns PDF 다운로드 URL
   */
  getApplicationPdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.applicationPdf(advancePaymentId)
  },

  /**
   * 선급금사용계획 PDF URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns PDF 다운로드 URL
   */
  getUsagePlanPdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.usagePlanPdf(advancePaymentId)
  },

  /**
   * 선급금사용확약서 PDF URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns PDF 다운로드 URL
   */
  getUsageAgreementPdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.usageAgreementPdf(advancePaymentId)
  },

  /**
   * 선급금사용각서 PDF URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns PDF 다운로드 URL
   */
  getUsagePledgePdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.usagePledgePdf(advancePaymentId)
  },

  /**
   * 선급금정산서 PDF URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns PDF 다운로드 URL
   */
  getSettlementPdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.settlementPdf(advancePaymentId)
  },

  /**
   * 전체 PDF ZIP 다운로드 URL 반환
   * @param advancePaymentId - 선급금 ID
   * @returns ZIP 다운로드 URL
   */
  getDownloadAllPdfUrl(advancePaymentId: number): string {
    return ADVANCE_PAYMENT_ENDPOINTS.downloadAllPdf(advancePaymentId)
  },

  /**
   * 단일 PDF 다운로드 (JWT 토큰 포함)
   * @param advancePaymentId - 선급금 ID
   * @param pdfType - PDF 유형
   */
  async downloadPdf(advancePaymentId: number, pdfType: AdvancePdfType): Promise<void> {
    const url = this.getPdfUrl(advancePaymentId, pdfType)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`PDF 다운로드 실패: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `선급금_${pdfType}_${advancePaymentId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  /**
   * 전체 PDF ZIP 다운로드 (JWT 토큰 포함)
   * @param advancePaymentId - 선급금 ID
   */
  async downloadAllPdfs(advancePaymentId: number): Promise<void> {
    const url = ADVANCE_PAYMENT_ENDPOINTS.downloadAllPdf(advancePaymentId)

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error(`전체 PDF 다운로드 실패: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `선급금_전체_${advancePaymentId}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
}
