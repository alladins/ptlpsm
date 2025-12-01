/**
 * 메뉴 및 권한 관련 API 엔드포인트
 *
 * UPDATED DATE: 2025-12-01 - /api/menus → /api/common/menus 패턴 변경
 *
 * API 패턴:
 * - 시스템 공통 API: /api/common/**
 * - 비즈니스 API: /admin/**
 *
 * 메뉴/권한 API는 시스템 공통 API이므로 /api/common/** 패턴 사용
 */
import { getApiBaseUrl } from '~/services/api'

const baseUrl = getApiBaseUrl()

export const MENU_ENDPOINTS = {
  // ========================================
  // 메뉴 조회 API
  // ========================================

  /**
   * 사용자별 메뉴 목록 조회 (권한 포함)
   * @param userId - 사용자 ID (숫자)
   * @returns GET /common/menus/users/{userId}
   */
  userMenus: (userId: number) => `${baseUrl}/common/menus/users/${userId}`,

  /**
   * 사용자의 특정 메뉴 권한 조회
   * @param userId - 사용자 ID (숫자)
   * @param menuId - 메뉴 ID
   * @returns GET /common/menus/users/{userId}/menus/{menuId}/auth
   */
  menuAuth: (userId: number, menuId: number) =>
    `${baseUrl}/common/menus/users/${userId}/menus/${menuId}/auth`,

  /**
   * URL로 메뉴 조회
   * @param url - 페이지 URL
   * @returns GET /common/menus/by-url?url={url}
   */
  menuByUrl: (url: string) =>
    `${baseUrl}/common/menus/by-url?url=${encodeURIComponent(url)}`,

  /**
   * 전체 메뉴 목록 조회 (관리자용)
   * @returns GET /common/menus
   */
  allMenus: () => `${baseUrl}/common/menus`,

  /**
   * 메뉴 상세 조회
   * @param menuId - 메뉴 ID
   * @returns GET /common/menus/{menuId}
   */
  menuDetail: (menuId: number) => `${baseUrl}/common/menus/${menuId}`,

  // ========================================
  // 메뉴 관리 API (관리자용)
  // ========================================

  /**
   * 메뉴 생성 (관리자용)
   * @returns POST /common/menus
   */
  createMenu: () => `${baseUrl}/common/menus`,

  /**
   * 메뉴 수정 (관리자용)
   * @param menuId - 메뉴 ID
   * @returns PUT /common/menus/{menuId}
   */
  updateMenu: (menuId: number) => `${baseUrl}/common/menus/${menuId}`,

  /**
   * 메뉴 삭제 (관리자용)
   * @param menuId - 메뉴 ID
   * @returns DELETE /common/menus/{menuId}
   */
  deleteMenu: (menuId: number) => `${baseUrl}/common/menus/${menuId}`,

  // ========================================
  // 메뉴 권한 관리 API
  // ========================================

  /**
   * 메뉴 권한 업데이트
   * @param userId - 사용자 ID (숫자)
   * @param menuId - 메뉴 ID
   * @returns PUT /common/menus/users/{userId}/menus/{menuId}/auth
   */
  updateMenuAuth: (userId: number, menuId: number) =>
    `${baseUrl}/common/menus/users/${userId}/menus/${menuId}/auth`,

  /**
   * 역할별 메뉴 권한 조회
   * @param roleId - 역할 ID
   * @returns GET /common/menus/roles/{roleId}
   */
  roleMenus: (roleId: number | string) => `${baseUrl}/common/menus/roles/${roleId}`
} as const

// ========================================
// 역할(Role) 관련 API 엔드포인트
// ========================================
export const ROLE_ENDPOINTS = {
  /**
   * 전체 역할 목록 조회
   * @returns GET //common/roles
   */
  allRoles: () => `${baseUrl}/common/roles`,

  /**
   * 역할 상세 조회
   * @param roleCode - 역할 코드 (예: SYSTEM_ADMIN, LEADPOWER_MANAGER)
   * @returns GET /common/roles/{roleCode}
   */
  roleDetail: (roleCode: string) => `${baseUrl}/common/roles/${roleCode}`,

  /**
   * 역할별 권한 조회
   * @param roleCode - 역할 코드
   * @returns GET /common/roles/{roleCode}/permissions
   */
  rolePermissions: (roleCode: string) => `${baseUrl}/common/roles/${roleCode}/permissions`,

  /**
   * 역할별 권한 일괄 수정
   * @param roleCode - 역할 코드
   * @returns PUT /common/roles/{roleCode}/permissions
   */
  updateRolePermissions: (roleCode: string) => `${baseUrl}/common/roles/${roleCode}/permissions`
} as const
