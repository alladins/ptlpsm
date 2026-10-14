<template>
  <div class="procurement-status-page">
    <PageHeader
      title="조달 영업 현황"
      description="나라장터 쇼핑몰 납품요구로 지역·연도·업체별 단열재 조달금액을 봅니다. 리드파워 점유율과 지역별 경쟁 현황을 한눈에 확인하세요."
      :view-only="isViewOnly"
    />

    <div class="content-section tab-box">
      <div class="tab-navigation">
        <button type="button" class="tab-button" :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          <i class="fas fa-map-marked-alt" /> 현황
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">
          <i class="fas fa-list" /> 상세 목록
        </button>
        <button v-if="isLpAdmin" type="button" class="tab-button" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <i class="fas fa-cog" /> 설정
        </button>
      </div>

      <!-- 현황은 v-show — 지도·선택 상태를 탭을 오가도 유지 -->
      <div v-show="activeTab === 'dashboard'" class="tab-content">
        <StatusDashboardTab :key="dashKey" @open-items="openItems" />
      </div>
      <div v-if="activeTab === 'items'" class="tab-content">
        <ItemListTab
          :initial-filter="itemFilter"
          :years="meta?.years || []"
          :targets="meta?.targets || []"
          :corps="meta?.corps || []"
          :self-bizno="meta?.selfBizno || null"
        />
      </div>
      <div v-else-if="activeTab === 'settings' && isLpAdmin" class="tab-content">
        <SettingsTab @changed="onSettingsChanged" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 영업관리 › 조달 영업 현황 (docs/PLAN_조달영업현황_20261014.md 2단계)
 * ① 현황: 요약 · 시도 지도 · 업체 순위/시군구 · 연도별 추이 · 시도×업체
 * ② 상세 목록: 납품요구 품목 행
 * ③ 설정(리드파워 관리자): 수집 품명 · 과거 수집
 *
 * 영업관리 상위 메뉴를 누르면 이 화면이 먼저 뜬다 (메뉴 sort_order 0 — V3.42.0, 2026-10-14 사용자 요청)
 */
import { computed, onMounted, ref } from 'vue'
import StatusDashboardTab from '~/components/admin/procurement-status/StatusDashboardTab.vue'
import ItemListTab from '~/components/admin/procurement-status/ItemListTab.vue'
import SettingsTab from '~/components/admin/procurement-status/SettingsTab.vue'
import { procurementStatusService } from '~/services/procurement-status.service'
import { usePermission } from '~/composables/usePermission'
import { useAuthStore } from '~/stores/auth'
import type { MallDashboard, MallItemSearchParams } from '~/types/procurement-status'

definePageMeta({
  layout: 'admin',
  pageTitle: '조달 영업 현황'
})

const { isViewOnly } = usePermission('PROCUREMENT_STATUS')
const authStore = useAuthStore()
// 품명·수집은 리드파워 관리자 전용 — 서버 SecurityConfig 도 같은 기준 (조회만 영업까지)
const isLpAdmin = computed(() => ['SYSTEM_ADMIN', 'LEADPOWER_MANAGER'].includes(authStore.user?.role ?? ''))

const activeTab = ref<'dashboard' | 'items' | 'settings'>('dashboard')

/** 상세 목록 필터용 연도·품명·업체 목록 (가장 최근 연도 기준) */
const meta = ref<MallDashboard | null>(null)
const itemFilter = ref<MallItemSearchParams | null>(null)
/** 설정에서 품명·데이터가 바뀌면 현황을 새로 그린다 */
const dashKey = ref(0)

async function loadMeta () {
  try {
    meta.value = await procurementStatusService.getDashboard()
  } catch (e) {
    console.error('조달 현황 목록 조건 로드 실패:', e)
  }
}

function openItems (f: MallItemSearchParams) {
  itemFilter.value = { ...f }
  activeTab.value = 'items'
}

function onSettingsChanged () {
  dashKey.value++
  loadMeta()
}

onMounted(loadMeta)
</script>

<style scoped>
@import '@/assets/css/admin-tabs.css';

.tab-box {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.tab-content {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0 0 10px 10px;
}

@media (max-width: 600px) {
  .tab-content {
    padding: 0.75rem;
  }
}
</style>
