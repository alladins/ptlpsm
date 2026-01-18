<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container" :class="{ 'success-state': isSuccess }">
          <!-- Success Animation Overlay -->
          <Transition name="success-fade">
            <div v-if="isSuccess" class="ccm-success-overlay ccm-orange">
              <div class="ccm-success-content">
                <div class="ccm-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="ccm-success-title">{{ isCompleteMode ? '지급 완료' : '지급 등록 완료' }}</h3>
                <p class="ccm-success-message">{{ getSuccessMessage() }}</p>
              </div>
            </div>
          </Transition>

          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">{{ isCompleteMode ? 'OEM 지급 완료' : 'OEM 지급 등록' }}</h2>
                <span class="ccm-modal-subtitle">{{ isCompleteMode ? '지급 완료 처리' : '새로운 지급 예정 등록' }}</span>
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
            <!-- 기성금 다중 선택 (등록 모드에서만, linkedPayment가 없을 때) -->
            <div v-if="!isCompleteMode && !linkedPayment && progressPayments.length > 0" class="ccm-form-group">
              <label class="ccm-form-label">
                <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                기준 기성금 선택
                <span class="ccm-optional-tag">복수 선택</span>
              </label>
              <div class="oem-payment-selector">
                <div
                  v-for="payment in progressPayments"
                  :key="payment.requestId || payment.paymentId"
                  class="oem-payment-card"
                  :class="{ 'selected': selectedPaymentIds.includes(payment.requestId || payment.paymentId || 0) }"
                  @click="togglePaymentSelection(payment.requestId || payment.paymentId || 0)"
                >
                  <div class="oem-payment-checkbox">
                    <input
                      type="checkbox"
                      :checked="selectedPaymentIds.includes(payment.requestId || payment.paymentId || 0)"
                      :disabled="isSubmitting"
                      @click.stop
                      @change="togglePaymentSelection(payment.requestId || payment.paymentId || 0)"
                    />
                  </div>
                  <div class="oem-payment-info">
                    <span class="oem-payment-seq">{{ payment.paymentSeq }}차 기성금</span>
                    <span class="oem-payment-amount">{{ formatCurrency(payment.requestAmount || payment.amount) }}</span>
                  </div>
                </div>
              </div>
              <!-- 선택 합계 표시 -->
              <Transition name="fade-slide">
                <div v-if="baseAmountForPercent > 0" class="oem-selected-summary">
                  <div class="oem-summary-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <div class="oem-summary-content">
                    <span class="oem-summary-label">선택 합계 ({{ selectedPaymentIds.length }}건)</span>
                    <span class="oem-summary-value">{{ formatCurrency(baseAmountForPercent) }}</span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- linkedPayment로 전달된 경우 정보 표시 -->
            <div v-if="!isCompleteMode && linkedPayment" class="ccm-linked-card">
              <div class="ccm-card-header">
                <i class="fas fa-link"></i>
                <span>연결된 기성금</span>
              </div>
              <div class="ccm-card-content">
                <div class="ccm-info-item">
                  <span class="ccm-label">{{ linkedPayment.paymentSeq }}차 기성금</span>
                  <span class="ccm-value">{{ formatCurrency(linkedPayment.requestAmount || linkedPayment.amount) }}</span>
                </div>
                <div class="ccm-info-item">
                  <span class="ccm-label">OEM 지급 예정 (70%)</span>
                  <span class="ccm-value ccm-highlight">{{ formatCurrency(suggestedOemAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- 지급 완료 모드: 기존 정보 표시 -->
            <div v-if="isCompleteMode && existingPayment" class="ccm-linked-card">
              <div class="ccm-card-header">
                <i class="fas fa-info-circle"></i>
                <span>지급 예정 정보</span>
              </div>
              <div class="ccm-card-content">
                <div class="ccm-info-item">
                  <span class="ccm-label">{{ existingPayment.paymentSeq }}차 지급</span>
                  <span class="ccm-value">{{ formatCurrency(existingPayment.scheduledAmount) }}</span>
                </div>
                <div class="ccm-info-item">
                  <span class="ccm-label">예정일</span>
                  <span class="ccm-value">{{ existingPayment.scheduledDate }}</span>
                </div>
                <div v-if="existingPayment.oemCompanyName" class="ccm-info-item">
                  <span class="ccm-label">OEM 업체</span>
                  <span class="ccm-value">{{ existingPayment.oemCompanyName }}</span>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <form @submit.prevent="handleSubmit" class="ccm-form">
              <!-- 지급 금액 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <span class="ccm-label-icon ccm-currency-icon ccm-orange">₩</span>
                  {{ isCompleteMode ? '실제 지급 금액' : '지급 예정 금액' }}
                </label>
                <div class="ccm-input-wrapper ccm-amount-wrapper">
                  <input
                    type="text"
                    v-model="displayAmount"
                    @input="handleAmountInput"
                    @focus="handleAmountFocus"
                    @blur="handleAmountBlur"
                    class="ccm-form-input ccm-amount-input ccm-focus-orange"
                    placeholder="0"
                    required
                    :disabled="isSubmitting"
                  />
                  <span class="ccm-input-suffix">원</span>
                </div>
                <Transition name="fade-slide">
                  <div v-if="!isCompleteMode && baseAmountForPercent > 0" class="oem-percent-buttons">
                    <span class="oem-percent-label">비율 선택</span>
                    <div class="oem-percent-group">
                      <button
                        type="button"
                        class="oem-percent-btn"
                        @click="setPercentAmount(10)"
                        :disabled="isSubmitting"
                      >
                        <span class="oem-percent-value">10%</span>
                        <span class="oem-percent-amount">{{ formatCurrencyShort(baseAmountForPercent * 0.1) }}</span>
                      </button>
                      <button
                        type="button"
                        class="oem-percent-btn"
                        @click="setPercentAmount(30)"
                        :disabled="isSubmitting"
                      >
                        <span class="oem-percent-value">30%</span>
                        <span class="oem-percent-amount">{{ formatCurrencyShort(baseAmountForPercent * 0.3) }}</span>
                      </button>
                      <button
                        type="button"
                        class="oem-percent-btn"
                        @click="setPercentAmount(61)"
                        :disabled="isSubmitting"
                      >
                        <span class="oem-percent-value">61%</span>
                        <span class="oem-percent-amount">{{ formatCurrencyShort(baseAmountForPercent * 0.61) }}</span>
                      </button>
                      <button
                        type="button"
                        class="oem-percent-btn"
                        @click="setPercentAmount(64)"
                        :disabled="isSubmitting"
                      >
                        <span class="oem-percent-value">64%</span>
                        <span class="oem-percent-amount">{{ formatCurrencyShort(baseAmountForPercent * 0.64) }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
                <div v-if="isCompleteMode && existingPayment" class="ccm-amount-actions">
                  <button
                    type="button"
                    class="ccm-amount-preset-btn ccm-orange"
                    @click="setScheduledAmount"
                    :disabled="isSubmitting"
                  >
                    예정 금액 입력
                  </button>
                </div>
                <span v-if="errors.amount" class="ccm-error-message">{{ errors.amount }}</span>
              </div>

              <!-- 지급일 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label required">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {{ isCompleteMode ? '실제 지급일' : '지급 예정일' }}
                </label>
                <div class="ccm-input-wrapper">
                  <input
                    type="date"
                    v-model="formData.paymentDate"
                    class="ccm-form-input ccm-date-input ccm-focus-orange"
                    required
                    :disabled="isSubmitting"
                  />
                </div>
                <span v-if="errors.paymentDate" class="ccm-error-message">{{ errors.paymentDate }}</span>
              </div>

              <!-- OEM 업체명 (등록 모드에서만) -->
              <div v-if="!isCompleteMode" class="ccm-form-group">
                <label class="ccm-form-label">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/>
                    <path d="M3 21h18"/>
                    <path d="M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1"/>
                  </svg>
                  OEM 업체명
                  <span class="ccm-optional-tag">선택</span>
                </label>
                <div class="ccm-input-wrapper">
                  <input
                    type="text"
                    v-model="formData.oemCompanyName"
                    class="ccm-form-input ccm-focus-orange"
                    placeholder="예: ABC 제조"
                    :disabled="isSubmitting"
                  />
                </div>
              </div>

              <!-- 계좌정보 -->
              <div class="ccm-form-group">
                <label class="ccm-form-label">
                  <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  지급 계좌
                  <span class="ccm-optional-tag">선택</span>
                </label>
                <div class="ccm-input-wrapper">
                  <input
                    type="text"
                    v-model="formData.bankAccount"
                    class="ccm-form-input ccm-focus-orange"
                    placeholder="예: 기업은행 123-456-789012"
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
                    class="ccm-form-input ccm-textarea ccm-focus-orange"
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
              class="ccm-btn-confirm ccm-orange"
              @click="handleSubmit"
              :disabled="isSubmitting || !isFormValid"
            >
              <span v-if="isSubmitting" class="ccm-loading-spinner"></span>
              <span v-else>{{ isCompleteMode ? '지급 완료' : '등록하기' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { OemPayment, ProgressPaymentRequest } from '~/types/fund'

// Props
interface Props {
  isOpen: boolean
  fundId: number
  /** 지급 완료 모드에서 사용 (기존 OEM 지급 정보) */
  existingPayment?: OemPayment | null
  /** 기성금 연결 시 사용 (등록 모드) */
  linkedPayment?: ProgressPaymentRequest | null
  /** OEM 지급률 (기본 70%) */
  oemPaymentRate?: number
  /** 수금 완료된 기성금 목록 (OEM 지급 대상) */
  progressPayments?: ProgressPaymentRequest[]
}

const props = withDefaults(defineProps<Props>(), {
  existingPayment: null,
  linkedPayment: null,
  oemPaymentRate: 70,
  progressPayments: () => []
})

// Emits
const emit = defineEmits<{
  close: []
  submitted: [data: SubmitData]
}>()

// Types
interface SubmitData {
  amount: number
  paymentDate: string
  oemCompanyName?: string
  bankAccount?: string
  remarks?: string
  isComplete: boolean
}

interface FormErrors {
  amount?: string
  paymentDate?: string
}

// State
const isSubmitting = ref(false)
const isSuccess = ref(false)
const displayAmount = ref('')
const isAmountFocused = ref(false)
const selectedPaymentIds = ref<number[]>([])

const formData = reactive({
  paymentDate: new Date().toISOString().split('T')[0],
  amount: 0,
  oemCompanyName: '',
  bankAccount: '',
  remarks: ''
})

const errors = reactive<FormErrors>({})

// Computed
const isCompleteMode = computed(() => !!props.existingPayment)

// 선택된 기성금들 (다중 선택)
const selectedProgressPayments = computed(() => {
  if (props.linkedPayment) return [props.linkedPayment]
  return props.progressPayments?.filter(p =>
    selectedPaymentIds.value.includes(p.requestId || p.paymentId || 0)
  ) || []
})

// 비율 계산 기준 금액 (선택된 기성금들의 합계)
const baseAmountForPercent = computed(() => {
  return selectedProgressPayments.value.reduce(
    (sum, p) => sum + (p.requestAmount || p.amount || 0), 0
  )
})

const suggestedOemAmount = computed(() => {
  if (baseAmountForPercent.value <= 0) return 0
  return Math.floor((baseAmountForPercent.value * props.oemPaymentRate) / 100)
})

const isFormValid = computed(() => {
  return formData.paymentDate && formData.amount > 0
})

// Methods
const formatCurrency = (value: number | undefined): string => {
  if (!value) return '0원'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

// 축약형 금액 포맷 (비율 버튼용)
const formatCurrencyShort = (value: number | undefined): string => {
  if (!value) return '0'
  const rounded = Math.floor(value)
  if (rounded >= 100000000) {
    return (rounded / 100000000).toFixed(1).replace(/\.0$/, '') + '억'
  }
  if (rounded >= 10000) {
    return (rounded / 10000).toFixed(0) + '만'
  }
  return new Intl.NumberFormat('ko-KR').format(rounded)
}

const formatNumberInput = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '')
  return new Intl.NumberFormat('ko-KR').format(Number(numbers))
}

const handleAmountInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/[^\d]/g, '')
  formData.amount = Number(value) || 0

  if (isAmountFocused.value) {
    displayAmount.value = value
  } else {
    displayAmount.value = formatNumberInput(value)
  }
}

const handleAmountFocus = () => {
  isAmountFocused.value = true
  if (formData.amount > 0) {
    displayAmount.value = formData.amount.toString()
  }
}

const handleAmountBlur = () => {
  isAmountFocused.value = false
  if (formData.amount > 0) {
    displayAmount.value = formatNumberInput(formData.amount.toString())
  }
}

const setSuggestedAmount = () => {
  formData.amount = suggestedOemAmount.value
  displayAmount.value = formatNumberInput(suggestedOemAmount.value.toString())
}

// 비율에 따른 금액 설정 (10%, 30%, 61%, 64%)
const setPercentAmount = (percent: number) => {
  if (baseAmountForPercent.value <= 0) return
  const calculatedAmount = Math.floor((baseAmountForPercent.value * percent) / 100)
  formData.amount = calculatedAmount
  displayAmount.value = formatNumberInput(calculatedAmount.toString())
}

const setScheduledAmount = () => {
  if (props.existingPayment) {
    formData.amount = props.existingPayment.scheduledAmount
    displayAmount.value = formatNumberInput(props.existingPayment.scheduledAmount.toString())
  }
}

// 기성금 선택 토글
const togglePaymentSelection = (paymentId: number) => {
  if (isSubmitting.value) return
  const index = selectedPaymentIds.value.indexOf(paymentId)
  if (index > -1) {
    selectedPaymentIds.value.splice(index, 1)
  } else {
    selectedPaymentIds.value.push(paymentId)
  }
}

const validateForm = (): boolean => {
  errors.amount = undefined
  errors.paymentDate = undefined

  if (!formData.paymentDate) {
    errors.paymentDate = '지급일을 선택해주세요.'
    return false
  }

  if (formData.amount <= 0) {
    errors.amount = '지급 금액을 입력해주세요.'
    return false
  }

  return true
}

const getSuccessMessage = () => {
  if (isCompleteMode.value) {
    return `${formatCurrency(formData.amount)} 지급이 완료 처리되었습니다.`
  }
  return `${formatCurrency(formData.amount)} 지급이 등록되었습니다.`
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true

  try {
    const submitData: SubmitData = {
      amount: formData.amount,
      paymentDate: formData.paymentDate,
      oemCompanyName: formData.oemCompanyName || undefined,
      bankAccount: formData.bankAccount || undefined,
      remarks: formData.remarks || undefined,
      isComplete: isCompleteMode.value
    }

    emit('submitted', submitData)

    // Show success state
    isSuccess.value = true

    // Auto close after success animation
    setTimeout(() => {
      handleClose()
    }, 1800)
  } catch (error) {
    console.error('OEM 지급 처리 실패:', error)
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
  formData.amount = 0
  formData.oemCompanyName = ''
  formData.bankAccount = ''
  formData.remarks = ''
  displayAmount.value = ''
  isSuccess.value = false
  errors.amount = undefined
  errors.paymentDate = undefined
  selectedPaymentIds.value = []
}

// Watch for modal open to reset/initialize form
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm()

    // 지급 완료 모드: 기존 정보로 초기화
    if (props.existingPayment) {
      formData.amount = props.existingPayment.scheduledAmount
      displayAmount.value = formatNumberInput(props.existingPayment.scheduledAmount.toString())
      formData.bankAccount = props.existingPayment.bankAccount || ''
    }

    // 등록 모드: 연결된 기성금으로 자동 계산
    if (props.linkedPayment && !props.existingPayment) {
      formData.amount = suggestedOemAmount.value
      displayAmount.value = formatNumberInput(suggestedOemAmount.value.toString())
    }
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-modals.css';

/* 모달 바디 스크롤 */
.ccm-modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

/* ===== 기성금 선택 카드 ===== */
.oem-payment-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  padding: 0.25rem;
}

.oem-payment-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oem-payment-card:hover {
  border-color: #fdba74;
  background: #fffbf7;
}

.oem-payment-card.selected {
  border-color: #f97316;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.15);
}

.oem-payment-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
}

.oem-payment-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #f97316;
  border-radius: 4px;
}

.oem-payment-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.oem-payment-seq {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.oem-payment-card.selected .oem-payment-seq {
  color: #c2410c;
}

.oem-payment-amount {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.oem-payment-card.selected .oem-payment-amount {
  color: #ea580c;
}

/* ===== 선택 합계 요약 ===== */
.oem-selected-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.oem-summary-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.oem-summary-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

.oem-summary-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.oem-summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.oem-summary-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #ffffff;
}

/* ===== 비율 버튼 그룹 ===== */
.oem-percent-buttons {
  margin-top: 0.75rem;
  padding: 0.875rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.oem-percent-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.625rem;
}

.oem-percent-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.oem-percent-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.5rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oem-percent-btn:hover:not(:disabled) {
  border-color: #f97316;
  background: #fff7ed;
  transform: translateY(-1px);
}

.oem-percent-btn:active:not(:disabled) {
  transform: translateY(0);
}

.oem-percent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.oem-percent-value {
  font-size: 1rem;
  font-weight: 700;
  color: #f97316;
}

.oem-percent-amount {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  margin-top: 0.125rem;
}

/* ===== 트랜지션 ===== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
