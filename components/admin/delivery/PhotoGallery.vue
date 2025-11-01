<template>
  <!-- Compact 모드 -->
  <div v-if="compact" class="photo-gallery-compact">
    <div
      v-for="(url, index) in compactPhotos"
      :key="index"
      class="photo-thumbnail-mini"
      @click="openGallery(index)"
    >
      <img :src="url" :alt="`사진 ${index + 1}`" loading="lazy">
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
          <img :src="url" :alt="`사진 ${index + 1}`" loading="lazy">
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
      <div v-if="showGallery" class="gallery-modal" @click="closeGallery">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-images"></i>
              납품 사진 ({{ currentIndex + 1 }} / {{ photoCount }})
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
            <div class="photo-display">
              <img
                :src="photoUrls[currentIndex]"
                :alt="`사진 ${currentIndex + 1}`"
                class="photo-full"
              >
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

          <!-- 썸네일 네비게이션 -->
          <div v-if="photoCount > 1" class="modal-footer">
            <div class="thumbnail-nav">
              <div
                v-for="(url, index) in photoUrls"
                :key="index"
                class="thumb-item"
                :class="{ active: index === currentIndex }"
                @click="currentIndex = index"
              >
                <img :src="url" :alt="`썸네일 ${index + 1}`">
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  photoUrls: string[]
  photoCount: number
  compact?: boolean
  maxShow?: number
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  maxShow: 3
})

const showGallery = ref(false)
const currentIndex = ref(0)

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

// 키보드 네비게이션 (선택사항)
const handleKeydown = (e: KeyboardEvent) => {
  if (!showGallery.value) return

  if (e.key === 'ArrowLeft') {
    prevPhoto()
  } else if (e.key === 'ArrowRight') {
    nextPhoto()
  } else if (e.key === 'Escape') {
    closeGallery()
  }
}

// 마운트 시 키보드 이벤트 리스너 추가
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<style scoped>
/* Compact 모드 */
.photo-gallery-compact {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.photo-thumbnail-mini {
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

/* 일반 모드 */
.photo-gallery {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 사진 없을 때 */
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

/* 사진 있을 때 */
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

/* 갤러리 모달 */
.gallery-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
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
  color: #2563eb;
}

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 0.375rem;
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
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 400px;
}

.photo-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 500px;
}

.photo-full {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.nav-btn:hover:not(:disabled) {
  background: #2563eb;
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

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: white;
}

.thumbnail-nav {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.thumb-item {
  width: 60px;
  height: 60px;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.thumb-item:hover {
  border-color: #3b82f6;
}

.thumb-item.active {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
    min-height: 300px;
  }

  .photo-display {
    max-height: 400px;
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
    padding: 0.75rem 1rem;
  }

  .thumb-item {
    width: 50px;
    height: 50px;
  }
}
</style>
