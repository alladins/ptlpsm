<!--
  영업 담당자 선택 (인라인) — 발주(orders.sales_id) 담당자 지정 (2026-09-30)

  - 팝업 없이 한 자리에서: 입력하면 바로 걸러지고, 결과 행을 눌러 고른다 (터치 44px) — sales-screens-mobile-first
  - 후보 = SALES_MANAGER 활성 사용자. 대리점 직원은 «이름 (대리점명)»
  - orderId 를 주면 수요기관 담당 대리점 판정 결과로 해당 대리점 직원을 «추천» 으로 맨 위에
  - 이 컴포넌트는 고르기만 한다(select 이벤트). 저장(PATCH /admin/orders/sales-manager)은 부모가 한다.
    · 수정 화면: 고르는 즉시 저장
    · 목록 화면: 체크한 발주에 일괄 저장

  사용 예)
    <SalesManagerPicker
      :order-id="orderId"
      :current-sales-id="order.salesId"
      :current-name="order.salesName"
      :current-agency-name="order.salesAgencyName"
      :readonly="!isFullAccess"
      :busy="saving"
      @select="assign"
    />
-->
<template>
  <div class="sm-picker">
    <!-- 현재 담당자 (접힌 상태) -->
    <div v-if="!editing" class="sm-current">
      <span v-if="currentSalesId" class="sm-current-name">
        <i class="fas fa-user-tie" />
        {{ currentName || `사용자 #${currentSalesId}` }}
        <span v-if="currentAgencyName" class="sm-agency">({{ currentAgencyName }})</span>
      </span>
      <span v-else class="sm-unassigned">
        <i class="fas fa-user-slash" /> 미지정
      </span>

      <template v-if="!readonly">
        <button type="button" class="sm-btn primary" :disabled="busy" @click="openEditor">
          {{ currentSalesId ? '변경' : '지정' }}
        </button>
        <button
          v-if="currentSalesId"
          type="button"
          class="sm-btn"
          :disabled="busy"
          @click="clearAssignment"
        >
          지정 해제
        </button>
      </template>
      <span v-else-if="showReadonlyHint" class="sm-readonly-hint">
        담당자 지정은 시스템관리자·리드파워 담당자만 할 수 있습니다
      </span>
      <i v-if="busy" class="fas fa-spinner fa-spin sm-spin-inline" />
    </div>

    <!-- 고르기 (펼친 상태) -->
    <div v-else class="sm-editor">
      <div class="sm-search-row">
        <input
          ref="inputRef"
          v-model="keyword"
          type="search"
          class="form-input sm-input"
          placeholder="이름·아이디·대리점명으로 찾기"
          enterkeyhint="search"
          @keyup.enter.prevent="pickFirst"
          @keyup.esc="closeEditor"
        >
        <i v-if="loading" class="fas fa-spinner fa-spin sm-spin" />
      </div>

      <p v-if="resolveLine" class="sm-resolve" :class="{ ok: resolveOk }">
        <i class="fas" :class="resolveOk ? 'fa-map-marker-alt' : 'fa-info-circle'" />
        {{ resolveLine }}
      </p>
      <p v-if="message" class="sm-msg">
        {{ message }}
      </p>

      <ul v-if="filtered.length > 0" class="sm-options">
        <li v-for="c in filtered" :key="c.userId">
          <button
            type="button"
            class="sm-option"
            :class="{ current: c.userId === currentSalesId }"
            :disabled="busy"
            @click="pick(c)"
          >
            <span class="sm-opt-main">
              <span class="sm-opt-name">{{ c.userName }}</span>
              <span v-if="c.agencyMember" class="sm-opt-agency">({{ c.companyName || '대리점' }})</span>
              <span v-if="c.recommended" class="sm-badge rec">추천</span>
              <span v-if="c.userId === currentSalesId" class="sm-badge cur">현재</span>
            </span>
            <span class="sm-opt-sub">
              {{ c.loginId }} · {{ c.agencyMember ? '대리점 직원' : (c.companyName || '리드파워 영업') }}
            </span>
          </button>
        </li>
      </ul>

      <div class="sm-editor-actions">
        <button
          v-if="currentSalesId && allowClear"
          type="button"
          class="sm-btn"
          :disabled="busy"
          @click="clearAssignment"
        >
          지정 해제
        </button>
        <button type="button" class="sm-btn" :disabled="busy" @click="closeEditor">
          취소
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { orderService } from '~/services/order.service'
import type { SalesManagerCandidate, SalesManagerCandidatesResponse } from '~/types/order'

interface Props {
  /** 추천 판정용 발주 ID (목록 일괄 지정처럼 발주가 여럿이면 비움) */
  orderId?: number | null
  /** 현재 담당자 user_id (null = 미지정) */
  currentSalesId?: number | null
  currentName?: string | null
  currentAgencyName?: string | null
  /** 권한 없음 — 현재 값만 보여 준다 */
  readonly?: boolean
  /** readonly 일 때 이유 한 줄을 보일지 */
  showReadonlyHint?: boolean
  /** 저장 중 — 버튼을 잠깐 막는다 */
  busy?: boolean
  /** 처음부터 고르기 상태로 연다 (목록 일괄 지정 패널) */
  startOpen?: boolean
  /** 고르기 상태에서 [지정 해제] 를 보일지 */
  allowClear?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orderId: null,
  currentSalesId: null,
  currentName: null,
  currentAgencyName: null,
  readonly: false,
  showReadonlyHint: true,
  busy: false,
  startOpen: false,
  allowClear: true
})

const emit = defineEmits<{
  /** 고른 담당자 (null = 지정 해제) */
  select: [candidate: SalesManagerCandidate | null]
  /** 고르기를 닫음 (취소) */
  cancel: []
}>()

const editing = ref(props.startOpen)
const keyword = ref('')
const loading = ref(false)
const message = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const data = ref<SalesManagerCandidatesResponse | null>(null)
/** 후보를 어느 발주 기준으로 받았는지 — 발주가 바뀌면 다시 받는다 */
let loadedFor: number | null | undefined

const loadCandidates = async () => {
  if (loadedFor === (props.orderId ?? null) && data.value) { return }
  loading.value = true
  message.value = ''
  try {
    data.value = await orderService.getSalesManagerCandidates(props.orderId)
    loadedFor = props.orderId ?? null
    if (!data.value?.candidates?.length) {
      message.value = '영업 담당자(SALES_MANAGER) 사용자가 없습니다. 기초정보 > 사용자관리에서 먼저 등록하세요.'
    }
  } catch (e: any) {
    message.value = e?.message || '영업 담당자 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

const normalize = (s: string | null | undefined) => (s || '').replace(/\s+/g, '').toLowerCase()

const filtered = computed<SalesManagerCandidate[]>(() => {
  const list = data.value?.candidates || []
  const k = normalize(keyword.value)
  if (!k) { return list }
  return list.filter(c =>
    normalize(c.userName).includes(k) ||
    normalize(c.loginId).includes(k) ||
    normalize(c.companyName).includes(k))
})

const resolveOk = computed(() => data.value?.resolveStatus === 'OK' && !!data.value?.recommendedAgencyName)
const resolveLine = computed(() => {
  const d = data.value
  if (!d || !d.resolveStatus) { return '' }
  if (resolveOk.value) {
    const hasStaff = (d.candidates || []).some(c => c.recommended)
    return hasStaff
      ? `수요기관 담당 대리점: ${d.recommendedAgencyName} — 소속 직원을 «추천»으로 맨 위에 두었습니다`
      : `수요기관 담당 대리점: ${d.recommendedAgencyName} — 등록된 영업 직원이 없습니다`
  }
  return `담당 대리점 판정: ${d.resolveStatusLabel || d.resolveStatus}`
})

const openEditor = async () => {
  editing.value = true
  keyword.value = ''
  await loadCandidates()
  await nextTick()
  inputRef.value?.focus()
}

const closeEditor = () => {
  editing.value = false
  keyword.value = ''
  emit('cancel')
}

const pick = (c: SalesManagerCandidate) => {
  if (props.busy) { return }
  emit('select', c)
  if (!props.startOpen) { editing.value = false }
  keyword.value = ''
}

const pickFirst = () => {
  if (filtered.value.length === 1) { pick(filtered.value[0]) }
}

const clearAssignment = () => {
  if (props.busy) { return }
  emit('select', null)
  if (!props.startOpen) { editing.value = false }
}

// 목록 패널처럼 처음부터 열린 경우 바로 후보를 받는다
watch(() => props.startOpen, (v) => {
  if (v) { editing.value = true; loadCandidates() }
}, { immediate: true })

// 다른 발주로 바뀌면 추천이 달라지므로 다시 받는다
watch(() => props.orderId, () => {
  if (editing.value) { loadCandidates() }
})
</script>

<style scoped>
.sm-picker {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sm-current {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
}

.sm-current-name {
  font-weight: 600;
  color: #1e40af;
}

.sm-agency {
  font-weight: 400;
  color: #475569;
}

.sm-unassigned {
  color: #b45309;
  font-weight: 600;
}

.sm-readonly-hint {
  font-size: 0.75rem;
  color: #64748b;
}

.sm-btn {
  min-height: 44px;
  min-width: 64px;
  padding: 0 0.875rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 0.875rem;
  cursor: pointer;
}

.sm-btn.primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.sm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sm-spin-inline {
  color: #94a3b8;
}

.sm-editor {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.sm-search-row {
  position: relative;
}

.sm-input {
  width: 100%;
  min-height: 44px;
}

.sm-spin {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  color: #94a3b8;
}

.sm-resolve {
  margin: 0;
  font-size: 0.75rem;
  color: #64748b;
}

.sm-resolve.ok {
  color: #047857;
}

.sm-msg {
  margin: 0;
  font-size: 0.75rem;
  color: #b91c1c;
}

.sm-options {
  max-height: 280px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.sm-option {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.sm-option:hover,
.sm-option:active {
  background: #f8fafc;
}

.sm-option.current {
  background: #eff6ff;
}

.sm-opt-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

.sm-opt-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.sm-opt-agency {
  font-size: 0.8125rem;
  color: #475569;
}

.sm-opt-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.sm-badge {
  padding: 0.0625rem 0.375rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.sm-badge.rec {
  background: #dcfce7;
  color: #166534;
}

.sm-badge.cur {
  background: #dbeafe;
  color: #1e40af;
}

.sm-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
