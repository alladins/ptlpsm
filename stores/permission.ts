/**
 * 권한 상태 관리 스토어
 *
 * 메뉴별 CRUD 권한 및 데이터 소유권 기반 접근 제어
 *
 * 권한 체계:
 * - 메뉴 권한: readAuth, writeAuth, editAuth, deleteAuth
 * - 데이터 소유권: 역할별 데이터 접근 범위 제어
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Menu, MenuAuth } from '~/types/menu'
import { useAuthStore } from './auth'

// 권한 캐시 아이템 타입
interface PermissionCacheItem {
  menuId: number
  auth: MenuAuth
  cachedAt: number
}

// 사용자 역할 타입
type UserRole =
  | 'SYSTEM_ADMIN'
  | 'LEADPOWER_MANAGER'
  | 'OEM_MANAGER'
  | 'SITE_MANAGER'
  | 'SITE_INSPECTOR'
  | 'SALES_MANAGER'
  | 'COURIER'
  | 'READ_ONLY'

export const usePermissionStore = defineStore('permission', () => {
  // ========================================
  // State
  // ========================================

  // 사용자 메뉴 목록 (권한 포함)
  const userMenus = ref<Menu[]>([])

  // 메뉴별 권한 캐시 (menuId -> auth)
  const menuPermissions = ref<Map<number, PermissionCacheItem>>(new Map())

  // 로딩 상태
  const loading = ref(false)

  // 마지막 조회 시간
  const lastFetched = ref<number | null>(null)

  // 에러 상태
  const error = ref<string | null>(null)

  // ========================================
  // Constants
  // ========================================

  // 권한 캐시 TTL (5분)
  const CACHE_TTL = 5 * 60 * 1000

  // 전체 접근 권한을 가진 역할
  const FULL_ACCESS_ROLES: UserRole[] = ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER']

  // ========================================
  // Computed
  // ========================================

  // 캐시 유효성 확인
  const isCacheValid = computed(() => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_TTL
  })

  // 현재 사용자 역할
  const currentUserRole = computed(() => {
    const authStore = useAuthStore()
    return authStore.user?.role as UserRole | null
  })

  // 전체 접근 권한 여부
  const isFullAccess = computed(() => {
    if (!currentUserRole.value) return false
    return FULL_ACCESS_ROLES.includes(currentUserRole.value)
  })

  // OEM 담당자 여부
  const isOemManager = computed(() => currentUserRole.value === 'OEM_MANAGER')

  // 시공사 담당자 여부
  const isSiteManager = computed(() => currentUserRole.value === 'SITE_MANAGER')

  // 감리원 여부 (시공사와 동일 권한)
  const isSiteInspector = computed(() => currentUserRole.value === 'SITE_INSPECTOR')

  // 운송기사 여부
  const isCourier = computed(() => currentUserRole.value === 'COURIER')

  // 조회 전용 여부
  const isReadOnly = computed(() => currentUserRole.value === 'READ_ONLY')

  // ========================================
  // Actions
  // ========================================

  /**
   * 사용자 메뉴 목록 조회 (권한 포함)
   */
  async function fetchUserMenus(forceRefresh = false): Promise<Menu[]> {
    const authStore = useAuthStore()

    if (!authStore.user?.userid) {
      console.warn('사용자 정보가 없습니다')
      return []
    }

    // 캐시가 유효하고 강제 새로고침이 아니면 캐시 반환
    if (!forceRefresh && isCacheValid.value && userMenus.value.length > 0) {
      return userMenus.value
    }

    loading.value = true
    error.value = null

    try {
      const { MENU_ENDPOINTS } = await import('~/services/api/endpoints/menu.endpoints')

      const response = await fetch(MENU_ENDPOINTS.userMenus(authStore.user.loginId), {
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
        userMenus.value = data.data
        lastFetched.value = Date.now()

        // 메뉴별 권한 캐시 업데이트
        updateMenuPermissionsCache(data.data)

        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (err) {
      console.warn('사용자 메뉴 조회 실패, Mock 데이터 사용:', err)
      error.value = err instanceof Error ? err.message : '알 수 없는 오류'

      // API 실패 시 Mock 데이터 반환
      const { getMockMenuData } = await import('~/services/menu.service')
      const mockMenus = getMockMenuData()
      userMenus.value = mockMenus
      lastFetched.value = Date.now()

      return mockMenus
    } finally {
      loading.value = false
    }
  }

  /**
   * 메뉴별 권한 캐시 업데이트
   */
  function updateMenuPermissionsCache(menus: Menu[]) {
    const now = Date.now()

    function processMenu(menu: Menu & { auth?: MenuAuth }) {
      if (menu.auth) {
        menuPermissions.value.set(menu.menuId, {
          menuId: menu.menuId,
          auth: menu.auth,
          cachedAt: now
        })
      }

      if (menu.children) {
        menu.children.forEach(child => processMenu(child as Menu & { auth?: MenuAuth }))
      }
    }

    menus.forEach(menu => processMenu(menu as Menu & { auth?: MenuAuth }))
  }

  /**
   * 특정 메뉴 권한 조회
   */
  async function fetchMenuAuth(menuId: number): Promise<MenuAuth> {
    const authStore = useAuthStore()

    if (!authStore.user?.userid) {
      console.warn('사용자 정보가 없습니다')
      return getDefaultAuth()
    }

    // 캐시 확인
    const cached = menuPermissions.value.get(menuId)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return cached.auth
    }

    try {
      const { MENU_ENDPOINTS } = await import('~/services/api/endpoints/menu.endpoints')

      const response = await fetch(MENU_ENDPOINTS.menuAuth(authStore.user.loginId, menuId), {
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
        // 캐시 업데이트
        menuPermissions.value.set(menuId, {
          menuId,
          auth: data.data,
          cachedAt: Date.now()
        })

        return data.data
      }

      throw new Error('잘못된 API 응답 형식')
    } catch (err) {
      console.warn('메뉴 권한 조회 실패, 기본 권한 반환:', err)

      // API 실패 시 전체 접근 권한이면 모든 권한 허용, 아니면 조회만 허용
      return isFullAccess.value ? getAllAuth() : getDefaultAuth()
    }
  }

  /**
   * 권한 확인 헬퍼
   */
  function hasPermission(menuId: number, authType: keyof MenuAuth): boolean {
    // 전체 접근 권한이면 항상 허용
    if (isFullAccess.value) return true

    const cached = menuPermissions.value.get(menuId)
    if (!cached) return false

    return cached.auth[authType] === 'Y'
  }

  /**
   * URL로 메뉴 찾기
   */
  function findMenuByUrl(url: string): Menu | null {
    function searchMenu(menus: Menu[]): Menu | null {
      for (const menu of menus) {
        if (menu.menuUrl === url) return menu

        if (menu.children) {
          const found = searchMenu(menu.children)
          if (found) return found
        }
      }
      return null
    }

    return searchMenu(userMenus.value)
  }

  /**
   * 메뉴 코드로 메뉴 찾기
   */
  function findMenuByCode(menuCode: string): Menu | null {
    function searchMenu(menus: Menu[]): Menu | null {
      for (const menu of menus) {
        if (menu.menuCode === menuCode) return menu

        if (menu.children) {
          const found = searchMenu(menu.children)
          if (found) return found
        }
      }
      return null
    }

    return searchMenu(userMenus.value)
  }

  /**
   * 캐시 초기화
   */
  function clearCache() {
    userMenus.value = []
    menuPermissions.value.clear()
    lastFetched.value = null
    error.value = null
  }

  // ========================================
  // 데이터 소유권 기반 접근 제어
  // ========================================

  /**
   * 납품요구(Order) 접근 권한 확인
   */
  function canAccessOrder(order: { siteManagerId?: number; siteInspectorId?: number }): boolean {
    if (isFullAccess.value) return true

    const authStore = useAuthStore()
    const userId = authStore.user?.userid

    // 시공사 담당자 또는 감리원
    if (isSiteManager.value || isSiteInspector.value) {
      return order.siteManagerId === userId || order.siteInspectorId === userId
    }

    // OEM 담당자는 연결된 출하를 통해 접근 (여기서는 기본 false)
    if (isOemManager.value) return false

    return false
  }

  /**
   * 출하(Shipment) 접근 권한 확인
   */
  function canAccessShipment(shipment: { oemManagerId?: number; siteManagerId?: number }): boolean {
    if (isFullAccess.value) return true

    const authStore = useAuthStore()
    const userId = authStore.user?.userid

    // OEM 담당자
    if (isOemManager.value) {
      return shipment.oemManagerId === userId
    }

    // 시공사 담당자 또는 감리원 (연결된 납품요구를 통해 접근)
    if (isSiteManager.value || isSiteInspector.value) {
      return shipment.siteManagerId === userId
    }

    return false
  }

  /**
   * 운송장(Transport) 접근 권한 확인
   */
  function canAccessTransport(transport: { courierId?: number; oemManagerId?: number; siteManagerId?: number }): boolean {
    if (isFullAccess.value) return true

    const authStore = useAuthStore()
    const userId = authStore.user?.userid

    // 운송기사
    if (isCourier.value) {
      return transport.courierId === userId
    }

    // OEM 담당자
    if (isOemManager.value) {
      return transport.oemManagerId === userId
    }

    // 시공사 담당자 또는 감리원
    if (isSiteManager.value || isSiteInspector.value) {
      return transport.siteManagerId === userId
    }

    return false
  }

  // ========================================
  // Helper Functions
  // ========================================

  /**
   * 기본 권한 (조회만 허용)
   */
  function getDefaultAuth(): MenuAuth {
    return {
      readAuth: 'Y',
      writeAuth: 'N',
      editAuth: 'N',
      deleteAuth: 'N'
    }
  }

  /**
   * 모든 권한 허용
   */
  function getAllAuth(): MenuAuth {
    return {
      readAuth: 'Y',
      writeAuth: 'Y',
      editAuth: 'Y',
      deleteAuth: 'Y'
    }
  }

  /**
   * 권한 없음
   */
  function getNoAuth(): MenuAuth {
    return {
      readAuth: 'N',
      writeAuth: 'N',
      editAuth: 'N',
      deleteAuth: 'N'
    }
  }

  // ========================================
  // Return
  // ========================================

  return {
    // State
    userMenus,
    menuPermissions,
    loading,
    lastFetched,
    error,

    // Computed
    isCacheValid,
    currentUserRole,
    isFullAccess,
    isOemManager,
    isSiteManager,
    isSiteInspector,
    isCourier,
    isReadOnly,

    // Actions
    fetchUserMenus,
    fetchMenuAuth,
    hasPermission,
    findMenuByUrl,
    findMenuByCode,
    clearCache,

    // 데이터 소유권 기반 접근 제어
    canAccessOrder,
    canAccessShipment,
    canAccessTransport,

    // Helper Functions
    getDefaultAuth,
    getAllAuth,
    getNoAuth
  }
})
