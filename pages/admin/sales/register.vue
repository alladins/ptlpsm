<template>
  <div class="sales-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="영업 등록"
      icon="chart"
      icon-color="blue"
      description="새로운 영업 정보를 등록합니다."
    />

    <div class="content-section">
      <!-- 진척도 스텝퍼 (상단 고정) -->
      <div class="stepper-section">
        <SalesProgressStepper v-model="formData.salesStatus" />
      </div>

      <form class="edit-form" @submit.prevent="handleSubmit">
        <!-- 고객 정보 (펼침) -->
        <AccordionSection title="고객 정보" :default-expanded="true">
          <div class="info-grid grid-2">
            <FormField label="수요기관" required :error="errors.dminsttCd">
              <DemandOrganizationSelector
                v-model="formData.dminsttCd"
                @organization-selected="handleOrganizationSelected"
              />
            </FormField>

            <FormField label="담당자명" required :error="errors.customerNm">
              <div class="input-with-card-btn">
                <input
                  v-model="formData.customerNm"
                  type="text"
                  class="form-input"
                  placeholder="담당자명을 입력하세요"
                >
                <BusinessCardSelector
                  :dminstt-cd="formData.dminsttCd"
                  @card-selected="handleCardSelected"
                />
              </div>
            </FormField>

            <FormField label="담당자연락처" :error="errors.customerTel">
              <input
                v-model="formData.customerTel"
                type="tel"
                class="form-input"
                placeholder="010-1234-5678"
                @input="handlePhoneInput"
                @blur="validateField('customerTel', formData.customerTel, phoneRules)"
              >
            </FormField>

            <FormField label="담당자이메일" :error="errors.customerEmail">
              <input
                v-model="formData.customerEmail"
                type="email"
                class="form-input"
                placeholder="example@company.com"
                @blur="validateField('customerEmail', formData.customerEmail, emailRules)"
              >
            </FormField>
          </div>
        </AccordionSection>

        <!-- 영업 기본 정보 (펼침) -->
        <AccordionSection title="영업 기본 정보" :default-expanded="true">
          <div class="info-grid grid-2">
            <FormField label="사업명" required :error="errors.salesTitle" full-width>
              <input
                v-model="formData.salesTitle"
                type="text"
                class="form-input"
                placeholder="사업명을 입력하세요"
              >
            </FormField>

            <FormField label="사업내용" full-width>
              <textarea
                v-model="formData.salesContent"
                class="form-textarea"
                placeholder="사업내용을 입력하세요"
                rows="2"
              />
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
        </AccordionSection>

        <!-- 첫 활동 기록 (펼침) -->
        <AccordionSection title="첫 활동 기록" :default-expanded="true">
          <div class="activity-form">
            <div class="info-grid grid-2">
              <FormField label="활동일자" required>
                <input v-model="firstActivity.activityDate" type="date" class="form-input">
              </FormField>
              <FormField label="방문목적">
                <select v-model="firstActivity.visitPurpose" class="form-select">
                  <option value="">
                    선택하세요
                  </option>
                  <option v-for="opt in visitPurposeOptions" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </FormField>
              <FormField label="활동유형">
                <select v-model="firstActivity.activityType" class="form-select">
                  <option value="">
                    선택하세요
                  </option>
                  <option v-for="opt in activityTypeOptions" :key="opt" :value="opt">
                    {{ opt }}
                  </option>
                </select>
              </FormField>
              <FormField label="다음 액션 예정일">
                <input v-model="firstActivity.nextActionDate" type="date" class="form-input">
              </FormField>
              <FormField label="활동내용" required full-width>
                <textarea v-model="firstActivity.activityContent" class="form-textarea" placeholder="활동 내용을 입력하세요" rows="3" />
              </FormField>
              <FormField label="다음 액션" full-width>
                <input v-model="firstActivity.nextAction" type="text" class="form-input" placeholder="다음 예정 액션을 입력하세요">
              </FormField>
            </div>

            <!-- 계약 정보 (조건부) -->
            <div v-if="showContractFields" class="contract-section">
              <div class="contract-section-header">
                <i class="fas fa-file-contract" />
                <span>계약 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="계약금액">
                  <div class="contract-amount-wrapper">
                    <input
                      :value="firstActivity.contractAmount ? firstActivity.contractAmount.toLocaleString() : ''"
                      type="text"
                      class="form-input text-right"
                      placeholder="계약금액"
                      @input="handleFirstActivityAmountInput"
                    >
                    <span v-if="firstActivity.contractAmount" class="input-suffix">원</span>
                  </div>
                </FormField>
                <FormField label="계약일자">
                  <input v-model="firstActivity.contractDate" type="date" class="form-input">
                </FormField>
                <FormField label="예상납품요구일">
                  <input v-model="formData.expectedDeliveryDate" type="date" class="form-input">
                </FormField>
                <FormField label="예상납품기한">
                  <input v-model="formData.expectedDeliveryDeadline" type="date" class="form-input">
                </FormField>
                <FormField label="계약 메모" full-width>
                  <textarea v-model="firstActivity.contractNote" class="form-textarea" placeholder="계약 관련 메모를 입력하세요" rows="2" />
                </FormField>
              </div>
            </div>
          </div>
        </AccordionSection>

        <!-- 계약서 파일 (조건부) -->
        <AccordionSection
          v-if="showContractFields"
          title="계약서 파일"
          :summary="selectedFile ? selectedFile.name : ''"
          :default-expanded="false"
        >
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
                style="display: none"
                @change="handleFileSelect"
              >
              <div class="upload-content">
                <i class="fas fa-cloud-upload-alt" />
                <p>PDF 파일을 드래그하거나 클릭하여 업로드하세요</p>
                <p class="upload-hint">
                  최대 20MB, PDF 파일만 가능
                </p>
              </div>
            </div>
            <div v-if="selectedFile" class="selected-file">
              <i class="fas fa-file-pdf" />
              <span>{{ selectedFile.name }}</span>
              <button type="button" class="remove-file-btn" @click="removeFile">
                <i class="fas fa-times" />
              </button>
            </div>
          </div>
        </AccordionSection>

        <!-- 버튼 영역 -->
        <div class="form-actions">
          <div />
          <div class="form-actions-right">
            <button type="button" class="btn-secondary" :disabled="submitting" @click="handleReset">
              초기화
            </button>
            <button type="button" class="btn-secondary" :disabled="submitting" @click="goBack">
              목록
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="submitting || !canWrite"
              :title="!canWrite ? '등록 권한이 없습니다' : ''"
            >
              {{ submitting ? '등록 중...' : '등록' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from '#imports'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { usePermission } from '~/composables/usePermission'
import { formatPhoneNumberInput } from '~/utils/format'
import { salesService, type SalesRequest } from '~/services/sales.service'
import { salesActivityService } from '~/services/sales-activity.service'
import { type DemandOrganization } from '~/services/demand-organization.service'
import { type SalesActivityRequest, VISIT_PURPOSE_OPTIONS, ACTIVITY_TYPE_OPTIONS } from '~/types/sales'
import BusinessCardSelector from '~/components/admin/BusinessCardSelector.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import AccordionSection from '~/components/admin/forms/AccordionSection.vue'
import SalesProgressStepper from '~/components/admin/SalesProgressStepper.vue'
import { useSalesStatus } from '~/composables/useSalesStatus'
import { type BusinessCardResponse } from '~/services/business-card.service'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 등록'
})

const router = useRouter()

// 권한
const { canWrite } = usePermission()

// 옵션 데이터
const visitPurposeOptions = VISIT_PURPOSE_OPTIONS
const activityTypeOptions = ACTIVITY_TYPE_OPTIONS

// 첫 활동 기록
const today = new Date().toISOString().split('T')[0]
const firstActivity = ref<SalesActivityRequest>({
  activityDate: today,
  visitPurpose: '신규영업',
  activityType: '방문',
  activityContent: '',
  nextAction: '',
  nextActionDate: '',
  contractAmount: undefined,
  contractDate: '',
  contractNote: ''
})

// 기본값 정의
const defaultFormData: SalesRequest = {
  customerNm: '',
  customerTel: '',
  customerEmail: '',
  salesTitle: '',
  salesContent: '',
  contractAmount: undefined,
  salesStatus: '초기접촉',
  expectedDeliveryDate: '',
  expectedDeliveryDeadline: '',
  dminsttCd: '',
  dminsttNm: '',
  remark: ''
}

// useRegisterForm composable 사용
const { formData, submitting, submit, goBack, reset } = useRegisterForm<SalesRequest, SalesRequest, any>({
  createFunction: async (data) => {
    // 영업 정보 등록
    const createdSales = await salesService.createSales(data)

    // 첫 활동 기록 등록
    if (createdSales.id && firstActivity.value.activityContent) {
      await salesActivityService.createActivity(createdSales.id, firstActivity.value)
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

// 계약 필드 조건부 표시
const showContractFields = computed(() => {
  const statusMatch = ['계약협상', '계약완료', '납품완료'].includes(formData.salesStatus || '')
  const purposeMatch = ['계약협상', '계약체결'].includes(firstActivity.value.visitPurpose || '')
  return statusMatch || purposeMatch
})

// 진척도 ↔ 방문목적 양방향 연동
const isAutoSyncing = ref(false)

const statusToPurposeMap: Record<string, string> = {
  계약협상: '계약협상',
  계약완료: '계약체결',
  납품완료: '납품협의'
}

const purposeToStatusMap: Record<string, string> = {
  계약협상: '계약협상',
  계약체결: '계약완료',
  납품협의: '납품완료'
}

watch(() => formData.salesStatus, (newStatus) => {
  if (isAutoSyncing.value || !newStatus) { return }
  const mapped = statusToPurposeMap[newStatus as string]
  if (mapped) {
    isAutoSyncing.value = true
    firstActivity.value.visitPurpose = mapped
    nextTick(() => { isAutoSyncing.value = false })
  }
})

watch(() => firstActivity.value.visitPurpose, (newPurpose) => {
  if (isAutoSyncing.value || !newPurpose) { return }
  const mapped = purposeToStatusMap[newPurpose as string]
  if (mapped) {
    isAutoSyncing.value = true
    formData.salesStatus = mapped
    nextTick(() => { isAutoSyncing.value = false })
  }
})

// 파일 업로드
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()

// 상태 코드 로드
const { loadStatusCodes } = useSalesStatus()
onMounted(async () => {
  await loadStatusCodes()
})

// 수요기관 선택
const handleOrganizationSelected = (organization: DemandOrganization) => {
  formData.dminsttCd = organization.dminsttCd
  formData.dminsttNm = organization.dminsttNm
}

// 명함 선택 → 수요기관 + 담당자 정보 자동 채움
const handleCardSelected = (card: BusinessCardResponse) => {
  if (card.dminsttCd) {
    formData.dminsttCd = card.dminsttCd
    formData.dminsttNm = card.dminsttNm || ''
  }
  formData.customerNm = card.contactNm || ''
  formData.customerTel = card.contactTel || ''
  formData.customerEmail = card.contactEmail || ''
}

// 전화번호 입력 처리
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  formData.customerTel = formatPhoneNumberInput(target.value)
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
  if (file.size > 10 * 1024 * 1024) {
    alert('파일 크기는 10MB를 초과할 수 없습니다.')
    return
  }

  const validPdfTypes = ['application/pdf', 'application/x-pdf', 'application/acrobat', 'application/octet-stream']
  const isValidPdf = validPdfTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')

  if (!isValidPdf) {
    alert('PDF 파일만 업로드 가능합니다.')
    return
  }

  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 폼 제출
const handleSubmit = async () => {
  clearErrors()

  const validationRules = {
    customerNm: [rules.required('담당자명')],
    salesTitle: [rules.required('사업명')],
    dminsttCd: [rules.required('수요기관')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  if (errors.customerTel || errors.customerEmail) {
    return
  }

  await submit()
}

// 첫 활동 계약금액 입력 처리
const handleFirstActivityAmountInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const numericValue = target.value.replace(/,/g, '')
  const parsed = parseInt(numericValue) || 0
  firstActivity.value.contractAmount = parsed > 0 ? parsed : undefined
}

// 초기화
const handleReset = () => {
  reset()
  selectedFile.value = null
  clearErrors()
  firstActivity.value = {
    activityDate: today,
    visitPurpose: '신규영업',
    activityType: '방문',
    activityContent: '',
    nextAction: '',
    nextActionDate: '',
    contractAmount: undefined,
    contractDate: '',
    contractNote: ''
  }
}
</script>

<style scoped>
.sales-register {
  padding: 0;
}

.stepper-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-form {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  padding: 1rem;
}

.contract-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #93c5fd;
}

.contract-section-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #16a34a;
}

.contract-section-header i {
  font-size: 0.9rem;
}

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

.input-with-card-btn {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.input-with-card-btn .form-input {
  flex: 1;
}

/* 버튼 영역 */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.form-actions-right {
  display: flex;
  gap: 0.5rem;
}

.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  border: 1px solid;
}

.btn-primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #fff;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
