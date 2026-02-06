<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content modal-lg">
        <!-- 모달 헤더 -->
        <div class="modal-header">
          <h2 class="modal-title">
            <i class="fas fa-file-contract"></i>
            {{ modalTitle }}
          </h2>
          <button class="modal-close-btn" @click="handleClose">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 모달 바디 -->
        <div class="modal-body">
          <div class="info-section">
            <h3 class="section-title">기준 계약 정보</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>납품요구번호:</label>
                <span class="value">{{ originalOrder?.deliveryRequestNo }}</span>
              </div>
              <div class="info-item">
                <label>수요기관:</label>
                <span class="value">{{ originalOrder?.client }}</span>
              </div>
              <div class="info-item">
                <label>사업명:</label>
                <span class="value">{{ originalOrder?.projectName }}</span>
              </div>
              <div class="info-item">
                <label>총계약금액:</label>
                <span class="value">{{ formatNumber(originalOrder?.itemTotalAmount) }} 원</span>
              </div>
            </div>
          </div>

          <div class="amendment-type-section">
            <h3 class="section-title">계약 유형 선택</h3>
            <div class="type-buttons">
              <button
                class="type-btn"
                :class="{ active: amendmentType === 'AMENDMENT' }"
                @click="selectType('AMENDMENT')"
              >
                <i class="fas fa-edit"></i>
                <div class="type-info">
                  <strong>변경계약</strong>
                  <span>기존 수량을 변경된 수량으로 대체</span>
                </div>
              </button>
              <button
                class="type-btn"
                :class="{ active: amendmentType === 'ADDITIONAL' }"
                @click="selectType('ADDITIONAL')"
              >
                <i class="fas fa-plus-circle"></i>
                <div class="type-info">
                  <strong>추가계약</strong>
                  <span>기존 수량에 신규 수량 추가</span>
                </div>
              </button>
            </div>
          </div>

          <div class="file-upload-section">
            <h3 class="section-title">
              납품요구서 PDF 업로드
              <span class="required-mark">*</span>
            </h3>
            <div class="upload-area">
              <input
                ref="fileInput"
                type="file"
                accept="application/pdf"
                @change="handleFileChange"
                class="file-input"
              />
              <button class="upload-btn" @click="triggerFileInput">
                <i class="fas fa-cloud-upload-alt"></i>
                {{ pdfFile ? pdfFile.name : 'PDF 파일 선택' }}
              </button>
              <p class="upload-hint">변경/추가된 품목 정보가 포함된 납품요구서를 업로드해주세요.</p>
            </div>
          </div>

          <div v-if="previewData" class="preview-section">
            <h3 class="section-title">미리보기</h3>
            <div class="preview-info">
              <div class="preview-item">
                <label>신규 납품요구번호:</label>
                <span class="value highlight">{{ newDeliveryRequestNo }}</span>
              </div>
              <div class="preview-item">
                <label>품목 수:</label>
                <span class="value">{{ previewData.items?.length || 0 }}개</span>
              </div>
              <div class="preview-item">
                <label>총금액:</label>
                <span class="value">{{ formatNumber(previewData.itemTotalAmount) }} 원</span>
              </div>
            </div>
          </div>

          <!-- 에러 메시지 -->
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMessage }}
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="modal-footer">
          <button class="btn-secondary" @click="handleClose" :disabled="loading">
            취소
          </button>
          <button class="btn-primary" @click="handleSubmit" :disabled="!canSubmit || loading">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-check"></i>
            {{ loading ? '처리중...' : '생성' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { orderService } from '~/services/order.service'
import type { OrderDetailResponse } from '~/types/order'
import { formatNumber } from '~/utils/format'

interface Props {
  isOpen: boolean
  originalOrder: OrderDetailResponse | null
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const amendmentType = ref<'AMENDMENT' | 'ADDITIONAL'>('AMENDMENT')
const pdfFile = ref<File | null>(null)
const previewData = ref<OrderDetailResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement>()

const modalTitle = computed(() => {
  return amendmentType.value === 'AMENDMENT' ? '변경계약 생성' : '추가계약 생성'
})

const newDeliveryRequestNo = computed(() => {
  if (!props.originalOrder) return ''
  const baseNo = extractBaseDeliveryRequestNo(props.originalOrder.deliveryRequestNo)
  // 다음 시퀀스 예상 (실제 번호는 서버에서 생성)
  return `${baseNo}-XX`
})

const canSubmit = computed(() => {
  return amendmentType.value && pdfFile.value && !loading.value
})

function extractBaseDeliveryRequestNo(deliveryRequestNo: string): string {
  if (!deliveryRequestNo) return ''
  const parts = deliveryRequestNo.split('-')
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1]
    if (/^\d{2}$/.test(lastPart)) {
      return parts.slice(0, -1).join('-')
    }
  }
  return deliveryRequestNo
}

function selectType(type: 'AMENDMENT' | 'ADDITIONAL') {
  amendmentType.value = type
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (file.type !== 'application/pdf') {
    errorMessage.value = 'PDF 파일만 업로드 가능합니다.'
    return
  }

  pdfFile.value = file
  errorMessage.value = ''

  // PDF 업로드 및 미리보기 로드
  try {
    loading.value = true
    const result = await orderService.uploadOrderPdf(file)
    previewData.value = result
  } catch (error) {
    console.error('PDF 업로드 실패:', error)
    errorMessage.value = 'PDF 파일 처리 중 오류가 발생했습니다.'
    previewData.value = null
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!canSubmit.value || !props.originalOrder || !previewData.value) return

  try {
    loading.value = true
    errorMessage.value = ''

    // FormData 생성
    const formData = new FormData()

    // 계약 정보 (previewData 사용)
    const orderJson = JSON.stringify(previewData.value)
    const orderBlob = new Blob([orderJson], { type: 'application/json' })
    formData.append('order', orderBlob)

    // PDF 파일
    if (pdfFile.value) {
      formData.append('file', pdfFile.value)
    }

    // API 호출
    await orderService.createAmendment(
      props.originalOrder.orderId,
      amendmentType.value,
      formData
    )

    emit('success')
    handleClose()
  } catch (error) {
    console.error('변경계약 생성 실패:', error)
    errorMessage.value = '변경계약 생성 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

function handleClose() {
  if (loading.value) return

  // 상태 초기화
  amendmentType.value = 'AMENDMENT'
  pdfFile.value = null
  previewData.value = null
  errorMessage.value = ''

  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title i {
  color: #6366f1;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.info-section,
.amendment-type-section,
.file-upload-section,
.preview-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required-mark {
  color: #ef4444;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.75rem;
  color: #6b7280;
}

.info-item .value {
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
}

.type-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.type-btn {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
}

.type-btn:hover {
  border-color: #6366f1;
  background: #f0f4ff;
}

.type-btn.active {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.type-btn i {
  font-size: 1.5rem;
  color: #6366f1;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.type-info strong {
  font-size: 0.875rem;
  color: #1f2937;
}

.type-info span {
  font-size: 0.75rem;
  color: #6b7280;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.upload-btn {
  padding: 0.75rem 1rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.upload-btn:hover {
  border-color: #6366f1;
  background: #f0f4ff;
}

.upload-btn i {
  color: #6366f1;
}

.upload-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.preview-info {
  background: #f0f9ff;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #0284c7;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-item label {
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
}

.preview-item .value {
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 600;
}

.preview-item .value.highlight {
  color: #0284c7;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
