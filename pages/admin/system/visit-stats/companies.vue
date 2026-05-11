<template>
  <div class="visit-companies">
    <div class="page-header-compact">
      <h1>회사별 사용도</h1>
      <span class="page-description">일별 회사 단위 접속 통계 + 오늘 실시간</span>
      <div class="header-actions-right">
        <button class="btn-action" @click="handleSearch">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>기간:</label>
          <input v-model="params.startDate" type="date" class="date-input">
          <span class="separator">~</span>
          <input v-model="params.endDate" type="date" class="date-input">
        </div>
        <div class="search-item">
          <label>회사 ID:</label>
          <input v-model.number="params.companyId" type="number" placeholder="전체" class="text-input">
        </div>
      </div>
    </div>

    <h2 class="section-title">
      기간 집계
    </h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>일자</th>
            <th>회사 ID</th>
            <th class="num">
              총 방문
            </th>
            <th class="num">
              사용자
            </th>
            <th class="num">
              IP
            </th>
            <th class="num">
              FP
            </th>
            <th class="num">
              업무시간
            </th>
            <th class="num">
              업무외
            </th>
            <th class="num">
              API 호출
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!stats.length">
            <td colspan="9" class="empty">
              조회 결과가 없습니다.
            </td>
          </tr>
          <tr v-for="row in stats" :key="`${row.visitDate}-${row.companyId}`">
            <td>{{ row.visitDate }}</td>
            <td>{{ row.companyId }}</td>
            <td class="num">
              {{ formatNumber(row.totalVisits) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueUsers) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueIps) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueFingerprints) }}
            </td>
            <td class="num">
              {{ formatNumber(row.businessHourVisits) }}
            </td>
            <td class="num off-hour">
              {{ formatNumber(row.offHourVisits) }}
            </td>
            <td class="num">
              {{ formatNumber(row.apiCallCount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 class="section-title">
      오늘 실시간 (배치 전 visit_log 직접 합계)
    </h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>회사 ID</th>
            <th class="num">
              총 방문
            </th>
            <th class="num">
              사용자
            </th>
            <th class="num">
              IP
            </th>
            <th class="num">
              FP
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!today.length">
            <td colspan="5" class="empty">
              오늘 데이터 없음.
            </td>
          </tr>
          <tr v-for="row in today" :key="row.companyId">
            <td>{{ row.companyId }}</td>
            <td class="num">
              {{ formatNumber(row.totalVisits) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueUsers) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueIps) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueFingerprints) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { visitService } from '~/services/visit.service'
import type { VisitCompanyStatsDaily, CompanyTodayLive } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const today0 = new Date().toISOString().slice(0, 10)
const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

const params = ref<{ startDate: string; endDate: string; companyId?: number }>({
  startDate: monthAgo,
  endDate: today0,
  companyId: undefined
})

const stats = ref<VisitCompanyStatsDaily[]>([])
const today = ref<CompanyTodayLive[]>([])

const formatNumber = (n: number) => (n ?? 0).toLocaleString()

async function handleSearch () {
  stats.value = await visitService.getCompanyStats({
    startDate: params.value.startDate,
    endDate: params.value.endDate,
    companyId: params.value.companyId
  })
}

onMounted(async () => {
  await Promise.all([handleSearch(), loadToday()])
})

async function loadToday () {
  today.value = await visitService.getCompanyToday()
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';
@import '@/assets/css/admin-tables.css';

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
  color: #374151;
}
.num { text-align: right; font-variant-numeric: tabular-nums; }
.off-hour { color: #d97706; font-weight: 500; }
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }
</style>
