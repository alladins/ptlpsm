<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>기성금 이력</h4>
      <button
        class="btn-primary"
        :disabled="!canRequestProgress"
        :title="progressButtonTooltip"
        @click="emit('openModal')"
      >
        <i class="fas fa-plus" />
        기성 청구하기
      </button>
    </div>

    <!-- 공문 수신자명 (입력 후 '저장' 버튼으로 발주에 저장). 공문/일괄/합지 다운로드에 공통 적용 -->
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
          :disabled="savingRecipient || !orderId"
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

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>차수</th>
            <th>청구일</th>
            <th class="col-amount">
              청구금액
            </th>
            <th v-if="hasAdvancePayment" class="col-amount">
              선급금차감
            </th>
            <th v-if="hasAdvancePayment" class="col-amount">
              실수금액
            </th>
            <th>수금일</th>
            <th>상태</th>
            <th>PDF</th>
            <th>수금확인</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredProgressPayments.length === 0">
            <td :colspan="hasAdvancePayment ? 9 : 7" class="no-data">
              기성금 이력이 없습니다.
            </td>
          </tr>
          <tr v-for="payment in filteredProgressPayments" v-else :key="payment.requestId || payment.paymentId">
            <td>{{ payment.paymentSeq }}차</td>
            <td>{{ payment.requestDate }}</td>
            <td class="text-right">
              {{ formatCurrency(payment.requestAmount) }}
            </td>
            <td v-if="hasAdvancePayment" class="text-right deduction-amount">
              {{ payment.advanceDeductionAmount ? '-' + formatCurrency(payment.advanceDeductionAmount) : '-' }}
            </td>
            <td v-if="hasAdvancePayment" class="text-right actual-amount">
              {{ formatCurrency(payment.netPaymentAmount || payment.requestAmount) }}
            </td>
            <td>{{ payment.paymentDate || payment.paidDate || '-' }}</td>
            <td>
              <span class="status-badge" :class="getPaymentStatusClass(payment.status)">
                {{ getPaymentStatusLabel(payment.status) }}
              </span>
            </td>
            <td>
              <!-- 서명 없이 발행: 납품확인서 PDF 상시 다운로드 + 서명본 스캔 업로드 -->
              <div class="pdf-actions">
                <button
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="공문(갑지) — 항상 최신 양식으로 즉석 생성"
                  @click="emit('viewCoverPdf', payment.baselineId, recipientName)"
                >
                  <i class="fas fa-file-pdf" />
                  공문
                </button>
                <button
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="납품확인서 (서명란 공란)"
                  @click="emit('viewConfirmationPdf', payment.baselineId)"
                >
                  <i class="fas fa-file-pdf" />
                  납품확인서
                </button>
                <button
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="기성금청구 상세내역서 (품목 × 계약/금회/전회/잔여)"
                  @click="emit('viewBaselineDetailsPdf', payment.baselineId)"
                >
                  <i class="fas fa-file-pdf" />
                  기성금청구내역
                </button>
                <button
                  v-if="(payment.shipmentCount ?? 0) >= 2"
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="납품내역서 (품목 × 납품일자 매트릭스, 출하 2회 이상)"
                  @click="emit('viewDeliveryStatementPdf', payment.baselineId)"
                >
                  <i class="fas fa-file-pdf" />
                  납품내역서
                </button>
                <button
                  class="btn-pdf-sm btn-pdf-photo"
                  :disabled="!payment.baselineId"
                  title="사진대지"
                  @click="emit('viewPhotoSheetPdf', payment.baselineId)"
                >
                  <i class="fas fa-images" />
                  사진대지
                </button>
                <button
                  class="btn-pdf-sm btn-scan-upload"
                  :disabled="!payment.baselineId || uploadingBaselineId === payment.baselineId"
                  title="서명받은 납품확인서 스캔본 업로드"
                  @click="triggerScanUpload(payment.baselineId)"
                >
                  <i :class="uploadingBaselineId === payment.baselineId ? 'fas fa-spinner fa-spin' : 'fas fa-upload'" />
                  스캔업로드
                </button>
                <button
                  class="btn-pdf-sm"
                  :disabled="!payment.baselineId"
                  title="납품확인서·사진대지를 최신 양식으로 재생성"
                  @click="emit('regeneratePdfs', payment.baselineId)"
                >
                  <i class="fas fa-redo" />
                  재생성
                </button>
                <button
                  class="btn-pdf-sm btn-merge-download"
                  :disabled="!payment.baselineId"
                  title="공문+납품확인서+기성금청구내역+사진대지+납품내역서를 하나의 PDF로 합쳐 다운로드"
                  @click="emit('downloadMergedPdf', payment.baselineId, recipientName)"
                >
                  <i class="fas fa-file-pdf" />
                  합지 다운로드
                </button>
                <button
                  class="btn-pdf-sm btn-zip-download"
                  :disabled="!payment.baselineId"
                  title="공문·납품확인서·기성금청구내역·사진대지·납품내역서를 ZIP으로 일괄 다운로드"
                  @click="emit('downloadAllPdfs', payment.baselineId, recipientName)"
                >
                  <i class="fas fa-file-archive" />
                  일괄 다운로드
                </button>
              </div>
            </td>
            <!-- 수금확인 열 -->
            <td>
              <button
                v-if="payment.status === 'APPROVED'"
                class="btn-collection-confirm"
                title="수금 확인"
                @click="emit('openCollectionConfirm', payment)"
              >
                <i class="fas fa-check-circle" />
                수금확인
              </button>
              <span v-else-if="payment.status === 'PAID'" class="collection-completed">
                <i class="fas fa-check" />
                완료
              </span>
              <span v-else class="collection-pending">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 서명본 스캔 업로드용 숨김 파일 입력 (PDF only) -->
    <input
      ref="scanInputRef"
      type="file"
      accept="application/pdf"
      style="display: none"
      @change="onScanFileSelected"
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProgressPaymentRequest } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'
import { baselineService } from '~/services/baseline.service'
import { orderService } from '~/services/order.service'

interface Props {
  /** 기성금 이력 목록 */
  progressPayments: ProgressPaymentRequest[]
  /** 선급금 신청 여부 (컬럼 표시용) */
  hasAdvancePayment: boolean
  /** 기성금 청구 가능 여부 */
  canRequestProgress: boolean
  /** 기성금 버튼 툴팁 */
  progressButtonTooltip?: string
  /** 수요기관명 — 공문 수신자명 placeholder 기본값 생성용 */
  clientName?: string
  /** 발주 ID — 공문 수신자명 저장용 */
  orderId?: number
}

const props = withDefaults(defineProps<Props>(), {
  progressButtonTooltip: '',
  clientName: '',
  orderId: undefined
})

// 공문 수신자명 즉석 입력값 (미입력 시 백엔드가 저장값/자동값 사용)
const recipientName = ref('')
const recipientPlaceholder = computed(
  () => `${props.clientName || '수요기관'} 분임재무관 귀하`
)

// 공문 수신자명 즉시 저장
const savingRecipient = ref(false)
const saveRecipientName = async () => {
  if (!props.orderId) {
    alert('발주 정보가 없어 저장할 수 없습니다.')
    return
  }
  savingRecipient.value = true
  try {
    await orderService.updateRecipientName(props.orderId, recipientName.value)
    alert('공문 수신자명이 저장되었습니다.')
  } catch (error) {
    console.error('수신자명 저장 실패:', error)
    alert(error instanceof Error ? error.message : '수신자명 저장에 실패했습니다.')
  } finally {
    savingRecipient.value = false
  }
}

// 기성금만 필터링 (BALANCE 타입 제외)
const filteredProgressPayments = computed(() =>
  props.progressPayments.filter(p => p.paymentType !== 'BALANCE')
)

const emit = defineEmits<{
  /** 기성금 청구 모달 열기 */
  openModal: []
  /** 수금 확인 모달 열기 */
  openCollectionConfirm: [payment: ProgressPaymentRequest]
  /** 납품확인서 PDF 보기 */
  viewConfirmationPdf: [baselineId: number]
  /** 기성금청구 상세내역서 PDF 보기 */
  viewBaselineDetailsPdf: [baselineId: number]
  /** 납품내역서 PDF 보기 (품목 × 납품일자 매트릭스) */
  viewDeliveryStatementPdf: [baselineId: number]
  /** 사진대지 PDF 보기 */
  viewPhotoSheetPdf: [baselineId: number]
  /** 공문(갑지) PDF 보기 */
  viewCoverPdf: [baselineId: number, recipientName: string]
  /** 기성청구 PDF 재생성 (납품확인서·사진대지) */
  regeneratePdfs: [baselineId: number]
  /** 기성 차수 전체 PDF 일괄 다운로드(ZIP) */
  downloadAllPdfs: [baselineId: number, recipientName: string]
  /** 기성 차수 전체 PDF 합지 다운로드(단일 PDF) */
  downloadMergedPdf: [baselineId: number, recipientName: string]
  /** 스캔본 업로드 완료 → 목록 갱신 */
  scanUploaded: []
}>()

// 서명본 스캔 업로드
const scanInputRef = ref<HTMLInputElement | null>(null)
const pendingUploadBaselineId = ref<number | null>(null)
const uploadingBaselineId = ref<number | null>(null)

const triggerScanUpload = (baselineId: number) => {
  if (!baselineId) { return }
  pendingUploadBaselineId.value = baselineId
  scanInputRef.value?.click()
}

const onScanFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // 다음 선택을 위해 input 초기화
  input.value = ''
  if (!file || pendingUploadBaselineId.value == null) { return }

  // MIME 또는 확장자(.pdf) 중 하나라도 PDF 이면 허용 (브라우저가 빈 type/octet-stream 보내는 경우 대비)
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    alert('PDF 파일만 업로드할 수 있습니다.')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    alert('파일 크기는 20MB를 초과할 수 없습니다.')
    return
  }

  const baselineId = pendingUploadBaselineId.value
  uploadingBaselineId.value = baselineId
  try {
    await baselineService.uploadConfirmationScan(baselineId, file)
    alert('서명본 스캔이 업로드되었습니다. 이후 다운로드 시 스캔본이 제공됩니다.')
    emit('scanUploaded')
  } catch (e: any) {
    alert(e?.message || '스캔본 업로드 중 오류가 발생했습니다.')
  } finally {
    uploadingBaselineId.value = null
    pendingUploadBaselineId.value = null
  }
}

// 상태 포맷팅 함수
const {
  getPaymentStatusClass,
  getPaymentStatusLabel
} = useFundStatusFormatters()
</script>

<style scoped>
/* 탭 헤더 */
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

/* 공문 수신자명 입력 */
.recipient-section {
  margin-bottom: 1rem;
}

.recipient-label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.375rem;
}

.recipient-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  max-width: 620px;
}

.recipient-input {
  flex: 1;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.recipient-input:focus {
  outline: none;
  border-color: #2563eb;
}

.btn-recipient-save {
  flex: 0 0 auto;
  padding: 0 1rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
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
  margin: 0.375rem 0 0 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 테이블 컨테이너 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.data-table td {
  color: #4b5563;
}

.col-amount {
  text-align: right;
}

.text-right {
  text-align: right;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

/* 금액 스타일 */
.deduction-amount {
  color: #dc2626;
  font-weight: 500;
}

.actual-amount {
  color: #059669;
  font-weight: 600;
}

/* 상태 배지 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-requested {
  background: #dbeafe;
  color: #1e40af;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-paid {
  background: #dcfce7;
  color: #166534;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* 서명 상태 */
.signature-status {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.signature-pending {
  background: #fef3c7;
  color: #92400e;
}

.signature-completed {
  background: #d1fae5;
  color: #065f46;
}

/* 서명 대기 배지 */
.signature-pending-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* PDF 액션 */
.pdf-actions {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.btn-pdf-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.6875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-pdf-sm:hover:not(:disabled) {
  background: #dc2626;
}

.btn-pdf-sm:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-pdf-photo {
  background: #3b82f6;
}

.btn-pdf-photo:hover:not(:disabled) {
  background: #2563eb;
}

.btn-zip-download {
  background: #10b981;
}

.btn-zip-download:hover:not(:disabled) {
  background: #059669;
}

.btn-merge-download {
  background: #7c3aed;
}

.btn-merge-download:hover:not(:disabled) {
  background: #6d28d9;
}

/* 수금 확인 버튼 */
.btn-collection-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-collection-confirm:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}

.collection-completed {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
}

.collection-pending {
  color: #9ca3af;
}

/* 버튼 스타일 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
