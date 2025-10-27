/**
 * 사용자 관리 API 엔드포인트
 *
 * MIGRATED FROM: user.service.ts
 * MIGRATED DATE: 2025-01-25
 *
 * 기존 URL 패턴 (100% 동일하게 유지):
 * - Base: ${baseUrl}/users
 * - List: GET ${base}?params
 * - Search: POST ${base}/search
 * - SearchSimple: GET ${base}/search/simple?params
 * - Detail: GET ${base}/{id}
 * - Create: POST ${base}
 * - Update: PUT ${base}/{id}
 * - Delete: DELETE ${base}/{id}
 * - ToggleStatus: PUT ${base}/{id}/toggle-status
 * - ChangePassword: PUT ${base}/{id}/change-password
 * - CurrentUser: GET ${base}/me
 */

import { getApiBaseUrl } from '../config'

export const USER_ENDPOINTS = {
  /**
   * 사용자 목록 조회
   * @returns Base URL for query parameters
   */
  list: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users`
  },

  /**
   * 사용자 상세 검색 (POST)
   * @returns POST /users/search
   */
  search: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/search`
  },

  /**
   * 사용자 간단 검색 (GET)
   * @returns Base URL for query parameters
   */
  searchSimple: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/search/simple`
  },

  /**
   * 사용자 상세 조회
   * @param id - 사용자 ID
   * @returns GET /users/{id}
   */
  detail: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/${id}`
  },

  /**
   * 사용자 등록
   * @returns POST /users
   */
  create: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users`
  },

  /**
   * 사용자 수정
   * @param id - 사용자 ID
   * @returns PUT /users/{id}
   */
  update: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/${id}`
  },

  /**
   * 사용자 삭제
   * @param id - 사용자 ID
   * @returns DELETE /users/{id}
   */
  delete: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/${id}`
  },

  /**
   * 사용자 상태 변경
   * @param id - 사용자 ID
   * @returns PUT /users/{id}/toggle-status
   */
  toggleStatus: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/${id}/toggle-status`
  },

  /**
   * 비밀번호 변경
   * @param id - 사용자 ID
   * @returns PUT /users/{id}/change-password
   */
  changePassword: (id: number) => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/${id}/change-password`
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   * @returns GET /users/me
   */
  currentUser: () => {
    const baseUrl = getApiBaseUrl()
    return `${baseUrl}/users/me`
  }
} as const
