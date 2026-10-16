<!--
  공모·낙찰 수집 — ⑤ 알림 설정 (담당자 문자·메일 발송, V3.44.0 · 2026-10-15)
  - 자동 발송 켜기/시각, 문자·메일 채널, 메일 발신 주소·이름, 링크 주소, 미배정 묶음 수신자(리드파워 내부)
  - 시각은 서버 재시작 없이 바로 반영된다 (스케줄러가 매분 설정을 본다)
  - 본문 내용(금액 하한·발주 담당 표시·안내 문구, V3.45.0). 미리보기·발송 기록은 옆 탭 NoticePreviewTab (10-16 분리)
  - 섹션마다 한 줄 배치·입력 폭 고정 (10-16 사용자: 폼이 너무 넓게 퍼짐)
  - 리드파워 관리자만 (서버 /notices/** 도 같은 기준). 휴대폰·태블릿에서도 쓰도록 한 줄씩 쌓이는 폼
-->
<template>
  <div class="notice-setting-tab">
    <GuideNotice icon="fa-bell" tone="info" open-label="발송 흐름 자세히" class="ns-guide">
      <template #summary>
        매일 <b>설정한 시각</b>에 그날 처음 받은 설계·공사 리드를 담당 대리점 직원에게 <b>문자·메일</b>로 보냅니다. 자동 발송은 기본 꺼짐이며 여기서 켭니다.
      </template>
      <ul class="guide-list">
        <li>06:00 수집·담당 배정이 끝난 뒤 발송 시각에 한 번 묶어 보냅니다. 같은 리드는 다시 보내지 않습니다.</li>
        <li>대리점 직원별 수신 여부(문자/메일)는 기초정보 › 사용자관리에서 바꿉니다. 대리점관리 › 소속 직원에서 볼 수 있습니다.</li>
        <li>담당 대리점이 없는(미배정) 리드는 아래에서 고른 리드파워 담당자에게만 갑니다.</li>
        <li>문자 발신번호는 뿌리오 설정을 따릅니다. 메일은 아래 발신 주소로 나갑니다(메일 서버가 다른 주소를 거부하면 실패로 기록됩니다).</li>
        <li>문구는 문자관리 › 메시지 템플릿 «공모·낙찰 안내 (대리점 문자/메일)»에서 고칩니다.</li>
      </ul>
    </GuideNotice>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>설정을 불러오는 중...</p>
    </div>

    <form v-else-if="form" class="ns-form" @submit.prevent="save">
      <section class="ns-section">
        <h3 class="ns-title">
          <i class="fas fa-clock" /> 자동 발송
        </h3>
        <div class="ns-row">
          <label class="ns-check">
            <input v-model="autoSend" type="checkbox"> 매일 자동으로 보내기
          </label>
          <span class="ns-sep" />
          <label class="ns-field" title="저장하면 다음 발송부터 바로 적용됩니다. 06:00 수집이 끝난 뒤 시각으로 두세요.">
            <span>발송 시각 (KST)</span>
            <input v-model="form.sendTime" type="time" class="form-input ns-time" required>
          </label>
          <span class="text-muted small">06:00 수집 뒤 시각으로</span>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title">
          <i class="fas fa-paper-plane" /> 채널
        </h3>
        <div class="ns-row">
          <label class="ns-check"><input v-model="smsEnabled" type="checkbox"> 문자(LMS)</label>
          <label class="ns-check"><input v-model="emailEnabled" type="checkbox"> 메일</label>
          <span v-if="!smsEnabled && !emailEnabled" class="ns-warn"><i class="fas fa-exclamation-triangle" /> 둘 다 끄면 아무것도 보내지 않습니다.</span>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title">
          <i class="fas fa-envelope" /> 메일 발신
        </h3>
        <!-- 한 줄 — 입력 폭 고정 (10-16 사용자: «너무 폭 넓게 표현») -->
        <div class="ns-row">
          <label class="ns-field">
            <span>발신 주소</span>
            <input v-model="form.mailFrom" type="email" class="form-input ns-w-email" required placeholder="support@leadpower21.com">
          </label>
          <label class="ns-field">
            <span>발신자 이름</span>
            <input v-model="form.mailFromName" type="text" class="form-input ns-w-name" placeholder="리드파워">
          </label>
          <label class="ns-field">
            <span>화면 링크 기본 주소 <small class="text-muted">(비우면 서버 기본)</small></span>
            <input v-model="linkBaseUrl" type="url" class="form-input ns-w-url" placeholder="https://shipmg.lphydrofoam.com">
          </label>
        </div>
      </section>

      <!-- 본문 내용 (V3.45.0, 10-16 재설계) — 사용자 결정: 하한·발주 담당 표시·안내 문구는 템플릿이 아니라 여기서 -->
      <section class="ns-section">
        <h3 class="ns-title" title="문자는 건수·금액 최대 건만, 건별 상세는 메일 — 미리보기·기록 탭에서 확인">
          <i class="fas fa-file-alt" /> 본문 내용
        </h3>
        <div class="ns-rows">
          <div class="ns-row">
            <label class="ns-field">
              <span>설계 금액 하한 (원) <small class="text-muted">0 = 제한 없음</small></span>
              <input
                v-model.number="minAmountDesign"
                type="number"
                min="0"
                step="1000000"
                inputmode="numeric"
                class="form-input ns-amount"
              >
              <small class="text-muted ns-amount-hint">{{ amountHint(minAmountDesign) }}</small>
            </label>
            <label class="ns-field">
              <span>공사 금액 하한 (원) <small class="text-muted">0 = 제한 없음</small></span>
              <input
                v-model.number="minAmountConstruction"
                type="number"
                min="0"
                step="10000000"
                inputmode="numeric"
                class="form-input ns-amount"
              >
              <small class="text-muted ns-amount-hint">{{ amountHint(minAmountConstruction) }}</small>
            </label>
            <span class="ns-sep" />
            <label class="ns-check" title="설계 리드의 나라장터 계약 정보에 있는 값 — 설계사무소와 연락이 안 될 때 확인 경로">
              <input v-model="showOrderContact" type="checkbox"> 메일에 발주 담당(부서·담당자·전화) 표시
            </label>
          </div>
          <div class="ns-row">
            <label class="ns-field ns-field-top">
              <span>메일 머리 안내 문구 <small class="text-muted">({{ (form.mailIntro || '').length }}/500)</small></span>
              <textarea
                v-model="mailIntro"
                class="form-input ns-intro"
                rows="2"
                maxlength="500"
                placeholder="비우면 생략. 예) 설계 건은 설계사무소에 자재 스펙 반영을, 공사 건은 시공사 현장에 견적을 제안해 주세요."
              />
            </label>
          </div>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title">
          <i class="fas fa-user-slash" /> 미배정 묶음 수신자
          <span class="ns-count">{{ selectedIds.size }}명</span>
        </h3>
        <p class="text-muted small ns-hint">
          담당 대리점이 정해지지 않은 리드를 받을 리드파워 담당자입니다. 수신 여부(문자/메일)는 사용자관리 설정을 따릅니다.
        </p>
        <input v-model="candidateFilter" type="search" class="form-input ns-filter" placeholder="이름·아이디·회사로 찾기" enterkeyhint="search">
        <ul class="candidate-list">
          <li v-for="u in filteredCandidates" :key="u.userId">
            <label class="candidate">
              <input type="checkbox" :checked="selectedIds.has(u.userId)" @change="toggle(u.userId)">
              <span class="cand-name">{{ u.userName }} <small class="text-muted">({{ u.loginId }})</small></span>
              <span class="cand-meta">
                {{ roleLabel(u.role) }}<template v-if="u.companyName"> · {{ u.companyName }}</template>
              </span>
              <span class="cand-contact">
                <span :class="u.leadNotifySms === 'N' || !u.phone ? 'text-muted' : ''">문자 {{ u.phone || '없음' }}{{ u.leadNotifySms === 'N' ? ' (수신 끔)' : '' }}</span>
                <span :class="u.leadNotifyEmail === 'N' || !u.email ? 'text-muted' : ''">메일 {{ u.email || '없음' }}{{ u.leadNotifyEmail === 'N' ? ' (수신 끔)' : '' }}</span>
              </span>
            </label>
          </li>
        </ul>
        <p v-if="filteredCandidates.length === 0" class="text-muted small">
          조건에 맞는 리드파워 사용자가 없습니다.
        </p>
      </section>

      <div class="ns-actions">
        <span v-if="form.updatedAt" class="text-muted small">마지막 저장 {{ formatDateTime(form.updatedAt) }} · {{ form.updatedBy || '-' }}</span>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'" /> 저장
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatDateTime } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import type { NoticeRecipient, SalesLeadNoticeSetting } from '~/types/sales-lead'

const loading = ref(false)
const saving = ref(false)
const form = ref<SalesLeadNoticeSetting | null>(null)
const candidates = ref<NoticeRecipient[]>([])
const candidateFilter = ref('')
const selectedIds = ref<Set<number>>(new Set())

// Y/N ↔ 체크박스
const autoSend = computed({ get: () => form.value?.autoSend === 'Y', set: (v: boolean) => { if (form.value) { form.value.autoSend = v ? 'Y' : 'N' } } })
const smsEnabled = computed({ get: () => form.value?.smsEnabled === 'Y', set: (v: boolean) => { if (form.value) { form.value.smsEnabled = v ? 'Y' : 'N' } } })
const emailEnabled = computed({ get: () => form.value?.emailEnabled === 'Y', set: (v: boolean) => { if (form.value) { form.value.emailEnabled = v ? 'Y' : 'N' } } })
const linkBaseUrl = computed({ get: () => form.value?.linkBaseUrl || '', set: (v: string) => { if (form.value) { form.value.linkBaseUrl = v || null } } })

// 본문 내용 (V3.45.0) — 숫자 칸은 비우면 0, 체크는 기본 켬
const minAmountDesign = computed({
  get: () => form.value?.minAmountDesign ?? 0,
  set: (v: number | string) => { if (form.value) { form.value.minAmountDesign = typeof v === 'number' && v >= 0 ? Math.floor(v) : 0 } }
})
const minAmountConstruction = computed({
  get: () => form.value?.minAmountConstruction ?? 0,
  set: (v: number | string) => { if (form.value) { form.value.minAmountConstruction = typeof v === 'number' && v >= 0 ? Math.floor(v) : 0 } }
})
const showOrderContact = computed({
  get: () => form.value?.showOrderContact !== 'N',
  set: (v: boolean) => { if (form.value) { form.value.showOrderContact = v ? 'Y' : 'N' } }
})
const mailIntro = computed({ get: () => form.value?.mailIntro || '', set: (v: string) => { if (form.value) { form.value.mailIntro = v || null } } })

/** 원 → «1.2억» / «500만» 안내 */
const amountHint = (v: number | null | undefined) => {
  if (!v || v <= 0) { return '제한 없음' }
  if (v >= 100_000_000) { return `${(v / 100_000_000).toFixed(1).replace(/\.0$/, '')}억 미만 제외` }
  return `${Math.round(v / 10_000).toLocaleString()}만 미만 제외`
}

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: '시스템관리자',
  LEADPOWER_MANAGER: '리드파워담당자',
  SALES_MANAGER: '영업담당자'
}
const roleLabel = (r: string) => ROLE_LABELS[r] || r

const filteredCandidates = computed(() => {
  const q = candidateFilter.value.trim().toLowerCase()
  if (!q) { return candidates.value }
  return candidates.value.filter(u =>
    (u.userName || '').toLowerCase().includes(q) ||
    (u.loginId || '').toLowerCase().includes(q) ||
    (u.companyName || '').toLowerCase().includes(q))
})

const toggle = (id: number) => {
  const s = new Set(selectedIds.value)
  if (s.has(id)) { s.delete(id) } else { s.add(id) }
  selectedIds.value = s
}

const load = async () => {
  loading.value = true
  try {
    const [setting, cands] = await Promise.all([
      salesLeadService.getNoticeSetting(),
      salesLeadService.getNoticeCandidates()
    ])
    form.value = setting
    candidates.value = cands
    selectedIds.value = new Set((setting.unassignedUserIds || '').split(',').map(s => Number(s.trim())).filter(n => n > 0))
  } catch (e) {
    const err = toApiError(e)
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!form.value) { return }
  saving.value = true
  try {
    form.value = await salesLeadService.updateNoticeSetting({
      ...form.value,
      unassignedUserIds: Array.from(selectedIds.value).join(',')
    })
    alert('저장했습니다.' + (form.value.autoSend === 'Y' ? ` 매일 ${form.value.sendTime} 에 자동으로 보냅니다.` : ' 자동 발송은 꺼져 있습니다.'))
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.ns-guide {
  margin-bottom: 0.75rem;
}

.guide-list {
  margin: 0.25rem 0 0;
  padding-left: 1.125rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.ns-form {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

/* 섹션 = 제목(왼쪽 고정 폭) + 항목(오른쪽 한 줄) — 10-16 사용자: «제목 | 항목 한 줄로, 간격 줄이기».
   제목 뒤 자식은 전부 2열로 흘러가므로 미배정 수신자처럼 여러 줄인 섹션도 같은 틀을 쓴다 */
.ns-section {
  display: grid;
  grid-template-columns: 168px 1fr;   /* 가장 긴 제목 «미배정 묶음 수신자 N명» 기준 */
  column-gap: 0.75rem;
  row-gap: 0.25rem;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.ns-section > *:not(.ns-title) {
  grid-column: 2;
}

.ns-title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  align-self: start;
  margin: 0;
  padding-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
}

.ns-rows {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.ns-sep {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

.ns-amount-hint {
  white-space: nowrap;
}

@media (max-width: 640px) {
  .ns-section {
    grid-template-columns: 1fr;
  }

  .ns-section > *:not(.ns-title) {
    grid-column: 1;
  }

  .ns-title {
    padding-top: 0;
  }

  .ns-sep {
    display: none;
  }
}

.ns-count {
  padding: 0 0.5rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
}

.ns-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
  min-height: 36px;
}

.ns-check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 36px;
  font-size: 0.875rem;
  white-space: nowrap;
  cursor: pointer;
}

.ns-check input {
  width: 18px;
  height: 18px;
}

/* 라벨을 입력칸 옆에 — 세로로 쌓지 않는다 */
.ns-field {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #475569;
  white-space: nowrap;
}

.ns-field.ns-field-top {
  align-items: flex-start;
}

.ns-field.ns-field-top > span {
  padding-top: 0.4rem;
}

.form-input.ns-time {
  width: 130px;
}

.form-input.ns-date {
  width: 160px;
}

.form-input.ns-amount {
  width: 180px;
}

/* 한 줄 배치용 고정 폭 — 폼이 화면 폭대로 퍼지지 않게 (10-16) */
.form-input.ns-w-email {
  width: 280px;
}

.form-input.ns-w-name {
  width: 140px;
}

.form-input.ns-w-url {
  width: 300px;
}

.form-input.ns-intro {
  width: 640px;
  max-width: 100%;
}

.form-input.ns-select {
  min-width: 220px;
  max-width: 100%;
}

.form-input.ns-intro {
  resize: vertical;
  min-height: 60px;
}

.ns-warn {
  color: #b45309;
  font-size: 0.8125rem;
}

.ns-hint {
  margin: 0;
}

.form-input.ns-filter {
  width: 100%;
  max-width: 360px;
  margin-bottom: 0.5rem;
}

.candidate-list {
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.candidate {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.125rem 0.625rem;
  align-items: center;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}

.candidate input {
  grid-row: span 3;
  width: 18px;
  height: 18px;
}

.cand-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.cand-meta,
.cand-contact {
  font-size: 0.75rem;
  color: #64748b;
}

.cand-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}

.ns-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

</style>
