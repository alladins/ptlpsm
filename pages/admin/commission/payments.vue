<template>
  <div class="commission-payments">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="커미션 지급 관리"
      icon="chart"
      icon-color="purple"
      description="커미션 지급 이력을 조회하고 관리합니다."
    />

    <!-- 검색 필터 -->
    <div class="search-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>연도</label>
          <select v-model="selectedYear" class="form-select" @change="loadData">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>수령자</label>
          <select v-model="filterRecipientType" class="form-select" @change="loadData">
            <option value="">
              전체
            </option>
            <option value="OEM">
              제조사(OEM)
            </option>
            <option value="CEO">
              본사(대표)
            </option>
            <option value="ECOARMS">
              에코암스
            </option>
            <option value="SALES_REP">
              영업담당자
            </option>
            <option value="CERTIFICATION">
              인증관리
            </option>
            <option value="MAINTENANCE">
              유지보수
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>상태</label>
          <select v-model="filterStatus" class="form-select" @change="loadData">
            <option value="">
              전체
            </option>
            <option value="PAID">
              지급완료
            </option>
            <option value="DEDUCTED">
              차감완료
            </option>
            <option value="CANCELLED">
              취소
            </option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn-excel" @click="handleExcelDownload">
            <i class="fas fa-file-excel" />
            엑셀
          </button>
          <button class="btn-add-payment" @click="openCreateModal">
            <i class="fas fa-plus" />
            지급 등록
          </button>
        </div>
      </div>
    </div>

    <!-- 요약바 -->
    <div class="summary-bar">
      <div class="summary-item">
        <span class="summary-label">전체</span>
        <span class="summary-value">{{ allPayments.length }}건</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-item">
        <span class="summary-label">총 지급</span>
        <span class="summary-value total">{{ formatCurrency(summaryTotalPaid) }}</span>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin" />
      <p>지급 목록을 불러오는 중...</p>
    </div>

    <!-- 테이블 -->
    <div v-else-if="allPayments.length > 0" class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>지급일</th>
            <th>수령자유형</th>
            <th>수령자명</th>
            <th class="text-right">
              금액
            </th>
            <th>상태</th>
            <th>비고</th>
            <th class="text-center">
              관리
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in allPayments" :key="payment.paymentId">
            <td>{{ formatDate(payment.paymentDate) }}</td>
            <td>
              <span :class="['recipient-badge', getRecipientClass(payment.recipientType)]">
                {{ getRecipientLabel(payment.recipientType) }}
              </span>
            </td>
            <td>{{ payment.recipientName }}</td>
            <td class="text-right amount-cell">
              {{ formatCurrency(payment.paymentAmount) }}
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(payment.status)]">
                {{ getStatusLabel(payment.status) }}
              </span>
            </td>
            <td class="remarks-cell">
              {{ payment.remarks || '-' }}
            </td>
            <td class="text-center actions-cell">
              <button
                class="btn-table-action edit"
                :disabled="!canEdit(payment)"
                title="수정"
                @click="openEditModal(payment)"
              >
                <i class="fas fa-pen" />
              </button>
              <button
                class="btn-table-action delete"
                :disabled="!canDelete(payment)"
                title="삭제"
                @click="handleDelete(payment)"
              >
                <i class="fas fa-trash-alt" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-state">
      <i class="fas fa-receipt" />
      <p>지급 이력이 없습니다.</p>
    </div>

    <!-- ===================== 등록/수정 모달 ===================== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="ccm-modal-overlay" @click.self="closeModal">
          <div class="ccm-modal-container ccm-modal-medium">
            <div class="ccm-modal-header">
              <div class="ccm-header-content">
                <div class="ccm-header-icon ccm-icon-purple">
                  <i class="fas fa-credit-card" />
                </div>
                <div class="ccm-header-text">
                  <h3 class="ccm-modal-title">
                    {{ modalTitle }}
                  </h3>
                  <span class="ccm-modal-subtitle">{{ modalSubtitle }}</span>
                </div>
              </div>
              <button class="ccm-close-button" @click="closeModal">
                <i class="fas fa-times" />
              </button>
            </div>
            <div class="ccm-modal-body">
              <div class="ccm-form">
                <!-- 수령자 유형 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">수령자 유형</label>
                  <select
                    v-model="form.recipientType"
                    class="ccm-form-input"
                    :disabled="isEditMode"
                    @change="onRecipientTypeChange"
                  >
                    <option value="">
                      선택하세요
                    </option>
                    <option value="OEM">
                      제조사(OEM)
                    </option>
                    <option value="CEO">
                      본사(대표)
                    </option>
                    <option value="ECOARMS">
                      에코암스
                    </option>
                    <option value="SALES_REP">
                      영업담당자
                    </option>
                    <option value="CERTIFICATION">
                      인증관리
                    </option>
                    <option value="MAINTENANCE">
                      유지보수
                    </option>
                  </select>
                </div>

                <!-- 정산 현황 안내 (수령자 선택 시 표시) -->
                <div v-if="form.recipientType && annualSummary" class="settlement-info-box">
                  <div class="info-box-title">
                    <i class="fas fa-info-circle" />
                    {{ getRecipientLabel(form.recipientType) }} 정산 현황 ({{ selectedYear }}년)
                  </div>
                  <div class="info-box-grid">
                    <div class="info-item">
                      <span class="info-label">총 매출</span>
                      <span class="info-value">{{ formatCurrency(annualSummary.totalSalesAmount || 0) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">적용 구간</span>
                      <span class="info-value tier">{{ annualSummary.appliedTier || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">적용 비율</span>
                      <span class="info-value">{{ recipientRate }}%</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">정산액</span>
                      <span class="info-value highlight">{{ formatCurrency(recipientSettlementAmount) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">기지급 합계</span>
                      <span class="info-value paid">{{ formatCurrency(recipientPaidAmount) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">잔여 예상액</span>
                      <span class="info-value remaining">{{ formatCurrency(recipientRemainingAmount) }}</span>
                    </div>
                  </div>
                </div>

                <!-- 수령자명 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">수령자명</label>
                  <input
                    v-model="form.recipientName"
                    type="text"
                    class="ccm-form-input"
                    placeholder="수령자 이름"
                  >
                </div>

                <!-- 지급 금액 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">지급 금액</label>
                  <div class="ccm-amount-wrapper">
                    <input
                      v-model.number="form.paymentAmount"
                      type="number"
                      class="ccm-form-input ccm-amount-input"
                      placeholder="0"
                      min="0"
                    >
                    <span class="ccm-input-suffix">원</span>
                  </div>
                </div>

                <!-- 지급일 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label required">지급일</label>
                  <input
                    v-model="form.paymentDate"
                    type="date"
                    class="ccm-form-input ccm-date-input"
                  >
                </div>

                <!-- 지급 방법 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    지급 방법
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <input
                    v-model="form.paymentMethod"
                    type="text"
                    class="ccm-form-input"
                    placeholder="은행이체 등"
                  >
                </div>

                <!-- 비고 -->
                <div class="ccm-form-group">
                  <label class="ccm-form-label">
                    비고
                    <span class="ccm-optional-tag">선택</span>
                  </label>
                  <textarea
                    v-model="form.remarks"
                    class="ccm-form-input ccm-textarea"
                    placeholder="비고 사항을 입력해주세요"
                    rows="3"
                  />
                </div>
              </div>
            </div>
            <div class="ccm-modal-footer">
              <button class="ccm-btn-cancel" @click="closeModal">
                취소
              </button>
              <button
                class="ccm-btn-confirm ccm-purple"
                :disabled="!isFormValid || submitting"
                @click="handleSubmit"
              >
                <i class="fas fa-save" />
                {{ isEditMode ? '수정' : '등록' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { formatCurrency, formatDate, getLocalDateString } from '~/utils/format'
import {
  getPaymentHistoryAll,
  createCommissionPayment,
  updateCommissionPayment,
  deleteCommissionPayment,
  exportPaymentsExcel,
  getAnnualCommissionSummary
} from '~/services/commission.service'
import type { CommissionPayment, AnnualCommissionSummary } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 지급 관리'
})

// ============ 필터 상태 ============
const currentYear = new Date().getFullYear()
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
const selectedYear = ref(currentYear)
const filterRecipientType = ref('')
const filterStatus = ref('')

// ============ 데이터 상태 ============
const loading = ref(false)
const allPayments = ref<CommissionPayment[]>([])

// ============ 연간 정산 요약 (모달 내 참고 정보) ============
const annualSummary = ref<AnnualCommissionSummary | null>(null)

// ============ 모달 상태 ============
const showModal = ref(false)
const submitting = ref(false)
/** 수정 대상 결제 ID (null이면 신규 등록) */
const editingPaymentId = ref<number | null>(null)

const form = reactive({
  recipientType: '',
  recipientName: '',
  paymentAmount: 0,
  paymentDate: getLocalDateString(),
  paymentMethod: '',
  remarks: ''
})

// ============ Computed ============
const isEditMode = computed(() => editingPaymentId.value !== null)

const modalTitle = computed(() => isEditMode.value ? '지급 수정' : '지급 등록')
const modalSubtitle = computed(() => isEditMode.value ? '지급 정보를 수정합니다' : '지급 정보를 입력해주세요')

const isFormValid = computed(() => {
  return form.recipientType !== '' &&
    form.recipientName.trim() !== '' &&
    form.paymentAmount > 0 &&
    form.paymentDate !== ''
})

/** 요약: 총 지급 금액 */
const summaryTotalPaid = computed(() =>
  allPayments.value.reduce((sum, p) => sum + (p.paymentAmount || 0), 0)
)

/** 요약: 지급 건수 */
const summaryCount = computed(() => allPayments.value.length)

/** 선택된 수령자 유형의 적용 비율 */
const recipientRate = computed(() => {
  if (!annualSummary.value || !form.recipientType) { return 0 }
  const rateMap: Record<string, number> = {
    OEM: annualSummary.value.appliedOemRate || 0,
    CEO: annualSummary.value.appliedCeoRate || 0,
    ECOARMS: annualSummary.value.appliedEcoarmsRate || 0,
    SALES_REP: annualSummary.value.appliedSalesRate || 0,
    CERTIFICATION: annualSummary.value.appliedCertificationRate || 0,
    MAINTENANCE: annualSummary.value.appliedMaintenanceRate || 0
  }
  return rateMap[form.recipientType] || 0
})

/** 선택된 수령자 유형의 정산액 */
const recipientSettlementAmount = computed(() => {
  if (!annualSummary.value || !form.recipientType) { return 0 }
  const amountMap: Record<string, number> = {
    OEM: annualSummary.value.totalOemAmount || 0,
    CEO: annualSummary.value.totalCeoAmount || 0,
    ECOARMS: annualSummary.value.totalEcoarmsAmount || 0,
    SALES_REP: annualSummary.value.totalSalesRepAmount || 0,
    CERTIFICATION: annualSummary.value.totalCertificationAmount || 0,
    MAINTENANCE: annualSummary.value.totalMaintenanceAmount || 0
  }
  return amountMap[form.recipientType] || 0
})

/** 선택된 수령자 유형의 기지급 합계 */
const recipientPaidAmount = computed(() => {
  if (!form.recipientType) { return 0 }
  return allPayments.value
    .filter(p =>
      p.recipientType === form.recipientType &&
      p.status !== 'CANCELLED' &&
      p.status !== 'DELETED'
    )
    .reduce((sum, p) => sum + (p.paymentAmount || 0), 0)
})

/** 잔여 예상액 = 정산액 - 기지급 */
const recipientRemainingAmount = computed(() => {
  return recipientSettlementAmount.value - recipientPaidAmount.value
})

// ============ 뱃지/라벨 함수 ============
const getRecipientLabel = (type: string): string => {
  const labels: Record<string, string> = {
    OEM: '제조사(OEM)',
    CEO: '본사(대표)',
    ECOARMS: '에코암스',
    SALES_REP: '영업담당자',
    CERTIFICATION: '인증관리',
    MAINTENANCE: '유지보수'
  }
  return labels[type] || type || '-'
}

const getRecipientClass = (type: string): string => {
  const classes: Record<string, string> = {
    OEM: 'recipient-oem',
    CEO: 'recipient-ceo',
    ECOARMS: 'recipient-eco',
    SALES_REP: 'recipient-sales',
    CERTIFICATION: 'recipient-certification',
    MAINTENANCE: 'recipient-maintenance'
  }
  return classes[type] || ''
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PAID: '지급완료',
    COMPLETED: '완료',
    DEDUCTED: '차감완료',
    CANCELLED: '취소',
    SCHEDULED: '지급예정',
    REFUNDED: '환불'
  }
  return labels[status] || status || '-'
}

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    PAID: 'status-paid',
    COMPLETED: 'status-paid',
    DEDUCTED: 'status-deducted',
    CANCELLED: 'status-cancelled',
    SCHEDULED: 'status-scheduled',
    REFUNDED: 'status-cancelled'
  }
  return classes[status] || ''
}

const canEdit = (payment: CommissionPayment): boolean =>
  !['DEDUCTED', 'DELETED', 'CANCELLED'].includes(payment.status)

const canDelete = (payment: CommissionPayment): boolean =>
  !['DEDUCTED', 'DELETED'].includes(payment.status)

// ============ 데이터 로드 ============
const loadData = async () => {
  loading.value = true
  try {
    allPayments.value = await getPaymentHistoryAll(selectedYear.value, {
      recipientType: filterRecipientType.value || undefined,
      status: filterStatus.value || undefined
    })
  } catch (error) {
    console.error('지급 목록 조회 실패:', error)
    allPayments.value = []
  } finally {
    loading.value = false
  }
}

// ============ 연간 요약 로드 ============
const loadAnnualSummary = async () => {
  try {
    annualSummary.value = await getAnnualCommissionSummary(selectedYear.value)
  } catch (error) {
    console.error('연간 요약 조회 실패:', error)
    annualSummary.value = null
  }
}

// ============ 모달 열기/닫기 ============
const resetForm = () => {
  form.recipientType = ''
  form.recipientName = ''
  form.paymentAmount = 0
  form.paymentDate = getLocalDateString()
  form.paymentMethod = ''
  form.remarks = ''
}

/** 등록 모달 열기 */
const openCreateModal = async () => {
  editingPaymentId.value = null
  resetForm()
  showModal.value = true
  await loadAnnualSummary()
}

/** 수정 모달 열기 */
const openEditModal = async (payment: CommissionPayment) => {
  if (!canEdit(payment)) { return }
  editingPaymentId.value = payment.paymentId
  form.recipientType = payment.recipientType
  form.recipientName = payment.recipientName
  form.paymentAmount = payment.paymentAmount
  form.paymentDate = payment.paymentDate
  form.paymentMethod = payment.paymentMethod || ''
  form.remarks = payment.remarks || ''
  showModal.value = true
  await loadAnnualSummary()
}

/** 수령자 유형 변경 */
const onRecipientTypeChange = () => {
  // 수령자 변경 시 정산 현황이 자동으로 갱신됨 (computed)
}

const closeModal = () => {
  showModal.value = false
  editingPaymentId.value = null
  resetForm()
}

// ============ 등록/수정 제출 ============
const handleSubmit = async () => {
  if (!isFormValid.value || submitting.value) { return }
  submitting.value = true

  try {
    const requestData = {
      year: selectedYear.value,
      recipientType: form.recipientType,
      recipientName: form.recipientName,
      paymentAmount: form.paymentAmount,
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod || undefined,
      remarks: form.remarks || undefined
    }

    if (isEditMode.value) {
      await updateCommissionPayment(editingPaymentId.value!, requestData)
      alert('지급 정보가 수정되었습니다.')
    } else {
      await createCommissionPayment(selectedYear.value, requestData)
      alert('지급이 등록되었습니다.')
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('지급 처리 실패:', error)
    alert('처리에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// ============ 삭제 ============
const handleDelete = async (payment: CommissionPayment) => {
  if (!canDelete(payment)) { return }
  if (!confirm(`"${payment.recipientName}" 에 대한 지급 ${formatCurrency(payment.paymentAmount)}을 삭제하시겠습니까?`)) { return }

  try {
    await deleteCommissionPayment(payment.paymentId)
    alert('삭제되었습니다.')
    await loadData()
  } catch (error) {
    console.error('삭제 실패:', error)
    alert('삭제에 실패했습니다.')
  }
}

// ============ 엑셀 다운로드 ============
const handleExcelDownload = async () => {
  try {
    await exportPaymentsExcel(selectedYear.value, {
      recipientType: filterRecipientType.value || undefined,
      status: filterStatus.value || undefined
    })
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    alert('엑셀 다운로드에 실패했습니다.')
  }
}

// ============ Lifecycle ============
onMounted(() => {
  loadData()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

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
  gap: 1.25rem;
  align-items: flex-end;
  flex-wrap: wrap;
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

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 0.625rem;
  align-items: flex-end;
}

.form-select {
  padding: 0.625rem 2rem 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  min-width: 130px;
}

/* 등록 버튼 */
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

/* 요약바 */
.summary-bar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
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

.summary-value.total { color: #10b981; }
.summary-value.advance { color: #8b5cf6; }

.summary-divider {
  width: 1px;
  height: 40px;
  background: #e5e7eb;
}

/* 로딩 */
.loading-container i {
  color: #8b5cf6;
}

/* 테이블 */
.table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f9fafb;
}

.data-table th {
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.data-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table tbody tr:hover {
  background: #faf5ff;
}

.data-table .text-right { text-align: right; }
.data-table .text-center { text-align: center; }

.amount-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.remarks-cell {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #9ca3af;
}

/* 수령자 뱃지 */
.recipient-badge {
  display: inline-block;
  padding: 0.2rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.recipient-oem {
  background: #dbeafe;
  color: #2563eb;
}

.recipient-ceo {
  background: #f3e8ff;
  color: #7c3aed;
}

.recipient-eco {
  background: #dcfce7;
  color: #059669;
}

.recipient-sales {
  background: #fef3c7;
  color: #d97706;
}

.recipient-certification {
  background-color: #EDE9FE;
  color: #7C3AED;
}

.recipient-maintenance {
  background-color: #FCE7F3;
  color: #DB2777;
}

/* 상태 뱃지 */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.status-paid {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-deducted {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.status-scheduled {
  background: #f3f4f6;
  color: #6b7280;
}

/* 테이블 내 관리 버튼 */
.actions-cell {
  white-space: nowrap;
}

.btn-table-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.8125rem;
  color: #6b7280;
}

.btn-table-action + .btn-table-action {
  margin-left: 0.375rem;
}

.btn-table-action.edit:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.btn-table-action.delete:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
}

.btn-table-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* 모달 보라색 변형 */
.ccm-btn-confirm.ccm-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.ccm-btn-confirm.ccm-purple:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

/* 모달 폼 보라색 포커스 */
.ccm-form-input:focus {
  border-color: #8b5cf6;
  box-shadow:
    0 0 0 3px rgba(139, 92, 246, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 모달 2컬럼 그리드 */
.ccm-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .data-table {
    font-size: 0.8125rem;
  }

  .filter-row {
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 1rem;
  }

  .filter-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

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

  .table-wrapper {
    overflow-x: auto;
  }
}

/* 정산 현황 안내 박스 */
.settlement-info-box {
  background: #f0f4ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 4px;
}

.info-box-title {
  font-size: 12px;
  font-weight: 600;
  color: #4338ca;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-box-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item .info-label {
  font-size: 11px;
  color: #6b7280;
}

.info-item .info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.info-item .info-value.tier {
  color: #7c3aed;
}

.info-item .info-value.highlight {
  color: #2563eb;
}

.info-item .info-value.paid {
  color: #d97706;
}

.info-item .info-value.remaining {
  color: #059669;
}

@media (max-width: 640px) {
  .info-box-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
