<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>원가 수정</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="item-info">
          <div class="info-row">
            <label>품목명:</label>
            <span>{{ itemName }}</span>
          </div>
          <div class="info-row">
            <label>현재 납품단가:</label>
            <span class="price">{{ formatCurrency(unitPrice) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <form @submit.prevent="handleSubmit" class="cost-form">
          <div class="form-group">
            <label>현재 원가</label>
            <div class="current-cost">
              <span v-if="currentCostPrice">{{ formatCurrency(currentCostPrice) }}</span>
              <span v-else class="no-cost">미설정</span>
            </div>
          </div>

          <div class="form-group">
            <label>새 원가 *</label>
            <div class="input-with-unit">
              <input
                v-model.number="newCostPrice"
                type="number"
                min="0"
                step="1"
                required
                placeholder="원가 입력"
                class="form-input"
              >
              <span class="unit">원</span>
            </div>
            <div v-if="marginRate !== null" class="margin-info">
              <span :class="marginRateClass">
                마진율: {{ marginRate.toFixed(1) }}%
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>변경 사유 * <span class="required-note">(필수)</span></label>
            <textarea
              v-model="changeReason"
              required
              placeholder="원가 변경 사유를 입력해주세요 (예: OEM 계약 단가 인상 반영)"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">
              <i class="fas fa-times"></i>
              <span>취소</span>
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="!isValid || isSubmitting"
            >
              <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              <span>{{ isSubmitting ? '저장 중...' : '저장' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { itemService } from '~/services/item.service'
import { formatCurrency } from '~/utils/format'

// Props
interface Props {
  isOpen: boolean
  itemId: string
  itemName: string
  unitPrice: number
  currentCostPrice?: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

// State
const newCostPrice = ref<number | null>(null)
const changeReason = ref('')
const isSubmitting = ref(false)

// Computed
const isValid = computed(() => {
  return newCostPrice.value !== null &&
         newCostPrice.value >= 0 &&
         changeReason.value.trim().length > 0
})

const marginRate = computed(() => {
  if (newCostPrice.value === null || props.unitPrice <= 0) return null
  const margin = props.unitPrice - newCostPrice.value
  return (margin / props.unitPrice) * 100
})

const marginRateClass = computed(() => {
  if (marginRate.value === null) return ''
  if (marginRate.value >= 30) return 'margin-high'
  if (marginRate.value >= 15) return 'margin-normal'
  if (marginRate.value >= 0) return 'margin-low'
  return 'margin-negative'
})

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // 모달 열릴 때 초기화
    newCostPrice.value = props.currentCostPrice ?? null
    changeReason.value = ''
    isSubmitting.value = false
  }
})

// Methods
const closeModal = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await itemService.updateCostPrice(
      props.itemId,
      newCostPrice.value!,
      changeReason.value.trim()
    )

    alert('원가가 성공적으로 수정되었습니다.')
    emit('saved')
    closeModal()
  } catch (error) {
    console.error('원가 수정 실패:', error)
    alert(error instanceof Error ? error.message : '원가 수정에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}
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
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
}

.modal-close:hover {
  color: #111827;
}

.modal-body {
  padding: 20px;
}

.item-info {
  background: #f9fafb;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  color: #6b7280;
  font-size: 14px;
}

.info-row span {
  font-weight: 500;
  color: #111827;
}

.info-row .price {
  color: #2563eb;
  font-weight: 600;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 16px 0;
}

.cost-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.required-note {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

.current-cost {
  padding: 10px 14px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.current-cost .no-cost {
  color: #9ca3af;
  font-weight: 400;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-unit .form-input {
  flex: 1;
  width: auto;
}

.input-with-unit .unit {
  color: #6b7280;
  font-size: 14px;
}

.margin-info {
  margin-top: 4px;
  font-size: 13px;
}

.margin-high {
  color: #059669;
  font-weight: 500;
}

.margin-normal {
  color: #0284c7;
  font-weight: 500;
}

.margin-low {
  color: #d97706;
  font-weight: 500;
}

.margin-negative {
  color: #dc2626;
  font-weight: 500;
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.form-actions button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  background: #2563eb;
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}
</style>
