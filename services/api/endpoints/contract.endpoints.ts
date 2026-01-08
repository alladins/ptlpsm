/**
 * 계약 관리 API 엔드포인트
 *
 * MIGRATED FROM: contract.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - API 경로 수정 (설계문서 반영)
 *
 * 권한: 시스템관리자, 영업담당자, 리드파워담당자
 *
 * API 패턴:
 * - Register: POST /contracts/register
 * - UploadPdf: POST /contracts/upload-pdf
 */

import { getApiBaseUrl } from '../config'

export const CONTRACT_ENDPOINTS = {
  /**
   * 계약 정보 등록
   * @returns POST /contracts/register
   */
  register: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/contract/register`
  },

  /**
   * PDF 업로드 및 데이터 추출
   * @returns POST /contracts/upload-pdf
   */
  uploadPdf: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/contract/upload-pdf`
  },

  /**
   * 납품요구번호 중복 체크
   * @param deliveryRequestNo - 납품요구번호
   * @returns GET /admin/contract/check-duplicate?deliveryRequestNo={deliveryRequestNo}
   */
  checkDuplicate: (deliveryRequestNo: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/contract/check-duplicate?deliveryRequestNo=${encodeURIComponent(deliveryRequestNo)}`
  }
} as const
