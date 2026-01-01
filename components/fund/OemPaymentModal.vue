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
            <!-- 기성금 연결 정보 (등록 모드에서만) -->
            <div v-if="!isCompleteMode && linkedPayment" class="ccm-linked-card">
              <div class="ccm-card-header">
                <i class="fas fa-link"></i>
                <span>연결된 기성금</span>
              </div>
              <div class="ccm-card-content">
                <div class="ccm-info-item">
                  <span class="ccm-label">{{ linkedPayment.paymentSeq }}차 기성금</span>
                  <span class="ccm-value">{{ formatCurrency(linkedPayment.requestAmount) }}</span>
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
                <div v-if="!isCompleteMode && suggestedOemAmount > 0" class="ccm-amount-actions">
                  <button
                    type="button"
                    class="ccm-amount-preset-btn ccm-orange"
                    @click="setSuggestedAmount"
                    :disabled="isSubmitting"
                  >
                    70% 자동 입력
                  </button>
                </div>
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
}

const props = withDefaults(defineProps<Props>(), {
  existingPayment: null,
  linkedPayment: null,
  oemPaymentRate: 70
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

const suggestedOemAmount = computed(() => {
  if (!props.linkedPayment) return 0
  const baseAmount = props.linkedPayment.requestAmount || props.linkedPayment.amount || 0
  return Math.floor((baseAmount * props.oemPaymentRate) / 100)
})

const isFormValid = computed(() => {
  return formData.paymentDate && formData.amount > 0
})

// Methods
const formatCurrency = (value: number | undefined): string => {
  if (!value) return '0원'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
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

const setScheduledAmount = () => {
  if (props.existingPayment) {
    formData.amount = props.existingPayment.scheduledAmount
    displayAmount.value = formatNumberInput(props.existingPayment.scheduledAmount.toString())
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

/* 컴포넌트 전용 스타일은 필요 없음 - 모두 공통 CSS로 처리됨 */
</style>
