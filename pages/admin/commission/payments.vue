<template>
  <div class="commission-payments">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션 지급 관리"
      description="커미션 지급 이력을 조회하고 관리합니다."
    >
      <template #actions>
        <button class="btn-add-payment" @click="openCreateModal">
          <i class="fas fa-plus"></i>
          지급 등록
        </button>
      </template>
    </PageHeader>

    <!-- 검색 필터 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>조회 연도</label>
          <select v-model="selectedYear" class="form-select" @change="loadPayments">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>상태</label>
          <select v-model="selectedStatus" class="form-select" @change="loadPayments">
            <option value="">전체</option>
            <option value="SCHEDULED">지급 예정</option>
            <option value="PROCESSING">처리 중</option>
            <option value="COMPLETED">지급 완료</option>
            <option value="CANCELLED">취소</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <p>지급 목록을 불러오는 중...</p>
    </div>

    <div v-else class="content-section">
      <!-- 요약 정보 -->
      <div class="summary-bar">
        <div class="summary-item">
          <span class="summary-label">전체 지급 건수</span>
          <span class="summary-value">{{ payments.length }}건</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">총 지급 예정</span>
          <span class="summary-value scheduled">{{ formatCurrency(totalScheduled) }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <span class="summary-label">지급 완료</span>
          <span class="summary-value completed">{{ formatCurrency(totalPaid) }}</span>
        </div>
      </div>

      <!-- 지급 목록 -->
      <div class="payment-list">
        <div v-if="payments.length === 0" class="empty-state">
          <i class="fas fa-credit-card"></i>
          <p>지급 이력이 없습니다.</p>
          <button class="btn-add-first" @click="openCreateModal">
            <i class="fas fa-plus"></i>
            첫 번째 지급 등록
          </button>
        </div>

        <div
          v-else
          v-for="payment in payments"
          :key="payment.paymentId"
          class="payment-card"
          :class="getStatusClass(payment.status)"
        >
          <div class="payment-header">
            <div class="payment-seq">
              <span class="seq-badge">{{ payment.paymentSeq }}차</span>
              <span :class="['status-badge', getStatusClass(payment.status)]">
                {{ getStatusLabel(payment.status) }}
              </span>
            </div>
            <div class="payment-date">
              <i class="fas fa-calendar-alt"></i>
              {{ payment.status === 'COMPLETED' ? formatDate(payment.paidDate!) : formatDate(payment.scheduledDate) }}
              <span v-if="payment.status !== 'COMPLETED'" class="date-type">(예정)</span>
            </div>
          </div>

          <div class="payment-body">
            <div class="amount-section">
              <div class="amount-row">
                <span class="amount-label">지급 예정 금액</span>
                <span class="amount-value">{{ formatCurrency(payment.scheduledAmount) }}</span>
              </div>
              <div v-if="payment.paidAmount" class="amount-row actual">
                <span class="amount-label">실제 지급 금액</span>
                <span class="amount-value">{{ formatCurrency(payment.paidAmount) }}</span>
              </div>
            </div>

            <div class="info-section">
              <div class="info-row">
                <i class="fas fa-user"></i>
                <span>{{ payment.recipientName || '-' }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-university"></i>
                <span>{{ payment.bankName || '-' }} {{ payment.bankAccount || '' }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-file-alt"></i>
                <span>정산 {{ payment.settlementCount }}건 포함</span>
              </div>
            </div>

            <div v-if="payment.remarks" class="remarks-section">
              <i class="fas fa-sticky-note"></i>
              {{ payment.remarks }}
            </div>
          </div>

          <div class="payment-actions">
            <button
              v-if="payment.status === 'SCHEDULED' || payment.status === 'PROCESSING'"
              class="btn-action complete"
              @click="openCompleteModal(payment)"
            >
              <i class="fas fa-check"></i>
              지급 완료
            </button>
            <button
              v-if="payment.status === 'SCHEDULED'"
              class="btn-action cancel"
              @click="cancelPayment(payment.paymentId)"
            >
              <i class="fas fa-times"></i>
              취소
            </button>
            <button class="btn-action view" @click="viewDetail(payment)">
              <i class="fas fa-eye"></i>
              상세
            </button>
          </div>
        </div>
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

    <!-- 지급 등록 모달 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateModal" class="ccm-modal-overlay" @click.self="closeCreateModal">
          <div class="ccm-modal-container ccm-modal-medium">
            <div class="ccm-modal-header">
              <div class="ccm-header-content">
                <div class="ccm-header-icon ccm-icon-purple">
                  <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="ccm-header-text">
                  <h3 class="ccm-modal-title">커미션 지급 등록</h3>
                  <span class="ccm-modal-subtitle">지급 정보를 입력해주세요</span>
                </div>
              </div>
              <button class="ccm-close-button" @click="closeCreateModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="ccm-modal-body">
              <div class="ccm-form">
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">지급 예정 금액</label>
                  <div class="ccm-amount-wrapper">
                    <input
                      v-model.number="createForm.scheduledAmount"
                      type="number"
                      class="ccm-form-input ccm-amount-input"
                      placeholder="0"
                      min="0"
                    />
                    <span class="ccm-input-suffix">원</span>
                  </div>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">지급 예정일</label>
                  <input
                    v-model="createForm.scheduledDate"
                    type="date"
                    class="ccm-form-input ccm-date-input"
                  />
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    수취인
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <input
                    v-model="createForm.recipientName"
                    type="text"
                    class="ccm-form-input"
                    placeholder="수취인 이름"
                  />
                </div>
                <div class="ccm-form-row">
                  <div class="ccm-form-group">
                    <label class="ccm-form-label">은행명</label>
                    <input
                      v-model="createForm.bankName"
                      type="text"
                      class="ccm-form-input"
                      placeholder="은행명"
                    />
                  </div>
                  <div class="ccm-form-group">
                    <label class="ccm-form-label">계좌번호</label>
                    <input
                      v-model="createForm.bankAccount"
                      type="text"
                      class="ccm-form-input"
                      placeholder="계좌번호"
                    />
                  </div>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    비고
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <textarea
                    v-model="createForm.remarks"
                    class="ccm-form-input ccm-textarea"
                    placeholder="비고 사항을 입력해주세요"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
            <div class="ccm-modal-footer">
              <button class="ccm-btn-cancel" @click="closeCreateModal">취소</button>
              <button class="ccm-btn-confirm ccm-purple" @click="submitCreate" :disabled="!isCreateFormValid">
                <i class="fas fa-save"></i>
                등록
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 지급 완료 모달 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCompleteModal" class="ccm-modal-overlay" @click.self="closeCompleteModal">
          <div class="ccm-modal-container">
            <div class="ccm-modal-header">
              <div class="ccm-header-content">
                <div class="ccm-header-icon ccm-icon-green">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="ccm-header-text">
                  <h3 class="ccm-modal-title">지급 완료 처리</h3>
                  <span class="ccm-modal-subtitle">실제 지급 정보를 입력해주세요</span>
                </div>
              </div>
              <button class="ccm-close-button" @click="closeCompleteModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="ccm-modal-body">
              <div class="ccm-amount-info-card">
                <div class="ccm-amount-row">
                  <span class="ccm-amount-label">지급 예정 금액</span>
                  <span class="ccm-amount-value">{{ formatCurrency(selectedPayment?.scheduledAmount || 0) }}</span>
                </div>
              </div>
              <div class="ccm-form">
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">실제 지급 금액</label>
                  <div class="ccm-amount-wrapper">
                    <input
                      v-model.number="completeForm.paidAmount"
                      type="number"
                      class="ccm-form-input ccm-amount-input"
                      placeholder="0"
                      min="0"
                    />
                    <span class="ccm-input-suffix">원</span>
                  </div>
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">실제 지급일</label>
                  <input
                    v-model="completeForm.paidDate"
                    type="date"
                    class="ccm-form-input ccm-date-input"
                  />
                </div>
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    비고
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <textarea
                    v-model="completeForm.remarks"
                    class="ccm-form-input ccm-textarea"
                    placeholder="비고 사항을 입력해주세요"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
            <div class="ccm-modal-footer">
              <button class="ccm-btn-cancel" @click="closeCompleteModal">취소</button>
              <button class="ccm-btn-confirm ccm-green" @click="submitComplete" :disabled="!isCompleteFormValid">
                <i class="fas fa-check"></i>
                완료 처리
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
import { useCommissionStore } from '~/stores/commission'
import { useCommissionFilter } from '~/composables/admin/useCommissionFilter'
import { formatCurrency, formatDate } from '~/utils/format'
import type { CommissionPayment, CommissionPaymentStatus, CommissionPaymentCreateRequest, CommissionPaymentCompleteRequest } from '~/types/commission'
import { COMMISSION_PAYMENT_STATUS_LABELS } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 지급 관리'
})

const commissionStore = useCommissionStore()

// 페이지 고유 상태
const selectedStatus = ref<CommissionPaymentStatus | ''>('')
const showCreateModal = ref(false)
const showCompleteModal = ref(false)
const selectedPayment = ref<CommissionPayment | null>(null)

// 공통 필터 (연도, 로딩, 데이터 로드)
const { selectedYear, loading, availableYears, loadData: loadPaymentsData } = useCommissionFilter({
  loadFunction: async () => {
    await commissionStore.fetchPayments(selectedYear.value, {
      status: selectedStatus.value || undefined,
      page: 0,
      size: 20
    })
  }
})

const createForm = ref<CommissionPaymentCreateRequest>({
  year: new Date().getFullYear(),
  scheduledAmount: 0,
  scheduledDate: '',
  settlementIds: [],
  recipientName: '',
  bankAccount: '',
  bankName: '',
  remarks: ''
})

const completeForm = ref<CommissionPaymentCompleteRequest>({
  paidAmount: 0,
  paidDate: '',
  remarks: ''
})

const payments = computed(() => {
  return commissionStore.payments
})

const pagination = computed(() => {
  return commissionStore.paymentPagination
})

const totalScheduled = computed(() =>
  payments.value.reduce((sum, p) => sum + p.scheduledAmount, 0)
)

const totalPaid = computed(() =>
  payments.value
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0)
)

const isCreateFormValid = computed(() =>
  createForm.value.scheduledAmount > 0 && createForm.value.scheduledDate
)

const isCompleteFormValid = computed(() =>
  completeForm.value.paidAmount > 0 && completeForm.value.paidDate
)

// Methods
const loadPayments = () => loadPaymentsData()

const changePage = async (page: number) => {
  loading.value = true
  try {
    await commissionStore.fetchPayments(selectedYear.value, {
      status: selectedStatus.value || undefined,
      page,
      size: 20
    })
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status: CommissionPaymentStatus): string => {
  const classMap: Record<CommissionPaymentStatus, string> = {
    SCHEDULED: 'scheduled',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  }
  return classMap[status] || 'scheduled'
}

const getStatusLabel = (status: CommissionPaymentStatus): string => {
  return COMMISSION_PAYMENT_STATUS_LABELS[status] || status
}

const openCreateModal = () => {
  createForm.value = {
    year: selectedYear.value,
    scheduledAmount: 0,
    scheduledDate: new Date().toISOString().split('T')[0],
    settlementIds: [],
    recipientName: '',
    bankAccount: '',
    bankName: '',
    remarks: ''
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const submitCreate = async () => {
  if (!isCreateFormValid.value) return

  try {
    await commissionStore.createPayment(selectedYear.value, createForm.value)
    alert('지급이 등록되었습니다.')
    closeCreateModal()
    await loadPayments()
  } catch (error) {
    console.error('지급 등록 실패:', error)
    alert('지급 등록에 실패했습니다.')
  }
}

const openCompleteModal = (payment: CommissionPayment) => {
  selectedPayment.value = payment
  completeForm.value = {
    paidAmount: payment.scheduledAmount,
    paidDate: new Date().toISOString().split('T')[0],
    remarks: ''
  }
  showCompleteModal.value = true
}

const closeCompleteModal = () => {
  showCompleteModal.value = false
  selectedPayment.value = null
}

const submitComplete = async () => {
  if (!selectedPayment.value || !isCompleteFormValid.value) return

  try {
    await commissionStore.completePayment(selectedPayment.value.paymentId, completeForm.value)
    alert('지급 완료 처리되었습니다.')
    closeCompleteModal()
    await loadPayments()
  } catch (error) {
    console.error('지급 완료 처리 실패:', error)
    alert('처리에 실패했습니다.')
  }
}

const cancelPayment = async (paymentId: number) => {
  if (!confirm('해당 지급을 취소하시겠습니까?')) return

  try {
    await commissionStore.cancelPayment(paymentId)
    alert('지급이 취소되었습니다.')
    await loadPayments()
  } catch (error) {
    console.error('지급 취소 실패:', error)
    alert('취소에 실패했습니다.')
  }
}

const viewDetail = (payment: CommissionPayment) => {
  // 상세 모달 또는 페이지 이동
  console.log('View detail:', payment)
}

// Lifecycle
onMounted(() => {
  loadPayments()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

/* 지급 등록 버튼 */
.btn-add-payment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-payment:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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

.form-select {
  padding: 0.625rem 2rem 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 140px;
}

/* 로딩 컨테이너 - 색상 커스터마이징 */
.loading-container i {
  color: #8b5cf6;
}

/* 요약 바 */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.summary-value.scheduled { color: #f59e0b; }
.summary-value.completed { color: #10b981; }

.summary-divider {
  width: 1px;
  height: 40px;
  background: #e5e7eb;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #9ca3af;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.btn-add-first {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-first:hover {
  background: #7c3aed;
}

/* 지급 카드 목록 */
.payment-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border-left: 4px solid transparent;
}

.payment-card.scheduled { border-left-color: #f59e0b; }
.payment-card.processing { border-left-color: #3b82f6; }
.payment-card.completed { border-left-color: #10b981; }
.payment-card.cancelled { border-left-color: #6b7280; }

.payment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.payment-seq {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.seq-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  background: #1f2937;
  color: white;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 6px;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 12px;
}

.status-badge.scheduled {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.processing {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.completed {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.payment-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.date-type {
  font-size: 0.75rem;
  color: #9ca3af;
}

.payment-body {
  padding: 1.25rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1.5rem;
}

.amount-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.amount-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.amount-label {
  font-size: 0.8125rem;
  color: #6b7280;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.amount-row.actual .amount-value {
  color: #10b981;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.info-row i {
  width: 16px;
  color: #9ca3af;
}

.remarks-section {
  grid-column: span 3;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.remarks-section i {
  color: #f59e0b;
  margin-top: 0.125rem;
}

.payment-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action.complete {
  background: #dcfce7;
  border-color: #86efac;
  color: #16a34a;
}

.btn-action.complete:hover {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.btn-action.cancel {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-action.cancel:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.btn-action.view {
  background: white;
  border-color: #d1d5db;
  color: #6b7280;
}

.btn-action.view:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* 페이지네이션 - 커스터마이징 */
.pagination {
  padding-top: 1.5rem;
}

.page-btn:hover:not(:disabled) {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

/* 모달 - 보라색 확인 버튼 변형 */
.ccm-btn-confirm.ccm-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.ccm-btn-confirm.ccm-purple:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

/* 모달 폼 입력 보라색 포커스 */
.ccm-form-input:focus {
  border-color: #8b5cf6;
  box-shadow:
    0 0 0 3px rgba(139, 92, 246, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 모달 내 2컬럼 그리드 */
.ccm-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .payment-body {
    grid-template-columns: 1fr;
  }

  .remarks-section {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .summary-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .summary-divider {
    width: 100%;
    height: 1px;
  }

  .ccm-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
