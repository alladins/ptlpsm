/**
 * 메뉴 및 권한 서비스
 *
 * UPDATED DATE: 2025-12-01 - /api/common/** 패턴 변경 및 역할 API 추가
 */
import type { Menu, MenuPage, MenuAuth } from '~/types/menu'
import { MENU_ENDPOINTS, ROLE_ENDPOINTS } from '~/services/api/endpoints/menu.endpoints'

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
// Mock 데이터 함수 (외부에서 사용 가능)
// ========================================

/**
 * Mock 메뉴 데이터 반환 (개발용)
 * 백엔드 API 개발 전까지 사용
 */
export function getMockMenuData(): Menu[] {
  return [
    {
      menuId: 1,
      menuCode: 'SALES',
      menuName: '영업관리',
      menuUrl: '/admin/sales',
      menuIcon: 'fas fa-chart-line',
      menuLevel: 1,
      target: '_self',
      sortOrder: 1,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 11,
          menuCode: 'SALES_LIST',
          menuName: '영업관리 목록',
          parentMenuId: 1,
          menuUrl: '/admin/sales/list',
          menuIcon: 'fas fa-list',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 12,
          menuCode: 'SALES_REGISTER',
          menuName: '영업관리 등록',
          parentMenuId: 1,
          menuUrl: '/admin/sales/register',
          menuIcon: 'fas fa-plus',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 2,
      menuCode: 'ORDER',
      menuName: '발주관리',
      menuUrl: '/admin/order',
      menuIcon: 'fas fa-shopping-cart',
      menuLevel: 1,
      target: '_self',
      sortOrder: 2,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 21,
          menuCode: 'ORDER_LIST',
          menuName: '발주관리 목록',
          parentMenuId: 2,
          menuUrl: '/admin/order/list',
          menuIcon: 'fas fa-list',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 22,
          menuCode: 'ORDER_REGISTER',
          menuName: '발주관리 등록',
          parentMenuId: 2,
          menuUrl: '/admin/order/register',
          menuIcon: 'fas fa-plus',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 26,
          menuCode: 'ORDER_PDF_UPLOAD',
          menuName: 'PDF 업로드',
          parentMenuId: 2,
          menuUrl: '/admin/order/upload-pdf',
          menuIcon: 'fas fa-file-upload',
          menuLevel: 2,
          target: '_self',
          sortOrder: 6,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 3,
      menuCode: 'SHIPPING',
      menuName: '출하관리',
      menuUrl: '/admin/shipping',
      menuIcon: 'fas fa-truck',
      menuLevel: 1,
      target: '_self',
      sortOrder: 3,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 31,
          menuCode: 'SHIPPING_LIST',
          menuName: '출하관리 목록',
          parentMenuId: 3,
          menuUrl: '/admin/shipping/list',
          menuIcon: 'fas fa-list',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 32,
          menuCode: 'SHIPPING_REGISTER',
          menuName: '출하관리 등록',
          parentMenuId: 3,
          menuUrl: '/admin/shipping/register',
          menuIcon: 'fas fa-plus',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 4,
      menuCode: 'TRANSPORT',
      menuName: '운송장관리',
      menuUrl: '/admin/transport',
      menuIcon: 'fas fa-route',
      menuLevel: 1,
      target: '_self',
      sortOrder: 4,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 41,
          menuCode: 'TRANSPORT_LIST',
          menuName: '운송장관리 목록',
          parentMenuId: 4,
          menuUrl: '/admin/transport/list',
          menuIcon: 'fas fa-list',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 42,
          menuCode: 'TRANSPORT_REGISTER',
          menuName: '운송장 등록',
          parentMenuId: 4,
          menuUrl: '/admin/transport/register',
          menuIcon: 'fas fa-plus',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 46,
          menuCode: 'TRANSPORT_PRINT',
          menuName: '운송장 출력',
          parentMenuId: 4,
          menuUrl: '/admin/transport/print',
          menuIcon: 'fas fa-print',
          menuLevel: 2,
          target: '_self',
          sortOrder: 6,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 5,
      menuCode: 'DELIVERY',
      menuName: '납품확인관리',
      menuUrl: '/admin/delivery',
      menuIcon: 'fas fa-check-circle',
      menuLevel: 1,
      target: '_self',
      sortOrder: 5,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 51,
          menuCode: 'DELIVERY_LIST',
          menuName: '납품확인관리 목록',
          parentMenuId: 5,
          menuUrl: '/admin/delivery/list',
          menuIcon: 'fas fa-list',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 52,
          menuCode: 'DELIVERY_REGISTER',
          menuName: '납품확인 등록',
          parentMenuId: 5,
          menuUrl: '/admin/delivery/register',
          menuIcon: 'fas fa-plus',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 6,
      menuCode: 'DELIVERY_DONE',
      menuName: '납품완료계',
      menuUrl: '/admin/delivery-done/list',
      menuIcon: 'fas fa-file-contract',
      menuLevel: 1,
      sortOrder: 6,
      visible: 'Y',
      useYn: 'Y'
    },
    {
      menuId: 7,
      menuCode: 'STATISTICS',
      menuName: '통계',
      menuUrl: '/admin/statistics',
      menuIcon: 'fas fa-chart-bar',
      menuLevel: 1,
      target: '_self',
      sortOrder: 7,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 71,
          menuCode: 'STAT_SALES',
          menuName: '영업통계',
          parentMenuId: 7,
          menuUrl: '/admin/statistics/sales',
          menuIcon: 'fas fa-chart-line',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 72,
          menuCode: 'STAT_REGION',
          menuName: '지역별통계',
          parentMenuId: 7,
          menuUrl: '/admin/statistics/region',
          menuIcon: 'fas fa-map-marker-alt',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 73,
          menuCode: 'STAT_SHIPMENT',
          menuName: '출하현황통계',
          parentMenuId: 7,
          menuUrl: '/admin/statistics/shipment',
          menuIcon: 'fas fa-truck-loading',
          menuLevel: 2,
          target: '_self',
          sortOrder: 3,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 10,
      menuCode: 'MESSAGE_MANAGE',
      menuName: '문자관리',
      menuUrl: '/admin/message',
      menuIcon: 'fas fa-envelope',
      menuLevel: 1,
      target: '_self',
      sortOrder: 8,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 101,
          menuCode: 'MESSAGE_TEMPLATE',
          menuName: '메시지 템플릿 관리',
          parentMenuId: 10,
          menuUrl: '/admin/basic-info/message-templates/list',
          menuIcon: 'fas fa-file-lines',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 102,
          menuCode: 'MESSAGE_HISTORY',
          menuName: '메시지 히스토리',
          parentMenuId: 10,
          menuUrl: '/admin/message/history',
          menuIcon: 'fas fa-clock-rotate-left',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 8,
      menuCode: 'BASIC_INFO',
      menuName: '기초정보',
      menuUrl: '/admin/basic-info',
      menuIcon: 'fas fa-cogs',
      menuLevel: 1,
      target: '_self',
      sortOrder: 9,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 81,
          menuCode: 'CODE_MANAGE',
          menuName: '코드관리',
          parentMenuId: 8,
          menuUrl: '/admin/basic-info/code',
          menuIcon: 'fas fa-code',
          menuLevel: 2,
          target: '_self',
          sortOrder: 1,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 82,
          menuCode: 'ITEM_MANAGE',
          menuName: '품목관리',
          parentMenuId: 8,
          menuUrl: '/admin/basic-info/item',
          menuIcon: 'fas fa-boxes',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 83,
          menuCode: 'USER_MANAGE',
          menuName: '사용자관리',
          parentMenuId: 8,
          menuUrl: '/admin/basic-info/user',
          menuIcon: 'fas fa-users',
          menuLevel: 2,
          target: '_self',
          sortOrder: 3,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 84,
          menuCode: 'ORG_MANAGE',
          menuName: '수요기관관리',
          parentMenuId: 8,
          menuUrl: '/admin/basic-info/organization',
          menuIcon: 'fas fa-building',
          menuLevel: 2,
          target: '_self',
          sortOrder: 4,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    },
    {
      menuId: 9,
      menuCode: 'SYSTEM',
      menuName: '시스템관리',
      menuUrl: '/admin/system',
      menuIcon: 'fas fa-tools',
      menuLevel: 1,
      target: '_self',
      sortOrder: 10,
      visible: 'Y',
      useYn: 'Y',
      children: [
        {
          menuId: 91,
          menuCode: 'MENU_AUTH',
          menuName: '메뉴권한관리',
          parentMenuId: 9,
          menuUrl: '/admin/system/menu-auth',
          menuIcon: 'fas fa-key',
          menuLevel: 2,
          target: '_self',
          sortOrder: 2,
          visible: 'Y',
          useYn: 'Y'
        },
        {
          menuId: 93,
          menuCode: 'ACCESS_LOG',
          menuName: '접근로그',
          parentMenuId: 9,
          menuUrl: '/admin/system/access-log',
          menuIcon: 'fas fa-history',
          menuLevel: 2,
          target: '_self',
          sortOrder: 3,
          visible: 'Y',
          useYn: 'Y'
        }
      ]
    }
  ]
}

/**
 * Mock 역할 데이터 반환 (개발용)
 */
export function getMockRoleData(): Role[] {
  return [
    { roleCode: 'SYSTEM_ADMIN', roleName: '시스템 관리자', description: '전체 시스템 관리 권한', sortOrder: 1, useYn: 'Y' },
    { roleCode: 'LEADPOWER_MANAGER', roleName: '리드파워 담당자', description: '전체 데이터 관리', sortOrder: 2, useYn: 'Y' },
    { roleCode: 'OEM_MANAGER', roleName: 'OEM 담당자', description: '지정된 출하 관리', sortOrder: 3, useYn: 'Y' },
    { roleCode: 'SITE_MANAGER', roleName: '시공사 담당자', description: '지정된 납품요구 조회', sortOrder: 4, useYn: 'Y' },
    { roleCode: 'SITE_INSPECTOR', roleName: '감리원', description: '시공사와 동일 권한', sortOrder: 5, useYn: 'Y' },
    { roleCode: 'SALES_MANAGER', roleName: '영업 담당자', description: '영업 관리', sortOrder: 6, useYn: 'Y' },
    { roleCode: 'COURIER', roleName: '운송기사', description: '배정된 운송장만 조회', sortOrder: 7, useYn: 'Y' },
    { roleCode: 'READ_ONLY', roleName: '조회 전용', description: '조회만 가능', sortOrder: 8, useYn: 'Y' }
  ]
}

// ========================================
// 메뉴 서비스
// ========================================

export const menuService = {
  /**
   * Mock 메뉴 데이터 반환 (개발용)
   */
  getMockMenuData,

  /**
   * 사용자별 메뉴 목록 조회 (실제 API 연동)
   */
  async getUserMenus(userId: number): Promise<Menu[]> {
    try {
      const response = await fetch(MENU_ENDPOINTS.userMenus(userId), {
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
      console.warn('사용자 메뉴 조회 실패, Mock 데이터 사용:', error)
      return getMockMenuData()
    }
  },

  /**
   * 메뉴별 권한 조회 (실제 API 연동)
   */
  async getMenuAuth(userId: number, menuId: number): Promise<MenuAuth> {
    try {
      const response = await fetch(MENU_ENDPOINTS.menuAuth(userId, menuId), {
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

      if (data.success && Array.isArray(data.data)) {
        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (error) {
      console.warn('전체 메뉴 조회 실패, Mock 데이터 사용:', error)
      return getMockMenuData()
    }
  },

  /**
   * 메뉴 권한 업데이트
   * @param userId 사용자 ID (숫자)
   */
  async updateMenuAuth(userId: number, menuId: number, auth: MenuAuth): Promise<boolean> {
    try {
      const response = await fetch(MENU_ENDPOINTS.updateMenuAuth(userId, menuId), {
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
   */
  async getPageAuth(userId: number, pageId: number): Promise<MenuAuth> {
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
   * Mock 역할 데이터 반환 (개발용)
   */
  getMockRoleData,

  /**
   * 전체 역할 목록 조회
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await fetch(ROLE_ENDPOINTS.allRoles(), {
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
      console.warn('역할 목록 조회 실패, Mock 데이터 사용:', error)
      return getMockRoleData()
    }
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
        body: JSON.stringify({ permissions })
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
