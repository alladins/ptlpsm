/**
 * 수요기관 관리 API 엔드포인트
 *
 * MIGRATED FROM: demand-organization.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/basic/demand-organizations
 * - List: GET ${base}?params
 * - Search: POST ${base}/search
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{dminsttCd}
 * - Delete: DELETE ${base}/{dminsttCd}
 * - CheckCode: GET ${base}/check-code/{dminsttCd}
 * - ToggleStatus: PUT ${base}/{dminsttCd}
 */

import { getApiBaseUrl } from '../config'

export const DEMAND_ORGANIZATION_ENDPOINTS = {
  /**
   * 수요기관 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations`
  },

  /**
   * 수요기관 검색
   * @returns POST /basic/demand-organizations/search
   */
  search: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/search`
  },

  /**
   * 수요기관 상세 조회
   * @param id - 수요기관 ID
   * @returns GET /basic/demand-organizations/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/${id}`
  },

  /**
   * 수요기관 등록
   * @returns POST /basic/demand-organizations
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations`
  },

  /**
   * 수요기관 수정
   * @param dminsttCd - 수요기관 코드
   * @returns PUT /basic/demand-organizations/{dminsttCd}
   */
  update: (dminsttCd: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/${dminsttCd}`
  },

  /**
   * 수요기관 삭제
   * @param dminsttCd - 수요기관 코드
   * @returns DELETE /basic/demand-organizations/{dminsttCd}
   */
  delete: (dminsttCd: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/${dminsttCd}`
  },

  /**
   * 수요기관 코드 중복 확인
   * @param dminsttCd - 수요기관 코드
   * @returns GET /basic/demand-organizations/check-code/{dminsttCd}
   */
  checkCode: (dminsttCd: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/check-code/${dminsttCd}`
  },

  /**
   * 수요기관 상태 변경
   * @param dminsttCd - 수요기관 코드
   * @returns PUT /basic/demand-organizations/{dminsttCd}
   */
  toggleStatus: (dminsttCd: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/basic/demand-organizations/${dminsttCd}`
  }
} as const
