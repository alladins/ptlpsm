<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-paper-plane"></i>
          서명 URL 발송
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
            <label>수요기관:</label>
            <span>{{ deliveryDone.client }}</span>
          </div>
          <div class="info-row">
            <label>시공사:</label>
            <span>{{ deliveryDone.contractorCompanyName }}</span>
          </div>
        </div>

        <!-- 서명 역할 선택 -->
        <div class="form-section">
          <div class="form-group">
            <label class="required">발송 대상</label>
            <div class="role-buttons">
              <button
                class="role-button"
                :class="{ active: selectedRole === 'CONTRACTOR' }"
                @click="selectRole('CONTRACTOR')"
              >
                <i class="fas fa-stamp"></i>
                <span>시공사 대표 (인감)</span>
              </button>
              <button
                class="role-button"
                :class="{ active: selectedRole === 'SUPERVISOR' }"
                @click="selectRole('SUPERVISOR')"
              >
                <i class="fas fa-signature"></i>
                <span>현장감리원 (서명)</span>
              </button>
            </div>
          </div>

          <!-- 수신자 정보 입력 -->
          <div v-if="selectedRole" class="recipient-form">
            <div class="form-group">
              <label class="required">수신자 이름</label>
              <input
                type="text"
                v-model="recipientName"
                placeholder="수신자 이름 입력"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="required">수신자 전화번호</label>
              <input
                type="tel"
                v-model="recipientPhone"
                placeholder="010-0000-0000"
                class="form-input"
                @input="formatPhoneNumber"
              />
            </div>

            <!-- 미리보기 -->
            <div class="message-preview">
              <h4>
                <i class="fas fa-eye"></i>
                발송될 메시지 미리보기
              </h4>
              <div class="preview-content">
                <p><strong>[LP LEADPOWER 납품완료계]</strong></p>
                <p>{{ recipientName }}님, 안녕하세요.</p>
                <p>
                  {{ deliveryDone.deliveryRequestNo }} 건에 대한
                  {{ selectedRole === 'CONTRACTOR' ? '시공사 대표 인감' : '현장감리원 서명' }}이
                  필요합니다.
                </p>
                <p>아래 링크를 클릭하여 서명해 주시기 바랍니다.</p>
                <p class="preview-link">[서명 URL이 여기에 표시됩니다]</p>
                <p class="preview-note">* 링크는 발송 후 7일간 유효합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="sending">
          취소
        </button>
        <button
          class="btn-send"
          @click="handleSend"
          :disabled="!canSend || sending"
        >
          <i class="fas" :class="sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
          {{ sending ? '발송 중...' : 'URL 발송' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { sendSignatureMessage } from '~/services/delivery-done.service'
import type { DeliveryDoneListItem, SignatureRole } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
  sent: []
}>()

const selectedRole = ref<SignatureRole | null>(null)
const recipientName = ref('')
const recipientPhone = ref('')
const sending = ref(false)

const canSend = computed(() => {
  return (
    selectedRole.value &&
    recipientName.value.trim() !== '' &&
    recipientPhone.value.replace(/[^0-9]/g, '').length >= 10
  )
})

function selectRole(role: SignatureRole) {
  selectedRole.value = role
  // 기본값 설정
  if (role === 'CONTRACTOR') {
    recipientName.value = props.deliveryDone.contractorCompanyName
    recipientPhone.value = ''
  } else {
    recipientName.value = props.deliveryDone.supervisorName || ''
    recipientPhone.value = ''
  }
}

function formatPhoneNumber() {
  const cleaned = recipientPhone.value.replace(/[^0-9]/g, '')
  if (cleaned.length <= 3) {
    recipientPhone.value = cleaned
  } else if (cleaned.length <= 7) {
    recipientPhone.value = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
  } else if (cleaned.length <= 11) {
    recipientPhone.value = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  } else {
    recipientPhone.value = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
  }
}

async function handleSend() {
  if (!canSend.value || !selectedRole.value) return

  sending.value = true
  try {
    const response = await sendSignatureMessage({
      deliveryDoneId: props.deliveryDone.deliveryDoneId,
      role: selectedRole.value,
      recipientPhone: recipientPhone.value.replace(/[^0-9]/g, ''),
      recipientName: recipientName.value
    })

    if (response.success) {
      alert(`서명 URL이 ${recipientName.value}님에게 발송되었습니다.\n\n토큰 만료: ${response.expiresAt}`)
      emit('sent')
    } else {
      alert('메시지 발송에 실패했습니다: ' + response.message)
    }
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('메시지 발송 중 오류가 발생했습니다.')
  } finally {
    sending.value = false
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

.form-section {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
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

.role-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.role-button {
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.role-button i {
  font-size: 32px;
  color: #9ca3af;
}

.role-button span {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
}

.role-button:hover {
  border-color: #2563eb;
}

.role-button.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.role-button.active i {
  color: #2563eb;
}

.role-button.active span {
  color: #1e40af;
}

.recipient-form {
  margin-top: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.message-preview {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.message-preview h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  background: #f9fafb;
  padding: 15px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
}

.preview-content p {
  margin: 8px 0;
}

.preview-link {
  color: #2563eb;
  font-style: italic;
}

.preview-note {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-send {
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

.btn-send {
  background: #2563eb;
  color: white;
}

.btn-send:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-send:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
