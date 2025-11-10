/**
 * 영업 관리 API 엔드포인트
 *
 * MIGRATED FROM: sales.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - 권한 주석 추가
 *
 * 권한: 시스템관리자, 영업담당자, 리드파워담당자 (전체 권한)
 *       조회전용 사용자 (조회만)
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/sales
 * - List: GET ${base}?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - ContractFile: GET ${base}/{id}/contract-file
 * - UploadContractFile: POST ${base}/{id}/contract-file
 * - Items: GET ${base}/{salesId}/items
 * - CreateItem: POST ${base}/{salesId}/items
 * - UpdateItem: PUT ${base}/{salesId}/items/{itemId}
 * - DeleteItem: DELETE ${base}/{salesId}/items/{itemId}
 * - History: GET ${base}/{salesId}/history
 * - Restore: POST ${base}/{salesId}/restore
 * - Deleted: GET ${base}/deleted
 */

import { getApiBaseUrl } from '../config'

export const SALES_ENDPOINTS = {
  /**
   * 영업 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales`
  },

  /**
   * 영업 상세 조회
   * @param id - 영업 ID
   * @returns GET /admin/sales/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${id}`
  },

  /**
   * 영업 등록
   * @returns POST /admin/sales
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales`
  },

  /**
   * 영업 수정
   * @param id - 영업 ID
   * @returns PUT /admin/sales/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${id}`
  },

  /**
   * 영업 삭제
   * @param id - 영업 ID
   * @returns DELETE /admin/sales/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${id}`
  },

  /**
   * 계약서 파일 조회
   * @param id - 영업 ID
   * @returns GET /admin/sales/{id}/contract-file
   */
  contractFile: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${id}/contract-file`
  },

  /**
   * 계약서 파일 업로드
   * @param id - 영업 ID
   * @returns POST /admin/sales/{id}/contract-file
   */
  uploadContractFile: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${id}/contract-file`
  },

  /**
   * 품목 목록 조회
   * @param salesId - 영업 ID
   * @returns GET /admin/sales/{salesId}/items
   */
  items: (salesId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/items`
  },

  /**
   * 품목 등록
   * @param salesId - 영업 ID
   * @returns POST /admin/sales/{salesId}/items
   */
  createItem: (salesId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/items`
  },

  /**
   * 품목 수정
   * @param salesId - 영업 ID
   * @param itemId - 품목 ID
   * @returns PUT /admin/sales/{salesId}/items/{itemId}
   */
  updateItem: (salesId: number, itemId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/items/${itemId}`
  },

  /**
   * 품목 삭제
   * @param salesId - 영업 ID
   * @param itemId - 품목 ID
   * @returns DELETE /admin/sales/{salesId}/items/{itemId}
   */
  deleteItem: (salesId: number, itemId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/items/${itemId}`
  },

  /**
   * 이력 조회
   * @param salesId - 영업 ID
   * @returns GET /admin/sales/{salesId}/history
   */
  history: (salesId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/history`
  },

  /**
   * 복원
   * @param salesId - 영업 ID
   * @returns POST /admin/sales/{salesId}/restore
   */
  restore: (salesId: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/${salesId}/restore`
  },

  /**
   * 삭제된 영업 목록 조회
   * @returns GET /admin/sales/deleted
   */
  deleted: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/sales/deleted`
  }
} as const
