<!--
  공모·낙찰 수집 — ⑤ 알림 설정 (담당자 문자·메일 발송, V3.44.0 · 2026-10-15)
  - 자동 발송 켜기/시각, 문자·메일 채널, 메일 발신 주소·이름, 링크 주소, 미배정 묶음 수신자(리드파워 내부)
  - 시각은 서버 재시작 없이 바로 반영된다 (스케줄러가 매분 설정을 본다)
  - 아래에 날짜별 발송 기록 (수신자·채널·결과)
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
        <h3 class="ns-title"><i class="fas fa-clock" /> 자동 발송</h3>
        <div class="ns-row">
          <label class="ns-check">
            <input v-model="autoSend" type="checkbox"> 매일 자동으로 보내기
          </label>
          <label class="ns-field">
            <span>발송 시각 (KST)</span>
            <input v-model="form.sendTime" type="time" class="form-input ns-time" required>
          </label>
          <span class="text-muted small">저장하면 다음 발송부터 바로 적용됩니다. 06:00 수집이 끝난 뒤 시각으로 두세요.</span>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title"><i class="fas fa-paper-plane" /> 채널</h3>
        <div class="ns-row">
          <label class="ns-check"><input v-model="smsEnabled" type="checkbox"> 문자(LMS)</label>
          <label class="ns-check"><input v-model="emailEnabled" type="checkbox"> 메일</label>
          <span v-if="!smsEnabled && !emailEnabled" class="ns-warn"><i class="fas fa-exclamation-triangle" /> 둘 다 끄면 아무것도 보내지 않습니다.</span>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title"><i class="fas fa-envelope" /> 메일 발신</h3>
        <div class="ns-row">
          <label class="ns-field grow">
            <span>발신 주소</span>
            <input v-model="form.mailFrom" type="email" class="form-input" required placeholder="support@leadpower21.com">
          </label>
          <label class="ns-field">
            <span>발신자 이름</span>
            <input v-model="form.mailFromName" type="text" class="form-input" placeholder="리드파워">
          </label>
        </div>
        <div class="ns-row">
          <label class="ns-field grow">
            <span>화면 링크 기본 주소 <small class="text-muted">(비우면 서버 기본)</small></span>
            <input v-model="linkBaseUrl" type="url" class="form-input" placeholder="https://shipmg.lphydrofoam.com">
          </label>
        </div>
      </section>

      <!-- 본문 내용 (V3.45.0, 10-16 재설계) — 사용자 결정: 하한·발주 담당 표시·안내 문구는 템플릿이 아니라 여기서 -->
      <section class="ns-section">
        <h3 class="ns-title"><i class="fas fa-file-alt" /> 본문 내용</h3>
        <p class="text-muted small ns-hint">
          문자는 <b>건수와 금액 최대 건</b>만, 메일에 건별 상세(접촉처 전화·주소, 설계 기간, 발주 담당, 업체 이력, 리드 상세·나라장터 링크)가 들어갑니다.
        </p>
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
            <small class="text-muted">{{ amountHint(minAmountDesign) }}</small>
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
            <small class="text-muted">{{ amountHint(minAmountConstruction) }}</small>
          </label>
          <span class="text-muted small">하한 미만 건은 문자·메일에서 빼고 «소규모 N건 제외»로 표기합니다. 화면에는 그대로 보입니다.</span>
        </div>
        <div class="ns-row">
          <label class="ns-check">
            <input v-model="showOrderContact" type="checkbox"> 메일에 발주 담당(수요기관 부서·담당자·전화) 표시
          </label>
          <span class="text-muted small">설계 리드의 나라장터 계약 정보에 있는 값입니다. 설계사무소와 연락이 안 될 때 확인 경로가 됩니다.</span>
        </div>
        <div class="ns-row">
          <label class="ns-field grow">
            <span>메일 머리 안내 문구 <small class="text-muted">(비우면 생략 · {{ (form.mailIntro || '').length }}/500)</small></span>
            <textarea
              v-model="mailIntro"
              class="form-input ns-intro"
              rows="2"
              maxlength="500"
              placeholder="예) 설계 건은 설계사무소에 자재 스펙 반영을, 공사 건은 시공사 현장에 견적을 제안해 주세요."
            />
          </label>
        </div>
      </section>

      <section class="ns-section">
        <h3 class="ns-title">
          <i class="fas fa-user-slash" /> 미배정 묶음 수신자
          <span class="ns-count">{{ selectedIds.size }}명</span>
        </h3>
        <p class="text-muted small ns-hint">담당 대리점이 정해지지 않은 리드를 받을 리드파워 담당자입니다. 수신 여부(문자/메일)는 사용자관리 설정을 따릅니다.</p>
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
        <p v-if="filteredCandidates.length === 0" class="text-muted small">조건에 맞는 리드파워 사용자가 없습니다.</p>
      </section>

      <div class="ns-actions">
        <span v-if="form.updatedAt" class="text-muted small">마지막 저장 {{ formatDateTime(form.updatedAt) }} · {{ form.updatedBy || '-' }}</span>
        <button type="submit" class="btn-primary" :disabled="saving">
          <i :class="saving ? 'fas fa-spinner fa-spin' : 'fas fa-save'" /> 저장
        </button>
      </div>
    </form>

    <!-- 미리보기 — 묶음 하나를 실제 조립 규칙으로 (보내지 않음) -->
    <section class="ns-section ns-log">
      <h3 class="ns-title"><i class="fas fa-eye" /> 미리보기 <small class="text-muted">(보내지 않습니다 · 저장한 설정 기준)</small></h3>
      <div class="ns-row">
        <input v-model="previewDate" type="date" class="form-input ns-date" @change="loadPreviewGroups">
        <select v-model="previewAgency" class="form-input ns-select">
          <option v-for="g in previewGroups" :key="g.agencyId ?? 'none'" :value="g.agencyId ?? -1">
            {{ g.agencyId === null ? '미배정' : (g.agencyName || g.agencyCode) }} · {{ g.leads.length }}건
          </option>
        </select>
        <button type="button" class="btn-action btn-secondary" :disabled="previewLoading || previewGroups.length === 0" @click="loadPreview">
          <i :class="previewLoading ? 'fas fa-spinner fa-spin' : 'fas fa-eye'" /> 미리보기
        </button>
        <span v-if="!previewGroupsLoading && previewGroups.length === 0" class="text-muted small">{{ previewDate }} 에 보낼 묶음이 없습니다.</span>
      </div>
      <div v-if="preview" class="preview-wrap">
        <p class="text-muted small">
          {{ preview.agencyName }} · 본문 {{ preview.leadCount }}건
          <template v-if="preview.excludedCount"> · 하한 미만 {{ preview.excludedCount }}건 제외</template>
          <template v-if="preview.alreadySentCount"> · 이미 보낸 {{ preview.alreadySentCount }}건 포함</template>
          · 받는 사람 {{ preview.recipients.length }}명
        </p>
        <p v-if="preview.note" class="ns-warn"><i class="fas fa-info-circle" /> {{ preview.note }}</p>
        <template v-if="preview.smsText">
          <h4 class="preview-h">문자 <small class="text-muted">{{ preview.smsBytes.toLocaleString() }} / 2,000 byte</small></h4>
          <pre class="preview-sms">{{ preview.smsText }}</pre>
        </template>
        <template v-if="preview.mailHtml">
          <h4 class="preview-h">메일 <small class="text-muted">{{ preview.mailSubject }}</small></h4>
          <iframe class="preview-mail" :srcdoc="preview.mailHtml" sandbox="" title="메일 미리보기" />
        </template>
      </div>
    </section>

    <!-- 발송 기록 -->
    <section class="ns-section ns-log">
      <h3 class="ns-title"><i class="fas fa-history" /> 발송 기록</h3>
      <div class="ns-row">
        <input v-model="logDate" type="date" class="form-input ns-date" @change="loadLog">
        <button type="button" class="btn-action btn-secondary" :disabled="logLoading" @click="loadLog">
          <i :class="logLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 조회
        </button>
        <span v-if="!logLoading" class="text-muted small">
          {{ notices.length }}건 · 성공 {{ countBy('SUCCESS') }} · 실패 {{ countBy('FAILED') }} · 생략 {{ countBy('SKIPPED') }}
        </span>
      </div>
      <p v-if="!logLoading && notices.length === 0" class="text-muted small">{{ logDate }} 발송 기록이 없습니다.</p>
      <div v-else class="table-scroll">
        <table class="data-table log-table">
          <thead>
            <tr>
              <th>시각</th>
              <th>묶음</th>
              <th>채널</th>
              <th>받는 사람</th>
              <th>건수</th>
              <th>결과</th>
              <th>사유</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in notices" :key="n.noticeId">
              <td class="nowrap">{{ formatDateTime(n.createdAt) }}</td>
              <td class="nowrap">{{ n.agencyId === null ? '미배정' : agencyLabel(n.agencyId) }}</td>
              <td class="nowrap">{{ n.channel === 'SMS' ? '문자' : '메일' }}</td>
              <td class="nowrap">{{ n.userName || n.userId }} <small class="text-muted">{{ n.recipient }}</small></td>
              <td class="text-right">{{ n.leadCount }}</td>
              <td class="nowrap">
                <span class="status-badge" :class="n.status === 'SUCCESS' ? 'success' : n.status === 'FAILED' ? 'danger' : 'warning'">
                  {{ n.status === 'SUCCESS' ? '성공' : n.status === 'FAILED' ? '실패' : '생략' }}
                </span>
                <small class="text-muted">{{ n.triggerType === 'SCHEDULE' ? '자동' : '수동' }}</small>
              </td>
              <td class="reason">{{ n.errorMessage || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatDateTime } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { todayKst } from '~/types/agency'
import type { LeadDigestGroup, NoticeRecipient, SalesLeadNotice, SalesLeadNoticePreview, SalesLeadNoticeSetting } from '~/types/sales-lead'

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

// ── 발송 기록 ──
const logDate = ref(todayKst())
const logLoading = ref(false)
const notices = ref<SalesLeadNotice[]>([])
const countBy = (s: string) => notices.value.filter(n => n.status === s).length
/** 묶음 이름 — 기록엔 대리점 ID만 있어 ID 로 보여준다 (대리점관리에서 확인) */
const agencyLabel = (id: number) => `대리점 #${id}`

const loadLog = async () => {
  logLoading.value = true
  try {
    notices.value = await salesLeadService.getNotices(logDate.value || undefined) || []
  } catch (e) {
    const err = toApiError(e)
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    logLoading.value = false
  }
}

// ── 미리보기 ──
const previewDate = ref(todayKst())
const previewGroups = ref<LeadDigestGroup[]>([])
const previewGroupsLoading = ref(false)
/** 고른 묶음 — 미배정은 -1 (select 값으로 null 을 쓰기 어려워서) */
const previewAgency = ref<number>(-1)
const previewLoading = ref(false)
const preview = ref<SalesLeadNoticePreview | null>(null)

const loadPreviewGroups = async () => {
  previewGroupsLoading.value = true
  preview.value = null
  try {
    previewGroups.value = await salesLeadService.digest(previewDate.value || undefined) || []
    const first = previewGroups.value[0]
    previewAgency.value = first ? (first.agencyId ?? -1) : -1
  } catch (e) {
    const err = toApiError(e)
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    previewGroupsLoading.value = false
  }
}

const loadPreview = async () => {
  previewLoading.value = true
  try {
    preview.value = await salesLeadService.getNoticePreview(
      previewDate.value || undefined,
      previewAgency.value === -1 ? null : previewAgency.value)
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    previewLoading.value = false
  }
}

onMounted(() => { load(); loadLog(); loadPreviewGroups() })
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
  gap: 0.75rem;
}

.ns-section {
  padding: 0.875rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.ns-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.625rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
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
  gap: 0.5rem 1rem;
  margin-bottom: 0.5rem;
}

.ns-check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 44px;
  font-size: 0.875rem;
  cursor: pointer;
}

.ns-check input {
  width: 18px;
  height: 18px;
}

.ns-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #475569;
}

.ns-field.grow {
  flex: 1 1 260px;
}

.ns-field .form-input {
  width: 100%;
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

.form-input.ns-select {
  min-width: 220px;
  max-width: 100%;
}

.form-input.ns-intro {
  resize: vertical;
  min-height: 60px;
}

.preview-wrap {
  margin-top: 0.5rem;
}

.preview-h {
  margin: 0.75rem 0 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.preview-sms {
  margin: 0;
  padding: 0.75rem;
  max-width: 420px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-mail {
  width: 100%;
  height: 560px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.ns-warn {
  color: #b45309;
  font-size: 0.8125rem;
}

.ns-hint {
  margin: 0 0 0.5rem;
}

.form-input.ns-filter {
  width: 100%;
  max-width: 360px;
  margin-bottom: 0.5rem;
}

.candidate-list {
  max-height: 320px;
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

.ns-log {
  margin-top: 0.75rem;
}

.table-scroll {
  overflow-x: auto;
}

.log-table {
  font-size: 0.8125rem;
  min-width: 720px;
}

.reason {
  max-width: 320px;
  color: #b91c1c;
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
}

.small {
  font-size: 0.75rem;
}
</style>
