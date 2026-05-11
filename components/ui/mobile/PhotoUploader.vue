<template>
  <div class="photo-uploader">
    <div class="photo-grid">
      <!-- 업로드된 사진들 -->
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="photo-item"
      >
        <img :src="photo.preview || '/images/common/logo.png'" :alt="`사진 ${index + 1}`">
        <button
          class="btn-remove"
          type="button"
          title="삭제"
          @click="removePhoto(index)"
        >
          <i class="fas fa-times" />
        </button>
        <div class="photo-number">
          {{ index + 1 }}
        </div>
      </div>

      <!-- 사진 추가 버튼 -->
      <div
        v-if="photos.length < maxPhotos && !isCompressing"
        class="photo-item add-photo"
        @click="triggerFileInput"
      >
        <i class="fas fa-images" />
        <span>사진 추가</span>
        <span class="photo-count">{{ photos.length }}/{{ maxPhotos }}</span>
      </div>

      <!-- 압축 중 표시 -->
      <div
        v-if="isCompressing"
        class="photo-item compressing"
      >
        <i class="fas fa-spinner fa-spin" />
        <span>처리 중...</span>
      </div>
    </div>

    <!-- 안내 문구 -->
    <div class="photo-guide">
      <i class="fas fa-info-circle" />
      <span>사진을 탭하여 촬영하거나 앨범에서 최대 {{ maxPhotos }}장까지 선택할 수 있습니다</span>
    </div>

    <!-- 숨겨진 파일 입력 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileSelect"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { compressImageIfNeeded } from '~/utils/image-compress'
import { deliveryService } from '~/services/delivery.service'

interface Props {
  maxPhotos?: number
  token?: string // 서버 임시 업로드용 토큰
}

const props = withDefaults(defineProps<Props>(), {
  maxPhotos: 5,
  token: ''
})

interface Photo {
  file: File
  preview: string
  tempPhotoId: string // 서버 임시 사진 ID
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

  if (!files || files.length === 0) { return }

  const remainingSlots = props.maxPhotos - photos.value.length
  const filesToAdd = Array.from(files).slice(0, remainingSlots)

  // 처리 중 표시 (압축 + 업로드 완료까지)
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
          maxSizeBytes: 1 * 1024 * 1024
        })

        console.log(`[사진 처리] 1차 압축 결과: ${file.name} → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)

        // 1차 압축 후에도 크기가 크면 2차 압축
        if (processedFile.size > maxUploadSize) {
          console.log(`[사진 처리] 2차 압축 시도: ${file.name}`)
          processedFile = await compressImageIfNeeded(file, {
            maxWidth: 1280,
            maxHeight: 960,
            quality: 0.5,
            maxSizeBytes: 0
          })
          console.log(`[사진 처리] 2차 압축 결과: ${file.name} → ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`)
        }

        // 2차 압축 후에도 크기가 크면 3차 압축
        if (processedFile.size > maxUploadSize) {
          console.log(`[사진 처리] 3차 압축 시도: ${file.name}`)
          processedFile = await compressImageIfNeeded(file, {
            maxWidth: 1024,
            maxHeight: 768,
            quality: 0.3,
            maxSizeBytes: 0
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

        // 서버 임시 폴더에 즉시 업로드
        let tempPhotoId = ''
        if (props.token) {
          try {
            const result = await deliveryService.uploadTempPhoto(props.token, processedFile)
            tempPhotoId = result.tempPhotoId
            console.log(`[사진 처리] 서버 업로드 완료: tempPhotoId=${tempPhotoId}`)
          } catch (uploadError) {
            console.error('서버 임시 업로드 실패:', uploadError)
            alert(`사진 업로드에 실패했습니다: ${uploadError instanceof Error ? uploadError.message : '알 수 없는 오류'}`)
            continue
          }
        }

        photos.value.push({
          file: processedFile,
          preview,
          tempPhotoId
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

// 사진 삭제 (UI + 서버 temp 파일도 즉시 삭제)
const removePhoto = async (index: number) => {
  const confirmed = confirm('이 사진을 삭제하시겠습니까?')
  if (!confirmed) { return }

  const photo = photos.value[index]

  // 서버에 업로드된 사진이면 서버에서도 삭제
  if (photo.tempPhotoId && props.token) {
    try {
      await deliveryService.deleteTempPhoto(props.token, photo.tempPhotoId)
      console.log(`[사진 삭제] 서버 temp 파일 삭제 완료: tempPhotoId=${photo.tempPhotoId}`)
    } catch (err) {
      console.error('서버 사진 삭제 실패:', err)
      // 서버 삭제 실패해도 로컬에서는 제거
    }
  }

  photos.value.splice(index, 1)
}

// 서버 임시 사진 목록 복원 (페이지 재진입 시)
const loadExistingTempPhotos = async () => {
  if (!props.token) { return }
  try {
    const result = await deliveryService.getTempPhotos(props.token)
    if (result.photos && result.photos.length > 0) {
      for (const item of result.photos) {
        // 서버 스트리밍 URL로 미리보기 복원
        const previewUrl = deliveryService.getTempPhotoUrl(props.token, item.tempPhotoId)
        photos.value.push({
          file: new File([], item.fileName), // 빈 File (서버에 이미 있음)
          preview: previewUrl,
          tempPhotoId: item.tempPhotoId
        })
      }
      console.log(`[사진 복원] 기존 임시 사진 ${result.photos.length}장 복원됨`)
    }
  } catch (err) {
    console.error('기존 임시 사진 로드 실패:', err)
  }
}

// 사진 파일 가져오기 (하위 호환 - 기존 플로우용)
const getPhotos = (): File[] => {
  return photos.value.map(p => p.file)
}

// 업로드 완료된 사진 수 (temp 업로드 완료된 것)
const getUploadedCount = (): number => {
  return photos.value.filter(p => p.tempPhotoId).length
}

// 모든 사진이 업로드 완료되었는지
const hasAllUploaded = (): boolean => {
  return photos.value.length > 0 && photos.value.every(p => p.tempPhotoId)
}

// 사진 초기화 (외부에서 호출)
const clearPhotos = () => {
  photos.value = []
}

// Expose
defineExpose({
  getPhotos,
  clearPhotos,
  getUploadedCount,
  hasAllUploaded,
  loadExistingTempPhotos
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
