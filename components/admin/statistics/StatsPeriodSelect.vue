<template>
  <select :value="selectedId" class="stats-period-select" aria-label="통계 기간" @change="onChange">
    <!-- 달력·빠른 버튼으로 다른 기간을 고르면 여기에 표시된다 -->
    <option v-if="selectedId === ''" value="">
      직접 선택
    </option>
    <option v-for="p in periods" :key="p.periodId" :value="String(p.periodId)">
      {{ p.periodName }}
    </option>
  </select>
</template>

<script setup lang="ts">
/** 통계 기간 선택 — 지금 조회 기간과 같은 정산기간을 표시하고, 고르면 그 기간을 알린다 */
import { computed } from 'vue'
import { statsPeriodEnd, type StatsPeriod } from '~/composables/useStatsPeriods'

const props = defineProps<{
  periods: StatsPeriod[]
  startDate: string
  endDate: string
}>()

const emit = defineEmits<{ select: [period: StatsPeriod] }>()

const selectedId = computed(() => {
  const found = props.periods.find(p => p.startDate === props.startDate && statsPeriodEnd(p) === props.endDate)
  return found ? String(found.periodId) : ''
})

function onChange (event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  const period = props.periods.find(p => p.periodId === id)
  if (period) { emit('select', period) }
}
</script>

<style scoped>
.stats-period-select {
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 140px;
  background: #fff;
}
</style>
