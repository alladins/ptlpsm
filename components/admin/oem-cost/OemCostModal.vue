<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container" :class="{ 'success-state': isSuccess }">
          <!-- Success Animation Overlay -->
          <Transition name="success-fade">
            <div v-if="isSuccess" class="ccm-success-overlay ccm-purple">
              <div class="ccm-success-content">
                <div class="ccm-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="ccm-success-title">{{ isEditMode ? '원가 수정 완료' : '원가 등록 완료' }}</h3>
                <p class="ccm-success-message">{{ getSuccessMessage() }}</p>
              </div>
            </div>
          </Transition>

          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">{{ isEditMode ? 'OEM 원가 수정' : 'OEM 원가 등록' }}</h2>
                <span class="ccm-modal-subtitle">{{ isEditMode ? '기존 원가 정보 수정' : '새로운 OEM 원가 등록' }}</span>
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
            <!-- SKU 정보 카드 -->
            <div class="sku-info-card">
              <div class="sku-info-header">
                <span class="sku-badge">SKU</span>
                <span class="sku-id">{{ skuInfo?.skuId }}</span>
              </div>
              <div class="sku-info-body">
                <div class="sku-name">{{ skuInfo?.skuName || skuInfo?.itemName }}</div>
                <div class="sku-detail">
                  <span v-if="skuInfo?.unitPrice" class="unit-price">
                    납품단가: {{ formatCurrency(skuInfo.unitPrice) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- OEM 제조사 선택 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label required">
                <i class="fas fa-industry"></i>
                OEM 제조사
              </label>
              <select
                v-model="form.oemCompanyId"
                class="ccm-form-select"
                :disabled="isSubmitting || isEditMode"
              >
                <option :value="null">제조사를 선택하세요</option>
                <option
                  v-for="company in availableOemCompanies"
                  :key="company.id"
                  :value="company.id"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </div>

            <!-- 원가 입력 -->
            <div class="ccm-form-group">
              <div class="ccm-form-label-row">
                <label class="ccm-form-label required">
                  <i class="fas fa-won-sign"></i>
                  원가
                </label>
                <div class="cost-percent-buttons">
                  <button
                    type="button"
                    class="percent-btn"
                    @click="applyPercentage(60)"
                    :disabled="isSubmitting || !skuInfo?.unitPrice"
                  >60%</button>
                  <button
                    type="button"
                    class="percent-btn"
                    @click="applyPercentage(61)"
                    :disabled="isSubmitting || !skuInfo?.unitPrice"
                  >61%</button>
                  <button
                    type="button"
                    class="percent-btn"
                    @click="applyPercentage(64)"
                    :disabled="isSubmitting || !skuInfo?.unitPrice"
                  >64%</button>
                  <div class="custom-percent-input">
                    <input
                      type="number"
                      v-model.number="customPercent"
                      class="percent-input"
                      placeholder="%"
                      min="0"
                      max="100"
                      :disabled="isSubmitting || !skuInfo?.unitPrice"
                      @keyup.enter="applyPercentage(customPercent)"
                    />
                    <button
                      type="button"
                      class="percent-apply-btn"
                      @click="applyPercentage(customPercent)"
                      :disabled="isSubmitting || !skuInfo?.unitPrice || !customPercent"
                    >적용</button>
                  </div>
                </div>
              </div>
              <div class="cost-input-wrapper">
                <div class="cost-input-container">
                  <span class="cost-prefix">₩</span>
                  <input
                    type="text"
                    v-model="formattedCostPrice"
                    class="ccm-form-input cost-input"
                    placeholder="0"
                    :disabled="isSubmitting"
                    @input="handleCostInput"
                  />
                </div>
                <div class="margin-rate-display" :class="marginRateClass">
                  <span class="margin-label">마진율</span>
                  <span class="margin-value">{{ marginRateText }}</span>
                </div>
              </div>
            </div>

            <!-- 적용 기간 -->
            <div class="ccm-form-row">
              <div class="ccm-form-group half">
                <label class="ccm-form-label required">
                  <i class="fas fa-calendar-alt"></i>
                  적용 시작일
                </label>
                <input
                  type="date"
                  v-model="form.effectiveDate"
                  class="ccm-form-input"
                  :disabled="isSubmitting"
                />
              </div>
              <div class="ccm-form-group half">
                <label class="ccm-form-label">
                  <i class="fas fa-calendar-times"></i>
                  만료일 <span class="optional-tag">(선택)</span>
                </label>
                <input
                  type="date"
                  v-model="form.expiryDate"
                  class="ccm-form-input"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <!-- 계약번호 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-file-contract"></i>
                계약번호 <span class="optional-tag">(선택)</span>
              </label>
              <input
                type="text"
                v-model="form.contractNo"
                class="ccm-form-input"
                placeholder="계약번호 입력"
                :disabled="isSubmitting"
              />
            </div>

            <!-- 비고 -->
            <div class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-sticky-note"></i>
                비고 <span class="optional-tag">(선택)</span>
              </label>
              <textarea
                v-model="form.remarks"
                class="ccm-form-textarea"
                rows="2"
                placeholder="비고 입력"
                :disabled="isSubmitting"
              ></textarea>
            </div>

            <!-- 변경 사유 (수정 모드에서만) -->
            <div v-if="isEditMode" class="ccm-form-group">
              <label class="ccm-form-label">
                <i class="fas fa-edit"></i>
                변경 사유 <span class="optional-tag">(선택)</span>
              </label>
              <input
                type="text"
                v-model="form.changeReason"
                class="ccm-form-input"
                placeholder="변경 사유 입력 (이력에 기록됨)"
                :disabled="isSubmitting"
              />
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="ccm-modal-footer">
            <button
              type="button"
              class="ccm-btn-secondary"
              @click="handleClose"
              :disabled="isSubmitting"
            >
              취소
            </button>
            <button
              type="button"
              class="ccm-btn-primary ccm-btn-purple"
              @click="handleSubmit"
              :disabled="!isFormValid || isSubmitting"
            >
              <span v-if="isSubmitting" class="loading-spinner"></span>
              <span v-else>{{ isEditMode ? '수정하기' : '등록하기' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { oemCostService } from '~/services/oem-cost.service'
import { companyService } from '~/services/company.service'
import { calculateMarginRate, getMarginRateClass } from '~/types/oem-cost'
import type { OemCost, OemCostCreateRequest, OemCostUpdateRequest } from '~/types/oem-cost'
import type { CompanyInfoResponse } from '~/types/company'

interface SkuInfo {
  skuId: string
  skuName?: string
  itemName?: string
  unitPrice?: number
}

interface Props {
  isOpen: boolean
  skuInfo: SkuInfo | null
  editData?: OemCost | null  // 수정 모드에서 기존 데이터
  existingOemCompanyIds?: number[]  // 이미 등록된 제조사 ID 목록 (제외할 목록)
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', data: OemCost): void
}>()

// 상태
const isSubmitting = ref(false)
const isSuccess = ref(false)
const oemCompanies = ref<CompanyInfoResponse[]>([])
const savedData = ref<OemCost | null>(null)

// 이미 등록된 제조사를 제외한 선택 가능한 목록
const availableOemCompanies = computed(() => {
  if (!props.existingOemCompanyIds || props.existingOemCompanyIds.length === 0) {
    return oemCompanies.value
  }
  // 수정 모드에서는 현재 선택된 제조사는 표시
  const currentOemId = props.editData?.oemCompanyId
  return oemCompanies.value.filter(company =>
    !props.existingOemCompanyIds!.includes(company.id) || company.id === currentOemId
  )
})

// 폼 데이터
const form = ref({
  oemCompanyId: null as number | null,
  costPrice: 0,
  effectiveDate: '',
  expiryDate: '',
  contractNo: '',
  remarks: '',
  changeReason: ''
})

// 포맷된 원가 (천단위 콤마)
const formattedCostPrice = ref('')

// 커스텀 퍼센트 입력
const customPercent = ref<number | null>(null)

// 계산된 값
const isEditMode = computed(() => !!props.editData)

const marginRate = computed(() => {
  return calculateMarginRate(props.skuInfo?.unitPrice, form.value.costPrice)
})

const marginRateClass = computed(() => {
  return getMarginRateClass(marginRate.value)
})

const marginRateText = computed(() => {
  if (marginRate.value === null) return '-'
  return `${marginRate.value.toFixed(1)}%`
})

const isFormValid = computed(() => {
  return (
    form.value.oemCompanyId !== null &&
    form.value.costPrice > 0 &&
    form.value.effectiveDate !== ''
  )
})

// OEM 회사 목록 로드 (제조사 타입만 조회)
const loadOemCompanies = async () => {
  try {
    oemCompanies.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('OEM 회사 목록 조회 실패:', error)
  }
}

// 원가 입력 핸들러
const handleCostInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // 숫자만 추출
  const value = input.value.replace(/[^0-9]/g, '')
  const numValue = parseInt(value) || 0
  form.value.costPrice = numValue
  // 천단위 콤마 포맷
  formattedCostPrice.value = numValue.toLocaleString('ko-KR')
}

// 퍼센트 적용 핸들러
const applyPercentage = (percent: number | null) => {
  if (!percent || !props.skuInfo?.unitPrice) return
  // 납품단가 * 퍼센트% 계산 (반올림)
  const calculatedCost = Math.round(props.skuInfo.unitPrice * (percent / 100))
  form.value.costPrice = calculatedCost
  formattedCostPrice.value = calculatedCost.toLocaleString('ko-KR')
}

// 폼 초기화
const resetForm = () => {
  form.value = {
    oemCompanyId: null,
    costPrice: 0,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    contractNo: '',
    remarks: '',
    changeReason: ''
  }
  formattedCostPrice.value = ''
  customPercent.value = null
}

// 수정 모드 데이터 로드
const loadEditData = () => {
  if (props.editData) {
    form.value = {
      oemCompanyId: props.editData.oemCompanyId,
      costPrice: props.editData.costPrice,
      effectiveDate: props.editData.effectiveDate,
      expiryDate: props.editData.expiryDate || '',
      contractNo: props.editData.contractNo || '',
      remarks: props.editData.remarks || '',
      changeReason: ''
    }
    formattedCostPrice.value = props.editData.costPrice.toLocaleString('ko-KR')
  }
}

// 제출
const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  try {
    isSubmitting.value = true

    if (isEditMode.value && props.editData) {
      // 수정
      const updateData: OemCostUpdateRequest = {
        costPrice: form.value.costPrice,
        effectiveDate: form.value.effectiveDate,
        expiryDate: form.value.expiryDate || null,
        contractNo: form.value.contractNo || undefined,
        remarks: form.value.remarks || undefined,
        changeReason: form.value.changeReason || undefined
      }
      console.log('[OemCostModal] 수정 요청 데이터:', updateData)
      savedData.value = await oemCostService.update(props.editData.id, updateData)
    } else {
      // 등록
      const createData: OemCostCreateRequest = {
        skuId: props.skuInfo!.skuId,
        oemCompanyId: form.value.oemCompanyId!,
        costPrice: form.value.costPrice,
        effectiveDate: form.value.effectiveDate,
        expiryDate: form.value.expiryDate || undefined,
        contractNo: form.value.contractNo || undefined,
        remarks: form.value.remarks || undefined
      }
      console.log('[OemCostModal] 등록 요청 데이터:', createData)
      savedData.value = await oemCostService.create(createData)
    }

    // 성공 애니메이션
    isSuccess.value = true
    setTimeout(() => {
      emit('saved', savedData.value!)
      handleClose()
    }, 1500)

  } catch (error) {
    console.error('원가 저장 실패:', error)
    alert(error instanceof Error ? error.message : '원가 저장에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 닫기
const handleClose = () => {
  if (isSubmitting.value) return
  isSuccess.value = false
  emit('close')
}

// 성공 메시지
const getSuccessMessage = () => {
  const oemName = oemCompanies.value.find(c => c.id === form.value.oemCompanyId)?.companyName || 'OEM'
  return `${props.skuInfo?.skuId} - ${oemName} 원가가 ${isEditMode.value ? '수정' : '등록'}되었습니다.`
}

// 금액 포맷
const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '-'
  return amount.toLocaleString('ko-KR') + '원'
}

// 모달 열림 감지
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.editData) {
      loadEditData()
    } else {
      resetForm()
    }
    if (oemCompanies.value.length === 0) {
      loadOemCompanies()
    }
  }
})

onMounted(() => {
  loadOemCompanies()
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

/* Modal 기본 스타일 (ccm-modal 패턴) */
.ccm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.ccm-modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
}

/* Header */
.ccm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ccm-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ccm-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ccm-header-icon svg {
  width: 24px;
  height: 24px;
}

.ccm-icon-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.ccm-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ccm-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.ccm-modal-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.ccm-close-button {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.ccm-close-button:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.ccm-close-button svg {
  width: 20px;
  height: 20px;
}

/* Body */
.ccm-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
}

/* SKU 정보 카드 */
.sku-info-card {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border: 1px solid #c4b5fd;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.sku-info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sku-badge {
  background: #7c3aed;
  color: white;
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
}

.sku-id {
  font-size: 0.875rem;
  font-weight: 600;
  color: #5b21b6;
}

.sku-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.sku-detail {
  font-size: 0.875rem;
  color: #6b7280;
}

.unit-price {
  color: #7c3aed;
  font-weight: 500;
}

/* 폼 그룹 */
.ccm-form-group {
  margin-bottom: 1.25rem;
}

.ccm-form-row {
  display: flex;
  gap: 1rem;
}

.ccm-form-group.half {
  flex: 1;
}

.ccm-form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.ccm-form-label i {
  color: #7c3aed;
}

.ccm-form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

.optional-tag {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
}

.ccm-form-input,
.ccm-form-select,
.ccm-form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9375rem;
  color: #1f2937;
  background: white;
  transition: all 0.2s;
}

.ccm-form-input:focus,
.ccm-form-select:focus,
.ccm-form-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.ccm-form-textarea {
  resize: vertical;
  min-height: 60px;
}

/* 원가 입력 */
.cost-input-wrapper {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.cost-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  transition: all 0.2s;
}

.cost-input-container:focus-within {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.cost-prefix {
  padding: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 600;
  border-right: 1px solid #d1d5db;
}

.cost-input {
  flex: 1;
  border: none !important;
  box-shadow: none !important;
  text-align: right;
  font-size: 1.125rem;
  font-weight: 600;
}

/* 마진율 표시 */
.margin-rate-display {
  min-width: 100px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.margin-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.margin-value {
  font-size: 1rem;
  font-weight: 700;
}

/* 마진율 색상 */
.margin-high {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #059669;
  border: 1px solid #a7f3d0;
}

.margin-normal {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #0284c7;
  border: 1px solid #93c5fd;
}

.margin-low {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
  border: 1px solid #fcd34d;
}

.margin-negative {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

.margin-none {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

/* Footer */
.ccm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ccm-btn-secondary,
.ccm-btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.ccm-btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.ccm-btn-secondary:hover {
  background: #f3f4f6;
}

.ccm-btn-primary {
  background: #3b82f6;
  color: white;
}

.ccm-btn-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.ccm-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.ccm-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 성공 오버레이 */
.ccm-success-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;
}

.ccm-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.ccm-success-content {
  text-align: center;
  color: white;
}

.ccm-success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ccm-success-icon svg {
  width: 40px;
  height: 40px;
}

.ccm-success-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.ccm-success-message {
  font-size: 0.9375rem;
  opacity: 0.9;
}

/* 로딩 스피너 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .ccm-modal-container,
.modal-leave-active .ccm-modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .ccm-modal-container,
.modal-leave-to .ccm-modal-container {
  transform: scale(0.95) translateY(-20px);
}

.success-fade-enter-active,
.success-fade-leave-active {
  transition: opacity 0.3s ease;
}

.success-fade-enter-from,
.success-fade-leave-to {
  opacity: 0;
}

/* 원가 라벨 행 */
.ccm-form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 퍼센트 버튼 그룹 */
.cost-percent-buttons {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.percent-btn {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7c3aed;
  background: #f3e8ff;
  border: 1px solid #c4b5fd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.percent-btn:hover:not(:disabled) {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.percent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 커스텀 퍼센트 입력 */
.custom-percent-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.25rem;
}

.percent-input {
  width: 50px;
  padding: 0.25rem 0.375rem;
  font-size: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
}

.percent-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.percent-input::-webkit-outer-spin-button,
.percent-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.percent-input[type=number] {
  -moz-appearance: textfield;
}

.percent-apply-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: #7c3aed;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.percent-apply-btn:hover:not(:disabled) {
  background: #6d28d9;
}

.percent-apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
