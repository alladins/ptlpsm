<!--
  영업 진행 상태 배지
  - 미확인 회색 / 진행 단계(검토·접촉·설계 반영·견적) 파랑 계열 / 수주 초록 / 보류 노랑 / 포기 연한 빨강
  - stale(방치)이면 «방치» 작은 표시를 붙인다
-->
<template>
  <span class="progress-badge-wrap">
    <span class="status-badge progress-badge" :class="`progress-${tone}`">
      {{ leadProgressLabel(status) }}
    </span>
    <span v-if="stale" class="stale-mark" title="미확인으로 7일 넘게 지났습니다">
      <i class="fas fa-hourglass-end" /> 방치
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LEAD_PROGRESS, leadProgressLabel } from '~/types/sales-lead'

interface Props {
  status?: string | null
  stale?: boolean | null
}

const props = withDefaults(defineProps<Props>(), {
  status: null,
  stale: false
})

/** 상태 → 색 묶음 */
const tone = computed(() => {
  switch (props.status || LEAD_PROGRESS.NEW) {
    case LEAD_PROGRESS.NEW: return 'new'
    case LEAD_PROGRESS.WON: return 'won'
    case LEAD_PROGRESS.HOLD: return 'hold'
    case LEAD_PROGRESS.DROPPED: return 'dropped'
    default: return 'active'
  }
})
</script>

<style scoped>
.progress-badge-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.progress-badge.progress-new {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.progress-badge.progress-active {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.progress-badge.progress-won {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.progress-badge.progress-hold {
  background: #fef9c3;
  color: #854d0e;
  border: 1px solid #fde047;
}

.progress-badge.progress-dropped {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.stale-mark {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.0625rem 0.375rem;
  border-radius: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-size: 0.6875rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
