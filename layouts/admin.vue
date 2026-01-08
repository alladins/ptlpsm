<template>
  <div class="admin-layout" :class="{ 'mobile-menu-open': isMobileMenuOpen, 'has-impersonation-banner': authStore.isImpersonating }">
    <!-- 대리 로그인 배너 -->
    <ImpersonationBanner
      v-if="authStore.isImpersonating"
      @revert="handleRevertImpersonation"
    />

    <!-- 사이드바 -->
    <SidebarMenu
      :collapsed="sidebarCollapsed"
      :mobile-open="isMobileMenuOpen"
      @logout="handleLogout"
      @close-mobile="closeMobileMenu"
    />

    <!-- 메인 콘텐츠 영역 -->
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- 헤더 -->
      <header class="admin-header">
        <div class="header-left">
          <button class="sidebar-toggle" @click="toggleSidebar">
            <i class="fas fa-bars"></i>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">{{ currentPageTitle }}</span>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-actions">
            <button class="action-btn" @click="toggleNotifications">
              <img src="/images/common/ico_bell.png" alt="알림" class="bell-icon">
              <span v-if="notificationCount > 0" class="notification-badge">
                {{ notificationCount }}
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- 페이지 콘텐츠 -->
      <main class="page-content">
    <slot />
      </main>
    </div>

    <!-- 알림 드롭다운 -->
    <div v-if="showNotifications" class="notification-dropdown">
      <div class="notification-header">
        <h3>알림</h3>
        <button @click="markAllAsRead">모두 읽음</button>
      </div>
      <div class="notification-list">
        <div v-for="notification in notifications" :key="notification.id" class="notification-item">
          <div class="notification-icon">
            <i :class="notification.icon"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ notification.time }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { authService } from '~/services/auth.service'
import SidebarMenu from '~/components/admin/SidebarMenu.vue'
import ImpersonationBanner from '~/components/admin/common/ImpersonationBanner.vue'

// Stores
const authStore = useAuthStore()

// Reactive data
const sidebarCollapsed = ref(false)
const showNotifications = ref(false)
const notificationCount = ref(3)
const isMobileMenuOpen = ref(false)

// Computed
const route = useRoute()
const router = useRouter()

const currentPageTitle = computed(() => {
  // 현재 경로에 따른 페이지 제목 반환 (메인메뉴명과 일치)
  const pathMap: Record<string, string> = {
    '/admin/sales': '영업관리',
    '/admin/order': '주문관리',
    '/admin/shipping': '출하관리',
    '/admin/transport': '출하관리',      // 출하관리 하위 메뉴
    '/admin/delivery': '납품관리',       // 수정: 납품확인관리 → 납품관리
    '/admin/delivery-done': '납품관리',  // 수정: 납품완료계 → 납품관리
    '/admin/funds': '납품관리',          // 추가: 기성청구도 납품관리 하위
    '/admin/statistics': '통계',
    '/admin/message': '문자관리',
    '/admin/basic-info': '기초정보',
    '/admin/system': '시스템관리'
  }

  // 정확한 경로 매칭
  for (const [path, title] of Object.entries(pathMap)) {
    if (route.path.startsWith(path)) {
      return title
    }
  }

  // 대시보드는 모바일에서만 표시
  return ''
})

// Mock notifications
const notifications = ref([
  {
    id: 1,
    title: '새로운 발주 요청',
    message: '고객사 A로부터 새로운 발주가 요청되었습니다.',
    icon: 'fas fa-shopping-cart',
    time: '5분 전'
  },
  {
    id: 2,
    title: '출하 완료',
    message: '주문번호 #12345의 출하가 완료되었습니다.',
    icon: 'fas fa-truck',
    time: '1시간 전'
  },
  {
    id: 3,
    title: '시스템 업데이트',
    message: '시스템이 성공적으로 업데이트되었습니다.',
    icon: 'fas fa-cog',
    time: '2시간 전'
  }
])

// Methods
const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    // 모바일에서는 모바일 메뉴 토글
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    
    // 모바일 메뉴가 열릴 때 body 스크롤 방지
    if (isMobileMenuOpen.value) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  } else {
    // PC에서는 사이드바 토글 기능 비활성화 (항상 표시)
    console.log('PC에서는 사이드바가 항상 표시됩니다.')
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  // 모바일 메뉴가 닫힐 때 body 스크롤 복원
  document.body.style.overflow = ''
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const markAllAsRead = () => {
  notificationCount.value = 0
  showNotifications.value = false
}

// 대리 로그인 복귀 처리
const handleRevertImpersonation = async () => {
  try {
    const success = await authStore.stopImpersonation()
    if (success) {
      // 페이지 새로고침하여 권한 및 메뉴 갱신
      window.location.reload()
    } else {
      alert('원래 계정으로 복귀하는데 실패했습니다.')
    }
  } catch (error) {
    console.error('대리 로그인 복귀 실패:', error)
    alert('원래 계정으로 복귀하는데 실패했습니다.')
  }
}

const handleLogout = async () => {
  try {
    const authStore = useAuthStore()
    
    console.log('로그아웃 시작...', {
      userid: authStore.user?.userid,
      hasToken: !!authStore.accessToken
    })

    // 서버에 로그아웃 요청
    if (authStore.accessToken && authStore.user) {
      const userid = authStore.user.userid
      const loginId = authStore.user.loginId
      if (userid && loginId) {
        await authService.logout(userid, loginId, authStore.accessToken)
      }
    }
    
    // Store 및 localStorage 정리
    authStore.clearAuthData()
    
    console.log('로그아웃 완료')
    
    // 로그인 페이지로 이동
    await router.push('/login')
  } catch (error) {
    console.error('로그아웃 실패:', error)
    // 에러가 발생해도 클라이언트 데이터는 정리
    const authStore = useAuthStore()
    authStore.clearAuthData()
    await router.push('/login')
  }
}

// Click outside handlers
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement

  if (!target.closest('.notification-dropdown') && !target.closest('.action-btn')) {
    showNotifications.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
}

/* 대리 로그인 배너가 있을 때 레이아웃 조정 */
.admin-layout.has-impersonation-banner {
  padding-top: 44px;
}

.admin-layout.has-impersonation-banner .main-content {
  height: calc(100vh - 44px);
}

/* PC에서 사이드바와 메인 콘텐츠 레이아웃 */
@media (min-width: 769px) {
  .admin-layout {
    display: flex;
  }
  
  .main-content {
    flex: 1;
    margin-left: 0;
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 0;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

.admin-header {
  height: 48px;
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--sidebar-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--sidebar-text);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.sidebar-toggle:hover {
  background-color: var(--sidebar-hover);
}

/* PC에서는 사이드바 토글 버튼 숨김 */
@media (min-width: 769px) {
  .sidebar-toggle {
    display: none;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-size: 16px;
  font-weight: 600;
  color: white;
  letter-spacing: -0.01em;
}

/* 빈 breadcrumb 숨기기 (웹) */
.breadcrumb-item:empty {
  display: none;
}

/* 모바일에서는 대시보드 표시 */
@media (max-width: 768px) {
  .breadcrumb-item:empty::before {
    content: '대시보드';
    display: block;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  position: relative;
  background: none;
  border: none;
  font-size: 18px;
  color: var(--sidebar-text);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--sidebar-hover);
  color: white;
}

.menu-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: block;
}

.bell-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.page-content {
  flex: 1;
  padding: 28px 30px 0 30px; /* 하단 패딩 제거 */
  overflow-y: auto;
}

.notification-dropdown {
  position: absolute;
  top: 70px;
  right: 20px;
  width: 350px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  border: 1px solid #e9ecef;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.notification-header button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.3s ease;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  margin-right: 12px;
  color: #007bff;
  font-size: 16px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 12px;
  color: #adb5bd;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
  
  .main-content.sidebar-collapsed {
    margin-left: 0;
  }
  
  /* 모바일에서 사이드바가 열려있을 때 메인 콘텐츠 조정 */
  .admin-layout.mobile-menu-open .main-content {
    margin-left: 0;
  }
  
  /* 모바일 메뉴 오버레이 */
  .admin-layout::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  .admin-layout.mobile-menu-open::before {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
  
  /* 모바일에서 사이드바 토글 버튼 최적화 */
  .sidebar-toggle {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background: #3b82f6;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.3s ease;
  }
  
  .sidebar-toggle:hover {
    background: #2563eb;
    transform: scale(1.05);
  }
  
  .sidebar-toggle:active {
    transform: scale(0.95);
  }
  
  .notification-dropdown {
    right: 10px;
    left: 10px;
    width: auto;
  }
  
  /* 모바일에서 벨 아이콘 크기 조정 */
  .bell-icon {
    width: 22px;
    height: 22px;
  }
  
  .action-btn {
    width: 40px;
    height: 40px;
  }
  
  .notification-badge {
    top: 1px;
    right: 1px;
    font-size: 11px;
    padding: 3px 7px;
  }
  
}
</style> 