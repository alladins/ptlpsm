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
            <!-- OEM 제조사 선택 (헤더에 배치, 등록 모드에서만) -->
            <div v-if="!isCompleteMode && oemCompanies.length > 0" class="oem-company-header-select">
              <select
                v-model="formData.oemCompanyId"
                class="oem-company-select-compact"
                :disabled="isSubmitting"
                @change="handleOemCompanyChange"
              >
                <option :value="null">OEM 제조사 선택</option>
                <option
                  v-for="company in oemCompanies"
                  :key="company.companyId"
                  :value="company.companyId"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </div>
            <!-- OEM 제조사가 없는 경우 헤더에 경고 표시 -->
            <div v-else-if="!isCompleteMode && oemCompanies.length === 0" class="oem-company-header-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>OEM 없음</span>
            </div>
            <button class="ccm-close-button" @click="handleClose" :disabled="isSubmitting">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="ccm-modal-body">
            <!-- 선급금 모드: 선급금이 있고 OEM 선급금 미지급 상태면 표시 -->
            <div v-if="!isCompleteMode && hasAdvancePayment && !linkedPayment && advanceOemNotFullyPaid" class="ccm-form-group">
              <label class="ccm-form-label">
                <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                OEM 선급금 지급
              </label>
              <div class="advance-oem-info-table">
                <div class="advance-oem-row">
                  <span class="advance-oem-label">OEM 예정 총액</span>
                  <span class="advance-oem-value">{{ formatCurrency(Math.floor(oemExpectedTotal || 0)) }}</span>
                </div>
                <div class="advance-oem-row">
                  <span class="advance-oem-label">선급금 비율</span>
                  <span class="advance-oem-value">{{ advancePaymentRate }}%</span>
                </div>
                <div class="advance-oem-row highlight">
                  <span class="advance-oem-label">OEM 선급금 지급 예정액</span>
                  <span class="advance-oem-value">{{ formatCurrency(Math.floor((oemExpectedTotal || 0) * (advancePaymentRate || 0) / 100)) }}</span>
                </div>
                <div class="advance-oem-row">
                  <span class="advance-oem-label">기존 지급 총액</span>
                  <span class="advance-oem-value">{{ formatCurrency(Math.floor(oemTotalPaid || 0)) }}</span>
                </div>
                <div class="advance-oem-row">
                  <span class="advance-oem-label">잔여 지급 한도</span>
                  <span class="advance-oem-value success">{{ formatCurrency(Math.floor(remainingOemLimit)) }}</span>
                </div>
              </div>
              <!-- 지급예정 버튼 (버튼과 금액 분리) -->
              <div class="oem-percent-buttons">
                <span class="oem-percent-label">지급 예정</span>
                <div class="advance-payment-row">
                  <button
                    type="button"
                    class="advance-payment-btn"
                    @click="applyRemainingAmount"
                    :disabled="isSubmitting || displayRemainingAmount <= 0"
                  >
                    지급예정
                  </button>
                  <span class="advance-payment-amount">{{ formatCurrency(displayRemainingAmount) }}</span>
                </div>
              </div>
            </div>

            <!-- 기본 모드: 선급금도 기성금도 없는 경우 OEM 예정 총액 기준으로 비율 선택 -->
            <div v-if="!isCompleteMode && !linkedPayment && !hasAdvancePayment && progressPayments.length === 0 && oemExpectedTotal > 0" class="ccm-form-group">
              <label class="ccm-form-label">
                <svg class="ccm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                OEM 지급
              </label>
              <div class="advance-oem-info-table">
                <div class="advance-oem-row">
                  <span class="advance-oem-label">OEM 예정 총액</span>
                  <span class="advance-oem-value">{{ formatCurrency(Math.floor(oemExpectedTotal || 0)) }}</span>
                </div>
                <div class="advance-oem-row">
                  <span class="advance-oem-label">기존 지급 총액</span>
                  <span class="advance-oem-value">{{ formatCurrency(Math.floor(oemTotalPaid || 0)) }}</span>
                </div>
                <div class="advance-oem-row highlight">
                  <span class="advance-oem-label">잔여 지급 한도</span>
                  <span class="advance-oem-value success">{{ formatCurrency(Math.floor(remainingOemLimit)) }}</span>
                </div>
              </div>
              <!-- 비율 선택 버튼 -->
              <div class="oem-percent-buttons">
                <span class="oem-percent-label">비율 선택</span>
                <div class="oem-percent-group">
                  <button type="button" class="oem-percent-btn" @click="setPercentAmountFromTotal(30)" :disabled="isSubmitting">
                    <span class="oem-percent-value">30%</span>
                    <span class="oem-percent-amount">{{ formatCurrencyShort((oemExpectedTotal || 0) * 0.3) }}</span>
                  </button>
                  <button type="button" class="oem-percent-btn" @click="setPercentAmountFromTotal(61)" :disabled="isSubmitting">
                    <span class="oem-percent-value">61%</span>
                    <span class="oem-percent-amount">{{ formatCurrencyShort((oemExpectedTotal || 0) * 0.61) }}</span>
                  </button>
                  <button type="button" class="oem-percent-btn" @click="setPercentAmountFromTotal(64)" :disabled="isSubmitting">
                    <span class="oem-percent-value">64%</span>
                    <span class="oem-percent-amount">{{ formatCurrencyShort((oemExpectedTotal || 0) * 0.64) }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 기성금 다중 선택 (등록 모드에서만, linkedPayment가 없고 기성금/잔금이 있을 때) -->
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
                    <span class="oem-payment-seq">{{ getPaymentLabel(payment) }}</span>
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
                <span>{{ linkedPayment.paymentType === 'BALANCE' ? '연결된 잔금' : '연결된 기성금' }}</span>
              </div>
              <div class="ccm-card-content">
                <div class="ccm-info-item">
                  <span class="ccm-label">{{ getPaymentLabel(linkedPayment) }}</span>
                  <span class="ccm-value">{{ formatCurrency(linkedPayment.requestAmount || linkedPayment.amount) }}</span>
                </div>
                <div class="ccm-info-item">
                  <span class="ccm-label">OEM 지급 예정</span>
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

              <!-- OEM 제조사 선택은 헤더로 이동됨 -->

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

// OEM 제조사 타입
interface OemCompany {
  companyId: number
  companyName: string
}

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
  /** 선급금 유무 */
  hasAdvancePayment?: boolean
  /** OEM 예정 총액 (원가 합계) */
  oemExpectedTotal?: number
  /** 선급금 비율 (%) */
  advancePaymentRate?: number
  /** 기존 OEM 지급 총액 */
  oemTotalPaid?: number
  /** OEM 제조사 목록 (출하 기준) */
  oemCompanies?: OemCompany[]
}

const props = withDefaults(defineProps<Props>(), {
  existingPayment: null,
  linkedPayment: null,
  oemPaymentRate: 70,
  progressPayments: () => [],
  hasAdvancePayment: false,
  oemExpectedTotal: 0,
  advancePaymentRate: 0,
  oemTotalPaid: 0,
  oemCompanies: () => []
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
  oemCompanyId?: number
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
const displayRemainingAmount = ref(0)  // 지급예정 버튼 옆 표시 금액 (클릭 시 0으로 변경)

const formData = reactive({
  paymentDate: new Date().toISOString().split('T')[0],
  amount: 0,
  oemCompanyId: null as number | null,
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

// OEM 제조사 목록 (props에서 가져옴)
const oemCompanies = computed(() => props.oemCompanies || [])

const isFormValid = computed(() => {
  // 기본 검증: 날짜와 금액
  if (!formData.paymentDate || formData.amount <= 0) return false
  // OEM 제조사가 있으면 반드시 선택해야 함
  if (!isCompleteMode.value && oemCompanies.value.length > 0 && !formData.oemCompanyId) return false
  return true
})

// OEM 선급금 지급 예정액 (OEM예정총액 × 선급금비율)
const advanceOemPaymentAmount = computed(() => {
  return Math.floor((props.oemExpectedTotal || 0) * (props.advancePaymentRate || 0) / 100)
})

// OEM 선급금 미완납 여부 (선급금 지급 예정액보다 적게 지급된 경우)
const advanceOemNotFullyPaid = computed(() => {
  if (!props.hasAdvancePayment) return false
  return (props.oemTotalPaid || 0) < advanceOemPaymentAmount.value
})

// OEM 지급 잔여 한도 (선급금 모드: 선급금 지급 예정액 - 기존 지급총액)
const remainingOemLimit = computed(() => {
  if (props.hasAdvancePayment) {
    // 선급금 모드: 선급금 지급 예정액이 상한
    return Math.max(0, Math.floor(advanceOemPaymentAmount.value - (props.oemTotalPaid || 0)))
  }
  // 일반 모드: 전체 OEM 예정총액이 상한
  return Math.max(0, Math.floor((props.oemExpectedTotal || 0) - (props.oemTotalPaid || 0)))
})

// Methods
const formatCurrency = (value: number | undefined): string => {
  if (!value) return '0원'
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

// 결제 유형별 라벨 (잔금 vs 기성금 구분)
const getPaymentLabel = (payment: ProgressPaymentRequest): string => {
  if (payment.paymentType === 'BALANCE') {
    return '잔금'
  }
  return `${payment.paymentSeq}차 기성금`
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

// 비율에 따른 금액 설정 (10%, 30%, 61%, 64%) - 기성금 선택 기준
const setPercentAmount = (percent: number) => {
  if (baseAmountForPercent.value <= 0) return
  const calculatedAmount = Math.floor((baseAmountForPercent.value * percent) / 100)
  formData.amount = calculatedAmount
  displayAmount.value = formatNumberInput(calculatedAmount.toString())
}

// OEM 예정 총액 기준 비율 계산 (기본 모드용)
const setPercentAmountFromTotal = (percent: number) => {
  if ((props.oemExpectedTotal || 0) <= 0) return
  const calculatedAmount = Math.floor((props.oemExpectedTotal || 0) * percent / 100)
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

// OEM 제조사 선택 시 회사명도 함께 저장
const handleOemCompanyChange = () => {
  if (formData.oemCompanyId) {
    const selected = oemCompanies.value.find(c => c.companyId === formData.oemCompanyId)
    formData.oemCompanyName = selected?.companyName || ''
  } else {
    formData.oemCompanyName = ''
  }
}

// 선급금 모드: 지급예정 버튼 클릭 시 잔여 한도 금액 입력 및 표시 금액 0으로 변경
const applyRemainingAmount = () => {
  const amount = Math.floor(remainingOemLimit.value)
  formData.amount = amount
  displayAmount.value = formatNumberInput(amount.toString())
  // 버튼 옆 표시 금액을 0으로 변경
  displayRemainingAmount.value = 0
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

  // 금액 초과 검증 (OEM예정총액 기준)
  if (props.oemExpectedTotal && props.oemExpectedTotal > 0) {
    const newTotal = (props.oemTotalPaid || 0) + formData.amount
    if (newTotal > props.oemExpectedTotal) {
      alert(`OEM 지급 총액(${formatCurrency(newTotal)})이 OEM 예정 총액(${formatCurrency(props.oemExpectedTotal)})을 초과합니다.\n금액을 조정해주세요.`)
      return false
    }
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
      oemCompanyId: formData.oemCompanyId || undefined,
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
  formData.oemCompanyId = null
  formData.oemCompanyName = ''
  formData.bankAccount = ''
  formData.remarks = ''
  displayAmount.value = ''
  isSuccess.value = false
  errors.amount = undefined
  errors.paymentDate = undefined
  selectedPaymentIds.value = []
  // 선급금 모드용 표시 금액 초기화 (선급금 예정액 기준)
  if (props.hasAdvancePayment) {
    const advanceAmount = Math.floor((props.oemExpectedTotal || 0) * (props.advancePaymentRate || 0) / 100)
    displayRemainingAmount.value = Math.max(0, advanceAmount - (props.oemTotalPaid || 0))
  } else {
    displayRemainingAmount.value = Math.floor((props.oemExpectedTotal || 0) - (props.oemTotalPaid || 0))
  }
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

    // OEM 제조사가 1개뿐이면 자동 선택
    if (!props.existingPayment && oemCompanies.value.length === 1) {
      formData.oemCompanyId = oemCompanies.value[0].companyId
      formData.oemCompanyName = oemCompanies.value[0].companyName
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

/* ===== 선급금 모드 OEM 지급 정보 (테이블 형태) ===== */
.advance-oem-info-table {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #fde047;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.advance-oem-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 1rem;
  border-bottom: 1px dashed #fde047;
}

.advance-oem-row:last-child {
  border-bottom: none;
}

.advance-oem-row.highlight {
  background: rgba(234, 179, 8, 0.15);
}

.advance-oem-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #78716c;
}

.advance-oem-row.highlight .advance-oem-label {
  font-weight: 600;
  color: #a16207;
}

.advance-oem-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.advance-oem-row.highlight .advance-oem-value {
  font-size: 1rem;
  font-weight: 700;
  color: #b45309;
}

.advance-oem-value.success {
  color: #16a34a;
}

/* ===== 선급금 모드 지급예정 버튼 행 (버튼 + 금액 분리) ===== */
.advance-payment-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 2px solid #fdba74;
  border-radius: 8px;
}

.advance-payment-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.advance-payment-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
  transform: translateY(-1px);
}

.advance-payment-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.advance-payment-amount {
  flex: 1;
  text-align: right;
  font-size: 1.125rem;
  font-weight: 700;
  color: #ea580c;
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

/* ===== Select 스타일 ===== */
.ccm-form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem 1.25rem;
  padding-right: 2.5rem;
  cursor: pointer;
}

.ccm-form-select:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}

/* ===== 경고 박스 ===== */
.ccm-warning-box {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.ccm-warning-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #d97706;
}

/* ===== 헤더 OEM 제조사 선택 (컴팩트) ===== */
.oem-company-header-select {
  margin-left: auto;
  margin-right: 0.75rem;
}

.oem-company-select-compact {
  appearance: none;
  min-width: 140px;
  max-width: 180px;
  padding: 0.375rem 2rem 0.375rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  background: #ffffff;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1rem 1rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oem-company-select-compact:hover:not(:disabled) {
  border-color: #fdba74;
  background-color: #fffbf7;
}

.oem-company-select-compact:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.15);
}

.oem-company-select-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 헤더 OEM 없음 경고 */
.oem-company-header-warning {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-left: auto;
  margin-right: 0.75rem;
  padding: 0.375rem 0.625rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #92400e;
}

.oem-company-header-warning svg {
  width: 14px;
  height: 14px;
  color: #d97706;
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
