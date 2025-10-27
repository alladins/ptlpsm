/**
 * 계약 관리 API 엔드포인트
 *
 * MIGRATED FROM: contract.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Register: POST /admin/contract/register
 * - UploadPdf: POST /admin/contract/upload-pdf
 */

import { getApiBaseUrl } from '../config'

export const CONTRACT_ENDPOINTS = {
  /**
   * 계약 정보 등록
   * @returns POST /admin/contract/register
   */
  register: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/contract/register`
  },

  /**
   * PDF 업로드 및 데이터 추출
   * @returns POST /admin/contract/upload-pdf
   */
  uploadPdf: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/contract/upload-pdf`
  }
} as const
