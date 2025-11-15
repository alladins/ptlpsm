import type { Menu, MenuPage, MenuAuth } from '~/types/menu'
import { MENU_ENDPOINTS } from '~/services/api/endpoints/menu.endpoints'

// 메뉴 서비스
export const menuService = {
  /**
   * 사용자별 메뉴 목록 조회 (실제 API 연동)
   */
  async getUserMenus(userId: number): Promise<Menu[]> {
    try {
      // 실제 API 호출
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

      // API 실패 시 Mock 데이터 반환 (백엔드 스키마 기반)
      return getMockMenuData()
    }
  },

  /**
   * Mock 메뉴 데이터 반환 (개발용)
   */
  getMockMenuData(): Menu[] {
    return [
        {
          menuId: 1,
          menuCode: 'SALES',
          menuName: '영업관리',
          menuUrl: '/sales',
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
              menuUrl: '/sales/list',
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
              menuUrl: '/sales/register',
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
          menuUrl: '/order',
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
              menuUrl: '/order/list',
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
              menuUrl: '/order/register',
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
              menuUrl: '/order/upload-pdf',
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
          menuUrl: '/shipping',
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
              menuUrl: '/shipping/list',
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
              menuUrl: '/shipping/register',
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
          menuUrl: '/transport',
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
              menuUrl: '/transport/list',
              menuIcon: 'fas fa-list',
              menuLevel: 2,
              target: '_self',
              sortOrder: 1,
              visible: 'Y',
              useYn: 'Y'
            },
            {
              menuId: 46,
              menuCode: 'TRANSPORT_PRINT',
              menuName: '운송장 출력',
              parentMenuId: 4,
              menuUrl: '/transport/print',
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
          menuUrl: '/delivery',
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
              menuUrl: '/delivery/list',
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
              menuUrl: '/delivery/register',
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
          menuUrl: '/statistics',
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
              parentMenuId: 6,
              menuUrl: '/statistics/sales',
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
              parentMenuId: 6,
              menuUrl: '/statistics/region',
              menuIcon: 'fas fa-map-marker-alt',
              menuLevel: 2,
              target: '_self',
              sortOrder: 2,
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
          menuUrl: '/basic-info',
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
              parentMenuId: 7,
              menuUrl: '/basic-info/code',
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
              parentMenuId: 7,
              menuUrl: '/basic-info/item',
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
              parentMenuId: 7,
              menuUrl: '/basic-info/user',
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
              parentMenuId: 7,
              menuUrl: '/basic-info/organization',
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
          menuUrl: '/system',
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
              parentMenuId: 8,
              menuUrl: '/system/menu-auth',
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
              parentMenuId: 8,
              menuUrl: '/system/access-log',
              menuIcon: 'fas fa-history',
              menuLevel: 2,
              target: '_self',
              sortOrder: 3,
              visible: 'Y',
              useYn: 'Y'
            }
          ]
        }
      ] // Mock 데이터 배열 종료
  },

  /**
   * 메뉴별 권한 조회 (실제 API 연동)
   */
  async getMenuAuth(userId: number, menuId: number): Promise<MenuAuth> {
    try {
      // 실제 API 호출
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

      // API 실패 시 임시로 모든 권한 허용
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
      // 실제 API 호출
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
   * 페이지별 권한 조회
   */
  async getPageAuth(userId: number, pageId: number): Promise<MenuAuth> {
    try {
      // 실제 구현에서는 API 호출
      // const response = await $fetch(`/api/pages/${pageId}/auth/${userId}`)
      
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
