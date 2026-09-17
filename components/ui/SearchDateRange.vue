<template>
  <div class="sdr">
    <!--
      ★ multi-calendars — 달력을 두 달 나란히 편다.
        한 달만 보이면 시작(전달)과 종료(이번달)를 고를 때 화살표로 왔다 갔다 해야 한다.
    -->
    <VueDatePicker
      :model-value="range"
      range
      :multi-calendars="2"
      :enable-time-picker="false"
      model-type="yyyy-MM-dd"
      format="yyyy-MM-dd"
      locale="ko"
      :placeholder="placeholder"
      auto-apply
      :teleport="true"
      :clearable="false"
      :max-date="maxDate"
      week-start="0"
      class="sdr-picker"
      @update:model-value="onChange"
    />

    <!-- 자주 쓰는 기간 — 연도를 거슬러 올라가는 수고를 덜어준다 -->
    <div v-if="showPresets" class="sdr-presets">
      <button
        v-for="p in presets"
        :key="p.label"
        type="button"
        class="sdr-preset"
        :class="{ active: activePreset === p.label }"
        @click="applyPreset(p)"
      >
        {{ p.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 목록 검색용 기간 선택기
 *
 * 브라우저 기본 달력(<input type="date">)은 연도를 거슬러 가려면 월 화살표를
 * 계속 눌러야 해서, 1년 전 자료를 찾는 데 불편했다.
 * VueDatePicker 범위 모드(연·월 바로 선택) + 자주 쓰는 기간 버튼으로 바꾼다.
 *
 * ※ 라이브러리는 이미 운송 화면에서 쓰던 것(@vuepic/vue-datepicker)을 그대로 쓴다.
 *   plugins/vue-datepicker.client.ts 에서 전역 등록되어 import 가 필요 없다.
 */
import { computed, ref, watch } from 'vue'
import { getDateStringByMonthOffset, getLocalDateString } from '~/utils/format'

interface Props {
  /** 시작일 yyyy-MM-dd */
  startDate: string
  /** 종료일 yyyy-MM-dd */
  endDate: string
  placeholder?: string
  /** 미래 날짜 선택 차단 (기본: 오늘까지) */
  maxToday?: boolean
  showPresets?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '기간을 선택하세요',
  maxToday: true,
  showPresets: true
})

const emit = defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  /** 기간이 바뀌었을 때 — 목록 자동 재조회에 쓴다 */
  change: [start: string, end: string]
}>()

const range = computed<string[]>(() =>
  props.startDate && props.endDate ? [props.startDate, props.endDate] : [])

const maxDate = computed(() => (props.maxToday ? getLocalDateString() : undefined))

interface Preset { label: string; months?: number; thisYear?: boolean }

const presets: Preset[] = [
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
  { label: '1년', months: 12 },
  { label: '올해', thisYear: true }
]

const activePreset = ref('')

const onChange = (value: string[] | null) => {
  if (!value || value.length < 2) { return }
  const [start, end] = value
  activePreset.value = ''
  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('change', start, end)
}

const applyPreset = (p: Preset) => {
  const end = getLocalDateString()
  const start = p.thisYear
    ? `${new Date().getFullYear()}-01-01`
    : getDateStringByMonthOffset(-(p.months || 12))
  activePreset.value = p.label
  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('change', start, end)
}

// 바깥에서 날짜를 직접 바꾸면(초기화 등) 프리셋 선택 표시를 푼다
watch(() => [props.startDate, props.endDate], () => {
  if (!activePreset.value) { return }
  const end = getLocalDateString()
  const p = presets.find(x => x.label === activePreset.value)
  if (!p) { return }
  const expectStart = p.thisYear
    ? `${new Date().getFullYear()}-01-01`
    : getDateStringByMonthOffset(-(p.months || 12))
  if (props.startDate !== expectStart || props.endDate !== end) {
    activePreset.value = ''
  }
})
</script>

<style scoped>
.sdr {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sdr-picker {
  width: 250px;
}

.sdr-presets {
  display: inline-flex;
  gap: 4px;
}

.sdr-preset {
  padding: 0 8px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  color: #6b7280;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.sdr-preset:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.sdr-preset.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1d4ed8;
  font-weight: 600;
}
</style>

<style>
/* 목록 검색줄에 맞춘 높이 — 다른 입력(30px)과 나란히 서야 한다 */
.sdr-picker .dp__input {
  height: 30px;
  min-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.8125rem;
  border-radius: 4px;
  border-color: #e5e7eb;
}
</style>
