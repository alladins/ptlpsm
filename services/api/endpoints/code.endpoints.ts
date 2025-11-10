/**
 * 코드 관리 API 엔드포인트
 *
 * MIGRATED FROM: code.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - 권한 주석 추가
 *
 * 권한:
 * - 코드 조회 (Details): 시스템관리자, 영업담당자, 리드파워담당자
 * - 코드 관리 (Create/Update/Delete): 시스템관리자만
 *
 * TODO: 향후 /common/codes (조회용)와 /admin/codes (관리용)로 분리 검토
 *
 * API 패턴:
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
