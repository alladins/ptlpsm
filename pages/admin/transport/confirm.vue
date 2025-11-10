<template>
  <div class="transport-confirm">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">운송장 관리</h1>
          <p class="page-description">운송장 정보를 확인하고 인수증을 처리합니다.</p>
        </div>
      </div>
    </div>

    <div class="content-section">
      <!-- 운송장 정보 -->
      <div class="info-section">
        <div class="info-grid">
          <div class="info-item">
            <label>수요기관</label>
            <input type="text" v-model="transportInfo.clientName" class="form-input disabled" readonly>
          </div>
          <div class="info-item">
            <label>현장담당자연락처</label>
            <input type="tel" v-model="transportInfo.managerContact" class="form-input disabled" readonly>
          </div>
          <div class="info-item">
            <label>납품장소</label>
            <input type="text" v-model="transportInfo.deliveryLocation" class="form-input disabled" readonly>
          </div>
          <div class="info-item">
            <label>하차시간</label>
            <input type="text" v-model="transportInfo.unloadingTime" class="form-input disabled" readonly>
          </div>
        </div>
      </div>

      <!-- 인수증 처리 영역 -->
      <div class="action-section">
        <div class="action-grid">
          <!-- 인수증 사인 -->
          <div class="action-card" :class="{ 'completed': isSignatureCompleted }">
            <div class="action-content" @click="handleSignature">
              <div class="action-icon">
                <i class="fas fa-signature"></i>
              </div>
              <div class="action-text">
                <h3>{{ isSignatureCompleted ? '인수증 사인 완료' : '인수증 사인' }}</h3>
                <p>{{ isSignatureCompleted ? '사인이 완료되었습니다' : '인수증에 사인을 진행하세요' }}</p>
              </div>
            </div>
            <div v-if="isSignatureCompleted" class="action-retry">
              <button class="btn-retry" @click="retrySignature">재시도</button>
            </div>
          </div>

          <!-- 사진등록 -->
          <div class="action-card" :class="{ 'completed': isPhotoCompleted }">
            <div class="action-content" @click="handlePhotoUpload">
              <div class="action-icon">
                <i class="fas fa-camera"></i>
              </div>
              <div class="action-text">
                <h3>{{ isPhotoCompleted ? '사진등록 완료' : '사진등록' }}</h3>
                <p>{{ isPhotoCompleted ? `${uploadedPhotos.length}장의 사진이 등록되었습니다` : '최소 2장의 사진을 등록하세요' }}</p>
              </div>
            </div>
            <div v-if="isPhotoCompleted" class="action-retry">
              <button class="btn-retry" @click="retryPhotoUpload">재시도</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 업로드된 사진 미리보기 -->
      <div v-if="uploadedPhotos.length > 0" class="photo-preview-section">
        <h3>등록된 사진</h3>
        <div class="photo-grid">
          <div v-for="(photo, index) in uploadedPhotos" :key="index" class="photo-item">
            <img :src="photo.url" :alt="`사진 ${index + 1}`" class="photo-image">
            <button class="photo-remove" @click="removePhoto(index)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 운송 종료 버튼 -->
      <div class="bottom-actions">
        <button 
          class="btn-transport-end" 
          :class="{ 'disabled': !canCompleteTransport }"
          @click="completeTransport"
          :disabled="!canCompleteTransport"
        >
          운송 종료
        </button>
      </div>
    </div>

    <!-- 인수증 미리보기 팝업 -->
    <div v-if="showReceiptPreview" class="popup-overlay">
      <div class="popup-content receipt-preview" @click.stop>
        <div class="popup-header">
          <h3>인수증 미리보기</h3>
          <button @click="closeReceiptPreview" class="popup-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-body">
          <div class="receipt-content">
            <!-- 인수증 내용 -->
            <div class="receipt-header">
              <div class="company-info">
                <div class="receipt-logo">LP</div>
                <div class="company-name">LEADPOWER</div>
              </div>
              <div class="receipt-title">인   수   증</div>
              <div class="receipt-info">
                <div>공급/운반자 보관용</div>
                <div>{{ currentDate }}</div>
              </div>
            </div>

            <div class="receipt-details">
              <table class="receipt-table">
                <tbody>
                  <tr>
                    <td class="label">거래처명</td>
                    <td class="value">{{ transportInfo.clientName }}</td>
                  </tr>
                  <tr>
                    <td class="label">납품장소</td>
                    <td class="value">{{ transportInfo.deliveryLocation }}</td>
                  </tr>
                  <tr>
                    <td class="label">현장담당자</td>
                    <td class="value">{{ transportInfo.managerContact }}</td>
                  </tr>
                  <tr>
                    <td class="label">하차</td>
                    <td class="value">{{ transportInfo.unloadingTime }}</td>
                  </tr>
                  <tr>
                    <td class="label">비고</td>
                    <td class="value">★상차완료 후 현장담당자에게 통화 필수</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="receipt-products">
              <table class="product-table">
                <thead>
                  <tr>
                    <th>제품명</th>
                    <th>두께(t)</th>
                    <th>수량(장)</th>
                    <th>규격</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>LP하이드로 불연보드 (CORE)</td>
                    <td>60T</td>
                    <td>400</td>
                    <td>1000*2000</td>
                    <td>단위 환산: 800㎡</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="receipt-confirmation">
              <p>상기 물품의 현장인도를 확인함.</p>
            </div>

            <div class="receipt-signature">
              <div class="signature-label">물품 인수자</div>
              <div class="signature-box">
                <span v-if="signatureData.recipientName">{{ signatureData.recipientName }}</span>
                <span v-else class="signature-placeholder">(인)</span>
              </div>
            </div>

            <div class="driver-note">
              <p>*기사님 꼭 사진찍어서 운송사에 보내주세요* 안전!운전하세요</p>
            </div>
          </div>
        </div>
        
        <div class="popup-footer">
          <button class="btn-secondary" @click="closeReceiptPreview">취소</button>
          <button class="btn-primary" @click="proceedToSignature">사인 진행</button>
        </div>
      </div>
    </div>

    <!-- 사인 입력 팝업 -->
    <div v-if="showSignaturePopup" class="popup-overlay">
      <div class="popup-content signature-popup" @click.stop>
        <div class="popup-header">
          <h3>인수자 정보 및 사인</h3>
          <button @click="closeSignaturePopup" class="popup-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-body">
          <div class="signature-form">
            <div class="form-group">
              <label>인수자</label>
              <input 
                type="text" 
                v-model="signatureData.recipientName" 
                class="form-input" 
                placeholder="인수자명을 입력하세요"
              >
            </div>
            
            <div class="form-group">
              <label>사인</label>
              <div class="signature-pad">
                <canvas 
                  ref="signatureCanvas" 
                  class="signature-canvas"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @touchstart="startDrawing"
                  @touchmove="draw"
                  @touchend="stopDrawing"
                ></canvas>
                <div class="signature-controls">
                  <button class="btn-clear" @click="clearSignature">지우기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="popup-footer">
          <button class="btn-secondary" @click="closeSignaturePopup">취소</button>
          <button class="btn-primary" @click="saveSignature" :disabled="!canSaveSignature">저장</button>
        </div>
      </div>
    </div>

    <!-- 감사합니다 팝업 -->
    <div v-if="showThankYouPopup" class="popup-overlay">
      <div class="popup-content thank-you-popup">
        <div class="thank-you-content">
          <h2>감사합니다.</h2>
        </div>
        <div class="popup-footer">
          <button class="btn-primary" @click="closeThankYouPopup">닫기</button>
        </div>
      </div>
    </div>

    <!-- 파일 업로드 input (숨김) -->
    <input 
      ref="fileInput" 
      type="file" 
      multiple 
      accept="image/*" 
      capture="environment"
      @change="handleFileSelect"
      style="display: none"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 관리'
})

const router = useRouter()
const route = useRoute()

// 운송장 정보
const transportInfo = ref({
  clientName: '광주북구청사',
  managerContact: '010-8698-3053',
  deliveryLocation: '광주광역시 북구 용봉동242-2',
  unloadingTime: '오전 7시'
})

// 상태 관리
const isSignatureCompleted = ref(false)
const isPhotoCompleted = ref(false)
const showReceiptPreview = ref(false)
const showSignaturePopup = ref(false)
const showThankYouPopup = ref(false)

// 사인 관련
const signatureCanvas = ref<HTMLCanvasElement>()
const isDrawing = ref(false)
const signatureData = ref({
  recipientName: '',
  signatureImage: null as string | null
})

// 사진 관련
const fileInput = ref<HTMLInputElement>()
const uploadedPhotos = ref<Array<{url: string, file: File}>>([])

// 현재 날짜
const currentDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// 운송 완료 가능 여부
const canCompleteTransport = computed(() => {
  return isSignatureCompleted.value && isPhotoCompleted.value
})

// 사인 저장 가능 여부
const canSaveSignature = computed(() => {
  return signatureData.value.recipientName.trim() !== '' && signatureData.value.signatureImage !== null
})

// 인수증 사인 처리
const handleSignature = () => {
  if (!isSignatureCompleted.value) {
    showReceiptPreview.value = true
  }
}

// 인수증 미리보기 닫기
const closeReceiptPreview = () => {
  showReceiptPreview.value = false
}

// 사인 진행
const proceedToSignature = () => {
  showReceiptPreview.value = false
  showSignaturePopup.value = true
}

// 사인 팝업 닫기
const closeSignaturePopup = () => {
  showSignaturePopup.value = false
}

// 사인 재시도
const retrySignature = () => {
  isSignatureCompleted.value = false
  signatureData.value = {
    recipientName: '',
    signatureImage: null
  }
}

// 사인 그리기 시작
const startDrawing = (event: MouseEvent | TouchEvent) => {
  isDrawing.value = true
  draw(event)
}

// 사인 그리기
const draw = (event: MouseEvent | TouchEvent) => {
  if (!isDrawing.value || !signatureCanvas.value) return

  event.preventDefault()
  const canvas = signatureCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  let clientX, clientY

  if (event instanceof MouseEvent) {
    clientX = event.clientX
    clientY = event.clientY
  } else {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  }

  const x = clientX - rect.left
  const y = clientY - rect.top

  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#000'

  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y)
}

// 사인 그리기 중지
const stopDrawing = () => {
  isDrawing.value = false
  
  // 사인 이미지 저장
  if (signatureCanvas.value) {
    const ctx = signatureCanvas.value.getContext('2d')
    if (ctx) {
      ctx.beginPath()
    }
    signatureData.value.signatureImage = signatureCanvas.value.toDataURL()
  }
}

// 사인 지우기
const clearSignature = () => {
  if (!signatureCanvas.value) return
  
  const ctx = signatureCanvas.value.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, signatureCanvas.value.width, signatureCanvas.value.height)
    signatureData.value.signatureImage = null
  }
}

// 사인 저장
const saveSignature = () => {
  if (canSaveSignature.value) {
    isSignatureCompleted.value = true
    closeSignaturePopup()
  }
}

// 사진 업로드 처리
const handlePhotoUpload = () => {
  if (!isPhotoCompleted.value) {
    fileInput.value?.click()
  }
}

// 파일 선택 처리
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        uploadedPhotos.value.push({ url, file })
      }
    })
    
    // 최소 2장 이상이면 완료 상태로 변경
    if (uploadedPhotos.value.length >= 2) {
      isPhotoCompleted.value = true
    }
  }
  
  // 파일 input 초기화
  target.value = ''
}

// 사진 제거
const removePhoto = (index: number) => {
  uploadedPhotos.value.splice(index, 1)
  
  // 2장 미만이면 완료 상태 해제
  if (uploadedPhotos.value.length < 2) {
    isPhotoCompleted.value = false
  }
}

// 사진 업로드 재시도
const retryPhotoUpload = () => {
  isPhotoCompleted.value = false
  uploadedPhotos.value = []
}

// 운송 완료
const completeTransport = () => {
  if (canCompleteTransport.value) {
    showThankYouPopup.value = true
  }
}

// 감사합니다 팝업 닫기
const closeThankYouPopup = () => {
  showThankYouPopup.value = false
  router.push('/admin/transport/list')
}

// Canvas 초기화
onMounted(() => {
  if (signatureCanvas.value) {
    const canvas = signatureCanvas.value
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }
})
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-detail.css: action-section, action-card, signature-pad, receipt-content, photo-preview-section
 * - admin-common.css: btn-primary, btn-secondary, popup-overlay, popup-content
 * - admin-forms.css: form-input
 */

/* Page-specific: Transport confirm page layout */
.transport-confirm {
  padding: 2rem;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-description {
  color: #6b7280;
  font-size: 14px;
}

.content-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-section {
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-input.disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.bottom-actions {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.btn-transport-end {
  background: #6b7280;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-transport-end:not(.disabled):hover {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

.btn-transport-end.disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/*
 * Common popup styles managed by admin-common.css:
 * - .popup-overlay: 팝업 배경
 * - .popup-content: 팝업 컨테이너
 * - .popup-header: 팝업 헤더
 * - .popup-close: 닫기 버튼
 * - .popup-body: 팝업 본문
 * - .popup-footer: 팝업 푸터
 * - .btn-primary, .btn-secondary: 버튼
 */

/* Popup variants - page specific size adjustments */
.receipt-preview.popup-content {
  max-width: 600px;
}

.signature-popup.popup-content {
  max-width: 500px;
}

.thank-you-popup.popup-content {
  max-width: 400px;
  text-align: center;
}

/* Thank you popup - page specific */
.thank-you-content {
  padding: 3rem 2rem;
  text-align: center;
}

.thank-you-content h2 {
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

/* Responsive - page specific adjustments */
@media (max-width: 768px) {
  .transport-confirm {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .popup-content {
    width: 95%;
    margin: 1rem;
  }
}
</style>
