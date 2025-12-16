<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>기성 청구</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 이전 차수 정보 -->
        <div class="previous-info" v-if="previousBaseline">
          <div class="info-badge">
            <i class="fas fa-info-circle"></i>
            <span>이전 차수: {{ previousBaseline.displayName }} ({{ previousBaseline.baselineDate }})</span>
          </div>
        </div>

        <!-- 수량 변경 경고 -->
        <div v-if="hasQuantityChanges" class="warning-box">
          <i class="fas fa-exclamation-triangle"></i>
          <div class="warning-content">
            <strong>기성 확정 후 수량 변경이 있습니다</strong>
            <p>변경된 수량이 이번 청구에 반영됩니다.</p>
            <button class="btn-link" @click="showQuantityHistory = true">
              수량 변경 이력 상세보기
            </button>
          </div>
        </div>

        <!-- 품목별 현황 테이블 -->
        <div class="table-section">
          <h4>품목별 현황</h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>품목명</th>
                  <th>주문수량</th>
                  <th>이전확정</th>
                  <th>현재납품</th>
                  <th>이번청구</th>
                  <th>청구금액</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.itemId">
                  <td>{{ item.itemName }}</td>
                  <td class="text-right">{{ formatNumber(item.orderedQty) }}</td>
                  <td class="text-right">{{ formatNumber(item.confirmedQty) }}</td>
                  <td class="text-right">{{ formatNumber(item.deliveredQty) }}</td>
                  <td class="text-right">
                    <input
                      type="number"
                      v-model.number="item.claimQty"
                      :max="item.deliveredQty - item.confirmedQty"
                      min="0"
                      class="qty-input"
                      @input="calculateTotals"
                    >
                  </td>
                  <td class="text-right amount">{{ formatCurrency(item.claimAmount) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-right"><strong>합계</strong></td>
                  <td class="text-right"><strong>{{ formatNumber(totalClaimQty) }}</strong></td>
                  <td class="text-right amount"><strong>{{ formatCurrency(totalClaimAmount) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- 자동 계산 결과 -->
        <div class="calculation-result">
          <div class="result-row">
            <label>청구 금액</label>
            <span class="amount primary">{{ formatCurrency(totalClaimAmount) }}</span>
          </div>
          <div class="result-row">
            <label>OEM 지급 예정 금액</label>
            <span class="amount">{{ formatCurrency(oemPaymentAmount) }}</span>
          </div>
        </div>

        <!-- 납품확인서 자동 생성 -->
        <div class="checkbox-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="generateDeliveryConfirmation" disabled checked>
            <span>납품확인서 자동 생성 (필수)</span>
          </label>
          <p class="checkbox-hint">기성 청구 시 납품확인서가 자동으로 생성됩니다.</p>
        </div>

        <!-- 유효성 검사 메시지 -->
        <div v-if="validationError" class="validation-error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ validationError }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          @click="submitClaim"
          :disabled="!isValid || isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          기성 청구
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatCurrency, formatNumber } from '~/utils/format'
import { useBaselineStore } from '~/stores/baseline'
import type { BaselineListItem } from '~/types/baseline'

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
const showQuantityHistory = ref(false)
const generateDeliveryConfirmation = ref(true)

// 품목 데이터
interface ClaimItem {
  itemId: string
  itemName: string
  unitPrice: number
  orderedQty: number
  confirmedQty: number
  deliveredQty: number
  claimQty: number
  claimAmount: number
}

const items = ref<ClaimItem[]>([])

// 이전 차수 정보
const previousBaseline = computed<BaselineListItem | null>(() => {
  return baselineStore.latestBaseline
})

// 수량 변경 여부
const hasQuantityChanges = computed(() => {
  return baselineStore.hasQuantityChanges
})

// 합계 계산
const totalClaimQty = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.claimQty || 0), 0)
})

const totalClaimAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.claimAmount || 0), 0)
})

// OEM 지급 예정 금액 (예시: 청구금액의 70%)
const oemPaymentAmount = computed(() => {
  return Math.round(totalClaimAmount.value * 0.7)
})

// 유효성 검사
const validationError = ref<string | null>(null)

const isValid = computed(() => {
  if (totalClaimQty.value <= 0) {
    validationError.value = '청구할 수량이 없습니다.'
    return false
  }

  // 주문 수량 초과 체크
  const overClaimedItem = items.value.find(item => {
    const totalClaimed = item.confirmedQty + item.claimQty
    return totalClaimed > item.orderedQty
  })

  if (overClaimedItem) {
    validationError.value = `${overClaimedItem.itemName}의 청구 수량이 주문 수량을 초과합니다.`
    return false
  }

  validationError.value = null
  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const calculateTotals = () => {
  items.value.forEach(item => {
    item.claimAmount = (item.claimQty || 0) * item.unitPrice
  })
}

const loadData = async () => {
  if (!props.orderId) return

  // 기성 데이터 로드
  await baselineStore.loadProgressPaymentData(props.orderId)

  // 현재 수량 스냅샷에서 품목 데이터 생성
  const snapshot = baselineStore.currentQuantities
  if (snapshot?.items) {
    items.value = snapshot.items.map(item => ({
      itemId: item.itemId,
      itemName: item.itemName,
      unitPrice: item.unitPrice || 0,
      orderedQty: item.orderedQty || 0,
      confirmedQty: item.confirmedQty || 0,
      deliveredQty: item.deliveredQty || 0,
      claimQty: Math.max(0, (item.deliveredQty || 0) - (item.confirmedQty || 0)),
      claimAmount: 0
    }))
    calculateTotals()
  }
}

const submitClaim = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 기성 청구 API 호출
    await baselineStore.createBaseline(props.orderId, {
      baselineType: 'PROGRESS',
      items: items.value.map(item => ({
        itemId: item.itemId,
        quantity: item.claimQty,
        amount: item.claimAmount
      })),
      generateDeliveryConfirmation: generateDeliveryConfirmation.value
    })

    alert('기성 청구가 완료되었습니다.')
    emit('submitted')
    closeModal()
  } catch (error) {
    console.error('기성 청구 실패:', error)
    alert(error instanceof Error ? error.message : '기성 청구에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
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

/* 이전 차수 정보 */
.previous-info {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0369a1;
  font-size: 0.875rem;
}

.info-badge i {
  font-size: 1rem;
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
  margin: 0 0 0.5rem 0;
}

.btn-link {
  background: none;
  border: none;
  color: #0369a1;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
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

.data-table td.amount {
  color: #1d4ed8;
  font-weight: 600;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.qty-input {
  width: 80px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: right;
  font-size: 0.875rem;
}

.qty-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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
