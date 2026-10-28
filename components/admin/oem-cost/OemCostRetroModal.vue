<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container retro-modal">
          <!-- 헤더 -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <i class="fas fa-history" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  원가 소급
                </h2>
                <span class="ccm-modal-subtitle">이미 등록된 발주·출하 원가를 원가표대로 맞춥니다</span>
              </div>
            </div>
            <button class="ccm-close-button" :disabled="isBusy" @click="handleClose">
              <i class="fas fa-times" />
            </button>
          </div>

          <!-- 탭 -->
          <div class="retro-tabs">
            <button :class="['retro-tab', { active: tab === 'retro' }]" :disabled="isBusy" @click="tab = 'retro'">
              소급하기
            </button>
            <button :class="['retro-tab', { active: tab === 'runs' }]" :disabled="isBusy" @click="openRunsTab">
              소급 기록
            </button>
          </div>

          <div class="ccm-modal-body">
            <!-- ==================== 소급하기 ==================== -->
            <template v-if="tab === 'retro'">
              <GuideNotice icon="fa-info-circle" open-label="어떻게 동작하나요?">
                <template #summary>
                  원가표를 바꿔도 <b>이미 등록된 발주·출하 원가는 자동으로 바뀌지 않습니다.</b> 여기서 원가표와 다른 발주를 찾아 한 번에 맞춥니다.
                </template>
                <ul class="retro-guide-list">
                  <li>발주일 기준 원가표 단가와 다르게 등록된 발주 품목만 목록에 나옵니다. 일부러 다른 단가로 발주한 건은 체크를 해제하세요.</li>
                  <li>적용하면 발주서 단가·금액, 재고 출고 원가, 출하 원가, 기성청구 OEM 지급 예정액, 기성 차수 원가가 함께 바뀝니다. 원가표 자체는 바꾸지 않습니다.</li>
                  <li>한 출하에 다른 발주 물량이 섞여 있으면 출하 원가는 물량 비율대로 평균을 냅니다. 월별 매출원장은 발주서 단가 그대로입니다.</li>
                  <li>제조사 지급이 완료된 달은 소급할 수 없습니다. 지급 요청 중인 달은 소급 후 요청을 반려하고 다시 요청하세요.</li>
                  <li>적용 후 [소급 기록] 탭에서 되돌릴 수 있습니다.</li>
                </ul>
              </GuideNotice>

              <!-- 조건 -->
              <div class="retro-filter">
                <label class="retro-field">
                  <span>제조사</span>
                  <select v-model.number="form.oemCompanyId" :disabled="isBusy" @change="resetCandidates">
                    <option :value="0" disabled>선택하세요</option>
                    <option v-for="c in oemCompanies" :key="c.id" :value="c.id">
                      {{ c.companyName }}
                    </option>
                  </select>
                </label>
                <label class="retro-field">
                  <span>발주일 시작</span>
                  <input v-model="form.from" type="date" :disabled="isBusy" @change="resetCandidates">
                </label>
                <label class="retro-field">
                  <span>발주일 끝</span>
                  <input v-model="form.to" type="date" :disabled="isBusy" @change="resetCandidates">
                </label>
                <div v-if="form.skuId" class="retro-field">
                  <span>품목</span>
                  <div class="retro-sku-chip">
                    {{ skuLabel || form.skuId }}
                    <button title="전체 품목으로" :disabled="isBusy" @click="clearSku">
                      <i class="fas fa-times" />
                    </button>
                  </div>
                </div>
                <button class="btn-primary retro-search-btn" :disabled="isBusy || !form.oemCompanyId" @click="loadCandidates">
                  <i :class="isLoading ? 'fas fa-spinner fa-spin' : 'fas fa-search'" />
                  대상 찾기
                </button>
              </div>

              <div v-if="errorMessage" class="retro-error">
                <i class="fas fa-exclamation-circle" /> {{ errorMessage }}
              </div>

              <!-- 적용 완료 -->
              <div v-if="appliedResult" class="retro-done">
                <i class="fas fa-check-circle" />
                <div>
                  <b>소급을 적용했습니다</b> (기록 번호 {{ appliedResult.runId }}) —
                  발주 품목 {{ appliedResult.poItems.length }}건, 출하 {{ appliedResult.shipments.length }}건,
                  기성청구 {{ appliedResult.funds.length }}건, 기성 차수 {{ appliedResult.baselines.length }}건
                  <div v-for="l in appliedResult.ledgers" :key="l.yearMonth" class="retro-done-ledger">
                    {{ l.yearMonth }} 월별 매출원장 {{ formatNumber(l.before) }} → {{ formatNumber(l.after) }}
                    (<span :class="signClass(l.diff)">{{ signed(l.diff) }}</span>)
                  </div>
                  <div v-if="appliedResult.regeneratedPdfs.length" class="retro-done-ledger">
                    발주서 PDF 다시 만듦: {{ appliedResult.regeneratedPdfs.join(', ') }}
                  </div>
                  <ul v-if="appliedResult.warnings.length" class="retro-warn-list">
                    <li v-for="w in appliedResult.warnings" :key="w">{{ w }}</li>
                  </ul>
                </div>
              </div>

              <!-- 후보 목록 -->
              <template v-if="searched">
                <div v-if="candidates.length === 0" class="retro-empty">
                  <i class="fas fa-check" /> 원가표와 다른 발주가 없습니다. 소급할 것이 없습니다.
                </div>
                <template v-else>
                  <div class="retro-summary">
                    <label class="retro-check-all">
                      <input type="checkbox" :checked="allChecked" :disabled="isBusy" @change="toggleAll">
                      전체 선택
                    </label>
                    <span>선택 <b>{{ selectedIds.size }}</b> / {{ candidates.length }}건 · 발주 금액 차이
                      <b :class="signClass(selectedDiff)">{{ signed(selectedDiff) }}</b></span>
                  </div>
                  <div class="retro-table-wrap">
                    <table class="retro-table">
                      <thead>
                        <tr>
                          <th />
                          <th>발주서</th>
                          <th>발주일</th>
                          <th>품목</th>
                          <th class="num">
                            수량
                          </th>
                          <th class="num">
                            현재 단가 → 원가표
                          </th>
                          <th class="num">
                            금액 차이
                          </th>
                          <th>비고</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="c in candidates" :key="c.poiId" :class="{ blocked: !c.selectable }">
                          <td data-label="선택">
                            <input
                              type="checkbox"
                              :checked="selectedIds.has(c.poiId)"
                              :disabled="!c.selectable || isBusy"
                              @change="toggleOne(c.poiId)"
                            >
                          </td>
                          <td data-label="발주서">{{ c.poNo }}</td>
                          <td data-label="발주일">{{ c.orderDate }}</td>
                          <td data-label="품목">{{ c.skuName || c.skuId }}</td>
                          <td data-label="수량" class="num">{{ formatNumber(c.quantity) }}</td>
                          <td data-label="단가" class="num">
                            {{ formatNumber(c.currentPrice) }} → <b>{{ c.targetPrice == null ? '원가표 없음' : formatNumber(c.targetPrice) }}</b>
                          </td>
                          <td data-label="금액 차이" class="num">
                            <span :class="signClass(c.amountDiff)">{{ c.amountDiff == null ? '-' : signed(c.amountDiff) }}</span>
                          </td>
                          <td data-label="비고" class="retro-note">
                            <span v-if="c.blockReason" class="retro-block">⛔ {{ c.blockReason }}</span>
                            <span v-else-if="c.warning" class="retro-warn">⚠ {{ c.warning }}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="retro-actions">
                    <button class="btn-secondary" :disabled="isBusy || selectedIds.size === 0" @click="runPreview">
                      <i :class="isPreviewing ? 'fas fa-spinner fa-spin' : 'fas fa-eye'" />
                      미리보기
                    </button>
                  </div>
                </template>
              </template>

              <!-- 미리보기 결과 -->
              <div v-if="preview" class="retro-preview">
                <h3><i class="fas fa-eye" /> 미리보기 — 아직 바뀌지 않았습니다</h3>

                <div class="retro-section">
                  <h4>월별 매출원장 (발주 금액 합계)</h4>
                  <div v-for="l in preview.ledgers" :key="l.yearMonth" class="retro-row">
                    <span>{{ l.yearMonth }}</span>
                    <span>{{ formatNumber(l.before) }} → <b>{{ formatNumber(l.after) }}</b>
                      (<span :class="signClass(l.diff)">{{ signed(l.diff) }}</span>)</span>
                  </div>
                </div>

                <div class="retro-section">
                  <h4>발주서 {{ distinctPoCount }}건 · 품목 {{ preview.poItems.length }}행 · 재고 출고 {{ preview.lotIssueCount }}행<template v-if="preview.consumptionCount"> · 재고 소진 {{ preview.consumptionCount }}건</template></h4>
                </div>

                <div class="retro-section">
                  <h4>출하 원가 {{ preview.shipments.length }}건</h4>
                  <div v-for="s in preview.shipments" :key="s.shipmentId + s.skuId" class="retro-row">
                    <span>{{ s.shipmentNo }} · {{ s.shipmentDate }} · {{ s.skuName }} {{ formatNumber(s.quantity) }}</span>
                    <span>{{ formatNumber(s.oldCost) }} → <b>{{ formatNumber(s.newCost) }}</b>
                      <em v-if="s.mixed" class="retro-mixed" title="다른 발주 물량과 섞여 물량 비율대로 평균을 냈습니다">평균</em></span>
                  </div>
                </div>

                <div v-if="preview.funds.length" class="retro-section">
                  <h4>기성청구 OEM 지급 예정액 {{ preview.funds.length }}건 · 합계 <span :class="signClass(fundDiff)">{{ signed(fundDiff) }}</span></h4>
                  <div v-for="f in preview.funds" :key="f.fundId" class="retro-row">
                    <span>{{ f.deliveryRequestNo }} · {{ f.projectName }}</span>
                    <span>{{ formatNumber(f.before) }} → <b>{{ formatNumber(f.after) }}</b>
                      (<span :class="signClass(f.diff)">{{ signed(f.diff) }}</span>)</span>
                  </div>
                </div>

                <div v-if="preview.baselines.length" class="retro-section">
                  <h4>기성 차수 원가 {{ preview.baselines.length }}건</h4>
                  <div v-for="b in preview.baselines" :key="b.baselineId" class="retro-row">
                    <span>{{ b.deliveryRequestNo }} · {{ b.baselineSeq }}차</span>
                    <span>{{ formatNumber(b.before) }} → <b>{{ formatNumber(b.after) }}</b>
                      (<span :class="signClass(b.diff)">{{ signed(b.diff) }}</span>)</span>
                  </div>
                </div>

                <ul v-if="preview.warnings.length" class="retro-warn-list">
                  <li v-for="w in preview.warnings" :key="w">{{ w }}</li>
                </ul>

                <div class="retro-apply-options">
                  <label>
                    <input v-model="form.regeneratePdf" type="checkbox" :disabled="isBusy">
                    발주서 PDF 다시 만들기 <small>(이미 발행된 발주서는 옛 단가로 남아 있습니다)</small>
                  </label>
                  <input v-model="form.remarks"
class="retro-remarks"
type="text"
maxlength="500"
placeholder="메모 (예: 신원 10월 단가 인하 소급)"
:disabled="isBusy">
                </div>

                <div v-if="readOnly" class="retro-warn">
                  조회 전용 계정은 소급을 적용할 수 없습니다.
                </div>
                <div v-else-if="!confirming" class="retro-actions">
                  <button class="btn-primary" :disabled="isBusy" @click="confirming = true">
                    <i class="fas fa-check" /> 적용
                  </button>
                </div>
                <div v-else class="retro-confirm">
                  <span>발주 품목 <b>{{ preview.poItems.length }}건</b>을 소급합니다.
                    <template v-for="l in preview.ledgers" :key="l.yearMonth">{{ l.yearMonth }} 원장 <b :class="signClass(l.diff)">{{ signed(l.diff) }}</b> </template>
                    — 적용할까요?</span>
                  <div class="retro-confirm-buttons">
                    <button class="btn-secondary" :disabled="isBusy" @click="confirming = false">
                      취소
                    </button>
                    <button class="btn-primary" :disabled="isBusy" @click="runApply">
                      <i :class="isApplying ? 'fas fa-spinner fa-spin' : 'fas fa-check'" /> 적용하기
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- ==================== 소급 기록 ==================== -->
            <template v-else>
              <div v-if="errorMessage" class="retro-error">
                <i class="fas fa-exclamation-circle" /> {{ errorMessage }}
              </div>
              <div v-if="revertResult" class="retro-done">
                <i class="fas fa-undo" />
                <div>
                  <b>기록 {{ revertResult.runId }} 을 되돌렸습니다.</b>
                  기성청구 {{ revertResult.funds.length }}건, 기성 차수 {{ revertResult.baselines.length }}건을 다시 계산했습니다.
                  <ul v-if="revertResult.warnings.length" class="retro-warn-list">
                    <li v-for="w in revertResult.warnings" :key="w">{{ w }}</li>
                  </ul>
                </div>
              </div>
              <div v-if="isLoading" class="retro-empty">
                <i class="fas fa-spinner fa-spin" /> 불러오는 중...
              </div>
              <div v-else-if="runs.length === 0" class="retro-empty">
                소급 기록이 없습니다.
              </div>
              <div v-else class="retro-table-wrap">
                <table class="retro-table">
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>일시</th>
                      <th>제조사</th>
                      <th>기간</th>
                      <th class="num">
                        품목
                      </th>
                      <th class="num">
                        원장 차이
                      </th>
                      <th>처리자</th>
                      <th>상태</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in runs" :key="r.runId">
                      <td data-label="번호">{{ r.runId }}</td>
                      <td data-label="일시">{{ formatDateTime(r.createdAt) }}</td>
                      <td data-label="제조사">{{ r.oemCompanyName }}</td>
                      <td data-label="기간">{{ r.periodFrom || '' }} ~ {{ r.periodTo || '' }}</td>
                      <td data-label="품목" class="num">{{ r.itemCount }}</td>
                      <td data-label="원장 차이" class="num"><span :class="signClass(r.ledgerDiff)">{{ signed(r.ledgerDiff) }}</span></td>
                      <td data-label="처리자">{{ r.createdBy }}<div v-if="r.remarks" class="retro-run-remark">{{ r.remarks }}</div></td>
                      <td data-label="상태">
                        {{ COST_RETRO_RUN_STATUS_LABELS[r.status] || r.status }}
                        <div v-if="r.revertedAt" class="retro-run-remark">{{ r.revertedBy }} · {{ formatDateTime(r.revertedAt) }}</div>
                      </td>
                      <td data-label="">
                        <template v-if="r.status === 'APPLIED' && !readOnly">
                          <button v-if="revertingId !== r.runId" class="btn-secondary btn-sm" :disabled="isBusy" @click="revertingId = r.runId">
                            되돌리기
                          </button>
                          <div v-else class="retro-confirm-inline">
                            <span>되돌릴까요?</span>
                            <button class="btn-secondary btn-sm" :disabled="isBusy" @click="revertingId = null">
                              취소
                            </button>
                            <button class="btn-danger btn-sm" :disabled="isBusy" @click="runRevert(r.runId)">
                              <i v-if="isApplying" class="fas fa-spinner fa-spin" /> 되돌리기
                            </button>
                          </div>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import GuideNotice from '~/components/ui/GuideNotice.vue'
import { costRetroService } from '~/services/cost-retro.service'
import { formatNumber, formatDateTime } from '~/utils/format'
import { COST_RETRO_RUN_STATUS_LABELS } from '~/types/oem-cost'
import type { CostRetroCandidate, CostRetroResult, CostRetroRun } from '~/types/oem-cost'

interface CompanyOption {
  id: number
  companyName: string
}

interface Props {
  isOpen: boolean
  oemCompanies: CompanyOption[]
  /** 원가 저장 직후 안내에서 열 때 채워 주는 조건 */
  initialOemCompanyId?: number | null
  initialSkuId?: string | null
  initialSkuName?: string | null
  initialFrom?: string | null
  /** 조회 전용 — 적용·되돌리기 버튼 숨김 */
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialOemCompanyId: null,
  initialSkuId: null,
  initialSkuName: null,
  initialFrom: null,
  readOnly: false
})

const emit = defineEmits<{
  close: []
  applied: []
}>()

const tab = ref<'retro' | 'runs'>('retro')
const form = reactive({
  oemCompanyId: 0,
  from: '',
  to: '',
  skuId: '',
  regeneratePdf: false,
  remarks: ''
})
const skuLabel = ref('')

const candidates = ref<CostRetroCandidate[]>([])
const selectedIds = ref<Set<number>>(new Set())
const searched = ref(false)
const preview = ref<CostRetroResult | null>(null)
const appliedResult = ref<CostRetroResult | null>(null)
const confirming = ref(false)

const runs = ref<CostRetroRun[]>([])
const revertingId = ref<number | null>(null)
const revertResult = ref<CostRetroResult | null>(null)

const isLoading = ref(false)
const isPreviewing = ref(false)
const isApplying = ref(false)
const errorMessage = ref('')
const isBusy = computed(() => isLoading.value || isPreviewing.value || isApplying.value)

/** 이번 달 1일 (기본 조회 시작일) */
const firstDayOfMonth = () => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

watch(() => props.isOpen, (open) => {
  if (!open) { return }
  tab.value = 'retro'
  form.oemCompanyId = props.initialOemCompanyId || 0
  form.skuId = props.initialSkuId || ''
  skuLabel.value = props.initialSkuName || ''
  form.from = props.initialFrom || firstDayOfMonth()
  form.to = ''
  form.regeneratePdf = false
  form.remarks = ''
  appliedResult.value = null
  revertResult.value = null
  resetCandidates()
  // 저장 직후 안내에서 열었으면 바로 찾아 준다
  if (form.oemCompanyId && props.initialFrom) {
    loadCandidates()
  }
})

const resetCandidates = () => {
  candidates.value = []
  selectedIds.value = new Set()
  searched.value = false
  clearPreview()
  errorMessage.value = ''
}

const clearPreview = () => {
  preview.value = null
  confirming.value = false
}

const clearSku = () => {
  form.skuId = ''
  skuLabel.value = ''
  resetCandidates()
}

const loadCandidates = async () => {
  if (!form.oemCompanyId) { return }
  isLoading.value = true
  errorMessage.value = ''
  appliedResult.value = null
  clearPreview()
  try {
    candidates.value = await costRetroService.getCandidates({
      oemCompanyId: form.oemCompanyId,
      from: form.from || undefined,
      to: form.to || undefined,
      skuId: form.skuId || undefined
    })
    selectedIds.value = new Set(candidates.value.filter(c => c.selectable).map(c => c.poiId))
    searched.value = true
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '대상을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const selectable = computed(() => candidates.value.filter(c => c.selectable))
const allChecked = computed(() => selectable.value.length > 0 && selectedIds.value.size === selectable.value.length)
const selectedDiff = computed(() => candidates.value
  .filter(c => selectedIds.value.has(c.poiId))
  .reduce((sum, c) => sum + (c.amountDiff || 0), 0))

const toggleAll = () => {
  selectedIds.value = allChecked.value ? new Set() : new Set(selectable.value.map(c => c.poiId))
  clearPreview()
}

const toggleOne = (poiId: number) => {
  const next = new Set(selectedIds.value)
  if (next.has(poiId)) { next.delete(poiId) } else { next.add(poiId) }
  selectedIds.value = next
  clearPreview()
}

const buildRequest = () => ({
  oemCompanyId: form.oemCompanyId,
  periodFrom: form.from || null,
  periodTo: form.to || null,
  poiIds: [...selectedIds.value],
  regeneratePdf: form.regeneratePdf,
  remarks: form.remarks || undefined
})

const runPreview = async () => {
  isPreviewing.value = true
  errorMessage.value = ''
  confirming.value = false
  try {
    preview.value = await costRetroService.preview(buildRequest())
  } catch (e) {
    preview.value = null
    errorMessage.value = e instanceof Error ? e.message : '미리보기에 실패했습니다.'
  } finally {
    isPreviewing.value = false
  }
}

const runApply = async () => {
  if (!preview.value?.previewToken) { return }
  isApplying.value = true
  errorMessage.value = ''
  try {
    appliedResult.value = await costRetroService.apply({
      ...buildRequest(),
      previewToken: preview.value.previewToken
    })
    preview.value = null
    confirming.value = false
    candidates.value = []
    selectedIds.value = new Set()
    searched.value = false
    emit('applied')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '적용에 실패했습니다.'
    confirming.value = false
  } finally {
    isApplying.value = false
  }
}

const distinctPoCount = computed(() => new Set((preview.value?.poItems || []).map(p => p.poId)).size)
const fundDiff = computed(() => (preview.value?.funds || []).reduce((s, f) => s + (f.diff || 0), 0))

// ---------- 기록 ----------
const openRunsTab = () => {
  tab.value = 'runs'
  errorMessage.value = ''
  revertResult.value = null
  loadRuns()
}

const loadRuns = async () => {
  isLoading.value = true
  try {
    runs.value = await costRetroService.getRuns(form.oemCompanyId || undefined)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '기록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const runRevert = async (runId: number) => {
  isApplying.value = true
  errorMessage.value = ''
  try {
    revertResult.value = await costRetroService.revert(runId)
    revertingId.value = null
    emit('applied')
    await loadRuns()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '되돌리기에 실패했습니다.'
  } finally {
    isApplying.value = false
  }
}

// ---------- 표시 ----------
const signed = (v: number | null | undefined) => {
  if (v === null || v === undefined) { return '-' }
  const n = Math.round(v * 100) / 100
  return (n > 0 ? '+' : '') + formatNumber(n)
}
const signClass = (v: number | null | undefined) => (!v ? '' : v < 0 ? 'diff-down' : 'diff-up')

const handleClose = () => {
  if (isBusy.value) { return }
  emit('close')
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

.ccm-modal-container.retro-modal {
  max-width: 1100px;
  height: 90vh;
}

.retro-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.retro-tab {
  padding: 0.75rem 1rem;
  min-height: 44px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
}

.retro-tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.retro-guide-list {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  line-height: 1.7;
}

.retro-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  margin: 1rem 0;
}

.retro-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #475569;
}

.retro-field select,
.retro-field input {
  min-height: 40px;
  padding: 0 0.625rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  min-width: 150px;
}

.retro-sku-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.retro-sku-chip button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
}

.retro-search-btn {
  min-height: 40px;
}

.retro-error {
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
}

.retro-done {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  color: #166534;
  line-height: 1.6;
}

.retro-done > i {
  font-size: 1.25rem;
  margin-top: 0.15rem;
}

.retro-done-ledger {
  margin-top: 0.25rem;
}

.retro-empty {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.retro-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.retro-check-all {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.retro-table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.retro-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.retro-table th,
.retro-table td {
  padding: 0.5rem 0.625rem;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: nowrap;
}

.retro-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
}

.retro-table .num {
  text-align: right;
}

.retro-table td.retro-note {
  white-space: normal;
  min-width: 220px;
}

.retro-table tr.blocked td {
  color: #94a3b8;
}

.retro-table input[type='checkbox'] {
  width: 18px;
  height: 18px;
}

.retro-block {
  color: #b91c1c;
}

.retro-warn {
  color: #b45309;
}

.retro-warn-list {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
  color: #b45309;
  line-height: 1.6;
}

.diff-down {
  color: #2563eb;
  font-weight: 600;
}

.diff-up {
  color: #dc2626;
  font-weight: 600;
}

.retro-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.retro-actions button,
.retro-confirm-buttons button {
  min-height: 44px;
  padding: 0 1.25rem;
}

.retro-preview {
  margin-top: 1.25rem;
  padding: 1rem;
  border: 2px solid #bfdbfe;
  border-radius: 12px;
  background: #f8fbff;
}

.retro-preview h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: #1e40af;
}

.retro-section {
  margin-bottom: 0.875rem;
}

.retro-section h4 {
  margin: 0 0 0.375rem;
  font-size: 0.875rem;
  color: #334155;
}

.retro-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding: 0.3rem 0;
  border-bottom: 1px dashed #e2e8f0;
  font-size: 0.8125rem;
}

.retro-mixed {
  margin-left: 0.375rem;
  padding: 0 0.375rem;
  border-radius: 4px;
  background: #fef3c7;
  color: #92400e;
  font-style: normal;
  font-size: 0.75rem;
}

.retro-apply-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.75rem 0;
  font-size: 0.875rem;
}

.retro-apply-options label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.retro-apply-options small {
  color: #64748b;
}

.retro-remarks {
  min-height: 40px;
  padding: 0 0.625rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.retro-confirm {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
}

.retro-confirm-buttons {
  display: flex;
  gap: 0.5rem;
}

.retro-confirm-inline {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-sm {
  min-height: 36px;
  padding: 0 0.75rem;
  font-size: 0.8125rem;
}

.retro-run-remark {
  font-size: 0.75rem;
  color: #64748b;
}

/* 좁은 화면 — 표를 카드로 */
@media (max-width: 640px) {
  .ccm-modal-container.retro-modal {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .retro-field,
  .retro-field select,
  .retro-field input,
  .retro-search-btn {
    width: 100%;
  }

  .retro-table thead {
    display: none;
  }

  .retro-table,
  .retro-table tbody,
  .retro-table tr,
  .retro-table td {
    display: block;
    width: 100%;
  }

  .retro-table tr {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .retro-table td {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    border: none;
    padding: 0.25rem 0.75rem;
    white-space: normal;
    text-align: right;
  }

  .retro-table td::before {
    content: attr(data-label);
    color: #64748b;
    text-align: left;
    flex-shrink: 0;
  }

  .retro-table td.retro-note {
    min-width: 0;
  }
}
</style>
