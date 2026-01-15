<template>
  <div class="commission-settlements">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션 정산 이력"
      description="계약별 커미션 정산 현황을 조회하고 관리합니다."
    >
      <template #actions>
        <button
          class="btn-confirm-batch"
          @click="confirmSelectedSettlements"
          :disabled="selectedIds.length === 0"
        >
          <i class="fas fa-check-double"></i>
          선택 항목 확정 ({{ selectedIds.length }})
        </button>
      </template>
    </PageHeader>

    <!-- 검색 필터 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>조회 연도</label>
          <select v-model="selectedYear" class="form-select" @change="loadSettlements">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>상태</label>
          <select v-model="selectedStatus" class="form-select" @change="loadSettlements">
            <option value="">전체</option>
            <option value="PENDING">정산 대기</option>
            <option value="CALCULATED">계산 완료</option>
            <option value="CONFIRMED">확정</option>
            <option value="PAID">지급 완료</option>
          </select>
        </div>
        <div class="filter-group search">
          <label>검색</label>
          <div class="search-input-wrapper">
            <input
              v-model="searchKeyword"
              type="text"
              class="form-input"
              placeholder="납품요구번호, 현장명 검색"
              @keyup.enter="loadSettlements"
            />
            <button class="btn-search" @click="loadSettlements">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>정산 목록을 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 요약 카드 -->
      <div class="summary-cards">
        <div class="summary-card blue">
          <div class="card-icon">
            <i class="fas fa-list-alt"></i>
          </div>
          <div class="card-content">
            <span class="card-label">전체 정산</span>
            <span class="card-value">{{ totalCount }}건</span>
          </div>
        </div>
        <div class="summary-card amber">
          <div class="card-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="card-content">
            <span class="card-label">정산 대기</span>
            <span class="card-value">{{ pendingCount }}건</span>
          </div>
        </div>
        <div class="summary-card green">
          <div class="card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-content">
            <span class="card-label">확정/지급</span>
            <span class="card-value">{{ confirmedCount }}건</span>
          </div>
        </div>
        <div class="summary-card purple">
          <div class="card-icon">
            <i class="fas fa-coins"></i>
          </div>
          <div class="card-content">
            <span class="card-label">총 커미션</span>
            <span class="card-value">{{ formatCurrency(totalCommission) }}</span>
          </div>
        </div>
      </div>

      <!-- 정산 목록 테이블 -->
      <div class="table-section">
        <div class="table-header">
          <h3 class="section-title">
            <i class="fas fa-table"></i>
            정산 목록
          </h3>
          <div class="table-info">
            총 {{ pagination.total }}건
          </div>
        </div>

        <div class="table-container">
          <table class="settlement-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="col-no">납품요구번호</th>
                <th class="col-project">현장명</th>
                <th class="col-amount">계약금액</th>
                <th class="col-sales">정산기준 매출</th>
                <th class="col-rate">커미션율</th>
                <th class="col-commission">커미션 금액</th>
                <th class="col-status">상태</th>
                <th class="col-date">확정일</th>
                <th class="col-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="settlements.length === 0">
                <td colspan="10" class="no-data">
                  <i class="fas fa-inbox"></i>
                  <p>정산 이력이 없습니다.</p>
                </td>
              </tr>
              <tr
                v-else
                v-for="settlement in settlements"
                :key="settlement.settlementId"
                :class="{ selected: selectedIds.includes(settlement.settlementId) }"
              >
                <td class="col-checkbox">
                  <input
                    type="checkbox"
                    :value="settlement.settlementId"
                    v-model="selectedIds"
                    :disabled="settlement.status === 'CONFIRMED' || settlement.status === 'PAID'"
                  />
                </td>
                <td class="col-no">
                  <a href="#" @click.prevent="goToFundDetail(settlement.fundId)" class="link">
                    {{ settlement.deliveryRequestNo }}
                  </a>
                </td>
                <td class="col-project">{{ settlement.projectName }}</td>
                <td class="col-amount text-right">{{ formatCurrency(settlement.contractTotalAmount) }}</td>
                <td class="col-sales text-right">{{ formatCurrency(settlement.salesAmount) }}</td>
                <td class="col-rate text-center">
                  <span class="rate-badge">{{ settlement.appliedRate }}%</span>
                </td>
                <td class="col-commission text-right">
                  <span class="commission-amount">{{ formatCurrency(settlement.commissionAmount) }}</span>
                </td>
                <td class="col-status text-center">
                  <span :class="['status-badge', getStatusClass(settlement.status)]">
                    {{ getStatusLabel(settlement.status) }}
                  </span>
                </td>
                <td class="col-date text-center">
                  {{ settlement.confirmedAt ? formatDate(settlement.confirmedAt) : '-' }}
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button
                      v-if="settlement.status === 'PENDING' || settlement.status === 'CALCULATED'"
                      class="btn-icon confirm"
                      @click="confirmSettlement(settlement.settlementId)"
                      title="확정"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button
                      class="btn-icon view"
                      @click="viewDetail(settlement)"
                      title="상세보기"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="pagination.page === 0"
            @click="changePage(pagination.page - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">
            {{ pagination.page + 1 }} / {{ pagination.totalPages }}
          </span>
          <button
            class="page-btn"
            :disabled="pagination.page >= pagination.totalPages - 1"
            @click="changePage(pagination.page + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 상세보기 모달 -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>정산 상세 정보</h3>
          <button class="modal-close" @click="closeDetailModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="selectedSettlement" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>납품요구번호</label>
              <span>{{ selectedSettlement.deliveryRequestNo }}</span>
            </div>
            <div class="detail-item">
              <label>현장명</label>
              <span>{{ selectedSettlement.projectName }}</span>
            </div>
            <div class="detail-item">
              <label>수요기관</label>
              <span>{{ selectedSettlement.client || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>계약금액</label>
              <span class="amount">{{ formatCurrency(selectedSettlement.contractTotalAmount) }}</span>
            </div>
            <div class="detail-item">
              <label>정산기준 매출</label>
              <span class="amount">{{ formatCurrency(selectedSettlement.salesAmount) }}</span>
            </div>
            <div class="detail-item">
              <label>적용 커미션율</label>
              <span class="rate">{{ selectedSettlement.appliedRate }}%</span>
            </div>
            <div class="detail-item highlight">
              <label>커미션 금액</label>
              <span class="commission">{{ formatCurrency(selectedSettlement.commissionAmount) }}</span>
            </div>
            <div class="detail-item">
              <label>정산 상태</label>
              <span :class="['status-badge', getStatusClass(selectedSettlement.status)]">
                {{ getStatusLabel(selectedSettlement.status) }}
              </span>
            </div>
            <div class="detail-item">
              <label>확정일</label>
              <span>{{ selectedSettlement.confirmedAt ? formatDate(selectedSettlement.confirmedAt) : '-' }}</span>
            </div>
            <div class="detail-item">
              <label>지급일</label>
              <span>{{ selectedSettlement.paidAt ? formatDate(selectedSettlement.paidAt) : '-' }}</span>
            </div>
            <div class="detail-item full">
              <label>비고</label>
              <span>{{ selectedSettlement.remarks || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeDetailModal">닫기</button>
          <button
            v-if="selectedSettlement && (selectedSettlement.status === 'PENDING' || selectedSettlement.status === 'CALCULATED')"
            class="btn-primary"
            @click="confirmSettlement(selectedSettlement.settlementId); closeDetailModal()"
          >
            <i class="fas fa-check"></i>
            확정
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useCommissionStore } from '~/stores/commission'
import { formatCurrency } from '~/utils/format'
import type { CommissionSettlement, CommissionSettlementStatus } from '~/types/commission'
import { COMMISSION_SETTLEMENT_STATUS_LABELS } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 정산 이력'
})

const router = useRouter()
const commissionStore = useCommissionStore()

// State
const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const selectedStatus = ref<CommissionSettlementStatus | ''>('')
const searchKeyword = ref('')
const selectedIds = ref<number[]>([])
const showDetailModal = ref(false)
const selectedSettlement = ref<CommissionSettlement | null>(null)

// 목업 데이터 사용 여부 (UI 테스트용)
const useMockData = ref(true)

// 목업 데이터 정의 - 대리점(영업직원)별 커미션 정산 목록 (15% 지분)
const mockSettlements: CommissionSettlement[] = [
  {
    settlementId: 1,
    fundId: 101,
    deliveryRequestNo: 'DR-2026-0001',
    projectName: '서울시청 사무용품 납품',
    client: '서울특별시청',
    contractTotalAmount: 450_000_000,
    salesAmount: 450_000_000,
    appliedRate: 15.0,
    commissionAmount: 67_500_000, // 4.5억 × 15%
    status: 'PAID',
    confirmedAt: '2026-02-15',
    paidAt: '2026-02-28',
    paymentId: 1,
    remarks: '대리점: 김영업 (서울/경기)'
  },
  {
    settlementId: 2,
    fundId: 102,
    deliveryRequestNo: 'DR-2026-0015',
    projectName: '경기도교육청 IT장비 납품',
    client: '경기도교육청',
    contractTotalAmount: 680_000_000,
    salesAmount: 680_000_000,
    appliedRate: 15.0,
    commissionAmount: 102_000_000, // 6.8억 × 15%
    status: 'PAID',
    confirmedAt: '2026-03-20',
    paidAt: '2026-03-31',
    paymentId: 2,
    remarks: '대리점: 김영업 (서울/경기)'
  },
  {
    settlementId: 3,
    fundId: 103,
    deliveryRequestNo: 'DR-2026-0028',
    projectName: '부산광역시 소방장비 납품',
    client: '부산광역시 소방본부',
    contractTotalAmount: 320_000_000,
    salesAmount: 320_000_000,
    appliedRate: 15.0,
    commissionAmount: 48_000_000, // 3.2억 × 15%
    status: 'CONFIRMED',
    confirmedAt: '2026-06-10',
    remarks: '대리점: 이판매 (부산/경남) - 지급 대기'
  },
  {
    settlementId: 4,
    fundId: 104,
    deliveryRequestNo: 'DR-2026-0042',
    projectName: '인천시 환경장비 납품',
    client: '인천광역시 환경공단',
    contractTotalAmount: 280_000_000,
    salesAmount: 280_000_000,
    appliedRate: 15.0,
    commissionAmount: 42_000_000, // 2.8억 × 15%
    status: 'CONFIRMED',
    confirmedAt: '2026-07-05',
    remarks: '대리점: 김영업 (서울/경기)'
  },
  {
    settlementId: 5,
    fundId: 105,
    deliveryRequestNo: 'DR-2026-0056',
    projectName: '대전시 의료장비 납품',
    client: '대전광역시 보건환경연구원',
    contractTotalAmount: 420_000_000,
    salesAmount: 420_000_000,
    appliedRate: 15.0,
    commissionAmount: 63_000_000, // 4.2억 × 15%
    status: 'CALCULATED',
    remarks: '대리점: 박세일 (대전/충청) - 정산 검토 중'
  },
  {
    settlementId: 6,
    fundId: 106,
    deliveryRequestNo: 'DR-2026-0071',
    projectName: '광주시 교육기자재 납품',
    client: '광주광역시교육청',
    contractTotalAmount: 180_000_000,
    salesAmount: 180_000_000,
    appliedRate: 15.0,
    commissionAmount: 27_000_000, // 1.8억 × 15%
    status: 'CALCULATED',
    remarks: '대리점: 최거래 (광주/전라)'
  },
  {
    settlementId: 7,
    fundId: 107,
    deliveryRequestNo: 'DR-2026-0085',
    projectName: '세종시 사무가구 납품',
    client: '세종특별자치시청',
    contractTotalAmount: 150_000_000,
    salesAmount: 150_000_000,
    appliedRate: 15.0,
    commissionAmount: 22_500_000, // 1.5억 × 15%
    status: 'PENDING',
    remarks: '대리점: 박세일 (대전/충청) - 납품 완료, 정산 대기'
  },
  {
    settlementId: 8,
    fundId: 108,
    deliveryRequestNo: 'DR-2026-0099',
    projectName: '울산시 산업장비 납품',
    client: '울산광역시청',
    contractTotalAmount: 370_000_000,
    salesAmount: 370_000_000,
    appliedRate: 15.0,
    commissionAmount: 55_500_000, // 3.7억 × 15%
    status: 'PENDING',
    remarks: '대리점: 정딜러 (대구/경북) - 수금 진행 중'
  }
]

// 목업 페이지네이션
const mockPagination = {
  page: 0,
  size: 20,
  total: mockSettlements.length,
  totalPages: 1
}

// Computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear + 1 - i)
})

const settlements = computed(() => {
  if (useMockData.value) {
    // 상태 필터 적용
    let filtered = [...mockSettlements]
    if (selectedStatus.value) {
      filtered = filtered.filter(s => s.status === selectedStatus.value)
    }
    // 검색어 필터 적용
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(s =>
        s.deliveryRequestNo.toLowerCase().includes(keyword) ||
        s.projectName.toLowerCase().includes(keyword)
      )
    }
    return filtered
  }
  return commissionStore.settlements
})
const pagination = computed(() => {
  if (useMockData.value) {
    return {
      ...mockPagination,
      total: settlements.value.length
    }
  }
  return commissionStore.settlementPagination
})

const totalCount = computed(() => pagination.value.total)
const pendingCount = computed(() =>
  settlements.value.filter(s => s.status === 'PENDING' || s.status === 'CALCULATED').length
)
const confirmedCount = computed(() =>
  settlements.value.filter(s => s.status === 'CONFIRMED' || s.status === 'PAID').length
)
const totalCommission = computed(() =>
  settlements.value.reduce((sum, s) => sum + s.commissionAmount, 0)
)

const isAllSelected = computed(() => {
  const selectableItems = settlements.value.filter(
    s => s.status !== 'CONFIRMED' && s.status !== 'PAID'
  )
  return selectableItems.length > 0 && selectedIds.value.length === selectableItems.length
})

// Methods
const loadSettlements = async () => {
  loading.value = true
  selectedIds.value = []
  try {
    // 목업 데이터 모드가 아닐 때만 실제 API 호출
    if (!useMockData.value) {
      await commissionStore.fetchSettlements({
        year: selectedYear.value,
        status: selectedStatus.value || undefined,
        search: searchKeyword.value || undefined,
        page: 0,
        size: 20
      })
    }
    // 목업 모드에서는 computed가 자동으로 필터링 처리함
  } catch (error) {
    console.error('정산 목록 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

const changePage = async (page: number) => {
  loading.value = true
  try {
    await commissionStore.fetchSettlements({
      year: selectedYear.value,
      status: selectedStatus.value || undefined,
      search: searchKeyword.value || undefined,
      page,
      size: 20
    })
  } finally {
    loading.value = false
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = settlements.value
      .filter(s => s.status !== 'CONFIRMED' && s.status !== 'PAID')
      .map(s => s.settlementId)
  }
}

const getStatusClass = (status: CommissionSettlementStatus): string => {
  const classMap: Record<CommissionSettlementStatus, string> = {
    PENDING: 'pending',
    CALCULATED: 'calculated',
    CONFIRMED: 'confirmed',
    PAID: 'paid'
  }
  return classMap[status] || 'pending'
}

const getStatusLabel = (status: CommissionSettlementStatus): string => {
  return COMMISSION_SETTLEMENT_STATUS_LABELS[status] || status
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const goToFundDetail = (fundId: number) => {
  router.push(`/admin/funds/${fundId}`)
}

const confirmSettlement = async (settlementId: number) => {
  if (!confirm('해당 정산 건을 확정하시겠습니까?')) return

  try {
    await commissionStore.confirmSettlement(settlementId)
    alert('정산이 확정되었습니다.')
    await loadSettlements()
  } catch (error) {
    console.error('정산 확정 실패:', error)
    alert('정산 확정에 실패했습니다.')
  }
}

const confirmSelectedSettlements = async () => {
  if (selectedIds.value.length === 0) return

  if (!confirm(`선택한 ${selectedIds.value.length}건의 정산을 확정하시겠습니까?`)) return

  try {
    await commissionStore.confirmSettlementBatch(selectedIds.value)
    alert('선택한 정산이 확정되었습니다.')
    selectedIds.value = []
    await loadSettlements()
  } catch (error) {
    console.error('일괄 확정 실패:', error)
    alert('일괄 확정에 실패했습니다.')
  }
}

const viewDetail = (settlement: CommissionSettlement) => {
  selectedSettlement.value = settlement
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSettlement.value = null
}

// Lifecycle
onMounted(() => {
  loadSettlements()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';
@import '@/assets/css/admin-modals.css';

/* 일괄 확정 버튼 */
.btn-confirm-batch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm-batch:hover:not(:disabled) {
  background: #059669;
}

.btn-confirm-batch:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* 검색 섹션 */
.search-section {
  background: white;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.filter-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #6b7280;
}

.filter-group.search {
  flex: 1;
}

.form-select {
  padding: 0.625rem 2rem 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 140px;
}

.search-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-search {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #2563eb;
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #3b82f6;
}

/* 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.summary-card.blue { border-left: 4px solid #3b82f6; }
.summary-card.amber { border-left: 4px solid #f59e0b; }
.summary-card.green { border-left: 4px solid #10b981; }
.summary-card.purple { border-left: 4px solid #8b5cf6; }

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  font-size: 1.25rem;
}

.summary-card.blue .card-icon { background: #eff6ff; color: #3b82f6; }
.summary-card.amber .card-icon { background: #fffbeb; color: #f59e0b; }
.summary-card.green .card-icon { background: #f0fdf4; color: #10b981; }
.summary-card.purple .card-icon { background: #faf5ff; color: #8b5cf6; }

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.card-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

/* 테이블 섹션 */
.table-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #3b82f6;
}

.table-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.settlement-table {
  width: 100%;
  border-collapse: collapse;
}

.settlement-table th {
  padding: 0.875rem 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.settlement-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.settlement-table tr.selected {
  background: #eff6ff;
}

.settlement-table tr:hover:not(.selected) {
  background: #f9fafb;
}

.col-checkbox { width: 40px; text-align: center; }
.col-no { width: 140px; }
.col-project { width: auto; }
.col-amount { width: 130px; }
.col-sales { width: 130px; }
.col-rate { width: 90px; }
.col-commission { width: 130px; }
.col-status { width: 90px; }
.col-date { width: 100px; }
.col-actions { width: 80px; }

.text-right { text-align: right; }
.text-center { text-align: center; }

/* 링크 */
.link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

/* 커미션율 뱃지 */
.rate-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  background: #f0fdf4;
  color: #059669;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 12px;
}

/* 커미션 금액 */
.commission-amount {
  font-weight: 600;
  color: #8b5cf6;
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.calculated {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.confirmed {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.paid {
  background: #f3e8ff;
  color: #9333ea;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.confirm {
  background: #dcfce7;
  color: #16a34a;
}

.btn-icon.confirm:hover {
  background: #10b981;
  color: white;
}

.btn-icon.view {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-icon.view:hover {
  background: #3b82f6;
  color: white;
}

/* 데이터 없음 */
.no-data {
  text-align: center;
  padding: 3rem 1rem !important;
  color: #9ca3af;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.no-data p {
  margin: 0;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.detail-item.full {
  grid-column: span 2;
}

.detail-item.highlight {
  background: #faf5ff;
  padding: 1rem;
  border-radius: 8px;
}

.detail-item label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.detail-item span {
  font-size: 0.9375rem;
  color: #1f2937;
}

.detail-item .amount {
  font-weight: 600;
}

.detail-item .rate {
  font-weight: 600;
  color: #059669;
}

.detail-item .commission {
  font-size: 1.25rem;
  font-weight: 700;
  color: #8b5cf6;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}

/* 반응형 */
@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item.full {
    grid-column: span 1;
  }
}
</style>
