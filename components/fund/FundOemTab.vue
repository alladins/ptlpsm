<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>OEM 지급 현황</h4>
      <div class="tab-actions">
        <button
          class="btn-warning"
          :disabled="!canAdjustBgrade"
          :title="bgradeButtonTitle"
          @click="emit('openBgradeModal')"
        >
          <i class="fas fa-tags"></i>
          B급 조정
        </button>
        <button class="btn-primary" @click="emit('openOemModal')">
          <i class="fas fa-plus"></i>
          지급 등록
        </button>
      </div>
    </div>
    <!-- OEM 지급 요약 -->
    <div class="oem-summary-card">
      <div class="summary-item">
        <span class="label">기성금 누계</span>
        <span class="value">{{ formatCurrency(progressPaymentTotal) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="label">OEM 지급 예정 (70%)</span>
        <span class="value highlight">{{ formatCurrency(oemExpectedAmount) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="label">지급 완료</span>
        <span class="value success">{{ formatCurrency(oemPaidTotal) }}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="label">미지급</span>
        <span class="value warning">{{ formatCurrency(oemExpectedAmount - oemPaidTotal) }}</span>
      </div>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>차수</th>
            <th>OEM 업체</th>
            <th>지급예정금액</th>
            <th>예정일</th>
            <th>실제지급금액</th>
            <th>지급일</th>
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="oemPayments.length === 0">
            <td colspan="8" class="no-data">OEM 지급 이력이 없습니다.</td>
          </tr>
          <tr v-else v-for="oem in oemPayments" :key="oem.oemPaymentId">
            <td>{{ oem.paymentSeq }}차</td>
            <td>{{ oem.oemCompanyName || '-' }}</td>
            <td class="text-right">{{ formatCurrency(oem.scheduledAmount) }}</td>
            <td>{{ oem.scheduledDate || '-' }}</td>
            <td class="text-right">{{ oem.paidAmount ? formatCurrency(oem.paidAmount) : '-' }}</td>
            <td>{{ oem.paidDate || '-' }}</td>
            <td>
              <span class="status-badge" :class="getOemPaymentStatusClass(oem.status)">
                {{ getOemPaymentStatusLabel(oem.status) }}
              </span>
            </td>
            <td>
              <div v-if="oem.status === 'PENDING'" class="oem-action-buttons">
                <button
                  class="btn-oem-complete"
                  @click="emit('openOemCompleteModal', oem)"
                  title="지급 완료 처리"
                >
                  <i class="fas fa-check"></i>
                  지급완료
                </button>
                <button
                  class="btn-oem-delete"
                  @click="emit('confirmDeleteOem', oem)"
                  title="삭제"
                >
                  <i class="fas fa-trash-alt"></i>
                  삭제
                </button>
              </div>
              <span v-else-if="oem.status === 'PAID'" class="oem-completed">
                <i class="fas fa-check-circle"></i>
                완료
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OemPayment } from '~/types/fund'
import { formatCurrency } from '~/utils/format'
import { useFundStatusFormatters } from '~/composables/useFundStatusFormatters'

interface Props {
  /** OEM 지급 목록 */
  oemPayments: OemPayment[]
  /** 기성금 누계 */
  progressPaymentTotal: number
  /** OEM 지급 완료 총액 */
  oemPaidTotal: number
  /** B급 조정 가능 여부 */
  canAdjustBgrade: boolean
  /** B급 조정 버튼 툴팁 */
  bgradeButtonTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  bgradeButtonTitle: ''
})

const emit = defineEmits<{
  /** OEM 지급 등록 모달 열기 */
  openOemModal: []
  /** OEM 지급 완료 모달 열기 */
  openOemCompleteModal: [oem: OemPayment]
  /** OEM 지급 삭제 확인 */
  confirmDeleteOem: [oem: OemPayment]
  /** B급 조정 모달 열기 */
  openBgradeModal: []
}>()

// 상태 포맷팅 함수
const { getOemPaymentStatusClass, getOemPaymentStatusLabel } = useFundStatusFormatters()

// OEM 지급 예정 금액 (기성금의 70%)
const oemExpectedAmount = computed(() => Math.floor((props.progressPaymentTotal || 0) * 0.7))
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

.tab-actions {
  display: flex;
  gap: 0.5rem;
}

/* OEM 지급 요약 카드 (다크 테마) */
.oem-summary-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  gap: 1rem;
}

.oem-summary-card .summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.oem-summary-card .summary-item .label {
  font-size: 0.75rem;
  color: #94a3b8;
}

.oem-summary-card .summary-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  font-feature-settings: 'tnum';
}

.oem-summary-card .summary-item .value.highlight {
  color: #fbbf24;
}

.oem-summary-card .summary-item .value.success {
  color: #34d399;
}

.oem-summary-card .summary-item .value.warning {
  color: #f87171;
}

.oem-summary-card .summary-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

/* 테이블 컨테이너 */
.table-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

/* OEM 테이블 헤더 */
.data-table thead th {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

/* OEM 테이블 행 스타일 */
.data-table tbody tr {
  transition: all 0.15s ease;
}

.data-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.data-table tbody tr:hover {
  background: #f0f9ff;
}

.data-table tbody td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

/* 금액 컬럼 강조 */
.data-table tbody td.text-right {
  text-align: right;
  font-weight: 600;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}

/* 빈 데이터 표시 */
.data-table .no-data {
  padding: 3rem 1rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9375rem;
  background: #f8fafc;
}

/* OEM 상태 배지 개선 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-badge.status-paid {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #047857;
  border: 1px solid #6ee7b7;
}

/* OEM 액션 버튼 */
.oem-action-buttons {
  display: flex;
  gap: 0.375rem;
}

.btn-oem-complete {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-oem-complete:hover {
  background: #059669;
}

.btn-oem-delete {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-oem-delete:hover {
  background: #dc2626;
}

.oem-completed {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
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

.btn-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-warning:disabled {
  background: #fcd34d;
  color: #92400e;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
