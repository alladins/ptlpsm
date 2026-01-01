<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>잔금 신청</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <span>데이터를 불러오는 중...</span>
        </div>

        <template v-else>
          <!-- 기존 잔금 신청이 있는 경우 -->
          <div v-if="balanceInfo?.request" class="existing-request-box">
            <i class="fas fa-info-circle"></i>
            <div class="existing-content">
              <strong>이미 잔금 신청이 진행 중입니다</strong>
              <p>
                신청일: {{ formatDate(balanceInfo.request.requestDate) }} |
                신청금액: {{ formatCurrency(balanceInfo.request.requestAmount) }} |
                상태: {{ getBalanceStatusLabel(balanceInfo.request.status) }}
              </p>
            </div>
          </div>

          <!-- 계산 기준 선택 -->
          <div class="calculation-basis-section">
            <h4>계산 기준 선택</h4>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="calculationBasis"
                  value="REQUESTED"
                  name="basis"
                />
                <span class="radio-text">
                  <strong>신청 기준</strong>
                  <small>선급금 및 기성금 신청 금액 기준으로 계산</small>
                </span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="calculationBasis"
                  value="PAID"
                  name="basis"
                />
                <span class="radio-text">
                  <strong>입금 기준</strong>
                  <small>실제 입금된 금액 기준으로 계산</small>
                </span>
              </label>
            </div>
          </div>

          <!-- 잔금 계산 내역 -->
          <div class="calculation-section">
            <h4>잔금 계산 내역</h4>

            <div class="calculation-table">
              <div class="calc-row header">
                <span class="calc-label">항목</span>
                <span class="calc-value">금액</span>
              </div>

              <div class="calc-row">
                <span class="calc-label">총 계약금액</span>
                <span class="calc-value">{{ formatCurrency(balanceInfo?.totalContractAmount || 0) }}</span>
              </div>

              <div class="calc-row minus">
                <span class="calc-label">
                  (-) 선급금
                  <small v-if="calculationBasis === 'REQUESTED'">(신청기준)</small>
                  <small v-else>(입금기준)</small>
                </span>
                <span class="calc-value">
                  {{ formatCurrency(currentAdvanceAmount) }}
                </span>
              </div>

              <div class="calc-row minus">
                <span class="calc-label">
                  (-) 기성금 누계
                  <small v-if="calculationBasis === 'REQUESTED'">(신청기준)</small>
                  <small v-else>(입금기준)</small>
                </span>
                <span class="calc-value">
                  {{ formatCurrency(currentProgressAmount) }}
                </span>
              </div>

              <div class="calc-row total">
                <span class="calc-label">(=) 잔금</span>
                <span class="calc-value primary">{{ formatCurrency(calculatedBalance) }}</span>
              </div>
            </div>
          </div>

          <!-- 신청 폼 -->
          <div class="form-section">
            <h4>잔금 신청 정보</h4>

            <div class="form-grid">
              <div class="form-field">
                <label class="required">신청 금액</label>
                <div class="input-with-unit">
                  <input
                    type="text"
                    v-model="formattedRequestAmount"
                    @input="onAmountInput"
                    class="form-input"
                    placeholder="신청 금액 입력"
                  />
                  <span class="unit">원</span>
                </div>
                <div class="field-hint">
                  <button
                    type="button"
                    class="btn-set-amount"
                    @click="setCalculatedAmount"
                  >
                    계산된 잔금 적용
                  </button>
                </div>
              </div>

              <div class="form-field">
                <label class="required">신청일</label>
                <input
                  type="date"
                  v-model="form.requestDate"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-field">
              <label>비고</label>
              <textarea
                v-model="form.remarks"
                class="form-textarea"
                placeholder="비고 입력 (선택)"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- 경고 메시지 -->
          <div v-if="amountMismatchWarning" class="warning-box">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="warning-content">
              <strong>신청 금액과 계산된 잔금이 다릅니다</strong>
              <p>계산된 잔금: {{ formatCurrency(calculatedBalance) }}, 입력한 금액: {{ formatCurrency(form.requestAmount) }}</p>
            </div>
          </div>

          <!-- 유효성 검사 메시지 -->
          <div v-if="validationError" class="validation-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ validationError }}</span>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          @click="submitBalanceRequest"
          :disabled="!isValid || isSubmitting || !!balanceInfo?.request"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          잔금 신청
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { formatCurrency, formatNumber, formatDate } from '~/utils/format'
import { fundService } from '~/services/fund.service'
import type { BalanceInfo, BalanceCalculationBasis, BalanceStatus } from '~/types/fund'

// Props
interface Props {
  isOpen: boolean
  fundId: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const validationError = ref<string | null>(null)

// 잔금 정보
const balanceInfo = ref<BalanceInfo | null>(null)

// 계산 기준 (신청/입금)
const calculationBasis = ref<BalanceCalculationBasis>('REQUESTED')

// 폼 데이터
const form = reactive({
  requestAmount: 0,
  requestDate: new Date().toISOString().split('T')[0],
  remarks: ''
})

// 금액 입력 포맷팅
const formattedRequestAmount = ref('')

// 현재 선급금 (기준에 따라)
const currentAdvanceAmount = computed(() => {
  if (!balanceInfo.value) return 0
  return calculationBasis.value === 'REQUESTED'
    ? balanceInfo.value.advanceRequested
    : balanceInfo.value.advancePaid
})

// 현재 기성금 누계 (기준에 따라)
const currentProgressAmount = computed(() => {
  if (!balanceInfo.value) return 0
  return calculationBasis.value === 'REQUESTED'
    ? balanceInfo.value.progressRequested
    : balanceInfo.value.progressPaid
})

// 계산된 잔금
const calculatedBalance = computed(() => {
  if (!balanceInfo.value) return 0
  return calculationBasis.value === 'REQUESTED'
    ? balanceInfo.value.balanceByRequested
    : balanceInfo.value.balanceByPaid
})

// 금액 불일치 경고
const amountMismatchWarning = computed(() => {
  return form.requestAmount > 0 && form.requestAmount !== calculatedBalance.value
})

// 유효성 검사
const isValid = computed(() => {
  // 기존 신청이 있으면 불가
  if (balanceInfo.value?.request) {
    validationError.value = '이미 잔금 신청이 진행 중입니다.'
    return false
  }

  // 신청 금액 확인
  if (!form.requestAmount || form.requestAmount <= 0) {
    validationError.value = '신청 금액을 입력해주세요.'
    return false
  }

  // 신청일 확인
  if (!form.requestDate) {
    validationError.value = '신청일을 선택해주세요.'
    return false
  }

  validationError.value = null
  return true
})

// Methods
const closeModal = () => {
  emit('close')
}

const getBalanceStatusLabel = (status: BalanceStatus) => {
  const labels: Record<BalanceStatus, string> = {
    NOT_REQUESTED: '미신청',
    REQUESTED: '신청',
    APPROVED: '승인',
    PAID: '수금완료',
    REJECTED: '반려'
  }
  return labels[status] || status
}

const onAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // 숫자만 추출
  const numericValue = input.value.replace(/[^\d]/g, '')
  form.requestAmount = parseInt(numericValue, 10) || 0
  // 포맷팅된 값으로 표시
  formattedRequestAmount.value = form.requestAmount > 0 ? formatNumber(form.requestAmount) : ''
}

const setCalculatedAmount = () => {
  form.requestAmount = calculatedBalance.value
  formattedRequestAmount.value = formatNumber(form.requestAmount)
}

const loadData = async () => {
  if (!props.fundId) return

  isLoading.value = true

  try {
    // 잔금 정보 조회
    balanceInfo.value = await fundService.getBalance(props.fundId)

    // 기본 신청 금액을 계산된 잔금으로 설정
    if (balanceInfo.value && !balanceInfo.value.request) {
      form.requestAmount = balanceInfo.value.balanceByRequested
      formattedRequestAmount.value = formatNumber(form.requestAmount)
    }

  } catch (error) {
    console.error('데이터 로드 실패:', error)
    alert('데이터를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const submitBalanceRequest = async () => {
  if (!isValid.value || isSubmitting.value) return

  // 금액 불일치 시 확인
  if (amountMismatchWarning.value) {
    if (!confirm(`신청 금액(${formatCurrency(form.requestAmount)})이 계산된 잔금(${formatCurrency(calculatedBalance.value)})과 다릅니다.\n\n그래도 신청하시겠습니까?`)) {
      return
    }
  }

  isSubmitting.value = true

  try {
    // 잔금 신청 API 호출
    await fundService.requestBalance(props.fundId, {
      requestAmount: form.requestAmount,
      requestDate: form.requestDate,
      calculationBasis: calculationBasis.value,
      remarks: form.remarks || undefined
    })

    alert('잔금 신청이 완료되었습니다.')
    emit('submitted')
    closeModal()
  } catch (error) {
    console.error('잔금 신청 실패:', error)
    alert(error instanceof Error ? error.message : '잔금 신청에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.requestAmount = 0
  form.requestDate = new Date().toISOString().split('T')[0]
  form.remarks = ''
  formattedRequestAmount.value = ''
  calculationBasis.value = 'REQUESTED'
  balanceInfo.value = null
  validationError.value = null
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
    loadData()
  }
})

// 계산 기준 변경 시 금액 업데이트
watch(calculationBasis, () => {
  if (balanceInfo.value && !balanceInfo.value.request) {
    form.requestAmount = calculatedBalance.value
    formattedRequestAmount.value = formatNumber(form.requestAmount)
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

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

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 90%;
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  color: #3b82f6;
}

/* 기존 신청 박스 */
.existing-request-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.existing-request-box > i {
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.existing-content {
  flex: 1;
}

.existing-content strong {
  color: #92400e;
  display: block;
  margin-bottom: 0.25rem;
}

.existing-content p {
  color: #a16207;
  font-size: 0.875rem;
  margin: 0;
}

/* 계산 기준 섹션 */
.calculation-basis-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.calculation-basis-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
}

.radio-label:has(input:checked) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.radio-label input[type="radio"] {
  margin-top: 2px;
}

.radio-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.radio-text strong {
  font-size: 0.875rem;
  color: #1f2937;
}

.radio-text small {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 계산 섹션 */
.calculation-section {
  background: #f0f9ff;
  border-radius: 8px;
  padding: 1rem;
}

.calculation-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.calculation-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0f2fe;
}

.calc-row.header {
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  border-bottom: 2px solid #bae6fd;
}

.calc-row.minus .calc-label {
  color: #dc2626;
}

.calc-row.minus .calc-value {
  color: #dc2626;
}

.calc-row.minus .calc-value::before {
  content: '- ';
}

.calc-row.total {
  border-bottom: none;
  border-top: 2px solid #7dd3fc;
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}

.calc-row.total .calc-label {
  font-weight: 600;
}

.calc-row.total .calc-value {
  font-size: 1.25rem;
}

.calc-label {
  font-size: 0.875rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calc-label small {
  font-size: 0.75rem;
  color: #6b7280;
}

.calc-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.calc-value.primary {
  color: #2563eb;
}

/* 폼 섹션 */
.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-field label.required::after {
  content: ' *';
  color: #dc2626;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-unit .form-input {
  flex: 1;
  text-align: right;
}

.input-with-unit .unit {
  font-size: 0.875rem;
  color: #6b7280;
  min-width: 20px;
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-hint {
  display: flex;
  align-items: center;
}

.btn-set-amount {
  padding: 0.25rem 0.5rem;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-set-amount:hover {
  background: #dbeafe;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 경고 박스 */
.warning-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.warning-box > i {
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-content strong {
  color: #92400e;
  display: block;
  margin-bottom: 0.25rem;
}

.warning-content p {
  color: #a16207;
  font-size: 0.875rem;
  margin: 0;
}

/* 유효성 에러 */
.validation-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
}

/* 버튼 */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

/* 반응형 */
@media (max-width: 640px) {
  .radio-group {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
