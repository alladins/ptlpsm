<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>선급금 정보</h4>
      <button
        class="btn-primary"
        @click="emit('openModal')"
        :disabled="!canRequestAdvance || hasAdvancePayment"
        :title="advanceButtonTooltip"
      >
        <i class="fas fa-plus"></i>
        {{ hasAdvancePayment ? '선급금 신청완료' : '선급금 신청하기' }}
      </button>
    </div>

    <!-- 케이스 1: 선급금 미신청 -->
    <div v-if="!hasAdvancePayment" class="advance-info">
      <div class="info-row">
        <label>선급금 비율</label>
        <span>{{ advancePaymentRate }}%</span>
      </div>
      <div class="info-row">
        <label>선급금 예상액</label>
        <span class="amount">{{ formatCurrency(expectedAdvanceAmount) }}</span>
      </div>
      <div class="info-row">
        <label>상태</label>
        <span class="status-badge status-pending">미신청</span>
      </div>
      <div class="advance-notice">
        <i class="fas fa-info-circle"></i>
        <span>선급금을 신청하면 5종의 PDF 문서가 자동 생성됩니다.</span>
      </div>
    </div>

    <!-- 케이스 2: 선급금 신청 완료 -->
    <div v-else class="advance-info">
      <div class="info-row">
        <label>신청 금액</label>
        <span class="amount">{{ formatCurrency(advanceDetail?.requestAmount || 0) }}</span>
      </div>
      <div class="info-row">
        <label>신청일</label>
        <span>{{ advanceDetail?.requestDate || '-' }}</span>
      </div>
      <div class="info-row">
        <label>상태</label>
        <span class="status-badge" :class="getAdvanceStatusClass(advanceDetail?.status)">
          {{ getAdvanceStatusLabel(advanceDetail?.status) }}
        </span>
      </div>
      <div v-if="advanceDetail?.approvalDate" class="info-row">
        <label>승인일</label>
        <span>{{ advanceDetail.approvalDate }}</span>
      </div>
      <div v-if="advanceDetail?.paymentDate" class="info-row">
        <label>입금일</label>
        <span>{{ advanceDetail.paymentDate }}</span>
      </div>
      <div v-if="advanceDetail?.approvedAmount" class="info-row">
        <label>입금 금액</label>
        <span class="amount">{{ formatCurrency(advanceDetail.approvedAmount) }}</span>
      </div>
      <div v-if="advanceDetail?.remarks" class="info-row">
        <label>비고</label>
        <span>{{ advanceDetail.remarks }}</span>
      </div>

      <!-- 수금확인 버튼 (신청 또는 승인 상태일 때 표시) -->
      <div v-if="advanceDetail?.status === 'REQUESTED' || advanceDetail?.status === 'APPROVED'" class="collection-confirm-section">
        <button
          class="btn-collection-confirm-lg"
          @click="emit('openCollectionConfirm', advanceDetail)"
        >
          <i class="fas fa-check-circle"></i>
          입금 확인하기
        </button>
      </div>

      <!-- PDF 문서 섹션 -->
      <div class="advance-documents">
        <h5>
          <i class="fas fa-file-pdf"></i>
          관련 문서
        </h5>
        <div class="document-list">
          <div v-for="doc in advanceDocuments" :key="doc.type" class="document-item">
            <div class="document-info">
              <i :class="['fas', doc.icon, doc.iconColor]"></i>
              <span>{{ doc.label }}</span>
            </div>
            <div class="document-actions">
              <button class="btn-pdf-view" @click="emit('viewPdf', doc.type)">
                <i class="fas fa-eye"></i>
                보기
              </button>
              <button class="btn-pdf-download" @click="emit('downloadPdf', doc.type)">
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
        </div>
        <button class="btn-download-all" @click="emit('downloadAllPdfs')">
          <i class="fas fa-file-archive"></i>
          전체 문서 다운로드 (ZIP)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdvancePayment, AdvancePdfType } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'

interface Props {
  /** 선급금 상세 정보 */
  advanceDetail: AdvancePayment | null
  /** 선급금 신청 여부 */
  hasAdvancePayment: boolean
  /** 선급금 신청 가능 여부 */
  canRequestAdvance: boolean
  /** 선급금 예상액 */
  expectedAdvanceAmount: number
  /** 선급금 비율 */
  advancePaymentRate: number
  /** 선급금 버튼 툴팁 */
  advanceButtonTooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  advanceButtonTooltip: ''
})

const emit = defineEmits<{
  /** 선급금 신청 모달 열기 */
  openModal: []
  /** 수금 확인 모달 열기 */
  openCollectionConfirm: [payment: AdvancePayment]
  /** PDF 보기 */
  viewPdf: [type: AdvancePdfType]
  /** PDF 다운로드 */
  downloadPdf: [type: AdvancePdfType]
  /** 전체 PDF 다운로드 */
  downloadAllPdfs: []
}>()

// 상태 포맷팅 함수
const { getAdvanceStatusClass, getAdvanceStatusLabel } = useFundStatusFormatters()

// 선급금 문서 목록
const advanceDocuments: { type: AdvancePdfType; label: string; icon: string; iconColor: string }[] = [
  { type: 'APPLICATION', label: '선급금신청서', icon: 'fa-file-invoice', iconColor: 'text-blue' },
  { type: 'USAGE_PLAN', label: '선급금사용계획', icon: 'fa-clipboard-list', iconColor: 'text-green' },
  { type: 'USAGE_AGREEMENT', label: '선급금사용확약서', icon: 'fa-file-signature', iconColor: 'text-purple' },
  { type: 'USAGE_PLEDGE', label: '선급금사용각서', icon: 'fa-file-contract', iconColor: 'text-orange' },
  { type: 'SETTLEMENT', label: '선급금정산서', icon: 'fa-file-invoice-dollar', iconColor: 'text-red' }
]
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

/* 선급금 정보 */
.advance-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.25rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-row span {
  font-size: 0.9375rem;
  color: #1f2937;
}

.info-row .amount {
  font-weight: 600;
  color: #059669;
}

/* 안내 메시지 */
.advance-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #1d4ed8;
}

.advance-notice i {
  font-size: 1rem;
}

/* 수금 확인 섹션 */
.collection-confirm-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.btn-collection-confirm-lg {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-collection-confirm-lg:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* PDF 문서 섹션 */
.advance-documents {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.advance-documents h5 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #374151;
}

.advance-documents h5 i {
  color: #ef4444;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.document-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
  color: #374151;
}

.document-info i {
  font-size: 1rem;
}

.document-info .text-blue { color: #3b82f6; }
.document-info .text-green { color: #10b981; }
.document-info .text-purple { color: #8b5cf6; }
.document-info .text-orange { color: #f59e0b; }
.document-info .text-red { color: #ef4444; }

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-pdf-view,
.btn-pdf-download {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pdf-view {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-pdf-view:hover {
  background: #e5e7eb;
}

.btn-pdf-download {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-pdf-download:hover {
  background: #2563eb;
}

.btn-download-all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1f2937;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-download-all:hover {
  background: #111827;
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

.status-pending {
  background: #fef3c7;
  color: #92400e;
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
