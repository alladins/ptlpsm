<template>
  <div class="order-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="납품요구관리 - 분할납품요구서 등록"
      description="발주서 PDF를 업로드하여 분할납품요구서 정보를 등록합니다."
    >
      <template #actions>
        <input
          type="file"
          ref="fileInput"
          accept=".pdf"
          @change="handleFileUpload"
          style="display: none"
        >
        <button class="btn-secondary" @click="triggerFileUpload">
          <i class="fas fa-file-pdf"></i>
          PDF 업로드
        </button>
      </template>
    </PageHeader>

    <!-- 업로드 상태 표시 -->
    <div v-if="uploadStatus" class="upload-status">
      <div v-if="uploadStatus.loading" class="status-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <span>{{ uploadStatus.message }}</span>
      </div>
      <div v-else-if="uploadStatus.success" class="status-success">
        <i class="fas fa-check-circle"></i>
        <span>{{ uploadStatus.message }}</span>
        <button class="status-close" @click="uploadStatus = null">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div v-else-if="uploadStatus.error" class="status-error">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ uploadStatus.message }}</span>
        <button class="status-close" @click="uploadStatus = null">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div class="content-section">
      <!-- 계약 정보 입력 폼 -->
      <FormSection title="분할납품요구서 정보">
        <!-- 1. 계약 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-file-alt"></i>
            <span>계약 정보</span>
          </div>
          <div class="info-grid grid-5">
            <FormField label="계약번호" required>
              <input type="text" v-model="contractForm.contractNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="계약일자" required>
              <input type="text" v-model="contractForm.contractDate" class="form-input-sm" readonly>
            </FormField>
            <FormField label="선고지번호">
              <input type="text" v-model="contractForm.preNotificationNo" class="form-input-xs" readonly>
            </FormField>
            <FormField label="납품요구번호" required>
              <input type="text" v-model="contractForm.deliveryRequestNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="납품요구일자" required>
              <input type="text" v-model="contractForm.deliveryRequestDate" class="form-input-sm" readonly>
            </FormField>
          </div>
          <div class="info-group-header">
            <i class="fas fa-file-contract"></i>
            <span>계약 상세</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="나라장터번호">
              <input type="text" v-model="contractForm.naraJangteoNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="지급방법">
              <input type="text" v-model="contractForm.paymentMethod" class="form-input-sm" readonly>
            </FormField>
            <FormField label="사업명" grid-2 required>
              <input type="text" v-model="contractForm.projectName" class="form-input-md" style="width: 370px" readonly>
            </FormField>
          </div>
        </div>

        <!-- 2. 수요기관 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-building"></i>
            <span>수요기관 정보</span>
          </div>
          <div class="info-grid grid-4">
            <FormField label="수요기관명" required>
              <input type="text" v-model="contractForm.client" class="form-input-md" readonly>
            </FormField>
            <FormField label="기관번호">
              <input type="text" v-model="contractForm.clientNo" class="form-input-sm" readonly>
            </FormField>
            <FormField label="우편번호">
              <input type="text" v-model="contractForm.clientPostalCode" class="form-input-sm" readonly>
            </FormField>
            <FormField label="주소" full-width>
              <input type="text" v-model="contractForm.clientAddress" class="form-input-lg" readonly>
            </FormField>
            <FormField label="전화번호">
              <input type="text" v-model="contractForm.clientPhoneNumber" class="form-input" readonly>
            </FormField>
            <FormField label="팩스번호">
              <input type="text" v-model="contractForm.clientFaxNumber" class="form-input" readonly>
            </FormField>
            <FormField label="담당자">
              <input type="text" v-model="contractForm.clientManagerName" class="form-input" readonly>
            </FormField>
          </div>
        </div>

        <!-- 3. 기타 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-clipboard-list"></i>
            <span>기타 정보</span>
          </div>
          <!-- 현장소장 선택 -->
          <div class="info-grid grid-2">
            <FormField label="현장소장">
              <select
                v-model="contractForm.siteManagerId"
                @change="handleSupervisorChange"
                class="form-input-sm"
              >
                <option :value="null">선택하세요</option>
                <option
                  v-for="manager in siteManagers"
                  :key="manager.userid"
                  :value="manager.userid"
                >
                  {{ manager.userName }}
                </option>
              </select>
            </FormField>
            <FormField label="회사명">
              <input
                type="text"
                :value="selectedSupervisorCompany"
                class="form-input-sm"
                readonly
              >
            </FormField>
          </div>
          <!-- 기존 필드들 -->
          <div class="info-grid grid-4">
            <FormField label="분할납품">
              <input type="text" v-model="contractForm.partialDelivery" class="form-input-xs" readonly>
            </FormField>
            <FormField label="하자담보책임기간">
              <input type="text" v-model="contractForm.warrantyPeriod" class="form-input-xs" readonly>
            </FormField>
            <FormField label="검사기관">
              <input type="text" v-model="contractForm.inspectionAgency" class="form-input-md" readonly>
            </FormField>
            <FormField label="인수기관">
              <input type="text" v-model="contractForm.acceptanceAgency" class="form-input-md" readonly>
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
              <span>{{ contractForm.itemTotalAmount }}원</span>
            </div>
            <span class="amount-operator">+</span>
            <div class="amount-item">
              <label>수수료</label>
              <span>{{ contractForm.commission }}원</span>
            </div>
            <span class="amount-operator">=</span>
            <div class="amount-item total">
              <label>총 계약금액</label>
              <span>{{ contractForm.totalAmount }}원</span>
            </div>
          </div>
        </div>
      </FormSection>

      <!-- 납품 목록 -->
      <FormSection title="납품 목록" style="margin-top: -20px">
        <div class="table-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 30px">순번</th>
                <th style="width: 60px">품명</th>
                <th style="width: 280px">규격</th>
                <th style="width: 30px">단위</th>
                <th style="width: 50px">단가</th>
                <th style="width: 40px">수량</th>
                <th style="width: 60px">금액</th>
                <th style="width: 100px">납품장소</th>
                <th style="width: 80px">납품기한</th>
                <th style="width: 100px">납품조건</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="items.length === 0">
                <td colspan="10" class="empty-row">PDF를 업로드하면 자동으로 채워집니다</td>
              </tr>
              <tr v-for="(item, index) in items" :key="index">
                <td class="text-center">{{ index + 1 }}</td>
                <td><input v-model="item.name" type="text" readonly></td>
                <td><input v-model="item.specification" type="text" readonly></td>
                <td><input v-model="item.unit" type="text" readonly></td>
                <td class="text-right"><input v-model="item.unitPrice" type="text" readonly class="text-right"></td>
                <td class="text-right"><input v-model="item.quantity" type="text" class="text-right"></td>
                <td class="text-right"><input v-model="item.totalAmount" type="text" readonly class="text-right"></td>
                <td><input v-model="item.deliveryLocation" type="text"></td>
                <td><input v-model="item.deliveryDeadline" type="text"></td>
                <td><input v-model="item.deliveryTerms" type="text"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 합계 정보 -->
        <div class="summary-info">
          <div class="summary-item">
            <label>수량합계:</label>
            <span>{{ contractForm.quantityTotal }}</span>
          </div>
          <div class="summary-item">
            <label>할인전금액합계:</label>
            <span>{{ contractForm.preDiscountAmountTotal }}</span>
          </div>
        </div>
      </FormSection>

      <!-- 버튼 영역 -->
      <div class="form-actions">
        <button type="button" @click="cancel" class="btn-secondary" :disabled="submitting">
          취소
        </button>
        <button type="button" @click="register" class="btn-primary" :disabled="submitting">
          {{ submitting ? '등록 중...' : '등록' }}
        </button>
      </div>
    </div>

    <!-- 에러 팝업 -->
    <ErrorPopup
      :is-open="errorPopup.isOpen"
      :title="errorPopup.title"
      :message="errorPopup.message"
      @close="errorPopup.isOpen = false"
    />

    <!-- 계약 유형 선택 모달 -->
    <ContractTypeSelectModal
      :is-open="showContractTypeModal"
      :existing-contract-no="contractTypeCheckResult?.existingContractNo || ''"
      :new-contract-no="contractTypeCheckResult?.newContractNo || ''"
      @confirm="handleContractTypeConfirm"
      @close="handleContractTypeCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from '#imports'
import { apiEnvironment } from '~/services/api'
import { contractService } from '~/services/contract.service'
import { userService } from '~/services/user.service'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ErrorPopup from '~/components/admin/common/ErrorPopup.vue'
import ContractTypeSelectModal from '~/components/admin/order/ContractTypeSelectModal.vue'
import type { OrderItemCreateRequest, ContractTypeCheckResult, ContractType } from '~/types/order'
import type { UserByRole } from '~/types/user'

definePageMeta({
  layout: 'admin',
  pageTitle: '납품요구서 등록'
})

const router = useRouter()
const submitting = ref(false)

// 에러 팝업
const errorPopup = ref({
  isOpen: false,
  title: '오류 발생',
  message: ''
})

// 현장소장 목록
const siteManagers = ref<UserByRole[]>([])
const selectedSupervisorCompany = ref('')

// 파일 업로드
const fileInput = ref<HTMLInputElement>()
const uploadStatus = ref<{
  loading?: boolean
  success?: boolean
  error?: boolean
  message?: string
} | null>(null)

// 계약 정보
const contractForm = ref({
  salesId: 0,
  contractNo: '',
  contractDate: '',
  preNotificationNo: '',
  deliveryRequestNo: '',
  client: '',
  clientManagerName: '',
  clientNo: '',
  clientPostalCode: '',
  clientAddress: '',
  clientPhoneNumber: '',
  clientFaxNumber: '',
  naraJangteoNo: '',
  warrantyPeriod: '',
  paymentMethod: '',
  deliveryRequestDate: '',
  projectName: '',
  itemTotalAmount: '',
  commission: '',
  totalAmount: '',
  partialDelivery: '',
  inspectionAgency: '',
  acceptanceAgency: '',
  siteManagerId: null as number | null,
  builder: '',
  quantityTotal: '',
  preDiscountAmountTotal: '',
  pdfFilePath: '',
  contractType: '' as ContractType | ''
})

// 계약 유형 선택 관련 상태
const showContractTypeModal = ref(false)
const contractTypeCheckResult = ref<ContractTypeCheckResult | null>(null)
const pendingExtractedData = ref<{
  contractInfo: any
  deliveryItems: any[]
  savedFilePath?: string
} | null>(null)

// 납품 목록
const items = ref<OrderItemCreateRequest[]>([])

// 현장소장 목록 조회
onMounted(async () => {
  try {
    const managers = await userService.getUsersByRoles(['SITE_MANAGER'])
    siteManagers.value = managers
  } catch (error) {
    console.error('현장소장 목록 조회 실패:', error)
  }
})

// 현장소장 선택 핸들러
const handleSupervisorChange = () => {
  const supervisor = siteManagers.value.find(m => m.userid === contractForm.value.siteManagerId)
  if (supervisor) {
    contractForm.value.builder = supervisor.companyName || ''
    selectedSupervisorCompany.value = supervisor.companyName || ''
  } else {
    contractForm.value.builder = ''
    selectedSupervisorCompany.value = ''
  }
}

// 파일 업로드 트리거
const triggerFileUpload = () => {
  uploadStatus.value = null
  fileInput.value?.click()
}

// PDF 업로드 및 데이터 추출
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // PDF 검증
  const isValidPdf = file.type === 'application/pdf' ||
                    file.type === 'application/octet-stream' ||
                    file.name.toLowerCase().endsWith('.pdf')

  if (!isValidPdf) {
    uploadStatus.value = {
      error: true,
      message: 'PDF 파일만 업로드 가능합니다.'
    }
    target.value = ''
    return
  }

  uploadStatus.value = {
    loading: true,
    message: 'PDF 파일 업로드 및 데이터 추출 중...'
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    const baseUrl = apiEnvironment.getApiBaseUrl()
    const response = await fetch(`${baseUrl}/admin/contract/upload-pdf`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`PDF 업로드 실패: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      const contractCheck = result.contractTypeCheck as ContractTypeCheckResult | undefined

      // 계약 유형 체크: 본계약이 아니면 (접미사 01, 02, ...) 팝업으로 선택
      if (contractCheck && !contractCheck.isOriginalContract) {
        // 데이터 임시 저장 (모달 확인 후 사용)
        pendingExtractedData.value = {
          contractInfo: result.extractedContractInfo,
          deliveryItems: result.extractedDeliveryItems || [],
          savedFilePath: result.savedFilePath
        }
        contractTypeCheckResult.value = contractCheck
        showContractTypeModal.value = true

        uploadStatus.value = {
          success: true,
          message: 'PDF 데이터 추출 완료. 계약 유형을 선택해주세요.'
        }
      } else {
        // 본계약 (접미사 00) 또는 체크 결과 없음 → 바로 폼 채우기
        fillFormWithExtractedData(result.extractedContractInfo)

        if (result.savedFilePath) {
          contractForm.value.pdfFilePath = result.savedFilePath
        }

        if (result.extractedDeliveryItems && result.extractedDeliveryItems.length > 0) {
          fillItemsWithExtractedData(result.extractedDeliveryItems)
        }

        // 본계약이면 contractType을 ORIGINAL로 설정
        if (contractCheck?.isOriginalContract) {
          contractForm.value.contractType = 'ORIGINAL'
        }

        uploadStatus.value = {
          success: true,
          message: `PDF 업로드 및 데이터 추출 완료 (${result.processingTime}ms)`
        }
      }
    } else {
      throw new Error(result.message || '데이터 추출에 실패했습니다.')
    }
  } catch (error) {
    console.error('PDF 업로드 오류:', error)
    uploadStatus.value = {
      error: true,
      message: error instanceof Error ? error.message : 'PDF 업로드 중 오류가 발생했습니다.'
    }
  }

  target.value = ''
}

// 추출된 품목 데이터로 items 배열 채우기
const fillItemsWithExtractedData = (deliveryItems: any[]) => {
  items.value = deliveryItems.map((item, index) => ({
    itemOrder: index + 1,
    skuId: '',
    itemId: '',
    itemName: item.name || '',
    skuName: '',
    name: item.name || '',
    specification: item.specification || '',
    unit: item.unit || '',
    unitPrice: String(item.unitPrice || ''),
    quantity: Number(item.quantity) || 0,
    totalAmount: String(item.totalAmount || ''),
    deliveryLocation: item.deliveryLocation || '',
    deliveryDeadline: item.deliveryDeadline || '',
    deliveryTerms: item.deliveryTerms || '',
    optionItemNumber: item.optionItemNumber || '',
    itemClassificationNumber: item.itemClassificationNumber || '',
    itemIdentificationNumber: item.itemIdentificationNumber || '',
    inspectionExemption: item.inspectionExemption || 'N',
    midTermCompetitionItem: item.midTermCompetitionItem || 'N'
  }))
}

// 추출된 데이터로 폼 채우기
const fillFormWithExtractedData = (data: any) => {
  if (data.contractNumber) contractForm.value.contractNo = data.contractNumber
  if (data.contractDate) contractForm.value.contractDate = data.contractDate
  if (data.preNotificationNumber) contractForm.value.preNotificationNo = data.preNotificationNumber
  if (data.deliveryRequestNumber) contractForm.value.deliveryRequestNo = data.deliveryRequestNumber
  if (data.requestingAgency) contractForm.value.client = data.requestingAgency
  if (data.requestingAgencyNumber) contractForm.value.clientNo = data.requestingAgencyNumber
  if (data.requestingAgencyPostalCode) contractForm.value.clientPostalCode = data.requestingAgencyPostalCode
  if (data.requestingAgencyAddress) contractForm.value.clientAddress = data.requestingAgencyAddress
  if (data.requestingAgencyPhoneNumber) contractForm.value.clientPhoneNumber = data.requestingAgencyPhoneNumber
  if (data.requestingAgencyFaxNumber) contractForm.value.clientFaxNumber = data.requestingAgencyFaxNumber
  if (data.requestingAgencyContactPerson) contractForm.value.clientManagerName = data.requestingAgencyContactPerson
  if (data.naraJangteoNumber) contractForm.value.naraJangteoNo = data.naraJangteoNumber
  if (data.defectWarrantyPeriod) contractForm.value.warrantyPeriod = data.defectWarrantyPeriod
  if (data.paymentMethod) contractForm.value.paymentMethod = data.paymentMethod
  if (data.deliveryRequestDate) contractForm.value.deliveryRequestDate = data.deliveryRequestDate
  if (data.businessName) contractForm.value.projectName = data.businessName
  if (data.itemTotalAmount) contractForm.value.itemTotalAmount = String(data.itemTotalAmount)
  if (data.commission) contractForm.value.commission = String(data.commission)
  if (data.totalAmount) contractForm.value.totalAmount = String(data.totalAmount)
  if (data.partialDelivery) contractForm.value.partialDelivery = data.partialDelivery
  if (data.inspectionAgency) contractForm.value.inspectionAgency = data.inspectionAgency
  if (data.acceptanceAgency) contractForm.value.acceptanceAgency = data.acceptanceAgency
  if (data.quantityTotal) contractForm.value.quantityTotal = String(data.quantityTotal)
  if (data.preDiscountAmountTotal) contractForm.value.preDiscountAmountTotal = String(data.preDiscountAmountTotal)
}

// 계약 유형 선택 확인 핸들러
const handleContractTypeConfirm = (type: ContractType) => {
  showContractTypeModal.value = false

  // 임시 저장된 데이터로 폼 채우기
  if (pendingExtractedData.value) {
    fillFormWithExtractedData(pendingExtractedData.value.contractInfo)

    if (pendingExtractedData.value.savedFilePath) {
      contractForm.value.pdfFilePath = pendingExtractedData.value.savedFilePath
    }

    if (pendingExtractedData.value.deliveryItems?.length > 0) {
      fillItemsWithExtractedData(pendingExtractedData.value.deliveryItems)
    }

    // 선택된 계약 유형 설정 (AMENDMENT 또는 ADDITIONAL)
    contractForm.value.contractType = type

    pendingExtractedData.value = null
    contractTypeCheckResult.value = null

    uploadStatus.value = {
      success: true,
      message: `PDF 데이터 추출 완료. 계약 유형: ${type === 'AMENDMENT' ? '변경계약' : '추가계약'}`
    }
  }
}

// 계약 유형 선택 취소 핸들러
const handleContractTypeCancel = () => {
  showContractTypeModal.value = false
  pendingExtractedData.value = null
  contractTypeCheckResult.value = null
  uploadStatus.value = null
}

// 등록
const register = async () => {
  if (submitting.value) return

  submitting.value = true
  try {
    const contractData = {
      extractedContractInfo: {
        contractNumber: contractForm.value.contractNo,
        contractDate: contractForm.value.contractDate,
        salesRepresentative: null,
        preNotificationNumber: contractForm.value.preNotificationNo || null,
        deliveryRequestNumber: contractForm.value.deliveryRequestNo,
        requestingAgency: contractForm.value.client,
        requestingAgencyNumber: contractForm.value.clientNo,
        requestingAgencyPhoneNumber: contractForm.value.clientPhoneNumber,
        requestingAgencyFaxNumber: contractForm.value.clientFaxNumber,
        requestingAgencyPostalCode: contractForm.value.clientPostalCode,
        requestingAgencyAddress: contractForm.value.clientAddress,
        requestingAgencyContactPerson: contractForm.value.clientManagerName,
        phoneNumber: null,
        faxNumber: null,
        address: null,
        naraJangteoNumber: contractForm.value.naraJangteoNo,
        defectWarrantyPeriod: contractForm.value.warrantyPeriod,
        paymentMethod: contractForm.value.paymentMethod,
        deliveryRequestDate: contractForm.value.deliveryRequestDate,
        businessName: contractForm.value.projectName,
        progressStatus: null,
        remark: null,
        contractor: null,
        representativeName: null,
        businessRegistrationNumber: null,
        businessRegistrationNumberDemand: null,
        businessRegistrationNumberSupplier: null,
        itemTotalAmount: contractForm.value.itemTotalAmount,
        commission: contractForm.value.commission,
        totalAmount: contractForm.value.totalAmount,
        quantityTotal: contractForm.value.quantityTotal,
        preDiscountAmountTotal: contractForm.value.preDiscountAmountTotal,
        partialDelivery: contractForm.value.partialDelivery,
        inspectionAgency: contractForm.value.inspectionAgency,
        acceptanceAgency: contractForm.value.acceptanceAgency,
        siteManagerId: contractForm.value.siteManagerId,
        builder: contractForm.value.builder || null
      },
      extractedDeliveryItems: items.value.map((item, index) => ({
        sequenceNumber: index + 1,
        optionItemNumber: item.optionItemNumber || '',
        itemClassificationNumber: item.itemClassificationNumber || '',
        itemIdentificationNumber: item.itemIdentificationNumber || '',
        name: item.name,
        specification: item.specification,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: String(item.quantity),
        totalAmount: item.totalAmount,
        deliveryLocation: item.deliveryLocation,
        deliveryDeadline: item.deliveryDeadline,
        deliveryTerms: item.deliveryTerms,
        inspectionExemption: item.inspectionExemption || 'N',
        midTermCompetitionItem: item.midTermCompetitionItem || 'N'
      })),
      createdBy: '',
      pdfFilePath: contractForm.value.pdfFilePath,
      // 계약 유형 (ORIGINAL, AMENDMENT, ADDITIONAL)
      contractType: contractForm.value.contractType || null
    }

    const result = await contractService.registerContract(contractData)

    if (result.success) {
      alert('계약이 성공적으로 등록되었습니다.')
      router.push('/admin/order/list')
    } else {
      throw new Error(result.message || '계약 등록에 실패했습니다.')
    }
  } catch (error) {
    console.error('계약 등록 실패:', error)
    errorPopup.value = {
      isOpen: true,
      title: '납품요구 등록 실패',
      message: error instanceof Error ? error.message : '계약 등록에 실패했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

// 취소
const cancel = () => {
  router.push('/admin/order/list')
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, items-table, summary-info, amount-group, amount-display
 * - admin-forms.css: form-input-*, info-group, info-grid, grid-5
 * - admin-common.css: empty-row, upload-status, status-*
 */

/* Page-specific: Order register page wrapper */
.order-register {
  padding: 0;
  margin-bottom: 0;
}
</style>
