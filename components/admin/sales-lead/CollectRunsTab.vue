<!--
  공모·낙찰 수집 — ③ 수집 기록
  - 위: 수집 상태(자동 수집·인증키·기본 기간·호출 상한) + «지금 수집»
  - 가운데: 실행 기록
  - 아래: 원천 응답 붙여넣기 적재 (시스템관리자)
  - 수집이 진행 중이면 5초마다 기록·상태를 다시 읽는다 (끝나거나 탭을 떠나면 멈춤)
-->
<template>
  <div class="collect-tab">
    <!-- 수집 상태 -->
    <div class="status-panel">
      <div class="status-items">
        <div class="status-item">
          <span class="item-label">자동 수집(06:00)</span>
          <span v-if="!status" class="text-muted">-</span>
          <span v-else class="status-badge" :class="status.scheduleEnabled ? 'success' : 'warning'">
            {{ status.scheduleEnabled ? '켜짐' : '꺼짐' }}
          </span>
        </div>
        <div class="status-item">
          <span class="item-label">인증키</span>
          <span v-if="!status" class="text-muted">-</span>
          <span v-else class="status-badge" :class="status.keyConfigured ? 'success' : 'danger'">
            {{ status.keyConfigured ? '설정됨' : '미설정' }}
          </span>
        </div>
        <div class="status-item">
          <span class="item-label">기본 수집 기간</span>
          <strong>{{ status ? `${status.windowDays}일` : '-' }}</strong>
        </div>
        <div class="status-item">
          <span class="item-label">1회 호출 상한</span>
          <strong>{{ status ? `${formatNumber(status.maxCallsPerRun)}회` : '-' }}</strong>
        </div>
        <div v-if="status?.running" class="status-item">
          <span class="status-badge primary">
            <i class="fas fa-spinner fa-spin" />&nbsp;수집 중
          </span>
        </div>
      </div>

      <div v-if="canCollect" class="collect-action">
        <label class="item-label" for="collect-window-days">기간(일)</label>
        <input
          id="collect-window-days"
          v-model.number="windowDays"
          type="number"
          min="1"
          max="90"
          class="form-input window-input"
        >
        <GuardedButton
          type="button"
          class="btn-action btn-primary"
          :blocked="collectBlocked"
          :reason="collectBlockedReason"
          :disabled="!status || starting"
          @click="startCollect"
        >
          <i :class="starting ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-download-alt'" /> 지금 수집
        </GuardedButton>
      </div>
      <p v-if="status?.blockedReason" class="blocked-reason">
        <i class="fas fa-ban" /> {{ status.blockedReason }}
      </p>
    </div>

    <!-- 실행 기록 -->
    <div class="table-section">
      <div class="table-header">
        <div class="table-info">
          <span>최근 실행 <strong>{{ runs.length }}</strong>건</span>
          <span v-if="polling" class="text-muted polling-note">
            <i class="fas fa-sync-alt fa-spin" /> 5초마다 새로 고침
          </span>
        </div>
        <div class="table-actions">
          <button type="button" class="btn-action btn-secondary" :disabled="loadingRuns" @click="refresh">
            <i :class="loadingRuns ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 새로 고침
          </button>
        </div>
      </div>

      <div v-if="loadingRuns && runs.length === 0" class="loading-message">
        <i class="fas fa-spinner fa-spin" />
        <p>데이터를 불러오는 중...</p>
      </div>
      <div v-else-if="runs.length === 0" class="no-data-message">
        <i class="fas fa-inbox" />
        <p>수집 기록이 없습니다.</p>
      </div>
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>시작</th>
              <th>작업</th>
              <th>방식</th>
              <th>기간</th>
              <th>상태</th>
              <th>호출</th>
              <th>받음</th>
              <th>신규</th>
              <th>갱신</th>
              <th>메시지</th>
              <th>실행자</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in runs" :key="run.runId">
              <td class="nowrap">
                {{ formatDateTime(run.startedAt) }}
              </td>
              <td class="text-left">
                {{ collectJobLabel(run.job) }}
              </td>
              <td>{{ codeLabel(COLLECT_TRIGGER_LABELS, run.triggerType) }}</td>
              <td class="nowrap">
                <template v-if="run.windowFrom || run.windowTo">
                  {{ run.windowFrom || '' }} ~ {{ run.windowTo || '' }}
                </template>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="status-badge" :class="runBadge(run.status)">
                  {{ codeLabel(COLLECT_RUN_STATUS_LABELS, run.status) }}
                </span>
              </td>
              <td class="text-right">
                {{ formatNumber(run.apiCalls) }}
              </td>
              <td class="text-right">
                {{ formatNumber(run.fetched) }}
              </td>
              <td class="text-right">
                {{ formatNumber(run.inserted) }}
              </td>
              <td class="text-right">
                {{ formatNumber(run.updated) }}
              </td>
              <td class="text-left message-cell">
                {{ run.message || '-' }}
              </td>
              <td>{{ run.startedBy || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <CollectImportPanel v-if="canImport" @imported="onImported" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import CollectImportPanel from '~/components/admin/sales-lead/CollectImportPanel.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatDateTime, formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { codeLabel } from '~/types/agency'
import {
  COLLECT_RUN_STATUS_BADGE,
  COLLECT_RUN_STATUS_LABELS,
  COLLECT_TRIGGER_LABELS,
  collectJobLabel,
  type SalesCollectRun,
  type SalesCollectStatus
} from '~/types/sales-lead'

// canCollect: «지금 수집»(메뉴권한 SALES_LEAD 등록) / canImport: 붙여넣기 적재(시스템관리자 전용)
const props = defineProps<{ status: SalesCollectStatus | null, canCollect?: boolean, canImport?: boolean }>()

const emit = defineEmits<{ 'status-change': [status: SalesCollectStatus] }>()

const POLL_INTERVAL_MS = 5000

const runs = ref<SalesCollectRun[]>([])
const loadingRuns = ref(false)
const starting = ref(false)
/** 수동 수집 기간 — 상태를 처음 받으면 기본값(windowDays)으로 채운다 */
const windowDays = ref<number | null>(props.status?.windowDays ?? null)

const runBadge = (status?: string | null) =>
  (COLLECT_RUN_STATUS_BADGE as Record<string, string>)[status || ''] || 'info'

const collectBlocked = computed(() => !!props.status && (!!props.status.blockedReason || props.status.running))
const collectBlockedReason = computed(() => {
  if (!props.status) { return '' }
  if (props.status.blockedReason) { return props.status.blockedReason }
  if (props.status.running) { return '수집이 진행 중입니다. 끝난 뒤 다시 실행하세요.' }
  return ''
})

// ===== 조회 =====
const loadRuns = async (silent = false) => {
  if (!silent) { loadingRuns.value = true }
  try {
    runs.value = await salesLeadService.getRuns(50) || []
  } finally {
    loadingRuns.value = false
  }
}

const loadStatus = async (): Promise<SalesCollectStatus> => {
  const next = await salesLeadService.getStatus()
  if (windowDays.value === null) { windowDays.value = next.windowDays }
  emit('status-change', next)
  return next
}

const refresh = async () => {
  try {
    const [next] = await Promise.all([loadStatus(), loadRuns()])
    if (next.running) { startPolling() }
  } catch (e) {
    const err = toApiError(e)
    // 세션 만료(401·403)는 로그인 화면으로 넘어가므로 목록 불러오기 실패 팝업을 띄우지 않는다
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  }
}

// ===== 진행 중 폴링 =====
let pollTimer: ReturnType<typeof setInterval> | null = null
let ticking = false
const polling = ref(false)

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  polling.value = false
}

const tick = async () => {
  if (ticking) { return }
  ticking = true
  try {
    const [next] = await Promise.all([loadStatus(), loadRuns(true)])
    if (!next.running) { stopPolling() }
  } catch (e) {
    // 일시적 오류로 폴링을 멈추면 진행 상황을 놓친다 — 콘솔에만 남기고 다음 차례에 다시 읽는다
    console.error('수집 상태 새로 고침 실패:', e)
  } finally {
    ticking = false
  }
}

const startPolling = () => {
  if (pollTimer) { return }
  polling.value = true
  pollTimer = setInterval(tick, POLL_INTERVAL_MS)
}

// ===== 지금 수집 =====
const startCollect = async () => {
  const days = windowDays.value
  if (typeof days !== 'number' || !Number.isInteger(days) || days < 1 || days > 90) {
    alert('수집 기간은 1~90일 사이의 정수로 입력하세요.')
    return
  }
  starting.value = true
  try {
    const next = await salesLeadService.startCollect(days)
    emit('status-change', next)
    await loadRuns(true)
    // 백그라운드 실행이라 응답 직후에는 running 이 아직 false 일 수 있다 — 일단 폴링을 시작하고 tick 에서 멈춘다
    startPolling()
  } catch (e) {
    alert(toApiError(e).message)
    // 막힌 이유가 바뀌었을 수 있으니 상태를 다시 읽는다
    loadStatus().catch(() => {})
  } finally {
    starting.value = false
  }
}

// ===== 붙여넣기 적재 후 =====
const onImported = () => {
  loadRuns(true).catch(e => console.error('수집 기록 새로 고침 실패:', e))
}

onMounted(refresh)
onBeforeUnmount(stopPolling)
</script>

<style scoped>
.status-panel {
  padding: 0.875rem 1rem;
  margin-bottom: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.status-items {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.item-label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #64748b;
}

.collect-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.form-input.window-input {
  width: 80px;
}

.blocked-reason {
  margin: 0.5rem 0 0;
  font-size: 0.8125rem;
  color: #991b1b;
}

.polling-note {
  margin-left: 0.75rem;
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
}

.message-cell {
  max-width: 320px;
  font-size: 0.75rem;
  color: #475569;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
