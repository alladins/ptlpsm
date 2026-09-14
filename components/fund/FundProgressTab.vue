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

    <!-- 붙임 서류 선택. 공문 미리보기·일괄(ZIP)·합지 다운로드에 공통 적용 -->
    <div class="docs-section">
      <label class="docs-label">붙임 서류</label>
      <div class="docs-checkbox-row">
        <label
          v-for="docType in BASELINE_DOC_TYPES"
          :key="docType"
          class="docs-checkbox"
        >
          <input
            v-model="selectedDocs"
            type="checkbox"
            :value="docType"
          >
          {{ BASELINE_DOC_LABELS[docType] }}
        </label>
      </div>
      <p class="docs-hint">
        선택한 서류만 첨부되고, 공문의 붙임 목록도 선택한 것만 번호를 다시 매겨 표기됩니다.
        공문은 항상 포함됩니다. (납품내역서는 출하가 2회 이상인 건에서만 첨부)
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
            <th>관리</th>
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
                  @click="ensureDocsSelected() && emit('viewCoverPdf', payment.baselineId, recipientName, selectedDocs)"
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
                  @click="ensureDocsSelected() && emit('downloadMergedPdf', payment.baselineId, recipientName, selectedDocs)"
                >
                  <i class="fas fa-file-pdf" />
                  합지 다운로드
                </button>
                <button
                  class="btn-pdf-sm btn-zip-download"
                  :disabled="!payment.baselineId"
                  title="공문·납품확인서·기성금청구내역·사진대지·납품내역서를 ZIP으로 일괄 다운로드"
                  @click="ensureDocsSelected() && emit('downloadAllPdfs', payment.baselineId, recipientName, selectedDocs)"
                >
                  <i class="fas fa-file-archive" />
                  일괄 다운로드
                </button>
              </div>
            </td>
            <!-- 관리 열 (수금확인 + 차수 취소) -->
            <td>
              <div class="collection-actions">
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

                <!-- 차수 취소 (수금 확인 전 + 마지막 차수만) -->
                <button
                  v-if="isCancellable(payment)"
                  class="btn-baseline-cancel"
                  title="이 기성 차수를 취소합니다. 물량 추가 후 같은 차수로 다시 청구할 수 있습니다."
                  @click="openCancelModal(payment)"
                >
                  <i class="fas fa-ban" />
                  취소
                </button>
              </div>
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

    <!-- 기성 차수 취소 확인 모달 -->
    <div v-if="cancelTarget" class="cancel-modal-overlay" @click.self="closeCancelModal">
      <div class="cancel-modal">
        <div class="cancel-modal-header">
          <h5>
            <i class="fas fa-exclamation-triangle" />
            {{ cancelTarget.paymentSeq }}차 기성청구 취소
          </h5>
        </div>

        <div class="cancel-modal-body">
          <p class="cancel-summary">
            청구금액 <strong>{{ formatCurrency(cancelTarget.requestAmount) }}</strong> ·
            청구일 {{ cancelTarget.requestDate }}
          </p>

          <ul class="cancel-notice">
            <li>차수 · 품목 스냅샷 · 출하 연결 · 기성금 요청이 함께 삭제됩니다.</li>
            <li>연결된 출하는 다시 <strong>기성 청구 가능</strong> 상태로 돌아갑니다.</li>
            <li>물량 추가 후 재청구하면 <strong>같은 {{ cancelTarget.paymentSeq }}차</strong>로 다시 부여됩니다.</li>
            <li>발행된 PDF 는 삭제하지 않고 백업 폴더로 이동합니다.</li>
            <li class="cancel-warning">
              <i class="fas fa-exclamation-circle" />
              이미 수요기관에 발송된 서류는 시스템에서 회수되지 않습니다. 별도 폐기·재송부가 필요합니다.
            </li>
          </ul>

          <label class="cancel-reason-label">취소 사유 <span class="required">*</span></label>
          <textarea
            v-model="cancelReason"
            class="cancel-reason-input"
            rows="3"
            placeholder="예) 물량 추가 후 재청구 예정"
          />
        </div>

        <div class="cancel-modal-footer">
          <button class="btn-cancel-close" :disabled="cancelling" @click="closeCancelModal">
            닫기
          </button>
          <button
            class="btn-cancel-confirm"
            :disabled="cancelling || !cancelReason.trim()"
            @click="confirmCancel"
          >
            <i :class="cancelling ? 'fas fa-spinner fa-spin' : 'fas fa-ban'" />
            차수 취소
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProgressPaymentRequest } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'
import { baselineService, BASELINE_DOC_TYPES, BASELINE_DOC_LABELS, type BaselineDocType } from '~/services/baseline.service'
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

// 붙임 서류 선택 — 기본은 전체 선택(기존 동작과 동일).
// 하나도 선택하지 않으면 백엔드가 '미지정=전체'로 처리하므로, 빈 배열은 다운로드 시 막는다.
const selectedDocs = ref<BaselineDocType[]>([...BASELINE_DOC_TYPES])

/** 붙임 서류를 하나도 고르지 않았으면 경고하고 중단 */
const ensureDocsSelected = (): boolean => {
  if (selectedDocs.value.length === 0) {
    alert('붙임 서류를 하나 이상 선택하세요.')
    return false
  }
  return true
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
  viewCoverPdf: [baselineId: number, recipientName: string, docs: BaselineDocType[]]
  /** 기성청구 PDF 재생성 (납품확인서·사진대지) */
  regeneratePdfs: [baselineId: number]
  /** 기성 차수 전체 PDF 일괄 다운로드(ZIP) */
  downloadAllPdfs: [baselineId: number, recipientName: string, docs: BaselineDocType[]]
  /** 기성 차수 전체 PDF 합지 다운로드(단일 PDF) */
  downloadMergedPdf: [baselineId: number, recipientName: string, docs: BaselineDocType[]]
  /** 스캔본 업로드 완료 → 목록 갱신 */
  scanUploaded: []
  /** 기성 차수 취소 완료 → 목록 갱신 */
  baselineCancelled: []
}>()

// ============ 기성 차수 취소 ============

// 마지막 차수 번호 — 중간 차수를 지우면 이후 차수의 누계(전회기성)가 어긋나므로 마지막만 취소 허용
const lastPaymentSeq = computed(() => {
  const seqs = filteredProgressPayments.value
    .map(p => p.paymentSeq)
    .filter((s): s is number => typeof s === 'number')
  return seqs.length > 0 ? Math.max(...seqs) : null
})

/**
 * 취소 가능 여부 — 수금 확인 전 + 마지막 차수만
 * @description 수금 확인 시 자금 누계·선급금 정산·커미션이 함께 반영되어 역산이 불가능하다.
 *              백엔드에도 동일 가드가 있으며 여기서는 버튼 노출만 제어한다.
 */
const isCancellable = (payment: ProgressPaymentRequest) => {
  if (!payment.baselineId) { return false }
  if (payment.status === 'PAID') { return false }
  if (payment.paymentDate) { return false }
  return payment.paymentSeq === lastPaymentSeq.value
}

const cancelTarget = ref<ProgressPaymentRequest | null>(null)
const cancelReason = ref('')
const cancelling = ref(false)

const openCancelModal = (payment: ProgressPaymentRequest) => {
  cancelTarget.value = payment
  cancelReason.value = ''
}

const closeCancelModal = () => {
  if (cancelling.value) { return }
  cancelTarget.value = null
  cancelReason.value = ''
}

const confirmCancel = async () => {
  const target = cancelTarget.value
  const reason = cancelReason.value.trim()
  if (!target?.baselineId || !reason) { return }

  cancelling.value = true
  try {
    await baselineService.cancelBaseline(target.baselineId, reason)
    alert(`${target.paymentSeq}차 기성청구가 취소되었습니다. 물량 추가 후 다시 청구할 수 있습니다.`)
    cancelTarget.value = null
    cancelReason.value = ''
    emit('baselineCancelled')
  } catch (e: any) {
    alert(e?.message || '기성 차수 취소 중 오류가 발생했습니다.')
  } finally {
    cancelling.value = false
  }
}

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

/* 붙임 서류 선택 */
.docs-section {
  margin-bottom: 1rem;
}

.docs-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.docs-checkbox-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.docs-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: #374151;
  cursor: pointer;
}

.docs-hint {
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

/* 수금확인/취소 버튼 묶음 — 가로 배치 (취소는 수금확인 오른쪽) */
.collection-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

/* 기성 차수 취소 버튼 (수금 확인 전 + 마지막 차수만 노출) */
.btn-baseline-cancel {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  background: white;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-baseline-cancel:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

/* ===== 기성 차수 취소 모달 ===== */
.cancel-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cancel-modal {
  width: min(520px, calc(100vw - 2rem));
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

.cancel-modal-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.cancel-modal-header h5 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
}

.cancel-modal-body {
  padding: 1.25rem;
}

.cancel-summary {
  margin: 0 0 0.875rem;
  font-size: 0.875rem;
  color: #374151;
}

.cancel-notice {
  margin: 0 0 1rem;
  padding-left: 1.125rem;
  font-size: 0.8125rem;
  line-height: 1.65;
  color: #4b5563;
}

.cancel-notice .cancel-warning {
  margin-top: 0.5rem;
  color: #b45309;
  list-style: none;
  margin-left: -1.125rem;
  padding: 0.5rem 0.625rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 4px;
}

.cancel-reason-label {
  display: block;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.cancel-reason-label .required {
  color: #dc2626;
}

.cancel-reason-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
}

.cancel-reason-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.cancel-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel-close {
  padding: 0.5rem 0.875rem;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-cancel-close:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-cancel-confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel-confirm:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-cancel-confirm:disabled,
.btn-cancel-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
