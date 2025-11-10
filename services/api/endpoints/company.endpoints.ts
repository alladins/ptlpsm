/**
 * 회사 관리 API 엔드포인트
 *
 * MIGRATED FROM: company.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-10 - API 명세에 맞게 경로 수정
 *
 * API 패턴 (API_SPECIFICATION.md 기준):
 * - Base: /api/basic/company
 * - List: GET ${base}
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}  ← ID를 URL 경로에 포함
 * - Delete: DELETE ${base}/{id}
 */

import { getApiBaseUrl } from '../config'

export const COMPANY_ENDPOINTS = {
  /**
   * 회사 목록 조회
   * @returns GET /api/basic/company
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/company`
  },

  /**
   * 회사 상세 조회
   * @param id 회사 ID
   * @returns GET /api/basic/company/{id}
   */
  getById: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/company/${id}`
  },

  /**
   * 회사 정보 등록
   * @returns POST /api/basic/company
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/company`
  },

  /**
   * 회사 정보 수정
   * @param id 회사 ID
   * @returns PUT /api/basic/company/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/company/${id}`
  },

  /**
   * 회사 정보 삭제
   * @param id 회사 ID
   * @returns DELETE /api/basic/company/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/company/${id}`
  }
} as const
