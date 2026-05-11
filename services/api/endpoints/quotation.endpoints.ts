/**
 * 견적관리 API 엔드포인트
 */

import { getApiBaseUrl } from '../config'

export const QUOTATION_ENDPOINTS = {
  /** 견적서 목록 조회 */
  list: () => `${getApiBaseUrl()}/admin/quotations`,

  /** 견적서 상세 조회 */
  detail: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}`,

  /** 견적서 등록 */
  create: () => `${getApiBaseUrl()}/admin/quotations`,

  /** 견적서 수정 */
  update: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}`,

  /** 견적서 삭제 */
  delete: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}`,

  /** 견적서 PDF 생성 */
  generatePdf: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}/pdf`,

  /** 견적서 PDF 다운로드 */
  downloadPdf: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}/pdf`,

  /** 견적서 이메일 발송 */
  sendEmail: (id: number) => `${getApiBaseUrl()}/admin/quotations/${id}/send-email`,
} as const
