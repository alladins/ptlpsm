<template>
  <div class="sitemap-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-icon">
        <i class="fas fa-sitemap" />
      </div>
      <div class="header-text">
        <h1 class="page-title">
          사이트맵
        </h1>
        <p class="page-description">
          현재 권한으로 접근 가능한 전체 메뉴를 한눈에 확인할 수 있습니다.
        </p>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-if="visibleMenus.length === 0" class="empty-state">
      <i class="fas fa-folder-open empty-icon" />
      <p class="empty-text">
        접근 가능한 메뉴가 없습니다. 권한 설정을 확인해주세요.
      </p>
    </div>

    <!-- 메뉴 카드 그리드 -->
    <div v-else class="sitemap-grid">
      <section
        v-for="menu in visibleMenus"
        :key="menu.menuId"
        class="sitemap-card"
      >
        <header class="card-header">
          <i :class="menu.menuIcon" class="card-icon" />
          <h2 class="card-title">
            {{ menu.menuName }}
          </h2>
          <span class="card-count">{{ menu.children?.length || 0 }}</span>
        </header>
        <ul v-if="menu.children && menu.children.length > 0" class="card-link-list">
          <li v-for="sub in menu.children" :key="sub.menuId">
            <NuxtLink :to="sub.menuUrl || '#'" class="card-link">
              <i :class="sub.menuIcon" class="card-link-icon" />
              <span>{{ sub.menuName }}</span>
              <i class="fas fa-chevron-right card-link-arrow" />
            </NuxtLink>
          </li>
        </ul>
        <p v-else class="card-empty">
          하위 메뉴 없음
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePermissionStore } from '~/stores/permission'
import { useAuthStore } from '~/stores/auth'
import { ADMIN_MENUS, type MenuWithAuth } from '~/constants/adminMenus'

definePageMeta({
  layout: 'admin',
  pageTitle: '사이트맵'
})

const permissionStore = usePermissionStore()
const authStore = useAuthStore()

/**
 * 권한 기준으로 메뉴 필터링
 * - SYSTEM_ADMIN(isFullAccess): 모든 메뉴 표시
 * - 그 외: permissionFlatMap 의 readAuth === 'Y' 인 메뉴만 표시
 * - 부모 메뉴는 자식이 하나라도 보이면 표시
 */
function filterAccessibleMenus (menuList: MenuWithAuth[]): MenuWithAuth[] {
  if (permissionStore.isFullAccess) {
    return menuList
  }

  return menuList
    .map((menu) => {
      const filteredChildren = menu.children
        ? menu.children.filter(child => permissionStore.getPermissionByMenuCode(child.menuCode).readAuth === 'Y')
        : []
      return { ...menu, children: filteredChildren }
    })
    .filter(menu => menu.children && menu.children.length > 0)
}

const visibleMenus = computed<MenuWithAuth[]>(() => filterAccessibleMenus(ADMIN_MENUS))

onMounted(async () => {
  // 권한 플랫맵이 아직 로드되지 않았으면 로드
  if (authStore.isLoggedIn && !permissionStore.isPermissionFlatMapLoaded()) {
    try {
      await permissionStore.fetchPermissionFlatMap()
    } catch (err) {
      console.warn('[Sitemap] 권한 플랫맵 로드 실패:', err)
    }
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

.sitemap-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #9ca3af;
}

.empty-text {
  font-size: 15px;
  margin: 0;
}

/* 카드 그리드 */
.sitemap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.sitemap-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: box-shadow 0.2s, transform 0.2s;
}

.sitemap-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.card-icon {
  font-size: 18px;
  color: #3b82f6;
  width: 24px;
  text-align: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
}

.card-count {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 999px;
  min-width: 24px;
  text-align: center;
}

.card-link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
}

.card-link:hover {
  background: #eff6ff;
  color: #2563eb;
}

.card-link-icon {
  font-size: 14px;
  color: #9ca3af;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.card-link:hover .card-link-icon {
  color: #2563eb;
}

.card-link span {
  flex: 1;
}

.card-link-arrow {
  font-size: 11px;
  color: #d1d5db;
  transition: transform 0.15s, color 0.15s;
}

.card-link:hover .card-link-arrow {
  color: #2563eb;
  transform: translateX(2px);
}

.card-empty {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
  padding: 8px 0;
  text-align: center;
}

/* 모바일 */
@media (max-width: 640px) {
  .sitemap-page {
    padding: 16px;
  }

  .sitemap-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
