/**
 * 코드 관리 API 엔드포인트
 *
 * MIGRATED FROM: code.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Groups: GET /codes/groups
 * - CreateGroup: POST /codes/groups
 * - UpdateGroup: PUT /codes/groups/{groupCode}
 * - DeleteGroup: DELETE /codes/groups/{groupCode}
 * - Details: GET /codes/details 또는 GET /codes/details/{groupCode}
 * - CreateDetail: POST /codes/details
 * - UpdateDetail: PUT /codes/details/{groupCode}/{code}
 * - DeleteDetail: DELETE /codes/details/{groupCode}/{code}
 */

import { getApiBaseUrl } from '../config'

export const CODE_ENDPOINTS = {
  /**
   * 코드 그룹 목록 조회
   * @returns GET /codes/groups
   */
  groups: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/groups`
  },

  /**
   * 코드 그룹 등록
   * @returns POST /codes/groups
   */
  createGroup: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/groups`
  },

  /**
   * 코드 그룹 수정
   * @param groupCode - 그룹 코드
   * @returns PUT /codes/groups/{groupCode}
   */
  updateGroup: (groupCode: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/groups/${groupCode}`
  },

  /**
   * 코드 그룹 삭제
   * @param groupCode - 그룹 코드
   * @returns DELETE /codes/groups/{groupCode}
   */
  deleteGroup: (groupCode: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/groups/${groupCode}`
  },

  /**
   * 코드 상세 목록 조회
   * @param groupCode - 그룹 코드 (선택)
   * @returns GET /codes/details 또는 GET /codes/details/{groupCode}
   */
  details: (groupCode?: string) => {
    const baseUrl = getApiBaseUrl()
    return groupCode
      ? `${baseUrl}/codes/details/${groupCode}`
      : `${baseUrl}/codes/details`
  },

  /**
   * 코드 상세 등록
   * @returns POST /codes/details
   */
  createDetail: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/details`
  },

  /**
   * 코드 상세 수정
   * @param groupCode - 그룹 코드
   * @param code - 코드
   * @returns PUT /codes/details/{groupCode}/{code}
   */
  updateDetail: (groupCode: string, code: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/details/${groupCode}/${code}`
  },

  /**
   * 코드 상세 삭제
   * @param groupCode - 그룹 코드
   * @param code - 코드
   * @returns DELETE /codes/details/{groupCode}/{code}
   */
  deleteDetail: (groupCode: string, code: string) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/codes/details/${groupCode}/${code}`
  }
} as const
