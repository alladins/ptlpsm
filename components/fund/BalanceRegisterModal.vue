<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h3>잔금 등록</h3>
          <button class="btn-close" @click="close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="info-message">
            <i class="fas fa-info-circle"></i>
            <p>잔금을 등록합니다. 등록 후 별도로 "잔금 입금확인"을 진행해야 입금 완료 처리됩니다.</p>
          </div>

          <div class="form-group">
            <label>잔금 등록액</label>
            <div class="input-with-unit">
              <input
                type="text"
                v-model="formattedAmount"
                @input="onAmountInput"
                class="form-input"
                placeholder="등록할 잔금 금액"
              />
              <span class="unit">원</span>
            </div>
          </div>

          <div class="form-group">
            <label>등록일</label>
            <input
              v-model="requestDate"
              type="date"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>비고 (선택)</label>
            <textarea
              v-model="remarks"
              class="form-input"
              rows="2"
              placeholder="비고 사항을 입력하세요"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="close">취소</button>
          <button
            class="btn-primary"
            :disabled="!isValid || submitting"
            @click="handleSubmit"
          >
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
            <span v-else>잔금 등록</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { formatNumber } from '~/utils/format'

interface Props {
  isOpen: boolean
  initialAmount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  submitted: [data: { amount: number; requestDate: string; remarks?: string }]
}>()

const amount = ref(0)
const formattedAmount = ref('')
const requestDate = ref('')
const remarks = ref('')
const submitting = ref(false)

// 오늘 날짜를 기본값으로 설정
const today = new Date().toISOString().split('T')[0]

// 금액 입력 포맷팅
const onAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // 숫자만 추출
  const numericValue = input.value.replace(/[^\d]/g, '')
  amount.value = parseInt(numericValue, 10) || 0
  // 포맷팅된 값으로 표시
  formattedAmount.value = amount.value > 0 ? formatNumber(amount.value) : ''
}

// 모달이 열릴 때 초기값 설정
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    amount.value = props.initialAmount
    formattedAmount.value = props.initialAmount > 0 ? formatNumber(props.initialAmount) : ''
    requestDate.value = today
    remarks.value = ''
    submitting.value = false
  }
})

const isValid = computed(() => {
  return amount.value > 0 && requestDate.value
})

const close = () => {
  emit('close')
}

const handleSubmit = async () => {
  if (!isValid.value || submitting.value) return

  submitting.value = true
  try {
    emit('submitted', {
      amount: amount.value,
      requestDate: requestDate.value,
      remarks: remarks.value || undefined
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.info-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.info-message i {
  color: #3b82f6;
  font-size: 1.125rem;
  margin-top: 0.125rem;
}

.info-message p {
  margin: 0;
  font-size: 0.875rem;
  color: #1e40af;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.form-input {
  resize: vertical;
  min-height: 60px;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-unit .form-input {
  flex: 1;
  text-align: right;
  font-size: 1.125rem;
  font-weight: 600;
}

.input-with-unit .unit {
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
