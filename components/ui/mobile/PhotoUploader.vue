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
        v-if="photos.length < maxPhotos && !isCompressing"
        class="photo-item add-photo"
        @click="triggerFileInput"
      >
        <i class="fas fa-camera"></i>
        <span>사진 추가</span>
        <span class="photo-count">{{ photos.length }}/{{ maxPhotos }}</span>
      </div>

      <!-- 압축 중 표시 -->
      <div
        v-if="isCompressing"
        class="photo-item compressing"
      >
        <i class="fas fa-spinner fa-spin"></i>
        <span>처리 중...</span>
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
import { compressImageIfNeeded } from '~/utils/image-compress'

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
const isCompressing = ref(false)

// 파일 입력 트리거
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 파일 선택 처리
const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) return

  const remainingSlots = props.maxPhotos - photos.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)

  // 압축 중 표시
  isCompressing.value = true

  // 서버 업로드 최대 크기 (10MB - 서버 제한 고려)
  const maxUploadSize = 10 * 1024 * 1024

  try {
    for (const file of filesToAdd) {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        console.warn('이미지 파일만 업로드 가능합니다:', file.name)
        continue
      }

      try {
        // 1차 압축 시도 (75% 품질)
        let processedFile = await compressImageIfNeeded(file, {
          maxWidth: 1920,
          maxHeight: 1440,
          quality: 0.75,
          maxSizeBytes: 1 * 1024 * 1024  // 1MB 초과 시 압축
        })

        console.log(`[사진 처리] 1차 압축 결과: ${file.name} → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)

        // 1차 압축 후에도 크기가 크면 2차 압축 (50% 품질, 해상도 축소)
        if (processedFile.size > maxUploadSize) {
          console.log(`[사진 처리] 2차 압축 시도: ${file.name}`)
          processedFile = await compressImageIfNeeded(file, {
            maxWidth: 1280,
            maxHeight: 960,
            quality: 0.5,
            maxSizeBytes: 0  // 무조건 압축
          })
          console.log(`[사진 처리] 2차 압축 결과: ${file.name} → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)
        }

        // 2차 압축 후에도 크기가 크면 3차 압축 (30% 품질)
        if (processedFile.size > maxUploadSize) {
          console.log(`[사진 처리] 3차 압축 시도: ${file.name}`)
          processedFile = await compressImageIfNeeded(file, {
            maxWidth: 1024,
            maxHeight: 768,
            quality: 0.3,
            maxSizeBytes: 0  // 무조건 압축
          })
          console.log(`[사진 처리] 3차 압축 결과: ${file.name} → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)
        }

        // 최종 크기 검증
        if (processedFile.size > maxUploadSize) {
          alert(`파일 크기가 너무 큽니다: ${file.name}\n압축 후에도 ${(processedFile.size / 1024 / 1024).toFixed(1)}MB입니다.\n최대 10MB까지 가능합니다.`)
          continue
        }

        // 미리보기 생성
        const preview = await createPreview(processedFile)

        photos.value.push({
          file: processedFile,
          preview
        })

        console.log(`[사진 처리] 완료: ${file.name} (원본: ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB)`)
      } catch (error) {
        console.error('이미지 처리 실패:', file.name, error)
        alert(`이미지 처리 실패: ${file.name}`)
      }
    }
  } finally {
    isCompressing.value = false

    // Input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

// 미리보기 생성 헬퍼
const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('미리보기 생성 실패'))
      }
    }

    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'))
    }

    reader.readAsDataURL(file)
  })
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

/* 압축 중 표시 */
.compressing {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px solid #cbd5e1;
  background: #f8fafc;
}

.compressing i {
  font-size: 1.5rem;
  color: #3b82f6;
}

.compressing span {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
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
