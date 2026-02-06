<template>
  <div class="settlement-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="중간정산 관리"
      description="연중 중간정산 및 연말 최종정산을 관리합니다."
    >
      <template #actions>
        <div class="year-selector">
          <label class="year-label">조회 연도</label>
          <select v-model="selectedYear" class="form-select-year" @change="loadSettlements">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
      </template>
    </PageHeader>

    <!-- 안내 메시지 -->
    <div class="info-banner">
      <i class="fas fa-info-circle"></i>
      <div class="info-content">
        <strong>정산 안내</strong>
        <p>중간정산은 연중 수시로 실행 가능하며, 최종정산은 연말에 1회 실행됩니다. 정산 실행 시 해당 시점의 커미션 현황이 확정됩니다.</p>
      </div>
    </div>

    <!-- 정산 실행 섹션 -->
    <div class="settlement-action-section">
      <div class="section-header">
        <h3 class="section-title">
          <i class="fas fa-calculator"></i>
          정산 실행
        </h3>
      </div>

      <div class="action-cards">
        <!-- 중간정산 카드 -->
        <div class="action-card">
          <div class="card-icon mid">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="card-content">
            <h4 class="card-title">중간정산</h4>
            <p class="card-description">연중 수시 정산 실행</p>
            <button class="btn-action" @click="openCreateModal('MID')">
              <i class="fas fa-plus"></i>
              중간정산 실행
            </button>
          </div>
        </div>

        <!-- 최종정산 카드 -->
        <div class="action-card">
          <div class="card-icon final">
            <i class="fas fa-flag-checkered"></i>
          </div>
          <div class="card-content">
            <h4 class="card-title">최종정산</h4>
            <p class="card-description">연말 최종 정산 실행</p>
            <button class="btn-action" @click="openCreateModal('FINAL')">
              <i class="fas fa-check-circle"></i>
              최종정산 실행
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 정산 이력 섹션 -->
    <div class="settlement-history-section">
      <div class="section-header">
        <h3 class="section-title">
          <i class="fas fa-history"></i>
          정산 이력
        </h3>
        <div class="filter-group">
          <select v-model="filters.settlementType" class="form-select" @change="loadSettlements">
            <option value="">전체 유형</option>
            <option value="MID">중간정산</option>
            <option value="FINAL">최종정산</option>
          </select>
          <select v-model="filters.status" class="form-select" @change="loadSettlements">
            <option value="">전체 상태</option>
            <option value="PENDING">정산 대기</option>
            <option value="COMPLETED">정산 완료</option>
          </select>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>정산 이력을 불러오는 중...</p>
      </div>

      <!-- 정산 이력 테이블 -->
      <div v-else class="table-container">
        <table class="settlement-table">
          <thead>
            <tr>
              <th>정산일</th>
              <th>유형</th>
              <th>연도</th>
              <th>총 매출액</th>
              <th>총 커미션</th>
              <th>상태</th>
              <th>비고</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="settlements.length === 0">
              <td colspan="8" class="no-data">
                <i class="fas fa-inbox"></i>
                <p>정산 이력이 없습니다.</p>
              </td>
            </tr>
            <tr v-else v-for="settlement in settlements" :key="settlement.settlementId">
              <td>{{ formatDate(settlement.settlementDate) }}</td>
              <td>
                <span :class="['badge', `badge-${settlement.settlementType.toLowerCase()}`]">
                  {{ getSettlementTypeLabel(settlement.settlementType) }}
                </span>
              </td>
              <td>{{ settlement.year }}년</td>
              <td class="amount">{{ formatCurrency(settlement.totalSalesAmount) }}</td>
              <td class="amount">{{ formatCurrency(settlement.totalCommissionAmount) }}</td>
              <td>
                <span :class="['status-badge', `status-${settlement.status.toLowerCase()}`]">
                  {{ getStatusLabel(settlement.status) }}
                </span>
              </td>
              <td class="remarks">{{ settlement.remarks || '-' }}</td>
              <td>{{ formatDateTime(settlement.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이징 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="pagination.page === 1"
          @click="goToPage(pagination.page - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="pagination-info">
          {{ pagination.page }} / {{ pagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 정산 생성 모달 -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">
              <i :class="['fas', createForm.settlementType === 'MID' ? 'fa-calendar-check' : 'fa-flag-checkered']"></i>
              {{ createForm.settlementType === 'MID' ? '중간정산' : '최종정산' }} 실행
            </h3>
            <button class="btn-close" @click="closeCreateModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">정산일 <span class="required">*</span></label>
              <input
                v-model="createForm.settlementDate"
                type="date"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">비고</label>
              <textarea
                v-model="createForm.remarks"
                class="form-textarea"
                rows="3"
                placeholder="정산 관련 메모 입력"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeCreateModal">취소</button>
            <button class="btn-confirm" @click="createSettlement" :disabled="creating">
              <i v-if="creating" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-check"></i>
              {{ creating ? '처리 중...' : '정산 실행' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatCurrency, formatDate, formatDateTime } from '~/utils/format'
import {
  createPeriodicSettlement,
  getPeriodicSettlements
} from '~/services/commission.service'
import type {
  PeriodicSettlement,
  PeriodicSettlementType,
  PeriodicSettlementStatus,
  CreatePeriodicSettlementRequest
} from '~/types/commission'
import {
  PERIODIC_SETTLEMENT_TYPE_LABELS,
  PERIODIC_SETTLEMENT_STATUS_LABELS
} from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '중간정산 관리'
})

// State
const loading = ref(false)
const creating = ref(false)
const selectedYear = ref(new Date().getFullYear())
const settlements = ref<PeriodicSettlement[]>([])
const pagination = ref({
  page: 1,
  totalPages: 1,
  totalElements: 0
})

const filters = ref<{
  settlementType: PeriodicSettlementType | ''
  status: PeriodicSettlementStatus | ''
}>({
  settlementType: '',
  status: ''
})

const showCreateModal = ref(false)
const createForm = ref<CreatePeriodicSettlementRequest>({
  settlementType: 'MID',
  year: selectedYear.value,
  settlementDate: new Date().toISOString().split('T')[0],
  remarks: ''
})

// Computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

// Methods
const loadSettlements = async () => {
  loading.value = true
  try {
    const response = await getPeriodicSettlements({
      year: selectedYear.value,
      settlementType: filters.value.settlementType,
      status: filters.value.status,
      page: pagination.value.page - 1,
      size: 10,
      sort: 'settlementDate,desc'
    })

    settlements.value = response.content
    pagination.value = {
      page: response.number + 1,
      totalPages: response.totalPages,
      totalElements: response.totalElements
    }
  } catch (error) {
    console.error('정산 이력 조회 실패:', error)
    alert('정산 이력을 불러오는데 실패했습니다.')
  } finally {
    loading.value = false
  }
}

const openCreateModal = (type: PeriodicSettlementType) => {
  createForm.value = {
    settlementType: type,
    year: selectedYear.value,
    settlementDate: new Date().toISOString().split('T')[0],
    remarks: ''
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const createSettlement = async () => {
  if (!createForm.value.settlementDate) {
    alert('정산일을 입력해주세요.')
    return
  }

  creating.value = true
  try {
    await createPeriodicSettlement(createForm.value)
    alert('정산이 실행되었습니다.')
    closeCreateModal()
    loadSettlements()
  } catch (error) {
    console.error('정산 실행 실패:', error)
    alert('정산 실행에 실패했습니다.')
  } finally {
    creating.value = false
  }
}

const goToPage = (page: number) => {
  pagination.value.page = page
  loadSettlements()
}

const getSettlementTypeLabel = (type: PeriodicSettlementType): string => {
  return PERIODIC_SETTLEMENT_TYPE_LABELS[type]
}

const getStatusLabel = (status: PeriodicSettlementStatus): string => {
  return PERIODIC_SETTLEMENT_STATUS_LABELS[status]
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

/* 연도 선택 */
.year-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.year-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select-year {
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  background: white;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select-year:hover {
  border-color: #3b82f6;
}

.form-select-year:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 안내 배너 */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 1.5rem;
}

.info-banner > i {
  font-size: 1.25rem;
  color: #3b82f6;
  margin-top: 0.125rem;
}

.info-content strong {
  display: block;
  color: #1e40af;
  margin-bottom: 0.375rem;
}

.info-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #3b82f6;
  line-height: 1.5;
}

/* 정산 실행 섹션 */
.settlement-action-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #3b82f6;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
}

.action-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  font-size: 1.5rem;
  color: white;
}

.card-icon.mid {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-icon.final {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.card-description {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* 정산 이력 섹션 */
.settlement-history-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-group {
  display: flex;
  gap: 0.75rem;
}

.form-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select:hover {
  border-color: #3b82f6;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 테이블 */
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
  padding: 0.875rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.settlement-table td {
  padding: 0.875rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  vertical-align: middle;
}

.settlement-table tr:hover:not(:has(.no-data)) {
  background: #f9fafb;
}

.amount {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  color: #1f2937;
}

.remarks {
  color: #6b7280;
  font-size: 0.8125rem;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 뱃지 */
.badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-mid {
  background: #d1fae5;
  color: #065f46;
}

.badge-final {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
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

/* 로딩 */
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

/* 페이징 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
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

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 768px) {
  .action-cards {
    grid-template-columns: 1fr;
  }

  .filter-group {
    flex-direction: column;
  }

  .form-select {
    width: 100%;
  }
}
</style>
