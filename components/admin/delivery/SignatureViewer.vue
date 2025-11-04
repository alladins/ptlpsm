<template>
  <!-- Compact 모드 -->
  <div v-if="compact" class="pdf-download-compact">
    <a v-if="hasSignature && fullPdfUrl" :href="fullPdfUrl" target="_blank" class="pdf-button-mini" title="PDF 다운로드">
      <i class="fas fa-file-pdf"></i>
    </a>
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
      <a :href="fullPdfUrl" target="_blank" class="btn-download-pdf">
        <i class="fas fa-file-pdf"></i>
        PDF 다운로드
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getApiBaseUrl } from '~/services/api'

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
/* Compact 모드 - PDF 다운로드 */
.pdf-download-compact {
  display: inline-block;
}

.pdf-button-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #dc2626;
  border-radius: 0.25rem;
  background: #dc2626;
  color: white;
  font-size: 1.25rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

.pdf-button-mini:hover {
  background: #b91c1c;
  border-color: #b91c1c;
  color: white;
  box-shadow: 0 4px 6px rgba(220, 38, 38, 0.4);
  transform: scale(1.1);
}

.pdf-button-mini.pdf-disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  color: white;
  cursor: not-allowed;
  opacity: 0.6;
}

.pdf-button-mini.pdf-disabled:hover {
  transform: none;
  box-shadow: 0 2px 4px rgba(156, 163, 175, 0.2);
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

.btn-download-pdf {
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
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download-pdf:hover {
  background: #dc2626;
  color: white;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  transform: translateY(-1px);
}

.btn-download-pdf i {
  font-size: 1rem;
}
</style>
