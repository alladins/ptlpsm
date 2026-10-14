<template>
  <div class="run-log-filter">
    <span class="rlf-total">총 <strong>{{ total.toLocaleString('ko-KR') }}</strong>건</span>
    <select
      v-if="jobOptions.length > 0"
      class="rlf-select"
      :value="job"
      aria-label="작업"
      @change="emit('update:job', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">
        전체 작업
      </option>
      <option v-for="o in jobOptions" :key="o.value" :value="o.value">
        {{ o.label }}
      </option>
    </select>
    <label class="rlf-check">
      <input
        type="checkbox"
        :checked="problemOnly"
        @change="emit('update:problemOnly', ($event.target as HTMLInputElement).checked)"
      >
      {{ problemLabel }}
    </label>
    <span v-if="polling" class="rlf-polling">
      <i class="fas fa-sync-alt fa-spin" /> 5초마다 새로 고침
    </span>
    <span v-else-if="pausedNote" class="rlf-polling muted">
      {{ pausedNote }}
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * 실행 기록 공통 필터 줄 — 공모·낙찰 수집 기록 / 조달 현황 설정 / 조달업체관리 실행 기록 (2026-10-14 사용자 «같은 방식으로 맞춰»)
 * 총 건수 · 작업 선택 · «문제만 보기» · 자동 새로 고침 표시. 페이지 번호는 아래에 Pagination 을 둔다.
 */
interface Props {
  total: number
  job?: string
  /** 작업 선택지 — 비우면 선택 상자를 숨긴다 (한 작업만 보는 화면) */
  jobOptions?: { value: string, label: string }[]
  problemOnly?: boolean
  /** «실패·건너뜀만» 등 화면마다 문제 상태 이름이 다르다 */
  problemLabel?: string
  polling?: boolean
  /** 자동 새로 고침이 멈춘 이유 (예: 2쪽 이상을 보는 중) */
  pausedNote?: string
}

withDefaults(defineProps<Props>(), {
  job: '',
  jobOptions: () => [],
  problemOnly: false,
  problemLabel: '실패·건너뜀만',
  polling: false,
  pausedNote: ''
})

const emit = defineEmits<{
  'update:job': [value: string]
  'update:problemOnly': [value: boolean]
}>()
</script>

<style scoped>
.run-log-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #475569;
}

.rlf-select {
  min-height: 36px;
  width: auto;
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  font-size: 0.8125rem;
}

.rlf-check {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  cursor: pointer;
}

.rlf-polling {
  font-size: 0.75rem;
  color: #2563eb;
}

.rlf-polling.muted {
  color: #94a3b8;
}
</style>
