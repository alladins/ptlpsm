<template>
  <div class="sidebar-menu" :class="{ 'mobile-open': mobileOpen }">
    <!-- 로고 영역 -->
    <div class="sidebar-header">
      <NuxtLink to="/admin" class="sidebar-logo">
        <img src="/images/common/logo.png" alt="PTPLPSM" class="sidebar-logo-img">
        <span class="sidebar-logo-text">출하시스템</span>
      </NuxtLink>
      <!-- 모바일 닫기 버튼 -->
      <button class="mobile-close-btn" @click="$emit('close-mobile')">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- 메뉴 영역 -->
    <nav class="sidebar-nav">
      <ul class="menu-list">
        <li 
          v-for="menu in menus" 
          :key="menu.menuId" 
          class="menu-item"
          :class="{ 'has-submenu': menu.children && menu.children.length > 0 }"
        >
          <!-- 1차 메뉴 -->
          <div 
            class="menu-link"
            :class="{ 'active': isActiveMenu(menu) }"
            @click="toggleSubmenu(menu)"
          >
            <i :class="menu.menuIcon" class="menu-icon"></i>
            <span class="menu-text">{{ menu.menuName }}</span>
            <i 
              v-if="menu.children && menu.children.length > 0"
              class="submenu-arrow fas fa-chevron-down"
              :class="{ 'rotated': expandedMenus.includes(menu.menuId) }"
            ></i>
          </div>

          <!-- 2차 메뉴 -->
          <ul 
            v-if="menu.children && menu.children.length > 0"
            class="submenu-list"
            :class="{ 'expanded': expandedMenus.includes(menu.menuId) }"
          >
            <li 
              v-for="submenu in menu.children" 
              :key="submenu.menuId"
              class="submenu-item"
            >
              <NuxtLink 
                :to="submenu.menuUrl" 
                class="submenu-link"
                :class="{ 'active': isActiveSubmenu(submenu) }"
              >
                <i :class="submenu.menuIcon" class="submenu-icon"></i>
                <span class="submenu-text">{{ submenu.menuName }}</span>
              </NuxtLink>
            </li>
          </ul>
        </li>
      </ul>
    </nav>

    <!-- 사용자 정보 -->
    <div class="sidebar-footer">
      <div class="user-info" @click="toggleUserMenu">
        <div class="user-avatar">
          <img 
            src="/images/common/ico_my.png" 
            alt="사용자 프로필" 
            class="user-avatar-img"
            @error="showAvatarFallback = true"
          >
          <div v-if="showAvatarFallback" class="user-avatar-fallback">
            <i class="fas fa-user"></i>
          </div>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userInfo.name }}</div>
          <div class="user-role">{{ userInfo.role }}</div>
        </div>
        <div class="user-menu-arrow">
          <i class="fas fa-chevron-up" :class="{ 'rotated': isUserMenuOpen }"></i>
        </div>
      </div>
      
      <!-- 사용자 메뉴 드롭다운 -->
      <div v-if="isUserMenuOpen" class="user-menu-dropdown">
        <NuxtLink to="/profile" class="user-menu-item" @click="closeUserMenu">
          <i class="fas fa-user"></i>
          <span>내 정보</span>
        </NuxtLink>
        <NuxtLink to="/admin/settings" class="user-menu-item" @click="closeUserMenu">
          <i class="fas fa-cog"></i>
          <span>설정</span>
        </NuxtLink>
        <!-- 사용자 전환 (SYSTEM_ADMIN만 표시) -->
        <button
          v-if="authStore.canImpersonate"
          @click="openUserSwitchModal"
          class="user-menu-item user-switch-item"
        >
          <i class="fas fa-user-secret"></i>
          <span>사용자 전환</span>
        </button>
        <div class="user-menu-divider"></div>
        <button @click="handleLogout" class="user-menu-item logout-item">
          <i class="fas fa-sign-out-alt"></i>
          <span>로그아웃</span>
        </button>
      </div>
    </div>

    <!-- 사용자 전환 모달 -->
    <UserSwitchModal
      :show="isUserSwitchModalOpen"
      @close="closeUserSwitchModal"
      @switched="handleUserSwitched"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from '#imports'
import type { Menu, MenuAuth } from '~/types/menu'
import { usePermissionStore } from '~/stores/permission'
import { useAuthStore } from '~/stores/auth'
import UserSwitchModal from '~/components/admin/common/UserSwitchModal.vue'

// Props
interface Props {
  collapsed?: boolean
  mobileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  mobileOpen: false
})

// Emits
const emit = defineEmits<{
  logout: []
  'close-mobile': []
}>()

// Stores
const permissionStore = usePermissionStore()
const authStore = useAuthStore()

// 메뉴 + 권한 타입
interface MenuWithAuth extends Menu {
  auth?: MenuAuth
  children?: MenuWithAuth[]
}

// 수동으로 정의한 메뉴 구조
const manualMenus = ref<MenuWithAuth[]>([
  {
    menuId: 1,
    menuCode: 'SALES',
    menuName: '영업관리',
    menuUrl: '/admin/sales/list',
    menuIcon: 'fas fa-chart-line',
    menuLevel: 1,
    sortOrder: 1,
    visible: 'Y',
    useYn: 'Y',
    target: '_self',
  },
  {
    menuId: 2,
    menuCode: 'ORDER',
    menuName: '납품요구관리',
    menuUrl: '/admin/order/list',
    menuIcon: 'fas fa-shopping-cart',
    menuLevel: 1,
    sortOrder: 2,
    visible: 'Y',
    useYn: 'Y',
    target: '_self'
  },
  {
    menuId: 3,
    menuCode: 'SHIPPING',
    menuName: '출하관리',
    menuUrl: '/admin/shipping/list',
    menuIcon: 'fas fa-truck',
    menuLevel: 1,
    sortOrder: 3,
    visible: 'Y',
    useYn: 'Y'
  },
  {
    menuId: 4,
    menuCode: 'TRANSPORT',
    menuName: '운송장관리',
    menuUrl: '/admin/transport/list',
    menuIcon: 'fas fa-route',
    menuLevel: 1,
    sortOrder: 4,
    visible: 'Y',
    useYn: 'Y'
  },
  {
    menuId: 5,
    menuCode: 'DELIVERY',
    menuName: '납품확인관리',
    menuUrl: '/admin/delivery/list',
    menuIcon: 'fas fa-check-circle',
    menuLevel: 1,
    sortOrder: 5,
    visible: 'Y',
    useYn: 'Y'
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
    sortOrder: 7,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 71,
        menuCode: 'STAT_SALES',
        menuName: '영업통계',
        menuUrl: '/admin/statistics/sales',
        menuIcon: 'fas fa-chart-line',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 72,
        menuCode: 'STAT_REGION',
        menuName: '지역별통계',
        menuUrl: '/admin/statistics/region',
        menuIcon: 'fas fa-map-marker-alt',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 73,
        menuCode: 'STAT_SHIPMENT',
        menuName: '출하현황통계',
        menuUrl: '/admin/statistics/shipment',
        menuIcon: 'fas fa-truck-loading',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
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
    sortOrder: 8,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 101,
        menuCode: 'MESSAGE_TEMPLATE',
        menuName: '메시지 템플릿 관리',
        menuUrl: '/admin/basic-info/message-templates/list',
        menuIcon: 'fas fa-file-lines',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 102,
        menuCode: 'MESSAGE_HISTORY',
        menuName: '메시지 히스토리',
        menuUrl: '/admin/message/history',
        menuIcon: 'fas fa-clock-rotate-left',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
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
    sortOrder: 9,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 81,
        menuCode: 'CODE_MANAGE',
        menuName: '코드관리',
        menuUrl: '/admin/basic-info/code',
        menuIcon: 'fas fa-code',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 82,
        menuCode: 'ITEM_MANAGE',
        menuName: '품목관리',
        menuUrl: '/admin/basic-info/item',
        menuIcon: 'fas fa-boxes',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 83,
        menuCode: 'USER_MANAGE',
        menuName: '사용자관리',
        menuUrl: '/admin/basic-info/user',
        menuIcon: 'fas fa-users',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 84,
        menuCode: 'ORG_MANAGE',
        menuName: '수요기관관리',
        menuUrl: '/admin/basic-info/organization',
        menuIcon: 'fas fa-building',
        menuLevel: 2,
        sortOrder: 4,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 85,
        menuCode: 'COMPANY_MANAGE',
        menuName: '회사정보',
        menuUrl: '/admin/basic-info/company',
        menuIcon: 'fas fa-building-user',
        menuLevel: 2,
        sortOrder: 5,
        visible: 'Y',
        useYn: 'Y',
        children: []
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
    sortOrder: 10,
    visible: 'Y',
    useYn: 'Y',
    children: [
      {
        menuId: 91,
        menuCode: 'SYSTEM_CONFIG',
        menuName: '시스템설정',
        menuUrl: '/admin/system/config',
        menuIcon: 'fas fa-cog',
        menuLevel: 2,
        sortOrder: 1,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 92,
        menuCode: 'MENU_AUTH',
        menuName: '메뉴권한관리',
        menuUrl: '/admin/system/menu-auth',
        menuIcon: 'fas fa-key',
        menuLevel: 2,
        sortOrder: 2,
        visible: 'Y',
        useYn: 'Y',
        children: []
      },
      {
        menuId: 93,
        menuCode: 'ACCESS_LOG',
        menuName: '접근로그',
        menuUrl: '/admin/system/access-log',
        menuIcon: 'fas fa-history',
        menuLevel: 2,
        sortOrder: 3,
        visible: 'Y',
        useYn: 'Y',
        children: []
      }
    ]
  }
])

// Reactive data
const rawMenus = ref<MenuWithAuth[]>([])
const expandedMenus = ref<number[]>([])
const userInfo = ref({
  name: '관리자',
  role: '시스템 관리자'
})

// Computed
const route = useRoute()
const router = useRouter()

/**
 * 권한 필터링된 메뉴 목록
 * - readAuth가 'Y'인 메뉴만 표시
 * - 전체 접근 권한(SYSTEM_ADMIN, LEADPOWER_MANAGER)은 모든 메뉴 표시
 */
const menus = computed(() => {
  // 전체 접근 권한이 있으면 필터링 없이 모두 표시
  if (permissionStore.isFullAccess) {
    return rawMenus.value
  }

  // 권한 기반 필터링
  return filterMenusByPermission(rawMenus.value)
})

/**
 * 메뉴 권한 필터링 (재귀)
 */
function filterMenusByPermission(menuList: MenuWithAuth[]): MenuWithAuth[] {
  return menuList
    .filter(menu => {
      // auth 정보가 없으면 기본적으로 표시 (호환성)
      if (!menu.auth) return true
      // readAuth가 'Y'인 경우만 표시
      return menu.auth.readAuth === 'Y'
    })
    .map(menu => {
      // 하위 메뉴가 있으면 재귀적으로 필터링
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenusByPermission(menu.children)
        return {
          ...menu,
          children: filteredChildren
        }
      }
      return menu
    })
    .filter(menu => {
      // 1차 메뉴 중 하위 메뉴가 있었는데 필터링 후 비어있으면 제외
      if (menu.children !== undefined && menu.children.length === 0) {
        // 원래 children이 있었는지 확인 (manualMenus에서)
        const originalMenu = findOriginalMenu(menu.menuId)
        if (originalMenu?.children && originalMenu.children.length > 0) {
          return false
        }
      }
      return true
    })
}

/**
 * 원본 메뉴 찾기
 */
function findOriginalMenu(menuId: number): MenuWithAuth | null {
  function search(menus: MenuWithAuth[]): MenuWithAuth | null {
    for (const menu of menus) {
      if (menu.menuId === menuId) return menu
      if (menu.children) {
        const found = search(menu.children)
        if (found) return found
      }
    }
    return null
  }
  return search(manualMenus.value)
}

// Methods
const loadMenus = async () => {
  try {
    // 1. 기본 메뉴 구조 설정
    rawMenus.value = manualMenus.value

    // 2. 사용자 정보 업데이트
    if (authStore.user) {
      userInfo.value = {
        name: authStore.user.userName || '관리자',
        role: getRoleDisplayName(authStore.user.role)
      }
    }

    // 3. 사용자별 메뉴 권한 조회
    if (authStore.isLoggedIn && authStore.user?.userId) {
      try {
        const userMenusWithAuth = await permissionStore.fetchUserMenus()

        if (userMenusWithAuth && userMenusWithAuth.length > 0) {
          // 서버에서 받은 메뉴 사용 (권한 정보 포함)
          rawMenus.value = mergeMenuPermissions(manualMenus.value, userMenusWithAuth)
          console.log('사용자 권한 메뉴 로드 완료:', userMenusWithAuth.length, '개')
        }
      } catch (error) {
        console.warn('권한 정보 로딩 실패 (기본 메뉴 사용):', error)
        // API 실패 시 수동 메뉴 유지 (전체 접근 권한 허용)
      }
    }
  } catch (error) {
    console.error('메뉴 로딩 실패:', error)
    rawMenus.value = manualMenus.value
  }
}

/**
 * 역할 표시명 변환
 */
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'SYSTEM_ADMIN': '시스템 관리자',
    'LEADPOWER_MANAGER': '리드파워 담당자',
    'OEM_MANAGER': 'OEM 담당자',
    'SITE_MANAGER': '시공사 담당자',
    'SITE_INSPECTOR': '감리원',
    'SALES_MANAGER': '영업 담당자',
    'COURIER': '운송기사',
    'READ_ONLY': '조회 전용',
    'ADMINISTRATOR': '관리자'
  }
  return roleNames[role] || role || '사용자'
}

/**
 * 수동 메뉴와 서버 권한 정보 병합
 */
function mergeMenuPermissions(
  manualMenuList: MenuWithAuth[],
  serverMenus: (Menu & { auth?: MenuAuth })[]
): MenuWithAuth[] {
  // 서버 메뉴를 menuCode로 맵핑
  const serverMenuMap = new Map<string, Menu & { auth?: MenuAuth }>()

  function mapServerMenus(menus: (Menu & { auth?: MenuAuth })[]) {
    for (const menu of menus) {
      if (menu.menuCode) {
        serverMenuMap.set(menu.menuCode, menu)
      }
      if (menu.children) {
        mapServerMenus(menu.children as (Menu & { auth?: MenuAuth })[])
      }
    }
  }
  mapServerMenus(serverMenus)

  // 수동 메뉴에 서버 권한 정보 병합
  function merge(menus: MenuWithAuth[]): MenuWithAuth[] {
    return menus.map(menu => {
      const serverMenu = serverMenuMap.get(menu.menuCode)
      const mergedMenu: MenuWithAuth = {
        ...menu,
        auth: serverMenu?.auth || {
          readAuth: 'Y',  // 기본값: 조회 허용
          writeAuth: 'N',
          editAuth: 'N',
          deleteAuth: 'N'
        }
      }

      if (menu.children && menu.children.length > 0) {
        mergedMenu.children = merge(menu.children)
      }

      return mergedMenu
    })
  }

  return merge(manualMenuList)
}

/**
 * 메뉴 활성화/비활성화 토글
 */
const toggleMenuVisibility = (menuCode: string) => {
  const toggleMenu = (menus: Menu[]): Menu[] => {
    return menus.map(menu => {
      if (menu.menuCode === menuCode) {
        return {
          ...menu,
          useYn: menu.useYn === 'Y' ? 'N' : 'Y'
        }
      }
      if (menu.children && menu.children.length > 0) {
        return {
          ...menu,
          children: toggleMenu(menu.children)
        }
      }
      return menu
    })
  }
  
  manualMenus.value = toggleMenu(manualMenus.value)
  menus.value = manualMenus.value
}

/**
 * 메뉴 추가 (개발용)
 */
const addMenu = (parentMenuCode: string | null, newMenu: Omit<Menu, 'menuId'>) => {
  const newMenuWithId: Menu = {
    ...newMenu,
    menuId: Date.now() // 임시 ID 생성
  }
  
  if (!parentMenuCode) {
    // 최상위 메뉴 추가
    manualMenus.value.push(newMenuWithId)
  } else {
    // 하위 메뉴 추가
    const addToParent = (menus: Menu[]): Menu[] => {
      return menus.map(menu => {
        if (menu.menuCode === parentMenuCode) {
          return {
            ...menu,
            children: [...(menu.children || []), newMenuWithId]
          }
        }
        if (menu.children && menu.children.length > 0) {
          return {
            ...menu,
            children: addToParent(menu.children)
          }
        }
        return menu
      })
    }
    
    manualMenus.value = addToParent(manualMenus.value)
  }
  
  menus.value = manualMenus.value
}

/**
 * 메뉴 삭제 (개발용)
 */
const removeMenu = (menuCode: string) => {
  const removeFromMenus = (menus: Menu[]): Menu[] => {
    return menus.filter(menu => {
      if (menu.menuCode === menuCode) {
        return false
      }
      if (menu.children && menu.children.length > 0) {
        menu.children = removeFromMenus(menu.children)
      }
      return true
    })
  }
  
  manualMenus.value = removeFromMenus(manualMenus.value)
  menus.value = manualMenus.value
}

const toggleSubmenu = (menu: Menu) => {
  if (!menu.children || menu.children.length === 0) {
    // 서브메뉴가 없는 메뉴 클릭 시
    // 1. 열려있던 모든 서브메뉴 닫기
    expandedMenus.value = []

    // 2. 해당 페이지로 이동
    if (menu.menuUrl) {
      router.push(menu.menuUrl)
    }
    return
  }

  // 서브메뉴가 있는 메뉴의 경우
  const menuId = menu.menuId
  const index = expandedMenus.value.indexOf(menuId)

  if (index > -1) {
    // 이미 열려있는 메뉴를 클릭하면 닫기
    expandedMenus.value.splice(index, 1)
  } else {
    // 다른 메뉴를 클릭하면 기존 메뉴 모두 닫고 새 메뉴만 열기
    expandedMenus.value = [menuId]
  }
}

const isActiveMenu = (menu: Menu) => {
  if (menu.children && menu.children.length > 0) {
    return menu.children.some(submenu => isActiveSubmenu(submenu))
  }
  return route.path === menu.menuUrl
}

const isActiveSubmenu = (submenu: Menu) => {
  return route.path === submenu.menuUrl
}

const handleLogout = () => {
  emit('logout')
}

// User menu state
const isUserMenuOpen = ref(false)
const showAvatarFallback = ref(false)
const isUserSwitchModalOpen = ref(false)

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

// 외부 클릭 시 메뉴 닫기
const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

// 사용자 전환 모달 열기
const openUserSwitchModal = () => {
  closeUserMenu()
  isUserSwitchModalOpen.value = true
}

// 사용자 전환 모달 닫기
const closeUserSwitchModal = () => {
  isUserSwitchModalOpen.value = false
}

// 사용자 전환 완료 처리
const handleUserSwitched = (userId: string) => {
  console.log('사용자 전환 완료:', userId)
  closeUserSwitchModal()
}

// Lifecycle
onMounted(() => {
  loadMenus()

  // 외부 클릭 시 사용자 메뉴 닫기
  document.addEventListener('click', (event) => {
    const userInfoElement = document.querySelector('.user-info')
    const userMenuElement = document.querySelector('.user-menu-dropdown')

    if (userInfoElement && userMenuElement) {
      if (!userInfoElement.contains(event.target as Node) &&
          !userMenuElement.contains(event.target as Node)) {
        closeUserMenu()
      }
    }
  })
})

// 사용자 로그인 상태 변경 감시 - 메뉴 권한 다시 로드
watch(
  () => authStore.isLoggedIn,
  (newValue) => {
    if (newValue) {
      loadMenus()
    } else {
      // 로그아웃 시 메뉴 초기화
      rawMenus.value = manualMenus.value
      permissionStore.clearCache()
    }
  }
)

// 사용자 정보 변경 감시 - 표시명 업데이트
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      userInfo.value = {
        name: newUser.userName || '관리자',
        role: getRoleDisplayName(newUser.role)
      }
    }
  },
  { deep: true }
)
</script>

<style scoped>
.sidebar-menu {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  left: 0;
  top: 0;
  z-index: 1000;
}

.sidebar-header {
  height: 64px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  cursor: pointer;
}

.sidebar-logo-img {
  width: 50px;
  height: auto;
  object-fit: contain;
}

.sidebar-logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #ecf0f1;
  white-space: nowrap;
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.mobile-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  margin-bottom: 4px;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.menu-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-left-color: #3498db;
}

.menu-link.active {
  background-color: rgba(52, 152, 219, 0.2);
  border-left-color: #3498db;
}

.menu-icon {
  width: 20px;
  margin-right: 12px;
  font-size: 16px;
}

.menu-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.submenu-arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.submenu-arrow.rotated {
  transform: rotate(180deg);
}

.submenu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.submenu-list.expanded {
  max-height: 500px;
}

.submenu-item {
  margin: 0;
}

.submenu-link {
  display: flex;
  align-items: center;
  padding: 10px 20px 10px 52px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.submenu-link:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: white;
  border-left-color: #3498db;
}

.submenu-link.active {
  background-color: rgba(52, 152, 219, 0.1);
  color: #3498db;
  border-left-color: #3498db;
}

.submenu-icon {
  width: 16px;
  margin-right: 10px;
  font-size: 14px;
}

.submenu-text {
  font-size: 13px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  position: relative; /* For dropdown positioning */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 0;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.user-info:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  position: relative; /* For dropdown positioning */
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ecf0f1;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #ecf0f1;
}

.user-role {
  font-size: 12px;
  color: #bdc3c7;
  margin-top: 2px;
}

.user-menu-arrow {
  transition: transform 0.3s ease;
  font-size: 12px;
}

.user-menu-arrow.rotated {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  margin-bottom: 4px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: #495057;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  cursor: pointer;
}

.user-menu-item:hover {
  background-color: #f8f9fa;
  color: #111827;
  border-left-color: #3498db;
}

.user-menu-item i {
  width: 16px;
  text-align: center;
  margin-right: 12px;
  color: #6c757d;
}

.user-menu-item span {
  font-size: 13px;
}

.user-menu-divider {
  height: 1px;
  background-color: #e9ecef;
  margin: 8px 0;
}

.logout-item {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 8px 20px;
  width: 100%;
  text-align: left;
  transition: background-color 0.3s ease;
}

.logout-item:hover {
  background-color: #fef2f2;
  color: #991b1b;
}

/* 사용자 전환 버튼 스타일 */
.user-switch-item {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
}

.user-switch-item:hover {
  background-color: #eef2ff;
  color: #4f46e5;
}

.user-switch-item i {
  color: #6366f1 !important;
}

/* 반응형 */
@media (max-width: 768px) {
  .sidebar-menu {
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
  }

  .sidebar-menu.mobile-open {
    transform: translateX(0);
  }

  .mobile-close-btn {
    display: block;
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s ease;
    z-index: 1001;
  }
  
  .mobile-close-btn:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
  
  .mobile-close-btn:active {
    transform: scale(0.9);
  }
  
  /* 모바일에서 사이드바 내부 스크롤 */
  .sidebar-content {
    height: calc(100vh - 120px);
    overflow-y: auto;
  }
  
  /* 모바일에서 사이드바 헤더 조정 */
  .sidebar-header {
    padding: 20px 20px 20px 20px;
    position: relative;
  }
  
  .sidebar-logo {
    padding-right: 50px; /* 닫기 버튼 공간 확보 */
  }
  
  /* 모바일에서 메뉴 아이템 터치 최적화 */
  .menu-item {
    padding: 12px 20px;
    min-height: 48px;
  }
  
  .menu-item i {
    font-size: 18px;
    width: 24px;
  }
  
  .menu-item span {
    font-size: 16px;
  }
  
  /* 모바일에서 서브메뉴 최적화 */
  .submenu {
    padding-left: 20px;
  }
  
  .submenu .menu-item {
    padding: 10px 20px;
    min-height: 44px;
  }
  
  .submenu .menu-item i {
    font-size: 16px;
    width: 20px;
  }
  
  .submenu .menu-item span {
    font-size: 14px;
  }
}

/* 데스크톱에서는 사이드바가 항상 보이도록 */
@media (min-width: 769px) {
  .sidebar-menu {
    transform: translateX(0);
    position: relative;
    width: 280px;
  }
  
  .mobile-close-btn {
    display: none;
  }
}

  /* 모바일에서 사용자 메뉴 드롭다운 색상 표기 */
  .user-menu-dropdown {
    background: white;
    border: 1px solid #e9ecef;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 8px 0;
  }
  
  .user-menu-item {
    color: #495057;
    border-radius: 0;
    margin: 0;
    padding: 10px 20px;
    font-weight: normal;
  }
  
  .user-menu-item:hover {
    background-color: #f8f9fa;
    transform: none;
    box-shadow: none;
  }
  
  .user-menu-item i {
    color: #6c757d;
    font-size: 16px;
  }
  
  .user-menu-divider {
    background-color: #e9ecef;
    margin: 8px 0;
    height: 1px;
  }
</style>
