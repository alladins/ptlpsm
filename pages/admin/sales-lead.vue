<template>
  <div class="sales-lead-page">
    <PageHeader
      title="공모·낙찰 수집"
      description="나라장터 낙찰·계약 정보를 매일 모아 건축설계·공사 건을 가려내고, 설계사무소 연결과 담당 대리점 판정까지 해 둡니다."
      :view-only="isViewOnly"
    />

    <!-- 인증키 미설정 안내 -->
    <div v-if="collectStatus && !collectStatus.keyConfigured" class="key-banner">
      <i class="fas fa-key" />
      <div>
        나라장터 API 인증키가 아직 없습니다 — 공공데이터포털에서 낙찰정보(15129397)·입찰공고(15129394)·계약정보(15129427)
        서비스 활용신청 후 서버 환경변수 <code>G2B_BID_SERVICE_KEY</code> 에 넣으면 수집이 시작됩니다.
      </div>
    </div>

    <div class="content-section tab-box">
      <div class="tab-navigation">
        <button type="button" class="tab-button" :class="{ active: activeTab === 'leads' }" @click="activeTab = 'leads'">
          <i class="fas fa-list" /> 수집 결과
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'digest' }" @click="activeTab = 'digest'">
          <i class="fas fa-sun" /> 아침 요약
        </button>
        <button type="button" class="tab-button" :class="{ active: activeTab === 'runs' }" @click="activeTab = 'runs'">
          <i class="fas fa-history" /> 수집 기록
          <i v-if="collectStatus?.running" class="fas fa-spinner fa-spin running-dot" />
        </button>
      </div>

      <!-- 탭은 v-if 로 바꿔 끼운다 — 수집 기록 탭을 떠나면 폴링 타이머도 같이 정리된다 -->
      <div v-if="activeTab === 'leads'" class="tab-content">
        <LeadListTab />
      </div>
      <div v-else-if="activeTab === 'digest'" class="tab-content">
        <LeadDigestTab />
      </div>
      <div v-else class="tab-content">
        <CollectRunsTab
          :status="collectStatus"
          :can-collect="canWrite"
          :can-import="isSystemAdmin"
          @status-change="collectStatus = $event"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 영업관리 > 공모·낙찰 수집 (5단계-A)
 * ① 수집 결과: 영업 리드 목록·상세
 * ② 아침 요약: 대리점별 발송 미리보기
 * ③ 수집 기록: 상태·지금 수집·실행 기록·붙여넣기 적재
 */
import { computed, onMounted, ref } from 'vue'
import LeadListTab from '~/components/admin/sales-lead/LeadListTab.vue'
import LeadDigestTab from '~/components/admin/sales-lead/LeadDigestTab.vue'
import CollectRunsTab from '~/components/admin/sales-lead/CollectRunsTab.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { usePermission } from '~/composables/usePermission'
import { useAuthStore } from '~/stores/auth'
import type { SalesCollectStatus } from '~/types/sales-lead'

definePageMeta({
  layout: 'admin',
  pageTitle: '공모·낙찰 수집'
})

// 메뉴권한(SALES_LEAD) — «지금 수집»=등록 권한. 붙여넣기 적재는 서버가 시스템관리자만 허용하므로 역할로 가른다
const { canWrite, isViewOnly } = usePermission('SALES_LEAD')
const authStore = useAuthStore()
const isSystemAdmin = computed(() => authStore.user?.role === 'SYSTEM_ADMIN')

const activeTab = ref<'leads' | 'digest' | 'runs'>('leads')

/** 수집 상태 — 인증키 안내 배너와 수집 기록 탭이 같이 쓴다 */
const collectStatus = ref<SalesCollectStatus | null>(null)

const loadStatus = async () => {
  try {
    collectStatus.value = await salesLeadService.getStatus()
  } catch (e) {
    // 배너용 조회라 실패해도 화면은 쓸 수 있다
    console.error('수집 상태 로드 실패:', e)
  }
}

onMounted(loadStatus)
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
}

.key-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 10px;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #78350f;
}

.key-banner > i {
  margin-top: 0.2rem;
  font-size: 1rem;
}

.key-banner code {
  padding: 0.05rem 0.35rem;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 0.8125rem;
}

.running-dot {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}
</style>
