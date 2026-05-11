<template>
  <div class="file-upload-section">
    <!-- 기존 파일 표시 -->
    <div v-if="existingFileName && !modelValue" class="existing-file">
      <div class="file-info">
        <i :class="fileIconClass" />
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
          class="btn-download"
          @click="$emit('download')"
        >
          <i class="fas fa-download" />
          다운로드
        </button>
        <button type="button" class="btn-upload" @click="triggerUpload">
          <i class="fas fa-upload" />
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
        :accept="acceptAttribute"
        style="display: none"
        @change="handleChange"
      >
      <div class="upload-content">
        <i class="fas fa-cloud-upload-alt" />
        <p>{{ uploadLabel || defaultUploadLabel }}</p>
        <p class="upload-hint">
          {{ uploadHint || defaultUploadHint }}
        </p>
      </div>
    </div>

    <!-- 선택된 파일 -->
    <div v-if="modelValue" class="selected-file">
      <i :class="fileIconClass" />
      <span>{{ modelValue.name }}</span>
      <button type="button" class="remove-file-btn" @click="removeSelectedFile">
        <i class="fas fa-times" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: File | null
  existingFileName?: string
  existingFileSize?: number
  uploadLabel?: string
  uploadHint?: string
  showDownload?: boolean
  /** 허용 확장자 목록 (확장자만, 점 없이). 기본: ['pdf'] */
  acceptExtensions?: string[]
  /** 추가 MIME 타입 (HTML accept 속성용). 비우면 확장자 기반으로 자동 구성 */
  acceptMimeTypes?: string
  /** 최대 파일 크기 (MB). 기본: 10 */
  maxSizeMB?: number
  /** 표시용 파일 아이콘 클래스 (FontAwesome). 비우면 확장자 기반 자동 결정 */
  fileIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  existingFileName: '',
  existingFileSize: 0,
  uploadLabel: '',
  uploadHint: '',
  showDownload: true,
  acceptExtensions: () => ['pdf'],
  acceptMimeTypes: '',
  maxSizeMB: 10,
  fileIcon: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
  download: []
}>()

const fileInputRef = ref<HTMLInputElement>()

/**
 * input accept 속성 값
 */
const acceptAttribute = computed(() => {
  if (props.acceptMimeTypes) {
    return props.acceptMimeTypes
  }
  return props.acceptExtensions.map(ext => `.${ext.replace(/^\./, '')}`).join(',')
})

/**
 * 확장자 라벨 (대문자 표시용)
 */
const extensionsLabel = computed(() => {
  return props.acceptExtensions.map(e => e.replace(/^\./, '').toUpperCase()).join('/')
})

/**
 * 기본 업로드 라벨
 */
const defaultUploadLabel = computed(() => {
  return `${extensionsLabel.value} 파일을 드래그하거나 클릭하여 업로드하세요`
})

/**
 * 기본 업로드 힌트
 */
const defaultUploadHint = computed(() => {
  return `최대 ${props.maxSizeMB}MB, ${extensionsLabel.value} 파일만 가능`
})

/**
 * 파일 아이콘 클래스 (확장자 기반 자동 결정)
 */
const fileIconClass = computed(() => {
  if (props.fileIcon) { return props.fileIcon }
  const exts = props.acceptExtensions.map(e => e.replace(/^\./, '').toLowerCase())
  if (exts.length === 1 && exts[0] === 'pdf') { return 'fas fa-file-pdf' }
  if (exts.every(e => ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e))) { return 'fas fa-file-image' }
  return 'fas fa-file'
})

/**
 * 파일 크기 포맷팅
 */
const formatFileSize = (bytes: number): string => {
  if (!bytes) { return '0 B' }
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 파일 검증
 */
const validateFile = (file: File): boolean => {
  // 파일 크기 검증
  const maxBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    alert(`파일 크기는 ${props.maxSizeMB}MB를 초과할 수 없습니다.`)
    return false
  }

  // 파일 확장자 검증
  const allowedExts = props.acceptExtensions.map(e => e.replace(/^\./, '').toLowerCase())
  const fileName = file.name.toLowerCase()
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() || '' : ''
  const isValidExt = allowedExts.includes(fileExt)

  if (!isValidExt) {
    alert(`허용된 파일 형식이 아닙니다. (${extensionsLabel.value} 만 가능)`)
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
