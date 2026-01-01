<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>선급금 신청</h3>
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
          <!-- 계약 정보 요약 -->
          <div class="info-summary">
            <div class="summary-item">
              <label>총 계약금액</label>
              <span class="value">{{ formatCurrency(contractInfo.totalContractAmount) }}</span>
            </div>
            <div class="summary-item editable">
              <label>선급금 비율</label>
              <div class="rate-input-group">
                <input
                  type="number"
                  v-model.number="advanceRate"
                  @input="onRateChange"
                  class="rate-input"
                  min="0"
                  max="100"
                  step="1"
                />
                <span class="rate-unit">%</span>
              </div>
            </div>
            <div class="summary-item highlight">
              <label>선급금 예상액</label>
              <span class="value primary">{{ formatCurrency(expectedAdvanceAmount) }}</span>
            </div>
          </div>

          <!-- 기존 선급금 이력 -->
          <div v-if="existingAdvances.length > 0" class="history-section">
            <h4>기존 선급금 이력</h4>
            <div class="history-list">
              <div v-for="advance in existingAdvances" :key="advance.advanceId" class="history-item">
                <div class="history-main">
                  <span class="history-date">{{ formatDate(advance.requestDate) }}</span>
                  <span class="history-amount">{{ formatCurrency(advance.requestAmount) }}</span>
                  <span :class="['status-badge', `status-${advance.status.toLowerCase()}`]">
                    {{ getAdvanceStatusLabel(advance.status) }}
                  </span>
                </div>
                <div v-if="advance.paidAmount" class="history-sub">
                  입금: {{ formatCurrency(advance.paidAmount) }} ({{ formatDate(advance.paymentDate) }})
                </div>
                <!-- 기존 선급금에 대한 PDF 버튼 -->
                <div v-if="advance.status !== 'REQUESTED'" class="history-pdf-actions">
                  <button
                    class="btn-pdf-view-sm"
                    @click="viewExistingAdvancePdf(advance.advanceId, 'APPLICATION')"
                  >
                    <i class="fas fa-file-pdf"></i>
                    문서 보기
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 신청 폼 -->
          <div class="form-section">
            <h4>선급금 신청 정보</h4>

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
                  예상 선급금액: {{ formatCurrency(expectedAdvanceAmount) }}
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

          <!-- PDF 문서 안내 -->
          <div class="documents-notice">
            <i class="fas fa-info-circle"></i>
            <span>선급금 신청 완료 시 5종의 PDF 문서가 자동 생성됩니다. 생성된 문서는 선급금 탭에서 확인할 수 있습니다.</span>
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
          @click="submitAdvanceRequest"
          :disabled="!isValid || isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          선급금 신청
        </button>
      </div>
    </div>
  </div>

  <!-- PDF 생성 완료 후 결과 모달 (간소화) -->
  <div v-if="showResultModal" class="modal-overlay" @click="closeResultModal">
    <div class="modal modal-small" @click.stop>
      <div class="modal-header success-header">
        <h3>
          <i class="fas fa-check-circle"></i>
          선급금 신청 완료
        </h3>
        <button class="modal-close" @click="closeResultModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="result-message">
          <div class="result-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <p>선급금 신청이 완료되었습니다.</p>
          <p class="sub-message">생성된 PDF 문서는 선급금 탭에서 확인하실 수 있습니다.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary" @click="closeResultModal">
          <i class="fas fa-check"></i>
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { formatCurrency, formatNumber, formatDate } from '~/utils/format'
import { fundService } from '~/services/fund.service'
import type { AdvancePayment } from '~/types/fund'

// Props
interface Props {
  isOpen: boolean
  fundId: number
  /** 총 계약금액 */
  totalContractAmount?: number
  /** 선급금 비율 (%) */
  advancePaymentRate?: number
}

const props = withDefaults(defineProps<Props>(), {
  totalContractAmount: 0,
  advancePaymentRate: 70
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submitted'): void
}>()

// State
const isLoading = ref(false)
const isSubmitting = ref(false)
const validationError = ref<string | null>(null)

// 결과 모달 상태
const showResultModal = ref(false)

// 계약 정보
const contractInfo = reactive({
  totalContractAmount: 0
})

// 선급금 비율 (기본값 70%)
const advanceRate = ref(70)

// 기존 선급금 이력
const existingAdvances = ref<AdvancePayment[]>([])

// 폼 데이터
const form = reactive({
  requestAmount: 0,
  requestDate: new Date().toISOString().split('T')[0],
  remarks: ''
})

// 금액 입력 포맷팅
const formattedRequestAmount = ref('')

// 예상 선급금액 계산
const expectedAdvanceAmount = computed(() => {
  return Math.round(contractInfo.totalContractAmount * (advanceRate.value / 100))
})

// 유효성 검사
const isValid = computed(() => {
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

const getAdvanceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    REQUESTED: '신청',
    APPROVED: '승인',
    PAID: '수금완료',
    REJECTED: '반려'
  }
  return labels[status] || status
}

// 기존 선급금 PDF 보기 (임시 - 실제 구현 필요)
const viewExistingAdvancePdf = (advanceId: number, pdfType: string) => {
  console.log('PDF 보기:', advanceId, pdfType)
  alert('PDF 보기 기능은 선급금 탭에서 확인해주세요.')
}

const onAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // 숫자만 추출
  const numericValue = input.value.replace(/[^\d]/g, '')
  form.requestAmount = parseInt(numericValue, 10) || 0
  // 포맷팅된 값으로 표시
  formattedRequestAmount.value = form.requestAmount > 0 ? formatNumber(form.requestAmount) : ''
}

const onRateChange = () => {
  // 비율 범위 제한 (0~100)
  if (advanceRate.value < 0) advanceRate.value = 0
  if (advanceRate.value > 100) advanceRate.value = 100

  // 신청 금액을 예상 선급금액으로 자동 업데이트
  form.requestAmount = expectedAdvanceAmount.value
  formattedRequestAmount.value = formatNumber(form.requestAmount)
}

const loadData = async () => {
  if (!props.fundId) return

  isLoading.value = true

  try {
    // 계약 정보 설정
    contractInfo.totalContractAmount = props.totalContractAmount
    // 선급금 비율: props에서 전달받은 값 사용, 없으면 기본값 70%
    advanceRate.value = props.advancePaymentRate || 70

    // 기본 신청 금액을 예상 선급금액으로 설정
    form.requestAmount = expectedAdvanceAmount.value
    formattedRequestAmount.value = formatNumber(form.requestAmount)

    // 기존 선급금 이력 조회
    existingAdvances.value = await fundService.getAdvances(props.fundId)

  } catch (error) {
    console.error('데이터 로드 실패:', error)
    alert('데이터를 불러오는데 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

const submitAdvanceRequest = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 선급금 신청 API 호출 (서버에서 PDF 자동 생성)
    await fundService.requestAdvance(props.fundId, {
      requestAmount: form.requestAmount,
      requestDate: form.requestDate,
      remarks: form.remarks || undefined
    })

    // 결과 모달 표시
    showResultModal.value = true

    emit('submitted')
  } catch (error) {
    console.error('선급금 신청 실패:', error)
    alert(error instanceof Error ? error.message : '선급금 신청에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 결과 모달 닫기
const closeResultModal = () => {
  showResultModal.value = false
  closeModal()
}

const resetForm = () => {
  form.requestAmount = 0
  form.requestDate = new Date().toISOString().split('T')[0]
  form.remarks = ''
  formattedRequestAmount.value = ''

  existingAdvances.value = []
  validationError.value = null
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
    loadData()
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
  max-width: 800px;
}

.modal-medium {
  width: 90%;
  max-width: 600px;
}

.modal-small {
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header.success-header {
  background: #f0fdf4;
  border-bottom-color: #bbf7d0;
}

.modal-header.success-header h3 {
  color: #166534;
}

.modal-header.success-header h3 i {
  color: #16a34a;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* 정보 요약 */
.info-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item label {
  font-size: 0.75rem;
  color: #6b7280;
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-item.highlight {
  background: #eff6ff;
  padding: 0.75rem;
  border-radius: 6px;
  margin: -0.5rem;
}

.summary-item .value.primary {
  color: #2563eb;
  font-size: 1.125rem;
}

/* 선급금 비율 입력 */
.summary-item.editable {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin: -0.5rem;
}

.rate-input-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.rate-input {
  width: 70px;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}

.rate-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.rate-input::-webkit-inner-spin-button,
.rate-input::-webkit-outer-spin-button {
  opacity: 1;
}

.rate-unit {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 이력 섹션 */
.history-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.history-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.history-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.history-amount {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.history-sub {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  font-size: 0.75rem;
  color: #6b7280;
}

.history-pdf-actions {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 0.5rem;
}

/* 상태 배지 */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-requested {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #dbeafe;
  color: #1e40af;
}

.status-paid {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
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
  font-size: 0.75rem;
  color: #6b7280;
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

/* 문서 안내 */
.documents-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1e40af;
  font-size: 0.875rem;
}

.documents-notice i {
  color: #3b82f6;
  font-size: 1rem;
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

/* 결과 모달 */
.result-message {
  text-align: center;
  padding: 1rem 0;
}

.result-icon {
  margin-bottom: 1rem;
}

.result-icon i {
  font-size: 3rem;
  color: #16a34a;
}

.result-message p {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.result-message .sub-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
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
  .info-summary {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
