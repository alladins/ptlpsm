<template>
  <div class="commission-settlements">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션 정산 이력"
      icon="chart"
      icon-color="purple"
      description="계약별 커미션 정산 현황을 조회하고 관리합니다."
    >
      <template #actions>
        <button
          class="btn-confirm-batch"
          :disabled="selectedIds.length === 0"
          @click="confirmSelectedSettlements"
        >
          <i class="fas fa-check-double" />
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
            <option value="">
              전체
            </option>
            <option value="PENDING">
              정산 대기
            </option>
            <option value="CALCULATED">
              계산 완료
            </option>
            <option value="CONFIRMED">
              확정
            </option>
            <option value="PAID">
              지급 완료
            </option>
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
            >
            <button class="btn-search" @click="loadSettlements">
              <i class="fas fa-search" />
            </button>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn-excel" @click="handleExcelDownload">
            <i class="fas fa-file-excel" />
            엑셀
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>정산 목록을 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 요약 카드 -->
      <div class="summary-cards">
        <div class="summary-card blue">
          <div class="card-icon">
            <i class="fas fa-list-alt" />
          </div>
          <div class="card-content">
            <span class="card-label">전체 정산</span>
            <span class="card-value">{{ totalCount }}건</span>
          </div>
        </div>
        <div class="summary-card amber">
          <div class="card-icon">
            <i class="fas fa-clock" />
          </div>
          <div class="card-content">
            <span class="card-label">정산 대기</span>
            <span class="card-value">{{ pendingCount }}건</span>
          </div>
        </div>
        <div class="summary-card green">
          <div class="card-icon">
            <i class="fas fa-check-circle" />
          </div>
          <div class="card-content">
            <span class="card-label">확정/지급</span>
            <span class="card-value">{{ confirmedCount }}건</span>
          </div>
        </div>
        <div class="summary-card purple">
          <div class="card-icon">
            <i class="fas fa-coins" />
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
            <i class="fas fa-table" />
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
                  <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll">
                </th>
                <th class="col-no">
                  납품요구번호
                </th>
                <th class="col-project">
                  현장명
                </th>
                <th class="col-sales">
                  매출액
                </th>
                <th class="col-tier">
                  구간
                </th>
                <th class="col-dist oem">
                  제조사(OEM)
                </th>
                <th class="col-dist ceo">
                  본사(대표)
                </th>
                <th class="col-dist eco">
                  에코암스
                </th>
                <th class="col-dist sales">
                  영업담당자
                </th>
                <th class="col-dist certification">
                  인증관리
                </th>
                <th class="col-dist maintenance">
                  유지보수
                </th>
                <th class="col-status">
                  상태
                </th>
                <th class="col-actions">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="settlements.length === 0">
                <td colspan="13" class="no-data">
                  <div class="empty-guide">
                    <i class="fas fa-file-invoice-dollar" />
                    <p class="empty-title">
                      정산 이력이 없습니다
                    </p>
                    <p class="empty-desc">
                      자금관리에서 입금 확인(선급금/기성금/잔금) 처리 시<br>
                      커미션 정산이 자동으로 생성됩니다.
                    </p>
                    <NuxtLink to="/admin/fund" class="btn-guide-link">
                      <i class="fas fa-arrow-right" />
                      자금 관리 바로가기
                    </NuxtLink>
                  </div>
                </td>
              </tr>
              <tr
                v-for="settlement in settlements"
                v-else
                :key="settlement.settlementId"
                :class="{ selected: selectedIds.includes(settlement.settlementId) }"
              >
                <td class="col-checkbox">
                  <input
                    v-model="selectedIds"
                    type="checkbox"
                    :value="settlement.settlementId"
                    :disabled="settlement.status === 'CONFIRMED' || settlement.status === 'PAID'"
                  >
                </td>
                <td class="col-no">
                  <a href="#" class="link" @click.prevent="goToFundDetail(settlement.fundId)">
                    {{ settlement.deliveryRequestNo }}
                  </a>
                </td>
                <td class="col-project">
                  {{ settlement.projectName }}
                </td>
                <td class="col-sales text-right">
                  {{ formatCurrency(settlement.salesAmount) }}
                </td>
                <td class="col-tier text-center">
                  <span class="tier-badge-sm">{{ settlement.appliedTier || '-' }}</span>
                </td>
                <!-- 제조사(OEM) 분배율/금액 -->
                <td class="col-dist text-right oem">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedOemRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.oemAmount || 0) }}</span>
                  </div>
                </td>
                <!-- 본사(대표) 분배율/금액 -->
                <td class="col-dist text-right ceo">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedCeoRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.ceoAmount || 0) }}</span>
                  </div>
                </td>
                <!-- 에코암스 분배율/금액 -->
                <td class="col-dist text-right eco">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedEcoarmsRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.ecoarmsAmount || 0) }}</span>
                  </div>
                </td>
                <!-- 영업담당자 분배율/금액 -->
                <td class="col-dist text-right sales">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedSalesRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.salesRepAmount || 0) }}</span>
                  </div>
                </td>
                <!-- 인증관리 분배율/금액 -->
                <td class="col-dist text-right certification">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedCertificationRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.certificationAmount || 0) }}</span>
                  </div>
                </td>
                <!-- 유지보수 분배율/금액 -->
                <td class="col-dist text-right maintenance">
                  <div class="dist-cell">
                    <span class="dist-rate">{{ settlement.appliedMaintenanceRate || 0 }}%</span>
                    <span class="dist-amount">{{ formatCurrency(settlement.maintenanceAmount || 0) }}</span>
                  </div>
                </td>
                <td class="col-status text-center">
                  <span :class="['status-badge', getStatusClass(settlement.status)]">
                    {{ getStatusLabel(settlement.status) }}
                  </span>
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button
                      v-if="settlement.status === 'PENDING' || settlement.status === 'CALCULATED'"
                      class="btn-icon confirm"
                      title="확정"
                      @click="confirmSettlement(settlement.settlementId)"
                    >
                      <i class="fas fa-check" />
                    </button>
                    <button
                      class="btn-icon view"
                      title="상세보기"
                      @click="viewDetail(settlement)"
                    >
                      <i class="fas fa-eye" />
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
            <i class="fas fa-chevron-left" />
          </button>
          <span class="page-info">
            {{ pagination.page + 1 }} / {{ pagination.totalPages }}
          </span>
          <button
            class="page-btn"
            :disabled="pagination.page >= pagination.totalPages - 1"
            @click="changePage(pagination.page + 1)"
          >
            <i class="fas fa-chevron-right" />
          </button>
        </div>
      </div>
    </div>

    <!-- 상세보기 + 비고 수정 모달 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDetailModal" class="ccm-modal-overlay" @click.self="closeDetailModal">
          <div class="ccm-modal-container ccm-modal-medium">
            <div class="ccm-modal-header">
              <div class="ccm-header-content">
                <div class="ccm-header-icon ccm-icon-purple">
                  <i class="fas fa-file-invoice-dollar" />
                </div>
                <div class="ccm-header-text">
                  <h3 class="ccm-modal-title">
                    정산 상세 정보
                  </h3>
                  <span class="ccm-modal-subtitle">커미션 정산 상세 내역</span>
                </div>
              </div>
              <button class="ccm-close-button" @click="closeDetailModal">
                <i class="fas fa-times" />
              </button>
            </div>
            <div v-if="selectedSettlement" class="ccm-modal-body">
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
                  <label>적용 구간</label>
                  <span>{{ selectedSettlement.appliedTier || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>OEM ({{ selectedSettlement.appliedOemRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.oemAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <label>CEO ({{ selectedSettlement.appliedCeoRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.ceoAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <label>에코암스 ({{ selectedSettlement.appliedEcoarmsRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.ecoarmsAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <label>영업 ({{ selectedSettlement.appliedSalesRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.salesRepAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <label>인증관리 ({{ selectedSettlement.appliedCertificationRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.certificationAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <label>유지보수 ({{ selectedSettlement.appliedMaintenanceRate || 0 }}%)</label>
                  <span class="amount">{{ formatCurrency(selectedSettlement.maintenanceAmount || 0) }}</span>
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
                <!-- 비고 (인라인 수정) -->
                <div class="detail-item full">
                  <label>비고</label>
                  <textarea
                    v-model="remarksText"
                    class="remarks-textarea"
                    placeholder="비고 사항을 입력해주세요"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            <div class="ccm-modal-footer">
              <button class="ccm-btn-cancel" @click="closeDetailModal">
                닫기
              </button>
              <button
                class="ccm-btn-confirm ccm-purple"
                :disabled="remarksSubmitting"
                @click="submitRemarksAndClose"
              >
                <i v-if="remarksSubmitting" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-save" />
                비고 저장
              </button>
              <button
                v-if="selectedSettlement && (selectedSettlement.status === 'PENDING' || selectedSettlement.status === 'CALCULATED')"
                class="ccm-btn-confirm"
                @click="confirmSettlement(selectedSettlement.settlementId); closeDetailModal()"
              >
                <i class="fas fa-check" />
                확정
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useCommissionStore } from '~/stores/commission'
import { useCommissionFilter } from '~/composables/admin/useCommissionFilter'
import { formatCurrency, formatDate } from '~/utils/format'
import { updateSettlementRemarks, exportSettlementsExcel } from '~/services/commission.service'
import type { CommissionSettlement, CommissionSettlementStatus } from '~/types/commission'
import { COMMISSION_SETTLEMENT_STATUS_LABELS } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 정산 이력'
})

const router = useRouter()
const commissionStore = useCommissionStore()

// 페이지 고유 상태
const selectedStatus = ref<CommissionSettlementStatus | ''>('')
const searchKeyword = ref('')
const selectedIds = ref<number[]>([])
const showDetailModal = ref(false)
const selectedSettlement = ref<CommissionSettlement | null>(null)

// 공통 필터 (연도, 로딩, 데이터 로드)
const { selectedYear, loading, availableYears, loadData: loadSettlementsData } = useCommissionFilter({
  loadFunction: async () => {
    selectedIds.value = []
    await commissionStore.fetchSettlements({
      year: selectedYear.value,
      status: selectedStatus.value || undefined,
      search: searchKeyword.value || undefined,
      page: 0,
      size: 20
    })
  }
})

const settlements = computed(() => {
  return commissionStore.settlements
})

const pagination = computed(() => {
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
const loadSettlements = () => loadSettlementsData()

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

const goToFundDetail = (fundId: number) => {
  router.push(`/admin/funds/${fundId}`)
}

const confirmSettlement = async (settlementId: number) => {
  if (!confirm('해당 정산 건을 확정하시겠습니까?')) { return }

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
  if (selectedIds.value.length === 0) { return }

  if (!confirm(`선택한 ${selectedIds.value.length}건의 정산을 확정하시겠습니까?`)) { return }

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

// ============ 상세보기 + 비고 수정 (통합) ============
const remarksText = ref('')
const remarksSubmitting = ref(false)

const viewDetail = (settlement: CommissionSettlement) => {
  selectedSettlement.value = settlement
  remarksText.value = settlement.remarks || ''
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedSettlement.value = null
  remarksText.value = ''
}

/** 비고 저장 후 모달 닫기 */
const submitRemarksAndClose = async () => {
  if (!selectedSettlement.value || remarksSubmitting.value) { return }
  // 비고가 변경되지 않았으면 그냥 닫기
  if (remarksText.value === (selectedSettlement.value.remarks || '')) {
    closeDetailModal()
    return
  }
  remarksSubmitting.value = true
  try {
    await updateSettlementRemarks(selectedSettlement.value.settlementId, remarksText.value)
    alert('비고가 저장되었습니다.')
    closeDetailModal()
    loadSettlements()
  } catch (error) {
    console.error('비고 저장 실패:', error)
    alert('비고 저장에 실패했습니다.')
  } finally {
    remarksSubmitting.value = false
  }
}

// ============ 엑셀 내보내기 ============
const handleExcelDownload = async () => {
  try {
    await exportSettlementsExcel(selectedYear.value, {
      status: selectedStatus.value || undefined,
      search: searchKeyword.value || undefined
    })
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  }
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

/* 로딩 컨테이너 - 색상 커스터마이징 */
.loading-container i {
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

/* 컬럼 너비 */
.col-checkbox { width: 40px; text-align: center; }
.col-no { width: 140px; }
.col-project { width: auto; }
.col-sales { width: 120px; }
.col-status { width: 90px; }
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

.btn-icon.edit {
  background: #fef3c7;
  color: #d97706;
}

.btn-icon.edit:hover {
  background: #f59e0b;
  color: white;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-left: auto;
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

/* 빈 화면 안내 가이드 */
.empty-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
}

.empty-guide i {
  font-size: 2.5rem;
  color: #cbd5e1;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.empty-desc {
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* 자금관리 바로가기 버튼 */
.btn-guide-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border-radius: 6px;
  font-size: 0.85rem;
  text-decoration: none;
  margin-top: 8px;
  transition: background 0.2s;
}

.btn-guide-link:hover {
  background: #4f46e5;
}

/* 구간 컬럼 */
.col-tier {
  min-width: 80px;
}

/* 구간 뱃지 */
.tier-badge-sm {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
}

/* 분배 컬럼 */
.col-dist {
  min-width: 100px;
}

/* 분배 셀 (비율 + 금액 세로 배치) */
.dist-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dist-rate {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.dist-amount {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

/* 분배 금액 색상 (담당자별 구분) */
.col-dist.oem .dist-amount { color: #4f46e5; }
.col-dist.ceo .dist-amount { color: #2563eb; }
.col-dist.eco .dist-amount { color: #059669; }
.col-dist.sales .dist-amount { color: #d97706; }

/* 페이지네이션 - 커스터마이징 */
.pagination {
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
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

/* 비고 textarea */
.remarks-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
}

.remarks-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* 모달 푸터 및 버튼 - admin-modals.css/admin-buttons.css 사용 (중복 제거됨) */
/* 페이지 전용 색상 커스터마이징 */
.btn-primary {
  background: #3b82f6;
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
