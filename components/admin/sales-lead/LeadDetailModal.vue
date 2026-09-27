<!--
  영업 리드 상세 모달
  - 사업 / 수요기관 / 업체 / 분류 보강 / 판별 근거 / 설계사무소 연결 / 담당 판정 으로 묶어 보여준다
  - 원천 응답(rawJson)은 접어 둔다 — 필드 해석이 의심스러울 때 펼쳐서 확인
-->
<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content lead-modal">
        <div class="modal-header">
          <h3>수집 상세 — {{ lead?.title || summary?.title || '영업 리드' }}</h3>
          <button type="button" class="modal-close" @click="emit('close')">
            <i class="fas fa-times" />
          </button>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-message">
            <i class="fas fa-spinner fa-spin" />
            <p>불러오는 중...</p>
          </div>
          <div v-else-if="errorMessage" class="no-data-message">
            <i class="fas fa-exclamation-circle" />
            <p>{{ errorMessage }}</p>
          </div>

          <template v-else-if="lead">
            <div class="head-badges">
              <LeadKindBadge :kind="lead.leadKind" />
              <span class="status-badge info">{{ codeLabel(LEAD_SOURCE_LABELS, lead.source) }}</span>
              <span class="status-badge primary">{{ codeLabel(LEAD_BIZ_TYPE_LABELS, lead.bizType) }}</span>
              <span class="status-badge" :class="resolveStatusBadge(lead.resolveStatus)">
                {{ codeLabel(RESOLVE_STATUS_LABELS, lead.resolveStatus) }}
              </span>
            </div>

            <section class="detail-section">
              <h4>사업</h4>
              <dl class="detail-grid">
                <dt>사업명</dt>
                <dd>{{ lead.title || '-' }}</dd>
                <dt>{{ lead.source === 'G2B_CONTRACT' ? '계약번호' : '공고번호' }}</dt>
                <dd>
                  {{ lead.refNo || '-' }}
                  <span v-if="lead.refOrd" class="text-muted">-{{ lead.refOrd }}</span>
                  <span v-if="lead.refClsfc || lead.refRbid" class="text-muted small">
                    (분류 {{ lead.refClsfc || '-' }} · 재입찰 {{ lead.refRbid || '-' }})
                  </span>
                </dd>
                <dt>금액</dt>
                <dd>{{ formatAmount(lead.amount) }}</dd>
                <dt>{{ lead.source === 'G2B_CONTRACT' ? '계약일' : '낙찰일' }}</dt>
                <dd>{{ lead.eventDate || '-' }}</dd>
                <dt>원천 등록일시</dt>
                <dd>{{ formatDateTime(lead.sourceRgstDt) }}</dd>
                <dt>첫 수집일</dt>
                <dd>{{ lead.firstSeenDate || '-' }}</dd>
                <dt>마지막 갱신</dt>
                <dd>{{ formatDateTime(lead.updatedAt) }}</dd>
              </dl>
            </section>

            <section class="detail-section">
              <h4>수요기관</h4>
              <dl class="detail-grid">
                <dt>수요기관</dt>
                <dd>
                  {{ lead.dminsttNm || '-' }}
                  <span v-if="lead.dminsttCd" class="text-muted">({{ lead.dminsttCd }})</span>
                </dd>
                <dt>공사현장지역</dt>
                <dd>{{ lead.siteRegionNm || '-' }}</dd>
              </dl>
            </section>

            <section class="detail-section">
              <h4>{{ lead.source === 'G2B_CONTRACT' ? '계약업체' : '낙찰업체' }}</h4>
              <dl class="detail-grid">
                <dt>업체명</dt>
                <dd>{{ lead.winnerNm || '-' }}</dd>
                <dt>사업자번호</dt>
                <dd>{{ formatBizno(lead.winnerBizno) }}</dd>
                <dt>대표자</dt>
                <dd>{{ lead.winnerCeo || '-' }}</dd>
                <dt>주소</dt>
                <dd>{{ lead.winnerAddr || '-' }}</dd>
                <dt>전화</dt>
                <dd>{{ lead.winnerTel || '-' }}</dd>
              </dl>
            </section>

            <section class="detail-section">
              <h4>분류 보강 <span class="text-muted small">(입찰공고)</span></h4>
              <dl class="detail-grid">
                <dt>보강 여부</dt>
                <dd>{{ codeLabel(LEAD_ENRICHED_LABELS, lead.enriched) }}</dd>
                <dt>공공조달분류</dt>
                <dd>{{ lead.clsfcNm || '-' }}</dd>
                <dt>용역구분</dt>
                <dd>{{ lead.srvceDivNm || '-' }}</dd>
                <dt>주공종</dt>
                <dd>{{ lead.mainCnsttyNm || '-' }}</dd>
              </dl>
            </section>

            <section class="detail-section">
              <h4>판별 근거</h4>
              <div class="note-box">
                <LeadKindBadge :kind="lead.leadKind" />
                <span>{{ lead.kindReason || '-' }}</span>
              </div>
            </section>

            <section class="detail-section">
              <h4>설계사무소 연결 결과</h4>
              <dl class="detail-grid">
                <dt>설계사무소</dt>
                <dd>
                  <NuxtLink v-if="lead.designOfficeId" to="/admin/design-office/list" class="link">
                    {{ lead.designOfficeName || `#${lead.designOfficeId}` }}
                  </NuxtLink>
                  <span v-else class="text-muted">연결 없음</span>
                </dd>
                <dt>연결 메모</dt>
                <dd class="pre">
                  {{ lead.officeNote || '-' }}
                </dd>
              </dl>
            </section>

            <section class="detail-section">
              <h4>담당 판정</h4>
              <dl class="detail-grid">
                <dt>상태</dt>
                <dd>
                  <span class="status-badge" :class="resolveStatusBadge(lead.resolveStatus)">
                    {{ codeLabel(RESOLVE_STATUS_LABELS, lead.resolveStatus) }}
                  </span>
                </dd>
                <dt>담당 대리점</dt>
                <dd>
                  <template v-if="lead.agencyId">
                    <NuxtLink :to="`/admin/agency/edit/${lead.agencyId}`" class="link">
                      {{ lead.agencyName || `#${lead.agencyId}` }}
                    </NuxtLink>
                    <span v-if="lead.agencyCode" class="text-muted">({{ lead.agencyCode }})</span>
                  </template>
                  <span v-else class="text-muted">없음</span>
                </dd>
                <dt>권역</dt>
                <dd>{{ lead.regionName || '-' }}</dd>
                <dt>판정 근거</dt>
                <dd class="pre">
                  {{ lead.resolveNote || '-' }}
                </dd>
                <dt>판정 시각</dt>
                <dd>{{ formatDateTime(lead.resolvedAt) }}</dd>
              </dl>
            </section>

            <details class="raw-block">
              <summary>원천 응답 (나라장터 API 원본)</summary>
              <pre>{{ prettyRaw }}</pre>
            </details>
          </template>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-primary" @click="emit('close')">
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LeadKindBadge from '~/components/admin/sales-lead/LeadKindBadge.vue'
import { salesLeadService } from '~/services/sales-lead.service'
import { formatDateTime, formatNumber } from '~/utils/format'
import { toApiError } from '~/utils/api-error'
import { RESOLVE_STATUS_LABELS, codeLabel, resolveStatusBadge } from '~/types/agency'
import {
  LEAD_BIZ_TYPE_LABELS,
  LEAD_ENRICHED_LABELS,
  LEAD_SOURCE_LABELS,
  formatBizno,
  type SalesLead
} from '~/types/sales-lead'

const props = defineProps<{
  leadId: number
  /** 목록 행 — 상세를 받기 전 제목 표시용 */
  summary?: SalesLead | null
}>()

const emit = defineEmits<{ close: [] }>()

const lead = ref<SalesLead | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const formatAmount = (amount?: number | null) =>
  amount === null || amount === undefined ? '-' : `${formatNumber(amount)}원`

/** 원천 응답 JSON 을 보기 좋게 — JSON 이 아니면 그대로 */
const prettyRaw = computed(() => {
  const raw = lead.value?.rawJson
  if (!raw) { return '(원천 응답 없음)' }
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
})

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    lead.value = await salesLeadService.get(props.leadId)
  } catch (e) {
    errorMessage.value = toApiError(e).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.lead-modal {
  max-width: 820px;
}

.head-badges {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.detail-section {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.detail-section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.375rem 0.75rem;
  margin: 0;
  font-size: 0.8125rem;
}

.detail-grid dt {
  color: #64748b;
  font-weight: 600;
}

.detail-grid dd {
  margin: 0;
  color: #1e293b;
  word-break: break-all;
}

.pre {
  white-space: pre-wrap;
}

.small {
  font-size: 0.75rem;
}

.note-box {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #334155;
  white-space: pre-wrap;
}

.raw-block summary {
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
}

.raw-block pre {
  max-height: 360px;
  overflow: auto;
  margin: 0.5rem 0 0;
  padding: 0.75rem;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.5;
}

.link {
  color: #2563eb;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
