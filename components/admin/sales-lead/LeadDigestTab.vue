<!--
  공모·낙찰 수집 — ② 아침 요약 (= 담당자 문자·메일 발송 묶음)
  - 선택한 날(첫 수집일)에 처음 받은 설계·공사 리드를 담당 대리점별로 묶어 보여준다
  - 담당 없음·권역 미지정은 «미배정» 묶음 (서버가 맨 뒤로 보낸다) — 수신자는 알림 설정의 리드파워 내부 사용자
  - 발송(V3.44.0, 2026-10-15): 설정한 시각에 자동, 또는 [요약 보내기]로 지금. 이미 보낸 리드는 다시 보내지 않는다
  - 카드마다 발송 상태(시각·문자·메일·실패)를 보여준다
-->
<template>
  <div class="digest-tab">
    <GuideNotice icon="fa-info-circle" tone="info" open-label="발송 규칙 자세히" class="digest-guide">
      <template #summary>
        매일 06:00 수집 후 <b>설정한 시각(기본 08:30)</b>에 대리점 직원에게 <b>문자·메일</b>로 보내는 묶음입니다. 이미 보낸 리드는 다시 보내지 않습니다.
      </template>
      <ul class="guide-list">
        <li>받는 사람: 대리점 소속 직원(사용 중 계정) 중 사용자관리에서 문자·메일 수신을 켠 사람. 미배정 묶음은 «알림 설정» 탭에서 고른 리드파워 담당자에게 갑니다.</li>
        <li>문자는 한 통(요약 + 화면 링크), 메일은 건별 표로 갑니다. 문구는 문자관리 › 메시지 템플릿(공모·낙찰 안내)에서 고칩니다.</li>
        <li>[요약 보내기]는 아직 안 보낸 리드만 보냅니다. 전부 보낸 날은 «다시 보내기»를 한 번 더 확인합니다.</li>
        <li>자동 발송은 «알림 설정»에서 켜고 끕니다. 발신번호·발신 메일도 거기서 봅니다.</li>
      </ul>
    </GuideNotice>

    <div class="digest-toolbar">
      <label class="toolbar-label">첫 수집일</label>
      <input v-model="date" type="date" class="form-input digest-date" @change="load">
      <button type="button" class="btn-action btn-secondary" :disabled="loading" @click="load">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 다시 보기
      </button>
      <GuardedButton
        v-if="canSend"
        type="button"
        class="btn-action btn-primary"
        :blocked="loading || groups.length === 0"
        reason="보낼 묶음이 없습니다. 날짜를 바꿔 보세요."
        :disabled="sending"
        @click="send"
      >
        <i :class="sending ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'" />
        {{ pendingTotal === 0 && groups.length > 0 ? '다시 보내기' : '요약 보내기' }}
      </GuardedButton>
      <span v-if="!loading && groups.length > 0" class="text-muted totals">
        대리점 {{ assignedCount }}곳 · 리드 {{ formatNumber(totalLeads) }}건
        <template v-if="pendingTotal > 0"> · <b class="pending">미발송 {{ formatNumber(pendingTotal) }}건</b></template>
        <template v-else> · 전부 발송됨</template>
      </span>
    </div>

    <div v-if="lastResult" class="send-result">
      <i class="fas fa-check-circle" />
      {{ lastResult.message }}
      <ul v-if="lastResult.notes?.length" class="result-notes">
        <li v-for="(n, i) in lastResult.notes" :key="i">{{ n }}</li>
      </ul>
    </div>

    <div v-if="loading" class="loading-message">
      <i class="fas fa-spinner fa-spin" />
      <p>요약을 만드는 중...</p>
    </div>
    <div v-else-if="groups.length === 0" class="no-data-message">
      <i class="fas fa-inbox" />
      <p>{{ date }} 에 처음 받은 설계·공사 리드가 없습니다.</p>
    </div>

    <div v-else class="digest-groups">
      <div
        v-for="group in groups"
        :key="group.agencyId ?? 'unassigned'"
        class="digest-card"
        :class="{ unassigned: group.agencyId === null, 'no-recipient': recipientTotal(group) === 0 }"
      >
        <div class="card-head">
          <div class="head-title">
            <template v-if="group.agencyId !== null">
              <strong>{{ group.agencyName || '-' }}</strong>
              <span v-if="group.agencyCode" class="text-muted">({{ group.agencyCode }})</span>
            </template>
            <strong v-else>미배정</strong>
            <!-- 발송 상태 (V3.44.0) -->
            <span v-if="group.noticeSentAt" class="notice-badge sent" :title="`마지막 발송 ${formatDateTime(group.noticeSentAt)}`">
              <i class="fas fa-paper-plane" /> {{ formatTime(group.noticeSentAt) }} 발송
              · 문자 {{ group.noticeSmsSuccess || 0 }} · 메일 {{ group.noticeEmailSuccess || 0 }}
            </span>
            <span v-else class="notice-badge none">미발송</span>
            <span v-if="(group.noticeFailed || 0) > 0" class="notice-badge failed" :title="group.noticeFailMessage || ''">
              <i class="fas fa-exclamation-circle" /> 실패 {{ group.noticeFailed }}
            </span>
            <span v-if="(group.noticeSkipped || 0) > 0" class="notice-badge skipped" title="발송 스위치가 꺼져 있어 보내지 않음">
              생략 {{ group.noticeSkipped }}
            </span>
          </div>
          <div class="head-meta">
            <span>받는 사람 문자 <strong>{{ group.smsRecipientCount || 0 }}</strong> · 메일 <strong>{{ group.emailRecipientCount || 0 }}</strong></span>
            <span>설계 <strong>{{ group.designCount }}</strong> · 공사 <strong>{{ group.constructionCount }}</strong></span>
            <span v-if="(group.pendingCount || 0) > 0" class="pending-count">미발송 <strong>{{ group.pendingCount }}</strong>건</span>
            <!-- 방치 = 미확인으로 7일 넘은 리드 (10월 2일 이후 받은 것부터) -->
            <span v-if="(group.staleCount || 0) > 0" class="stale-count">
              <i class="fas fa-hourglass-end" /> 방치 <strong>{{ formatNumber(group.staleCount || 0) }}</strong>건
            </span>
          </div>
        </div>

        <div v-if="group.agencyId === null" class="card-warn">
          <i class="fas fa-exclamation-triangle" />
          담당 대리점이 정해지지 않은 리드입니다. 담당판정확인 화면에서 수요기관 판정을 확인하세요.
          <template v-if="recipientTotal(group) === 0"> 받을 사람은 «알림 설정» 탭에서 미배정 수신자를 고르면 정해집니다.</template>
        </div>
        <div v-else-if="recipientTotal(group) === 0" class="card-warn">
          <i class="fas fa-exclamation-triangle" />
          받을 사람이 없습니다 — 소속 영업직원이 없거나 전원 수신을 껐거나 연락처가 비어 있습니다.
        </div>
        <div v-if="group.noticeFailMessage" class="card-warn fail">
          <i class="fas fa-exclamation-circle" /> {{ group.noticeFailMessage }}
        </div>

        <!-- 휴대폰: 카드 (표는 좁은 폭에서 글자가 한두 자씩 줄바꿈됐다 — 2026-10-14) -->
        <ul class="m-card-list m-narrow-only">
          <li v-for="lead in group.leads" :key="`c-${lead.leadId}`">
            <div class="m-card">
              <div class="m-card-head">
                <span class="m-card-title">
                  <i v-if="lead.notifiedAt" class="fas fa-paper-plane sent-icon" :title="`발송 ${formatDateTime(lead.notifiedAt)}`" />
                  {{ lead.title || '-' }}
                </span>
                <LeadKindBadge :kind="lead.projectKind || lead.leadKind" small />
              </div>
              <div v-if="lead.source === 'G2B_CONTRACT' && lead.awardLeadId" class="m-card-meta stage-note">
                계약 체결 <span class="text-muted">(낙찰 {{ lead.awardDate || '-' }})</span>
              </div>
              <div v-else-if="lead.contractCount" class="m-card-meta stage-note">
                낙찰 → 계약까지 <span class="text-muted">(계약 {{ lead.contractDate || '-' }})</span>
              </div>
              <div class="m-card-meta">
                {{ lead.dminsttNm || '-' }}
              </div>
              <div class="m-card-meta">
                {{ lead.winnerNm || '-' }} · {{ lead.amount === null || lead.amount === undefined ? '-' : formatNumber(lead.amount) + '원' }}
              </div>
            </div>
          </li>
        </ul>
        <table class="data-table digest-table m-wide-only">
          <thead>
            <tr>
              <th>종류</th>
              <th>사업명</th>
              <th>수요기관</th>
              <th>업체</th>
              <th>금액(원)</th>
              <th title="담당자에게 보낸 시각">발송</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in group.leads" :key="lead.leadId">
              <td>
                <LeadKindBadge :kind="lead.projectKind || lead.leadKind" />
              </td>
              <td class="text-left">
                {{ lead.title || '-' }}
                <!-- 예전에 받은 낙찰에 오늘 계약이 붙은 사업 = 단계 변화 / 같은 날 낙찰·계약 = 한 줄로 합침 -->
                <div v-if="lead.source === 'G2B_CONTRACT' && lead.awardLeadId" class="stage-note">
                  계약 체결 <span class="text-muted">(낙찰 {{ lead.awardDate || '-' }})</span>
                </div>
                <div v-else-if="lead.contractCount" class="stage-note">
                  낙찰 → 계약까지 <span class="text-muted">(계약 {{ lead.contractDate || '-' }})</span>
                </div>
              </td>
              <td class="text-left">
                {{ lead.dminsttNm || '-' }}
              </td>
              <td class="text-left">
                {{ lead.winnerNm || '-' }}
              </td>
              <td class="text-right nowrap">
                {{ lead.amount === null || lead.amount === undefined ? '-' : formatNumber(lead.amount) }}
              </td>
              <td class="nowrap">
                <span v-if="lead.notifiedAt" class="sent-icon" :title="formatDateTime(lead.notifiedAt)"><i class="fas fa-paper-plane" /> {{ formatTime(lead.notifiedAt) }}</span>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LeadKindBadge from '~/components/admin/sales-lead/LeadKindBadge.vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import GuardedButton from '~/components/ui/GuardedButton.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatNumber, formatDateTime, parseUtcDate } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { todayKst } from '~/types/agency'
import type { LeadDigestGroup, SalesLeadNoticeResult } from '~/types/sales-lead'

// canSend: [요약 보내기] — 리드파워 관리자만 (서버 /notices/** 도 같은 기준)
withDefaults(defineProps<{ canSend?: boolean }>(), { canSend: false })

const date = ref(todayKst())
const groups = ref<LeadDigestGroup[]>([])
const loading = ref(false)
const sending = ref(false)
const lastResult = ref<SalesLeadNoticeResult | null>(null)

const assignedCount = computed(() => groups.value.filter(g => g.agencyId !== null).length)
const totalLeads = computed(() => groups.value.reduce((sum, g) => sum + (g.leads?.length || 0), 0))
const pendingTotal = computed(() => groups.value.reduce((sum, g) => sum + (g.pendingCount || 0), 0))
const recipientTotal = (g: LeadDigestGroup) => (g.smsRecipientCount || 0) + (g.emailRecipientCount || 0)

/** 발송 시각 — 시:분만 (저장은 UTC, 표시는 KST) */
const formatTime = (iso: string) => {
  try {
    return parseUtcDate(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
  } catch {
    return ''
  }
}

const load = async () => {
  loading.value = true
  try {
    groups.value = await salesLeadService.digest(date.value || undefined) || []
  } catch (e) {
    const err = toApiError(e)
    // 세션 만료(401·403)는 로그인 화면으로 넘어가므로 목록 불러오기 실패 팝업을 띄우지 않는다
    if (err.status !== 401 && err.status !== 403) { alert(err.message) }
  } finally {
    loading.value = false
  }
}

/** 지금 보내기 — 안 보낸 리드만. 전부 보낸 날은 다시 보낼지 한 번 더 묻는다 */
const send = async () => {
  const force = pendingTotal.value === 0
  const msg = force
    ? `${date.value} 묶음은 이미 모두 보냈습니다.\n같은 내용을 담당자에게 다시 보낼까요? (문자·메일이 중복으로 갑니다)`
    : `${date.value} 아직 안 보낸 리드 ${pendingTotal.value}건을 담당자에게 문자·메일로 보냅니다.\n계속할까요?`
  if (!confirm(msg)) { return }
  sending.value = true
  lastResult.value = null
  try {
    lastResult.value = await salesLeadService.sendNotices(date.value || undefined, force)
    await load()
  } catch (e) {
    alert(toApiError(e).message)
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.digest-guide {
  margin-bottom: 0.75rem;
}

.guide-list {
  margin: 0.25rem 0 0;
  padding-left: 1.125rem;
  font-size: 0.8125rem;
  line-height: 1.6;
}

.digest-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.toolbar-label {
  font-weight: 600;
  font-size: 0.8125rem;
  color: #475569;
}

.form-input.digest-date {
  width: 160px;
}

.totals {
  font-size: 0.8125rem;
}

.totals .pending {
  color: #b45309;
}

.send-result {
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  font-size: 0.8125rem;
}

.result-notes {
  margin: 0.25rem 0 0;
  padding-left: 1.125rem;
  color: #92400e;
}

.digest-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.digest-card {
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  background: #fff;
}

.digest-card.no-recipient {
  border-left-color: #f59e0b;
}

.digest-card.unassigned {
  border-left-color: #94a3b8;
  background: #f8fafc;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.head-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  color: #0f172a;
}

.head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  font-size: 0.8125rem;
  color: #475569;
}

.notice-badge {
  padding: 0.0625rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.notice-badge.sent {
  background: #dcfce7;
  color: #166534;
}

.notice-badge.none {
  background: #f1f5f9;
  color: #64748b;
}

.notice-badge.failed {
  background: #fee2e2;
  color: #b91c1c;
}

.notice-badge.skipped {
  background: #fef3c7;
  color: #92400e;
}

.pending-count {
  color: #b45309;
}

.stale-count {
  padding: 0 0.375rem;
  border-radius: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
  font-weight: 600;
}

.card-warn {
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.8125rem;
}

.card-warn.fail {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.digest-table {
  font-size: 0.8125rem;
}

.stage-note {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #166534;
}

.sent-icon {
  color: #16a34a;
  font-size: 0.75rem;
}

.nowrap {
  white-space: nowrap;
}
</style>
