<template>
  <Teleport to="body">
    <div v-if="isOpen" class="error-popup-overlay">
      <!-- 배경 오버레이 -->
      <div class="error-popup-backdrop"></div>

      <!-- 팝업 컨텐츠 -->
      <div class="error-popup-content">
        <!-- 에러 아이콘 -->
        <div class="error-icon-wrapper">
          <div class="error-icon-circle">
            <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <!-- 팝업 헤더 -->
        <div class="error-header">
          <h3 class="error-title">{{ title }}</h3>
          <p class="error-message">{{ message }}</p>
        </div>

        <!-- 관리자 문의 안내 -->
        <div class="error-notice">
          <p class="error-notice-text">
            <i class="fas fa-info-circle"></i>
            관리자에게 문의 바랍니다.
          </p>
        </div>

        <!-- 확인 버튼 -->
        <button @click="close" class="error-confirm-btn">
          확인
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '오류 발생'
  },
  message: {
    type: String,
    default: '처리 중 오류가 발생했습니다.'
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
.error-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.error-popup-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.error-popup-content {
  position: relative;
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 2;
}

.error-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.error-icon-circle {
  width: 4rem;
  height: 4rem;
  background-color: #fee2e2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #dc2626;
}

.error-header {
  text-align: center;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.error-message {
  font-size: 1rem;
  color: #374151;
  white-space: pre-line;
}

.error-notice {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.error-notice-text {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
}

.error-notice-text i {
  margin-right: 0.25rem;
}

.error-confirm-btn {
  width: 100%;
  background-color: #dc2626;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.error-confirm-btn:hover {
  background-color: #b91c1c;
}

.error-confirm-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}
</style>
