<template>
  <div class="visit-users">
    <div class="page-header-compact">
      <h1>사용자별 활동</h1>
      <span class="page-description">사용자 단위 접속·페이지뷰·체류시간</span>
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
          <label>사용자 ID:</label>
          <input v-model.number="params.userId" type="number" placeholder="전체" class="text-input">
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
            <th>사용자 ID</th>
            <th>회사</th>
            <th class="num">
              방문
            </th>
            <th class="num">
              페이지뷰
            </th>
            <th class="num">
              API 호출
            </th>
            <th class="num">
              평균 체류(ms)
            </th>
            <th class="num">
              IP 수
            </th>
            <th class="num">
              FP 수
            </th>
            <th>첫 방문</th>
            <th>마지막</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!stats.length">
            <td colspan="11" class="empty">
              조회 결과가 없습니다.
            </td>
          </tr>
          <tr v-for="row in stats" :key="`${row.visitDate}-${row.userId}`">
            <td>{{ row.visitDate }}</td>
            <td>{{ row.userId }}</td>
            <td>{{ row.companyId ?? '-' }}</td>
            <td class="num">
              {{ formatNumber(row.totalVisits) }}
            </td>
            <td class="num">
              {{ formatNumber(row.pageViews) }}
            </td>
            <td class="num">
              {{ formatNumber(row.apiCalls) }}
            </td>
            <td class="num">
              {{ formatNumber(row.avgDurationMs) }}
            </td>
            <td class="num">
              {{ formatNumber(row.distinctIpCount) }}
            </td>
            <td class="num">
              {{ formatNumber(row.distinctFingerprintCount) }}
            </td>
            <td>{{ formatTime(row.firstVisitAt) }}</td>
            <td>{{ formatTime(row.lastVisitAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 class="section-title">
      오늘 실시간
    </h2>
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>사용자 ID</th>
            <th>회사 ID</th>
            <th class="num">
              방문
            </th>
            <th class="num">
              IP 수
            </th>
            <th class="num">
              FP 수
            </th>
            <th>첫 방문</th>
            <th>마지막</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!today.length">
            <td colspan="7" class="empty">
              오늘 데이터 없음.
            </td>
          </tr>
          <tr v-for="row in today" :key="row.userId">
            <td>{{ row.userId }}</td>
            <td>{{ row.companyId }}</td>
            <td class="num">
              {{ formatNumber(row.totalVisits) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueIps) }}
            </td>
            <td class="num">
              {{ formatNumber(row.uniqueFingerprints) }}
            </td>
            <td>{{ formatTime(row.firstVisitAt) }}</td>
            <td>{{ formatTime(row.lastVisitAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { visitService } from '~/services/visit.service'
import type { VisitUserStatsDaily, UserTodayLive } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const today0 = new Date().toISOString().slice(0, 10)
const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

const params = ref<{
  startDate: string
  endDate: string
  userId?: number
  companyId?: number
}>({
  startDate: monthAgo,
  endDate: today0,
  userId: undefined,
  companyId: undefined
})

const stats = ref<VisitUserStatsDaily[]>([])
const today = ref<UserTodayLive[]>([])

const formatNumber = (n: number) => (n ?? 0).toLocaleString()
const formatTime = (s?: string) => (s ? s.replace('T', ' ').slice(0, 19) : '-')

async function handleSearch () {
  stats.value = await visitService.getUserStats({
    startDate: params.value.startDate,
    endDate: params.value.endDate,
    userId: params.value.userId,
    companyId: params.value.companyId
  })
}

onMounted(async () => {
  await Promise.all([handleSearch(), (async () => {
    today.value = await visitService.getUserToday()
  })()])
})
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
.empty { text-align: center; padding: 1.5rem; color: #9ca3af; }
</style>
