<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>기성금 이력</h4>
      <button
        class="btn-primary"
        :disabled="!canRequestProgress"
        :title="progressButtonTooltip"
        @click="emit('openModal')"
      >
        <i class="fas fa-plus" />
        기성 청구하기
      </button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>차수</th>
            <th>청구일</th>
            <th class="col-amount">
              청구금액
            </th>
            <th v-if="hasAdvancePayment" class="col-amount">
              선급금차감
            </th>
            <th v-if="hasAdvancePayment" class="col-amount">
              실수금액
            </th>
            <th>서명상태</th>
            <th>수금일</th>
            <th>상태</th>
            <th>PDF</th>
            <th>수금확인</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProgressPayments.length === 0">
            <td :colspan="hasAdvancePayment ? 10 : 8" class="no-data">
              기성금 이력이 없습니다.
            </td>
          </tr>
          <tr v-for="payment in filteredProgressPayments" v-else :key="payment.requestId || payment.paymentId">
            <td>{{ payment.paymentSeq }}차</td>
            <td>{{ payment.requestDate }}</td>
            <td class="text-right">
              {{ formatCurrency(payment.requestAmount) }}
            </td>
            <td v-if="hasAdvancePayment" class="text-right deduction-amount">
              {{ payment.advanceDeductionAmount ? '-' + formatCurrency(payment.advanceDeductionAmount) : '-' }}
            </td>
            <td v-if="hasAdvancePayment" class="text-right actual-amount">
              {{ formatCurrency(payment.netPaymentAmount || payment.requestAmount) }}
            </td>
            <td>
              <span class="signature-status" :class="getSignatureStatusClass(payment.signatureStatus)">
                {{ getSignatureStatusLabel(payment.signatureStatus) }}
              </span>
            </td>
            <td>{{ payment.paymentDate || payment.paidDate || '-' }}</td>
            <td>
              <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                {{ getPaymentStatusLabel(payment.status) }}
              </span>
            </td>
            <td>
              <!-- 서명 미완료: 서명 대기중 표시 -->
              <div v-if="!isSignatureCompleted(payment.signatureStatus)" class="pdf-actions">
                <span class="signature-pending-badge">
                  <i class="fas fa-clock" />
                  서명 대기중
                </span>
              </div>
              <!-- 서명 완료: PDF 버튼 표시 -->
              <div v-else class="pdf-actions">
                <button
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="납품확인서"
                  @click="emit('viewConfirmationPdf', payment.baselineId)"
                >
                  <i class="fas fa-file-pdf" />
                  납품확인서
                </button>
                <button
                  class="btn-pdf-sm btn-pdf-photo"
                  :disabled="!payment.baselineId"
                  title="사진대지"
                  @click="emit('viewPhotoSheetPdf', payment.baselineId)"
                >
                  <i class="fas fa-images" />
                  사진대지
                </button>
              </div>
            </td>
            <!-- 수금확인 열 -->
            <td>
              <button
                v-if="payment.status === 'APPROVED'"
                class="btn-collection-confirm"
                title="수금 확인"
                @click="emit('openCollectionConfirm', payment)"
              >
                <i class="fas fa-check-circle" />
                수금확인
              </button>
              <span v-else-if="payment.status === 'PAID'" class="collection-completed">
                <i class="fas fa-check" />
                완료
              </span>
              <span v-else class="collection-pending">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressPaymentRequest } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'

interface Props {
  /** 기성금 이력 목록 */
  progressPayments: ProgressPaymentRequest[]
  /** 선급금 신청 여부 (컬럼 표시용) */
  hasAdvancePayment: boolean
  /** 기성금 청구 가능 여부 */
  canRequestProgress: boolean
  /** 기성금 버튼 툴팁 */
  progressButtonTooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  progressButtonTooltip: ''
})

// 기성금만 필터링 (BALANCE 타입 제외)
const filteredProgressPayments = computed(() =>
  props.progressPayments.filter(p => p.paymentType !== 'BALANCE')
)

const emit = defineEmits<{
  /** 기성금 청구 모달 열기 */
  openModal: []
  /** 수금 확인 모달 열기 */
  openCollectionConfirm: [payment: ProgressPaymentRequest]
  /** 납품확인서 PDF 보기 */
  viewConfirmationPdf: [baselineId: number]
  /** 사진대지 PDF 보기 */
  viewPhotoSheetPdf: [baselineId: number]
}>()

// 상태 포맷팅 함수
const {
  getPaymentStatusClass,
  getPaymentStatusLabel,
  getSignatureStatusClass,
  getSignatureStatusLabel,
  isSignatureCompleted
} = useFundStatusFormatters()
</script>

<style scoped>
/* 탭 헤더 */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

/* 테이블 컨테이너 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table td {
  color: #4b5563;
}

.col-amount {
  text-align: right;
}

.text-right {
  text-align: right;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 금액 스타일 */
.deduction-amount {
  color: #dc2626;
  font-weight: 500;
}

.actual-amount {
  color: #059669;
  font-weight: 600;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-requested {
  background: #dbeafe;
  color: #1e40af;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* 서명 상태 */
.signature-status {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.signature-pending {
  background: #fef3c7;
  color: #92400e;
}

.signature-completed {
  background: #d1fae5;
  color: #065f46;
}

/* 서명 대기 배지 */
.signature-pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* PDF 액션 */
.pdf-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.btn-pdf-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.6875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-pdf-sm:hover:not(:disabled) {
  background: #dc2626;
}

.btn-pdf-sm:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-pdf-photo {
  background: #3b82f6;
}

.btn-pdf-photo:hover:not(:disabled) {
  background: #2563eb;
}

/* 수금 확인 버튼 */
.btn-collection-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-collection-confirm:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.collection-completed {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
}

.collection-pending {
  color: #9ca3af;
}

/* 버튼 스타일 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
