<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <i class="fas fa-file-pdf" />
          PDF 다운로드
        </h3>
        <button class="btn-close" @click="$emit('close')">
          <i class="fas fa-times" />
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

        <!-- 공문 수신자명 (입력 후 '저장' 버튼으로 발주에 저장) -->
        <div class="recipient-section">
          <label class="recipient-label">공문 수신자명</label>
          <div class="recipient-input-row">
            <input
              v-model="recipientName"
              type="text"
              class="recipient-input"
              :placeholder="recipientPlaceholder"
            >
            <button
              class="btn-recipient-save"
              :disabled="savingRecipient"
              @click="saveRecipientName"
            >
              <i :class="savingRecipient ? 'fas fa-spinner fa-spin' : 'fas fa-save'" />
              저장
            </button>
          </div>
          <p class="recipient-hint">
            공문은 이 수신자명으로 생성됩니다. '저장'을 누르면 발주에 저장됩니다. (미입력 시 저장값/자동값 사용)
          </p>
        </div>

        <!-- PDF 다운로드 버튼들 -->
        <div class="pdf-section">
          <h4>개별 다운로드</h4>
          <div class="pdf-buttons">
            <!-- 공문(갑지) -->
            <button
              class="pdf-button"
              @click="openPdfPreview('cover')"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf" />
              </div>
              <div class="pdf-info">
                <h5>공문 (갑지)</h5>
                <p>납품완료보고서 표지</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-eye" />
              </div>
            </button>

            <!-- 납품완료계 -->
            <button
              class="pdf-button"
              @click="openPdfPreview('completion')"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf" />
              </div>
              <div class="pdf-info">
                <h5>납품완료계</h5>
                <p>납품 완료 증명서</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-eye" />
              </div>
            </button>

            <!-- 납품확인서 -->
            <button
              class="pdf-button"
              @click="openPdfPreview('confirmation')"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf" />
              </div>
              <div class="pdf-info">
                <h5>납품 확인서</h5>
                <p>계약물품 및 납품내역</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-eye" />
              </div>
            </button>

            <!-- 사진대지 -->
            <button
              class="pdf-button"
              @click="openPdfPreview('photo-sheet')"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf" />
              </div>
              <div class="pdf-info">
                <h5>사진대지</h5>
                <p>납품 현장 사진</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-eye" />
              </div>
            </button>

            <!-- 납품내역서 PDF — 기성 있으면 통합 장표, 없고 출하 2회 이상이면 품목×납품일자 매트릭스 -->
            <button
              v-if="hasBaselines || hasMultipleShipments"
              class="pdf-button"
              @click="openDeliveryStatement"
            >
              <div class="pdf-icon">
                <i class="fas fa-file-pdf" />
              </div>
              <div class="pdf-info">
                <h5>납품내역서</h5>
                <p>{{ hasBaselines ? '품목 × 출하일자 통합 (PDF)' : '품목 × 납품일자 매트릭스 (PDF)' }}</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-eye" />
              </div>
            </button>

            <!-- 납품내역서 엑셀 — 통합 장표(엑셀). 기성 차수가 있는 발주에서만 제공 -->
            <button
              v-if="hasBaselines"
              class="pdf-button"
              @click="downloadExcel"
            >
              <div class="pdf-icon excel-icon">
                <i class="fas fa-file-excel" />
              </div>
              <div class="pdf-info">
                <h5>납품내역서</h5>
                <p>품목 × 출하일자 통합 (엑셀)</p>
              </div>
              <div class="pdf-action">
                <i class="fas fa-download" />
              </div>
            </button>
          </div>

          <!-- 일괄/합지 다운로드 -->
          <div class="batch-download">
            <button
              class="btn-merge-download"
              @click="downloadMerged"
            >
              <i class="fas fa-file-pdf" />
              모든 PDF 합지 다운로드 (단일 PDF)
            </button>
            <button
              class="btn-batch-download"
              @click="downloadAll"
            >
              <i class="fas fa-file-archive" />
              모든 PDF 일괄 다운로드 (ZIP)
            </button>
          </div>
        </div>

        <!-- 안내 메시지 -->
        <div class="notice-section">
          <i class="fas fa-info-circle" />
          <p>PDF 버튼을 클릭하면 미리보기 창이 열립니다. 미리보기에서 다운로드할 수 있습니다.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-close-modal" @click="$emit('close')">
          닫기
        </button>
      </div>
    </div>

    <!-- PDF 미리보기 모달 -->
    <PdfPreviewModal
      :show="showPdfPreview"
      :pdf-url="previewPdfUrl"
      :delivery-id="deliveryDone.deliveryDoneId"
      :file-name="previewFileName"
      @close="closePdfPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  downloadAllPdfs,
  downloadMergedPdf,
  getPdfDownloadUrl,
  downloadBaselineInvoiceExcel,
  getBaselineInvoicePdfUrl
} from '~/services/delivery-done.service'
import { baselineService } from '~/services/baseline.service'
import { orderService } from '~/services/order.service'
import type { DeliveryDoneListItem } from '~/types/delivery-done'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'

type PdfType = 'cover' | 'confirmation' | 'completion' | 'photo-sheet' | 'delivery-statement'

const pdfTypeNames: Record<PdfType, string> = {
  cover: '공문',
  confirmation: '납품확인서',
  completion: '납품완료계',
  'photo-sheet': '사진대지',
  'delivery-statement': '납품내역서'
}

const props = defineProps<{
  deliveryDone: DeliveryDoneListItem
}>()

const emit = defineEmits<{
  close: []
}>()

// PDF 미리보기 모달 상태
const showPdfPreview = ref(false)
const previewPdfUrl = ref('')
const previewFileName = ref('')

// 공문 수신자명 즉석 입력값 (미입력 시 백엔드가 저장값/자동값 사용)
const recipientName = ref('')
const recipientPlaceholder = computed(
  () => `${props.deliveryDone.client || '수요기관'} 분임재무관 귀하`
)

// 공문 수신자명 즉시 저장
const savingRecipient = ref(false)
async function saveRecipientName () {
  if (!props.deliveryDone.orderId) {
    alert('발주 정보가 없어 저장할 수 없습니다.')
    return
  }
  savingRecipient.value = true
  try {
    await orderService.updateRecipientName(props.deliveryDone.orderId, recipientName.value)
    alert('공문 수신자명이 저장되었습니다.')
  } catch (error) {
    console.error('수신자명 저장 실패:', error)
    alert(error instanceof Error ? error.message : '수신자명 저장에 실패했습니다.')
  } finally {
    savingRecipient.value = false
  }
}

// 출하 2회 이상 여부 — 기성 차수가 없어도 출하 2회 이상이면 납품내역서(품목×납품일자) 제공
const hasMultipleShipments = computed(
  () => (props.deliveryDone.totalDeliveryCount ?? 0) >= 2
)

// 기성 차수 존재 여부 — 있으면 통합 장표(PDF/엑셀), 없으면 매트릭스 PDF로 폴백
const hasBaselines = ref(false)
onMounted(async () => {
  try {
    const baselines = await baselineService.getBaselinesByOrderId(props.deliveryDone.orderId)
    hasBaselines.value = Array.isArray(baselines) && baselines.length > 0
  } catch (error) {
    console.error('기성 차수 조회 실패:', error)
    hasBaselines.value = false
  }
})

/**
 * 납품내역서(통합) PDF 미리보기 열기 — 기성 차수 기반 품목×출하일자 통합 장표
 */
function openBaselineInvoicePdf () {
  if (!hasBaselines.value) { return }
  previewPdfUrl.value = getBaselineInvoicePdfUrl(props.deliveryDone.orderId)
  previewFileName.value = `납품내역서_${props.deliveryDone.deliveryRequestNo}.pdf`
  showPdfPreview.value = true
}

/**
 * 납품내역서 PDF 미리보기 — 기성 차수가 있으면 통합 장표, 없으면 품목×납품일자 매트릭스로 폴백
 */
function openDeliveryStatement () {
  if (hasBaselines.value) {
    openBaselineInvoicePdf()
  } else {
    openPdfPreview('delivery-statement')
  }
}

/**
 * PDF 미리보기 모달 열기
 */
function openPdfPreview (pdfType: PdfType) {
  let url = getPdfDownloadUrl(props.deliveryDone.deliveryDoneId, pdfType)
  // 공문은 수신자명 즉석 입력값을 쿼리로 전달 (입력 시 발주에 저장됨)
  if (pdfType === 'cover' && recipientName.value.trim()) {
    url += `?recipientName=${encodeURIComponent(recipientName.value.trim())}`
  }
  previewPdfUrl.value = url
  previewFileName.value = `${pdfTypeNames[pdfType]}_${props.deliveryDone.deliveryRequestNo}.pdf`
  showPdfPreview.value = true
}

/**
 * PDF 미리보기 모달 닫기
 */
function closePdfPreview () {
  showPdfPreview.value = false
  previewPdfUrl.value = ''
  previewFileName.value = ''
}

/**
 * 납품내역서 엑셀 다운로드
 */
async function downloadExcel () {
  try {
    await downloadBaselineInvoiceExcel(props.deliveryDone.orderId)
  } catch (error) {
    console.error('엑셀 다운로드 실패:', error)
    // 서버에서 전달한 에러 메시지 표시
    const message = error instanceof Error ? error.message : '엑셀 다운로드 중 오류가 발생했습니다.'
    alert(message)
  }
}

/**
 * 모든 PDF 일괄 다운로드 (ZIP)
 */
async function downloadAll () {
  try {
    await downloadAllPdfs(props.deliveryDone.deliveryDoneId, recipientName.value.trim() || undefined)
  } catch (error) {
    console.error('Failed to download all PDFs:', error)
    alert('일괄 다운로드 중 오류가 발생했습니다.')
  }
}

/**
 * 모든 PDF 합지 다운로드 (단일 PDF)
 */
async function downloadMerged () {
  try {
    await downloadMergedPdf(props.deliveryDone.deliveryDoneId, recipientName.value.trim() || undefined)
  } catch (error) {
    console.error('Failed to download merged PDF:', error)
    alert(error instanceof Error ? error.message : '합지 다운로드 중 오류가 발생했습니다.')
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

.recipient-section {
  margin-bottom: 20px;
}

.recipient-label {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  margin-bottom: 6px;
}

.recipient-input-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.recipient-input {
  flex: 1;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.recipient-input:focus {
  outline: none;
  border-color: #2563eb;
}

.btn-recipient-save {
  flex: 0 0 auto;
  padding: 0 16px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.btn-recipient-save:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-recipient-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recipient-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #9ca3af;
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

.pdf-button-disabled,
.pdf-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdf-button-disabled:hover,
.pdf-button:disabled:hover {
  border-color: #e5e7eb;
  background: white;
}

.pdf-icon {
  font-size: 32px;
  color: #ef4444;
  min-width: 40px;
  text-align: center;
}

.pdf-icon.excel-icon {
  color: #10b981;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.btn-batch-download,
.btn-merge-download {
  padding: 12px 24px;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s;
}

.btn-batch-download {
  background: #10b981;
}

.btn-batch-download:hover {
  background: #059669;
}

.btn-merge-download {
  background: #7c3aed;
}

.btn-merge-download:hover {
  background: #6d28d9;
}

.btn-batch-download i,
.btn-merge-download i {
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
