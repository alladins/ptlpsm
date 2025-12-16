<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h3>주문 요청 처리</h3>
        <button class="modal-close" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 요청 정보 요약 -->
        <div class="request-summary">
          <div class="summary-header">
            <div class="summary-title">
              <i class="fas fa-file-alt"></i>
              요청 정보
            </div>
            <span class="urgency-badge" :class="getUrgencyClass(request.urgency)">
              {{ getUrgencyLabel(request.urgency) }}
            </span>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <label>요청일</label>
              <span>{{ formatDate(request.requestDate) }}</span>
            </div>
            <div class="summary-item">
              <label>현장명</label>
              <span>{{ request.siteName }}</span>
            </div>
            <div class="summary-item">
              <label>요청자</label>
              <span>{{ request.requesterName }}</span>
            </div>
            <div class="summary-item">
              <label>희망 납품일</label>
              <span>{{ formatDate(request.desiredDeliveryDate) }}</span>
            </div>
          </div>
        </div>

        <!-- 요청 품목 목록 -->
        <div class="items-section">
          <div class="section-header">
            <i class="fas fa-box"></i>
            요청 품목 ({{ request.items?.length || 0 }}건)
          </div>
          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>품목명</th>
                  <th>규격</th>
                  <th>수량</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in request.items" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td class="text-left">{{ item.itemName }}</td>
                  <td>{{ item.specification || '-' }}</td>
                  <td class="text-right">{{ formatNumber(item.quantity) }}</td>
                  <td>{{ item.note || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 처리 선택 -->
        <div class="process-section">
          <div class="section-header">
            <i class="fas fa-tasks"></i>
            처리
          </div>

          <!-- 처리 유형 선택 -->
          <div class="process-type-selector">
            <button
              class="process-type-btn"
              :class="{ active: processType === 'approve' }"
              @click="processType = 'approve'"
            >
              <i class="fas fa-check-circle"></i>
              승인
            </button>
            <button
              class="process-type-btn reject"
              :class="{ active: processType === 'reject' }"
              @click="processType = 'reject'"
            >
              <i class="fas fa-times-circle"></i>
              반려
            </button>
          </div>

          <!-- 승인 시: 납품요구 선택 -->
          <div v-if="processType === 'approve'" class="approve-section">
            <div class="form-field">
              <label class="required">연결할 납품요구</label>
              <div class="input-group">
                <input
                  type="text"
                  class="form-input"
                  :value="selectedOrderDisplay"
                  placeholder="납품요구를 선택하세요"
                  readonly
                >
                <button class="btn-search-sm" @click="openOrderSelectPopup">
                  <i class="fas fa-search"></i>
                  선택
                </button>
              </div>
              <p class="field-hint">
                승인 시 선택한 납품요구에 주문이 연결됩니다.
              </p>
            </div>

            <!-- 신규 납품요구 생성 옵션 -->
            <div class="new-order-option">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="createNewOrder"
                  @change="handleCreateNewOrderChange"
                >
                <span>기존 납품요구가 없는 경우, 신규 생성</span>
              </label>
            </div>
          </div>

          <!-- 반려 시: 사유 입력 -->
          <div v-if="processType === 'reject'" class="reject-section">
            <div class="form-field">
              <label class="required">반려 사유</label>
              <textarea
                v-model="rejectReason"
                class="form-textarea"
                rows="4"
                placeholder="반려 사유를 입력하세요"
              ></textarea>
              <p class="field-hint">
                반려 사유는 요청자에게 전달됩니다.
              </p>
            </div>

            <!-- 자주 사용하는 반려 사유 -->
            <div class="quick-reasons">
              <span class="quick-label">자주 사용하는 사유:</span>
              <div class="quick-buttons">
                <button
                  v-for="reason in quickRejectReasons"
                  :key="reason"
                  class="quick-reason-btn"
                  @click="rejectReason = reason"
                >
                  {{ reason }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">취소</button>
        <button
          class="btn-primary"
          :class="{ 'btn-reject': processType === 'reject' }"
          :disabled="!isValid || processing"
          @click="handleSubmit"
        >
          <i v-if="processing" class="fas fa-spinner fa-spin"></i>
          <i v-else-if="processType === 'approve'" class="fas fa-check"></i>
          <i v-else class="fas fa-times"></i>
          {{ processType === 'approve' ? '승인 처리' : '반려 처리' }}
        </button>
      </div>
    </div>

    <!-- 납품요구 선택 팝업 -->
    <OrderSelectPopup
      v-if="showOrderSelectPopup"
      @close="showOrderSelectPopup = false"
      @select="handleOrderSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MobileOrderRequest, MobileOrderUrgency } from '~/types/mobile-order'
import { formatDate, formatNumber } from '~/utils/format'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'

interface Props {
  request: MobileOrderRequest
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', result: { action: 'approve' | 'reject'; orderId?: number; rejectReason?: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const processType = ref<'approve' | 'reject'>('approve')
const selectedOrder = ref<{ orderId: number; deliveryRequestNo: string } | null>(null)
const createNewOrder = ref(false)
const rejectReason = ref('')
const processing = ref(false)
const showOrderSelectPopup = ref(false)

// 자주 사용하는 반려 사유
const quickRejectReasons = [
  '재고 부족',
  '품목 정보 확인 필요',
  '납품일 조정 필요',
  '담당자 확인 후 재요청 바랍니다'
]

// Computed
const selectedOrderDisplay = computed(() => {
  if (createNewOrder.value) return '(신규 납품요구 생성)'
  if (selectedOrder.value) return selectedOrder.value.deliveryRequestNo
  return ''
})

const isValid = computed(() => {
  if (processType.value === 'approve') {
    return selectedOrder.value !== null || createNewOrder.value
  } else {
    return rejectReason.value.trim().length > 0
  }
})

// Methods
const getUrgencyClass = (urgency?: MobileOrderUrgency): string => {
  if (!urgency) return ''
  switch (urgency) {
    case 'URGENT': return 'urgency-urgent'
    case 'NORMAL': return 'urgency-normal'
    case 'LOW': return 'urgency-low'
    default: return ''
  }
}

const getUrgencyLabel = (urgency?: MobileOrderUrgency): string => {
  if (!urgency) return '-'
  const labels: Record<MobileOrderUrgency, string> = {
    URGENT: '긴급',
    NORMAL: '보통',
    LOW: '여유'
  }
  return labels[urgency] || urgency
}

const handleClose = () => {
  emit('close')
}

const openOrderSelectPopup = () => {
  showOrderSelectPopup.value = true
}

const handleOrderSelect = (order: { orderId: number; deliveryRequestNo: string }) => {
  selectedOrder.value = order
  createNewOrder.value = false
  showOrderSelectPopup.value = false
}

const handleCreateNewOrderChange = () => {
  if (createNewOrder.value) {
    selectedOrder.value = null
  }
}

const handleSubmit = async () => {
  if (!isValid.value || processing.value) return

  processing.value = true

  try {
    if (processType.value === 'approve') {
      emit('submit', {
        action: 'approve',
        orderId: selectedOrder.value?.orderId || 0
      })
    } else {
      emit('submit', {
        action: 'reject',
        rejectReason: rejectReason.value.trim()
      })
    }
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
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
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

/* 요청 정보 요약 */
.request-summary {
  background: #f9fafb;
  border-radius: 10px;
  padding: 1rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.summary-title i {
  color: #6b7280;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.summary-item label {
  font-size: 0.75rem;
  color: #6b7280;
}

.summary-item span {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
}

/* 긴급도 배지 */
.urgency-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.urgency-urgent {
  background: #fef2f2;
  color: #dc2626;
}

.urgency-normal {
  background: #f0fdf4;
  color: #16a34a;
}

.urgency-low {
  background: #eff6ff;
  color: #2563eb;
}

/* 섹션 헤더 */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.section-header i {
  color: #6b7280;
}

/* 품목 테이블 */
.items-section {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
}

.items-table-wrapper {
  overflow-x: auto;
  max-height: 200px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.items-table th,
.items-table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: center;
}

.items-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
}

.items-table td.text-left {
  text-align: left;
}

.items-table td.text-right {
  text-align: right;
}

/* 처리 섹션 */
.process-section {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
}

/* 처리 유형 선택 */
.process-type-selector {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.process-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.process-type-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.process-type-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
}

.process-type-btn.reject.active {
  border-color: #dc2626;
  background: #fef2f2;
  color: #dc2626;
}

/* 폼 필드 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-field label.required::after {
  content: '*';
  color: #dc2626;
  margin-left: 0.25rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #111827;
  background: white;
}

.form-input:read-only {
  background: #f9fafb;
}

.btn-search-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-search-sm:hover {
  background: #2563eb;
}

.form-textarea {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #111827;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

/* 신규 납품요구 생성 옵션 */
.new-order-option {
  margin-top: 0.75rem;
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
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

/* 반려 섹션 */
.reject-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 자주 사용하는 사유 */
.quick-reasons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.quick-reason-btn {
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-reason-btn:hover {
  background: #e5e7eb;
}

/* 버튼 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #16a34a;
}

.btn-primary.btn-reject {
  background: #dc2626;
}

.btn-primary.btn-reject:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* 반응형 */
@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    max-height: 95vh;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .process-type-selector {
    flex-direction: column;
  }

  .input-group {
    flex-direction: column;
  }

  .btn-search-sm {
    width: 100%;
    justify-content: center;
  }
}
</style>
