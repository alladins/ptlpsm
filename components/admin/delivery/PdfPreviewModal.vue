<template>
  <Teleport to="body">
    <div v-if="show" class="pdf-preview-modal">
      <div class="modal-content">
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <h3>
            <i class="fas fa-file-pdf"></i>
            납품 영수증 PDF
          </h3>
          <button class="btn-close" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body">
          <!-- 로딩 중 -->
          <div v-if="loading" class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>PDF 로딩 중...</span>
          </div>

          <!-- 에러 -->
          <div v-else-if="error" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <span>PDF 로드에 실패했습니다</span>
            <button @click="loadPdf" class="btn-retry">
              <i class="fas fa-redo"></i>
              다시 시도
            </button>
          </div>

          <!-- PDF 미리보기 -->
          <div v-else-if="pdfBlobUrl" class="pdf-preview">
            <iframe
              :src="pdfBlobUrl"
              class="pdf-iframe"
              frameborder="0"
              title="PDF 미리보기"
            ></iframe>
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <button @click="downloadPdf" class="btn-download" :disabled="!pdfBlobUrl">
            <i class="fas fa-download"></i>
            PDF 다운로드
          </button>
          <button @click="$emit('close')" class="btn-close-bottom">
            <i class="fas fa-times"></i>
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  pdfUrl: string
  deliveryId?: number
  fileName?: string
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pdfBlobUrl = ref<string | null>(null)
const loading = ref(true)
const error = ref(false)

/**
 * JWT 인증이 필요한 PDF 로드
 * fetch를 사용하여 Authorization 헤더를 포함시킴
 * api-interceptor.ts가 자동으로 헤더를 추가함
 */
const loadPdf = async () => {
  if (!props.pdfUrl) {
    error.value = true
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = false

    // fetch는 plugins/api-interceptor.ts에서 자동으로 Authorization 헤더 추가
    const response = await fetch(props.pdfUrl)

    if (!response.ok) {
      throw new Error(`PDF fetch failed: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()

    // 이전 Blob URL이 있으면 정리
    if (pdfBlobUrl.value) {
      URL.revokeObjectURL(pdfBlobUrl.value)
    }

    // PDF Blob URL 생성
    pdfBlobUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    console.error('PdfPreviewModal load error:', {
      pdfUrl: props.pdfUrl,
      error: err
    })
    error.value = true
  } finally {
    loading.value = false
  }
}

/**
 * PDF 다운로드
 */
const downloadPdf = () => {
  if (!pdfBlobUrl.value) return

  const link = document.createElement('a')
  link.href = pdfBlobUrl.value
  link.download = props.fileName || `납품영수증_${props.deliveryId || 'unknown'}.pdf`
  link.click()
}

/**
 * ESC 키로 모달 닫기
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

// show prop 변경 시 PDF 로드
watch(() => props.show, (newShow) => {
  if (newShow && props.pdfUrl) {
    loadPdf()
  }
})

// show prop 변경 시 키보드 이벤트 리스너 관리
watch(() => props.show, (newShow) => {
  if (newShow) {
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onMounted(() => {
  if (props.show && props.pdfUrl) {
    loadPdf()
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 메모리 누수 방지: Blob URL 정리
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.pdf-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 1000px;
  width: 95%;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem 0.5rem 0 0;
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
  color: #ef4444;
  font-size: 1.25rem;
}

.btn-close {
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.btn-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 500px;
  overflow: hidden;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #6b7280;
}

.loading-state i {
  font-size: 3rem;
  color: #2563eb;
}

.loading-state span {
  font-size: 1rem;
  font-weight: 500;
}

.error-state {
  background: #fef2f2;
  padding: 2rem;
  border-radius: 0.5rem;
}

.error-state i {
  font-size: 3rem;
  color: #ef4444;
}

.error-state span {
  font-size: 1rem;
  font-weight: 500;
  color: #991b1b;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-retry:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
}

.pdf-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pdf-iframe {
  width: 100%;
  height: 600px;
  border-radius: 0.375rem;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
  border-radius: 0 0 0.5rem 0.5rem;
}

.btn-download {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);
}

.btn-download:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.5;
}

.btn-download i {
  font-size: 1.125rem;
}

.btn-close-bottom {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-bottom:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-close-bottom i {
  font-size: 1.125rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 0.75rem 1rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
    min-height: 400px;
  }

  .pdf-iframe {
    height: 500px;
  }

  .modal-footer {
    padding: 0.75rem 1rem;
    flex-direction: column;
  }

  .btn-download,
  .btn-close-bottom {
    width: 100%;
  }
}
</style>
