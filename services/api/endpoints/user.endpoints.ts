/**
 * 사용자 관리 API 엔드포인트
 *
 * MIGRATED FROM: user.service.ts
 * MIGRATED DATE: 2025-01-25
 * UPDATED DATE: 2025-11-05 - API 경로 수정 (설계문서 반영)
 *
 * 권한: 시스템관리자(SYSTEM_ADMIN) 전용
 *
 * API 패턴:
 * - Base: ${baseUrl}/admin/users
 * - List: GET ${base}?params
 * - Search: POST ${base}/search
 * - SearchSimple: GET ${base}/search/simple?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - ToggleStatus: PUT ${base}/{id}/toggle-status
 * - ChangePassword: PUT ${base}/{id}/change-password
 * - CurrentUser: GET /common/users/me (모든 인증된 사용자)
 */

import { getApiBaseUrl } from '../config'

export const USER_ENDPOINTS = {
  /**
   * 사용자 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users`
  },

  /**
   * 사용자 상세 검색 (POST)
   * @returns POST /admin/users/search
   */
  search: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/search`
  },

  /**
   * 사용자 간단 검색 (GET)
   * @returns Base URL for query parameters
   */
  searchSimple: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/search/simple`
  },

  /**
   * 사용자 상세 조회
   * @param id - 사용자 ID
   * @returns GET /admin/users/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/${id}`
  },

  /**
   * 사용자 등록
   * @returns POST /admin/users
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users`
  },

  /**
   * 사용자 수정
   * @param id - 사용자 ID
   * @returns PUT /admin/users/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/${id}`
  },

  /**
   * 사용자 삭제
   * @param id - 사용자 ID
   * @returns DELETE /admin/users/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/${id}`
  },

  /**
   * 사용자 상태 변경
   * @param id - 사용자 ID
   * @returns PUT /admin/users/{id}/toggle-status
   */
  toggleStatus: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/${id}/toggle-status`
  },

  /**
   * 비밀번호 변경
   * @param id - 사용자 ID
   * @returns PUT /admin/users/{id}/change-password
   */
  changePassword: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/admin/users/${id}/change-password`
  },

  /**
   * 현재 로그인한 사용자 정보 조회 (모든 인증된 사용자)
   * @returns GET /common/users/me
   */
  currentUser: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/common/users/me`
  },

  /**
   * 내 정보 수정 (모든 인증된 사용자)
   * @returns PUT /common/users/me
   */
  updateProfile: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/common/users/me`
  },

  /**
   * 내 비밀번호 변경 (모든 인증된 사용자)
   * @returns PUT /common/users/me/change-password
   */
  changeMyPassword: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/common/users/me/change-password`
  }
} as const
