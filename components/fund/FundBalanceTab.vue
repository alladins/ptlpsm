<template>
  <div class="tab-content">
    <div class="tab-header">
      <h4>잔금 정보</h4>
      <div class="tab-actions">
        <!-- 납품완료 처리하기 버튼 (PENDING_SIGNATURE 상태 & 납품완료 전) — 완료계 서류 발행 → 귀속 미지정이면 막힘 -->
        <GuardedButton
          v-if="!isDeliveryCompleted && canCompleteFinalDelivery"
          class="btn-primary"
          :blocked="allocBlocked"
          :reason="allocReason('납품완료 처리(서류 발행)')"
          @click="emit('openFinalDeliveryModal')"
        >
          <i class="fas fa-check-circle" />
          납품완료 처리하기
        </GuardedButton>
        <!-- 잔금등록 버튼 (납품완료 상태 && 잔금 요청 없음 && 미입금) — 잔금 청구 → 귀속 미지정이면 막힘 -->
        <GuardedButton
          v-if="isDeliveryCompleted && !hasBalanceRequest && !balancePaidDate"
          class="btn-primary"
          :blocked="allocBlocked"
          :reason="allocReason('잔금등록')"
          @click="emit('openBalanceRegisterModal')"
        >
          <i class="fas fa-coins" />
          잔금등록
        </GuardedButton>
      </div>
    </div>
    <!-- 계약 품목 귀속 미지정 → 잔금·납품완료 처리가 막혀 있음 (잔금 입금 전까지만 안내) -->
    <ContractAllocGuardNotice
      v-if="allocBlocked && !balancePaidDate"
      :count="allocCount"
      :items="allocItems"
      action="잔금등록·납품완료 처리"
      :to="contractAllocDeliveryDoneLink(deliveryDoneId)"
    />
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
      <!-- 잔금 등록 상태 (잔금 요청이 있고, 아직 입금확인 전인 경우) -->
      <div v-if="hasBalanceRequest && balanceRequestStatus !== 'PAID'" class="info-row">
        <label>잔금 등록 상태</label>
        <span class="text-info">등록완료 (입금대기)</span>
      </div>
      <!-- 잔금 요청 금액 -->
      <div v-if="balanceRequestAmount" class="info-row">
        <label>잔금 등록액</label>
        <span class="amount">{{ formatCurrency(balanceRequestAmount) }}</span>
      </div>
      <!-- 선급금 차감액 -->
      <div v-if="balanceAdvanceDeduction && balanceAdvanceDeduction > 0" class="info-row">
        <label>선급금 차감액</label>
        <span class="deduction-amount">-{{ formatCurrency(balanceAdvanceDeduction) }}</span>
      </div>
      <!-- 실수금액 -->
      <div v-if="balanceNetAmount !== null && balanceNetAmount !== undefined" class="info-row">
        <label>실수금액</label>
        <span class="amount text-success">{{ formatCurrency(balanceNetAmount) }}</span>
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
      <!-- 잔금 입금확인 버튼 (납품완료 && 잔금 요청 있음 && status가 PAID가 아닐 때) -->
      <div v-if="isDeliveryCompleted && hasBalanceRequest && balanceRequestStatus !== 'PAID'" class="collection-confirm-section">
        <button
          class="btn-collection-confirm-lg"
          @click="emit('openBalanceConfirmModal')"
        >
          <i class="fas fa-check-circle" />
          잔금 입금확인
        </button>
      </div>
      <!-- 잔금 입금완료 표시 (status가 PAID일 때만) -->
      <div v-if="balanceRequestStatus === 'PAID'" class="collection-confirm-section">
        <div class="collection-completed">
          <i class="fas fa-check-circle" />
          잔금 입금 완료
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { formatCurrency, formatDate } from '~/utils/format'
import ContractAllocGuardNotice from '~/components/contract-alloc/ContractAllocGuardNotice.vue'
import {
  useContractAllocStatus,
  contractAllocBlockedReason,
  contractAllocDeliveryDoneLink
} from '~/composables/useContractAllocStatus'

interface Props {
  /** 발주 ID — 계약 품목 귀속 가드 조회용 */
  orderId?: number | null
  /** 납품완료 ID — [지정하러 가기] 링크(납품완료 상세 #contract-alloc)용 */
  deliveryDoneId?: number | null
  /** 잔금 예정액 */
  remainingBalance: number
  /** 납품완료 여부 */
  isDeliveryCompleted: boolean
  /** 납품완료 처리 가능 여부 */
  canCompleteFinalDelivery: boolean
  /** 납품완료일 */
  deliveryCompletedAt?: string | null
  /** 잔금 요청 존재 여부 (progress_payment_requests에 BALANCE 레코드 존재) */
  hasBalanceRequest?: boolean
  /** 잔금 요청 금액 */
  balanceRequestAmount?: number | null
  /** 잔금 요청 상태 (APPROVED, PAID 등) - 입금 완료 판단에 사용 */
  balanceRequestStatus?: string | null
  /** 잔금 입금일 */
  balancePaidDate?: string | null
  /** 잔금 입금액 */
  balancePaidAmount?: number | null
  /** 선급금 차감액 */
  balanceAdvanceDeduction?: number | null
  /** 실수금액 (잔금 - 선급금차감) */
  balanceNetAmount?: number | null
}

const props = defineProps<Props>()

// ===== 계약 품목 귀속 가드 =====
// 잔금 청구·완료계 발행은 계약 기준 집계로 나간다. 미지정이 있으면 막고 지정 위치로 안내한다.
// 조회 실패 시에는 막지 않는다(백엔드 400 이 최종 차단).
const {
  blocked: allocBlocked,
  unallocatedCount: allocCount,
  unallocatedItems: allocItems,
  loadByOrder: loadAllocStatus
} = useContractAllocStatus()

const allocReason = (action: string) =>
  contractAllocBlockedReason(allocCount.value, action, '아래 [지정하러 가기] 로 이동해 «계약 품목 귀속»')

watch(() => props.orderId, (id) => { loadAllocStatus(id) }, { immediate: true })

const emit = defineEmits<{
  /** 납품완료 처리 모달 열기 */
  openFinalDeliveryModal: []
  /** 잔금 등록 모달 열기 (잔금 요청 생성) */
  openBalanceRegisterModal: []
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

.text-info {
  color: #0284c7 !important;
}

.deduction-amount {
  color: #dc2626 !important;
  font-weight: 600;
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
