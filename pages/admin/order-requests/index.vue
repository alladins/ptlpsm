<template>
  <div class="order-requests-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요청"
      description="현장소장이 모바일에서 요청한 주문 목록과 현장(프로젝트) 마스터를 관리합니다."
      icon="order"
      icon-color="orange"
    />

    <div class="content-section">
      <!-- 탭 -->
      <div class="tab-bar">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'requests' }"
          @click="activeTab = 'requests'"
        >
          <i class="fas fa-inbox" />
          주문 요청 목록
          <span v-if="pendingBadge > 0" class="badge badge-pending">{{ pendingBadge }}</span>
        </button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'sites' }"
          @click="activeTab = 'sites'"
        >
          <i class="fas fa-building" />
          현장 관리
        </button>
      </div>

      <!-- 탭 콘텐츠 -->
      <div class="tab-content">
        <RequestListTab v-if="activeTab === 'requests'" @pending-count="onPendingCount" />
        <SiteManagementTab v-if="activeTab === 'sites'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '~/components/ui/PageHeader.vue'
import RequestListTab from '~/components/admin/order-requests/RequestListTab.vue'
import SiteManagementTab from '~/components/admin/order-requests/SiteManagementTab.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요청'
})

const activeTab = ref<'requests' | 'sites'>('requests')
const pendingBadge = ref(0)

function onPendingCount(n: number) {
  pendingBadge.value = n
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

.order-requests-page {
  display: flex;
  flex-direction: column;
}

.content-section {
  padding: 0 1.5rem 1.5rem;
}

.tab-bar {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1rem;
  background: white;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.15s;
}

.tab-button:hover { color: #111827; }
.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.4rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.tab-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
</style>
