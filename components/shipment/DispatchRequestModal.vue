<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>출고요청</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- OEM 제조사 선택 -->
          <div class="form-section">
            <div class="section-header">
              <i class="fas fa-industry"></i>
              <span>OEM 제조사</span>
            </div>
            <div class="form-grid">
              <div class="form-field full-width">
                <label class="form-label required">OEM 제조사</label>
                <select
                  v-model="formData.oemCompanyId"
                  class="form-select"
                  disabled
                >
                  <option :value="null">{{ loadingManufacturers ? '로딩 중...' : '선택하세요' }}</option>
                  <option
                    v-for="company in manufacturers"
                    :key="company.id"
                    :value="company.id"
                  >
                    {{ company.companyName }}
                  </option>
                </select>
                <span v-if="errors.oemCompanyId" class="error-message">{{ errors.oemCompanyId }}</span>
              </div>
            </div>

            <!-- 가용성 확인 결과 -->
            <div v-if="checkingAvailability" class="availability-loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>재고/발주서 확인 중...</span>
            </div>

            <div v-else-if="availability" class="availability-result" :class="availabilityClass">
              <div class="availability-header">
                <i :class="availabilityIcon"></i>
                <span>{{ availability.message }}</span>
              </div>
              <div v-if="availability.items && availability.items.length > 0" class="availability-items">
                <div
                  v-for="item in availability.items"
                  :key="item.skuId"
                  class="availability-item"
                  :class="{ 'item-sufficient': item.sufficient, 'item-insufficient': !item.sufficient }"
                >
                  <span class="item-name">{{ item.skuName || item.skuId }}</span>
                  <span class="item-detail">
                    <template v-if="item.inventoryQuantity >= item.requiredQuantity">
                      재고 {{ item.inventoryQuantity }}개
                    </template>
                    <template v-else-if="item.hasIssuedPo">
                      발주 진행 중 ({{ item.poNo }})
                    </template>
                    <template v-else>
                      재고 {{ item.inventoryQuantity }}개 / 필요 {{ item.requiredQuantity }}개
                    </template>
                  </span>
                  <i :class="item.sufficient ? 'fas fa-check-circle text-green' : 'fas fa-exclamation-circle text-red'"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 배송지 정보 -->
          <div class="form-section">
            <div class="section-header">
              <i class="fas fa-map-marker-alt"></i>
              <span>배송지 정보</span>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">우편번호</label>
                <div class="input-with-button">
                  <input
                    type="text"
                    v-model="formData.zipcode"
                    class="form-input"
                    placeholder="우편번호"
                    maxlength="10"
                    readonly
                  />
                  <button
                    type="button"
                    class="btn-search"
                    @click="openPostalSearch"
                    :disabled="isPostalSearchOpen"
                  >
                    <i class="fas fa-search"></i>
                    검색
                  </button>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label required">현장 도착 예정일시</label>
                <VueDatePicker
                  v-model="formData.expectedArrivalDatetime"
                  model-type="yyyy-MM-dd'T'HH:mm"
                  :enable-time-picker="true"
                  :format="'yyyy-MM-dd HH:mm'"
                  locale="ko"
                  time-picker-inline
                  :action-row="{ showNow: true, showCancel: true, showSelect: true }"
                  placeholder="날짜와 시간을 선택하세요"
                  auto-apply
                  :teleport="true"
                  :clearable="false"
                />
                <span v-if="errors.expectedArrivalDatetime" class="error-message">{{ errors.expectedArrivalDatetime }}</span>
              </div>
              <div class="form-field full-width">
                <label class="form-label required">배송지 주소</label>
                <input
                  type="text"
                  v-model="formData.deliveryAddress"
                  class="form-input"
                  placeholder="주소찾기를 이용하세요"
                  readonly
                />
                <span v-if="errors.deliveryAddress" class="error-message">{{ errors.deliveryAddress }}</span>
              </div>
              <div class="form-field full-width">
                <label class="form-label">상세주소</label>
                <input
                  type="text"
                  v-model="formData.addressDetail"
                  class="form-input"
                  placeholder="상세주소 (선택)"
                />
              </div>
            </div>
          </div>

          <!-- 현장 인수자 정보 -->
          <div class="form-section">
            <div class="section-header">
              <i class="fas fa-user"></i>
              <span>현장 인수자 정보</span>
              <span class="field-hint">
                <i class="fas fa-info-circle"></i>
                현장소장은 사전 등록해야 합니다.
              </span>
            </div>
            <div class="form-grid">
              <!-- 현장소장 선택 -->
              <div class="form-field">
                <label class="form-label required">현장소장</label>
                <select
                  v-model="formData.siteManagerId"
                  class="form-select"
                  @change="handleSiteManagerChange"
                >
                  <option :value="null">선택하세요</option>
                  <option
                    v-for="manager in siteManagers"
                    :key="manager.userId"
                    :value="manager.userId"
                  >
                    {{ manager.userName }} ({{ manager.phone }})
                    <template v-if="manager.companyName"> - {{ manager.companyName }}</template>
                  </option>
                </select>
                <span v-if="errors.siteManagerId" class="error-message">{{ errors.siteManagerId }}</span>
                <span v-else class="field-hint">
                  <i class="fas fa-info-circle"></i>
                  선택 시 인수자 정보가 자동 입력됩니다.
                </span>
              </div>
              <!-- 건설사 -->
              <div class="form-field">
                <label class="form-label">건설사</label>
                <input
                  type="text"
                  v-model="formData.constructionCompany"
                  class="form-input"
                  placeholder="현장소장 선택 시 자동 입력"
                  readonly
                />
              </div>
              <!-- 인수자명 -->
              <div class="form-field">
                <label class="form-label required">인수자명</label>
                <input
                  type="text"
                  v-model="formData.receiverName"
                  class="form-input"
                  placeholder="인수자명"
                />
                <span v-if="errors.receiverName" class="error-message">{{ errors.receiverName }}</span>
                <span class="field-hint">
                  <i class="fas fa-info-circle"></i>
                  인수자가 다를경우 직접 수정/입력 하세요.
                </span>
              </div>
              <!-- 인수자 연락처 -->
              <div class="form-field">
                <label class="form-label required">인수자 연락처</label>
                <input
                  type="tel"
                  v-model="formData.receiverPhone"
                  class="form-input"
                  placeholder="010-0000-0000"
                  @input="handlePhoneInput"
                />
                <span v-if="errors.receiverPhone" class="error-message">{{ errors.receiverPhone }}</span>
              </div>
            </div>
          </div>

          <!-- 비고 -->
          <div class="form-section">
            <div class="section-header">
              <i class="fas fa-sticky-note"></i>
              <span>비고</span>
            </div>
            <div class="form-grid">
              <div class="form-field full-width">
                <textarea
                  v-model="formData.remarks"
                  class="form-input form-textarea"
                  placeholder="비고 (선택)"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal" :disabled="isSubmitting">
            <i class="fas fa-times"></i>
            취소
          </button>
          <button
            class="btn-primary"
            :disabled="!canSubmit || isSubmitting"
            @click="handleSubmit"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
            {{ isSubmitting ? '요청 중...' : '출고요청' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 출고요청 생성 모달
 *
 * 출하 상세 페이지에서 팝업으로 열리며,
 * OEM 제조사 선택 및 배송지 정보를 입력하여 출고요청을 생성합니다.
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { dispatchRequestService } from '~/services/dispatch-request.service'
import { companyService } from '~/services/company.service'
import { formatPhoneNumber, formatPhoneNumberInput, getDefaultDateTimeString } from '~/utils/format'
import type { UserByRole } from '~/types/user'
import type { CompanyInfoResponse } from '~/types/company'
import type { DispatchAvailabilityResponse } from '~/types/dispatch-request'

// Daum Postcode API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: any) => {
        open: () => void
      }
    }
  }
}

// Props
interface InitialData {
  zipcode: string
  deliveryAddress: string
  addressDetail: string
  siteManagerId: number | null
  receiverName: string
  receiverPhone: string
  oemCompanyId: number | null
  expectedArrivalDatetime: string
}

interface Props {
  isOpen: boolean
  shipmentId: number
  initialData: InitialData
  siteManagers: UserByRole[]
}

const props = withDefaults(defineProps<Props>(), {
  siteManagers: () => []
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

// State
const isSubmitting = ref(false)
const isPostalSearchOpen = ref(false)

// OEM 제조사 목록
const manufacturers = ref<CompanyInfoResponse[]>([])
const loadingManufacturers = ref(false)

// 가용성 확인
const availability = ref<DispatchAvailabilityResponse | null>(null)
const checkingAvailability = ref(false)

const formData = reactive({
  oemCompanyId: null as number | null,
  zipcode: '',
  deliveryAddress: '',
  addressDetail: '',
  expectedArrivalDatetime: '',
  siteManagerId: null as number | null,
  siteManagerName: '',
  siteManagerPhone: '',
  constructionCompany: '',
  receiverName: '',
  receiverPhone: '',
  remarks: ''
})

const errors = reactive({
  oemCompanyId: '',
  siteManagerId: '',
  deliveryAddress: '',
  expectedArrivalDatetime: '',
  receiverName: '',
  receiverPhone: ''
})

// OEM 제조사 목록 로드
onMounted(async () => {
  loadingManufacturers.value = true
  try {
    manufacturers.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  } finally {
    loadingManufacturers.value = false
  }
})

// 제출 가능 여부 (OEM 제조사 + 배송지 주소 + 인수자 정보 필수 + 가용성 충족)
const canSubmit = computed(() => {
  if (formData.oemCompanyId === null) return false
  if (formData.siteManagerId === null) return false
  if (!formData.deliveryAddress) return false
  if (!formData.expectedArrivalDatetime) return false
  if (!formData.receiverName?.trim()) return false
  if (!formData.receiverPhone?.trim()) return false
  if (checkingAvailability.value) return false
  if (availability.value && !availability.value.available) return false
  return true
})

// 가용성 결과 스타일
const availabilityClass = computed(() => {
  if (!availability.value) return ''
  if (availability.value.available) return 'availability-success'
  // 일부 충족 여부 확인
  const hasAnySufficient = availability.value.items?.some(i => i.sufficient)
  return hasAnySufficient ? 'availability-warning' : 'availability-error'
})

const availabilityIcon = computed(() => {
  if (!availability.value) return ''
  if (availability.value.available) return 'fas fa-check-circle'
  return 'fas fa-exclamation-triangle'
})

// 모달 닫기
const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

// 폼 초기화 (모달 열릴 때)
const initializeForm = () => {
  formData.oemCompanyId = props.initialData.oemCompanyId || null
  formData.zipcode = props.initialData.zipcode || ''
  formData.deliveryAddress = props.initialData.deliveryAddress || ''
  formData.addressDetail = props.initialData.addressDetail || ''
  formData.expectedArrivalDatetime = props.initialData.expectedArrivalDatetime || getDefaultDateTimeString(7, 0)
  formData.siteManagerId = props.initialData.siteManagerId || null
  formData.receiverName = props.initialData.receiverName || ''
  formData.receiverPhone = props.initialData.receiverPhone || ''
  formData.constructionCompany = ''
  formData.remarks = ''

  // 현장소장 정보 프리필 + 인수자 정보 자동입력
  if (formData.siteManagerId) {
    const manager = props.siteManagers.find(m => m.userId === formData.siteManagerId)
    if (manager) {
      formData.siteManagerName = manager.userName
      formData.siteManagerPhone = manager.phone || ''
      formData.constructionCompany = manager.companyName || ''
      // 인수자 정보가 비어있으면 현장소장 정보로 채움
      if (!formData.receiverName) {
        formData.receiverName = manager.userName
      }
      if (!formData.receiverPhone) {
        formData.receiverPhone = formatPhoneNumber(manager.phone || '')
      }
    }
  }

  // 가용성 초기화
  availability.value = null
  checkingAvailability.value = false

  // 에러 초기화
  errors.oemCompanyId = ''
  errors.siteManagerId = ''
  errors.deliveryAddress = ''
  errors.expectedArrivalDatetime = ''
  errors.receiverName = ''
  errors.receiverPhone = ''

  // OEM이 이미 설정되어 있으면 가용성 자동 확인
  if (formData.oemCompanyId) {
    checkAvailability(formData.oemCompanyId)
  }
}

// 선택된 현장소장의 회사 ID (건설사 동기화용)
const selectedManagerCompanyId = computed(() => {
  if (!formData.siteManagerId) return null
  const manager = props.siteManagers.find(m => m.userId === formData.siteManagerId)
  return manager?.companyId || null
})

// 현장소장 선택 시 인수자 정보 자동 입력
const handleSiteManagerChange = () => {
  if (formData.siteManagerId) {
    const manager = props.siteManagers.find(m => m.userId === formData.siteManagerId)
    if (manager) {
      formData.siteManagerName = manager.userName
      formData.siteManagerPhone = manager.phone || ''
      formData.constructionCompany = manager.companyName || ''
      formData.receiverName = manager.userName
      formData.receiverPhone = formatPhoneNumber(manager.phone || '')
    }
  } else {
    formData.constructionCompany = ''
  }
}

// 연락처 입력 포맷팅
const handlePhoneInput = () => {
  formData.receiverPhone = formatPhoneNumberInput(formData.receiverPhone || '')
}

// 가용성 확인
const checkAvailability = async (oemCompanyId: number) => {
  checkingAvailability.value = true
  try {
    availability.value = await dispatchRequestService.checkAvailability(
      props.shipmentId,
      oemCompanyId
    )
  } catch (error) {
    console.error('가용성 확인 실패:', error)
    // 에러 시에도 출고요청은 가능하도록 (서버 에러 등)
    availability.value = null
  } finally {
    checkingAvailability.value = false
  }
}

// OEM 선택 변경 시 가용성 확인
const handleOemChange = async () => {
  availability.value = null

  if (!formData.oemCompanyId) {
    return
  }

  await checkAvailability(formData.oemCompanyId)
}

// 주소찾기 팝업 열기
const openPostalSearch = () => {
  if (isPostalSearchOpen.value) return

  isPostalSearchOpen.value = true

  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.zipcode = data.zonecode
      formData.deliveryAddress = data.address
      formData.addressDetail = ''
      isPostalSearchOpen.value = false
    },
    onclose: () => {
      isPostalSearchOpen.value = false
    }
  }).open()
}

// 유효성 검사
const validate = (): boolean => {
  let isValid = true

  if (!formData.oemCompanyId) {
    errors.oemCompanyId = 'OEM 제조사를 선택하세요'
    isValid = false
  } else {
    errors.oemCompanyId = ''
  }

  if (!formData.siteManagerId) {
    errors.siteManagerId = '현장소장을 선택하세요'
    isValid = false
  } else {
    errors.siteManagerId = ''
  }

  if (!formData.deliveryAddress) {
    errors.deliveryAddress = '배송지 주소를 입력하세요'
    isValid = false
  } else {
    errors.deliveryAddress = ''
  }

  if (!formData.expectedArrivalDatetime) {
    errors.expectedArrivalDatetime = '현장 도착 예정일시를 입력하세요'
    isValid = false
  } else {
    errors.expectedArrivalDatetime = ''
  }

  if (!formData.receiverName?.trim()) {
    errors.receiverName = '인수자명을 입력하세요'
    isValid = false
  } else {
    errors.receiverName = ''
  }

  if (!formData.receiverPhone?.trim()) {
    errors.receiverPhone = '인수자 연락처를 입력하세요'
    isValid = false
  } else {
    errors.receiverPhone = ''
  }

  return isValid
}

// 제출 처리
const handleSubmit = async () => {
  if (!validate() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await dispatchRequestService.createDispatchRequest({
      shipmentId: props.shipmentId,
      oemCompanyId: formData.oemCompanyId!,
      zipcode: formData.zipcode || undefined,
      deliveryAddress: formData.deliveryAddress,
      addressDetail: formData.addressDetail || undefined,
      expectedArrivalDatetime: formData.expectedArrivalDatetime || undefined,
      siteManagerId: formData.siteManagerId || undefined,
      siteManagerName: formData.siteManagerName || undefined,
      siteManagerPhone: formData.siteManagerPhone || undefined,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      remarks: formData.remarks || undefined,
      builderCompanyId: selectedManagerCompanyId.value || undefined,
      builderCompanyName: formData.constructionCompany || undefined
    })

    emit('created')
  } catch (error) {
    console.error('출고요청 생성 실패:', error)
    alert(error instanceof Error ? error.message : '출고요청 생성에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// 모달 열릴 때 폼 초기화, 닫힐 때 주소검색 상태 정리
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initializeForm()
  } else {
    // 부모 모달 닫힐 때 주소검색 팝업 상태 리셋 (재오픈 시 검색 버튼 활성화)
    isPostalSearchOpen.value = false
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
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
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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

/* 섹션 스타일 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.9375rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header i {
  color: #6b7280;
}

/* 폼 그리드 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field.full-width {
  grid-column: span 2;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.8125rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
}

.form-select {
  background: white;
  cursor: pointer;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-input[readonly] {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: default;
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.field-hint i {
  font-size: 0.6875rem;
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
  background: #2563eb;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
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

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 인풋 + 버튼 조합 */
.input-with-button {
  display: flex;
  gap: 0.5rem;
}

.input-with-button input {
  flex: 1;
}

.btn-search {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-search:hover:not(:disabled) {
  background: #2563eb;
}

.btn-search:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

/* 인풋 + 초기화 버튼 (인라인) */
.input-with-clear {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-clear input {
  flex: 1;
  min-width: 0;
}

.btn-clear-inline {
  padding: 0.625rem 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-clear-inline:hover:not(:disabled) {
  background: #e5e7eb;
  color: #374151;
}

.btn-clear-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 가용성 확인 */
.availability-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #6b7280;
}

.availability-result {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8125rem;
}

.availability-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.availability-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.availability-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.availability-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.availability-success .availability-header {
  color: #15803d;
}

.availability-warning .availability-header {
  color: #a16207;
}

.availability-error .availability-header {
  color: #dc2626;
}

.availability-items {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.availability-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8125rem;
}

.item-sufficient {
  color: #15803d;
}

.item-insufficient {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.04);
}

.item-name {
  font-weight: 500;
  min-width: 0;
  flex-shrink: 1;
}

.item-detail {
  flex: 1;
  text-align: right;
  font-size: 0.75rem;
  color: #6b7280;
}

.item-insufficient .item-detail {
  color: #dc2626;
}

.text-green {
  color: #16a34a;
}

.text-red {
  color: #dc2626;
}

/* 반응형 */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: span 1;
  }
}
</style>
