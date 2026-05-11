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
            <i class="fas fa-bars" />
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
        <button @click="markAllAsRead">
          모두 읽음
        </button>
      </div>
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.notificationId"
          class="notification-item"
          :class="{ 'notification-unread': !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon" :class="'icon-' + notification.eventType.toLowerCase().replace(/_/g, '-')">
            <i :class="getEventIcon(notification.eventType)" />
          </div>
          <div class="notification-content">
            <div class="notification-title">
              {{ notification.title }}
            </div>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div class="notification-time">
              {{ getRelativeTime(notification.createdAt) }}
            </div>
          </div>
        </div>
        <div v-if="notifications.length === 0" class="notification-empty">
          <i class="fas fa-bell-slash" />
          <p>알림이 없습니다.</p>
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
import { notificationService } from '~/services/notification.service'
import { EVENT_ICON_MAP } from '~/types/notification'
import type { Notification } from '~/types/notification'

// Stores
const authStore = useAuthStore()

// Reactive data
const sidebarCollapsed = ref(false)
const showNotifications = ref(false)
const notificationCount = ref(0)
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
    '/admin/transport': '출하관리', // 출하관리 하위 메뉴
    '/admin/purchase-order': '출하관리', // 발주서관리는 출하관리 하위
    '/admin/delivery': '납품관리',
    '/admin/delivery-done': '납품관리',
    '/admin/funds': '납품관리', // 기성청구는 납품관리 하위
    '/admin/statistics': '통계', // 기성통계(/admin/statistics/funds)도 여기에 포함
    '/admin/message': '문자관리',
    '/admin/basic-info': '기초정보',
    '/admin/inventory': '재고관리',
    '/admin/oem': 'OEM 관리',
    '/admin/system': '시스템관리'
  }

  // 경로 매칭
  for (const [path, title] of Object.entries(pathMap)) {
    if (route.path.startsWith(path)) {
      return title
    }
  }

  // 대시보드는 모바일에서만 표시
  return ''
})

// 알림 데이터
const notifications = ref<Notification[]>([])
let pollingTimer: ReturnType<typeof setInterval> | null = null

// 알림 데이터 로드
const loadNotifications = async () => {
  try {
    const [list, count] = await Promise.all([
      notificationService.getNotifications(),
      notificationService.getUnreadCount()
    ])
    notifications.value = list
    notificationCount.value = count
  } catch (error) {
    console.error('알림 조회 실패:', error)
  }
}

// 미읽음 수만 갱신 (폴링용)
const refreshUnreadCount = async () => {
  try {
    notificationCount.value = await notificationService.getUnreadCount()
  } catch (error) {
    // 폴링 실패는 무시
  }
}

// 상대 시간 변환
const getRelativeTime = (dateStr: string): string => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) { return '방금 전' }
  if (diffMin < 60) { return `${diffMin}분 전` }
  if (diffHour < 24) { return `${diffHour}시간 전` }
  if (diffDay < 7) { return `${diffDay}일 전` }
  return date.toLocaleDateString('ko-KR')
}

// 이벤트 타입별 아이콘
const getEventIcon = (eventType: string): string => {
  return EVENT_ICON_MAP[eventType as keyof typeof EVENT_ICON_MAP] || 'fas fa-bell'
}

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

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead()
    notificationCount.value = 0
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true }))
    showNotifications.value = false
  } catch (error) {
    console.error('모두 읽음 처리 실패:', error)
  }
}

// 알림 클릭 처리
const handleNotificationClick = async (notification: Notification) => {
  // 읽음 처리
  if (!notification.isRead) {
    try {
      await notificationService.markAsRead(notification.notificationId)
      notification.isRead = true
      notificationCount.value = Math.max(0, notificationCount.value - 1)
    } catch (error) {
      console.error('읽음 처리 실패:', error)
    }
  }
  // 페이지 이동 (referenceUrl에 /list 경로 보정)
  if (notification.referenceUrl) {
    showNotifications.value = false
    let targetUrl = notification.referenceUrl
    // /admin/xxx 형태이고 하위 경로가 없으면 /list 자동 추가
    if (targetUrl.startsWith('/admin/') && targetUrl.split('/').length === 3) {
      targetUrl = `${targetUrl}/list`
    }
    await router.push(targetUrl)
  }
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
      userId: authStore.user?.userId,
      hasToken: !!authStore.accessToken
    })

    // 서버에 로그아웃 요청
    if (authStore.accessToken && authStore.user) {
      const userId = authStore.user.userId
      const loginId = authStore.user.loginId
      if (userId && loginId) {
        await authService.logout(userId, loginId, authStore.accessToken)
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
  // 알림 로드 및 30초 폴링
  loadNotifications()
  pollingTimer = setInterval(refreshUnreadCount, 30000)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
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
  min-width: 0;
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
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.4);
  line-height: 14px;
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
  width: 360px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.notification-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.notification-header button {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.notification-header button:hover {
  background: #eff6ff;
}

.notification-list {
  max-height: 380px;
  overflow-y: auto;
}

.notification-list::-webkit-scrollbar {
  width: 4px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f8fafc;
  position: relative;
}

.notification-item:hover {
  background-color: #f8fafc;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-unread {
  background-color: #eff6ff;
}

.notification-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #3b82f6;
  border-radius: 0 3px 3px 0;
}

.notification-unread:hover {
  background-color: #e8f0fe;
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: white;
  background: #94a3b8;
  margin-top: 1px;
}

/* 이벤트 타입별 아이콘 배경색 */
.icon-delivery-register {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.icon-shipment-register {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.icon-purchase-order-register {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.icon-production-complete {
  background: linear-gradient(135deg, #10b981, #059669);
}

.icon-transport-register {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
}

.icon-signature-register {
  background: linear-gradient(135deg, #ec4899, #db2777);
}

.icon-delivery-complete {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  margin-bottom: 2px;
}

.notification-message {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.notification-empty {
  padding: 32px 20px;
  text-align: center;
  color: #94a3b8;
}

.notification-empty i {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
  opacity: 0.5;
}

.notification-empty p {
  margin: 0;
  font-size: 13px;
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
    top: 60px;
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
    font-size: 10px;
    padding: 2px 6px;
  }

}
</style>
