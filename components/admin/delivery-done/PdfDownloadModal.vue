<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-file-pdf"></i>
          PDF 다운로드
        </h3>
        <button class="btn-close" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 기본 정보 -->
        <div class="info-section">
          <div class="info-row">
            <label>납품요구번호:</label>
            <span>{{ deliveryDone.deliveryRequestNo }}</span>
          </div>
          <div class="info-row">
            <label>수요기관:</label>
            <span>{{ deliveryDone.client }}</span>
          </div>
          <div class="info-row">
            <label>시공사:</label>
            <span>{{ deliveryDone.contractorCompanyName }}</span>
          </div>
        </div>

        <!-- PDF 다운로드 버튼들 -->
        <div class="pdf-section">
          <h4>개별 다운로드</h4>
          <div class="pdf-buttons">
            <!-- 납품확인서 -->
            <button
              class="pdf-button"
              @click="downloadConfirmation"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-info">
                <h5>납품 확인서</h5>
                <p>계약물품 및 납품내역</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-download"></i>
              </div>
            </button>

            <!-- 납품완료계 -->
            <button
              class="pdf-button"
              @click="downloadCompletion"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-info">
                <h5>납품완료계</h5>
                <p>납품 완료 증명서</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-download"></i>
              </div>
            </button>

            <!-- 사진대지 -->
            <button
              class="pdf-button"
              @click="downloadPhotoSheet"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="pdf-info">
                <h5>사진대지</h5>
                <p>납품 현장 사진</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-download"></i>
              </div>
            </button>
          </div>

          <!-- 일괄 다운로드 -->
          <div class="batch-download">
            <button
              class="btn-batch-download"
              @click="downloadAll"
            >
              <i class="fas fa-file-archive"></i>
              모든 PDF 일괄 다운로드 (ZIP)
            </button>
          </div>
        </div>

        <!-- 안내 메시지 -->
        <div class="notice-section">
          <i class="fas fa-info-circle"></i>
          <p>PDF 파일은 새 창에서 열립니다. 파일을 저장하거나 인쇄할 수 있습니다.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-close-modal" @click="$emit('close')">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  downloadConfirmationPdf,
  downloadCompletionPdf,
  downloadPhotoSheetPdf,
  downloadAllPdfs
} from '~/services/delivery-done.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
}>()

async function downloadConfirmation() {
  try {
    await downloadConfirmationPdf(props.deliveryDone.deliveryDoneId)
  } catch (error) {
    console.error('Failed to download confirmation PDF:', error)
    alert('납품확인서 다운로드 중 오류가 발생했습니다.')
  }
}

async function downloadCompletion() {
  try {
    await downloadCompletionPdf(props.deliveryDone.deliveryDoneId)
  } catch (error) {
    console.error('Failed to download completion PDF:', error)
    alert('납품완료계 다운로드 중 오류가 발생했습니다.')
  }
}

async function downloadPhotoSheet() {
  try {
    await downloadPhotoSheetPdf(props.deliveryDone.deliveryDoneId)
  } catch (error) {
    console.error('Failed to download photo sheet PDF:', error)
    alert('사진대지 다운로드 중 오류가 발생했습니다.')
  }
}

async function downloadAll() {
  try {
    await downloadAllPdfs(props.deliveryDone.deliveryDoneId)
  } catch (error) {
    console.error('Failed to download all PDFs:', error)
    alert('일괄 다운로드 중 오류가 발생했습니다.')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
}

.btn-close:hover {
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.info-section {
  background: #f9fafb;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  font-weight: 600;
  width: 120px;
  color: #6b7280;
}

.info-row span {
  color: #1f2937;
}

.pdf-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #374151;
  font-weight: 600;
}

.pdf-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.pdf-button {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  gap: 15px;
}

.pdf-button:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.pdf-icon {
  font-size: 32px;
  color: #ef4444;
  min-width: 40px;
  text-align: center;
}

.pdf-info {
  flex: 1;
  text-align: left;
}

.pdf-info h5 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #1f2937;
  font-weight: 600;
}

.pdf-info p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.pdf-action {
  font-size: 20px;
  color: #2563eb;
}

.batch-download {
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
}

.btn-batch-download {
  padding: 12px 24px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.btn-batch-download:hover {
  background: #059669;
}

.btn-batch-download i {
  font-size: 16px;
}

.notice-section {
  margin-top: 20px;
  padding: 12px;
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.notice-section i {
  color: #2563eb;
  margin-top: 2px;
}

.notice-section p {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-close-modal {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: #f3f4f6;
  color: #6b7280;
}

.btn-close-modal:hover {
  background: #e5e7eb;
}
</style>
