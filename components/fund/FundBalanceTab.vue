<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>잔금 정보</h4>
      <div class="tab-actions">
        <!-- 납품완료 처리하기 버튼 (PENDING_SIGNATURE 상태 & 납품완료 전) -->
        <button
          v-if="!isDeliveryCompleted && canCompleteFinalDelivery"
          class="btn-primary"
          @click="emit('openFinalDeliveryModal')"
        >
          <i class="fas fa-check-circle"></i>
          납품완료 처리하기
        </button>
        <!-- 잔금등록 버튼 (납품완료 상태 && 잔금 미입금 시에만) -->
        <button
          v-if="isDeliveryCompleted && !balancePaidAmount"
          class="btn-primary"
          @click="emit('openBalanceConfirmModal')"
        >
          <i class="fas fa-coins"></i>
          잔금등록
        </button>
      </div>
    </div>
    <div class="balance-info">
      <div class="info-row">
        <label>잔금 예정액</label>
        <span class="amount">{{ formatCurrency(remainingBalance) }}</span>
      </div>
      <div class="info-row">
        <label>납품완료 상태</label>
        <span :class="isDeliveryCompleted ? 'text-success' : 'text-warning'">
          {{ isDeliveryCompleted ? '완료' : '미완료' }}
        </span>
      </div>
      <!-- 납품완료일 -->
      <div v-if="deliveryCompletedAt" class="info-row">
        <label>납품완료일</label>
        <span>{{ formatDate(deliveryCompletedAt) }}</span>
      </div>
      <!-- 잔금 입금 정보 -->
      <div v-if="balancePaidDate" class="info-row">
        <label>잔금 입금일</label>
        <span>{{ formatDate(balancePaidDate) }}</span>
      </div>
      <div v-if="balancePaidAmount" class="info-row">
        <label>잔금 입금액</label>
        <span class="amount text-success">{{ formatCurrency(balancePaidAmount) }}</span>
      </div>
      <!-- 잔금 입금확인 버튼 (납품완료 && 미입금 상태일 때만 표시) -->
      <div v-if="isDeliveryCompleted && !balancePaidDate" class="collection-confirm-section">
        <button
          class="btn-collection-confirm-lg"
          @click="emit('openBalanceConfirmModal')"
        >
          <i class="fas fa-check-circle"></i>
          잔금 입금확인
        </button>
      </div>
      <!-- 잔금 입금완료 표시 -->
      <div v-if="balancePaidDate" class="collection-confirm-section">
        <div class="collection-completed">
          <i class="fas fa-check-circle"></i>
          잔금 입금 완료
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/format'

interface Props {
  /** 잔금 예정액 */
  remainingBalance: number
  /** 납품완료 여부 */
  isDeliveryCompleted: boolean
  /** 납품완료 처리 가능 여부 */
  canCompleteFinalDelivery: boolean
  /** 납품완료일 */
  deliveryCompletedAt?: string | null
  /** 잔금 입금일 */
  balancePaidDate?: string | null
  /** 잔금 입금액 */
  balancePaidAmount?: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  /** 납품완료 처리 모달 열기 */
  openFinalDeliveryModal: []
  /** 잔금 입금 확인 모달 열기 */
  openBalanceConfirmModal: []
}>()
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

/* 잔금 정보 */
.balance-info {
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

.text-success {
  color: #059669 !important;
}

.text-warning {
  color: #d97706 !important;
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

.collection-completed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #dcfce7;
  color: #166534;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.collection-completed i {
  font-size: 1.125rem;
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
</style>
