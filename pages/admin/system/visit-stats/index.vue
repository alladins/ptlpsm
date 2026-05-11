<template>
  <div class="visit-stats-index">
    <div class="page-header-compact">
      <h1>방문자 추적</h1>
      <span class="page-description">폐쇄형 시스템 사용성 분석 대시보드 (SYSTEM_ADMIN 전용)</span>
    </div>

    <!-- 오늘 요약 카드 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 mt-4">
      <div class="summary-card">
        <p class="card-label">
          오늘 활성 회사
        </p>
        <p class="card-value">
          {{ formatNumber(todayActiveCompanies) }}
        </p>
      </div>
      <div class="summary-card">
        <p class="card-label">
          오늘 활성 사용자
        </p>
        <p class="card-value">
          {{ formatNumber(todayActiveUsers) }}
        </p>
      </div>
      <div class="summary-card">
        <p class="card-label">
          오늘 페이지 진입
        </p>
        <p class="card-value">
          {{ formatNumber(todayTotalVisits) }}
        </p>
      </div>
      <div class="summary-card alert-card">
        <p class="card-label">
          미해소 알림
        </p>
        <p class="card-value">
          {{ formatNumber(openAlertCount) }}
        </p>
      </div>
    </div>

    <!-- 빠른 진입 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <NuxtLink to="/admin/system/visit-stats/companies" class="nav-card">
        <i class="fas fa-building" />
        <span class="nav-title">회사별 사용도</span>
        <span class="nav-desc">일/월별 회사 단위 접속 통계</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/users" class="nav-card">
        <i class="fas fa-users" />
        <span class="nav-title">사용자별 활동</span>
        <span class="nav-desc">사용자 단위 접속·페이지뷰</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/company-ips" class="nav-card">
        <i class="fas fa-network-wired" />
        <span class="nav-title">회사별 IP</span>
        <span class="nav-desc">회사별 사용 IP 이력 + 화이트리스트</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/time-analysis" class="nav-card">
        <i class="fas fa-clock" />
        <span class="nav-title">시간대 분석</span>
        <span class="nav-desc">시간대별 접속 분포 (업무시간 외 강조)</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/api-calls" class="nav-card">
        <i class="fas fa-exchange-alt" />
        <span class="nav-title">API 호출 로그</span>
        <span class="nav-desc">사용자/회사별 API 호출 추적 (1년)</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/whitelist" class="nav-card">
        <i class="fas fa-shield-alt" />
        <span class="nav-title">IP 화이트리스트</span>
        <span class="nav-desc">회사별 등록 IP 관리</span>
      </NuxtLink>
      <NuxtLink to="/admin/system/visit-stats/alerts" class="nav-card alert-nav">
        <i class="fas fa-bell" />
        <span class="nav-title">알림 로그</span>
        <span class="nav-desc">미접속 / 비정상 IP / 계정 공유 의심</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { visitService } from '~/services/visit.service'
import { VISIT_ALERT_STATUS } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const todayActiveCompanies = ref(0)
const todayActiveUsers = ref(0)
const todayTotalVisits = ref(0)
const openAlertCount = ref(0)

const formatNumber = (n: number) => (n ?? 0).toLocaleString()

onMounted(async () => {
  try {
    const [companies, users, alerts] = await Promise.all([
      visitService.getCompanyToday(),
      visitService.getUserToday(),
      visitService.getAlerts({ status: VISIT_ALERT_STATUS.OPEN, page: 0, size: 1 })
    ])
    todayActiveCompanies.value = companies.length
    todayActiveUsers.value = users.length
    todayTotalVisits.value = companies.reduce((sum, c) => sum + (Number(c.totalVisits) || 0), 0)
    openAlertCount.value = alerts.total
  } catch (e) {
    console.error('대시보드 요약 로드 실패:', e)
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.summary-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}
.summary-card.alert-card { border-color: #f59e0b; }
.card-label { font-size: 0.875rem; color: #6b7280; }
.card-value { font-size: 1.875rem; font-weight: 600; color: #111827; margin-top: 0.5rem; }
.alert-card .card-value { color: #d97706; }

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s;
}
.nav-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
.nav-card i { font-size: 1.25rem; color: #3b82f6; }
.nav-card.alert-nav i { color: #d97706; }
.nav-title { font-weight: 600; color: #111827; }
.nav-desc { font-size: 0.875rem; color: #6b7280; }
</style>
