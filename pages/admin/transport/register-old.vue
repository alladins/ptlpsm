<template>
  <div class="transport-register">
    <UiPageHeader
      title="운송장 등록"
      description="운송장 정보를 등록하고 인수증을 출력합니다."
    >
      <template #actions>
        <button type="button" @click="goBack" class="btn-action btn-secondary">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button type="button" @click="printReceipt" class="btn-action btn-secondary">
          <i class="fas fa-print"></i>
          인수증 출력
        </button>
        <button type="submit" form="transport-form" :disabled="submitting" class="btn-action btn-primary">
          <i class="fas fa-save"></i>
          {{ submitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </UiPageHeader>

    <div class="content-section">
      <form id="transport-form" @submit.prevent="handleSubmit" class="register-form">
        <!-- 운송장 정보 -->
        <FormSection title="운송장 정보">
          <!-- 2열 레이아웃 컨테이너 -->
          <div class="two-column-layout">
            <!-- 좌측 컬럼 -->
            <div class="left-column">
              <!-- 1. 출하 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-shipping-fast"></i>
                  <span>출하 정보</span>
                </div>                
                  <FormField label="출하ID" required :error="errors.shipmentId">
                    <div class="search-group">
                      <input
                        type="text"
                        v-model="formData.shipmentId"
                        class="form-input-md"
                        placeholder="출하ID를 선택하세요"
                        readonly
                      >
                      <button type="button" class="btn-search" @click="searchShipment">
                        <i class="fas fa-search"></i>
                        조회
                      </button>
                    </div>
                  </FormField>                
              </div>

              <!-- 2. 배송지 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>배송지 정보</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="우편번호">
                    <div class="search-group">
                      <input
                        type="text"
                        v-model="formData.zipcode"
                        class="form-input-sm"
                        placeholder="우편번호"
                        readonly
                      >
                      <button type="button" class="btn-search" @click="searchAddress">
                        <i class="fas fa-search"></i>
                        검색
                      </button>
                    </div>
                  </FormField>
                  <FormField label="배송예정일" required :error="errors.deliveryDate">
                    <input
                      type="date"
                      v-model="formData.deliveryDate"
                      class="form-input-md"
                    >
                  </FormField>
                  <FormField label="배송지 주소" full-width>
                    <input
                      type="text"
                      v-model="formData.deliveryAddress"
                      class="form-input-lg"
                      placeholder="배송지 주소"
                      readonly
                    >
                  </FormField>
                  <FormField label="상세주소" full-width>
                    <input
                      type="text"
                      v-model="formData.addressDetail"
                      class="form-input-lg"
                      placeholder="상세주소를 입력하세요"
                    >
                  </FormField>
                </div>
              </div>

              <!-- 3. 현장 담당자 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-user-hard-hat"></i>
                  <span>현장 담당자 정보</span>
                </div>
                <div class="info-grid grid-1">
                  <FormField label="현장담당자(포기공)">
                    <input
                      type="text"
                      v-model="formData.siteSupervisorName"
                      class="form-input-md"
                      placeholder="현장담당자명을 입력하세요"
                    >
                  </FormField>
                  <FormField label="현장 인수자">
                    <input
                      type="text"
                      v-model="formData.receiverName"
                      class="form-input-md"
                      placeholder="인수자명을 입력하세요"
                    >
                  </FormField>
                  <FormField label="인수자 연락처">
                    <input
                      type="tel"
                      v-model="formData.siteSupervisorPhone"
                      class="form-input-md"
                      placeholder="010-0000-0000"
                      maxlength="13"
                    >
                  </FormField>
                </div>
              </div>
            </div>

            <!-- 우측 컬럼 -->
            <div class="right-column">
              <!-- 1. 운송 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-truck"></i>
                  <span>운송 정보</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="운송사명">
                    <input
                      type="text"
                      v-model="formData.carrierName"
                      class="form-input-md"
                      placeholder="운송사명을 입력하세요"
                    >
                  </FormField>
                  <FormField label="차량번호" required :error="errors.vehicleNo">
                    <input
                      type="text"
                      v-model="formData.vehicleNo"
                      class="form-input-md"
                      placeholder="차량번호를 입력하세요"
                    >
                    <template #hint>
                      차량번호를 기준으로 운송장번호가 자동 생성됩니다.
                    </template>
                  </FormField>
                  <FormField label="기사명">
                    <input
                      type="text"
                      v-model="formData.driverName"
                      class="form-input-md"
                      placeholder="기사명을 입력하세요"
                    >
                  </FormField>
                  <FormField label="기사 연락처">
                    <input
                      type="tel"
                      v-model="formData.driverPhone"
                      class="form-input-md"
                      placeholder="010-0000-0000"
                      maxlength="13"
                    >
                  </FormField>
                  <FormField label="배차/출차 시각">
                    <input
                      type="datetime-local"
                      v-model="formData.dispatchAt"
                      class="form-input-md"
                    >
                  </FormField>
                  <FormField label="도착 예정 시각">
                    <input
                      type="datetime-local"
                      v-model="formData.expectedArrival"
                      class="form-input-md"
                    >
                  </FormField>
                  <FormField label="운송장번호" full-width>
                    <input
                      type="text"
                      v-model="formData.trackingNumber"
                      class="form-input-md"
                      placeholder="자동 생성됨"
                      readonly
                      disabled
                    >
                  </FormField>
                </div>
              </div>

              <!-- 2. 기타 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-info-circle"></i>
                  <span>기타 정보</span>
                </div>
                <div class="info-grid grid-1">
                  <FormField label="배송 메모" full-width>
                    <input
                      type="text"
                      v-model="formData.deliveryMemo"
                      class="form-input-lg"
                      placeholder="배송 관련 메모를 입력하세요"
                    >
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- 출하 목록 팝업 -->
    <!-- TODO: ShipmentSelectPopup 컴포넌트 생성 필요 -->
    <!-- <AdminCommonShipmentSelectPopup
      v-if="showShipmentPopup"
      :show="showShipmentPopup"
      @close="closeShipmentPopup"
      @select="handleShipmentSelect"
    /> -->

    <!-- 인수증 출력 팝업 -->
    <!-- TODO: ReceiptPrintPopup 컴포넌트 생성 필요 -->
    <!-- <AdminCommonReceiptPrintPopup
      v-if="showReceiptPopup"
      :show="showReceiptPopup"
      :receipt-data="receiptData"
      :product-list="productList"
      @close="closeReceiptPopup"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentListItem } from '~/services/shipment.service'
import { formatPhoneNumber } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 등록'
})

const router = useRouter()
const route = useRoute()

// useRegisterForm 사용
const {
  formData,
  submitting,
  submit,
  goBack
} = useRegisterForm<any, any, any>({
  createFunction: async (data) => {
    const transportData = {
      shipmentId: Number(data.shipmentId),
      vehicleNo: data.vehicleNo,
      deliveryDate: data.deliveryDate,
      zipcode: data.zipcode,
      deliveryAddress: data.deliveryAddress,
      addressDetail: data.addressDetail,
      siteSupervisorName: data.siteSupervisorName,
      receiverName: data.receiverName,
      siteSupervisorPhone: data.siteSupervisorPhone,
      carrierName: data.carrierName,
      driverName: data.driverName,
      driverPhone: data.driverPhone,
      dispatchAt: data.dispatchAt,
      expectedArrival: data.expectedArrival,
      deliveryMemo: data.deliveryMemo
    }

    const response = await transportService.createTransport(transportData)
    return response
  },
  successRoute: '/admin/transport/list',
  defaultValues: {
    shipmentId: '',
    vehicleNo: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    zipcode: '',
    deliveryAddress: '',
    addressDetail: '',
    siteSupervisorName: '',
    receiverName: '',
    siteSupervisorPhone: '',
    carrierName: '',
    driverName: '',
    driverPhone: '',
    dispatchAt: new Date().toISOString().slice(0, 16),
    expectedArrival: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    deliveryMemo: '',
    status: 'PENDING',
    trackingNumber: ''
  },
  onCreateSuccess: (response) => {
    alert(`운송장이 등록되었습니다.\n운송장번호: ${response.trackingNumber}`)
  },
  onCreateError: (error) => {
    console.error('운송장 등록 실패:', error)
    alert('운송장 등록에 실패했습니다.')
  }
})

// useFormValidation 사용
const { errors, validateAll, rules } = useFormValidation({
  shipmentId: '',
  vehicleNo: '',
  deliveryDate: ''
})

// 팝업 상태
const showShipmentPopup = ref(false)
const showReceiptPopup = ref(false)

// 인수증 데이터
const receiptData = ref({
  clientName: '',
  deliveryLocation: '',
  managerContact: '',
  unloadingTime: '',
  remarks: ''
})

// 품목 목록
const productList = ref<Array<{
  name: string
  thickness: string
  quantity: string
  specification: string
  remarks: string
}>>([])

// URL 파라미터에서 데이터 로드
onMounted(async () => {
  if (route.query.data) {
    try {
      const data = JSON.parse(route.query.data as string)
      formData.shipmentId = data.shipmentId

      // 출하 ID로 배송 정보 조회
      try {
        const transportDetail = await transportService.getTransportByShipment(data.shipmentId)
        if (transportDetail) {
          Object.assign(formData, {
            zipcode: transportDetail.zipcode || '',
            deliveryAddress: transportDetail.deliveryAddress || '',
            addressDetail: transportDetail.addressDetail || '',
            siteSupervisorName: transportDetail.siteSupervisorName || '',
            receiverName: transportDetail.receiverName || '',
            siteSupervisorPhone: transportDetail.siteSupervisorPhone || '',
            deliveryDate: transportDetail.deliveryDate?.split('T')[0] || formData.deliveryDate,
            carrierName: transportDetail.carrierName || '',
            trackingNumber: transportDetail.trackingNumber || '',
            driverName: transportDetail.driverName || '',
            driverPhone: transportDetail.driverPhone || '',
            vehicleNo: transportDetail.vehicleNo || '',
            dispatchAt: transportDetail.dispatchAt?.slice(0, 16) || formData.dispatchAt,
            expectedArrival: transportDetail.expectedArrival?.slice(0, 16) || formData.expectedArrival,
            status: transportDetail.status || 'PENDING',
            deliveryMemo: transportDetail.deliveryMemo || ''
          })
        }
      } catch (error) {
        console.error('배송 정보 조회 실패:', error)
      }

      // 품목 목록 업데이트
      if (data.items) {
        productList.value = data.items.map((item: any) => ({
          name: item.itemName,
          thickness: item.specification,
          quantity: item.orderQuantity?.toString() || item.quantity?.toString() || '',
          specification: `${item.skuName} (${item.skuId})`,
          remarks: `단위: ${item.unit}`
        }))
      }
    } catch (error) {
      console.error('데이터 파싱 오류:', error)
    }
  }
})

// 출하ID 조회
const searchShipment = () => {
  showShipmentPopup.value = true
}

const closeShipmentPopup = () => {
  showShipmentPopup.value = false
}

// 출하 선택 처리
const handleShipmentSelect = async (shipment: ShipmentListItem) => {
  try {
    const detail = await shipmentService.getShipmentDetail(shipment.shipmentId)
    formData.shipmentId = detail.shipmentId.toString()

    // 출하 상세 정보 조회
    const orderStatus = await shipmentService.getShipmentStatusByOrder(detail.deliveryRequestNo)

    // 인수증 데이터 업데이트
    receiptData.value = {
      clientName: orderStatus.items[0]?.itemName?.split(' ')[0] || '',
      deliveryLocation: formData.deliveryAddress || '',
      managerContact: formData.siteSupervisorName || '',
      unloadingTime: formData.expectedArrival?.slice(11, 16) || '',
      remarks: formData.deliveryMemo || ''
    }

    // 품목 목록 업데이트
    productList.value = orderStatus.items.map(item => ({
      name: item.itemName || '',
      thickness: item.specification || '',
      quantity: item.orderQuantity.toString(),
      specification: `${item.skuName || ''} (${item.skuId})`,
      remarks: `단위: ${item.unit || ''}`
    }))

    closeShipmentPopup()
  } catch (error) {
    console.error('출하 정보 조회 실패:', error)
    alert('출하 정보를 불러오는데 실패했습니다.')
  }
}

// 주소 검색
const searchAddress = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.zipcode = data.zonecode
      formData.deliveryAddress = data.address
      formData.addressDetail = ''
    }
  }).open()
}

// 인수증 출력
const printReceipt = () => {
  showReceiptPopup.value = true
}

const closeReceiptPopup = () => {
  showReceiptPopup.value = false
}

// 제출 처리
const handleSubmit = async () => {
  // 유효성 검사
  const validationRules = {
    shipmentId: [rules.required('출하 정보')],
    vehicleNo: [rules.required('차량번호')],
    deliveryDate: [rules.required('배송예정일')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  if (!formData.dispatchAt || !formData.expectedArrival) {
    alert('배차시각과 도착예정시각을 입력해주세요.')
    return
  }

  await submit()
}
</script>

<style scoped>
.transport-register {
  min-height: 100vh;
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

/* 정보 그룹 */
.info-group {
  margin-bottom: 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.info-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to right, #eff6ff, #dbeafe);
  border-bottom: 1px solid #3b82f6;
  font-weight: 600;
  color: #1e40af;
  font-size: 0.875rem;
}

.info-grid {
  display: grid;
  gap: 0.6rem;
  padding: 0.9rem;
}

.info-grid.grid-1 {
  grid-template-columns: 1fr;
}

.info-grid.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.info-grid.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.info-grid.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* FormField 컴포넌트가 info-grid 내에서 올바르게 표시되도록 */
.info-grid :deep(.form-field) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-grid :deep(.form-field--full) {
  grid-column: 1 / -1;
}

.info-grid :deep(.form-label) {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.info-grid :deep(.required-mark) {
  color: #ef4444;
  font-size: 1rem;
}

/* 2열 레이아웃 */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.9rem;
  align-items: start;
}

.left-column .info-group,
.right-column .info-group {
  margin-bottom: 0;
}

/* 폼 인풋 사이즈 클래스 */
.form-input-xs {
  width: 60px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input-sm {
  width: 120px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input-md {
  width: 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input-lg {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input-sm[readonly],
.form-input-md[readonly],
.form-input-lg[readonly] {
  background: #f9fafb;
  color: #6b7280;
}

/* 검색 그룹 */
.search-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-search {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.btn-search:hover {
  background: #2563eb;
}

/* 반응형 */
@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
  }

  .info-grid.grid-4,
  .info-grid.grid-3,
  .info-grid.grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }

  .search-group {
    flex-direction: column;
    align-items: stretch;
  }

  .info-grid.grid-4,
  .info-grid.grid-3,
  .info-grid.grid-2 {
    grid-template-columns: 1fr;
  }

  .form-input-sm,
  .form-input-md {
    width: 100%;
  }
}
</style>
