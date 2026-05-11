<template>
  <div class="visit-time-analysis">
    <div class="page-header-compact">
      <h1>시간대 분석</h1>
      <span class="page-description">시간대별 접속 분포 (업무시간 09-18 외 강조)</span>
      <div class="header-actions-right">
        <button class="btn-action" @click="loadData">
          <i class="fas fa-search" /> 조회
        </button>
      </div>
    </div>

    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>일자:</label>
          <input v-model="params.targetDate" type="date" class="date-input">
        </div>
        <div class="search-item">
          <label>회사 ID:</label>
          <input v-model.number="params.companyId" type="number" placeholder="전체" class="text-input">
        </div>
      </div>
    </div>

    <div class="bars">
      <div
        v-for="row in normalized"
        :key="row.hour"
        class="bar-row"
        :class="{ 'off-hour': isOffHour(row.hour) }"
      >
        <div class="bar-label">
          {{ String(row.hour).padStart(2, '0') }}시
        </div>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: row.barWidth + '%' }">
            <span class="bar-text">{{ formatNumber(row.visitCount) }}</span>
          </div>
        </div>
        <div class="bar-meta">
          사용자 {{ formatNumber(row.uniqueUsers) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { visitService } from '~/services/visit.service'
import type { HourDistribution } from '~/types/visit'

definePageMeta({ layout: 'admin', middleware: ['auth'] })

const params = ref<{ targetDate: string; companyId?: number }>({
  targetDate: new Date().toISOString().slice(0, 10),
  companyId: undefined
})
const rows = ref<HourDistribution[]>([])

const formatNumber = (n: number) => (n ?? 0).toLocaleString()
const isOffHour = (h: number) => h < 9 || h >= 18

// 0-23 시 모두 표시 (데이터 없는 시간대도 0으로)
const normalized = computed(() => {
  const map = new Map<number, HourDistribution>(rows.value.map(r => [Number(r.hour), r]))
  const filled: HourDistribution[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    visitCount: Number(map.get(h)?.visitCount || 0),
    uniqueUsers: Number(map.get(h)?.uniqueUsers || 0)
  }))
  const max = Math.max(1, ...filled.map(r => r.visitCount))
  return filled.map(r => ({ ...r, barWidth: (r.visitCount / max) * 100 }))
})

async function loadData () {
  rows.value = await visitService.getHourDistribution({
    targetDate: params.value.targetDate,
    companyId: params.value.companyId
  })
}

onMounted(loadData)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-search.css';

.bars { display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 0; }
.bar-row { display: grid; grid-template-columns: 60px 1fr 140px; align-items: center; gap: 0.75rem; }
.bar-label { font-weight: 600; color: #374151; }
.bar-track {
  height: 26px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.bar-fill {
  height: 100%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  min-width: 2px;
  transition: width 0.3s;
}
.bar-text { color: #fff; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.bar-meta { font-size: 0.875rem; color: #6b7280; }
.bar-row.off-hour .bar-fill { background: #d97706; }
.bar-row.off-hour .bar-label { color: #d97706; }
</style>
