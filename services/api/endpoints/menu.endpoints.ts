/**
 * 메뉴 관련 API 엔드포인트
 */
import { getApiBaseUrl } from '~/services/api'

const baseUrl = getApiBaseUrl()

export const MENU_ENDPOINTS = {
  /**
   * 사용자별 메뉴 목록 조회
   * @param userId - 사용자 ID
   */
  userMenus: (userId: number | string) => `${baseUrl}/api/menus/users/${userId}`,

  /**
   * 사용자의 특정 메뉴 권한 조회
   * @param userId - 사용자 ID
   * @param menuId - 메뉴 ID
   */
  menuAuth: (userId: number | string, menuId: number) =>
    `${baseUrl}/api/menus/users/${userId}/menus/${menuId}/auth`,

  /**
   * URL로 메뉴 조회
   * @param url - 페이지 URL
   */
  menuByUrl: (url: string) =>
    `${baseUrl}/api/menus/by-url?url=${encodeURIComponent(url)}`,

  /**
   * 전체 메뉴 목록 조회 (관리자용)
   */
  allMenus: () => `${baseUrl}/api/menus`,

  /**
   * 메뉴 상세 조회
   * @param menuId - 메뉴 ID
   */
  menuDetail: (menuId: number) => `${baseUrl}/api/menus/${menuId}`,

  /**
   * 역할별 메뉴 권한 조회
   * @param roleId - 역할 ID
   */
  roleMenus: (roleId: number | string) => `${baseUrl}/api/menus/roles/${roleId}`,

  /**
   * 메뉴 권한 업데이트
   * @param userId - 사용자 ID
   * @param menuId - 메뉴 ID
   */
  updateMenuAuth: (userId: number | string, menuId: number) =>
    `${baseUrl}/api/menus/users/${userId}/menus/${menuId}/auth`,

  /**
   * 메뉴 생성 (관리자용)
   */
  createMenu: () => `${baseUrl}/api/menus`,

  /**
   * 메뉴 수정 (관리자용)
   * @param menuId - 메뉴 ID
   */
  updateMenu: (menuId: number) => `${baseUrl}/api/menus/${menuId}`,

  /**
   * 메뉴 삭제 (관리자용)
   * @param menuId - 메뉴 ID
   */
  deleteMenu: (menuId: number) => `${baseUrl}/api/menus/${menuId}`
} as const
