/**
 * 창고 관리 API 엔드포인트
 *
 * @created 2026-02-09
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/warehouses
 * - List: GET ${base}
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 */

import { getApiBaseUrl } from '../config'

export const WAREHOUSE_ENDPOINTS = {
  /**
   * 창고 목록 조회
   * @returns GET /admin/warehouses
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/warehouses`
  },

  /**
   * 창고 상세 조회
   * @param id - 창고 ID
   * @returns GET /admin/warehouses/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/warehouses/${id}`
  },

  /**
   * 창고 생성
   * @returns POST /admin/warehouses
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/warehouses`
  },

  /**
   * 창고 수정
   * @param id - 창고 ID
   * @returns PUT /admin/warehouses/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/warehouses/${id}`
  },

  /**
   * 창고 삭제
   * @param id - 창고 ID
   * @returns DELETE /admin/warehouses/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/warehouses/${id}`
  }
} as const
