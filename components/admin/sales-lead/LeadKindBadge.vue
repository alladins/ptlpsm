<!--
  영업 리드 종류 배지 — 건축설계 보라 / 건축공사 파랑 / 기타 회색
  - small: 사업명 옆에 붙이는 작은 크기 (목록에서 종류 열을 뺀 대신)
-->
<template>
  <span class="status-badge kind-badge" :class="[`kind-${(kind || 'OTHER').toLowerCase()}`, { 'kind-badge-sm': small }]">
    {{ codeLabel(LEAD_KIND_LABELS, kind) }}
  </span>
</template>

<script setup lang="ts">
import { codeLabel } from '~/types/agency'
import { LEAD_KIND_LABELS } from '~/types/sales-lead'

defineProps<{ kind?: string | null, small?: boolean }>()
</script>

<style scoped>
.kind-badge.kind-badge-sm {
  padding: 0.0625rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0;
}

.kind-badge.kind-design {
  background: #f3e8ff;
  color: #6b21a8;
  border: 1px solid #d8b4fe;
}

.kind-badge.kind-construction {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.kind-badge.kind-other {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}
</style>
