<template>
  <!-- Compact 모드 -->
  <div v-if="compact" class="photo-gallery-compact">
    <div
      v-for="(url, index) in compactPhotos"
      :key="index"
      class="photo-thumbnail-mini"
      @click="openGallery(index)"
    >
      <UiSecureImage :src="url" :alt="`사진 ${index + 1}`" loading="lazy" />
      <!-- 선택 모드일 때 순서 배지 -->
      <div v-if="selectionMode && isPhotoSelected(index)" class="mini-order-badge">
        {{ getSelectionOrder(index) }}
      </div>
    </div>

    <!-- 더보기 배지 -->
    <div v-if="photoCount > maxShow" class="more-badge" @click="openGallery(0)">
      +{{ photoCount - maxShow }}
    </div>
  </div>

  <!-- 일반 모드 -->
  <div v-else class="photo-gallery">
    <!-- 사진 없을 때 -->
    <div v-if="photoCount === 0" class="no-photos">
      <i class="fas fa-camera"></i>
      <span>사진 없음</span>
    </div>

    <!-- 사진 있을 때 -->
    <div v-else class="photos-container">
      <div class="photo-thumbnails">
        <div
          v-for="(url, index) in displayedPhotos"
          :key="index"
          class="photo-thumbnail"
          @click="openGallery(index)"
        >
          <UiSecureImage :src="url" :alt="`사진 ${index + 1}`" loading="lazy" />
          <div class="thumbnail-overlay">
            <i class="fas fa-search-plus"></i>
          </div>
        </div>

        <!-- 더보기 버튼 (3장 초과 시) -->
        <div v-if="photoCount > 3" class="photo-more" @click="openGallery(0)">
          <i class="fas fa-images"></i>
          <span>+{{ photoCount - 3 }}</span>
        </div>
      </div>

      <div class="photo-info">
        <i class="fas fa-image"></i>
        <span>{{ photoCount }}장</span>
      </div>
    </div>
  </div>

  <!-- 갤러리 모달 -->
  <Teleport to="body">
    <div v-if="showGallery" class="gallery-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-images"></i>
            {{ selectionMode ? '사진대지 선택' : '납품 사진' }} ({{ currentIndex + 1 }} / {{ photoCount }})
          </h3>
          <button class="btn-close" @click="closeGallery">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 이전 버튼 -->
          <button
            v-if="photoCount > 1"
            class="nav-btn nav-prev"
            @click="prevPhoto"
            :disabled="currentIndex === 0"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <!-- 현재 이미지 -->
          <div
            class="photo-display"
            :class="{
              'selected': selectionMode && isPhotoSelected(currentIndex),
              'disabled': selectionMode && !canSelectMore && !isPhotoSelected(currentIndex)
            }"
            @click="selectionMode ? togglePhotoSelection(currentIndex) : null"
          >
            <UiSecureImage
              :src="photoUrls[currentIndex]"
              :alt="`사진 ${currentIndex + 1}`"
              class="photo-full"
              loading="eager"
            />

            <!-- 선택된 사진 순서 배지 (좌상단) -->
            <div v-if="selectionMode && isPhotoSelected(currentIndex)" class="selection-order-badge">
              {{ getSelectionOrder(currentIndex) }}
            </div>

            <!-- 선택 가능 힌트 오버레이 -->
            <div
              v-if="selectionMode && !isPhotoSelected(currentIndex) && canSelectMore"
              class="select-hint-overlay"
            >
              <div class="hint-content">
                <i class="fas fa-hand-pointer"></i>
                <span>클릭하여 선택</span>
              </div>
            </div>

            <!-- 최대 선택 시 비활성 오버레이 -->
            <div
              v-if="selectionMode && !isPhotoSelected(currentIndex) && !canSelectMore"
              class="disabled-overlay"
            >
              <div class="disabled-content">
                <i class="fas fa-ban"></i>
                <span>최대 2장 선택됨</span>
              </div>
            </div>
          </div>

          <!-- 다음 버튼 -->
          <button
            v-if="photoCount > 1"
            class="nav-btn nav-next"
            @click="nextPhoto"
            :disabled="currentIndex === photoCount - 1"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- 푸터 영역 -->
        <div class="modal-footer">
          <!-- 썸네일 네비게이션 -->
          <div v-if="photoCount > 1" class="thumbnail-nav">
            <div
              v-for="(url, index) in photoUrls"
              :key="index"
              class="thumb-item"
              :class="{
                active: index === currentIndex,
                selected: selectionMode && isPhotoSelected(index),
                'disabled-selection': selectionMode && !isPhotoSelected(index) && !canSelectMore
              }"
              @click="currentIndex = index"
            >
              <UiSecureImage :src="url" :alt="`썸네일 ${index + 1}`" loading="lazy" />
              <!-- 선택된 사진에 순서 배지 표시 -->
              <div v-if="selectionMode && isPhotoSelected(index)" class="thumb-order-badge">
                {{ getSelectionOrder(index) }}
              </div>
            </div>
          </div>

          <!-- 선택 모드일 때 저장/취소 버튼 -->
          <div v-if="selectionMode" class="selection-actions">
            <button class="btn-cancel" @click="closeGallery" :disabled="saving">
              <i class="fas fa-times"></i>
              취소
            </button>
            <button
              class="btn-save"
              @click="savePhotoSelection"
              :disabled="saving || selectedIndices.length === 0"
            >
              <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              {{ saving ? '저장 중...' : '선택 완료' }}
            </button>
          </div>

          <!-- 일반 모드일 때 닫기 버튼 -->
          <button v-else class="btn-close-bottom" @click="closeGallery">
            <i class="fas fa-times"></i>
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import UiSecureImage from '~/components/ui/SecureImage.vue'
import { updatePhotoSelection } from '~/services/delivery-done.service'

interface Props {
  photoUrls: string[]
  photoCount: number
  compact?: boolean
  maxShow?: number
  selectionMode?: boolean           // 선택 모드 활성화 여부
  deliveryId?: number               // 출하 ID (선택 저장용)
  photoIds?: number[]               // 실제 사진 ID 배열
  initialSelectedIndices?: number[] // 초기 선택된 사진 인덱스들
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  maxShow: 3,
  selectionMode: false,
  photoIds: () => [],
  initialSelectedIndices: () => []
})

const emit = defineEmits<{
  saved: []
}>()

const showGallery = ref(false)
const currentIndex = ref(0)
const selectedIndices = ref<number[]>([])
const saving = ref(false)

// 초기 선택 상태 복원
watch(() => props.initialSelectedIndices, (newVal) => {
  if (newVal && newVal.length > 0) {
    selectedIndices.value = [...newVal]
  }
}, { immediate: true })

// 최대 3장까지만 썸네일 표시 (일반 모드)
const displayedPhotos = computed(() => {
  return props.photoUrls.slice(0, 3)
})

// Compact 모드용 사진 (maxShow 개수만큼)
const compactPhotos = computed(() => {
  return props.photoUrls.slice(0, props.maxShow)
})

const openGallery = (index: number) => {
  currentIndex.value = index
  showGallery.value = true
}

const closeGallery = () => {
  showGallery.value = false
}

const prevPhoto = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const nextPhoto = () => {
  if (currentIndex.value < props.photoCount - 1) {
    currentIndex.value++
  }
}

// 사진 선택 여부 확인
const isPhotoSelected = (index: number): boolean => {
  return selectedIndices.value.includes(index)
}

// 선택 가능 여부
const canSelectMore = computed(() => {
  return selectedIndices.value.length < 2
})

// 선택 순서 가져오기 (1 또는 2)
const getSelectionOrder = (index: number): number => {
  return selectedIndices.value.indexOf(index) + 1
}

// 사진 선택 토글
const togglePhotoSelection = (index: number) => {
  const photoIndex = selectedIndices.value.indexOf(index)

  if (photoIndex > -1) {
    // 이미 선택됨 → 해제
    selectedIndices.value.splice(photoIndex, 1)
  } else {
    // 선택 안됨 → 추가
    if (canSelectMore.value) {
      selectedIndices.value.push(index)
    }
  }
}

// 선택 저장
const savePhotoSelection = async () => {
  if (!props.deliveryId) {
    alert('필수 정보가 누락되었습니다.')
    return
  }

  if (selectedIndices.value.length === 0) {
    alert('최소 1장 이상 선택해주세요.')
    return
  }

  // photoIds가 없으면 에러
  if (!props.photoIds || props.photoIds.length === 0) {
    alert('사진 정보가 없습니다.')
    return
  }

  saving.value = true
  try {
    // 인덱스를 실제 photoId로 변환
    const photoIds = selectedIndices.value.map(idx => props.photoIds![idx])

    await updatePhotoSelection({
      deliveryId: props.deliveryId,
      photoIds
    })

    alert('사진 선택이 저장되었습니다.')
    emit('saved')
    closeGallery()
  } catch (error) {
    console.error('Failed to save photo selection:', error)
    alert('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

// 키보드 네비게이션
const handleKeydown = (e: KeyboardEvent) => {
  if (!showGallery.value) return

  if (e.key === 'ArrowLeft') {
    prevPhoto()
  } else if (e.key === 'ArrowRight') {
    nextPhoto()
  } else if (e.key === 'Escape') {
    closeGallery()
  } else if (e.key === ' ' && props.selectionMode) {
    // 스페이스바로 선택/해제
    e.preventDefault()
    togglePhotoSelection(currentIndex.value)
  }
}

// 마운트 시 키보드 이벤트 리스너 추가
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
/* ===== Compact 모드 ===== */
.photo-gallery-compact {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.photo-thumbnail-mini {
  position: relative;
  width: 40px;
  height: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.photo-thumbnail-mini:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  transform: scale(1.05);
}

.photo-thumbnail-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-order-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.more-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.more-badge:hover {
  background: #e5e7eb;
  border-color: #2563eb;
  color: #374151;
}

/* ===== 일반 모드 ===== */
.photo-gallery {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-photos {
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

.no-photos i {
  font-size: 1rem;
}

.photos-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.photo-thumbnails {
  display: flex;
  gap: 0.5rem;
}

.photo-thumbnail {
  position: relative;
  width: 60px;
  height: 60px;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.photo-thumbnail:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
}

.photo-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-overlay {
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
}

.photo-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.thumbnail-overlay i {
  font-size: 1.25rem;
}

.photo-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  gap: 0.25rem;
}

.photo-more:hover {
  background: #e5e7eb;
  border-color: #2563eb;
}

.photo-more i {
  font-size: 1.25rem;
  color: #6b7280;
}

.photo-more span {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.photo-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* ===== 갤러리 모달 ===== */
.gallery-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(180deg, white 0%, #f9fafb 100%);
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

.modal-header h3 i {
  color: #10b981;
}

.btn-close {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
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
  background: #ef4444;
  color: white;
}

/* ===== 모달 바디 ===== */
.modal-body {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #111827;
  min-height: 400px;
}

.photo-display {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 500px;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.photo-display.selected {
  box-shadow: 0 0 0 4px #10b981, 0 0 30px rgba(16, 185, 129, 0.4);
}

.photo-display.disabled {
  cursor: not-allowed;
}

.photo-full {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.375rem;
}

/* 선택 순서 배지 */
.selection-order-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 56px;
  height: 56px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5), 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 3px solid white;
  z-index: 10;
  animation: badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

/* 선택 힌트 오버레이 */
.select-hint-overlay {
  position: absolute;
  inset: 0;
  background: rgba(16, 185, 129, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 0.375rem;
}

.photo-display:hover .select-hint-overlay {
  opacity: 1;
}

.hint-content {
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  color: #059669;
  font-weight: 600;
  font-size: 1rem;
}

.hint-content i {
  font-size: 1.25rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 비활성 오버레이 */
.disabled-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
}

.disabled-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  font-weight: 600;
}

.disabled-content i {
  color: #ef4444;
  font-size: 1.25rem;
}

/* 네비게이션 버튼 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.nav-btn:hover:not(:disabled) {
  background: #10b981;
  color: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-prev {
  left: 1rem;
}

.nav-next {
  right: 1rem;
}

.nav-btn i {
  font-size: 1.25rem;
}

/* ===== 모달 푸터 ===== */
.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(180deg, white 0%, #f9fafb 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 썸네일 네비게이션 */
.thumbnail-nav {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.thumb-item {
  position: relative;
  width: 60px;
  height: 60px;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: visible;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.thumb-item:hover {
  border-color: #3b82f6;
}

.thumb-item.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.thumb-item.selected {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.thumb-item.disabled-selection {
  opacity: 0.35;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: calc(0.5rem - 2px);
}

.thumb-order-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
  z-index: 1;
}

/* 선택 액션 버튼 */
.selection-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
  color: #374151;
}

.btn-save {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(180deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-save:disabled,
.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 닫기 버튼 (일반 모드) */
.btn-close-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: #374151;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-bottom:hover {
  background: #1f2937;
}

.btn-close-bottom i {
  font-size: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 반응형 ===== */
@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 0.875rem 1rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1rem;
    min-height: 300px;
  }

  .photo-display {
    max-height: 350px;
  }

  .selection-order-badge {
    width: 44px;
    height: 44px;
    font-size: 1.5rem;
    top: 0.75rem;
    left: 0.75rem;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .nav-prev {
    left: 0.5rem;
  }

  .nav-next {
    right: 0.5rem;
  }

  .modal-footer {
    padding: 1rem;
  }

  .thumb-item {
    width: 50px;
    height: 50px;
  }

  .thumb-order-badge {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
    top: -6px;
    right: -6px;
  }

  .hint-content,
  .disabled-content {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  .selection-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save {
    width: 100%;
  }
}

</style>
