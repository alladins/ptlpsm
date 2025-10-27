/**
 * 회사 관리 API 엔드포인트
 *
 * MIGRATED FROM: company.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: /api/company
 * - Get: GET ${base}
 * - Create: POST ${base}
 * - Update: PUT ${base}
 * - Delete: DELETE ${base}
 */

import { getApiBaseUrl } from '../config'

export const COMPANY_ENDPOINTS = {
  /**
   * 회사 정보 조회
   * @returns GET /api/company
   */
  get: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/company`
  },

  /**
   * 회사 정보 등록
   * @returns POST /api/company
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/company`
  },

  /**
   * 회사 정보 수정
   * @returns PUT /api/company
   */
  update: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/company`
  },

  /**
   * 회사 정보 삭제
   * @returns DELETE /api/company
   */
  delete: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/company`
  }
} as const
