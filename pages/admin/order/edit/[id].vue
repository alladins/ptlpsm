<template>
  <div class="order-edit">
    <UiPageHeader
      title="납품요구 수정"
      description="납품요구 정보를 수정합니다."
    >
      <template #actions>
        <button class="btn-delete" @click="handleDelete">
          <i class="fas fa-trash"></i>
          삭제
        </button>
      </template>
    </UiPageHeader>

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

    <AdminCommonLoadingSection v-if="loading" />
    <AdminCommonErrorSection v-else-if="!orderData && !loading" message="발주 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <form @submit.prevent="handleSubmit" class="edit-form">
        <FormSection title="계약 정보">
          <FormField label="계약번호" full-width>
            <input type="text" v-model="formData.contractNo" class="form-input" placeholder="계약번호를 입력하세요">
          </FormField>

          <FormField label="계약일자">
            <input type="date" v-model="formData.contractDate" class="form-input">
          </FormField>

          <FormField label="선고지번호" full-width>
            <input type="text" v-model="formData.preNotificationNo" class="form-input" placeholder="선고지번호를 입력하세요">
          </FormField>

          <FormField label="납품요구번호">
            <input type="text" v-model="formData.deliveryRequestNo" class="form-input" placeholder="납품요구번호를 입력하세요">
          </FormField>

          <FormField label="수요기관" full-width>
            <input type="text" v-model="formData.client" class="form-input" placeholder="수요기관을 입력하세요">
          </FormField>

          <FormField label="수요기관번호">
            <input type="text" v-model="formData.clientNo" class="form-input" placeholder="수요기관번호를 입력하세요">
          </FormField>

          <FormField label="수요기관 우편번호">
            <input type="text" v-model="formData.clientPostalCode" class="form-input" placeholder="우편번호를 입력하세요">
          </FormField>

          <FormField label="수요기관 주소" full-width>
            <input type="text" v-model="formData.clientAddress" class="form-input" placeholder="주소를 입력하세요">
          </FormField>

          <FormField label="수요기관 전화번호">
            <input type="text" v-model="formData.clientPhoneNumber" class="form-input" placeholder="전화번호를 입력하세요">
          </FormField>

          <FormField label="수요기관 팩스번호">
            <input type="text" v-model="formData.clientFaxNumber" class="form-input" placeholder="팩스번호를 입력하세요">
          </FormField>

          <FormField label="나라장터등록번호">
            <input type="text" v-model="formData.naraJangteoNo" class="form-input" placeholder="나라장터등록번호를 입력하세요">
          </FormField>

          <FormField label="하자담보책임기간">
            <input type="text" v-model="formData.warrantyPeriod" class="form-input" placeholder="하자담보책임기간을 입력하세요">
          </FormField>

          <FormField label="지급방법">
            <select v-model="formData.paymentMethod" class="form-select">
              <option value="">선택하세요</option>
              <option value="대지급">대지급</option>
              <option value="후지급">후지급</option>
              <option value="분할지급">분할지급</option>
            </select>
          </FormField>

          <FormField label="납품요구일자">
            <input type="date" v-model="formData.deliveryRequestDate" class="form-input">
          </FormField>

          <FormField label="사업명" full-width>
            <input type="text" v-model="formData.projectName" class="form-input" placeholder="사업명을 입력하세요">
          </FormField>

          <FormField label="계약자">
            <input type="text" v-model="formData.contractor" class="form-input" placeholder="계약자를 입력하세요">
          </FormField>

          <FormField label="대표자명">
            <input type="text" v-model="formData.representativeName" class="form-input" placeholder="대표자명을 입력하세요">
          </FormField>

          <FormField label="사업자등록번호">
            <input type="text" v-model="formData.businessRegistrationNumber" class="form-input" placeholder="사업자등록번호를 입력하세요">
          </FormField>

          <FormField label="연락처">
            <input type="text" v-model="formData.phoneNumber" class="form-input" placeholder="연락처를 입력하세요">
          </FormField>

          <FormField label="팩스번호">
            <input type="text" v-model="formData.faxNumber" class="form-input" placeholder="팩스번호를 입력하세요">
          </FormField>

          <FormField label="품목총액">
            <input type="number" v-model="formData.itemTotalAmount" class="form-input" placeholder="품목총액을 입력하세요">
          </FormField>

          <FormField label="수수료">
            <input type="number" v-model="formData.commission" class="form-input" placeholder="수수료를 입력하세요">
          </FormField>

          <FormField label="총계약금액">
            <input
              type="number"
              v-model="formData.totalAmount"
              class="form-input"
              placeholder="총계약금액을 입력하세요"
              ref="contractAmountInputRef"
              @input="handleAmountInput"
            >
          </FormField>

          <FormField label="분할납품">
            <select v-model="formData.partialDelivery" class="form-select">
              <option value="">선택하세요</option>
              <option value="가능">가능</option>
              <option value="불가능">불가능</option>
            </select>
          </FormField>

          <FormField label="검사기관">
            <input type="text" v-model="formData.inspectionAgency" class="form-input" placeholder="검사기관을 입력하세요">
          </FormField>

          <FormField label="인수기관">
            <input type="text" v-model="formData.acceptanceAgency" class="form-input" placeholder="인수기관을 입력하세요">
          </FormField>
        </FormSection>

        <FormSection title="납품 목록">
          <div class="items-section-wrapper">
            <div class="items-header">
              <div class="items-summary">
                <span class="summary-label">선택된 품목</span>
                <span class="summary-value">{{ items.length }}개</span>
                <span class="summary-divider">|</span>
                <span class="summary-label">수량 합계</span>
                <span class="summary-value">{{ formatNumber(totalQuantity) }}</span>
                <span class="summary-divider">|</span>
                <span class="summary-label">총 금액</span>
                <span class="summary-value">{{ formatCurrency(totalAmount) }}</span>
              </div>
              <button type="button" @click="addItem" class="btn-add-item">
                <i class="fas fa-plus"></i>
                품목 추가
              </button>
            </div>

            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 60px">순번</th>
                    <th style="width: 150px">품명</th>
                    <th style="width: 200px">규격</th>
                    <th style="width: 80px">단위</th>
                    <th style="width: 100px">단가</th>
                    <th style="width: 80px">수량</th>
                    <th style="width: 120px">금액</th>
                    <th style="width: 150px">납품장소</th>
                    <th style="width: 120px">납품기한</th>
                    <th style="width: 120px">납품조건</th>
                    <th style="width: 80px">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td colspan="11" class="empty-message">
                      품목을 추가해주세요.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in items" :key="index">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td>
                      <div class="input-group">
                        <input
                          type="text"
                          v-model="item.name"
                          class="form-input table-input"
                          placeholder="품명"
                          readonly
                        >
                        <button type="button" class="btn-search-sm" @click="openItemSelector(index)">
                          <i class="fas fa-search"></i>
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.specification"
                        class="form-input table-input"
                        placeholder="규격"
                        readonly
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.unit"
                        class="form-input table-input"
                        placeholder="단위"
                        readonly
                      >
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.unitPrice"
                        class="form-input table-input"
                        placeholder="단가"
                        readonly
                      >
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.quantity"
                        class="form-input table-input"
                        placeholder="수량"
                        @input="calculateItemAmount(index)"
                      >
                    </td>
                    <td>
                      <input
                        type="number"
                        v-model="item.totalAmount"
                        class="form-input table-input"
                        placeholder="금액"
                        readonly
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.deliveryLocation"
                        class="form-input table-input"
                        placeholder="납품장소"
                      >
                    </td>
                    <td>
                      <input
                        type="date"
                        v-model="item.deliveryDeadline"
                        class="form-input table-input"
                      >
                    </td>
                    <td>
                      <input
                        type="text"
                        v-model="item.deliveryTerms"
                        class="form-input table-input"
                        placeholder="납품조건"
                      >
                    </td>
                    <td class="text-center">
                      <button type="button" class="btn-remove-item" @click="removeItem(index)">
                        <i class="fas fa-times"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </FormSection>

        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-secondary">취소</button>
          <button type="submit" :disabled="submitting" class="btn-primary">
            {{ submitting ? '수정 중...' : '수정' }}
          </button>
        </div>
      </form>
    </div>

    <!-- 금액 불일치 알림 팝업 -->
    <AdminCommonAmountMismatchAlert
      v-model="showAmountMismatchAlert"
      message="계약금액이 납품 목록의 합산금액과 다릅니다."
    />

    <!-- 품목 선택 팝업 -->
    <ItemSkuSelector
      v-model="showItemSelector"
      @sku-selected="handleSkuSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from '#imports'
import { orderService } from '~/services/order.service'
import type { Item, ItemSku } from '~/services/item.service'
import type { OrderCreateRequest, OrderItemCreateRequest, OrderDetailResponse } from '~/types/order'
import { formatNumber, formatCurrency } from '~/utils/format'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useItemManagement } from '~/composables/admin/useItemManagement'
import { useAmountValidation } from '~/composables/admin/useAmountValidation'

definePageMeta({
  layout: 'admin',
  pageTitle: '발주 수정'
})

const router = useRouter()

// 업로드 상태
const uploadStatus = ref<{
  loading?: boolean
  success?: boolean
  error?: boolean
  message?: string
} | null>(null)

// 원본 데이터 저장
const orderData = ref<OrderDetailResponse | null>(null)

// useEditForm 사용
const {
  id: orderId,
  formData,
  loading,
  submitting,
  submit,
  goBack,
  reload
} = useEditForm<OrderDetailResponse, any, OrderCreateRequest>({
  fetchFunction: async (id) => {
    const data = await orderService.getOrderDetail(id)
    orderData.value = data

    // 품목 데이터 초기화
    items.value = data.items.map((item: any, index: number) => ({
      itemOrder: index + 1,
      skuId: item.skuId,
      itemId: item.itemId,
      itemName: item.itemNm,
      skuName: item.skuNm,
      name: item.itemNm,
      specification: item.specification,
      unit: item.unitCd,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalAmount: item.quantity * item.unitPrice,
      deliveryLocation: item.deliveryLocation || '',
      deliveryDeadline: item.deliveryDeadline || '',
      deliveryTerms: item.deliveryTerms || ''
    }))

    return data
  },
  updateFunction: async (id, data) => {
    const formData = new FormData()

    // order 데이터를 Blob으로 변환하여 추가
    const orderBlob = new Blob([JSON.stringify(data)], {
      type: 'application/json'
    })
    formData.append('order', orderBlob)

    await orderService.updateOrder(id, formData)
    return orderService.getOrderDetail(id)
  },
  successRoute: '/admin/order',
  transformToForm: (order) => ({
    salesId: order.salesId,
    contractNo: order.contractId,
    contractDate: order.contractDate,
    preNotificationNo: order.preNotificationNo || '',
    deliveryRequestNo: order.deliveryRequestNo || '',
    client: order.client,
    clientManagerName: order.clientManagerName || '',
    clientNo: order.clientNo || '',
    clientPostalCode: order.clientPostalCode || '',
    clientAddress: order.clientAddress || '',
    clientPhoneNumber: order.clientPhoneNumber || '',
    clientFaxNumber: order.clientFaxNumber || '',
    naraJangteoNo: order.naraJangteoNo || '',
    warrantyPeriod: order.warrantyPeriod || '',
    paymentMethod: order.paymentMethod || '',
    deliveryRequestDate: order.deliveryRequestDate,
    projectName: order.projectName,
    contractor: order.contractor,
    representativeName: order.representativeName || '',
    businessRegistrationNumber: order.businessRegistrationNumber || '',
    phoneNumber: order.phoneNumber || '',
    faxNumber: order.faxNumber || '',
    itemTotalAmount: order.itemTotalAmount,
    commission: order.commission,
    totalAmount: order.totalAmount,
    partialDelivery: order.partialDelivery || '',
    inspectionAgency: order.inspectionAgency || '',
    acceptanceAgency: order.acceptanceAgency || ''
  }),
  transformToRequest: (formData) => ({
    salesId: Number(formData.salesId),
    contractId: formData.contractNo,
    contractDate: formData.contractDate,
    preNotificationNo: formData.preNotificationNo,
    deliveryRequestNo: formData.deliveryRequestNo,
    client: formData.client,
    clientManagerName: formData.clientManagerName,
    clientNo: formData.clientNo,
    clientPostalCode: formData.clientPostalCode,
    clientAddress: formData.clientAddress,
    clientPhoneNumber: formData.clientPhoneNumber,
    clientFaxNumber: formData.clientFaxNumber,
    naraJangteoNo: formData.naraJangteoNo,
    warrantyPeriod: formData.warrantyPeriod,
    paymentMethod: formData.paymentMethod,
    deliveryRequestDate: formData.deliveryRequestDate,
    projectName: formData.projectName,
    contractor: formData.contractor,
    representativeName: formData.representativeName,
    businessRegistrationNumber: formData.businessRegistrationNumber,
    phoneNumber: formData.phoneNumber,
    faxNumber: formData.faxNumber,
    itemTotalAmount: Number(formData.itemTotalAmount),
    commission: Number(formData.commission),
    totalAmount: Number(formData.totalAmount),
    partialDelivery: formData.partialDelivery,
    inspectionAgency: formData.inspectionAgency,
    acceptanceAgency: formData.acceptanceAgency,
    items: items.value.map((item, index) => ({
      itemOrder: index + 1,
      skuId: item.skuId,
      itemId: item.itemId,
      itemName: item.itemName,
      skuName: item.skuName,
      name: item.name,
      specification: item.specification,
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      quantity: Number(item.quantity),
      totalAmount: Number(item.totalAmount),
      deliveryLocation: item.deliveryLocation,
      deliveryDeadline: item.deliveryDeadline,
      deliveryTerms: item.deliveryTerms
    }))
  }),
  onUpdateSuccess: () => {
    alert('발주가 수정되었습니다.')
  },
  onUpdateError: (error) => {
    console.error('발주 수정 실패:', error)
    alert('발주 수정에 실패했습니다.')
  }
})

// useItemManagement 사용
const itemManagement = useItemManagement({
  autoCalculate: true,
  duplicateCheckField: 'skuId'
})

const {
  items,
  showItemSelector,
  currentItemIndex,
  addItem,
  openItemSelector,
  handleSkuSelected,
  totalAmount
} = itemManagement

// 수량 합계
const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// useAmountValidation 사용
const {
  showAmountMismatchAlert,
  contractAmountInput: contractAmountInputRef,
  checkAmountMismatch,
  isAmountMatch
} = useAmountValidation()

// 금액 입력 시 검증
const handleAmountInput = () => {
  nextTick(() => {
    checkAmountMismatch(formData.totalAmount, totalAmount.value)
  })
}

// 품목 수량 변경 시 검증 추가
const calculateItemAmount = (index: number) => {
  itemManagement.calculateItemAmount(index)
  nextTick(() => {
    checkAmountMismatch(formData.totalAmount, totalAmount.value)
  })
}

// 품목 삭제 시 검증 추가
const removeItem = (index: number) => {
  itemManagement.removeItem(index)
  nextTick(() => {
    checkAmountMismatch(formData.totalAmount, totalAmount.value)
  })
}

// 삭제 처리
const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return

  try {
    await orderService.deleteOrder(orderId.value)
    alert('발주가 삭제되었습니다.')
    router.push('/admin/order')
  } catch (error) {
    console.error('발주 삭제 실패:', error)
    alert('발주 삭제에 실패했습니다.')
  }
}

// 제출 처리
const handleSubmit = async () => {
  // 금액 검증
  if (!isAmountMatch(formData.totalAmount, totalAmount.value)) {
    return
  }

  await submit()
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: items-table, items-table-wrapper, items-section-wrapper, items-header, items-summary, summary-label, summary-value, summary-divider, form-actions
 * - admin-forms.css: form-input, table-input, input-group
 * - admin-common.css: text-center, empty-message, upload-status, status-*, btn-add-item, btn-search-sm, btn-remove-item, btn-delete
 */

/* Page-specific: Order edit page wrapper */
.order-edit {
  min-height: 100vh;
}

/* Page-specific: Table row last-child adjustment */
.items-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
