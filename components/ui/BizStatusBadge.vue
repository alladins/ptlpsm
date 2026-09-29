<!--
  영업상태 배지 (국세청 사업자등록 상태조회) — 조달업체관리·설계사무소관리 공통
  code: 01 영업 중 · 02 휴업 · 03 폐업 · 99 국세청 미등록 · null 확인 전
-->
<template>
  <span class="biz-badge" :class="`b${code || 'NONE'}`" :title="title">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BIZ_STATUS, type BizSttCd } from '~/services/g2b-supplier.service'
import { formatDate, formatDateTime } from '~/utils/format'

interface Props {
  code: BizSttCd | null | undefined
  /** 국세청 상태명 (계속사업자·휴업자·폐업자) */
  name?: string | null
  endDt?: string | null
  checkedAt?: string | null
}
const props = withDefaults(defineProps<Props>(), {
  name: null,
  endDt: null,
  checkedAt: null
})

const label = computed(() => BIZ_STATUS[props.code || 'NONE'].label)
const title = computed(() => {
  if (!props.code) { return '아직 국세청에 확인하지 않았습니다 (조달업체관리 [영업상태 확인])' }
  const end = props.endDt ? ` · 폐업일 ${formatDate(props.endDt)}` : ''
  const checked = props.checkedAt ? ` (확인 ${formatDateTime(props.checkedAt)})` : ''
  return `${props.name || label.value}${end}${checked}`
})
</script>

<style scoped>
.biz-badge {
  display: inline-block;
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.b01 {
  background: #dcfce7;
  color: #166534;
}

.b02 {
  background: #fef3c7;
  color: #92400e;
}

.b03 {
  background: #fee2e2;
  color: #b91c1c;
}

.b99 {
  background: #e2e8f0;
  color: #475569;
}

.bNONE {
  background: #f8fafc;
  color: #94a3b8;
  border: 1px dashed #cbd5e1;
}
</style>
