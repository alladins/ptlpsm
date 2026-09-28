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
              <span v-if="leadStage(lead) === 'AWARD_CONTRACT'" class="status-badge success">낙찰 → 계약</span>
              <span class="status-badge primary">{{ codeLabel(LEAD_BIZ_TYPE_LABELS, lead.bizType) }}</span>
              <span class="status-badge" :class="resolveStatusBadge(lead.resolveStatus)">
                {{ codeLabel(RESOLVE_STATUS_LABELS, lead.resolveStatus) }}
              </span>
            </div>

            <!-- 한눈에 보기 — 누가 누구와 얼마에 무엇을 했는지 한 문장으로 -->
            <div class="summary-box">
              <p class="summary-text">
                {{ summaryText }}
              </p>
              <a v-if="g2bUrl" :href="g2bUrl" target="_blank" rel="noopener noreferrer" class="g2b-link">
                <i class="fas fa-external-link-alt" /> 나라장터에서 원문 보기
              </a>
            </div>

            <!-- 계약 내용 (계약 응답 원천 필드) -->
            <section v-if="lead.source === 'G2B_CONTRACT'" class="detail-section">
              <h4>계약 내용</h4>
              <dl class="detail-grid">
                <dt>계약 방법</dt>
                <dd>{{ raw.cntrctCnclsMthdNm || '-' }}<span v-if="raw.baseLawNm" class="text-muted small"> · {{ raw.baseLawNm }}</span></dd>
                <dt>계약 기간</dt>
                <dd>
                  {{ raw.wbgnDate || '-' }} ~ {{ raw.ttalScmpltDate || raw.thtmScmpltDate || '-' }}
                  <span v-if="raw.cntrctPrd" class="text-muted small">({{ raw.cntrctPrd }})</span>
                </dd>
                <dt>업무 분류</dt>
                <dd>{{ clsfcPath || '-' }}</dd>
                <dt>발주 담당</dt>
                <dd>{{ ofclText || '-' }}</dd>
              </dl>
            </section>

            <!-- 낙찰 내용 (낙찰 응답 원천 필드) -->
            <section v-else class="detail-section">
              <h4>낙찰 내용</h4>
              <dl class="detail-grid">
                <dt>개찰 일시</dt>
                <dd>{{ raw.rlOpengDt || '-' }}</dd>
                <dt>최종 낙찰일</dt>
                <dd>{{ raw.fnlSucsfDate || '-' }}</dd>
                <dt>참가 업체</dt>
                <dd>{{ raw.prtcptCnum ? `${raw.prtcptCnum}개사` : '-' }}</dd>
                <dt>낙찰률</dt>
                <dd>{{ raw.sucsfbidRate ? `${raw.sucsfbidRate}%` : '-' }}</dd>
              </dl>
            </section>

            <!-- 참여 업체 (공동도급이면 업체별 지분) -->
            <section v-if="corps.length > 1" class="detail-section">
              <h4>참여 업체 <span class="text-muted small">(공동도급 {{ corps.length }}곳)</span></h4>
              <table class="data-table linked-table">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>업체</th>
                    <th>대표자</th>
                    <th>사업자번호</th>
                    <th>지분</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in corps" :key="`${c.bizno}-${c.name}`">
                    <td class="nowrap">
                      {{ c.div || '-' }}
                    </td>
                    <td class="text-left">
                      {{ c.name || '-' }}
                    </td>
                    <td>{{ c.ceo || '-' }}</td>
                    <td class="nowrap">
                      {{ formatBizno(c.bizno) }}
                    </td>
                    <td class="nowrap">
                      {{ c.share ? `${c.share}%` : '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="detail-section">
              <h4>사업</h4>
              <dl class="detail-grid">
                <dt>사업명</dt>
                <dd>{{ lead.title || '-' }}</dd>
                <template v-if="lead.source === 'G2B_CONTRACT' && lead.ntceNo">
                  <dt>공고번호</dt>
                  <dd>{{ lead.ntceNo }}</dd>
                </template>
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

            <!-- 같은 사업의 낙찰·계약 (공고번호로 이어짐) — 누르면 그 행 상세로 바뀐다 -->
            <section v-if="lead.linkedLeads && lead.linkedLeads.length > 0" class="detail-section">
              <h4>같은 사업의 {{ lead.source === 'G2B_AWARD' ? '계약' : '낙찰·계약' }} <span class="text-muted small">(공고번호로 이어짐)</span></h4>
              <table class="data-table linked-table">
                <thead>
                  <tr>
                    <th>단계</th>
                    <th>번호</th>
                    <th>업체</th>
                    <th>금액(원)</th>
                    <th>일자</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in lead.linkedLeads" :key="l.leadId" class="clickable-row" @click="openLinked(l.leadId)">
                    <td class="nowrap">
                      {{ codeLabel(LEAD_SOURCE_LABELS, l.source) }}
                    </td>
                    <td class="nowrap">
                      {{ l.refNo }}
                    </td>
                    <td class="text-left">
                      {{ l.winnerNm || '-' }}
                      <span v-if="l.winnerBizno && l.winnerBizno !== lead.winnerBizno" class="text-muted small">(다른 업체 — 공동도급 등)</span>
                    </td>
                    <td class="text-right nowrap">
                      {{ l.amount === null || l.amount === undefined ? '-' : formatNumber(l.amount) }}
                    </td>
                    <td class="nowrap">
                      {{ l.eventDate || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
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
                <!-- 계약 응답에는 업체 주소·전화가 없다 → 연결된 설계사무소(나라장터 업체정보로 채움) 값을 대신 보여준다 -->
                <dt>주소</dt>
                <dd>
                  {{ lead.winnerAddr || lead.designOfficeAddress || '-' }}
                  <span v-if="!lead.winnerAddr && lead.designOfficeAddress" class="text-muted small">(설계사무소 정보)</span>
                </dd>
                <dt>전화</dt>
                <dd>
                  {{ lead.winnerTel || lead.designOfficeTel || '-' }}
                  <span v-if="!lead.winnerTel && lead.designOfficeTel" class="text-muted small">(설계사무소 정보)</span>
                </dd>
              </dl>
            </section>

            <!-- 입찰공고 보강은 낙찰에만 한다 (계약은 공공조달분류가 응답에 들어 있어 «계약 내용»에 보인다) -->
            <section v-if="lead.source === 'G2B_AWARD'" class="detail-section">
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
                  <NuxtLink v-if="lead.designOfficeId" :to="`/admin/design-office/list?id=${lead.designOfficeId}`" class="link">
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
  leadStage,
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

/** 원천 응답 한 건 (필드명 그대로) — 파싱 실패면 빈 객체 */
const raw = computed<Record<string, string>>(() => {
  const s = lead.value?.rawJson
  if (!s) { return {} }
  try {
    const o = JSON.parse(s)
    return o && typeof o === 'object' ? o as Record<string, string> : {}
  } catch {
    return {}
  }
})

/** 나라장터 계약 상세 원문 (https 만) */
const g2bUrl = computed(() => {
  const u = raw.value.cntrctDtlInfoUrl
  return u && /^https:\/\//.test(u) ? u : ''
})

/** 공공조달분류 대 › 중 › 소 */
const clsfcPath = computed(() =>
  [raw.value.pubPrcrmntLrgClsfcNm, raw.value.pubPrcrmntMidClsfcNm, raw.value.pubPrcrmntClsfcNm]
    .filter(Boolean).join(' › '))

/** 발주 담당 — 계약기관 · 부서 · 담당자 · 전화 */
const ofclText = computed(() =>
  [raw.value.cntrctInsttNm, raw.value.cntrctInsttChrgDeptNm, raw.value.cntrctInsttOfclNm, raw.value.cntrctInsttOfclTelNo]
    .filter(Boolean).join(' · '))

interface Corp { div: string, name: string, ceo: string, share: string, bizno: string }

/**
 * 계약 참여 업체 — corpList «[순번^업체구분^공동도급방식^업체명^대표자^국적^지분율^채권자^담당자^사업자번호],[...]»
 * 항목 경계는 «][» 와 «],[» 둘 다 온다 (백엔드 LeadRowFactory.parseBracketList 와 같은 규칙)
 */
const corps = computed<Corp[]>(() => {
  const s = (raw.value.corpList || '').trim()
  if (!s) { return [] }
  return s.replace(/^\[/, '').replace(/\]$/, '').split(/\]\s*,?\s*\[/).map((seg) => {
    const a = seg.split('^')
    return { div: a[1] || '', name: a[3] || '', ceo: a[4] || '', share: a[6] || '', bizno: (a[9] || '').replace(/[^0-9]/g, '') }
  })
})

/** 한 문장 요약 — 누가(수요기관) 누구와(업체) 얼마에 무엇을 */
const summaryText = computed(() => {
  const l = lead.value
  if (!l) { return '' }
  const org = l.dminsttNm || '수요기관 미상'
  const corp = l.winnerNm || '업체 미상'
  const amt = formatAmount(l.amount)
  const title = l.title ? `«${l.title}»` : '이 사업'
  if (l.source === 'G2B_CONTRACT') {
    const how = raw.value.cntrctCnclsMthdNm || '계약'
    const period = raw.value.wbgnDate ? `, ${raw.value.wbgnDate} 착수` : ''
    const joint = corps.value.length > 1 ? ` (공동도급 ${corps.value.length}곳)` : ''
    return `${org}이(가) ${title}을(를) ${corp}${joint}와(과) ${amt}에 ${how}했습니다${period}.`
  }
  const rate = raw.value.sucsfbidRate ? ` (낙찰률 ${raw.value.sucsfbidRate}%` + (raw.value.prtcptCnum ? `, ${raw.value.prtcptCnum}개사 참가)` : ')') : ''
  return `${org}이(가) 공고한 ${title}을(를) ${corp}이(가) ${amt}에 낙찰받았습니다${rate}.`
})

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

/** 보고 있는 리드 — 같은 사업의 낙찰·계약을 누르면 바뀐다 */
const currentId = ref(props.leadId)

const openLinked = (leadId: number) => {
  currentId.value = leadId
  load()
}

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    lead.value = await salesLeadService.get(currentId.value)
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

.summary-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.summary-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #1e3a8a;
  word-break: keep-all;
}

.g2b-link {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  white-space: nowrap;
}

.g2b-link:hover {
  text-decoration: underline;
}

.linked-table {
  font-size: 0.8125rem;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover td {
  background: #f8fafc;
}

.nowrap {
  white-space: nowrap;
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
