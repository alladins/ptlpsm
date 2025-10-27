<template>
  <div class="sales-edit">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="영업 수정"
      description="영업 정보를 수정합니다."
    />

    <AdminCommonLoadingSection v-if="loading" />
    <AdminCommonErrorSection v-else-if="!salesData" message="영업 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <form @submit.prevent="handleSubmit" class="edit-form">
        <!-- 기본 정보 섹션 -->
        <FormSection title="기본 정보">
          <FormField label="수요기관" required full-width>
            <input
              type="text"
              :value="formData.dminsttNm ? `${formData.dminsttNm} (${formData.dminsttCd})` : ''"
              placeholder="수요기관"
              class="form-input"
              readonly
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
              rows="4"
            />
          </FormField>

          <FormField label="예상납품요구일">
            <input
              v-model="formData.expectedDeliveryDate"
              type="date"
              class="form-input"
            />
          </FormField>

          <FormField label="예상상납품기한">
            <input
              v-model="formData.expectedDeliveryDeadline"
              type="date"
              class="form-input"
            />
          </FormField>

          <FormField label="계약금액">
            <input
              v-model.number="formData.contractAmount"
              type="number"
              class="form-input"
              placeholder="계약금액을 입력하세요"
              min="0"
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

          <FormField label="비고" full-width>
            <textarea
              v-model="formData.remark"
              class="form-textarea"
              placeholder="비고를 입력하세요"
              rows="3"
            />
          </FormField>
        </FormSection>

        <!-- 품목 관리 섹션 -->
        <FormSection title="품목 관리">
          <div class="items-section-wrapper">
            <ItemsManager
              :items="items"
              :show-delivery-date="false"
              @add-item="addItem"
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

            <!-- 금액 일치 여부 표시 -->
            <div v-if="formData.contractAmount" class="amount-match-indicator">
              <span :class="{ 'match': isAmountMatch, 'mismatch': !isAmountMatch }">
                {{ isAmountMatch ? '✓ 계약금액과 일치' : '⚠ 계약금액과 불일치' }}
              </span>
            </div>
          </div>
        </FormSection>

        <!-- 계약서 파일 섹션 -->
        <FormSection title="계약서 파일">
          <div class="file-section-wrapper">
            <AdminCommonFileUploadArea
              v-model="selectedFile"
              :existing-file-name="salesData.contractFileNm"
              :existing-file-size="salesData.contractFileSize"
              @download="downloadFile"
            />
          </div>
        </FormSection>

        <!-- 버튼 영역 -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary" :disabled="submitting">
            취소
          </button>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? '수정 중...' : '수정' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter, useRoute } from '#imports'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { useItemManagement } from '~/composables/admin/useItemManagement'
import { formatPhoneNumber } from '~/utils/format'
import { salesService, type Sales, type SalesUpdateRequest } from '~/services/sales.service'
import { type SalesItemRequest } from '~/types/sales'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import ItemsManager from '~/components/admin/forms/ItemsManager.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '영업 수정'
})

const router = useRouter()
const route = useRoute()

// ID 추출
const salesId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id) : Array.isArray(id) ? parseInt(id[0]) : 0
})

// useEditForm composable 사용
const {
  id,
  formData,
  loading,
  submitting,
  submit,
  goBack,
  reload
} = useEditForm<Sales, SalesUpdateRequest, Sales>({
  fetchFunction: (id) => salesService.getSalesById(id),
  updateFunction: async (id, data) => {
    console.log('📝 수정폼 제출 데이터:', data)

    // 1. 기본 정보 업데이트
    await salesService.updateSales(id, data)

    // 2. 품목 정보 업데이트 (기존 삭제 후 재등록)
    try {
      const existingItems = await salesService.getSalesItems(id)
      for (const item of existingItems) {
        if (item.id) {
          await salesService.deleteSalesItem(id, item.id)
        }
      }
    } catch (error) {
      console.error('기존 품목 삭제 실패:', error)
    }

    // 새로운 품목 등록
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
          await salesService.addSalesItem(id, itemRequest)
          console.log('✅ 품목 등록 성공:', item.itemName)
        } catch (error) {
          console.error('❌ 품목 등록 실패:', item.itemName, error)
        }
      }
    }

    // 3. 파일 업로드
    if (selectedFile.value) {
      await salesService.uploadContractFile(id, selectedFile.value)
    }

    return salesService.getSalesById(id)
  },
  successRoute: '/admin/sales/list',
  transformToForm: (sales) => {
    // date 형식 변환 (YYYY-MM-DD)
    const formatDateOnly = (dateString: string): string => {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    return {
      customerNm: sales.customerNm || '',
      customerTel: sales.customerTel || '',
      customerEmail: sales.customerEmail || '',
      salesTitle: sales.salesTitle || '',
      salesContent: sales.salesContent || '',
      contractAmount: sales.contractAmount || undefined,
      salesStatus: sales.salesStatus || '',
      expectedDeliveryDate: sales.expectedDeliveryDate ? formatDateOnly(sales.expectedDeliveryDate) : '',
      expectedDeliveryDeadline: sales.expectedDeliveryDeadline ? formatDateOnly(sales.expectedDeliveryDeadline) : '',
      dminsttCd: sales.dminsttCd || '',
      dminsttNm: sales.dminsttNm || '',
      useYn: sales.useYn || 'Y',
      remark: sales.remark || ''
    }
  },
  onFetchError: (error) => {
    console.error('영업 데이터 로드 오류:', error)
    alert('영업 정보를 불러오는데 실패했습니다.')
    router.push('/admin/sales/list')
  },
  onUpdateSuccess: () => {
    alert('영업 정보가 성공적으로 수정되었습니다.')
  },
  onUpdateError: (error) => {
    console.error('영업 수정 오류:', error)
    alert('영업 수정에 실패했습니다.')
  }
})

// 원본 데이터 (readonly 필드, 파일 다운로드용)
const salesData = ref<Sales | null>(null)

// 데이터 로드 후 처리
const loadComplete = async () => {
  try {
    const data = await salesService.getSalesById(salesId.value)
    salesData.value = data

    // 품목 데이터 로드
    try {
      const itemsResponse = await salesService.getSalesItems(salesId.value)
      items.value = itemsResponse.map((item: any) => ({
        skuId: item.skuId,
        itemId: item.itemId,
        itemName: item.itemName,
        skuName: item.skuName,
        itemSpecification: item.itemSpecification || '',
        unit: item.unit || '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        amount: item.amount,
        sortOrder: item.sortOrder || items.value.length + 1
      }))
      console.log('📦 품목 데이터 로드 성공:', items.value)
    } catch (error) {
      console.error('품목 데이터 로드 실패:', error)
      items.value = []
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error)
  }
}

// 컴포넌트 마운트 시 데이터 로드
if (salesId.value) {
  loadComplete()
}

// 검증 composable
const { errors, validateField, validateAll, clearErrors, rules } = useFormValidation({
  customerNm: '',
  salesTitle: '',
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
  removeItem,
  openItemSelector,
  handleSkuSelected,
  calculateItemAmount,
  totalAmount: totalItemsAmount
} = useItemManagement({
  parentId: salesId,
  autoCalculate: true,
  duplicateCheckField: 'skuId'
})

// 파일 업로드
const selectedFile = ref<File | null>(null)

// 옵션 데이터
const salesStatusOptions = salesService.getSalesStatusOptions()

// Computed
const isAmountMatch = computed(() => {
  if (!formData.contractAmount) return true
  return Math.abs(totalItemsAmount.value - formData.contractAmount) < 1
})

// 전화번호 입력 처리
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const formatted = formatPhoneNumber(target.value)
  formData.customerTel = formatted

  nextTick(() => {
    target.value = formatted
  })
}

// 파일 다운로드
const downloadFile = async () => {
  if (!salesData.value?.id) return

  try {
    const blob = await salesService.downloadContractFile(salesData.value.id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = salesData.value.contractFileNm || 'contract.pdf'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    alert('파일 다운로드에 실패했습니다.')
  }
}

// 폼 제출
const handleSubmit = async () => {
  // 검증
  clearErrors()

  const validationRules = {
    customerNm: [rules.required('담당자명')],
    salesTitle: [rules.required('사업명')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  // 실시간 검증된 에러 확인
  if (errors.customerTel || errors.customerEmail) {
    return
  }

  // 계약금액 자동 반영
  if (items.value.length > 0) {
    formData.contractAmount = totalItemsAmount.value
  }

  await submit()
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, items-section-wrapper, form-actions
 * - admin-forms.css: form-input-*, info-group, info-grid
 * - admin-common.css: page wrapper styles
 */

/* Page-specific: Sales edit layout */
.sales-edit {
  padding: 0;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Page-specific: File section wrapper */
.file-section-wrapper {
  grid-column: 1 / -1;
}

/* Page-specific: Amount match indicator */
.amount-match-indicator {
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  text-align: center;
}

.amount-match-indicator .match {
  color: #10b981;
  font-weight: 500;
  font-size: 0.875rem;
}

.amount-match-indicator .mismatch {
  color: #ef4444;
  font-weight: 500;
  font-size: 0.875rem;
}
</style>
