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
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>커미션 지급 등록</h3>
          <button class="modal-close" @click="closeCreateModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>지급 예정 금액 <span class="required">*</span></label>
            <div class="input-with-suffix">
              <input
                v-model.number="createForm.scheduledAmount"
                type="number"
                class="form-input"
                placeholder="0"
                min="0"
              />
              <span class="input-suffix">원</span>
            </div>
          </div>
          <div class="form-group">
            <label>지급 예정일 <span class="required">*</span></label>
            <input
              v-model="createForm.scheduledDate"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>수취인</label>
            <input
              v-model="createForm.recipientName"
              type="text"
              class="form-input"
              placeholder="수취인 이름"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>은행명</label>
              <input
                v-model="createForm.bankName"
                type="text"
                class="form-input"
                placeholder="은행명"
              />
            </div>
            <div class="form-group">
              <label>계좌번호</label>
              <input
                v-model="createForm.bankAccount"
                type="text"
                class="form-input"
                placeholder="계좌번호"
              />
            </div>
          </div>
          <div class="form-group">
            <label>비고</label>
            <textarea
              v-model="createForm.remarks"
              class="form-textarea"
              placeholder="비고 사항"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCreateModal">취소</button>
          <button class="btn-primary" @click="submitCreate" :disabled="!isCreateFormValid">
            <i class="fas fa-save"></i>
            등록
          </button>
        </div>
      </div>
    </div>

    <!-- 지급 완료 모달 -->
    <div v-if="showCompleteModal" class="modal-overlay" @click.self="closeCompleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>지급 완료 처리</h3>
          <button class="modal-close" @click="closeCompleteModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="info-box">
            <p>지급 예정 금액: <strong>{{ formatCurrency(selectedPayment?.scheduledAmount || 0) }}</strong></p>
          </div>
          <div class="form-group">
            <label>실제 지급 금액 <span class="required">*</span></label>
            <div class="input-with-suffix">
              <input
                v-model.number="completeForm.paidAmount"
                type="number"
                class="form-input"
                placeholder="0"
                min="0"
              />
              <span class="input-suffix">원</span>
            </div>
          </div>
          <div class="form-group">
            <label>실제 지급일 <span class="required">*</span></label>
            <input
              v-model="completeForm.paidDate"
              type="date"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>비고</label>
            <textarea
              v-model="completeForm.remarks"
              class="form-textarea"
              placeholder="비고 사항"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeCompleteModal">취소</button>
          <button class="btn-primary" @click="submitComplete" :disabled="!isCompleteFormValid">
            <i class="fas fa-check"></i>
            완료 처리
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCommissionStore } from '~/stores/commission'
import { formatCurrency } from '~/utils/format'
import type { CommissionPayment, CommissionPaymentStatus, CommissionPaymentCreateRequest, CommissionPaymentCompleteRequest } from '~/types/commission'
import { COMMISSION_PAYMENT_STATUS_LABELS } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '커미션 지급 관리'
})

const commissionStore = useCommissionStore()

// State
const loading = ref(true)
const selectedYear = ref(new Date().getFullYear())
const selectedStatus = ref<CommissionPaymentStatus | ''>('')
const showCreateModal = ref(false)
const showCompleteModal = ref(false)
const selectedPayment = ref<CommissionPayment | null>(null)

// 목업 데이터 사용 여부 (UI 테스트용)
const useMockData = ref(true)

// 목업 데이터 정의 - 대리점(영업직원)별 커미션 지급 이력 (15% 지분)
// 대리점 = 영업직원 (커미션 지급 대상)
// 대리점별: 김영업(서울/경기), 이판매(부산/경남), 박세일(대전/충청), 최거래(광주/전라), 정딜러(대구/경북)
const mockPayments: CommissionPayment[] = [
  // 김영업 (서울/경기) - 국민은행
  {
    paymentId: 1,
    year: 2026,
    paymentSeq: 1,
    scheduledAmount: 67_500_000, // 서울시청 4.5억 × 15%
    paidAmount: 67_500_000,
    scheduledDate: '2026-02-25',
    paidDate: '2026-02-28',
    status: 'COMPLETED',
    settlementIds: [1],
    settlementCount: 1,
    recipientName: '김영업',
    bankAccount: '110-123-456789',
    bankName: '국민은행',
    remarks: '서울시청 납품건 (서울/경기 담당)'
  },
  {
    paymentId: 2,
    year: 2026,
    paymentSeq: 2,
    scheduledAmount: 102_000_000, // 경기도교육청 6.8억 × 15%
    paidAmount: 102_000_000,
    scheduledDate: '2026-03-25',
    paidDate: '2026-03-31',
    status: 'COMPLETED',
    settlementIds: [2],
    settlementCount: 1,
    recipientName: '김영업',
    bankAccount: '110-123-456789',
    bankName: '국민은행',
    remarks: '경기도교육청 납품건 (서울/경기 담당)'
  },
  // 이판매 (부산/경남) - 신한은행
  {
    paymentId: 3,
    year: 2026,
    paymentSeq: 1,
    scheduledAmount: 48_000_000, // 부산소방본부 3.2억 × 15%
    paidAmount: 48_000_000,
    scheduledDate: '2026-05-25',
    paidDate: '2026-05-30',
    status: 'COMPLETED',
    settlementIds: [3],
    settlementCount: 1,
    recipientName: '이판매',
    bankAccount: '110-987-654321',
    bankName: '신한은행',
    remarks: '부산소방본부 납품건 (부산/경남 담당)'
  },
  // 김영업 - 인천환경공단
  {
    paymentId: 4,
    year: 2026,
    paymentSeq: 3,
    scheduledAmount: 42_000_000, // 인천환경공단 2.8억 × 15%
    paidAmount: null,
    scheduledDate: '2026-07-25',
    paidDate: null,
    status: 'PROCESSING',
    settlementIds: [4],
    settlementCount: 1,
    recipientName: '김영업',
    bankAccount: '110-123-456789',
    bankName: '국민은행',
    remarks: '인천환경공단 납품건 - 지급 처리 중'
  },
  // 박세일 (대전/충청) - 하나은행
  {
    paymentId: 5,
    year: 2026,
    paymentSeq: 1,
    scheduledAmount: 63_000_000, // 대전보건연구원 4.2억 × 15%
    paidAmount: null,
    scheduledDate: '2026-08-31',
    paidDate: null,
    status: 'SCHEDULED',
    settlementIds: [5],
    settlementCount: 1,
    recipientName: '박세일',
    bankAccount: '123-456-789012',
    bankName: '하나은행',
    remarks: '대전보건연구원 납품건 (대전/충청 담당)'
  },
  // 최거래 (광주/전라) - 우리은행
  {
    paymentId: 6,
    year: 2026,
    paymentSeq: 1,
    scheduledAmount: 27_000_000, // 광주교육청 1.8억 × 15%
    paidAmount: null,
    scheduledDate: '2026-09-30',
    paidDate: null,
    status: 'SCHEDULED',
    settlementIds: [6],
    settlementCount: 1,
    recipientName: '최거래',
    bankAccount: '789-012-345678',
    bankName: '우리은행',
    remarks: '광주교육청 납품건 (광주/전라 담당)'
  },
  // 박세일 - 세종시청
  {
    paymentId: 7,
    year: 2026,
    paymentSeq: 2,
    scheduledAmount: 22_500_000, // 세종시청 1.5억 × 15%
    paidAmount: null,
    scheduledDate: '2026-10-31',
    paidDate: null,
    status: 'SCHEDULED',
    settlementIds: [7],
    settlementCount: 1,
    recipientName: '박세일',
    bankAccount: '123-456-789012',
    bankName: '하나은행',
    remarks: '세종시청 납품건 (대전/충청 담당)'
  },
  // 정딜러 (대구/경북) - 기업은행
  {
    paymentId: 8,
    year: 2026,
    paymentSeq: 1,
    scheduledAmount: 55_500_000, // 울산시청 3.7억 × 15%
    paidAmount: null,
    scheduledDate: '2026-11-30',
    paidDate: null,
    status: 'SCHEDULED',
    settlementIds: [8],
    settlementCount: 1,
    recipientName: '정딜러',
    bankAccount: '456-789-012345',
    bankName: '기업은행',
    remarks: '울산시청 납품건 (대구/경북 담당)'
  },
  // 이판매 - 취소 건
  {
    paymentId: 9,
    year: 2026,
    paymentSeq: 0,
    scheduledAmount: 36_000_000, // 2.4억 × 15%
    paidAmount: null,
    scheduledDate: '2026-04-30',
    paidDate: null,
    status: 'CANCELLED',
    settlementIds: [],
    settlementCount: 0,
    recipientName: '이판매',
    bankAccount: '110-987-654321',
    bankName: '신한은행',
    remarks: '납품 계약 취소로 지급 취소'
  }
]

// 목업 페이지네이션
const mockPaymentPagination = {
  page: 0,
  size: 20,
  total: mockPayments.length,
  totalPages: 1
}

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

// Computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear + 1 - i)
})

const payments = computed(() => {
  if (useMockData.value) {
    // 상태 필터 적용
    let filtered = [...mockPayments]
    if (selectedStatus.value) {
      filtered = filtered.filter(p => p.status === selectedStatus.value)
    }
    // 지급 차수 순으로 정렬 (최신 먼저)
    filtered.sort((a, b) => b.paymentSeq - a.paymentSeq)
    return filtered
  }
  return commissionStore.payments
})
const pagination = computed(() => {
  if (useMockData.value) {
    return {
      ...mockPaymentPagination,
      total: payments.value.length
    }
  }
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
const loadPayments = async () => {
  loading.value = true
  try {
    // 목업 데이터 모드가 아닐 때만 실제 API 호출
    if (!useMockData.value) {
      await commissionStore.fetchPayments(selectedYear.value, {
        status: selectedStatus.value || undefined,
        page: 0,
        size: 20
      })
    }
    // 목업 모드에서는 computed가 자동으로 필터링 처리함
  } catch (error) {
    console.error('지급 목록 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
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

/* 페이지네이션 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.5rem;
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
  background: #8b5cf6;
  border-color: #8b5cf6;
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
  max-width: 500px;
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

.info-box {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-box p {
  margin: 0;
  font-size: 0.9375rem;
  color: #374151;
}

.info-box strong {
  color: #8b5cf6;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-suffix .form-input {
  flex: 1;
  text-align: right;
}

.input-suffix {
  font-size: 0.9375rem;
  color: #6b7280;
  font-weight: 500;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
