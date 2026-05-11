<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="result-modal">
        <div class="modal-header">
          <h3>
            <!-- 성공/중복에 따른 아이콘 -->
            <i v-if="resultInfo?.type === 'success'" class="fas fa-check-circle text-success" />
            <i v-else class="fas fa-exclamation-triangle text-warning" />
            {{ resultInfo?.type === 'success' ? '메시지 발송 완료' : '중복 발송 안내' }}
          </h3>
          <button class="close-btn" @click="handleClose">
            <i class="fas fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <p class="result-message">
            {{ resultInfo?.type === 'success'
              ? '메시지가 발송되었습니다.'
              : '이미 메시지가 발송되었습니다.' }}
          </p>

          <div class="url-info">
            <label>발송 URL:</label>
            <div class="url-box">
              {{ resultInfo?.mobileUrl }}
            </div>

            <!-- 성공: 만료 시간 표시 -->
            <p v-if="resultInfo?.type === 'success' && resultInfo?.tokenExpiresAt" class="info-time">
              만료 시간: {{ formatDateTime(resultInfo.tokenExpiresAt) }}
            </p>

            <!-- 중복: 발송 시각 표시 -->
            <p v-if="resultInfo?.type === 'duplicate' && resultInfo?.messageSentAt" class="info-time">
              발송 시각: {{ formatDateTime(resultInfo.messageSentAt) }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" @click="copyUrl">
            <i class="fas fa-copy" />
            URL 복사
          </button>
          <button class="btn-secondary" @click="handleClose">
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/format'

/**
 * 메시지 발송 결과 정보
 */
export interface MessageResultInfo {
  type: 'success' | 'duplicate'
  mobileUrl: string
  tokenExpiresAt?: string
  messageSentAt?: string
}

interface Props {
  show: boolean
  resultInfo: MessageResultInfo | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// 모달 닫기
const handleClose = () => {
  emit('close')
}

// URL 복사
const copyUrl = async () => {
  const url = document.querySelector('.url-box')?.textContent
  if (url) {
    try {
      await navigator.clipboard.writeText(url)
      alert('URL이 클립보드에 복사되었습니다.')
    } catch (err) {
      prompt('아래 URL을 복사하세요:', url)
    }
  }
}
</script>

<style scoped>
/* 모달 오버레이 */
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
  z-index: 9999;
}

/* 메시지 발송 결과 모달 */
.result-modal {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.result-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.result-modal .modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-success {
  color: #10b981;
}

.text-warning {
  color: #f59e0b;
}

.result-modal .close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
}

.result-modal .close-btn:hover {
  color: #374151;
}

.result-modal .modal-body {
  padding: 1.5rem;
}

.result-message {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #374151;
}

.url-info {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
}

.url-info label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.url-box {
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  word-break: break-all;
  color: #1f2937;
}

.info-time {
  margin: 0.75rem 0 0;
  font-size: 0.813rem;
  color: #6b7280;
}

.result-modal .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.result-modal .btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.result-modal .btn-primary:hover {
  background: #2563eb;
}

.result-modal .btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.result-modal .btn-secondary:hover {
  background: #e5e7eb;
}
</style>
