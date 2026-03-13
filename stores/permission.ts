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
  | 'DELIVERY_DRIVER'
  | 'READ_ONLY'

// 역할 코드 정규화 매핑 (DB → 프론트엔드 표준)
const ROLE_CODE_MAPPING: Record<string, UserRole> = {
  // 기존 DB 코드 → 표준 코드
  'LEAD_POWER': 'LEADPOWER_MANAGER',
  'COURIER': 'DELIVERY_DRIVER',
  // 표준 코드는 그대로 유지
  'SYSTEM_ADMIN': 'SYSTEM_ADMIN',
  'LEADPOWER_MANAGER': 'LEADPOWER_MANAGER',
  'OEM_MANAGER': 'OEM_MANAGER',
  'SITE_MANAGER': 'SITE_MANAGER',
  'SITE_INSPECTOR': 'SITE_INSPECTOR',
  'SALES_MANAGER': 'SALES_MANAGER',
  'DELIVERY_DRIVER': 'DELIVERY_DRIVER',
  'READ_ONLY': 'READ_ONLY'
}

/**
 * 역할 코드 정규화
 * DB에서 반환되는 다양한 역할 코드를 프론트엔드 표준 코드로 변환
 */
function normalizeRoleCode(role: string | null | undefined): UserRole | null {
  if (!role) return null
  return ROLE_CODE_MAPPING[role] || role as UserRole
}

export const usePermissionStore = defineStore('permission', () => {
  // ========================================
  // State
  // ========================================

  // 사용자 메뉴 목록 (권한 포함, 사이드바 렌더링용)
  const userMenus = ref<Menu[]>([])

  // [레거시] 메뉴별 권한 캐시 (menuId -> auth)
  // 새 시스템: permissionFlatMap (menuCode 기반)을 사용
  // 하위 호환성을 위해 유지, 점진적 제거 예정
  const menuPermissions = ref<Map<number, PermissionCacheItem>>(new Map())

  // ✅ 권한 플랫맵 (menuCode -> MenuAuth) - 새 권한 체크 시스템
  const permissionFlatMap = ref<Map<string, MenuAuth>>(new Map())

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

  // 전체 접근 권한을 가진 역할 (시스템관리자 + 리드파워 담당자)
  // 리드파워 담당자는 SidebarMenu에서 시스템관리 메뉴만 별도 제외
  const FULL_ACCESS_ROLES: UserRole[] = ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER']

  // ========================================
  // Computed
  // ========================================

  // 캐시 유효성 확인
  const isCacheValid = computed(() => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_TTL
  })

  // 현재 사용자 역할 (정규화된 역할 코드)
  const currentUserRole = computed(() => {
    const authStore = useAuthStore()
    return normalizeRoleCode(authStore.user?.role)
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
  const isDeliveryDriver = computed(() => currentUserRole.value === 'DELIVERY_DRIVER')

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

    // loginId로 체크 (API 호출에 loginId 사용, userId는 백엔드에서 누락될 수 있음)
    if (!authStore.user?.loginId) {
      console.warn('사용자 정보가 없습니다 (loginId 없음)')
      return []
    }

    // 캐시가 유효하고 강제 새로고침이 아니면 캐시 반환
    if (!forceRefresh && isCacheValid.value && userMenus.value.length > 0) {
      return userMenus.value
    }

    loading.value = true
    error.value = null

    const { MENU_ENDPOINTS } = await import('~/services/api/endpoints/menu.endpoints')
    const apiUrl = MENU_ENDPOINTS.userMenus(authStore.user.loginId)

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

      // 백엔드 응답 형식 처리:
      // 1. 배열 직접 반환: [...] (현재 백엔드 방식)
      // 2. 래퍼 형식: { success: true, data: [...] } (레거시 호환)
      let menus: Menu[] = []

      if (Array.isArray(data)) {
        // 배열 직접 반환 (현재 백엔드 방식)
        menus = data
      } else if (data.success && Array.isArray(data.data)) {
        // 래퍼 형식 (레거시 호환)
        menus = data.data
      } else if (data.content && Array.isArray(data.content)) {
        // 페이징 응답 형식
        menus = data.content
      } else {
        throw new Error('잘못된 API 응답 형식')
      }

      userMenus.value = menus
      lastFetched.value = Date.now()

      // 메뉴별 권한 캐시 업데이트
      updateMenuPermissionsCache(menus)

      console.log('[Permission Store] 사용자 메뉴 조회 성공:', {
        menuCount: menus.length,
        hasAuth: menus[0]?.auth ? 'Y' : 'N',
        firstMenuAuth: menus[0]?.auth
      })

      return menus
    } catch (err) {
      console.error(`[Permission Store] 사용자 메뉴 조회 실패 (${apiUrl}):`, err)
      error.value = err instanceof Error ? err.message : '알 수 없는 오류'

      // API 실패 시 빈 배열 반환
      userMenus.value = []
      lastFetched.value = Date.now()

      return []
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
   * [레거시] 특정 메뉴 권한 조회 (menuId 기반)
   *
   * 새 시스템: getPermissionByMenuCode(menuCode)를 사용
   * 하위 호환성을 위해 유지
   */
  async function fetchMenuAuth(menuId: number): Promise<MenuAuth> {
    const authStore = useAuthStore()

    // loginId로 체크 (API 호출에 loginId 사용)
    if (!authStore.user?.loginId) {
      console.warn('사용자 정보가 없습니다 (loginId 없음)')
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

      // 백엔드 응답 형식 처리:
      // 1. 객체 직접 반환: { readAuth: 'Y', ... } (현재 백엔드 방식)
      // 2. 래퍼 형식: { success: true, data: {...} } (레거시 호환)
      let auth: MenuAuth | null = null

      if (data.readAuth !== undefined) {
        // 객체 직접 반환 (현재 백엔드 방식)
        auth = data as MenuAuth
      } else if (data.success && data.data) {
        // 래퍼 형식 (레거시 호환)
        auth = data.data
      }

      if (auth) {
        // 캐시 업데이트
        menuPermissions.value.set(menuId, {
          menuId,
          auth,
          cachedAt: Date.now()
        })

        return auth
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
   * [레거시] URL로 메뉴 찾기
   *
   * 새 시스템: inferMenuCodeFromUrl(url) + getPermissionByMenuCode(menuCode)를 사용
   * 사이드바 메뉴에서 검색하므로 등록/수정 페이지는 찾지 못할 수 있음
   * 하위 호환성을 위해 유지
   *
   * - trailing slash 제거하여 비교 (예: /admin/delivery/list/ → /admin/delivery/list)
   */
  function findMenuByUrl(url: string): Menu | null {
    // trailing slash 제거 (루트 경로 '/'는 유지)
    const normalizeUrl = (u: string) => u.length > 1 ? u.replace(/\/$/, '') : u

    const normalizedUrl = normalizeUrl(url)

    function searchMenu(menus: Menu[]): Menu | null {
      for (const menu of menus) {
        const normalizedMenuUrl = normalizeUrl(menu.menuUrl || '')
        if (normalizedMenuUrl === normalizedUrl) return menu

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
    permissionFlatMap.value.clear()
    lastFetched.value = null
    error.value = null
  }

  // ========================================
  // 권한 플랫맵 시스템 (새 시스템)
  // ========================================

  /**
   * 권한 플랫맵 로드
   * 로그인 시 1회 호출하여 모든 메뉴 권한을 플랫맵으로 캐시
   *
   * @throws Error API 호출 실패 시 (재시도 로직은 호출자에서 처리)
   */
  async function fetchPermissionFlatMap(): Promise<void> {
    const authStore = useAuthStore()

    if (!authStore.user?.loginId) {
      console.warn('[Permission] 사용자 정보 없음 (loginId)')
      throw new Error('사용자 정보 없음 (loginId)')
    }

    const token = localStorage.getItem('auth_access_token')
    if (!token) {
      console.warn('[Permission] 액세스 토큰 없음')
      throw new Error('액세스 토큰 없음')
    }

    loading.value = true
    error.value = null

    try {
      const { MENU_ENDPOINTS } = await import('~/services/api/endpoints/menu.endpoints')
      const apiUrl = MENU_ENDPOINTS.permissionFlatMap(authStore.user.loginId)

      console.log('[Permission] 권한 플랫맵 로드 시작:', authStore.user.loginId)

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        const errorMsg = `권한 플랫맵 조회 실패: ${response.status} ${errorText}`
        error.value = errorMsg
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // permissions 객체를 Map으로 변환
      if (data.permissions && typeof data.permissions === 'object') {
        permissionFlatMap.value = new Map(Object.entries(data.permissions))
        lastFetched.value = Date.now()
        console.log('[Permission] 권한 플랫맵 로드 완료:', {
          사용자: authStore.user.loginId,
          역할: authStore.user.role,
          메뉴수: permissionFlatMap.value.size
        })
      } else {
        console.warn('[Permission] 권한 플랫맵 응답 형식 오류:', data)
        // 빈 응답이지만 에러는 아님 (권한 없는 사용자일 수 있음)
        permissionFlatMap.value = new Map()
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류'
      console.error('[Permission] 권한 플랫맵 로드 실패:', errorMsg)
      error.value = errorMsg
      // 실패 시에도 빈 맵으로 초기화 (UI 렌더링 가능하도록)
      permissionFlatMap.value = new Map()
      throw err // 재시도 로직을 위해 에러 전파
    } finally {
      loading.value = false
    }
  }

  /**
   * 메뉴 코드로 권한 조회 (플랫맵에서 즉시 반환)
   * @param menuCode 메뉴 코드 (예: ORDER, SHIPPING, TRANSPORT)
   */
  function getPermissionByMenuCode(menuCode: string): MenuAuth {
    const auth = permissionFlatMap.value.get(menuCode)
    if (auth) {
      return auth as MenuAuth
    }
    // 플랫맵에 없으면 기본 권한 반환
    return getNoAuth()
  }

  /**
   * URL 패턴에서 메뉴 코드 추론
   * 등록/수정 페이지도 부모 메뉴의 권한을 상속받도록 처리
   *
   * @example
   * /admin/order/list → ORDER
   * /admin/order/register → ORDER
   * /admin/order/edit/123 → ORDER
   * /admin/transport/register → TRANSPORT
   * /admin/basic-info/company → BASIC_INFO
   */
  function inferMenuCodeFromUrl(url: string): string | null {
    // URL 정규화: trailing slash 제거
    const normalizedUrl = url.length > 1 ? url.replace(/\/$/, '') : url

    // /admin/{segment}/... 패턴에서 segment 추출
    const match = normalizedUrl.match(/^\/admin\/([^\/]+)/)
    if (!match) return null

    const segment = match[1]

    // 특수 케이스 매핑 (하이픈 포함 경로 등)
    const specialMapping: Record<string, string> = {
      'basic-info': 'BASIC_INFO',
      'order-request': 'ORDER_REQUEST',
      'access-log': 'ACCESS_LOG',
      'system': 'SYSTEM',
      'delivery-done': 'DELIVERY_DONE'
    }

    if (specialMapping[segment]) {
      return specialMapping[segment]
    }

    // 일반 케이스: 소문자를 대문자로, 하이픈을 언더스코어로
    return segment.toUpperCase().replace(/-/g, '_')
  }

  /**
   * 플랫맵이 로드되었는지 확인
   */
  function isPermissionFlatMapLoaded(): boolean {
    return permissionFlatMap.value.size > 0
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
    const userId = authStore.user?.userId

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
    const userId = authStore.user?.userId

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
    const userId = authStore.user?.userId

    // 운송기사
    if (isDeliveryDriver.value) {
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
    permissionFlatMap,
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
    isDeliveryDriver,
    isReadOnly,

    // Actions
    fetchUserMenus,
    fetchMenuAuth,
    hasPermission,
    findMenuByUrl,
    findMenuByCode,
    clearCache,

    // 권한 플랫맵 시스템 (새 시스템)
    fetchPermissionFlatMap,
    getPermissionByMenuCode,
    inferMenuCodeFromUrl,
    isPermissionFlatMapLoaded,

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
