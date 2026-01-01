/**
 * 권한 체크 Composable
 *
 * 페이지/컴포넌트에서 권한 확인을 위한 헬퍼
 *
 * @example
 * // 페이지에서 사용
 * const { canRead, canWrite, canEdit, canDelete, initPermission } = usePermission()
 *
 * // 메뉴 코드로 권한 확인
 * const { canRead } = usePermission('ORDER_LIST')
 *
 * // 버튼 표시 제어
 * <button v-if="canWrite">등록</button>
 * <button v-if="canEdit">수정</button>
 * <button v-if="canDelete">삭제</button>
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '~/stores/permission'
import { useAuthStore } from '~/stores/auth'
import type { MenuAuth, Menu } from '~/types/menu'

export interface UsePermissionOptions {
  /** 메뉴 코드 (지정하면 해당 메뉴의 권한 사용) */
  menuCode?: string
  /** 메뉴 ID (지정하면 해당 메뉴의 권한 사용) */
  menuId?: number
  /** 자동 초기화 여부 (기본: true) */
  autoInit?: boolean
}

export function usePermission(options: UsePermissionOptions | string = {}) {
  // 문자열로 전달된 경우 menuCode로 처리
  const opts = typeof options === 'string' ? { menuCode: options } : options
  const { menuCode, menuId, autoInit = true } = opts

  const permissionStore = usePermissionStore()
  const authStore = useAuthStore()
  const route = useRoute()

  // ========================================
  // State
  // ========================================

  // 현재 메뉴
  const currentMenu = ref<Menu | null>(null)

  // 현재 메뉴 권한
  const currentAuth = ref<MenuAuth>({
    readAuth: 'N',
    writeAuth: 'N',
    editAuth: 'N',
    deleteAuth: 'N'
  })

  // 로딩 상태
  const loading = ref(false)

  // 초기화 완료 여부
  const initialized = ref(false)

  // ========================================
  // Computed - 권한 체크
  // ========================================

  /** 조회 권한 */
  const canRead = computed(() => {
    // 전체 접근 권한이면 항상 허용
    if (permissionStore.isFullAccess) return true
    return currentAuth.value.readAuth === 'Y'
  })

  /** 등록 권한 */
  const canWrite = computed(() => {
    if (permissionStore.isFullAccess) return true
    return currentAuth.value.writeAuth === 'Y'
  })

  /** 수정 권한 */
  const canEdit = computed(() => {
    if (permissionStore.isFullAccess) return true
    return currentAuth.value.editAuth === 'Y'
  })

  /** 삭제 권한 */
  const canDelete = computed(() => {
    if (permissionStore.isFullAccess) return true
    return currentAuth.value.deleteAuth === 'Y'
  })

  /** 권한 없음 */
  const hasNoAccess = computed(() => !canRead.value)

  /** 조회 전용 */
  const isViewOnly = computed(() => canRead.value && !canWrite.value && !canEdit.value && !canDelete.value)

  // ========================================
  // Computed - 역할 기반
  // ========================================

  /** 전체 접근 권한 (SYSTEM_ADMIN, LEADPOWER_MANAGER) */
  const isFullAccess = computed(() => permissionStore.isFullAccess)

  /** OEM 담당자 */
  const isOemManager = computed(() => permissionStore.isOemManager)

  /** 시공사 담당자 */
  const isSiteManager = computed(() => permissionStore.isSiteManager)

  /** 감리원 */
  const isSiteInspector = computed(() => permissionStore.isSiteInspector)

  /** 운송기사 */
  const isDeliveryDriver = computed(() => permissionStore.isDeliveryDriver)

  /** 조회 전용 역할 */
  const isReadOnlyRole = computed(() => permissionStore.isReadOnly)

  /** 현재 사용자 역할 */
  const currentRole = computed(() => permissionStore.currentUserRole)

  // ========================================
  // Actions
  // ========================================

  /**
   * 권한 초기화
   */
  async function initPermission(): Promise<void> {
    if (!authStore.isLoggedIn) {
      console.warn('로그인되지 않은 상태에서 권한 초기화 시도')
      return
    }

    loading.value = true

    try {
      // 메뉴 목록 조회 (캐시 활용)
      await permissionStore.fetchUserMenus()

      // 현재 메뉴 찾기
      if (menuId) {
        // menuId로 찾기
        const menu = findMenuById(menuId)
        if (menu) {
          currentMenu.value = menu
          await loadMenuAuth(menu.menuId)
        }
      } else if (menuCode) {
        // menuCode로 찾기
        const menu = permissionStore.findMenuByCode(menuCode)
        if (menu) {
          currentMenu.value = menu
          await loadMenuAuth(menu.menuId)
        }
      } else {
        // URL로 찾기
        const currentPath = route.path
        const menu = permissionStore.findMenuByUrl(currentPath)
        if (menu) {
          currentMenu.value = menu
          await loadMenuAuth(menu.menuId)
        } else {
          // URL에서 메뉴를 찾지 못한 경우 기본 권한 적용
          console.warn('현재 URL에 해당하는 메뉴를 찾을 수 없습니다:', currentPath)
          // 전체 접근 권한이 있으면 모든 권한 허용
          if (permissionStore.isFullAccess) {
            currentAuth.value = permissionStore.getAllAuth()
          }
        }
      }

      initialized.value = true
    } catch (error) {
      console.error('권한 초기화 실패:', error)
      // 실패 시 기본 권한 적용
      if (permissionStore.isFullAccess) {
        currentAuth.value = permissionStore.getAllAuth()
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 메뉴 ID로 권한 로드
   */
  async function loadMenuAuth(targetMenuId: number): Promise<void> {
    const auth = await permissionStore.fetchMenuAuth(targetMenuId)
    currentAuth.value = auth
  }

  /**
   * 메뉴 ID로 메뉴 찾기
   */
  function findMenuById(targetMenuId: number): Menu | null {
    function search(menus: Menu[]): Menu | null {
      for (const menu of menus) {
        if (menu.menuId === targetMenuId) return menu
        if (menu.children) {
          const found = search(menu.children)
          if (found) return found
        }
      }
      return null
    }
    return search(permissionStore.userMenus)
  }

  /**
   * 특정 메뉴의 권한 확인
   */
  function checkMenuPermission(targetMenuId: number, authType: keyof MenuAuth): boolean {
    return permissionStore.hasPermission(targetMenuId, authType)
  }

  /**
   * 권한 새로고침
   */
  async function refreshPermission(): Promise<void> {
    permissionStore.clearCache()
    await initPermission()
  }

  // ========================================
  // 데이터 소유권 기반 접근 제어
  // ========================================

  /**
   * 납품요구 접근 권한 확인
   */
  function canAccessOrder(order: { siteManagerId?: number; siteInspectorId?: number }): boolean {
    return permissionStore.canAccessOrder(order)
  }

  /**
   * 출하 접근 권한 확인
   */
  function canAccessShipment(shipment: { oemManagerId?: number; siteManagerId?: number }): boolean {
    return permissionStore.canAccessShipment(shipment)
  }

  /**
   * 운송장 접근 권한 확인
   */
  function canAccessTransport(transport: { courierId?: number; oemManagerId?: number; siteManagerId?: number }): boolean {
    return permissionStore.canAccessTransport(transport)
  }

  // ========================================
  // Lifecycle
  // ========================================

  // 자동 초기화
  if (autoInit) {
    onMounted(() => {
      if (authStore.isLoggedIn) {
        initPermission()
      }
    })

    // 로그인 상태 변경 감지
    watch(() => authStore.isLoggedIn, (isLoggedIn) => {
      if (isLoggedIn && !initialized.value) {
        initPermission()
      } else if (!isLoggedIn) {
        // 로그아웃 시 초기화
        currentMenu.value = null
        currentAuth.value = permissionStore.getNoAuth()
        initialized.value = false
      }
    })
  }

  // ========================================
  // Return
  // ========================================

  return {
    // State
    currentMenu,
    currentAuth,
    loading,
    initialized,

    // 권한 체크
    canRead,
    canWrite,
    canEdit,
    canDelete,
    hasNoAccess,
    isViewOnly,

    // 역할 기반
    isFullAccess,
    isOemManager,
    isSiteManager,
    isSiteInspector,
    isDeliveryDriver,
    isReadOnlyRole,
    currentRole,

    // Actions
    initPermission,
    checkMenuPermission,
    refreshPermission,

    // 데이터 소유권 기반 접근 제어
    canAccessOrder,
    canAccessShipment,
    canAccessTransport
  }
}

/**
 * 권한에 따른 버튼 표시 Composable
 *
 * @example
 * const { showCreateButton, showEditButton, showDeleteButton } = usePermissionButtons()
 *
 * <button v-if="showCreateButton">등록</button>
 */
export function usePermissionButtons(menuCode?: string) {
  const { canRead, canWrite, canEdit, canDelete, isFullAccess } = usePermission(menuCode ? { menuCode } : {})

  return {
    /** 등록 버튼 표시 여부 */
    showCreateButton: canWrite,

    /** 수정 버튼 표시 여부 */
    showEditButton: canEdit,

    /** 삭제 버튼 표시 여부 */
    showDeleteButton: canDelete,

    /** 조회 버튼 표시 여부 (항상 표시, 권한 체크용) */
    showViewButton: canRead,

    /** 관리자 전용 버튼 표시 여부 */
    showAdminButton: isFullAccess
  }
}
