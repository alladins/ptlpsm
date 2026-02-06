<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>발주서 생성</h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 발주 정보 -->
          <div class="form-section">
            <div class="section-header">
              <i class="fas fa-calendar-alt"></i>
              <span>발주 정보</span>
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label required">발주일자</label>
                <input
                  type="date"
                  v-model="formData.purchaseOrderDate"
                  class="form-input"
                />
                <span v-if="errors.purchaseOrderDate" class="error-message">{{ errors.purchaseOrderDate }}</span>
              </div>
              <div class="form-field">
                <label class="form-label required">현장 도착 예정일시</label>
                <div class="input-with-clear">
                  <input
                    type="datetime-local"
                    v-model="formData.expectedArrivalAt"
                    class="form-input"
                  />
                  <button
                    type="button"
                    class="btn-clear-inline"
                    @click="formData.expectedArrivalAt = ''"
                    :disabled="!formData.expectedArrivalAt"
                    title="초기화"
                  >
                    초기화
                  </button>
                </div>
                <span class="field-hint datetime-hint">
                  <i class="fas fa-info-circle"></i>
                  날짜/시간 선택 후 달력 외부를 클릭하면 닫힙니다
                </span>
                <span v-if="errors.expectedArrivalAt" class="error-message">{{ errors.expectedArrivalAt }}</span>
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
                <label class="form-label required">우편번호</label>
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
                <span v-if="errors.zipcode" class="error-message">{{ errors.zipcode }}</span>
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
              <i class="fas fa-user-hard-hat"></i>
              <span>현장 인수자 정보</span>
            </div>
            <div class="form-grid">
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
                    :key="manager.userid"
                    :value="manager.userid"
                  >
                    {{ manager.userName }} ({{ manager.phone }})
                    <template v-if="manager.companyName"> - {{ manager.companyName }}</template>
                  </option>
                </select>
                <span v-if="errors.siteManagerId" class="error-message">{{ errors.siteManagerId }}</span>
                <span class="field-hint">
                  <i class="fas fa-info-circle"></i>
                  선택 시 인수자 정보가 자동 입력됩니다
                </span>
              </div>
              <div class="form-field">
                <label class="form-label">인수자명</label>
                <input
                  type="text"
                  v-model="formData.receiverName"
                  class="form-input"
                  placeholder="인수자명"
                />
              </div>
              <div class="form-field">
                <label class="form-label">인수자 연락처</label>
                <input
                  type="tel"
                  v-model="formData.receiverPhone"
                  class="form-input"
                  placeholder="010-0000-0000"
                  @input="handlePhoneInput"
                />
              </div>
            </div>
          </div>

          <!-- 경고 메시지 -->
          <div class="warning-box">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <strong>주의</strong>
              <p>발주서 생성 후에는 위 정보를 수정할 수 없습니다.</p>
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
            <i v-else class="fas fa-file-circle-plus"></i>
            {{ isSubmitting ? '생성 중...' : '발주서 생성' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { shipmentService } from '~/services/shipment.service'
import { formatPhoneNumber, formatPhoneNumberInput } from '~/utils/format'
import type { UserByRole } from '~/types/user'

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
  purchaseOrderDate: string
  expectedArrivalAt: string
  zipcode: string
  deliveryAddress: string
  addressDetail: string
  siteManagerId: number | null
  receiverName: string
  receiverPhone: string
  oemCompanyId: number | null  // OEM 제조사 ID
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
  (e: 'complete'): void
}>()

// State
const isSubmitting = ref(false)
const isPostalSearchOpen = ref(false)

const formData = reactive({
  purchaseOrderDate: '',
  expectedArrivalAt: '',
  zipcode: '',
  deliveryAddress: '',
  addressDetail: '',
  siteManagerId: null as number | null,
  receiverName: '',
  receiverPhone: ''
})

const errors = reactive({
  purchaseOrderDate: '',
  expectedArrivalAt: '',
  zipcode: '',
  deliveryAddress: '',
  siteManagerId: ''
})

// Computed
const canSubmit = computed(() => {
  return (
    formData.purchaseOrderDate !== '' &&
    formData.expectedArrivalAt !== '' &&
    formData.zipcode.trim() !== '' &&
    formData.deliveryAddress.trim() !== '' &&
    formData.siteManagerId !== null
  )
})

// Methods
const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

const initializeForm = () => {
  // 발주일자 기본값: 오늘
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  formData.purchaseOrderDate = props.initialData.purchaseOrderDate || todayStr
  formData.expectedArrivalAt = props.initialData.expectedArrivalAt || ''
  formData.zipcode = props.initialData.zipcode || ''
  formData.deliveryAddress = props.initialData.deliveryAddress || ''
  formData.addressDetail = props.initialData.addressDetail || ''
  formData.siteManagerId = props.initialData.siteManagerId || null
  formData.receiverName = props.initialData.receiverName || ''
  formData.receiverPhone = props.initialData.receiverPhone || ''

  // 에러 초기화
  errors.purchaseOrderDate = ''
  errors.expectedArrivalAt = ''
  errors.zipcode = ''
  errors.deliveryAddress = ''
  errors.siteManagerId = ''
}

// 현장소장 선택 시 인수자 정보 자동 입력
const handleSiteManagerChange = () => {
  if (formData.siteManagerId) {
    const manager = props.siteManagers.find(m => m.userid === formData.siteManagerId)
    if (manager) {
      formData.receiverName = manager.userName
      formData.receiverPhone = formatPhoneNumber(manager.phone || '')
    }
  }
}

// 연락처 입력 포맷팅
const handlePhoneInput = () => {
  formData.receiverPhone = formatPhoneNumberInput(formData.receiverPhone || '')
}

// 주소찾기 팝업 열기 (중복 방지)
const openPostalSearch = () => {
  // 이미 팝업이 열려있으면 무시
  if (isPostalSearchOpen.value) return

  isPostalSearchOpen.value = true

  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.zipcode = data.zonecode        // 우편번호
      formData.deliveryAddress = data.address  // 기본 주소
      formData.addressDetail = ''              // 상세주소 초기화
      isPostalSearchOpen.value = false
    },
    onclose: () => {
      // 팝업 닫힐 때 (취소 포함)
      isPostalSearchOpen.value = false
    }
  }).open()
}

// 유효성 검사
const validate = (): boolean => {
  let isValid = true

  // 발주일자 필수
  if (!formData.purchaseOrderDate) {
    errors.purchaseOrderDate = '발주일자를 선택하세요'
    isValid = false
  } else {
    errors.purchaseOrderDate = ''
  }

  // 현장 도착 예정일시 필수
  if (!formData.expectedArrivalAt) {
    errors.expectedArrivalAt = '현장 도착 예정일시를 선택하세요'
    isValid = false
  } else {
    errors.expectedArrivalAt = ''
  }

  // 우편번호 필수
  if (!formData.zipcode.trim()) {
    errors.zipcode = '우편번호를 입력하세요'
    isValid = false
  } else {
    errors.zipcode = ''
  }

  // 배송지 주소 필수
  if (!formData.deliveryAddress.trim()) {
    errors.deliveryAddress = '배송지 주소를 입력하세요'
    isValid = false
  } else {
    errors.deliveryAddress = ''
  }

  // 현장소장 필수
  if (!formData.siteManagerId) {
    errors.siteManagerId = '현장소장을 선택하세요'
    isValid = false
  } else {
    errors.siteManagerId = ''
  }

  return isValid
}

// 제출 처리
const handleSubmit = async () => {
  if (!validate() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    // 발주서 생성 API 호출 (생성만, 다운로드는 별도)
    const result = await shipmentService.generatePurchaseOrder(props.shipmentId, {
      orderDate: formData.purchaseOrderDate,
      expectedArrivalDatetime: formData.expectedArrivalAt,
      zipcode: formData.zipcode,
      deliveryAddress: formData.deliveryAddress,
      addressDetail: formData.addressDetail,
      siteManagerId: formData.siteManagerId!,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      oemCompanyId: props.initialData.oemCompanyId  // OEM 제조사 ID 추가
    })

    if (!result.success) {
      throw new Error(result.message)
    }

    // 완료 처리 (다운로드는 "발주서" 버튼 클릭 시 별도 수행)
    emit('complete')
  } catch (error) {
    console.error('발주서 생성 실패:', error)
    alert(error instanceof Error ? error.message : '발주서 생성에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    initializeForm()
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

.field-hint.datetime-hint {
  color: #2563eb;
  background: #eff6ff;
  padding: 0.375rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

/* 경고 박스 */
.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
}

.warning-box i {
  font-size: 1.25rem;
  color: #f59e0b;
  margin-top: 0.125rem;
}

.warning-box strong {
  display: block;
  margin-bottom: 0.25rem;
}

.warning-box p {
  margin: 0;
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
