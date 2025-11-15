<template>
  <div class="shipping-register">
    <PageHeader
      title="출하 등록"
      description="출하 정보를 등록하고 관리합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-action btn-primary"
          @click="handleSubmit"
          :disabled="submitting"
        >
          <i class="fas fa-save"></i>
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <form @submit.prevent="handleSubmit" class="register-form">
        <FormSection title="출하 정보">
          <!-- 2열 레이아웃 컨테이너 -->
          <div class="two-column-layout">
            <!-- 좌측 컬럼 -->
            <div class="left-column">
              <!-- 1. 계약 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-file-alt"></i>
                  <span>계약 정보</span>
                </div>
                <div class="info-grid grid-3">
                  <FormField label="납품요구번호(발주번호)" required :error="errors.deliveryRequestNo">
                    <div class="search-group">
                      <input
                        type="text"
                        v-model="formData.deliveryRequestNo"
                        class="form-input-sm"
                        placeholder="납품요구번호를 선택하세요"
                        readonly
                      >
                      <button type="button" class="btn-search" @click="openOrderSelectPopup">
                        <i class="fas fa-search"></i>
                        조회
                      </button>
                    </div>
                  </FormField>
                  <FormField label="납품요구일자">
                    <input
                      type="text"
                      :value="formData.deliveryRequestDate || '-'"
                      class="form-input-sm text-center"
                      readonly
                    >
                  </FormField>
                  <FormField label="사업명">
                    <input
                      type="text"
                      :value="formData.projectName || '-'"
                      class="form-input-xl"
                      placeholder="발주 선택 시 자동으로 입력됩니다"
                      readonly
                    >
                  </FormField>
                </div>
              </div>

              <!-- 3. 출하 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-truck"></i>
                  <span>출하 정보</span>
                </div>
                <div class="info-grid grid-5">
                  <FormField label="출하일자" required :error="errors.shippingDate">
                    <input
                      type="date"
                      v-model="formData.shippingDate"
                      class="form-input-sm text-center"
                    >
                  </FormField>

                  <FormField label="운송장번호" :error="errors.trackingNumber">
                    <input
                      type="text"
                      v-model="formData.trackingNumber"
                      class="form-input-md text-center"
                      placeholder="운송장번호"
                    >
                  </FormField>

                  <FormField label="상태" required :error="errors.status">
                    <select v-model="formData.status" class="form-select-sm text-center">
                      <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </FormField>

                  <FormField label="총 출하수량">
                    <input
                      type="text"
                      :value="formatNumber(totalShippingQuantity)"
                      class="form-input-xs text-right"
                      readonly
                    >
                  </FormField>
                  <FormField label="총 금액">
                    <input
                      type="text"
                      :value="formatCurrency(totalAmount)"
                      class="form-input-sm text-right"
                      style="font-weight: bold; font-size: 1.125rem;"
                      readonly
                    >
                  </FormField>
                </div>
              </div>
            </div>

            <!-- 우측 컬럼 -->
            <div class="right-column">
              <!-- 2. 수요기관 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-building"></i>
                  <span>수요기관 정보</span>
                </div>
                <div class="info-grid grid-3">
                  <FormField label="수요기관명" required :error="errors.client">
                    <input
                      type="text"
                      v-model="formData.client"
                      class="form-input-md text-center"
                      placeholder="수요기관 불러오기"
                      readonly
                    >
                  </FormField>
                  <FormField label="기관번호">
                    <input
                      type="text"
                      :value="formData.clientNo || '-'"
                      class="form-input-sm text-center"
                      readonly
                    >
                  </FormField>
                  <FormField label="담당자">
                    <input
                      type="text"
                      :value="formData.clientManagerName || '-'"
                      class="form-input-sm text-center"
                      placeholder="발주 선택 시 자동으로 입력됩니다"
                      readonly
                    >
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection style="margin-top: -20px">
          <div class="items-section-wrapper">
            <div class="items-section-header">
              <i class="fas fa-box"></i>
              <span>품목 정보</span>
            </div>
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>                  
                  <tr>
                    <th style="width: 30px">NO</th>
                    <th style="width: 90px">품목명</th>
                    <th style="width: 60px">SKU ID</th>
                    <th style="width: 100px">SKU 품명</th>
                    <th style="width: 420px">규격</th>
                    <th style="width: 30px">단위</th>
                    <th style="width: 60px">발주수량</th>
                    <th style="width: 60px">잔여수량</th>
                    <th style="width: 60px" class="quantity-col">출하수량</th>
                    <th style="width: 60px">단가</th>
                    <th style="width: 100px">금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedOrderItems.length === 0">
                    <td colspan="11" class="empty-message">
                      납품요구번호를 선택하면 품목이 표시됩니다.
                    </td>
                  </tr>
                  <tr v-for="item in selectedOrderItems" :key="item.itemId">
                    <td>{{ item.itemId }}</td>
                    <td>{{ item.itemName }}</td>
                    <td>{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td>{{ item.specification }}</td>
                    <td>{{ item.unit }}</td>
                    <td class="text-right">{{ formatNumber(item.quantity) }}</td>
                    <td class="text-right">
                      {{ formatNumber(item.remainingQuantity) }}
                      <button
                        type="button"
                        class="btn-max-quantity"
                        @click="setMaxQuantity(item)"
                        :title="'전체수량 입력 (' + formatNumber(item.remainingQuantity) + ')'"
                      >
                        <i class="fas fa-angle-right"></i>
                      </button>
                    </td>
                    <td class="text-right quantity-col">
                      <input
                        type="number"
                        v-model.number="item.shippingQuantity"
                        :min="0"
                        :max="item.remainingQuantity"
                        class="table-input text-right"
                        @change="updateShippingQuantity(item)"
                      />
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.shippingQuantity * item.unitPrice) }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="selectedOrderItems.length > 0">
                  <tr>
                    <td colspan="6" class="text-right"></td>
                    <td colspan="2" class="text-right"><strong>총 출하수량</strong></td>
                    <td class="text-right"><strong>{{ formatNumber(totalShippingQuantity) }}</strong></td>
                    <td class="text-right"><strong>총 금액</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- 발주번호 조회 팝업 -->
    <OrderSelectPopup
      v-if="showOrderSelectPopup"
      :show="showOrderSelectPopup"
      @close="closeOrderSelectPopup"
      @select="handleOrderSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from '#imports'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'
import type { OrderDetailResponse } from '~/types/order'
import { shipmentService } from '~/services/shipment.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { useCommonStatus } from '~/composables/useCommonStatus'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 등록'
})

const router = useRouter()

// 상태 관리 (DB 기반)
const { statusOptions } = useCommonStatus()

// 품목 인터페이스
interface OrderItem {
  itemId: string
  itemName: string
  skuId: string
  skuName: string
  specification: string
  unit: string
  quantity: number
  shippingQuantity: number
  remainingQuantity: number
  unitPrice: number
  amount: number
  deliveryLocation?: string
  deliveryDeadline?: string
  deliveryTerms?: string
  optionItemNumber?: string
  itemClassificationNumber?: string
  itemIdentificationNumber?: string
  inspectionExemption?: string
  midTermCompetitionItem?: string
  sortOrder?: number
  orderId: number
  orderItemId: string
}

// useRegisterForm 사용
const {
  formData,
  submitting,
  submit,
  goBack,
  reset
} = useRegisterForm<any, any, any>({
  createFunction: async (data) => {
    // 출하수량이 있는 품목 필터링
    const shippingItems = selectedOrderItems.value.filter(item => item.shippingQuantity > 0)

    if (shippingItems.length === 0) {
      throw new Error('출하할 품목이 없습니다. 출하수량을 입력해주세요.')
    }

    // 출하 정보 저장
    const shipmentData = {
      orderId: shippingItems[0].orderId,
      deliveryRequestNo: data.deliveryRequestNo,
      shipmentDate: data.shippingDate,
      status: data.status,
      items: shippingItems.map(item => ({
        skuId: item.skuId,
        itemId: item.itemId,
        skuName: item.skuName,
        specification: item.specification,
        unit: item.unit,
        shipmentQuantity: item.shippingQuantity,
        unitPrice: item.unitPrice,
        amount: item.shippingQuantity * item.unitPrice,
        orderId: item.orderId,
        orderItemId: item.orderItemId
      }))
    }

    return await shipmentService.createShipment(shipmentData)
  },
  successRoute: '/admin/shipping/list',
  defaultValues: {
    deliveryRequestNo: '',
    deliveryRequestDate: '',
    client: '',
    clientNo: '',
    projectName: '',
    clientManagerName: '',
    shippingDate: new Date().toISOString().split('T')[0],
    trackingNumber: '',
    status: 'PENDING'
  },
  onCreateSuccess: () => {
    alert('출하 정보가 저장되었습니다.')
  },
  onCreateError: (error: any) => {
    console.error('출하 정보 저장 실패:', error)
    if (error.message) {
      alert(error.message)
    } else {
      alert('출하 정보 저장에 실패했습니다.')
    }
  }
})

// useFormValidation 사용
const { errors, validateField, validateAll, rules } = useFormValidation({
  deliveryRequestNo: '',
  client: '',
  shippingDate: '',
  trackingNumber: '',
  status: ''
})

// 선택된 발주의 품목 목록
const selectedOrderItems = ref<OrderItem[]>([])

// 발주번호 조회 팝업
const showOrderSelectPopup = ref(false)

const openOrderSelectPopup = () => {
  showOrderSelectPopup.value = true
}

const closeOrderSelectPopup = () => {
  showOrderSelectPopup.value = false
}

// 발주 선택 처리
const handleOrderSelect = async (order: OrderDetailResponse) => {
  console.log('선택된 발주 정보:', order)

  try {
    // 폼 데이터 업데이트
    formData.deliveryRequestNo = order.deliveryRequestNo
    formData.deliveryRequestDate = order.deliveryRequestDate || ''
    formData.client = order.client
    formData.clientNo = order.clientNo || ''
    formData.projectName = order.projectName || ''
    formData.clientManagerName = order.clientManagerName || ''

    // 발주번호 기준 출하 현황 조회
    const shipmentStatus = await shipmentService.getShipmentStatusByOrder(order.deliveryRequestNo)
    console.log('출하 현황:', shipmentStatus)

    // 품목 정보 매핑 및 필터링
    const orderItems = order.items
      .map(item => {
        const statusItem = shipmentStatus.items.find(si => si.skuId === item.skuId)

        // 클라이언트에서 잔여수량 직접 계산
        // = 발주수량 - 전체출하누적
        const orderQty = item.quantity || 0
        const totalShippedQty = statusItem?.totalShippedQuantity || 0
        const remainingQuantity = Math.max(0, orderQty - totalShippedQty)
        const shippedQuantity = totalShippedQty

        return {
          itemId: item.itemId,
          itemName: item.productName || item.itemNm || item.itemName || '',
          skuId: item.skuId,
          skuName: item.skuNm || item.skuName || '',
          specification: item.specification,
          unit: item.unit || item.unitCd,
          quantity: item.quantity,
          shippingQuantity: 0,
          remainingQuantity,
          shippedQuantity,
          unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          amount: item.quantity * (typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice),
          deliveryLocation: item.deliveryLocation,
          deliveryDeadline: item.deliveryDeadline,
          deliveryTerms: item.deliveryTerms,
          optionItemNumber: item.optionItemNumber,
          itemClassificationNumber: item.itemClassificationNumber,
          itemIdentificationNumber: item.itemIdentificationNumber,
          inspectionExemption: item.inspectionExemption || 'N',
          midTermCompetitionItem: item.midTermCompetitionItem || 'N',
          sortOrder: item.sortOrder || 0,
          orderId: order.orderId,
          orderItemId: item.skuId
        }
      })
      .filter(item => item.remainingQuantity > 0)

    selectedOrderItems.value = orderItems

    if (selectedOrderItems.value.length === 0) {
      alert('출하 가능한 품목이 없습니다. 모든 수량이 이미 출하되었습니다.')
      closeOrderSelectPopup()
    }

    console.log('매핑된 품목 목록:', selectedOrderItems.value)
  } catch (error) {
    console.error('발주 정보 매핑 실패:', error)
    alert('발주 정보를 불러오는데 실패했습니다.')
  }
}

// 전체수량 설정
const setMaxQuantity = (item: OrderItem) => {
  item.shippingQuantity = item.remainingQuantity
}

// 출하수량 업데이트
const updateShippingQuantity = (item: OrderItem) => {
  if (item.shippingQuantity > item.remainingQuantity) {
    alert('출하수량은 잔여수량을 초과할 수 없습니다.')
    item.shippingQuantity = item.remainingQuantity
  } else if (item.shippingQuantity < 0) {
    item.shippingQuantity = 0
  }
}

// 총 출하수량
const totalShippingQuantity = computed(() => {
  return selectedOrderItems.value.reduce((sum, item) => sum + (item.shippingQuantity || 0), 0)
})

// 총 금액
const totalAmount = computed(() => {
  return selectedOrderItems.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
})

// 제출 처리
const handleSubmit = async () => {
  // 유효성 검사
  const validationRules = {
    deliveryRequestNo: [rules.required('납품요구번호')],
    shippingDate: [
      rules.required('출하일자'),
      (value: string) => {
        const today = new Date().toISOString().slice(0, 10)
        if (value < today) {
          return '출하일자는 오늘 이전 날짜로 설정할 수 없습니다'
        }
        return null
      }
    ],
    status: [rules.required('상태')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  await submit()
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, two-column-layout, items-table, items-section-header, items-table-wrapper.with-header, items-table tfoot
 * - admin-forms.css: form-input-*, form-select-*, info-group, info-grid, info-grid :deep(.form-field), info-grid :deep(.form-label), info-grid :deep(.required-mark), search-group
 * - admin-common.css: text-right, empty-message
 */

/* Page-specific: Shipping register page wrapper */
.shipping-register {
  padding: 0;
}

/* Page-specific: Total quantity display (blue highlight) */
.total-quantity-display {
  background: #eff6ff;
  color: #1e40af;
  font-weight: 600;
  border-color: #3b82f6;
}

/* Page-specific: Quantity column width */
.quantity-col {
  min-width: 120px;
}

/* Page-specific: Max quantity button */
.btn-max-quantity {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.btn-max-quantity:hover {
  background: #3b82f6;
  color: white;
}
</style>
