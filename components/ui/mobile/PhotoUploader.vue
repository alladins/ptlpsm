<template>
  <div class="photo-uploader">
    <div class="photo-grid">
      <!-- 업로드된 사진들 -->
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="photo-item"
      >
        <img :src="photo.preview" :alt="`사진 ${index + 1}`">
        <button
          class="btn-remove"
          @click="removePhoto(index)"
          type="button"
          title="삭제"
        >
          <i class="fas fa-times"></i>
        </button>
        <div class="photo-number">{{ index + 1 }}</div>
      </div>

      <!-- 사진 추가 버튼 -->
      <div
        v-if="photos.length < maxPhotos"
        class="photo-item add-photo"
        @click="triggerFileInput"
      >
        <i class="fas fa-camera"></i>
        <span>사진 추가</span>
        <span class="photo-count">{{ photos.length }}/{{ maxPhotos }}</span>
      </div>
    </div>

    <!-- 안내 문구 -->
    <div class="photo-guide">
      <i class="fas fa-info-circle"></i>
      <span>사진을 탭하여 {{ maxPhotos }}장까지 촬영할 수 있습니다</span>
    </div>

    <!-- 숨겨진 파일 입력 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      multiple
      @change="handleFileSelect"
      style="display: none"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  maxPhotos?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxPhotos: 5
})

interface Photo {
  file: File
  preview: string
}

// State
const photos = ref<Photo[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 파일 선택 처리
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  const remainingSlots = props.maxPhotos - photos.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)

  filesToAdd.forEach(file => {
    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      console.warn('이미지 파일만 업로드 가능합니다:', file.name)
      return
    }

    // 파일 크기 검증 (10MB 제한)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert(`파일 크기가 너무 큽니다: ${file.name}\n최대 10MB까지 가능합니다.`)
      return
    }

    // 미리보기 생성
    const reader = new FileReader()

    reader.onload = (e) => {
      if (e.target?.result) {
        photos.value.push({
          file,
          preview: e.target.result as string
        })
      }
    }

    reader.onerror = () => {
      console.error('파일 읽기 실패:', file.name)
      alert('파일을 읽는데 실패했습니다.')
    }

    reader.readAsDataURL(file)
  })

  // Input 초기화 (같은 파일 재선택 가능하도록)
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 사진 삭제
const removePhoto = (index: number) => {
  const confirmed = confirm('이 사진을 삭제하시겠습니까?')
  if (confirmed) {
    photos.value.splice(index, 1)
  }
}

// 사진 파일 가져오기 (외부에서 호출)
const getPhotos = (): File[] => {
  return photos.value.map(p => p.file)
}

// 사진 초기화 (외부에서 호출)
const clearPhotos = () => {
  photos.value = []
}

// Expose
defineExpose({
  getPhotos,
  clearPhotos
})
</script>

<style scoped>
.photo-uploader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f3f4f6;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-remove:hover {
  background: rgba(185, 28, 28, 0.95);
  transform: scale(1.1);
}

.btn-remove:active {
  transform: scale(0.95);
}

.photo-number {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  width: 28px;
  height: 28px;
  background: rgba(37, 99, 235, 0.9);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.add-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px dashed #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.add-photo:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.add-photo:active {
  transform: scale(0.98);
}

.add-photo i {
  font-size: 2rem;
  color: #6b7280;
}

.add-photo span {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.add-photo .photo-count {
  font-size: 0.75rem;
  color: #9ca3af;
}

.photo-guide {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #eff6ff;
  color: #1e40af;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.photo-guide i {
  flex-shrink: 0;
}

/* 작은 화면 대응 */
@media (max-width: 640px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .add-photo i {
    font-size: 1.5rem;
  }

  .add-photo span {
    font-size: 0.75rem;
  }
}

/* 매우 작은 화면 */
@media (max-width: 375px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) {
  .add-photo:active {
    border-color: #1d4ed8;
    background: #dbeafe;
  }

  .btn-remove:active {
    background: rgba(153, 27, 27, 1);
  }
}
</style>
