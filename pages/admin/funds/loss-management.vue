<template>
  <div class="admin-page">
    <div class="page-header">
      <h2><i class="fas fa-triangle-exclamation" /> 손실 관리</h2>
      <p class="page-desc">
        수량부족·스펙오납으로 발생한 원가 손실을 기록하고 제조사 분담분을 정산합니다.
        매출과 고객 서류에는 영향을 주지 않습니다.
      </p>
    </div>

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

    <!-- 검색 -->
    <div class="search-panel">
      <div class="search-row">
        <div class="search-field">
          <label>발생일</label>
          <div class="date-range">
            <input v-model="search.startDate" type="date">
            <span>~</span>
            <input v-model="search.endDate" type="date">
          </div>
        </div>
        <div class="search-field">
          <label>손실 유형</label>
          <select v-model="search.lossType">
            <option :value="null">전체</option>
            <option value="SHORTAGE">수량부족</option>
            <option value="SPEC_MISMATCH">스펙오납</option>
          </select>
        </div>
        <div class="search-field">
          <label>정산 상태</label>
          <select v-model="search.settlementStatus">
            <option :value="null">전체</option>
            <option v-for="opt in SETTLEMENT_STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="search-field">
          <label>검색어</label>
          <input v-model="search.keyword" type="text" placeholder="손실번호·납품요구번호·사업명" @keyup.enter="reload">
        </div>
        <div class="search-actions">
          <button class="btn btn-primary" @click="reload">
            <i class="fas fa-search" /> 조회
          </button>
          <button class="btn btn-secondary" @click="resetSearch">초기화</button>
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
      <table class="admin-table">
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
                v-if="loss.settlementStatus === 'PENDING' && loss.status === 'CONFIRMED'"
                class="btn-mini btn-deduct"
                title="OEM 지급에서 차감 반영"
                @click="settleLoss(loss, 'DEDUCTED')"
              >
                차감
              </button>
              <button
                v-if="loss.settlementStatus === 'PENDING' && loss.status === 'CONFIRMED'"
                class="btn-mini"
                title="정산 면제"
                @click="settleLoss(loss, 'WAIVED')"
              >
                면제
              </button>
              <button
                v-if="loss.status === 'CONFIRMED' && loss.settlementStatus !== 'DEDUCTED'"
                class="btn-mini btn-danger"
                title="손실 취소 (출하수량 원복)"
                @click="cancelLoss(loss)"
              >
                취소
              </button>
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
      <table class="admin-table">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { lossService } from '~/services/loss.service'
import { formatDate } from '~/utils/format'
import {
  SETTLEMENT_STATUS_OPTIONS,
  type LossAdjustmentResponse,
  type LossMonthlySummary,
  type LossSearchRequest,
  type SettlementStatus
} from '~/types/loss'

definePageMeta({ layout: 'admin' })

type TabKey = 'list' | 'summary'

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
  startDate: null,
  endDate: null,
  lossType: null,
  settlementStatus: null,
  keyword: null
})

const search = ref<LossSearchRequest>(createSearch())

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
  if (!window.confirm(
    `${loss.lossNo} 건을 취소하시겠습니까?\n출하 장부 수량 정정이 원복되고 납품률·원가가 재계산됩니다.`
  )) return

  try {
    await lossService.cancelLoss(loss.lossId)
    await loadList()
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '취소에 실패했습니다.')
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

onMounted(() => {
  loadList()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-search.css';

.page-header { margin-bottom: 1rem; }
.page-desc { font-size: 0.85rem; color: #6b7280; margin-top: 0.3rem; }

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

.date-range { display: flex; align-items: center; gap: 0.35rem; }
.date-range input { flex: 1; }

.table-wrapper { overflow-x: auto; }
.admin-table td.num, .admin-table th.num { text-align: right; }
.admin-table td.mono { font-family: ui-monospace, monospace; font-size: 0.82rem; }
.admin-table td.strong, .admin-table td .strong { font-weight: 700; }
.admin-table tr.cancelled { opacity: 0.5; text-decoration: line-through; }
.admin-table td.empty { text-align: center; color: #9ca3af; padding: 2rem; }
.admin-table td.ellipsis { max-width: 180px; }
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

.actions { white-space: nowrap; }
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
.btn-mini.btn-deduct { border-color: #059669; color: #059669; }
.btn-mini.btn-danger { border-color: #dc2626; color: #dc2626; }

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
