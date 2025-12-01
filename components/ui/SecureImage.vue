<template>
  <div class="secure-image-wrapper">
    <!-- 로딩 중 -->
    <div v-if="loading" class="loading-placeholder">
      <i class="fas fa-spinner fa-spin"></i>
      <span>이미지 로딩 중...</span>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="error-placeholder">
      <i class="fas fa-exclamation-triangle"></i>
      <span>이미지 로드 실패</span>
    </div>

    <!-- 이미지 -->
    <img
      v-else-if="blobUrl"
      :src="blobUrl"
      :alt="alt"
      :class="imageClass"
      :loading="loadingStrategy"
      @error="handleImageError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getApiBaseUrl } from '~/services/api'

interface Props {
  src: string
  alt?: string
  loading?: 'lazy' | 'eager'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '이미지',
  loading: 'lazy',
  class: ''
})

const blobUrl = ref<string | null>(null)
const loading = ref(true)
const error = ref(false)
const imageClass = ref(props.class)
const loadingStrategy = ref(props.loading)

/**
 * 상대 경로 URL을 전체 URL로 변환
 * /api/... 형태의 URL에 API base URL을 추가
 */
const getFullUrl = (url: string): string => {
  if (!url) return ''

  // 이미 절대 URL인 경우 그대로 반환
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // /api/로 시작하는 상대 경로인 경우 base URL 추가
  if (url.startsWith('/api/')) {
    const baseUrl = getApiBaseUrl()
    // baseUrl이 이미 /api로 끝나면 /api 부분 제거
    // 예: http://localhost:9031/api + /api/admin/... → http://localhost:9031/api/admin/...
    return baseUrl.replace(/\/api$/, '') + url
  }

  return url
}

/**
 * JWT 인증이 필요한 이미지 로드
 * fetch를 사용하여 Authorization 헤더를 포함시킴
 * api-interceptor.ts가 자동으로 헤더를 추가함
 */
const loadImage = async () => {
  if (!props.src) {
    error.value = true
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = false

    // 상대 경로를 전체 URL로 변환
    const fullUrl = getFullUrl(props.src)

    // fetch는 plugins/api-interceptor.ts에서 자동으로 Authorization 헤더 추가
    const response = await fetch(fullUrl)

    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()

    // 이전 Blob URL이 있으면 정리
    if (blobUrl.value) {
      URL.revokeObjectURL(blobUrl.value)
    }

    blobUrl.value = URL.createObjectURL(blob)
  } catch (err) {
    console.error('SecureImage load error:', {
      originalSrc: props.src,
      fullUrl: getFullUrl(props.src),
      error: err
    })
    error.value = true
  } finally {
    loading.value = false
  }
}

/**
 * 이미지 로드 실패 핸들러
 */
const handleImageError = () => {
  console.error('Image element error:', props.src)
  error.value = true
}

// src 변경 시 재로드
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    loadImage()
  }
})

onMounted(() => {
  loadImage()
})

onUnmounted(() => {
  // 메모리 누수 방지: Blob URL 정리
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
  }
})
</script>

<style scoped>
.secure-image-wrapper {
  display: inline-block;
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-placeholder,
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
  min-height: 100px;
  width: 100%;
}

.loading-placeholder i {
  font-size: 1.5rem;
  color: #2563eb;
}

.error-placeholder {
  background: #fef2f2;
}

.error-placeholder i {
  font-size: 1.5rem;
  color: #ef4444;
}

.secure-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
