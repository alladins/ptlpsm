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
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <span>데이터를 불러오는 중...</span>
        </div>

        <template v-else>
          <!-- 청구 가능 출하 목록 -->
          <div class="table-section">
            <div class="section-header">
              <h4>미청구 출하 목록</h4>
              <span class="shipment-count">총 {{ availableShipments.length }}건</span>
            </div>

            <div v-if="availableShipments.length === 0" class="empty-message">
              <i class="fas fa-inbox"></i>
              <p>청구 가능한 출하가 없습니다.</p>
              <span>납품확인이 완료된 출하가 있어야 납품완료 처리가 가능합니다.</span>
            </div>

            <div v-else class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="col-date">출하일</th>
                    <th class="col-no">출하번호</th>
                    <th class="col-item">품목</th>
                    <th class="col-qty">수량</th>
                    <th class="col-amount">금액</th>
                    <th class="col-confirm">납품확인일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="shipment in availableShipments" :key="shipment.shipmentId">
                    <td class="text-center">{{ formatDate(shipment.shipmentDate) }}</td>
                    <td class="text-center">{{ shipment.shipmentId }}</td>
                    <td>{{ shipment.itemSummary || '-' }}</td>
                    <td class="text-right">{{ formatNumber(shipment.totalQuantity) }}</td>
                    <td class="text-right">{{ formatCurrency(shipment.totalAmount) }}</td>
                    <td class="text-center">{{ formatDateTime(shipment.deliveryCompletedAt) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-right"><strong>합계</strong></td>
                    <td class="text-right"><strong>{{ formatNumber(totalQuantity) }}</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- 이전 기성 청구 이력 -->
          <div v-if="previousBaselines.length > 0" class="history-section">
            <h4>이전 청구 이력</h4>
            <div class="history-list">
              <div v-for="baseline in previousBaselines" :key="baseline.baselineId" class="history-item">
                <span class="history-name">{{ baseline.displayName || `기성 ${baseline.baselineSeq}차` }}</span>
                <span class="history-date">{{ formatDate(baseline.baselineDate) }}</span>
                <span class="history-amount">{{ formatCurrency(baseline.totalAmount) }}</span>
              </div>
            </div>
            <div class="history-total">
              <span>기청구 합계</span>
              <strong>{{ formatCurrency(previousTotalAmount) }}</strong>
            </div>
          </div>

          <!-- 최종 금액 계산 -->
          <div class="calculation-result">
            <div class="result-row">
              <label>이번 청구 금액 (미청구 출하 합계)</label>
              <span class="amount primary">{{ formatCurrency(totalAmount) }}</span>
            </div>
            <div class="result-row">
              <label>기청구 금액</label>
              <span class="amount">{{ formatCurrency(previousTotalAmount) }}</span>
            </div>
            <div class="divider"></div>
            <div class="result-row total">
              <label>총 청구 금액</label>
              <span class="amount success">{{ formatCurrency(grandTotalAmount) }}</span>
            </div>
          </div>

          <!-- 정보 안내 -->
          <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <div class="info-content">
              <strong>납품완료 처리 안내</strong>
              <p>모든 미청구 출하가 납품완료 차수에 포함됩니다. 납품완료 처리 후에는 추가 기성 청구가 불가능합니다.</p>
            </div>
          </div>

          <!-- 비고 입력 -->
          <div class="remarks-section">
            <label>비고</label>
            <textarea
              v-model="remarks"
              class="form-textarea"
              placeholder="비고 입력 (선택)"
              rows="2"
            ></textarea>
          </div>

          <!-- 최종 확인 -->
          <div class="confirm-section">
            <label class="checkbox-label">
              <input type="checkbox" v-model="confirmFinalDelivery">
              <span>위 내용을 확인하였으며, 납품완료 처리를 진행합니다.</span>
            </label>
          </div>
        </template>
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
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '~/utils/format'
import { useBaselineStore } from '~/stores/baseline'
import type { AvailableShipment, BaselineListItem } from '~/types/baseline'

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
const isLoading = ref(false)
const isSubmitting = ref(false)
const confirmFinalDelivery = ref(false)
const remarks = ref('')

// 청구 가능 출하 목록
const availableShipments = ref<AvailableShipment[]>([])

// 이전 기성 차수 목록
const previousBaselines = ref<BaselineListItem[]>([])

// 합계 계산
const totalQuantity = computed(() => {
  return availableShipments.value.reduce((sum, s) => sum + (s.totalQuantity || 0), 0)
})

const totalAmount = computed(() => {
  return availableShipments.value.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
})

// 이전 청구 합계
const previousTotalAmount = computed(() => {
  return previousBaselines.value.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
})

// 총 청구 금액
const grandTotalAmount = computed(() => {
  return totalAmount.value + previousTotalAmount.value
})

// 유효성 검사
const isValid = computed(() => {
  // 청구할 출하가 있어야 함
  if (availableShipments.value.length === 0) {
    return false
  }

  // 최종 확인 체크
  if (!confirmFinalDelivery.value) {
    return false
  }

  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.orderId) return

  isLoading.value = true

  try {
    // 청구 가능 출하 목록 로드
    await baselineStore.loadProgressPaymentDataV2(props.orderId)

    // 청구 가능 출하 목록 설정
    availableShipments.value = baselineStore.availableShipments

    // 이전 기성 차수 목록 (PROGRESS 타입만)
    previousBaselines.value = baselineStore.list.filter(b => b.baselineType === 'PROGRESS')

  } catch (error) {
    console.error('데이터 로드 실패:', error)
    alert('데이터를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const submitFinalDelivery = async () => {
  if (!isValid.value || isSubmitting.value) return

  // 추가 확인
  if (!confirm('납품완료 처리를 진행하시겠습니까?\n\n납품완료 처리 후에는 추가 기성 청구가 불가능합니다.')) {
    return
  }

  isSubmitting.value = true

  try {
    // 모든 출하 선택
    const allShipmentIds = availableShipments.value.map(s => s.shipmentId)

    // 납품완료 차수 생성 (FINAL 타입)
    await baselineStore.createBaselineV2({
      orderId: props.orderId,
      baselineType: 'FINAL',
      shipmentIds: allShipmentIds,
      remarks: remarks.value || undefined
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

const resetForm = () => {
  confirmFinalDelivery.value = false
  remarks.value = ''
  availableShipments.value = []
  previousBaselines.value = []
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
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

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  color: #3b82f6;
}

/* 빈 상태 */
.empty-message {
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 8px;
}

.empty-message i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-message p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.empty-message span {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.shipment-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 테이블 */
.table-section {
  margin-bottom: 0;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
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
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.data-table tbody tr:hover {
  background: #f9fafb;
}

.data-table tfoot td {
  background: #f0f9ff;
  border-top: 2px solid #e5e7eb;
  font-weight: 600;
}

.col-date { width: 100px; }
.col-no { width: 100px; }
.col-item { min-width: 150px; }
.col-qty { width: 80px; }
.col-amount { width: 120px; }
.col-confirm { width: 100px; }

.text-center { text-align: center; }
.text-right { text-align: right; }

/* 이력 섹션 */
.history-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.history-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.history-item:last-child {
  border-bottom: none;
}

.history-name {
  font-weight: 500;
  color: #374151;
}

.history-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.history-amount {
  font-weight: 600;
  color: #1f2937;
}

.history-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #d1d5db;
}

.history-total span {
  font-size: 0.875rem;
  color: #6b7280;
}

.history-total strong {
  font-size: 1rem;
  color: #1f2937;
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

/* 정보 박스 */
.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.info-box > i {
  color: #3b82f6;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-content strong {
  color: #1e40af;
  display: block;
  margin-bottom: 0.25rem;
}

.info-content p {
  color: #3b82f6;
  font-size: 0.875rem;
  margin: 0;
}

/* 비고 입력 */
.remarks-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.remarks-section label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 최종 확인 섹션 */
.confirm-section {
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  font-weight: 500;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
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
