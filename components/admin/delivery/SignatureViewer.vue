<template>
  <!-- Compact 모드 -->
  <div v-if="compact" class="pdf-download-compact">
    <div
      v-if="hasSignature && fullPdfUrl"
      class="pdf-thumbnail"
      @click="openPdfModal"
      title="PDF 미리보기"
    >
      <div class="pdf-icon">
        <i class="fas fa-file-pdf"></i>
      </div>
      <div class="pdf-overlay">
        <i class="fas fa-search-plus"></i>
      </div>
    </div>
  </div>

  <!-- 일반 모드 -->
  <div v-else class="pdf-download-viewer">
    <!-- PDF 없을 때 -->
    <div v-if="!hasSignature || !fullPdfUrl" class="no-pdf">
      <i class="fas fa-file-pdf"></i>
      <span>PDF 없음</span>
    </div>

    <!-- PDF 있을 때 -->
    <div v-else class="pdf-download-container">
      <button @click="openPdfModal" class="btn-preview-pdf">
        <i class="fas fa-search"></i>
        PDF 미리보기
      </button>
    </div>
  </div>

  <!-- PDF 미리보기 모달 -->
  <AdminDeliveryPdfPreviewModal
    v-if="showPdfModal"
    :pdf-url="fullPdfUrl || ''"
    :delivery-id="deliveryId ?? undefined"
    :file-name="`납품영수증_${deliveryId}.pdf`"
    :show="showPdfModal"
    @close="showPdfModal = false"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getApiBaseUrl } from '~/services/api'
import AdminDeliveryPdfPreviewModal from './PdfPreviewModal.vue'

interface Props {
  pdfFileUrl?: string | null
  deliveryId?: number | null
  hasSignature: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pdfFileUrl: null,
  deliveryId: null,
  compact: false
})

const showPdfModal = ref(false)

const openPdfModal = () => {
  showPdfModal.value = true
}

// 완전한 PDF URL 생성 (상대 경로 → 절대 경로)
const fullPdfUrl = computed(() => {
  const baseUrl = getApiBaseUrl()

  // 1순위: pdfFileUrl이 있으면 사용
  if (props.pdfFileUrl) {
    // 이미 완전한 URL이면 그대로 반환
    if (props.pdfFileUrl.startsWith('http://') || props.pdfFileUrl.startsWith('https://')) {
      return props.pdfFileUrl
    }

    // /api/... 형태면 baseUrl의 /api를 제거하고 결합
    if (props.pdfFileUrl.startsWith('/api/')) {
      return props.pdfFileUrl.replace('/api/', `${baseUrl}/`)
    }

    // 일반 상대 경로
    return props.pdfFileUrl.startsWith('/')
      ? `${baseUrl}${props.pdfFileUrl}`
      : `${baseUrl}/${props.pdfFileUrl}`
  }

  // 2순위: deliveryId로 fallback URL 생성
  if (props.deliveryId) {
    return `${baseUrl}/admin/deliveries/${props.deliveryId}/receipt-pdf`
  }

  return null
})
</script>

<style scoped>
/* Compact 모드 - PDF 썸네일 */
.pdf-download-compact {
  display: inline-block;
}

.pdf-thumbnail {
  position: relative;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.pdf-thumbnail:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.pdf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
  font-size: 1.25rem;
}

.pdf-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;
  font-size: 1rem;
}

.pdf-thumbnail:hover .pdf-overlay {
  opacity: 1;
}

/* 일반 모드 - PDF 다운로드 */
.pdf-download-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* PDF 없을 때 */
.no-pdf {
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

.no-pdf i {
  font-size: 1rem;
  color: #dc2626;
}

/* PDF 다운로드 컨테이너 */
.pdf-download-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-preview-pdf {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 2px solid #dc2626;
  border-radius: 0.375rem;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview-pdf:hover {
  background: #dc2626;
  color: white;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  transform: translateY(-1px);
}

.btn-preview-pdf i {
  font-size: 1rem;
}
</style>
