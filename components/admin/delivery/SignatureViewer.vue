<template>
  <!-- Compact 모드 -->
  <div v-if="compact" class="signature-viewer-compact">
    <div v-if="hasSignature && signatureUrl" class="signature-thumbnail-mini" @click="openModal">
      <img :src="signatureUrl" alt="서명" loading="lazy">
    </div>
  </div>

  <!-- 일반 모드 -->
  <div v-else class="signature-viewer">
    <!-- 서명 없을 때 -->
    <div v-if="!hasSignature" class="no-signature">
      <i class="fas fa-signature"></i>
      <span>서명 없음</span>
    </div>

    <!-- 서명 있을 때 -->
    <div v-else class="signature-container">
      <div class="signature-thumbnail" @click="openModal">
        <img :src="signatureUrl" alt="서명" loading="lazy">
        <div class="thumbnail-overlay">
          <i class="fas fa-search-plus"></i>
          <span>확대</span>
        </div>
      </div>
      <button class="btn-view" @click="openModal">
        <i class="fas fa-eye"></i>
        서명 보기
      </button>
    </div>
  </div>

    <!-- 모달 -->
    <Teleport to="body">
      <div v-if="showModal" class="signature-modal" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-signature"></i>
              현장소장 서명
            </h3>
            <button class="btn-close" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <img :src="signatureUrl" alt="서명 원본" class="signature-full">
          </div>
        </div>
      </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  signatureUrl: string | null
  hasSignature: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false
})

const showModal = ref(false)

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}
</script>

<style scoped>
/* Compact 모드 */
.signature-viewer-compact {
  display: inline-block;
}

.signature-thumbnail-mini {
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.signature-thumbnail-mini:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  transform: scale(1.05);
}

.signature-thumbnail-mini img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: white;
}

/* 일반 모드 */
.signature-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 서명 없을 때 */
.no-signature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 0.375rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.no-signature i {
  font-size: 1rem;
}

/* 서명 있을 때 */
.signature-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.signature-thumbnail {
  position: relative;
  width: 80px;
  height: 80px;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.signature-thumbnail:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
}

.signature-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: white;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
  font-size: 0.75rem;
}

.signature-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-overlay i {
  font-size: 1.25rem;
}

.btn-view {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.btn-view i {
  font-size: 1rem;
}

/* 모달 */
.signature-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-header i {
  color: #2563eb;
}

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.signature-full {
  max-width: 100%;
  max-height: 400px;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
}

/* 반응형 */
@media (max-width: 768px) {
  .signature-modal {
    padding: 0.5rem;
  }

  .modal-content {
    max-width: 100%;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .signature-full {
    max-height: 300px;
  }
}
</style>
