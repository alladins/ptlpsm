/**
 * 선급금 PDF API 엔드포인트
 *
 * CREATED DATE: 2025-12-17
 *
 * 권한: 시스템관리자 (전체), 리드파워담당자 (전체)
 *
 * API 패턴:
 * - Generate All PDFs: POST /admin/advance-payments/{advancePaymentId}/generate-pdfs
 * - Generate Single PDF: POST /admin/advance-payments/{advancePaymentId}/generate-pdf/{pdfType}
 * - Download Application PDF: GET /admin/advance-payments/{advancePaymentId}/pdf/application
 * - Download Usage Plan PDF: GET /admin/advance-payments/{advancePaymentId}/pdf/usage-plan
 * - Download Usage Agreement PDF: GET /admin/advance-payments/{advancePaymentId}/pdf/usage-agreement
 * - Download Usage Pledge PDF: GET /admin/advance-payments/{advancePaymentId}/pdf/usage-pledge
 * - Download Settlement PDF: GET /admin/advance-payments/{advancePaymentId}/pdf/settlement
 * - Download All PDFs (ZIP): POST /admin/advance-payments/{advancePaymentId}/pdf/download-all
 */

import { getApiBaseUrl } from '../config'

export const ADVANCE_PAYMENT_ENDPOINTS = {
  /**
   * 5종 PDF 일괄 생성
   * @param advancePaymentId - 선급금 ID
   * @returns POST /admin/advance-payments/{advancePaymentId}/generate-pdfs
   */
  generatePdfs: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/generate-pdfs`
  },

  /**
   * 단일 PDF 생성
   * @param advancePaymentId - 선급금 ID
   * @param pdfType - PDF 유형 (application, usage-plan, usage-agreement, usage-pledge, settlement)
   * @returns POST /admin/advance-payments/{advancePaymentId}/generate-pdf/{pdfType}
   */
  generatePdf: (advancePaymentId: number, pdfType: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/generate-pdf/${pdfType}`
  },

  /**
   * 선급금신청서 PDF 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns GET /admin/advance-payments/{advancePaymentId}/pdf/application
   */
  applicationPdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/application`
  },

  /**
   * 선급금사용계획 PDF 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns GET /admin/advance-payments/{advancePaymentId}/pdf/usage-plan
   */
  usagePlanPdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/usage-plan`
  },

  /**
   * 선급금사용확약서 PDF 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns GET /admin/advance-payments/{advancePaymentId}/pdf/usage-agreement
   */
  usageAgreementPdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/usage-agreement`
  },

  /**
   * 선급금사용각서 PDF 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns GET /admin/advance-payments/{advancePaymentId}/pdf/usage-pledge
   */
  usagePledgePdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/usage-pledge`
  },

  /**
   * 선급금정산서 PDF 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns GET /admin/advance-payments/{advancePaymentId}/pdf/settlement
   */
  settlementPdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/settlement`
  },

  /**
   * 전체 PDF ZIP 다운로드
   * @param advancePaymentId - 선급금 ID
   * @returns POST /admin/advance-payments/{advancePaymentId}/pdf/download-all
   */
  downloadAllPdf: (advancePaymentId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/advance-payments/${advancePaymentId}/pdf/download-all`
  }
} as const
