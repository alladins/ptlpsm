<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container" :class="{ 'success-state': isSuccess }">
          <!-- Success Animation Overlay -->
          <Transition name="success-fade">
            <div v-if="isSuccess" class="ccm-success-overlay ccm-green">
              <div class="ccm-success-content">
                <div class="ccm-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="ccm-success-title">{{ successTitle }}</h3>
                <p class="ccm-success-message">{{ getSuccessMessage() }}</p>
              </div>
            </div>
          </Transition>

          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon" :class="headerIconClass">
                <component :is="getPaymentIcon()" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">{{ modalTitle }}</h2>
              </div>
            </div>
            <button class="ccm-close-button" @click="handleClose" :disabled="isSubmitting">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="ccm-modal-body">
            <!-- Amount Info Card -->
            <div class="ccm-amount-info-card">
              <div class="ccm-amount-row">
                <span class="ccm-amount-label">{{ paymentTypeLabel }} 금액</span>
                <span class="ccm-amount-value">{{ formatCurrency(requestAmount) }}</span>
              </div>
              <div v-if="approvedAmount && approvedAmount !== requestAmount" class="ccm-amount-row ccm-approved">
                <span class="ccm-amount-label">승인 금액</span>
                <span class="ccm-amount-value">{{ formatCurrency(approvedAmount) }}</span>
              </div>
              <!-- 기성금 수금 시 선급금 차감 정보 표시 -->
              <template v-if="paymentType === 'progress' && advanceDeductionAmount > 0">
                <div class="ccm-amount-divider"></div>
                <div class="ccm-amount-row ccm-deduction">
                  <span class="ccm-amount-label">(-) 선급금 차감액</span>
                  <span class="ccm-amount-value ccm-negative">- {{ formatCurrency(advanceDeductionAmount) }}</span>
                </div>
                <div class="ccm-amount-row ccm-actual">
                  <span class="ccm-amount-label">(=) 실수금액 (입금 예정액)</span>
                  <span class="ccm-amount-value ccm-highlight">{{ formatCurrency(actualReceivableAmount) }}</span>
                </div>
              </template>
            </div>

            <!-- 선급금 정산 현황 (기성금 수금 확인 시) -->
            <div v-if="paymentType === 'progress' && advanceDeductionAmount > 0" class="ccm-settlement-info">
              <div class="ccm-settlement-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
                <span>정산 현황 (수금 확인 후)</span>
              </div>
              <div class="ccm-settlement-row">
                <span class="ccm-settlement-label">선급금 정산 누계</span>
                <span class="ccm-settlement-value">
                  {{ formatCurrency(currentSettledTotal) }}
                  <span class="ccm-arrow">→</span>
                  {{ formatCurrency(currentSettledTotal + advanceDeductionAmount) }}
                </span>
              </div>
              <div class="ccm-settlement-row">
                <span class="ccm-settlement-label">미정산 선급금 잔액</span>
                <span class="ccm-settlement-value" :class="{ 'ccm-complete': newUnsettledBalance === 0 }">
                  {{ formatCurrency(newUnsettledBalance) }}
                  <span v-if="newUnsettledBalance === 0" class="ccm-complete-badge">✓ 정산완료</span>
                </span>
              </div>
            </div>

            <!-- Form Fields -->
            <form @submit.prevent="handleSubmit" class="ccm-form">
              <!-- 입금일 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  입금일
                </label>
                <div class="ccm-input-wrapper">
                  <input
                    type="date"
                    v-model="formData.paymentDate"
                    class="ccm-form-input ccm-date-input"
                    :max="today"
                    required
                    :disabled="isSubmitting"
                  />
                </div>
                <span v-if="errors.paymentDate" class="ccm-error-message">{{ errors.paymentDate }}</span>
              </div>

              <!-- 입금금액 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <span class="ccm-label-icon ccm-currency-icon ccm-blue">₩</span>
                  입금 금액
                </label>
                <div class="ccm-input-wrapper ccm-amount-wrapper">
                  <input
                    type="text"
                    v-model="displayAmount"
                    @input="handleAmountInput"
                    @focus="handleAmountFocus"
                    @blur="handleAmountBlur"
                    class="ccm-form-input ccm-amount-input"
                    placeholder="0"
                    required
                    :disabled="isSubmitting"
                  />
                  <span class="ccm-input-suffix">원</span>
                </div>
                <div class="ccm-amount-actions">
                  <button
                    type="button"
                    class="ccm-amount-preset-btn ccm-blue"
                    @click="setFullAmount"
                    :disabled="isSubmitting"
                  >
                    전액 입력
                  </button>
                  <span class="ccm-remaining-amount">
                    {{ formatCurrency(remainingAmount) }}
                  </span>
                </div>
                <span v-if="errors.paidAmount" class="ccm-error-message">{{ errors.paidAmount }}</span>
              </div>

              <!-- 계좌정보 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  입금 계좌
                  <span class="ccm-optional-tag">선택</span>
                </label>
                <div class="ccm-input-wrapper">
                  <input
                    type="text"
                    v-model="formData.bankAccount"
                    class="ccm-form-input"
                    placeholder="예: 국민은행 123-456-789012"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <!-- 비고 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  비고
                  <span class="ccm-optional-tag">선택</span>
                </label>
                <div class="ccm-input-wrapper">
                  <textarea
                    v-model="formData.remarks"
                    class="ccm-form-input ccm-textarea"
                    placeholder="추가 메모를 입력하세요"
                    rows="3"
                    :disabled="isSubmitting"
                  ></textarea>
                </div>
              </div>
            </form>
          </div>

          <!-- Modal Footer -->
          <div class="ccm-modal-footer">
            <button
              type="button"
              class="ccm-btn-cancel"
              @click="handleClose"
              :disabled="isSubmitting"
            >
              취소
            </button>
            <button
              type="submit"
              class="ccm-btn-confirm"
              @click="handleSubmit"
              :disabled="isSubmitting || !isFormValid"
            >
              <span v-if="isSubmitting" class="ccm-loading-spinner"></span>
              <span v-else>수금 확인</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from 'vue'

// Props
interface Props {
  isOpen: boolean
  paymentType: 'advance' | 'progress' | 'balance'
  fundId: number
  paymentId: number // advanceId, paymentId, or balanceRequestId
  requestAmount: number
  approvedAmount?: number
  // 선급금 차감 관련 (기성금 수금 확인 시)
  advanceDeductionAmount?: number
  actualReceivableAmount?: number
  currentSettledTotal?: number
  currentUnsettledBalance?: number
}

const props = withDefaults(defineProps<Props>(), {
  approvedAmount: 0,
  advanceDeductionAmount: 0,
  actualReceivableAmount: 0,
  currentSettledTotal: 0,
  currentUnsettledBalance: 0
})

// Emits
const emit = defineEmits<{
  close: []
  confirmed: [data: ConfirmData]
}>()

// Types
interface ConfirmData {
  paidAmount: number
  paymentDate: string
  bankAccount?: string
  remarks?: string
}

interface FormErrors {
  paymentDate?: string
  paidAmount?: string
}

// State
const isSubmitting = ref(false)
const isSuccess = ref(false)
const displayAmount = ref('')
const isAmountFocused = ref(false)

const formData = reactive({
  paymentDate: new Date().toISOString().split('T')[0],
  paidAmount: 0,
  bankAccount: '',
  remarks: ''
})

const errors = reactive<FormErrors>({})

// Computed
const today = computed(() => new Date().toISOString().split('T')[0])

const paymentTypeLabel = computed(() => {
  const labels = {
    advance: '선급금',
    progress: '기성금',
    balance: '잔금'
  }
  return labels[props.paymentType] || '자금'
})

// 모달 제목 (탭별로 다르게 표시)
const modalTitle = computed(() => {
  const titles = {
    advance: '선급금 입금확인',
    progress: '기성금 입금확인',
    balance: '잔금 입금확인'
  }
  return titles[props.paymentType] || '입금확인'
})

// 성공 메시지 제목
const successTitle = computed(() => {
  const titles = {
    advance: '선급금 입금확인 완료',
    progress: '기성금 입금확인 완료',
    balance: '잔금 입금확인 완료'
  }
  return titles[props.paymentType] || '입금확인 완료'
})

const headerIconClass = computed(() => {
  const classes = {
    advance: 'ccm-icon-orange',
    progress: 'ccm-icon-blue',
    balance: 'ccm-icon-green'
  }
  return classes[props.paymentType] || 'ccm-icon-blue'
})

const isFormValid = computed(() => {
  return formData.paymentDate && formData.paidAmount > 0
})

// 목표 금액 - 기성금이고 선급금 차감이 있으면 실수금액 사용
const targetAmount = computed(() => {
  // 기성금 수금 시 선급금 차감이 있으면 실수금액(actualReceivableAmount) 사용
  if (props.paymentType === 'progress' && props.advanceDeductionAmount > 0) {
    return props.actualReceivableAmount
  }
  // 그 외에는 승인 금액 또는 신청 금액 사용
  return props.approvedAmount || props.requestAmount
})

// 남은 금액 (미입금액) = 목표 금액 - 입력한 금액
const remainingAmount = computed(() => {
  return targetAmount.value - formData.paidAmount
})

// 수금 확인 후 미정산 선급금 잔액
const newUnsettledBalance = computed(() => {
  return Math.max(0, props.currentUnsettledBalance - props.advanceDeductionAmount)
})

// Icon Components
const AdvanceIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
])

const ProgressIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('polyline', { points: '12 6 12 12 16 14' })
])

const BalanceIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('rect', { x: '2', y: '7', width: '20', height: '14', rx: '2', ry: '2' }),
  h('path', { d: 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' })
])

// Methods
const getPaymentIcon = () => {
  const icons = {
    advance: AdvanceIcon,
    progress: ProgressIcon,
    balance: BalanceIcon
  }
  return icons[props.paymentType] || AdvanceIcon
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

const formatNumberInput = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '')
  return new Intl.NumberFormat('ko-KR').format(Number(numbers))
}

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/[^\d]/g, '')
  formData.paidAmount = Number(value) || 0

  if (isAmountFocused.value) {
    displayAmount.value = value
  } else {
    displayAmount.value = formatNumberInput(value)
  }
}

const handleAmountFocus = () => {
  isAmountFocused.value = true
  if (formData.paidAmount > 0) {
    displayAmount.value = formData.paidAmount.toString()
  }
}

const handleAmountBlur = () => {
  isAmountFocused.value = false
  if (formData.paidAmount > 0) {
    displayAmount.value = formatNumberInput(formData.paidAmount.toString())
  }
}

const setFullAmount = () => {
  formData.paidAmount = targetAmount.value
  displayAmount.value = formatNumberInput(targetAmount.value.toString())
}

const validateForm = (): boolean => {
  errors.paymentDate = undefined
  errors.paidAmount = undefined

  if (!formData.paymentDate) {
    errors.paymentDate = '입금일을 선택해주세요.'
    return false
  }

  if (formData.paidAmount <= 0) {
    errors.paidAmount = '입금 금액을 입력해주세요.'
    return false
  }

  return true
}

const getSuccessMessage = () => {
  return `${formatCurrency(formData.paidAmount)}이 정상적으로 수금 처리되었습니다.`
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    // Emit the confirm event with form data
    const confirmData: ConfirmData = {
      paidAmount: formData.paidAmount,
      paymentDate: formData.paymentDate,
      bankAccount: formData.bankAccount || undefined,
      remarks: formData.remarks || undefined
    }

    emit('confirmed', confirmData)

    // Show success state
    isSuccess.value = true

    // Auto close after success animation
    setTimeout(() => {
      handleClose()
    }, 1800)
  } catch (error) {
    console.error('수금 확인 처리 실패:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  if (isSubmitting.value) return
  resetForm()
  emit('close')
}

const resetForm = () => {
  formData.paymentDate = new Date().toISOString().split('T')[0]
  formData.paidAmount = 0
  formData.bankAccount = ''
  formData.remarks = ''
  displayAmount.value = ''
  isSuccess.value = false
  errors.paymentDate = undefined
  errors.paidAmount = undefined
}

// Watch for modal open to reset form
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()
    formData.paymentDate = today.value
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-modals.css';

/* 선급금 차감 관련 스타일 */
.ccm-amount-divider {
  border-top: 1px dashed #d1d5db;
  margin: 0.75rem 0;
}

.ccm-amount-row.ccm-deduction .ccm-amount-value.ccm-negative {
  color: #dc2626;
  font-weight: 600;
}

.ccm-amount-row.ccm-actual .ccm-amount-value.ccm-highlight {
  color: #1d4ed8;
  font-weight: 700;
  font-size: 1.125rem;
}

/* 정산 현황 섹션 */
.ccm-settlement-info {
  background: #fef3c7;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.ccm-settlement-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.ccm-settlement-header svg {
  width: 14px;
  height: 14px;
}

.ccm-settlement-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.ccm-settlement-label {
  color: #78350f;
}

.ccm-settlement-value {
  font-weight: 600;
  color: #1f2937;
}

.ccm-settlement-value .ccm-arrow {
  color: #9ca3af;
  margin: 0 0.5rem;
}

.ccm-settlement-value.ccm-complete {
  color: #16a34a;
}

.ccm-complete-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.375rem;
  background: #dcfce7;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #16a34a;
}
</style>
