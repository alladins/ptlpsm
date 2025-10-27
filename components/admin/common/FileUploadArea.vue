<template>
  <div class="file-upload-section">
    <!-- 기존 파일 표시 -->
    <div v-if="existingFileName && !modelValue" class="existing-file">
      <div class="file-info">
        <i class="fas fa-file-pdf"></i>
        <div class="file-details">
          <span class="file-name">{{ existingFileName }}</span>
          <span v-if="existingFileSize" class="file-size">
            {{ formatFileSize(existingFileSize) }}
          </span>
        </div>
      </div>
      <div class="file-actions">
        <button
          v-if="showDownload"
          type="button"
          @click="$emit('download')"
          class="btn-download"
        >
          <i class="fas fa-download"></i>
          다운로드
        </button>
        <button type="button" @click="triggerUpload" class="btn-upload">
          <i class="fas fa-upload"></i>
          새로 업로드
        </button>
      </div>
    </div>

    <!-- 파일 업로드 영역 -->
    <div
      v-else-if="!modelValue"
      class="file-upload-area"
      @click="triggerUpload"
      @drop="handleDrop"
      @dragover.prevent
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".pdf"
        @change="handleChange"
        style="display: none"
      >
      <div class="upload-content">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>{{ uploadLabel || 'PDF 파일을 드래그하거나 클릭하여 업로드하세요' }}</p>
        <p class="upload-hint">{{ uploadHint || '최대 10MB, PDF 파일만 가능' }}</p>
      </div>
    </div>

    <!-- 선택된 파일 -->
    <div v-if="modelValue" class="selected-file">
      <i class="fas fa-file-pdf"></i>
      <span>{{ modelValue.name }}</span>
      <button type="button" @click="removeSelectedFile" class="remove-file-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: File | null
  existingFileName?: string
  existingFileSize?: number
  uploadLabel?: string
  uploadHint?: string
  showDownload?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: null,
  existingFileName: '',
  existingFileSize: 0,
  uploadLabel: 'PDF 파일을 드래그하거나 클릭하여 업로드하세요',
  uploadHint: '최대 10MB, PDF 파일만 가능',
  showDownload: true
})

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
  download: []
}>()

const fileInputRef = ref<HTMLInputElement>()

/**
 * 파일 크기 포맷팅
 */
const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 파일 검증
 */
const validateFile = (file: File): boolean => {
  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB를 초과할 수 없습니다.')
    return false
  }

  // 파일 형식 검증
  const validPdfTypes = [
    'application/pdf',
    'application/x-pdf',
    'application/acrobat',
    'application/octet-stream'
  ]
  const isValidPdf = validPdfTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith('.pdf')

  if (!isValidPdf) {
    alert('PDF 파일만 업로드 가능합니다.')
    return false
  }

  return true
}

/**
 * 파일 업로드 트리거
 */
const triggerUpload = () => {
  fileInputRef.value?.click()
}

/**
 * 파일 선택 핸들러
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (validateFile(file)) {
      emit('update:modelValue', file)
    }
  }
}

/**
 * 파일 드롭 핸들러
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (validateFile(file)) {
      emit('update:modelValue', file)
    }
  }
}

/**
 * 선택된 파일 제거
 */
const removeSelectedFile = () => {
  emit('update:modelValue', null)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<style scoped>
/* 스타일은 admin-common.css에서 자동 로드됨 */
</style>
