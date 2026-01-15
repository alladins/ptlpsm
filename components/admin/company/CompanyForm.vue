<template>
  <form @submit.prevent="handleSubmit" class="company-form">
    <!-- 2열 레이아웃 -->
    <div class="form-two-column">
      <!-- 좌측 컬럼 -->
      <div class="left-column">
        <!-- 기본 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-building"></i>
            <span>기본 정보</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="회사명" required>
              <input
                type="text"
                v-model="formData.companyName"
                class="form-input"
                :class="{ 'error': errors.companyName }"
                :readonly="mode === 'view'"
                placeholder="회사명을 입력하세요"
              >
              <span v-if="errors.companyName" class="error-message">{{ errors.companyName }}</span>
            </FormField>

            <FormField label="대표자명" required>
              <input
                type="text"
                v-model="formData.representative"
                class="form-input"
                :class="{ 'error': errors.representative }"
                :readonly="mode === 'view'"
                placeholder="대표자명을 입력하세요"
              >
              <span v-if="errors.representative" class="error-message">{{ errors.representative }}</span>
            </FormField>

            <FormField label="설립일자">
              <input
                type="date"
                v-model="formData.establishedDate"
                class="form-input"
                :readonly="mode === 'view'"
              >
            </FormField>

            <FormField label="직원수">
              <input
                type="number"
                v-model.number="formData.employeeCount"
                class="form-input"
                :readonly="mode === 'view'"
                placeholder="직원수를 입력하세요"
                min="0"
              >
            </FormField>
          </div>
        </div>

        <!-- 사업자 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-contract"></i>
            <span>사업자 정보</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="사업자등록번호" required>
              <input
                type="text"
                v-model="formData.businessNumber"
                class="form-input"
                :class="{ 'error': errors.businessNumber }"
                :readonly="mode === 'view'"
                placeholder="123-45-67890"
                @input="handleBusinessNumberFormat"
              >
              <span v-if="errors.businessNumber" class="error-message">{{ errors.businessNumber }}</span>
            </FormField>

            <FormField label="나라장터등록번호">
              <input
                type="text"
                v-model="formData.g2bNumber"
                class="form-input"
                :class="{ 'error': errors.g2bNumber }"
                :readonly="mode === 'view'"
                placeholder="8자리 입력"
                maxlength="8"
              >
              <span v-if="errors.g2bNumber" class="error-message">{{ errors.g2bNumber }}</span>
            </FormField>

            <FormField label="업태">
              <input
                type="text"
                v-model="formData.businessType"
                class="form-input"
                :readonly="mode === 'view'"
                placeholder="제조업 / 기타 플라스틱 발포 성형제품 제조업"
              >
            </FormField>

            <FormField label="업종">
              <input
                type="text"
                v-model="formData.businessCategory"
                class="form-input"
                :readonly="mode === 'view'"
                placeholder="건축자재, 단열재(우레탄풀, 스펀레이폼)"
              >
            </FormField>
          </div>
        </div>

        <!-- 연락처 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-phone"></i>
            <span>연락처 정보</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="전화번호" required>
              <input
                type="text"
                v-model="formData.tel"
                class="form-input"
                :class="{ 'error': errors.tel }"
                :readonly="mode === 'view'"
                placeholder="02-1234-5678"
                @input="handlePhoneNumberFormat"
              >
              <span v-if="errors.tel" class="error-message">{{ errors.tel }}</span>
            </FormField>

            <FormField label="팩스번호">
              <input
                type="text"
                v-model="formData.fax"
                class="form-input"
                :class="{ 'error': errors.fax }"
                :readonly="mode === 'view'"
                placeholder="02-1234-5678"
                @input="handleFaxNumberFormat"
              >
              <span v-if="errors.fax" class="error-message">{{ errors.fax }}</span>
            </FormField>

            <FormField label="이메일">
              <input
                type="email"
                v-model="formData.email"
                class="form-input"
                :class="{ 'error': errors.email }"
                :readonly="mode === 'view'"
                placeholder="example@company.com"
              >
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </FormField>

            <FormField label="홈페이지">
              <input
                type="url"
                v-model="formData.homepage"
                class="form-input"
                :readonly="mode === 'view'"
                placeholder="https://example.com"
              >
            </FormField>
          </div>
        </div>
      </div>

      <!-- 우측 컬럼 -->
      <div class="right-column">
        <!-- 주소 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-map-marker-alt"></i>
            <span>주소 정보</span>
          </div>
          <div class="info-grid grid-1">
            <FormField label="우편번호">
              <div class="input-with-button">
                <input
                  type="text"
                  v-model="formData.zipCode"
                  class="form-input"
                  :readonly="true"
                  placeholder="17608"
                >
                <button
                  v-if="mode !== 'view'"
                  type="button"
                  class="btn-search"
                  @click="openPostalSearch"
                >
                  우편번호 검색
                </button>
              </div>
            </FormField>

            <FormField label="주소">
              <input
                type="text"
                v-model="formData.address"
                class="form-input"
                :readonly="true"
                placeholder="경기 안성시 서운면 서동로 21-10"
              >
            </FormField>

            <FormField label="상세주소">
              <input
                type="text"
                v-model="formData.detailAddress"
                class="form-input"
                :readonly="mode === 'view'"
                placeholder="상세주소를 입력하세요"
              >
            </FormField>
          </div>
        </div>

        <!-- 회사 직인 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-stamp"></i>
            <span>회사 직인</span>
          </div>
          <div class="seal-section">
            <div class="seal-upload-area">
              <!-- 업로드된 이미지 미리보기 (Base64) -->
              <div v-if="sealPreview" class="seal-preview">
                <img :src="sealPreview" alt="직인 미리보기">
                <button
                  v-if="mode !== 'view'"
                  type="button"
                  class="btn-remove"
                  @click="removeSealImage"
                  title="직인 이미지 제거"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <!-- 서버에서 불러온 기존 이미지 (URL) -->
              <div v-else-if="serverSealImageUrl" class="seal-preview">
                <UiSecureImage
                  :src="serverSealImageUrl"
                  alt="회사 직인"
                  class="seal-image"
                />
                <button
                  v-if="mode === 'edit'"
                  type="button"
                  class="btn-remove"
                  @click="removeSealImage"
                  title="직인 이미지 제거"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <!-- 이미지 없음 -->
              <div v-else class="seal-placeholder">
                <i class="fas fa-stamp"></i>
                <p>직인 이미지 없음</p>
              </div>
            </div>

            <div v-if="mode !== 'view'" class="seal-upload-controls">
              <input
                ref="sealFileInput"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                @change="handleSealImageUpload"
                style="display: none"
              >
              <button
                type="button"
                class="btn-upload"
                @click="triggerFileUpload"
              >
                <i class="fas fa-upload"></i>
                직인 이미지 업로드
              </button>
              <p class="upload-hint">PNG, JPG 형식, 최대 2MB</p>
            </div>

            <div v-if="formData.sealImageFileName" class="seal-info">
              <i class="fas fa-file-image"></i>
              <span>{{ formData.sealImageFileName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 버튼 영역 -->
    <div class="form-actions" v-if="mode !== 'view'">
      <button
        type="submit"
        class="btn-primary"
        :disabled="saving || (canWrite === false)"
        :title="canWrite === false ? (mode === 'create' ? '등록 권한이 없습니다' : '수정 권한이 없습니다') : ''"
      >
        <i v-if="saving" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-save"></i>
        {{ mode === 'create' ? '등록' : '수정' }}
      </button>
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        <i class="fas fa-times"></i>
        취소
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CompanyCreateRequest, CompanyInfoResponse } from '~/types/company'
import { formatBusinessNumberInput, formatPhoneNumberInput } from '~/utils/format'
import FormField from '~/components/admin/forms/FormField.vue'
import UiSecureImage from '~/components/ui/SecureImage.vue'
import { COMPANY_ENDPOINTS } from '~/services/api/endpoints/company.endpoints'

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

interface Props {
  mode: 'view' | 'create' | 'edit'
  initialData?: CompanyInfoResponse
  canWrite?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: [data: CompanyCreateRequest]
  cancel: []
}>()

// 폼 데이터
const formData = ref<CompanyCreateRequest>({
  companyName: '',
  businessNumber: '',
  g2bNumber: '',
  representative: '',
  address: '',
  detailAddress: '',
  zipCode: '',
  tel: '',
  fax: '',
  email: '',
  homepage: '',
  establishedDate: '',
  employeeCount: 0,
  annualSales: 0,
  businessType: '',
  businessCategory: '',
  sealImage: undefined,
  sealImageFileName: undefined
})

// 에러 메시지
const errors = ref<Record<string, string>>({})

// 저장 중 상태
const saving = ref(false)

// 직인 이미지 미리보기
const sealPreview = ref<string>('')
const serverSealImageUrl = ref<string>('')
const sealFileInput = ref<HTMLInputElement | null>(null)

// initialData 변경 시 formData 업데이트
watch(() => props.initialData, (newData) => {
  if (newData) {
    formData.value = {
      companyName: newData.companyName,
      businessNumber: newData.businessNumber,
      g2bNumber: newData.g2bNumber || '',
      representative: newData.representative,
      address: newData.address,
      detailAddress: newData.detailAddress || '',
      zipCode: newData.zipCode,
      tel: newData.tel,
      fax: newData.fax || '',
      email: newData.email,
      homepage: newData.homepage || '',
      establishedDate: newData.establishedDate,
      employeeCount: newData.employeeCount || 0,
      annualSales: newData.annualSales || 0,
      businessType: newData.businessType,
      businessCategory: newData.businessCategory,
      sealImageFileName: newData.sealImageFileName || undefined
    }

    // 기존 직인 이미지 URL 설정 (편집/조회 모드)
    // sealImagePath로 존재 여부 판단, API 엔드포인트 URL 생성
    if (newData.id && newData.sealImagePath) {
      serverSealImageUrl.value = COMPANY_ENDPOINTS.sealImage(newData.id)
    } else {
      serverSealImageUrl.value = ''
    }

    // sealPreview는 초기화 (업로드 시에만 사용)
    sealPreview.value = ''
  }
}, { immediate: true })

// 사업자등록번호 포맷팅 (공통 함수 사용)
const handleBusinessNumberFormat = (event: Event) => {
  const input = event.target as HTMLInputElement
  formData.value.businessNumber = formatBusinessNumberInput(input.value)
}

// 전화번호 포맷팅 (공통 함수 사용)
const handlePhoneNumberFormat = (event: Event) => {
  const input = event.target as HTMLInputElement
  formData.value.tel = formatPhoneNumberInput(input.value)
}

// 팩스번호 포맷팅 (공통 함수 사용)
const handleFaxNumberFormat = (event: Event) => {
  const input = event.target as HTMLInputElement
  formData.value.fax = formatPhoneNumberInput(input.value)
}

// 직인 이미지 업로드
const handleSealImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // 파일 타입 검증
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
  if (!validTypes.includes(file.type)) {
    alert('PNG 또는 JPG 형식의 이미지만 업로드 가능합니다.')
    input.value = ''
    return
  }

  // 파일 크기 검증 (2MB)
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    alert('이미지 파일 크기는 2MB를 초과할 수 없습니다.')
    input.value = ''
    return
  }

  try {
    // Base64 변환
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      formData.value.sealImage = base64
      formData.value.sealImageFileName = file.name
      sealPreview.value = base64
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('이미지 변환 오류:', error)
    alert('이미지 업로드 중 오류가 발생했습니다.')
  }
}

// 직인 이미지 제거
const removeSealImage = () => {
  formData.value.sealImage = undefined
  formData.value.sealImageFileName = undefined
  sealPreview.value = ''
  serverSealImageUrl.value = ''
  if (sealFileInput.value) {
    sealFileInput.value.value = ''
  }
}

// 파일 업로드 트리거
const triggerFileUpload = () => {
  if (sealFileInput.value) {
    sealFileInput.value.click()
  }
}

// 우편번호 검색 (Daum Postcode API)
const openPostalSearch = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.value.zipCode = data.zonecode
      formData.value.address = data.address
      formData.value.detailAddress = ''
    }
  }).open()
}

// 폼 검증
const validateForm = (): boolean => {
  let isValid = true
  errors.value = {}

  // 나라장터등록번호 (선택, 입력 시 8자리)
  if (formData.value.g2bNumber && formData.value.g2bNumber.length !== 8) {
    errors.value.g2bNumber = '나라장터등록번호는 8자리여야 합니다.'
    isValid = false
  }

  // 회사명 (필수)
  if (!formData.value.companyName) {
    errors.value.companyName = '회사명을 입력해주세요.'
    isValid = false
  }

  // 사업자등록번호 (필수, 형식 검증)
  if (!formData.value.businessNumber) {
    errors.value.businessNumber = '사업자등록번호를 입력해주세요.'
    isValid = false
  } else if (!/^\d{3}-\d{2}-\d{5}$/.test(formData.value.businessNumber)) {
    errors.value.businessNumber = '올바른 사업자등록번호 형식이 아닙니다.'
    isValid = false
  }

  // 대표자명 (필수)
  if (!formData.value.representative) {
    errors.value.representative = '대표자명을 입력해주세요.'
    isValid = false
  }

  // 전화번호 (필수, 형식 검증)
  const phonePattern = /^(02|\d{3})-\d{3,4}-\d{4}$/
  if (!formData.value.tel) {
    errors.value.tel = '전화번호를 입력해주세요.'
    isValid = false
  } else if (!phonePattern.test(formData.value.tel)) {
    errors.value.tel = '올바른 전화번호 형식이 아닙니다.'
    isValid = false
  }

  // 팩스번호 (선택, 입력 시 형식 검증)
  if (formData.value.fax && !phonePattern.test(formData.value.fax)) {
    errors.value.fax = '올바른 팩스번호 형식이 아닙니다.'
    isValid = false
  }

  return isValid
}

// 폼 제출
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', formData.value)
  }
}

// 외부에서 saving 상태 제어 가능하도록 expose
defineExpose({
  setSaving: (value: boolean) => { saving.value = value }
})
</script>

<style scoped>
/* Import common CSS files */
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-forms.css';
@import '@/assets/css/admin-buttons.css';

/* ===== Company Form Specific Styles ===== */

/* Form container */
.company-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Two-column layout */
.form-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Input with button (for postal code search) */
.input-with-button {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.input-with-button input {
  flex: 1;
}

/* ===== Seal Image Section (Component-specific) ===== */
.seal-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.9rem;
}

.seal-upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 6px;
  border: 2px dashed #d1d5db;
}

.seal-preview {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.seal-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  background-color: white;
  border: 2px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.seal-preview .btn-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  padding: 0;
  background-color: #ef4444;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  font-size: 10px;
}

.seal-preview .btn-remove:hover {
  background-color: #dc2626;
  transform: scale(1.1);
}

.seal-placeholder {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  color: #9ca3af;
}

.seal-placeholder i {
  font-size: 28px;
  margin-bottom: 0.375rem;
  opacity: 0.5;
}

.seal-placeholder p {
  font-size: 11px;
  font-weight: 500;
  margin: 0;
}

.seal-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.upload-hint {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin: 0;
}

.seal-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f0f9ff;
  border-left: 3px solid #3b82f6;
  border-radius: 0.375rem;
}

.seal-info i {
  color: #3b82f6;
  font-size: 14px;
}

.seal-info span {
  font-size: 12px;
  color: #1e40af;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 1.25rem;
  margin-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

/* ===== Responsive Design ===== */
@media (max-width: 1024px) {
  .form-two-column {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .seal-upload-area {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
