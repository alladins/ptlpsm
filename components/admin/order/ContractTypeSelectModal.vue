<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleCancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>계약 유형 선택</h3>
        <button class="modal-close" @click="handleCancel">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="info-text">동일 납품요구번호의 기존 계약이 있습니다.</p>

        <div class="contract-info">
          <div class="info-row">
            <span class="label">기존 계약:</span>
            <span class="value">{{ existingContractNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">신규 계약:</span>
            <span class="value">{{ newContractNo }}</span>
          </div>
        </div>

        <div class="options">
          <label class="option" :class="{ selected: selectedType === 'AMENDMENT' }">
            <input type="radio" v-model="selectedType" value="AMENDMENT" />
            <div class="option-content">
              <span class="option-title">변경계약</span>
              <span class="option-desc">기존 수량을 새 수량으로 대체</span>
            </div>
          </label>
          <label class="option" :class="{ selected: selectedType === 'ADDITIONAL' }">
            <input type="radio" v-model="selectedType" value="ADDITIONAL" />
            <div class="option-content">
              <span class="option-title">추가계약</span>
              <span class="option-desc">기존 수량에 새 수량을 합산</span>
            </div>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="handleCancel">취소</button>
        <button class="btn-primary" :disabled="!selectedType" @click="handleConfirm">확인</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ContractType } from '~/types/order'

interface Props {
  isOpen: boolean
  existingContractNo: string
  newContractNo: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', type: ContractType): void
}>()

const selectedType = ref<'AMENDMENT' | 'ADDITIONAL' | null>(null)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedType.value = null  // 모달 열 때마다 선택 초기화
  }
})

const handleCancel = () => emit('close')
const handleConfirm = () => {
  if (selectedType.value) {
    emit('confirm', selectedType.value)
  }
}
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
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
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

.info-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #374151;
  text-align: center;
}

.contract-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-row .value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Consolas', monospace;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #93c5fd;
  background: #f0f9ff;
}

.option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.option input[type="radio"] {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.option-desc {
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

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
