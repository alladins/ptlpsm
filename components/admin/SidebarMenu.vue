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
        <i class="fas fa-times" />
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
            <i :class="menu.menuIcon" class="menu-icon" />
            <span class="menu-text">{{ menu.menuName }}</span>
            <i
              v-if="menu.children && menu.children.length > 0"
              class="submenu-arrow fas fa-chevron-down"
              :class="{ 'rotated': expandedMenus.includes(menu.menuId) }"
            />
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
                <i :class="submenu.menuIcon" class="submenu-icon" />
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
            <i class="fas fa-user" />
          </div>
        </div>
        <div class="user-details">
          <div class="user-name">
            {{ userInfo.name }}
          </div>
          <div class="user-role">
            {{ userInfo.role }}
          </div>
        </div>
        <div class="user-menu-arrow">
          <i class="fas fa-chevron-up" :class="{ 'rotated': isUserMenuOpen }" />
        </div>
      </div>

      <!-- 사용자 메뉴 드롭다운 -->
      <div v-if="isUserMenuOpen" class="user-menu-dropdown">
        <NuxtLink to="/profile" class="user-menu-item" @click="closeUserMenu">
          <i class="fas fa-user" />
          <span>내 정보</span>
        </NuxtLink>
        <NuxtLink to="/sitemap" class="user-menu-item" @click="closeUserMenu">
          <i class="fas fa-sitemap" />
          <span>사이트맵</span>
        </NuxtLink>
        <NuxtLink to="/help" class="user-menu-item" @click="closeUserMenu">
          <i class="fas fa-question-circle" />
          <span>도움말</span>
        </NuxtLink>
        <!-- 사용자 전환 (SYSTEM_ADMIN만 표시) -->
        <button
          v-if="authStore.canImpersonate"
          class="user-menu-item user-switch-item"
          @click="openUserSwitchModal"
        >
          <i class="fas fa-user-secret" />
          <span>사용자 전환</span>
        </button>
        <div class="user-menu-divider" />
        <button class="user-menu-item logout-item" @click="handleLogout">
          <i class="fas fa-sign-out-alt" />
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
import { getRoleName } from '~/types/user'
import UserSwitchModal from '~/components/admin/common/UserSwitchModal.vue'
import { ADMIN_MENUS, type MenuWithAuth as AdminMenuWithAuth } from '~/constants/adminMenus'

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

// 수동으로 정의한 메뉴 구조 (constants/adminMenus.ts 에서 import)
const manualMenus = ref<AdminMenuWithAuth[]>(ADMIN_MENUS)

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
 * - 전체 접근 권한(SYSTEM_ADMIN)은 모든 메뉴 표시
 * - 그 외 역할은 role_menu_auth 권한 설정에 따라 필터링
 */
const menus = computed(() => {
  // 전체 접근 권한이 있으면 필터링 없이 모두 표시 (SYSTEM_ADMIN)
  if (permissionStore.isFullAccess) {
    return rawMenus.value
  }

  // 권한 기반 필터링
  return filterMenusByPermission(rawMenus.value)
})

/**
 * 메뉴 권한 필터링 (재귀)
 *
 * 보안 우선 정책:
 * - auth 정보가 없으면 메뉴 숨김 (API에서 명시적 허용 필요)
 * - isFullAccess(SYSTEM_ADMIN)는 이 함수 호출 전에 처리됨
 * - 부모 메뉴는 자식 중 하나라도 권한이 있으면 표시
 */
function filterMenusByPermission (menuList: MenuWithAuth[]): MenuWithAuth[] {
  return menuList
    .map((menu) => {
      // 하위 메뉴가 있으면 먼저 재귀적으로 필터링
      if (menu.children && menu.children.length > 0) {
        const filteredChildren = filterMenusByPermission(menu.children)
        return {
          ...menu,
          children: filteredChildren
        }
      }
      return menu
    })
    .filter((menu) => {
      // 1. 하위 메뉴가 있는 부모 메뉴인 경우
      if (menu.children && menu.children.length > 0) {
        // 필터링된 자식 메뉴가 하나라도 있으면 부모 표시
        return true
      }

      // 2. 원래 자식이 있었는데 필터링 후 비어있는 경우 → 숨김
      const originalMenu = findOriginalMenu(menu.menuId)
      if (originalMenu?.children && originalMenu.children.length > 0) {
        return false
      }

      // 3. 단일 메뉴(자식 없음)인 경우 → readAuth 확인
      if (!menu.auth) {
        return false
      }

      return menu.auth.readAuth === 'Y'
    })
}

/**
 * 원본 메뉴 찾기
 */
function findOriginalMenu (menuId: number): MenuWithAuth | null {
  function search (menus: MenuWithAuth[]): MenuWithAuth | null {
    for (const menu of menus) {
      if (menu.menuId === menuId) { return menu }
      if (menu.children) {
        const found = search(menu.children)
        if (found) { return found }
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

    // 3. 사용자별 메뉴 권한 조회 (loginId로 체크 - userId는 백엔드 응답에 없을 수 있음)
    if (authStore.isLoggedIn && authStore.user?.loginId) {
      try {
        const userMenusWithAuth = await permissionStore.fetchUserMenus()

        if (userMenusWithAuth && userMenusWithAuth.length > 0) {
          // 서버에서 받은 메뉴 사용 (권한 정보 포함)
          rawMenus.value = mergeMenuPermissions(manualMenus.value, userMenusWithAuth)
        }
      } catch (error) {
        console.warn('❌ [loadMenus] 권한 정보 로딩 실패 (기본 메뉴 사용):', error)
        // API 실패 시 수동 메뉴 유지 (전체 접근 권한 허용)
      }
    }
  } catch (error) {
    console.error('❌ [loadMenus] 메뉴 로딩 실패:', error)
    rawMenus.value = manualMenus.value
  }
}

/**
 * 역할 표시명 변환
 */
function getRoleDisplayName (role: string): string {
  const roleNames: Record<string, string> = {
    SYSTEM_ADMIN: '시스템관리자',
    LEADPOWER_MANAGER: '리드파워 담당자',
    OEM_MANAGER: 'OEM 담당자',
    SITE_MANAGER: '시공사 담당자',
    SITE_INSPECTOR: '시공사 감리원',
    SALES_MANAGER: '영업 담당자',
    DELIVERY_DRIVER: '운송기사',
    READ_ONLY: '조회 전용'
  }
  return roleNames[role] || role || '사용자'
}

/**
 * 수동 메뉴와 서버 권한 정보 병합
 *
 * 보안 우선 정책:
 * - 서버에서 권한 정보가 없으면 기본적으로 접근 불허
 * - API에서 명시적으로 readAuth: 'Y'를 받아야만 메뉴 표시
 */
function mergeMenuPermissions (
  manualMenuList: MenuWithAuth[],
  serverMenus: (Menu & { auth?: MenuAuth })[]
): MenuWithAuth[] {
  // 서버 메뉴를 menuCode로 맵핑
  const serverMenuMap = new Map<string, Menu & { auth?: MenuAuth }>()

  function mapServerMenus (menus: (Menu & { auth?: MenuAuth })[]) {
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
  function merge (menus: MenuWithAuth[]): MenuWithAuth[] {
    return menus.map((menu) => {
      const serverMenu = serverMenuMap.get(menu.menuCode)
      const mergedMenu: MenuWithAuth = {
        ...menu,
        // ✅ 보안 우선: 서버 권한 없으면 기본적으로 접근 불허
        auth: serverMenu?.auth || {
          readAuth: 'N', // 기본값: 조회 불허 (API에서 명시적 허용 필요)
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
  const isExpanded = expandedMenus.value.includes(menuId)

  if (isExpanded) {
    // 이미 열려있는 메뉴를 클릭하면 닫기만 수행
    expandedMenus.value = expandedMenus.value.filter(id => id !== menuId)
  } else {
    // 닫혀있으면: 메뉴 열기 + 첫 번째 서브메뉴로 이동
    expandedMenus.value = [menuId]

    // 첫 번째 서브메뉴의 URL로 페이지 이동
    const firstChild = menu.children[0]
    if (firstChild?.menuUrl) {
      router.push(firstChild.menuUrl)
    }
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
const handleUserSwitched = (userId: number) => {
  closeUserSwitchModal()
}

// Lifecycle
onMounted(() => {
  loadMenus()

  // 외부 클릭 시 사용자 메뉴 닫기
  const handleOutsideClick = (event: MouseEvent) => {
    const userInfoElement = document.querySelector('.user-info')
    const userMenuElement = document.querySelector('.user-menu-dropdown')

    if (userInfoElement && userMenuElement) {
      if (!userInfoElement.contains(event.target as Node) &&
          !userMenuElement.contains(event.target as Node)) {
        closeUserMenu()
      }
    }
  }
  document.addEventListener('click', handleOutsideClick)

  onUnmounted(() => {
    document.removeEventListener('click', handleOutsideClick)
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

// 사용자 정보 변경 감시 - 표시명 업데이트 및 메뉴 권한 재로드
watch(
  () => authStore.user,
  (newUser, oldUser) => {
    if (newUser) {
      // 표시명 업데이트
      userInfo.value = {
        name: newUser.userName || '관리자',
        role: getRoleDisplayName(newUser.role)
      }

      // ✅ 사용자가 변경되었으면 메뉴 권한 다시 로드 (대리 로그인 등)
      const userChanged = oldUser && oldUser.userId !== newUser.userId
      if (userChanged) {
        loadMenus()
      }
    }
  },
  { deep: true }
)

// 현재 경로에 해당하는 메뉴를 자동으로 열어주는 함수
const expandMenuForCurrentPath = () => {
  const currentPath = route.path

  // 현재 경로와 매칭되는 메인 메뉴 찾기
  const matchingMenu = menus.value.find((menu) => {
    if (menu.children && menu.children.length > 0) {
      // 자식 메뉴 중에 현재 경로와 일치하거나 시작하는 게 있는지 확인
      // 예: /admin/delivery/list 또는 /admin/order/edit/123 등
      return menu.children.some((submenu) => {
        if (!submenu.menuUrl) { return false }
        // 정확히 일치하거나, 현재 경로가 메뉴 URL로 시작하는 경우
        return currentPath === submenu.menuUrl ||
               currentPath.startsWith(submenu.menuUrl + '/') ||
               currentPath.startsWith(submenu.menuUrl.replace('/list', '/'))
      })
    }
    return currentPath === menu.menuUrl
  })

  if (matchingMenu && matchingMenu.children && matchingMenu.children.length > 0) {
    // 현재 경로의 부모 메뉴 열기
    expandedMenus.value = [matchingMenu.menuId]
  }
}

// 라우트 변경 감시 - 메뉴 자동 열기
watch(
  () => route.path,
  () => {
    expandMenuForCurrentPath()
  }
)

// 메뉴 로드 완료 후 현재 경로에 맞는 메뉴 열기
watch(
  () => menus.value,
  (newMenus) => {
    if (newMenus.length > 0) {
      expandMenuForCurrentPath()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* ========== 사이드바 메인 컨테이너 ========== */
.sidebar-menu {
  width: 250px;
  min-width: 250px;
  flex-shrink: 0;
  height: 100vh;
  background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-bg-dark) 100%);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.15);
  position: relative;
  left: 0;
  top: 0;
  z-index: 1000;
}

/* ========== 사이드바 헤더 (로고 영역) ========== */
.sidebar-header {
  height: 64px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--sidebar-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.1);
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
  font-size: 17px;
  font-weight: 700;
  color: white;
  white-space: nowrap;
  letter-spacing: -0.025em;
}

.mobile-close-btn {
  display: none;
  background: none;
  border: none;
  color: var(--sidebar-text);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.mobile-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* ========== 사이드바 네비게이션 ========== */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

/* 스크롤바 스타일링 */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-divider);
  border-radius: 3px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--sidebar-text-muted);
}

/* ========== 메뉴 리스트 ========== */
.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  margin-bottom: 2px;
}

/* ========== 1차 메뉴 링크 ========== */
.menu-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
}

.menu-link:hover {
  background: linear-gradient(90deg, var(--sidebar-hover), transparent);
  border-left-color: var(--sidebar-accent);
}

.menu-link.active {
  background: linear-gradient(90deg, var(--sidebar-active), transparent);
  border-left-color: var(--sidebar-accent);
}

/* ========== 메뉴 아이콘 ========== */
.menu-icon {
  width: 24px;
  margin-right: 12px;
  font-size: 1.125rem;
  opacity: 0.9;
  text-align: center;
}

.menu-link:hover .menu-icon,
.menu-link.active .menu-icon {
  opacity: 1;
}

/* ========== 메뉴 텍스트 (1차 메뉴) ========== */
.menu-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;  /* 굵게 - 메인메뉴 강조 */
  letter-spacing: -0.01em;
  color: #ffffff;  /* 순백색 */
}

/* ========== 서브메뉴 화살표 ========== */
.submenu-arrow {
  font-size: 11px;
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.submenu-arrow.rotated {
  transform: rotate(180deg);
}

/* ========== 2차 메뉴 리스트 ========== */
.submenu-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background: rgba(0, 0, 0, 0.15);
}

.submenu-list.expanded {
  max-height: 500px;
}

.submenu-item {
  margin: 0;
}

/* ========== 2차 메뉴 링크 ========== */
.submenu-link {
  display: flex;
  align-items: center;
  /* 메인메뉴: border(3px) + padding(20px) + icon(24px) + gap(12px) = 59px에서 텍스트 시작 */
  /* 서브메뉴: border(3px) + padding(75px) = 78px에서 텍스트 시작 (약 2글자 들여쓰기) */
  padding: 10px 20px 10px 75px;
  color: rgba(255, 255, 255, 0.65);  /* 밝은 회색 - 메인메뉴보다 연하게 */
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
}

/* 서브메뉴 마커: 대시(-) 스타일 - 전문적인 느낌 */
.submenu-link::before {
  content: '–';  /* en-dash 사용 */
  position: absolute;
  left: 52px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.4);  /* 연한 색상 */
  transition: all 0.2s ease;
}

.submenu-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;  /* 호버 시 완전 흰색 */
  border-left-color: var(--sidebar-accent);
}

.submenu-link:hover::before {
  color: var(--sidebar-accent);  /* 호버 시 강조색 */
}

.submenu-link.active {
  background: rgba(96, 165, 250, 0.12);
  color: #60a5fa;  /* 활성 상태: 강조색 */
  border-left-color: var(--sidebar-accent);
}

.submenu-link.active::before {
  color: #60a5fa;  /* 활성 상태: 강조색 */
  font-weight: 600;
}

/* ========== 2차 메뉴 아이콘 (숨김) ========== */
.submenu-icon {
  display: none;
}

/* ========== 2차 메뉴 텍스트 ========== */
.submenu-text {
  font-size: 13px;  /* 메인메뉴(14px)보다 약간 작게 */
  font-weight: 400;
  color: inherit;
  letter-spacing: 0;
}

/* ========== 사이드바 푸터 (사용자 정보) ========== */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--sidebar-divider);
  position: relative;
  background: rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.user-info:hover {
  background: var(--sidebar-hover);
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sidebar-active);
  position: relative;
  border: 2px solid var(--sidebar-divider);
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
  background: var(--sidebar-active);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-role {
  font-size: 11px;
  color: var(--sidebar-text-muted);
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
    width: 250px;
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
    width: 250px;
  }

  .mobile-close-btn {
    display: none;
  }
}
</style>
