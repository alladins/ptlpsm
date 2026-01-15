/**
 * 메뉴 및 권한 서비스
 *
 * UPDATED DATE: 2025-12-01 - /api/common/** 패턴 변경 및 역할 API 추가
 * UPDATED DATE: 2025-12-29 - 역할 목록을 코드에서 관리하도록 변경
 */
import type { Menu, MenuPage, MenuAuth } from '~/types/menu'
import { MENU_ENDPOINTS, ROLE_ENDPOINTS } from '~/services/api/endpoints/menu.endpoints'
import { ROLE_LIST } from '~/types/user'
import { getAuthHeaders } from './api'

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

/**
 * 메뉴 구조 재배치 (프론트엔드 임시 처리)
 * - 코드관리: 기초정보 → 시스템관리로 이동
 * - 메뉴권한관리: 시스템관리 → 기초정보로 이동
 * - 계좌조회: 시스템관리 → 기초정보로 이동
 * - 커미션율 설정: 커미션관리 → 시스템관리로 이동
 */
function reorganizeMenuStructure(menus: Menu[]): Menu[] {
  // 메뉴 코드 기준으로 이동할 항목 정의
  const MOVE_TO_SYSTEM = ['CODE_MANAGE']  // 시스템관리로 이동 (기초정보에서)
  const MOVE_TO_BASIC_INFO = ['MENU_AUTH', 'BANK_ACCOUNT']  // 기초정보로 이동
  const MOVE_COMMISSION_RATES_TO_SYSTEM = ['COMMISSION_RATES']  // 시스템관리로 이동 (커미션관리에서)

  // 깊은 복사
  const result = JSON.parse(JSON.stringify(menus)) as Menu[]

  // 기초정보, 시스템관리, 커미션관리 메뉴 찾기
  const basicInfoMenu = result.find(m => m.menuCode === 'BASIC_INFO')
  const systemMenu = result.find(m => m.menuCode === 'SYSTEM')
  const commissionMenu = result.find(m => m.menuCode === 'COMMISSION')

  if (!basicInfoMenu || !systemMenu) {
    console.warn('[메뉴 재배치] 기초정보 또는 시스템관리 메뉴를 찾을 수 없습니다.')
    return result
  }

  // 기초정보에서 시스템관리로 이동할 메뉴 추출
  const menusToMoveToSystem: Menu[] = []
  if (basicInfoMenu.children) {
    basicInfoMenu.children = basicInfoMenu.children.filter(child => {
      if (MOVE_TO_SYSTEM.includes(child.menuCode)) {
        menusToMoveToSystem.push(child)
        return false
      }
      return true
    })
  }

  // 커미션관리에서 시스템관리로 이동할 메뉴 추출 (커미션율 설정)
  const commissionRatesToMove: Menu[] = []
  if (commissionMenu?.children) {
    commissionMenu.children = commissionMenu.children.filter(child => {
      if (MOVE_COMMISSION_RATES_TO_SYSTEM.includes(child.menuCode)) {
        // URL 변경: /admin/commission/rates → /admin/system/commission-rates
        child.menuUrl = '/admin/system/commission-rates'
        commissionRatesToMove.push(child)
        return false
      }
      return true
    })
  }

  // 시스템관리에서 기초정보로 이동할 메뉴 추출
  const menusToMoveToBasicInfo: Menu[] = []
  if (systemMenu.children) {
    systemMenu.children = systemMenu.children.filter(child => {
      if (MOVE_TO_BASIC_INFO.includes(child.menuCode)) {
        menusToMoveToBasicInfo.push(child)
        return false
      }
      return true
    })
  }

  // 메뉴 이동 적용
  if (systemMenu.children && menusToMoveToSystem.length > 0) {
    systemMenu.children.push(...menusToMoveToSystem)
  }
  if (systemMenu.children && commissionRatesToMove.length > 0) {
    systemMenu.children.push(...commissionRatesToMove)
  }
  if (basicInfoMenu.children && menusToMoveToBasicInfo.length > 0) {
    basicInfoMenu.children.push(...menusToMoveToBasicInfo)
  }

  console.log('[메뉴 재배치] 완료:', {
    toSystem: menusToMoveToSystem.map(m => m.menuName),
    toBasicInfo: menusToMoveToBasicInfo.map(m => m.menuName),
    commissionRatesToSystem: commissionRatesToMove.map(m => m.menuName)
  })

  return result
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
        headers: getAuthHeaders()
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
        headers: getAuthHeaders()
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
        headers: getAuthHeaders()
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
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`)
      }

      const data = await response.json()

      const menus = extractArrayFromResponse<Menu>(data, ['menus', 'data', 'menuList'])
      if (menus) {
        // 메뉴 구조 재배치 (프론트엔드 임시 처리)
        return reorganizeMenuStructure(menus)
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders()
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
        headers: getAuthHeaders(),
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
