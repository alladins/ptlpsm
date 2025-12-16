<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>수량 변경 완료</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>

        <div class="message-content">
          <p class="main-message">수량이 변경되었습니다.</p>
          <p class="sub-message">
            서명이 완료된 상태에서 수량이 변경되어<br>
            재서명이 필요합니다.
          </p>
          <p class="action-message">
            메시지를 발송하여 새로운 서명을<br>
            받아주세요.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-check"></i>
          확인
        </button>
        <button class="btn-primary" @click="handleSendMessage">
          <i class="fas fa-paper-plane"></i>
          메시지 발송
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  isOpen: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'sendMessage'): void
}>()

// Methods
const closeModal = () => {
  emit('close')
}

const handleSendMessage = () => {
  emit('sendMessage')
  emit('close')
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

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
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
  padding: 2rem 1.5rem;
  text-align: center;
}

.success-icon {
  margin-bottom: 1.5rem;
}

.success-icon i {
  font-size: 4rem;
  color: #10b981;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-message {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.sub-message {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.6;
}

.action-message {
  margin: 0;
  font-size: 0.875rem;
  color: #2563eb;
  font-weight: 500;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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

.btn-primary:hover {
  background: #1d4ed8;
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
