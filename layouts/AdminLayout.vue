<template>
  <div class="admin-layout">
    <!-- 모바일 메뉴 오버레이 -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay"
      @click="toggleMobileMenu"
    ></div>
    
    <SidebarMenu 
      :collapsed="false" 
      :mobile-open="isMobileMenuOpen"
      @logout="handleLogout"
      @close-mobile="toggleMobileMenu"
    />
    <div class="admin-content">
      <header class="admin-header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">{{ pageTitle || '대시보드' }}</h1>
          </div>
          <div class="header-actions">
            <!-- 사이트 보기 버튼 -->
            <nuxt-link to="/" class="header-action-btn" title="사이트 보기" target="_blank" rel="noopener noreferrer">
              <i class="fas fa-external-link-alt"></i>
              <span class="btn-text">PTPLPSM</span>
            </nuxt-link>
            <button class="mobile-menu-btn" @click="toggleMobileMenu">
              <i class="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </header>
      <main class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import SidebarMenu from '~/components/admin/SidebarMenu.vue'
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  pageTitle: {
    type: String,
    default: ''
  }
})

// 반응형 데이터
const isMobileMenuOpen = ref(false)

// 메서드
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleLogout = () => {
  logout()
}

const logout = () => {
  if (confirm('로그아웃 하시겠습니까?')) {
    try {
      console.log('로그아웃 처리 시작')
      
      // 브라우저 환경에서만 로컬 스토리지 정리
      if (process.client) {
        localStorage.removeItem('auth')
        sessionStorage.clear()
      }
      
      console.log('로그아웃 완료, 로그인 페이지로 이동')
      
      // 로그인 페이지로 이동
      navigateTo('/login')
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error)
      
      // 오류가 발생해도 로그인 페이지로 이동
      navigateTo('/login')
    }
  }
}

// SEO 메타 정보 설정
useHead({
  title: computed(() => props.pageTitle ? `${props.pageTitle} - 관리자` : '관리자'),
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f3f4f6;
}

.admin-content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  min-width: 0; /* flex 아이템이 부모 컨테이너를 넘지 않도록 */
}

.admin-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.header-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  min-width: fit-content;
}

.header-action-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #111827;
}

.btn-text {
  white-space: nowrap;
}

.mobile-menu-btn {
  display: none;
  padding: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  font-size: 1.25rem;
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-menu-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.admin-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* 모바일 오버레이 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 반응형 */
@media (max-width: 768px) {
  .admin-content {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: flex !important;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .mobile-menu-btn:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  .header-content {
    padding: 1rem;
  }

  .header-left {
    gap: 0.75rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .admin-main {
    padding: 1rem;
  }

  /* 모바일에서 버튼 텍스트 숨기기 */
  .header-action-btn .btn-text {
    display: none;
  }

  .header-action-btn {
    padding: 0.5rem;
    min-width: auto;
  }

  .header-actions {
    gap: 0.5rem;
  }
}

/* 데스크톱에서는 사이드바가 항상 보이도록 */
@media (min-width: 769px) {
  .admin-content {
    margin-left: 280px;
  }
  
  .mobile-menu-btn {
    display: none;
  }
}

/* 사이드바가 접혔을 때 */
.admin-layout:has(.sidebar-menu.collapsed) .admin-content {
  margin-left: 80px;
}

@media (max-width: 768px) {
  .admin-layout:has(.sidebar-menu.collapsed) .admin-content {
    margin-left: 0;
  }
}

/* 다크모드 지원 */
@media (prefers-color-scheme: dark) {
  .admin-layout {
    background: #111827;
  }

  .admin-header {
    background: #1f2937;
    border-bottom-color: #374151;
  }

  .page-title {
    color: white;
  }

  .header-action-btn {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }

  .header-action-btn:hover {
    background: #4b5563;
    border-color: #6b7280;
    color: white;
  }

  .logout-btn:hover {
    background: #7f1d1d;
    border-color: #991b1b;
    color: #fca5a5;
  }

  .mobile-menu-btn {
    color: #9ca3af;
  }

  .mobile-menu-btn:hover {
    background: #374151;
    color: white;
  }

  .mobile-menu-btn:focus {
    outline-color: #60a5fa;
  }
}

/* 접근성 */
@media (prefers-reduced-motion: reduce) {
  .admin-content {
    transition: none;
  }
}

/* 포커스 스타일 */
.mobile-menu-btn:focus,
.header-action-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.profile-fallback {
  font-size: 20px;
  color: #6b7280;
}
</style> 