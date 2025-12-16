<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>납품완료 처리</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 최종 품목별 현황 -->
        <div class="table-section">
          <h4>최종 품목별 현황</h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>품목명</th>
                  <th>주문수량</th>
                  <th>이전확정</th>
                  <th>현재납품</th>
                  <th>이번청구</th>
                  <th>잔고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.itemId">
                  <td>{{ item.itemName }}</td>
                  <td class="text-right">{{ formatNumber(item.orderedQty) }}</td>
                  <td class="text-right">{{ formatNumber(item.confirmedQty) }}</td>
                  <td class="text-right">{{ formatNumber(item.deliveredQty) }}</td>
                  <td class="text-right">
                    <span :class="{ 'text-primary': item.claimQty > 0 }">
                      {{ formatNumber(item.claimQty) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <span :class="{ 'text-danger': item.remainingQty > 0, 'text-success': item.remainingQty === 0 }">
                      {{ formatNumber(item.remainingQty) }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="text-right"><strong>합계</strong></td>
                  <td class="text-right"><strong>{{ formatNumber(totalOrderedQty) }}</strong></td>
                  <td class="text-right"><strong>{{ formatNumber(totalConfirmedQty) }}</strong></td>
                  <td class="text-right"><strong>{{ formatNumber(totalDeliveredQty) }}</strong></td>
                  <td class="text-right"><strong>{{ formatNumber(totalClaimQty) }}</strong></td>
                  <td class="text-right">
                    <strong :class="{ 'text-danger': totalRemainingQty > 0, 'text-success': totalRemainingQty === 0 }">
                      {{ formatNumber(totalRemainingQty) }}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 잔고 경고 -->
        <div v-if="hasRemainingItems" class="warning-box">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="warning-content">
            <strong>잔고가 남아있는 품목이 있습니다</strong>
            <p>납품완료 처리 시 잔고가 모두 청구됩니다.</p>
          </div>
        </div>

        <!-- 잔금 계산 결과 -->
        <div class="calculation-result">
          <div class="result-row">
            <label>잔금 청구 금액</label>
            <span class="amount primary">{{ formatCurrency(finalClaimAmount) }}</span>
          </div>
          <div class="result-row">
            <label>OEM 최종 지급 금액</label>
            <span class="amount">{{ formatCurrency(oemFinalPaymentAmount) }}</span>
          </div>
          <div class="divider"></div>
          <div class="result-row total">
            <label>총 계약금액</label>
            <span class="amount">{{ formatCurrency(totalContractAmount) }}</span>
          </div>
          <div class="result-row total">
            <label>총 수금 예정 금액</label>
            <span class="amount success">{{ formatCurrency(totalCollectionAmount) }}</span>
          </div>
        </div>

        <!-- 납품확인서 자동 생성 -->
        <div class="checkbox-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="generateDeliveryConfirmation" disabled checked>
            <span>납품확인서(납품완료계) 자동 생성 (필수)</span>
          </label>
          <p class="checkbox-hint">납품완료 처리 시 최종 납품확인서가 자동으로 생성됩니다.</p>
        </div>

        <!-- 유효성 검사 메시지 -->
        <div v-if="validationError" class="validation-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ validationError }}</span>
        </div>

        <!-- 최종 확인 -->
        <div class="confirm-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="confirmFinalDelivery">
            <span>위 내용을 확인하였으며, 납품완료 처리를 진행합니다.</span>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          @click="submitFinalDelivery"
          :disabled="!isValid || isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-check-double"></i>
          납품완료 처리
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatCurrency, formatNumber } from '~/utils/format'
import { useBaselineStore } from '~/stores/baseline'

// Props
interface Props {
  isOpen: boolean
  orderId: number
  fundId: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// Stores
const baselineStore = useBaselineStore()

// State
const isSubmitting = ref(false)
const generateDeliveryConfirmation = ref(true)
const confirmFinalDelivery = ref(false)

// 품목 데이터
interface FinalDeliveryItem {
  itemId: string
  itemName: string
  unitPrice: number
  orderedQty: number
  confirmedQty: number
  deliveredQty: number
  claimQty: number
  remainingQty: number
  claimAmount: number
}

const items = ref<FinalDeliveryItem[]>([])

// 총 계약 금액
const totalContractAmount = ref(0)

// 합계 계산
const totalOrderedQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.orderedQty || 0), 0)
})

const totalConfirmedQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.confirmedQty || 0), 0)
})

const totalDeliveredQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.deliveredQty || 0), 0)
})

const totalClaimQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.claimQty || 0), 0)
})

const totalRemainingQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.remainingQty || 0), 0)
})

// 잔고 있는 품목 여부
const hasRemainingItems = computed(() => {
  return items.value.some(item => item.remainingQty > 0)
})

// 잔금 청구 금액
const finalClaimAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.claimAmount || 0), 0)
})

// OEM 최종 지급 금액 (예시: 잔금의 70%)
const oemFinalPaymentAmount = computed(() => {
  return Math.round(finalClaimAmount.value * 0.7)
})

// 총 수금 예정 금액
const totalCollectionAmount = computed(() => {
  // 이전 기성금 + 이번 잔금
  return totalContractAmount.value
})

// 유효성 검사
const validationError = ref<string | null>(null)

const isValid = computed(() => {
  if (!confirmFinalDelivery.value) {
    validationError.value = '납품완료 처리 확인을 체크해주세요.'
    return false
  }

  validationError.value = null
  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.orderId) return

  // 기성 데이터 로드
  await baselineStore.loadProgressPaymentData(props.orderId)

  // 현재 수량 스냅샷에서 품목 데이터 생성
  const snapshot = baselineStore.currentQuantities
  if (snapshot?.items) {
    items.value = snapshot.items.map(item => {
      const orderedQty = item.orderedQty || 0
      const confirmedQty = item.confirmedQty || 0
      const deliveredQty = item.deliveredQty || 0
      const claimQty = orderedQty - confirmedQty // 잔고 전부 청구
      const remainingQty = orderedQty - confirmedQty - claimQty

      return {
        itemId: item.itemId,
        itemName: item.itemName,
        unitPrice: item.unitPrice || 0,
        orderedQty,
        confirmedQty,
        deliveredQty,
        claimQty,
        remainingQty,
        claimAmount: claimQty * (item.unitPrice || 0)
      }
    })

    // 총 계약금액 계산
    totalContractAmount.value = items.value.reduce(
      (sum, item) => sum + (item.orderedQty * item.unitPrice),
      0
    )
  }
}

const submitFinalDelivery = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 납품완료 API 호출
    await baselineStore.createBaseline(props.orderId, {
      baselineType: 'FINAL',
      items: items.value.map(item => ({
        itemId: item.itemId,
        quantity: item.claimQty,
        amount: item.claimAmount
      })),
      generateDeliveryConfirmation: generateDeliveryConfirmation.value
    })

    alert('납품완료 처리가 완료되었습니다.')
    emit('submitted')
    closeModal()
  } catch (error) {
    console.error('납품완료 처리 실패:', error)
    alert(error instanceof Error ? error.message : '납품완료 처리에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    confirmFinalDelivery.value = false
    loadData()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

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

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 90%;
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 테이블 섹션 */
.table-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

.data-table td.text-right {
  text-align: right;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.text-primary {
  color: #2563eb;
  font-weight: 600;
}

.text-success {
  color: #059669;
  font-weight: 600;
}

.text-danger {
  color: #dc2626;
  font-weight: 600;
}

/* 경고 박스 */
.warning-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.warning-box > i {
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  color: #92400e;
  display: block;
  margin-bottom: 0.25rem;
}

.warning-content p {
  color: #a16207;
  font-size: 0.875rem;
  margin: 0;
}

/* 계산 결과 */
.calculation-result {
  background: #f0fdf4;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-row label {
  font-size: 0.875rem;
  color: #374151;
}

.result-row .amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

.result-row .amount.primary {
  color: #059669;
}

.result-row .amount.success {
  color: #2563eb;
}

.result-row.total {
  padding-top: 0.5rem;
}

.result-row.total label {
  font-weight: 600;
}

.divider {
  height: 1px;
  background: #d1fae5;
  margin: 0.5rem 0;
}

/* 체크박스 */
.checkbox-section {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.checkbox-hint {
  margin: 0.5rem 0 0 1.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* 최종 확인 섹션 */
.confirm-section {
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.confirm-section .checkbox-label {
  color: #92400e;
  font-weight: 500;
}

/* 유효성 에러 */
.validation-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* 버튼 */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
