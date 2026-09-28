<!--
  공모·낙찰 수집 — ② 아침 요약 미리보기
  - 선택한 날(첫 수집일)에 처음 받은 설계·공사 리드를 담당 대리점별로 묶어 보여준다
  - 담당 없음·권역 미지정은 «미배정» 묶음 (서버가 맨 뒤로 보낸다)
  - 발송(알림톡·문자)은 다음 단계 — 여기서는 보기만 한다
-->
<template>
  <div class="digest-tab">
    <div class="digest-note">
      <i class="fas fa-info-circle" />
      매일 06:00 수집 후 08:30 영업직원에게 발송될 내용의 미리보기입니다. 발송(알림톡·문자)은 다음 단계에서 연결됩니다.
    </div>

    <div class="digest-toolbar">
      <label class="toolbar-label">첫 수집일</label>
      <input v-model="date" type="date" class="form-input digest-date" @change="load">
      <button type="button" class="btn-action btn-secondary" :disabled="loading" @click="load">
        <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'" /> 다시 보기
      </button>
      <span v-if="!loading && groups.length > 0" class="text-muted totals">
        대리점 {{ assignedCount }}곳 · 리드 {{ formatNumber(totalLeads) }}건
      </span>
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
        :class="{ unassigned: group.agencyId === null, 'no-recipient': group.agencyId !== null && group.recipientCount === 0 }"
      >
        <div class="card-head">
          <div class="head-title">
            <template v-if="group.agencyId !== null">
              <strong>{{ group.agencyName || '-' }}</strong>
              <span v-if="group.agencyCode" class="text-muted">({{ group.agencyCode }})</span>
            </template>
            <strong v-else>미배정</strong>
          </div>
          <div class="head-meta">
            <span v-if="group.agencyId !== null">받는 사람 <strong>{{ group.recipientCount }}</strong>명</span>
            <span>설계 <strong>{{ group.designCount }}</strong> · 공사 <strong>{{ group.constructionCount }}</strong></span>
          </div>
        </div>

        <div v-if="group.agencyId === null" class="card-warn">
          <i class="fas fa-exclamation-triangle" />
          담당 대리점이 정해지지 않은 리드입니다. 담당판정확인 화면에서 수요기관 판정을 확인하세요.
        </div>
        <div v-else-if="group.recipientCount === 0" class="card-warn">
          <i class="fas fa-exclamation-triangle" />
          소속 영업직원이 없어 받을 사람이 없습니다.
        </div>

        <table class="data-table digest-table">
          <thead>
            <tr>
              <th>종류</th>
              <th>사업명</th>
              <th>수요기관</th>
              <th>업체</th>
              <th>금액(원)</th>
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
import { salesLeadService } from '~/services/sales-lead.service'
import { formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { todayKst } from '~/types/agency'
import type { LeadDigestGroup } from '~/types/sales-lead'

const date = ref(todayKst())
const groups = ref<LeadDigestGroup[]>([])
const loading = ref(false)

const assignedCount = computed(() => groups.value.filter(g => g.agencyId !== null).length)
const totalLeads = computed(() => groups.value.reduce((sum, g) => sum + (g.leads?.length || 0), 0))

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

onMounted(load)
</script>

<style scoped>
.digest-note {
  padding: 0.625rem 0.875rem;
  margin-bottom: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #1e3a8a;
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
  gap: 0.375rem;
  color: #0f172a;
}

.head-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8125rem;
  color: #475569;
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

.digest-table {
  font-size: 0.8125rem;
}

.stage-note {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #166534;
}

.nowrap {
  white-space: nowrap;
}
</style>
