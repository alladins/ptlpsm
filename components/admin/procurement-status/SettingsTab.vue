<template>
  <div class="ps-settings">
    <!-- 수집 품명 -->
    <section class="panel">
      <h3 class="panel-title">
        <i class="fas fa-tags" /> 수집 품명
      </h3>
      <GuideNotice icon="fa-info-circle" tone="warn" open-label="자세히">
        <template #summary>
          품명을 추가하면 <b>그 품명의 지난 기간은 아래 «과거 수집»을 다시 돌려야</b> 생깁니다
        </template>
        <ul class="guide-list">
          <li>나라장터 쇼핑몰 납품요구의 <b>품명(물품분류명)</b>과 정확히 같아야 합니다. 예: 기포단열재, 고무발포단열재</li>
          <li>품명을 끄거나 지워도 이미 받은 데이터는 지워지지 않습니다. 현황 화면의 «품명» 선택으로 나눠 볼 수 있습니다.</li>
          <li>매일 아침 06:30 에 켜진 품명마다 전날까지 접수된 건을 받습니다.</li>
        </ul>
      </GuideNotice>

      <div v-if="group" class="word-list">
        <div v-for="w in group.words" :key="w.code" class="word" :class="{ off: w.useYn !== 'Y' }">
          <span>{{ w.word }}</span>
          <button type="button" class="word-btn" :disabled="busy" :title="w.useYn === 'Y' ? '끄기' : '켜기'" @click="toggle(w.code, w.useYn !== 'Y')">
            <i :class="w.useYn === 'Y' ? 'fas fa-toggle-on' : 'fas fa-toggle-off'" />
          </button>
          <button type="button" class="word-btn danger" :disabled="busy" title="지우기" @click="remove(w.code, w.word)">
            <i class="fas fa-trash-alt" />
          </button>
        </div>
      </div>
      <div class="add-row">
        <input
          v-model.trim="newWord"
          class="form-input"
          type="text"
          maxlength="50"
          placeholder="품명 추가 (예: 고무발포단열재)"
          @keyup.enter="add"
        >
        <button type="button" class="btn btn-primary" :disabled="busy || !newWord" @click="add">
          <i class="fas fa-plus" /> 추가
        </button>
      </div>
    </section>

    <!-- 수집 -->
    <section class="panel">
      <h3 class="panel-title">
        <i class="fas fa-cloud-download-alt" /> 수집
        <span v-if="status?.running" class="running"><i class="fas fa-spinner fa-spin" /> 수집 중</span>
      </h3>
      <!-- 상태 · 기간 · 실행을 한 줄로 (좁으면 다음 줄로) -->
      <div class="collect-row">
        <span class="chip" :class="status?.scheduleEnabled ? 'on' : 'off'">매일 06:30 {{ status?.scheduleEnabled ? '켜짐' : '꺼짐' }}</span>
        <span class="chip" :class="status?.keyConfigured ? 'on' : 'off'">인증키 {{ status?.keyConfigured ? '설정됨' : '없음' }}</span>
        <span class="divider" />
        <label><span class="label-text">시작일</span><input v-model="fromDate" class="form-input date" type="date" :max="today"></label>
        <label><span class="label-text">종료일</span><input v-model="toDate" class="form-input date" type="date" :max="today"></label>
        <GuardedButton
          class="btn btn-primary"
          :blocked="!!collectBlockedReason"
          :reason="collectBlockedReason"
          :disabled="busy"
          @click="runBackfill"
        >
          <i class="fas fa-history" /> 과거 수집 실행
        </GuardedButton>
      </div>
      <p class="hint">
        한 달에 품명당 1회 호출 — 2023년부터 지금까지도 5분 안팎입니다. 결과는
        <NuxtLink to="/admin/sales-lead">
          공모·낙찰 수집 › 수집 기록
        </NuxtLink>에 «조달 현황(쇼핑몰 납품요구)»으로 남습니다.
      </p>
      <p v-if="message" class="msg">
        {{ message }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 조달 영업 현황 › 설정 (리드파워 관리자) — 수집 품명(공통코드 MALL_TARGET_PRDCT)·과거 수집
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { procurementStatusService } from '~/services/procurement-status.service'
import type { LeadKeywordGroup } from '~/types/sales-lead'
import type { MallCollectStatus } from '~/types/procurement-status'

const emit = defineEmits<{ changed: [] }>()

const group = ref<LeadKeywordGroup | null>(null)
const status = ref<MallCollectStatus | null>(null)
const newWord = ref('')
const busy = ref(false)
const message = ref('')

const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
const today = kstToday()
const fromDate = ref('2023-01-01')
const toDate = ref(today)

const collectBlockedReason = computed(() => {
  if (status.value?.blockedReason) { return status.value.blockedReason }
  if (!fromDate.value || !toDate.value) { return '시작일과 종료일을 넣으세요' }
  if (fromDate.value > toDate.value) { return '시작일을 종료일보다 앞으로 넣으세요' }
  return ''
})

let timer: ReturnType<typeof setInterval> | null = null

async function loadAll () {
  try {
    const [g, s] = await Promise.all([procurementStatusService.getTargets(), procurementStatusService.getStatus()])
    group.value = g
    status.value = s
  } catch (e) {
    message.value = (e as Error).message
  }
}

async function refreshStatus () {
  try {
    const wasRunning = status.value?.running
    status.value = await procurementStatusService.getStatus()
    if (wasRunning && !status.value.running) {
      message.value = '수집이 끝났습니다. 결과는 수집 기록에서 확인하세요.'
      emit('changed')
    }
  } catch { /* 폴링 실패는 무시 */ }
}

async function run (fn: () => Promise<LeadKeywordGroup>, done: string) {
  busy.value = true
  message.value = ''
  try {
    group.value = await fn()
    message.value = done
    emit('changed')
  } catch (e) {
    message.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

const add = () => {
  const w = newWord.value
  if (!w) { return }
  run(() => procurementStatusService.addTarget(w), `«${w}» 을(를) 추가했습니다. 지난 기간은 과거 수집을 실행하세요.`)
    .then(() => { newWord.value = '' })
}

const toggle = (code: string, use: boolean) =>
  run(() => procurementStatusService.setTargetUse(code, use), use ? '켰습니다.' : '껐습니다.')

const remove = (code: string, word: string) => {
  if (!confirm(`«${word}» 품명을 지울까요? 이미 받은 데이터는 남습니다.`)) { return }
  run(() => procurementStatusService.removeTarget(code), '지웠습니다.')
}

async function runBackfill () {
  busy.value = true
  message.value = ''
  try {
    status.value = await procurementStatusService.collect({ fromDate: fromDate.value, toDate: toDate.value })
    status.value = { ...status.value, running: true }
    message.value = `${fromDate.value} ~ ${toDate.value} 과거 수집을 시작했습니다.`
  } catch (e) {
    message.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  loadAll()
  timer = setInterval(refreshStatus, 5000)
})
onBeforeUnmount(() => { if (timer) { clearInterval(timer) } })
</script>

<style scoped>
@import '@/assets/css/admin-buttons.css';

.ps-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.guide-list {
  margin: 0;
  padding-left: 1.1rem;
  line-height: 1.7;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.word {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.25rem 0.25rem 0.75rem;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  font-size: 0.875rem;
}

.word.off {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  text-decoration: line-through;
}

.word-btn {
  min-width: 36px;
  min-height: 36px;
  border: none;
  background: none;
  color: #2563eb;
  cursor: pointer;
}

.word-btn.danger {
  color: #dc2626;
}

.add-row,
.collect-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.collect-row label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #475569;
}

.form-input {
  min-height: 44px;
  padding: 0.375rem 0.625rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
}

.add-row .form-input {
  flex: 1;
  min-width: 200px;
}

/* 라벨 글자가 flex 안에서 눌려 «시작/일»로 쪼개지지 않게 */
.label-text {
  flex-shrink: 0;
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 24px;
  margin: 0 0.25rem;
  background: #e2e8f0;
}

.chip {
  white-space: nowrap;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
}

.chip.on {
  background: #dcfce7;
  color: #166534;
}

.chip.off {
  background: #f1f5f9;
  color: #64748b;
}

.running {
  font-size: 0.8125rem;
  font-weight: 400;
  color: #2563eb;
}

.hint {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.msg {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #1e40af;
}
</style>
