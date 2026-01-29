<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal modal-sm" @click.stop>
        <div class="modal-header">
          <h3>수량 변경 이력 수정</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 품목 정보 -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">품목명</span>
              <span class="info-value">{{ item?.itemName }} ({{ item?.skuName }})</span>
            </div>
            <div class="info-row">
              <span class="info-label">변경 전 수량</span>
              <span class="info-value">{{ formatNumber(item?.beforeQuantity || 0) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">현재 변경 후 수량</span>
              <span class="info-value highlight">{{ formatNumber(item?.afterQuantity || 0) }}</span>
            </div>
          </div>

          <!-- 수정 입력 -->
          <div class="form-section">
            <label class="form-label required">새로운 수량</label>
            <input
              type="number"
              v-model.number="newQuantity"
              class="form-input"
              min="0"
              placeholder="수정할 수량 입력"
            />
            <p class="form-hint">
              차이:
              <span :class="diffClass">
                {{ diffText }}
              </span>
            </p>
          </div>

          <div class="form-section">
            <label class="form-label required">수정 사유</label>
            <textarea
              v-model="editReason"
              class="form-textarea"
              rows="2"
              placeholder="수정 사유를 입력하세요 (필수)"
            ></textarea>
          </div>

          <!-- 안내 메시지 -->
          <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <span>이 작업은 기존 추가변경 API를 통해 수량을 변경합니다.</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">
            <i class="fas fa-times"></i>
            취소
          </button>
          <button
            class="btn-primary"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-check"></i>
            수정
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatNumber } from '~/utils/format'
import { shipmentService } from '~/services/shipment.service'
import type { QuantityChangeHistoryItem } from '~/types/shipment-change'

// Props
interface Props {
  isOpen: boolean
  shipmentId: number
  item: QuantityChangeHistoryItem | null
}

const props = withDefaults(defineProps<Props>(), {
  item: null
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'complete'): void
}>()

// State
const newQuantity = ref(0)
const editReason = ref('')
const isSubmitting = ref(false)

// Computed
const diff = computed(() => {
  if (!props.item) return 0
  return newQuantity.value - props.item.afterQuantity
})

const diffClass = computed(() => {
  if (diff.value > 0) return 'text-success'
  if (diff.value < 0) return 'text-danger'
  return 'text-muted'
})

const diffText = computed(() => {
  if (diff.value > 0) return `+${formatNumber(diff.value)}`
  if (diff.value < 0) return formatNumber(diff.value)
  return '0 (변경 없음)'
})

const canSubmit = computed(() => {
  return editReason.value.trim() !== '' && diff.value !== 0
})

// Methods
const closeModal = () => {
  emit('close')
}

const resetForm = () => {
  if (props.item) {
    newQuantity.value = props.item.afterQuantity
  } else {
    newQuantity.value = 0
  }
  editReason.value = ''
}

const handleSubmit = async () => {
  if (!canSubmit.value || isSubmitting.value || !props.item) return

  isSubmitting.value = true

  try {
    // 기존 additional-change API 활용
    const response = await shipmentService.executeAdditionalChange({
      shipmentId: props.shipmentId,
      items: [{
        skuId: props.item.skuId,
        currentQuantity: props.item.afterQuantity,
        newQuantity: newQuantity.value
      }],
      changeReason: editReason.value.trim()
    })

    if (response.success) {
      alert('수량이 수정되었습니다.')
      emit('complete')
    } else {
      alert(response.errorMessage || '수량 수정에 실패했습니다.')
    }
  } catch (error) {
    console.error('수량 수정 실패:', error)
    alert('수량 수정 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

watch(() => props.item, () => {
  if (props.isOpen) {
    resetForm()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
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

.modal-sm {
  width: 90%;
  max-width: 450px;
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
  font-size: 1.125rem;
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
  gap: 1.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 정보 섹션 */
.info-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

.info-value.highlight {
  color: #2563eb;
  font-weight: 600;
}

/* 폼 섹션 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
}

.form-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* 안내 박스 */
.info-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 6px;
  color: #1e40af;
  font-size: 0.8125rem;
}

.info-box i {
  color: #3b82f6;
}

/* 색상 클래스 */
.text-success {
  color: #059669;
  font-weight: 500;
}

.text-danger {
  color: #dc2626;
  font-weight: 500;
}

.text-muted {
  color: #9ca3af;
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
  background: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
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
