<template>
  <div class="loss-management">
    <!-- 페이지 헤더 — 다른 관리 화면과 같은 공용 컴포넌트를 쓴다 -->
    <PageHeader
      title="손실 관리"
      description="수량부족·스펙오납으로 발생한 원가 손실을 기록하고 제조사 분담분을 정산합니다. 매출과 고객 서류에는 영향을 주지 않습니다."
      icon="boxes"
      icon-color="orange"
    >
      <template #actions>
        <button class="btn-action" :disabled="loading" @click="reload">
          <i v-if="loading" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-search" />
          검색
        </button>
        <button class="btn-action" @click="resetSearch">
          <i class="fas fa-rotate-left" />
          초기화
        </button>
      </template>
    </PageHeader>

    <!-- 탭 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <i :class="tab.icon" /> {{ tab.label }}
      </button>
    </div>

    <!-- 검색 조건 — 공용 search-section-compact 규격 -->
    <div class="search-section-compact">
      <div class="search-row-single">
        <div class="search-item">
          <label>발생일:</label>
          <SearchDateRange v-model:start-date="search.startDate" v-model:end-date="search.endDate" />
        </div>

        <div class="search-item">
          <label>손실 유형:</label>
          <select v-model="search.lossType" class="status-select">
            <option :value="null">
              전체
            </option>
            <option value="SHORTAGE">
              수량부족
            </option>
            <option value="SPEC_MISMATCH">
              스펙오납
            </option>
          </select>
        </div>

        <div class="search-item">
          <label>정산 상태:</label>
          <select v-model="search.settlementStatus" class="status-select">
            <option :value="null">
              전체
            </option>
            <option v-for="opt in SETTLEMENT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="search-item">
          <label>검색어:</label>
          <input
            v-model="search.keyword"
            type="text"
            class="text-input"
            placeholder="손실번호, 납품요구번호, 사업명"
            @keyup.enter="reload"
          >
        </div>
      </div>
    </div>

    <!-- 요약 카드 -->
    <div class="summary-cards">
      <div class="summary-card">
        <span class="card-label">총 손실액</span>
        <strong class="card-value">{{ formatCurrency(totals.gross) }}</strong>
      </div>
      <div class="summary-card oem">
        <span class="card-label">제조사 부담 (지급 차감)</span>
        <strong class="card-value">{{ formatCurrency(totals.oemDeduction) }}</strong>
      </div>
      <div class="summary-card company">
        <span class="card-label">리드파워 부담</span>
        <strong class="card-value">{{ formatCurrency(totals.companyLoss) }}</strong>
      </div>
      <div class="summary-card pending">
        <span class="card-label">미정산</span>
        <strong class="card-value">{{ totals.pendingCount }} 건</strong>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" /> 불러오는 중...
    </div>

    <!-- 목록 탭 -->
    <div v-else-if="activeTab === 'list'" class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>손실번호</th>
            <th>발생일</th>
            <th>유형</th>
            <th>납품요구 / 사업</th>
            <th>출하</th>
            <th>제조사</th>
            <th>품목</th>
            <th class="num">수량</th>
            <th class="num">손실 합계</th>
            <th class="num">제조사 부담</th>
            <th class="num">리드파워 부담</th>
            <th>보전</th>
            <th>정산</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="losses.length === 0">
            <td colspan="14" class="empty">등록된 손실 건이 없습니다.</td>
          </tr>
          <tr v-for="loss in losses" :key="loss.lossId" :class="{ cancelled: loss.status === 'CANCELLED' }">
            <td class="mono">{{ loss.lossNo }}</td>
            <td>{{ formatDate(loss.occurredDate) }}</td>
            <td>
              <span class="badge" :class="loss.lossType === 'SHORTAGE' ? 'badge-shortage' : 'badge-spec'">
                {{ loss.lossTypeName }}
              </span>
            </td>
            <td class="ellipsis">
              <div class="two-line">
                <span>{{ loss.deliveryRequestNo || '-' }}</span>
                <small>{{ loss.projectName || '' }}</small>
              </div>
            </td>
            <td class="mono">{{ loss.shipmentNo || '-' }}</td>
            <td>{{ loss.oemCompanyName || '-' }}</td>
            <td class="ellipsis">
              {{ loss.skuName || loss.skuId }}
              <small v-if="loss.actualSkuName"> → {{ loss.actualSkuName }}</small>
            </td>
            <td class="num">{{ formatNumber(loss.quantity) }}</td>
            <td class="num" :class="{ negative: loss.grossLossAmount < 0 }">
              {{ formatCurrency(loss.grossLossAmount) }}
            </td>
            <td class="num oem-amount">{{ formatCurrency(loss.oemDeductionAmount) }}</td>
            <td class="num company-amount" :class="{ negative: loss.companyLossAmount < 0 }">
              {{ formatCurrency(loss.companyLossAmount) }}
            </td>
            <td>
              <span class="badge badge-plain">{{ loss.recoveryTypeName }}</span>
              <small v-if="loss.recoveryPoNo" class="block">{{ loss.recoveryPoNo }}</small>
            </td>
            <td>
              <span class="badge" :class="settlementClass(loss.settlementStatus)">
                {{ loss.settlementStatusName }}
              </span>
              <small v-if="loss.settlementYearMonth" class="block">{{ loss.settlementYearMonth }}</small>
            </td>
            <td class="actions">
              <button
                v-if="loss.status === 'CONFIRMED' && loss.settlementStatus === 'PENDING'"
                class="btn-mini"
                title="손실 내용 수정"
                @click="openEdit(loss)"
              >
                수정
              </button>
              <button
                v-if="canSettle && loss.status === 'CONFIRMED' && loss.lossType === 'SHORTAGE'"
                class="btn-mini btn-recovery"
                :title="loss.recoveryShipmentId ? '보전 연결 확인 · 변경' : '부족분을 다시 보낸 출하를 연결'"
                @click="openRecovery(loss)"
              >
                {{ loss.recoveryShipmentId ? '보전됨' : '보전 연결' }}
              </button>
              <button
                v-if="canSettle && loss.status === 'CONFIRMED' && loss.receiptReissueNeeded && !loss.receiptReissuedAt"
                class="btn-mini btn-reissue"
                title="인수증·납품확인서를 다시 발행한 뒤 눌러 완료로 표시"
                @click="markReissued(loss)"
              >
                재발행 완료
              </button>
              <button
                v-if="canSettle && loss.status === 'CONFIRMED' && !loss.inventoryAdjusted"
                class="btn-mini btn-inventory"
                title="실물 확인 후 창고 재고를 조정"
                @click="openInventoryAdjust(loss)"
              >
                재고 조정
              </button>
              <button
                v-if="canSettle && loss.settlementStatus === 'PENDING' && loss.status === 'CONFIRMED'"
                class="btn-mini btn-deduct"
                title="OEM 지급에서 차감 반영"
                @click="settleLoss(loss, 'DEDUCTED')"
              >
                차감
              </button>
              <button
                v-if="canSettle && loss.settlementStatus === 'PENDING' && loss.status === 'CONFIRMED'"
                class="btn-mini"
                title="정산 면제"
                @click="settleLoss(loss, 'WAIVED')"
              >
                면제
              </button>
              <button
                v-if="canSettle && loss.status === 'CONFIRMED' && loss.settlementStatus !== 'DEDUCTED'"
                class="btn-mini btn-danger"
                title="손실 취소 (출하수량 원복)"
                @click="cancelLoss(loss)"
              >
                취소
              </button>

              <!-- 이미 끝난 처리는 버튼이 사라지므로, 흔적을 작게 남긴다 -->
              <div v-if="loss.receiptReissuedAt || loss.inventoryAdjusted" class="done-marks">
                <span v-if="loss.receiptReissuedAt" :title="`재발행 ${formatDate(loss.receiptReissuedAt)}`">
                  <i class="fas fa-file-circle-check" /> 재발행
                </span>
                <span
                  v-if="loss.inventoryAdjusted"
                  :title="`재고 조정 ${signed(loss.inventoryAdjustQty)}매 (${signed(Number(loss.inventoryAdjustQty || 0) * 2)}㎡)`"
                >
                  <i class="fas fa-boxes-stacked" /> 재고 {{ signed(loss.inventoryAdjustQty) }}매
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="pagination.totalPages > 1" class="pagination">
        <button :disabled="currentPage === 1" @click="goPage(currentPage - 1)">이전</button>
        <span>{{ currentPage }} / {{ pagination.totalPages }}</span>
        <button :disabled="currentPage >= pagination.totalPages" @click="goPage(currentPage + 1)">다음</button>
      </div>
    </div>

    <!-- 월별 집계 탭 -->
    <div v-else class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>년월</th>
            <th>제조사</th>
            <th>유형</th>
            <th class="num">건수</th>
            <th class="num">원가 손실</th>
            <th class="num">배송비 손실</th>
            <th class="num">손실 합계</th>
            <th class="num">제조사 부담</th>
            <th class="num">리드파워 부담</th>
            <th class="num">페널티</th>
            <th class="num">지급 차감</th>
            <th class="num">미정산</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="summaries.length === 0">
            <td colspan="12" class="empty">집계할 손실 건이 없습니다.</td>
          </tr>
          <tr v-for="(row, idx) in summaries" :key="`${row.yearMonth}-${row.oemCompanyId}-${row.lossType}-${idx}`">
            <td class="mono">{{ row.yearMonth }}</td>
            <td>{{ row.oemCompanyName || '-' }}</td>
            <td>
              <span class="badge" :class="row.lossType === 'SHORTAGE' ? 'badge-shortage' : 'badge-spec'">
                {{ row.lossTypeName }}
              </span>
            </td>
            <td class="num">{{ row.lossCount }}</td>
            <td class="num">{{ formatCurrency(row.costLossAmount) }}</td>
            <td class="num">{{ formatCurrency(row.shippingLossAmount) }}</td>
            <td class="num strong">{{ formatCurrency(row.grossLossAmount) }}</td>
            <td class="num oem-amount">{{ formatCurrency(row.oemBurdenAmount) }}</td>
            <td class="num company-amount">{{ formatCurrency(row.companyLossAmount) }}</td>
            <td class="num">{{ formatCurrency(row.penaltyAmount) }}</td>
            <td class="num oem-amount">{{ formatCurrency(row.oemDeductionAmount) }}</td>
            <td class="num">{{ row.pendingCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 손실 수정 -->
    <LossAdjustmentModal
      :is-open="showEdit"
      :edit-target="editTarget"
      :shipment-id="editTarget?.shipmentId || 0"
      @close="showEdit = false"
      @saved="onSubModalSaved('손실 내용을 수정했습니다.')"
    />

    <!-- 보전 연결 -->
    <RecoveryLinkModal
      :is-open="showRecovery"
      :loss="recoveryTarget"
      @close="showRecovery = false"
      @saved="onSubModalSaved('보전 출하를 연결했습니다.')"
    />

    <!-- 재고 조정 -->
    <InventoryAdjustModal
      :is-open="showInventory"
      :loss="inventoryTarget"
      @close="showInventory = false"
      @saved="onSubModalSaved('재고를 조정했습니다.')"
    />
  </div>
</template>

<script setup lang="ts">
import SearchDateRange from '~/components/ui/SearchDateRange.vue'
import { ref, computed, onMounted } from 'vue'
import { usePermissionStore } from '~/stores/permission'
import { lossService } from '~/services/loss.service'
import LossAdjustmentModal from '~/components/loss/LossAdjustmentModal.vue'
import RecoveryLinkModal from '~/components/loss/RecoveryLinkModal.vue'
import InventoryAdjustModal from '~/components/loss/InventoryAdjustModal.vue'
import { formatDate, getSearchStartDate, getSearchEndDate } from '~/utils/format'
import {
  SETTLEMENT_STATUS_OPTIONS,
  type LossAdjustmentResponse,
  type LossMonthlySummary,
  type LossSearchRequest,
  type SettlementStatus
} from '~/types/loss'

definePageMeta({ layout: 'admin' })

type TabKey = 'list' | 'summary'

const permissionStore = usePermissionStore()

/**
 * 정산·재고조정·보전연결·재발행표시·취소를 할 수 있는가.
 *
 * ★ 손실은 제조사 지급액을 «깎는» 항목이라, 제조사가 스스로 지우거나 되돌리면
 *   받을 돈이 늘어난다. 그래서 등록·수정까지만 열고 확정 지점은 관리자가 쥔다.
 *   서버(SecurityConfig)도 같은 선으로 막혀 있어, 화면만 열어두면
 *   제조사에게 눌러도 403 나는 버튼이 보인다.
 */
const canSettle = computed(() => !permissionStore.isOemManager)

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'list', label: '손실 목록', icon: 'fas fa-list' },
  { key: 'summary', label: '월별 집계', icon: 'fas fa-chart-column' }
]

const activeTab = ref<TabKey>('list')
const loading = ref(false)
const losses = ref<LossAdjustmentResponse[]>([])
const summaries = ref<LossMonthlySummary[]>([])
const currentPage = ref(1)
const pagination = ref({ totalPages: 0, totalElements: 0 })

const createSearch = (): LossSearchRequest => ({
  startDate: getSearchStartDate(),
  endDate: getSearchEndDate(),
  lossType: null,
  settlementStatus: null,
  keyword: null
})

const search = ref<LossSearchRequest>(createSearch())

/**
 * 후속 처리 모달 3종
 *
 * 손실은 등록으로 끝나지 않는다. 수정 → 인수증 재발행 → 보전 연결 → 정산 순으로
 * 이어지고, 재고 조정은 이 사슬과 별개로 실물 확인 후 아무 때나 한다.
 * 정산이 [차감]으로 끝나면 수정·취소가 막히므로 그 전에 정리해야 한다.
 */
const showEdit = ref(false)
const editTarget = ref<LossAdjustmentResponse | null>(null)
const showRecovery = ref(false)
const recoveryTarget = ref<LossAdjustmentResponse | null>(null)
const showInventory = ref(false)
const inventoryTarget = ref<LossAdjustmentResponse | null>(null)

const openEdit = (loss: LossAdjustmentResponse) => {
  editTarget.value = loss
  showEdit.value = true
}

const openRecovery = (loss: LossAdjustmentResponse) => {
  recoveryTarget.value = loss
  showRecovery.value = true
}

const openInventoryAdjust = (loss: LossAdjustmentResponse) => {
  inventoryTarget.value = loss
  showInventory.value = true
}

/** 요약 카드 — 현재 조회 결과 기준 */
const totals = computed(() => {
  if (activeTab.value === 'summary') {
    return summaries.value.reduce(
      (acc, row) => ({
        gross: acc.gross + Number(row.grossLossAmount || 0),
        oemDeduction: acc.oemDeduction + Number(row.oemDeductionAmount || 0),
        companyLoss: acc.companyLoss + Number(row.companyLossAmount || 0),
        pendingCount: acc.pendingCount + Number(row.pendingCount || 0)
      }),
      { gross: 0, oemDeduction: 0, companyLoss: 0, pendingCount: 0 }
    )
  }
  return losses.value
    .filter(l => l.status === 'CONFIRMED')
    .reduce(
      (acc, l) => ({
        gross: acc.gross + Number(l.grossLossAmount || 0),
        oemDeduction: acc.oemDeduction + Number(l.oemDeductionAmount || 0),
        companyLoss: acc.companyLoss + Number(l.companyLossAmount || 0),
        pendingCount: acc.pendingCount + (l.settlementStatus === 'PENDING' ? 1 : 0)
      }),
      { gross: 0, oemDeduction: 0, companyLoss: 0, pendingCount: 0 }
    )
})

const loadList = async () => {
  loading.value = true
  try {
    // UI 는 1-indexed, API 는 0-indexed
    const response = await lossService.getLossList({
      ...search.value,
      page: currentPage.value - 1,
      size: 20
    })
    losses.value = response.content || []
    pagination.value = {
      totalPages: response.totalPages || 0,
      totalElements: response.totalElements || 0
    }
  } catch (error) {
    console.error('[loss-management] 목록 조회 실패:', error)
    losses.value = []
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  loading.value = true
  try {
    summaries.value = await lossService.getMonthlySummary(search.value)
  } catch (error) {
    console.error('[loss-management] 월별 집계 조회 실패:', error)
    summaries.value = []
  } finally {
    loading.value = false
  }
}

const reload = () => {
  currentPage.value = 1
  return activeTab.value === 'list' ? loadList() : loadSummary()
}

const switchTab = (key: TabKey) => {
  activeTab.value = key
  reload()
}

const resetSearch = () => {
  search.value = createSearch()
  reload()
}

const goPage = (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return
  currentPage.value = page
  loadList()
}

const settleLoss = async (loss: LossAdjustmentResponse, status: SettlementStatus) => {
  const label = status === 'DEDUCTED' ? 'OEM 지급에서 차감 반영' : '정산 면제'
  if (!window.confirm(`${loss.lossNo} 건을 ${label} 처리하시겠습니까?`)) return

  try {
    await lossService.settle(loss.lossId, status, loss.settlementYearMonth || undefined)
    await loadList()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '정산 처리에 실패했습니다.')
  }
}

const cancelLoss = async (loss: LossAdjustmentResponse) => {
  // 손실 등록은 출하 수량 자체를 바꾸지 않는다. 되돌아가는 것은 비고 표기·계산상 차감·재고 조정이다.
  const revertInventory = loss.inventoryAdjusted
    ? `\n· 재고 조정 ${signed(loss.inventoryAdjustQty)}매도 함께 원복됩니다.`
    : ''
  if (!window.confirm(
    `${loss.lossNo} 건을 취소하시겠습니까?\n` +
    '· 출하 비고의 손실 표기가 제거됩니다.\n' +
    '· 납품률·잔여수량·OEM 예정총액이 재계산됩니다.' +
    revertInventory
  )) return

  try {
    await lossService.cancelLoss(loss.lossId)
    await loadList()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '취소에 실패했습니다.')
  }
}

/** 하위 모달 저장 후 — 모달을 모두 닫고 목록을 다시 읽는다 */
const onSubModalSaved = async (message: string) => {
  showEdit.value = false
  showRecovery.value = false
  showInventory.value = false
  await loadList()
  window.alert(message)
}

const markReissued = async (loss: LossAdjustmentResponse) => {
  if (!window.confirm(
    `${loss.lossNo} 건의 인수증·납품확인서를 다시 발행하셨습니까?\n` +
    '완료로 표시하면 목록에서 재발행 대기 표시가 사라집니다.'
  )) return

  try {
    await lossService.markReceiptReissued(loss.lossId)
    await loadList()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '재발행 완료 표시에 실패했습니다.')
  }
}

const settlementClass = (status: string): string => {
  if (status === 'DEDUCTED') return 'badge-deducted'
  if (status === 'WAIVED') return 'badge-waived'
  return 'badge-pending'
}

const formatNumber = (value: unknown): string =>
  Number(value || 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })

const formatCurrency = (value: unknown): string =>
  `${Math.round(Number(value || 0)).toLocaleString('ko-KR')}`

/** 재고 조정량은 방향이 중요하다 — 양수에도 부호를 붙인다 */
const signed = (value: unknown): string => {
  const numeric = Number(value || 0)
  return `${numeric > 0 ? '+' : ''}${formatNumber(numeric)}`
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
/*
 * 손실 관리 페이지 스타일
 *
 * 헤더는 공용 PageHeader, 검색줄은 공용 search-section-compact 규격을 쓴다.
 * 예전에는 이 화면만 page-header / search-panel / search-field 라는
 * 자체 클래스를 써서 다른 관리 화면과 모양이 따로 놀았다.
 *
 * 공용 CSS(admin-common / admin-buttons / admin-search / admin-tables)는
 * nuxt.config.ts 의 css 배열에서 전역으로 불러오므로 여기서 @import 하지 않는다.
 */

.tab-bar {
  display: flex;
  gap: 0.4rem;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1rem;
}
.tab-btn {
  padding: 0.55rem 1.1rem;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin: 1rem 0;
}
.summary-card {
  padding: 0.85rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.summary-card.oem { border-left: 3px solid #f59e0b; }
.summary-card.company { border-left: 3px solid #dc2626; }
.summary-card.pending { border-left: 3px solid #6b7280; }
.card-label { font-size: 0.78rem; color: #6b7280; }
.card-value { font-size: 1.15rem; font-weight: 700; color: #111827; }

.table-wrapper { overflow-x: auto; }
.data-table td.num, .data-table th.num { text-align: right; }
.data-table td.mono { font-family: ui-monospace, monospace; font-size: 0.82rem; }
.data-table td.strong, .data-table td .strong { font-weight: 700; }
.data-table tr.cancelled { opacity: 0.5; text-decoration: line-through; }
.data-table td.empty { text-align: center; color: #9ca3af; padding: 2rem; }
.data-table td.ellipsis { max-width: 180px; }
.two-line { display: flex; flex-direction: column; }
.two-line small { color: #6b7280; font-size: 0.75rem; }
.block { display: block; color: #6b7280; font-size: 0.72rem; }

.oem-amount { color: #b45309; }
.company-amount { color: #dc2626; }
.negative { color: #059669 !important; }

.badge {
  display: inline-block;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
}
.badge-shortage { background: #fee2e2; color: #b91c1c; }
.badge-spec { background: #e0e7ff; color: #4338ca; }
.badge-plain { background: #f3f4f6; color: #4b5563; }
.badge-pending { background: #f3f4f6; color: #4b5563; }
.badge-deducted { background: #d1fae5; color: #065f46; }
.badge-waived { background: #fef3c7; color: #92400e; }

/* 버튼이 6개까지 늘어나 한 줄로는 안 잡힌다 */
.actions { min-width: 148px; }
.btn-mini {
  padding: 0.2rem 0.45rem;
  font-size: 0.74rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.2rem;
}
.btn-mini:hover { background: #f3f4f6; }
.btn-mini { margin-bottom: 0.2rem; }
.btn-mini.btn-deduct { border-color: #059669; color: #059669; }
.btn-mini.btn-danger { border-color: #dc2626; color: #dc2626; }
.btn-mini.btn-recovery { border-color: #2563eb; color: #2563eb; }
.btn-mini.btn-reissue { border-color: #7c3aed; color: #7c3aed; }
.btn-mini.btn-inventory { border-color: #b45309; color: #b45309; }

.done-marks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
}
.pagination button {
  padding: 0.35rem 0.8rem;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

.loading-container {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 900px) {
  .summary-cards { grid-template-columns: 1fr 1fr; }
}
</style>
