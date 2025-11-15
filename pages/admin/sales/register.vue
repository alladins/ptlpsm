<template>
  <div class="sales-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="영업 등록"
      description="새로운 영업 정보를 등록합니다."
    >
      <template #actions>
        <button type="button" @click="handleReset" class="btn-action btn-secondary" :disabled="submitting">
          <i class="fas fa-undo"></i>
          초기화
        </button>
        <button type="button" @click="goBack" class="btn-action btn-secondary" :disabled="submitting">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button @click="handleSubmit" class="btn-action btn-primary" :disabled="submitting">
          <i class="fas fa-check"></i>
          {{ submitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <form @submit.prevent="handleSubmit" class="register-form">
        <!-- 영업 정보 섹션 -->
        <FormSection title="영업 정보">
          <!-- 1. 고객 정보 -->
          <div class="info-group">
            <div class="info-group-header">
              <i class="fas fa-user"></i>
              <span>고객 정보</span>
            </div>
            <div class="info-grid grid-2">
              <FormField label="수요기관" required :error="errors.dminsttCd">
                <DemandOrganizationSelector
                  v-model="formData.dminsttCd"
                  @organization-selected="handleOrganizationSelected"
                />
              </FormField>

              <FormField label="담당자명" required :error="errors.customerNm">
                <input
                  v-model="formData.customerNm"
                  type="text"
                  class="form-input"
                  placeholder="담당자명을 입력하세요"
                />
              </FormField>

              <FormField label="담당자연락처" :error="errors.customerTel">
                <input
                  v-model="formData.customerTel"
                  type="tel"
                  class="form-input"
                  placeholder="010-1234-5678"
                  @input="handlePhoneInput"
                  @blur="validateField('customerTel', formData.customerTel, phoneRules)"
                />
              </FormField>

              <FormField label="담당자이메일" :error="errors.customerEmail">
                <input
                  v-model="formData.customerEmail"
                  type="email"
                  class="form-input"
                  placeholder="example@company.com"
                  @blur="validateField('customerEmail', formData.customerEmail, emailRules)"
                />
              </FormField>
            </div>
          </div>

          <!-- 2. 영업 기본 정보 -->
          <div class="info-group">
            <div class="info-group-header">
              <i class="fas fa-briefcase"></i>
              <span>영업 기본 정보</span>
            </div>
            <div class="info-grid grid-2">
              <FormField label="사업명" required :error="errors.salesTitle" full-width>
                <input
                  v-model="formData.salesTitle"
                  type="text"
                  class="form-input"
                  placeholder="사업명을 입력하세요"
                />
              </FormField>

              <FormField label="사업내용" full-width>
                <textarea
                  v-model="formData.salesContent"
                  class="form-textarea"
                  placeholder="사업내용을 입력하세요"
                  rows="2"
                />
              </FormField>

              <FormField label="영업상태">
                <select v-model="formData.salesStatus" class="form-select">
                  <option value="">선택하세요</option>
                  <option v-for="option in salesStatusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </FormField>
            </div>
          </div>

          <!-- 3. 계약 정보 -->
          <div class="info-group">
            <div class="info-group-header">
              <i class="fas fa-file-contract"></i>
              <span>계약 정보</span>
            </div>
            <div class="info-grid grid-3">
              <FormField label="예상납품요구일">
                <input
                  v-model="formData.expectedDeliveryDate"
                  type="date"
                  class="form-input"
                />
              </FormField>

              <FormField label="예상납품기한">
                <input
                  v-model="formData.expectedDeliveryDeadline"
                  type="date"
                  class="form-input"
                />
              </FormField>

              <FormField label="계약금액">
                <div class="contract-amount-wrapper">
                  <input
                    :value="formData.contractAmount ? formData.contractAmount.toLocaleString() : ''"
                    @input="handleContractAmountInput"
                    type="text"
                    class="form-input text-right"
                    placeholder="계약금액을 입력하세요"
                  />
                  <span v-if="formData.contractAmount" class="input-suffix">원</span>
                </div>
              </FormField>

              <FormField label="비고" full-width>
                <textarea
                  v-model="formData.remark"
                  class="form-textarea"
                  placeholder="비고를 입력하세요"
                  rows="2"
                />
              </FormField>
            </div>
          </div>

          <!-- 4. 금액 정보 -->
          <div class="info-group amount-group">
            <div class="info-group-header">
              <i class="fas fa-won-sign"></i>
              <span>금액 정보</span>
            </div>
            <div class="amount-display">
              <div class="amount-item">
                <label>품목총액</label>
                <span>{{ (totalItemsAmount || 0).toLocaleString() }}원</span>
              </div>
              <span class="amount-operator">=</span>
              <div class="amount-item total">
                <label>계약금액</label>
                <span>{{ (formData.contractAmount || 0).toLocaleString() }}원</span>
              </div>
            </div>
          </div>
        </FormSection>

        <!-- 품목 관리 섹션 -->
        <FormSection title="품목 등록">
          <ItemsManager
            :items="items"
            :show-delivery-date="false"
            @add-item="addItem"
            @add-item-with-selector="addItemWithSelector"
            @remove-item="removeItem"
            @open-selector="openItemSelector"
            @calculate-amount="calculateItemAmount"
          >
            <template #item-selector>
              <ItemSkuSelector
                v-model="showItemSelector"
                @sku-selected="handleSkuSelected"
              />
            </template>
          </ItemsManager>
        </FormSection>

        <!-- 계약서 파일 섹션 -->
        <FormSection title="계약서 파일">
          <div class="file-upload-wrapper">
            <div
              class="file-upload-area"
              @click="triggerFileUpload"
              @drop.prevent="handleFileDrop"
              @dragover.prevent
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf"
                @change="handleFileSelect"
                style="display: none"
              />
              <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>PDF 파일을 드래그하거나 클릭하여 업로드하세요</p>
                <p class="upload-hint">최대 20MB, PDF 파일만 가능</p>
              </div>
            </div>
            <div v-if="selectedFile" class="selected-file">
              <i class="fas fa-file-pdf"></i>
              <span>{{ selectedFile.name }}</span>
              <button type="button" @click="removeFile" class="remove-file-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </FormSection>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { useItemManagement } from '~/composables/admin/useItemManagement'
import { formatPhoneNumberInput } from '~/utils/format'
import { salesService, type SalesRequest } from '~/services/sales.service'
import { type DemandOrganization } from '~/services/demand-organization.service'
import { type SalesItemRequest } from '~/types/sales'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ItemsManager from '~/components/admin/forms/ItemsManager.vue'
import { useSalesStatus } from '~/composables/useSalesStatus'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 등록'
})

const router = useRouter()

// 기본값 정의
const defaultFormData: SalesRequest = {
  customerNm: '',
  customerTel: '',
  customerEmail: '',
  salesTitle: '',
  salesContent: '',
  contractAmount: undefined,
  salesStatus: '진행중',
  expectedDeliveryDate: '',
  expectedDeliveryDeadline: '',
  dminsttCd: '',
  dminsttNm: '',
  remark: ''
}

// useRegisterForm composable 사용
const { formData, submitting, submit, goBack, reset } = useRegisterForm<SalesRequest, SalesRequest, any>({
  createFunction: async (data) => {
    console.log('📝 등록폼 제출 데이터:', data)

    // 영업 정보 등록
    const createdSales = await salesService.createSales(data)

    // 품목 등록
    if (items.value.length > 0 && createdSales.id) {
      console.log('📦 품목 데이터 등록 시작:', items.value)
      for (const item of items.value) {
        if (item.itemName && item.unitPrice && item.quantity) {
          try {
            const itemRequest: SalesItemRequest = {
              skuId: item.skuId,
              itemId: item.itemId,
              itemName: item.itemName,
              skuName: item.skuName || '',
              itemSpecification: item.itemSpecification || '',
              unit: item.unit || '',
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              sortOrder: item.sortOrder || 0
            }
            await salesService.addSalesItem(createdSales.id, itemRequest)
            console.log('✅ 품목 등록 성공:', item.itemName)
          } catch (error) {
            console.error('❌ 품목 등록 실패:', item.itemName, error)
          }
        }
      }
    }

    // 파일 업로드
    if (selectedFile.value && createdSales.id) {
      await salesService.uploadContractFile(createdSales.id, selectedFile.value)
    }

    return createdSales
  },
  successRoute: '/admin/sales/list',
  defaultValues: defaultFormData,
  onCreateSuccess: () => {
    alert('영업 정보가 성공적으로 등록되었습니다.')
  },
  onCreateError: (error) => {
    console.error('영업 등록 오류:', error)
    alert('영업 등록에 실패했습니다.')
  }
})

// 검증 composable
const { errors, validateField, validateAll, clearErrors, rules } = useFormValidation({
  customerNm: '',
  salesTitle: '',
  dminsttCd: '',
  customerTel: '',
  customerEmail: ''
})

// 검증 규칙
const phoneRules = [rules.phone()]
const emailRules = [rules.email()]

// 품목 관리 composable
const {
  items,
  showItemSelector,
  currentItemIndex,
  addItem,
  addItemWithSelector,
  removeItem,
  openItemSelector,
  handleSkuSelected,
  calculateItemAmount,
  totalItemsAmount
} = useItemManagement({
  autoCalculate: true,
  duplicateCheckField: 'skuId'
})

// 품목 총액 변경 시 계약금액 자동 업데이트
watch(totalItemsAmount, (newAmount) => {
  console.log('💰 품목 총액 변경 감지:', newAmount)
  formData.contractAmount = newAmount
}, { immediate: false })

// 파일 업로드
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

// 옵션 데이터 (DB 기반)
const { statusOptions: salesStatusOptions, loadStatusCodes } = useSalesStatus()

// 상태 코드 로드
onMounted(async () => {
  await loadStatusCodes()
})

// 수요기관 선택
const handleOrganizationSelected = (organization: DemandOrganization) => {
  console.log('🏢 수요기관 선택됨:', organization)
  formData.dminsttCd = organization.dminsttCd
  formData.dminsttNm = organization.dminsttNm
}

// 전화번호 입력 처리 (공통 함수 사용 - 길이 제한 포함)
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  formData.customerTel = formatPhoneNumberInput(target.value)
}

// 계약금액 입력 처리 (쉼표 제거 후 숫자로 변환)
const handleContractAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0
  formData.contractAmount = parsed > 0 ? parsed : undefined
}

// 파일 업로드 처리
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    validateAndSetFile(event.dataTransfer.files[0])
  }
}

const validateAndSetFile = (file: File) => {
  // 파일 크기 검증 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB를 초과할 수 없습니다.')
    return
  }

  // PDF 파일 검증
  const validPdfTypes = ['application/pdf', 'application/x-pdf', 'application/acrobat', 'application/octet-stream']
  const isValidPdf = validPdfTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')

  if (!isValidPdf) {
    alert('PDF 파일만 업로드 가능합니다.')
    return
  }

  selectedFile.value = file
  formData.salesStatus = '완료'
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 폼 제출
const handleSubmit = async () => {
  // 검증
  clearErrors()

  const validationRules = {
    customerNm: [rules.required('담당자명')],
    salesTitle: [rules.required('사업명')],
    dminsttCd: [rules.required('수요기관')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  // 실시간 검증된 에러 확인
  if (errors.customerTel || errors.customerEmail) {
    return
  }

  await submit()
}

// 초기화
const handleReset = () => {
  reset()
  items.value = []
  selectedFile.value = null
  clearErrors()
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: amount-group, amount-display, amount-item, amount-operator
 * - admin-forms.css: form-input-*, info-group, info-grid
 * - admin-common.css: file-upload-wrapper, file-upload-area, upload-content, selected-file, remove-file-btn
 */

/* Page-specific: Sales register layout */
.sales-register {
  padding: 0;
}

.content-section {
  background: transparent;
  border-radius: 0;
  padding: 0;
  padding-left: 2rem;
  padding-bottom: 0;
  margin-top: -1rem;
  margin-bottom: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Page-specific: Custom amount group gradient (yellow for sales) */
.amount-group {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

/* Page-specific: Contract amount input with suffix */
.contract-amount-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.contract-amount-wrapper .input-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
  font-size: 0.875rem;
}

/* Page-specific: Form section spacing */
.register-form > :deep(.form-section:first-child) {
  margin-bottom: 0.6rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
}
</style>
