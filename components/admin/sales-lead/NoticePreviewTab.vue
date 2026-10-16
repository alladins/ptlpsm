<!--
  공모·낙찰 수집 — ⑥ 미리보기·기록 (담당자 문자·메일 발송, V3.45.0 · 2026-10-16)
  - 미리보기: 기준일·받는 묶음을 골라 실제 조립 규칙으로 만든 문자 본문·메일 HTML 을 보여 준다 (보내지 않음, 저장된 알림 설정 기준)
  - 발송 기록: 날짜별 수신자·채널 단위 결과
  - 알림 설정 탭에 같이 있던 것을 분리 (사용자 요청 10-16: 설정 폼은 저장 버튼까지, 보기 전용은 옆 탭)
  - 리드파워 관리자만 (서버 /notices/** 도 같은 기준)
-->
<template>
  <div class="notice-preview-tab">
    <!-- 미리보기 — 묶음 하나를 실제 조립 규칙으로 (보내지 않음) -->
    <section class="ns-section">
      <h3 class="ns-title">
        <i class="fas fa-eye" /> 미리보기 <small class="text-muted">(보내지 않습니다 · 저장한 알림 설정 기준)</small>
      </h3>
      <div class="ns-row">
        <label class="ns-field">
          <span>기준일 (첫 수집일)</span>
          <input v-model="previewDate" type="date" class="form-input ns-date" @change="loadPreviewGroups">
        </label>
        <label class="ns-field grow">
          <span>받는 묶음 <small class="text-muted">(담당 대리점별 · 미배정)</small></span>
          <select v-model="previewAgency" class="form-input ns-select" :disabled="previewGroups.length === 0">
            <option v-if="previewGroups.length === 0" :value="-1" disabled>
              {{ previewGroupsLoading ? '묶음을 불러오는 중…' : '이 날짜에 보낼 묶음이 없습니다 — 기준일을 바꿔 보세요' }}
            </option>
            <option v-for="g in previewGroups" :key="g.agencyId ?? 'none'" :value="g.agencyId ?? -1">
              {{ g.agencyId === null ? '미배정 (리드파워 내부 수신자)' : `대리점 ${g.agencyName || g.agencyCode}` }} · 리드 {{ g.leads.length }}건
            </option>
          </select>
        </label>
        <button type="button" class="btn-action btn-secondary" :disabled="previewLoading || previewGroups.length === 0" @click="loadPreview">
          <i :class="previewLoading ? 'fas fa-spinner fa-spin' : 'fas fa-eye'" /> 미리보기
        </button>
      </div>
      <p class="text-muted small ns-hint">
        기준일에 처음 받은 설계·공사 리드를 담당 대리점별로 묶은 것(아침 요약 탭과 같음) 중 하나를 골라, 그 묶음이 받을 문자·메일을 그대로 보여 줍니다. 문구·하한은 알림 설정 탭에서 바꾼 뒤 저장해야 반영됩니다.
      </p>
      <div v-if="preview" class="preview-wrap">
        <p class="text-muted small">
          {{ preview.agencyName }} · 본문 {{ preview.leadCount }}건
          <template v-if="preview.excludedCount">
            · 하한 미만 {{ preview.excludedCount }}건 제외
          </template>
          <template v-if="preview.alreadySentCount">
            · 이미 보낸 {{ preview.alreadySentCount }}건 포함
          </template>
          · 받는 사람 {{ preview.recipients.length }}명
        </p>
        <p v-if="preview.note" class="ns-warn">
          <i class="fas fa-info-circle" /> {{ preview.note }}
        </p>
        <template v-if="preview.smsText">
          <h4 class="preview-h">
            문자 <small class="text-muted">{{ preview.smsBytes.toLocaleString() }} / 2,000 byte</small>
          </h4>
          <pre class="preview-sms">{{ preview.smsText }}</pre>
        </template>
        <template v-if="preview.mailHtml">
          <h4 class="preview-h">
            메일 <small class="text-muted">{{ preview.mailSubject }}</small>
          </h4>
          <iframe class="preview-mail" :srcdoc="preview.mailHtml" sandbox="" title="메일 미리보기" />
        </template>
      </div>
    </section>

    <!-- 발송 기록 -->
    <section class="ns-section ns-log">
      <h3 class="ns-title">
        <i class="fas fa-history" /> 발송 기록
      </h3>
      <div class="ns-row">
        <input v-model="logDate" type="date" class="form-input ns-date" @change="loadLog">
        <button type="button" class="btn-action btn-secondary" :disabled="logLoading" @click="loadLog">
          <i :class="logLoading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 조회
        </button>
        <span v-if="!logLoading" class="text-muted small">
          {{ notices.length }}건 · 성공 {{ countBy('SUCCESS') }} · 실패 {{ countBy('FAILED') }} · 생략 {{ countBy('SKIPPED') }}
        </span>
      </div>
      <p v-if="!logLoading && notices.length === 0" class="text-muted small">
        {{ logDate }} 발송 기록이 없습니다.
      </p>
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
              <td class="nowrap">
                {{ formatDateTime(n.createdAt) }}
              </td>
              <td class="nowrap">
                {{ n.agencyId === null ? '미배정' : agencyLabel(n.agencyId) }}
              </td>
              <td class="nowrap">
                {{ n.channel === 'SMS' ? '문자' : '메일' }}
              </td>
              <td class="nowrap">
                {{ n.userName || n.userId }} <small class="text-muted">{{ n.recipient }}</small>
              </td>
              <td class="text-right">
                {{ n.leadCount }}
              </td>
              <td class="nowrap">
                <span class="status-badge" :class="n.status === 'SUCCESS' ? 'success' : n.status === 'FAILED' ? 'danger' : 'warning'">
                  {{ n.status === 'SUCCESS' ? '성공' : n.status === 'FAILED' ? '실패' : '생략' }}
                </span>
                <small class="text-muted">{{ n.triggerType === 'SCHEDULE' ? '자동' : '수동' }}</small>
              </td>
              <td class="reason">
                {{ n.errorMessage || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatDateTime } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { todayKst } from '~/types/agency'
import type { LeadDigestGroup, SalesLeadNotice, SalesLeadNoticePreview } from '~/types/sales-lead'

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

onMounted(() => { loadPreviewGroups(); loadLog() })
</script>

<style scoped>
.notice-preview-tab {
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

.ns-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem 1rem;
  margin-bottom: 0.5rem;
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

.form-input.ns-date {
  width: 160px;
}

.form-input.ns-select {
  min-width: 220px;
  max-width: 100%;
}

.ns-hint {
  margin: 0 0 0.5rem;
}

.ns-warn {
  color: #b45309;
  font-size: 0.8125rem;
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
