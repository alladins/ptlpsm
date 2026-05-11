<template>
  <div class="settlement-page">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="연말정산 관리"
      icon="chart"
      icon-color="purple"
      description="연말정산 시뮬레이션 및 최종 확정을 관리합니다."
    >
      <template #actions>
        <div class="year-selector">
          <label class="year-label">조회 연도</label>
          <select v-model="selectedYear" class="form-select-year">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}년
            </option>
          </select>
        </div>
      </template>
    </PageHeader>

    <!-- 안내 배너 -->
    <div class="info-banner warning">
      <i class="fas fa-exclamation-triangle" />
      <div class="info-content">
        <strong>연말정산 안내</strong>
        <p>연말정산을 확정하면 해당 연도의 모든 정산이 최종 구간 비율로 소급 재계산되며, 가지급금이 차감됩니다. 이 작업은 취소할 수 없습니다.</p>
      </div>
    </div>

    <!-- 시뮬레이션 실행 섹션 -->
    <div class="simulation-section">
      <div class="section-header">
        <h3 class="section-title">
          <i class="fas fa-calculator" />
          연말정산 시뮬레이션
        </h3>
        <div class="action-buttons">
          <button
            class="btn-simulate"
            :disabled="simulating"
            @click="runSimulation"
          >
            <i v-if="simulating" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-play" />
            {{ simulating ? '시뮬레이션 중...' : '시뮬레이션 실행' }}
          </button>
          <button
            v-if="simulationResult && !simulationResult.isFinalized"
            class="btn-finalize"
            :disabled="finalizing"
            @click="showFinalizeConfirm = true"
          >
            <i v-if="finalizing" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-check-circle" />
            {{ finalizing ? '확정 중...' : '연말정산 확정' }}
          </button>
          <span v-if="simulationResult?.isFinalized" class="finalized-badge">
            <i class="fas fa-lock" />
            확정 완료
          </span>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="simulating" class="loading-container">
        <i class="fas fa-spinner fa-spin" />
        <p>시뮬레이션을 실행하고 있습니다...</p>
      </div>

      <!-- 시뮬레이션 미실행 -->
      <div v-else-if="!simulationResult" class="empty-state">
        <i class="fas fa-chart-line" />
        <p>시뮬레이션을 실행하여 연말정산 결과를 확인하세요.</p>
      </div>

      <!-- 시뮬레이션 결과 -->
      <div v-else>
        <!-- 요약 정보 -->
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-label">
              연간 총 매출액
            </div>
            <div class="summary-value">
              {{ formatCurrency(simulationResult.totalSalesAmount) }}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">
              최종 적용 구간
            </div>
            <div class="summary-value tier">
              {{ simulationResult.finalTier }}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">
              정산 상태
            </div>
            <div class="summary-value">
              <span :class="['status-indicator', simulationResult.isFinalized ? 'finalized' : 'pending']">
                {{ simulationResult.isFinalized ? '확정 완료' : '미확정' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 결과 테이블 -->
        <div class="table-container">
          <table class="settlement-table">
            <thead>
              <tr>
                <th>수령자</th>
                <th>최종비율</th>
                <th>기존 정산합계</th>
                <th>소급 재계산</th>
                <th>조정금액</th>
                <th>가지급금</th>
                <th>최종 지급액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="recipient in simulationResult.recipients" :key="recipient.recipientType">
                <td class="recipient-name">
                  {{ recipient.recipientLabel }}
                </td>
                <td class="rate">
                  {{ recipient.finalRate }}%
                </td>
                <td class="amount">
                  {{ formatCurrency(recipient.originalTotal) }}
                </td>
                <td class="amount">
                  {{ formatCurrency(recipient.recalculatedTotal) }}
                </td>
                <td :class="['amount', getAdjustmentClass(recipient.adjustmentAmount)]">
                  {{ formatAdjustment(recipient.adjustmentAmount) }}
                </td>
                <td class="amount">
                  {{ recipient.advanceTotal > 0 ? formatCurrency(recipient.advanceTotal) : '-' }}
                </td>
                <td class="amount final-amount">
                  {{ formatCurrency(recipient.finalPaymentAmount) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="recipient-name">
                  <strong>합계</strong>
                </td>
                <td class="rate">
                  <strong>100%</strong>
                </td>
                <td class="amount">
                  <strong>{{ formatCurrency(totals.originalTotal) }}</strong>
                </td>
                <td class="amount">
                  <strong>{{ formatCurrency(totals.recalculatedTotal) }}</strong>
                </td>
                <td :class="['amount', getAdjustmentClass(totals.adjustmentAmount)]">
                  <strong>{{ formatAdjustment(totals.adjustmentAmount) }}</strong>
                </td>
                <td class="amount">
                  <strong>{{ formatCurrency(totals.advanceTotal) }}</strong>
                </td>
                <td class="amount final-amount">
                  <strong>{{ formatCurrency(totals.finalPaymentAmount) }}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>

    <!-- 연말정산 확정 확인 모달 -->
    <Teleport to="body">
      <div v-if="showFinalizeConfirm" class="modal-overlay" @click.self="showFinalizeConfirm = false">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-exclamation-triangle warning-icon" />
              연말정산 확정
            </h3>
            <button class="btn-close" @click="showFinalizeConfirm = false">
              <i class="fas fa-times" />
            </button>
          </div>
          <div class="modal-body">
            <div class="confirm-message">
              <p class="confirm-warning">
                <strong>{{ selectedYear }}년 연말정산을 확정하시겠습니까?</strong>
              </p>
              <ul class="confirm-details">
                <li>해당 연도의 모든 정산이 최종 구간 비율로 <strong>소급 재계산</strong>됩니다.</li>
                <li>등록된 <strong>가지급금이 차감</strong>됩니다.</li>
                <li>이 작업은 <strong class="text-danger">취소할 수 없습니다</strong>.</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="showFinalizeConfirm = false">
              취소
            </button>
            <button class="btn-confirm danger" :disabled="finalizing" @click="executeFinalize">
              <i v-if="finalizing" class="fas fa-spinner fa-spin" />
              <i v-else class="fas fa-check" />
              {{ finalizing ? '처리 중...' : '확정 실행' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCurrency } from '~/utils/format'
import {
  simulateFinalSettlement,
  finalizeFinalSettlement
} from '~/services/commission.service'
import type { AnnualFinalSettlementResponse } from '~/types/commission'

definePageMeta({
  layout: 'admin',
  pageTitle: '연말정산 관리'
})

// State
const selectedYear = ref(new Date().getFullYear())
const simulating = ref(false)
const finalizing = ref(false)
const simulationResult = ref<AnnualFinalSettlementResponse | null>(null)
const showFinalizeConfirm = ref(false)

// Computed
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

/** 합계 행 계산 */
const totals = computed(() => {
  if (!simulationResult.value?.recipients) {
    return {
      originalTotal: 0,
      recalculatedTotal: 0,
      adjustmentAmount: 0,
      advanceTotal: 0,
      finalPaymentAmount: 0
    }
  }
  const recipients = simulationResult.value.recipients
  return {
    originalTotal: recipients.reduce((sum, r) => sum + r.originalTotal, 0),
    recalculatedTotal: recipients.reduce((sum, r) => sum + r.recalculatedTotal, 0),
    adjustmentAmount: recipients.reduce((sum, r) => sum + r.adjustmentAmount, 0),
    advanceTotal: recipients.reduce((sum, r) => sum + r.advanceTotal, 0),
    finalPaymentAmount: recipients.reduce((sum, r) => sum + r.finalPaymentAmount, 0)
  }
})

// Methods

/** 시뮬레이션 실행 */
const runSimulation = async () => {
  simulating.value = true
  simulationResult.value = null
  try {
    simulationResult.value = await simulateFinalSettlement(selectedYear.value)
  } catch (error) {
    console.error('연말정산 시뮬레이션 실패:', error)
    alert('시뮬레이션 실행에 실패했습니다.')
  } finally {
    simulating.value = false
  }
}

/** 연말정산 확정 실행 */
const executeFinalize = async () => {
  finalizing.value = true
  try {
    simulationResult.value = await finalizeFinalSettlement(selectedYear.value)
    showFinalizeConfirm.value = false
    alert('연말정산이 확정되었습니다.')
  } catch (error) {
    console.error('연말정산 확정 실패:', error)
    alert('연말정산 확정에 실패했습니다.')
  } finally {
    finalizing.value = false
  }
}

/** 조정금액 CSS 클래스 반환 */
const getAdjustmentClass = (amount: number): string => {
  if (amount > 0) { return 'positive' }
  if (amount < 0) { return 'negative' }
  return ''
}

/** 조정금액 포맷 (부호 포함) */
const formatAdjustment = (amount: number): string => {
  if (amount === 0) { return '0' }
  const prefix = amount > 0 ? '+' : ''
  return prefix + formatCurrency(amount)
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-tables.css';

/* 연도 선택 */
.year-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.year-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-select-year {
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  background: white;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 0.2s;
}

.form-select-year:hover {
  border-color: #3b82f6;
}

.form-select-year:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 안내 배너 */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-banner.warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-left: 4px solid #f59e0b;
}

.info-banner.warning > i {
  font-size: 1.25rem;
  color: #f59e0b;
  margin-top: 0.125rem;
}

.info-content strong {
  display: block;
  color: #92400e;
  margin-bottom: 0.375rem;
}

.info-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #b45309;
  line-height: 1.5;
}

/* 시뮬레이션 섹션 */
.simulation-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: #1f2937;
}

.section-title i {
  color: #3b82f6;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-simulate {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-simulate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-simulate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-finalize {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-finalize:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-finalize:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.finalized-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.summary-label {
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.summary-value.tier {
  font-size: 1.0625rem;
  color: #3b82f6;
}

.status-indicator {
  display: inline-flex;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.status-indicator.finalized {
  background: #d1fae5;
  color: #065f46;
}

.status-indicator.pending {
  background: #fef3c7;
  color: #92400e;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.settlement-table {
  width: 100%;
  border-collapse: collapse;
}

.settlement-table th {
  padding: 0.875rem 1rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.8125rem;
  white-space: nowrap;
}

.settlement-table td {
  padding: 0.875rem 1rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  vertical-align: middle;
}

.settlement-table tbody tr:hover {
  background: #f9fafb;
}

.settlement-table tfoot td {
  border-top: 2px solid #e5e7eb;
  border-bottom: none;
  background: #f9fafb;
}

.recipient-name {
  text-align: left !important;
  font-weight: 500;
}

.rate {
  color: #6b7280;
  font-weight: 500;
}

.amount {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 500;
  color: #1f2937;
  text-align: right !important;
}

.amount.positive {
  color: #2563eb;
}

.amount.negative {
  color: #dc2626;
}

.final-amount {
  font-weight: 600;
  color: #1f2937;
}

.total-row td {
  padding: 1rem;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #3b82f6;
}

/* 모달 */
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
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.warning-icon {
  color: #f59e0b;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.confirm-message {
  line-height: 1.6;
}

.confirm-warning {
  margin: 0 0 1rem 0;
  font-size: 0.9375rem;
  color: #1f2937;
}

.confirm-details {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.confirm-details li {
  margin-bottom: 0.5rem;
}

.confirm-details li:last-child {
  margin-bottom: 0;
}

.text-danger {
  color: #dc2626;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-confirm.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-simulate,
  .btn-finalize {
    flex: 1;
    justify-content: center;
  }
}
</style>
