<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-upload"></i>
          조달청 나라장터 제출
        </h3>
        <button class="btn-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 기본 정보 -->
        <div class="info-section">
          <div class="info-row">
            <label>납품요구번호:</label>
            <span>{{ deliveryDone.deliveryRequestNo }}</span>
          </div>
          <div class="info-row">
            <label>계약번호:</label>
            <span>{{ deliveryDone.contractNo }}</span>
          </div>
          <div class="info-row">
            <label>수요기관:</label>
            <span>{{ deliveryDone.client }}</span>
          </div>
          <div class="info-row">
            <label>시공사:</label>
            <span>{{ deliveryDone.contractorCompanyName }}</span>
          </div>
          <div class="info-row">
            <label>납품률:</label>
            <span class="delivery-rate">{{ deliveryDone.deliveryCompletionRate }}%</span>
          </div>
        </div>

        <!-- 제출 확인 -->
        <div class="confirmation-section">
          <h4>
            <i class="fas fa-exclamation-triangle"></i>
            제출 전 확인사항
          </h4>
          <div class="checklist">
            <div class="check-item">
              <i class="fas fa-check-circle" :class="{ success: deliveryDone.hasContractorSignature }"></i>
              <span>현장 소장 서명</span>
            </div>
            <div class="check-item">
              <i class="fas fa-check-circle" :class="{ success: deliveryDone.hasSupervisorSignature }"></i>
              <span>현장감리원 서명</span>
            </div>
            <div class="check-item">
              <i class="fas fa-check-circle success"></i>
              <span>납품확인서 PDF</span>
            </div>
            <div class="check-item">
              <i class="fas fa-check-circle success"></i>
              <span>납품완료계 PDF</span>
            </div>
            <div class="check-item">
              <i class="fas fa-check-circle success"></i>
              <span>사진대지 PDF</span>
            </div>
          </div>
        </div>

        <!-- 제출자 정보 입력 -->
        <div class="form-section">
          <div class="form-group">
            <label class="required">제출자 이름</label>
            <input
              type="text"
              v-model="submitterName"
              placeholder="제출자 이름 입력"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="required">제출자 직책</label>
            <input
              type="text"
              v-model="submitterPosition"
              placeholder="예: 대리, 과장, 팀장"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>비고 (선택)</label>
            <textarea
              v-model="remarks"
              placeholder="추가 메모 사항이 있다면 입력해 주세요"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- 경고 메시지 -->
        <div class="warning-section">
          <i class="fas fa-info-circle"></i>
          <div>
            <p><strong>제출 후 유의사항:</strong></p>
            <ul>
              <li>조달청 나라장터에 제출되면 상태가 '제출완료'로 변경됩니다.</li>
              <li>제출 후에는 수정이 불가능합니다.</li>
              <li>제출 완료 후 나라장터에서 직접 확인하시기 바랍니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="submitting">
          취소
        </button>
        <button
          class="btn-submit"
          @click="handleSubmit"
          :disabled="!canSubmit || submitting"
        >
          <i class="fas" :class="submitting ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
          {{ submitting ? '제출 중...' : '조달청 제출' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { submitToNara } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const submitterName = ref('')
const submitterPosition = ref('')
const remarks = ref('')
const submitting = ref(false)

const canSubmit = computed(() => {
  return (
    submitterName.value.trim() !== '' &&
    submitterPosition.value.trim() !== '' &&
    props.deliveryDone.hasContractorSignature &&
    props.deliveryDone.hasSupervisorSignature
  )
})

async function handleSubmit() {
  if (!canSubmit.value) return

  const confirmed = confirm(
    `조달청 나라장터에 제출하시겠습니까?\n\n제출 후에는 수정이 불가능합니다.\n\n납품요구번호: ${props.deliveryDone.deliveryRequestNo}\n수요기관: ${props.deliveryDone.client}`
  )

  if (!confirmed) return

  submitting.value = true
  try {
    const response = await submitToNara({
      deliveryDoneId: props.deliveryDone.deliveryDoneId,
      submitterName: submitterName.value,
      submitterPosition: submitterPosition.value,
      remarks: remarks.value || undefined
    })

    if (response.success) {
      alert(
        `조달청 나라장터에 제출되었습니다.\n\n제출일시: ${response.submittedAt}${response.receiptNumber ? `\n접수번호: ${response.receiptNumber}` : ''}`
      )
      emit('submitted')
    } else {
      alert('제출에 실패했습니다: ' + response.message)
    }
  } catch (error) {
    console.error('Failed to submit to nara:', error)
    alert('조달청 제출 중 오류가 발생했습니다.')
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
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
}

.btn-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.info-section {
  background: #f9fafb;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  font-weight: 600;
  width: 120px;
  color: #6b7280;
}

.info-row span {
  color: #1f2937;
}

.delivery-rate {
  font-weight: 700;
  color: #10b981;
}

.confirmation-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #eff6ff;
  border-radius: 6px;
}

.confirmation-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checklist {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}

.check-item i {
  font-size: 16px;
  color: #d1d5db;
}

.check-item i.success {
  color: #10b981;
}

.form-section {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.form-group label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 4px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.warning-section {
  padding: 15px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.warning-section i {
  color: #d97706;
  font-size: 20px;
  margin-top: 2px;
}

.warning-section p {
  margin: 0 0 8px 0;
  color: #92400e;
  font-size: 13px;
}

.warning-section ul {
  margin: 0;
  padding-left: 20px;
  color: #92400e;
  font-size: 13px;
  line-height: 1.6;
}

.warning-section li {
  margin-bottom: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-submit {
  background: #f59e0b;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #d97706;
}

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
