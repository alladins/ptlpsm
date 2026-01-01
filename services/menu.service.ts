/**
 * 메뉴 및 권한 서비스
 *
 * UPDATED DATE: 2025-12-01 - /api/common/** 패턴 변경 및 역할 API 추가
 * UPDATED DATE: 2025-12-29 - 역할 목록을 코드에서 관리하도록 변경
 */
import type { Menu, MenuPage, MenuAuth } from '~/types/menu'
import { MENU_ENDPOINTS, ROLE_ENDPOINTS } from '~/services/api/endpoints/menu.endpoints'
import { ROLE_LIST } from '~/types/user'

// ========================================
// 역할 관련 타입
// ========================================

export interface Role {
  roleCode: string
  roleName: string
  description?: string
  sortOrder: number
  useYn: 'Y' | 'N'
}

export interface RolePermission {
  menuId: number
  menuCode: string
  menuName: string
  readAuth: 'Y' | 'N'
  writeAuth: 'Y' | 'N'
  editAuth: 'Y' | 'N'
  deleteAuth: 'Y' | 'N'
}

// ========================================
// API 응답 파싱 헬퍼 함수
// ========================================

/**
 * API 응답에서 배열 데이터 추출 (다양한 형식 지원)
 */
function extractArrayFromResponse<T>(data: any, possibleKeys: string[]): T[] | null {
  // 형식 1: { success: true, data: [...] }
  if (data.success && Array.isArray(data.data)) {
    return data.data
  }
  // 형식 2: { [key]: [...] } (예: { roles: [...] }, { menus: [...] })
  for (const key of possibleKeys) {
    if (Array.isArray(data[key])) {
      return data[key]
    }
  }
  // 형식 3: 직접 배열 반환 [...]
  if (Array.isArray(data)) {
    return data
  }
  return null
}

// ========================================
// 메뉴 서비스
// ========================================

export const menuService = {
  /**
   * 사용자별 메뉴 목록 조회 (실제 API 연동)
   * @param loginId - 사용자 로그인 ID (문자열)
   */
  async getUserMenus(loginId: string): Promise<Menu[]> {
    const apiUrl = MENU_ENDPOINTS.userMenus(loginId)
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (error) {
      console.error(`[Menu API] 사용자 메뉴 조회 실패 (${apiUrl}):`, error)
      throw error
    }
  },

  /**
   * 메뉴별 권한 조회 (실제 API 연동)
   * @param loginId - 사용자 로그인 ID (문자열)
   * @param menuId - 메뉴 ID
   */
  async getMenuAuth(loginId: string, menuId: number): Promise<MenuAuth> {
    try {
      const response = await fetch(MENU_ENDPOINTS.menuAuth(loginId, menuId), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (error) {
      console.warn('메뉴 권한 조회 실패, 모든 권한 허용:', error)
      return {
        readAuth: 'Y',
        writeAuth: 'Y',
        editAuth: 'Y',
        deleteAuth: 'Y'
      }
    }
  },

  /**
   * URL로 메뉴 조회 (실제 API 연동)
   */
  async getMenuByUrl(url: string): Promise<Menu | null> {
    try {
      const response = await fetch(MENU_ENDPOINTS.menuByUrl(url), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        return data.data
      }

      return null
    } catch (error) {
      console.warn('URL로 메뉴 조회 실패:', error)
      return null
    }
  },

  /**
   * 전체 메뉴 목록 조회 (관리자용)
   */
  async getAllMenus(): Promise<Menu[]> {
    try {
      const response = await fetch(MENU_ENDPOINTS.allMenus(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      const menus = extractArrayFromResponse<Menu>(data, ['menus', 'data', 'menuList'])
      if (menus) {
        return menus
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (error) {
      console.error('전체 메뉴 조회 실패:', error)
      throw error
    }
  },

  /**
   * 메뉴 권한 업데이트
   * @param loginId - 사용자 로그인 ID (문자열)
   * @param menuId - 메뉴 ID
   * @param auth - 권한 정보
   */
  async updateMenuAuth(loginId: string, menuId: number, auth: MenuAuth): Promise<boolean> {
    try {
      const response = await fetch(MENU_ENDPOINTS.updateMenuAuth(loginId, menuId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auth)
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()
      return data.success === true
    } catch (error) {
      console.error('메뉴 권한 업데이트 실패:', error)
      return false
    }
  },

  /**
   * 페이지별 권한 조회
   * @param loginId - 사용자 로그인 ID (문자열)
   * @param pageId - 페이지 ID
   */
  async getPageAuth(loginId: string, pageId: number): Promise<MenuAuth> {
    try {
      // 임시로 모든 권한 허용
      return {
        readAuth: 'Y',
        writeAuth: 'Y',
        editAuth: 'Y',
        deleteAuth: 'Y'
      }
    } catch (error) {
      console.error('페이지 권한 조회 실패:', error)
      return {
        readAuth: 'N',
        writeAuth: 'N',
        editAuth: 'N',
        deleteAuth: 'N'
      }
    }
  }
}

// ========================================
// 역할 서비스
// ========================================

export const roleService = {
  /**
   * 전체 역할 목록 조회
   * - 코드에서 정의된 ROLE_LIST 사용 (DB 의존성 제거)
   */
  async getAllRoles(): Promise<Role[]> {
    // 코드에서 정의된 역할 목록 반환
    return ROLE_LIST.map(role => ({
      roleCode: role.roleCode,
      roleName: role.roleName,
      description: role.description,
      sortOrder: role.sortOrder,
      useYn: 'Y' as const
    }))
  },

  /**
   * 역할별 권한 조회
   */
  async getRolePermissions(roleCode: string): Promise<RolePermission[]> {
    try {
      const response = await fetch(ROLE_ENDPOINTS.rolePermissions(roleCode), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      // 서버 응답 형식: { roleCode: "...", menuPermissions: [...] }
      if (data.menuPermissions && Array.isArray(data.menuPermissions)) {
        return data.menuPermissions
      }

      // 기존 형식도 지원: { success: true, data: [...] }
      if (data.success && Array.isArray(data.data)) {
        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (error) {
      console.warn('역할 권한 조회 실패:', error)
      return []
    }
  },

  /**
   * 역할별 권한 일괄 수정
   */
  async updateRolePermissions(roleCode: string, permissions: RolePermission[]): Promise<boolean> {
    try {
      const response = await fetch(ROLE_ENDPOINTS.updateRolePermissions(roleCode), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ menuPermissions: permissions })
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()
      return data.success === true
    } catch (error) {
      console.error('역할 권한 업데이트 실패:', error)
      return false
    }
  }
}
