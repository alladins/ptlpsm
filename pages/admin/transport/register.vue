<template>
  <div class="transport-register">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="운송장 등록"
      description="운송장 정보를 등록합니다."
    >
      <template #actions>
        <button class="btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button class="btn-primary" @click="handleSubmit" :disabled="submitting">
          <i class="fas fa-save"></i>
          {{ submitting ? '등록 중...' : '등록' }}
        </button>
      </template>
    </UiPageHeader>

    <div class="content-section">
      <!-- 운송장 정보 입력 폼 -->
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
          <div class="info-grid grid-2">
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
            <FormField label="사업명">
              <input
                type="text"
                v-model="formData.projectName"
                class="form-input-xl"
                placeholder="-"
                readonly
              >
            </FormField>
            <FormField label="납품요구번호">
              <input
                type="text"
                v-model="formData.deliveryRequestNo"
                class="form-input-md"
                placeholder="-"
                readonly
              >
            </FormField>
            <FormField label="수요기관">
              <input
                type="text"
                v-model="formData.clientName"
                class="form-input-xl"
                placeholder="-"
                readonly
              >
            </FormField>
          </div>
        </div>

        <!-- 2. 현장 담당자 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-user-hard-hat"></i>
            <span>현장 담당자 정보</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="현장담당자(포기공)">
              <select
                v-model="formData.siteSupervisorName"
                class="form-input-md"
              >
                <option value="">현장담당자를 선택하세요</option>
                <option v-for="manager in siteManagers" :key="manager.id" :value="manager.userName">
                  {{ manager.userName }} ({{ manager.companyName || '회사 정보 없음' }})
                </option>
              </select>
            </FormField>
            <FormField label="현장 인수자">
              <select
                v-model="selectedReceiverId"
                @change="handleReceiverChange"
                class="form-input-md"
              >
                <option value="">현장 인수자를 선택하세요</option>
                <option v-for="manager in siteManagers" :key="manager.id" :value="manager.id">
                  {{ manager.userName }} ({{ manager.companyName || '회사 정보 없음' }})
                </option>
              </select>
            </FormField>
            <FormField label="인수자 연락처">
              <input
                type="tel"
                v-model="formData.siteSupervisorPhone"
                class="form-input-md"
                placeholder="현장 인수자 선택 시 자동 입력"
                readonly
              >
            </FormField>
          </div>
        </div>

        <!-- 3. 기타 정보 -->
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

      <!-- 우측 컬럼 -->
      <div class="right-column">
        <!-- 1. 배송지 정보 -->
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
                class="form-input-xl"
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

        <!-- 2. 운송 정보 -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-truck"></i>
            <span>운송 정보</span>
          </div>
          <div class="info-grid grid-3">
            <FormField label="기사명">
              <select
                v-model="selectedDriverId"
                @change="handleDriverChange"
                class="form-input-md"
              >
                <option value="">기사를 선택하세요</option>
                <option v-for="courier in couriers" :key="courier.id" :value="courier.id">
                  {{ courier.userName }} ({{ courier.companyName || '운송사 정보 없음' }})
                </option>
              </select>
            </FormField>
            <FormField label="운송사명">
              <input
                type="text"
                v-model="formData.carrierName"
                class="form-input-md"
                placeholder="기사 선택 시 자동 입력"
                readonly
              >
            </FormField>
            <FormField label="기사 연락처">
              <input
                type="tel"
                v-model="formData.driverPhone"
                class="form-input-md"
                placeholder="기사 선택 시 자동 입력"
                readonly
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
            <FormField label="배차/출차 시각">
              <VueDatePicker
                v-model="formData.dispatchAt"
                :enable-time-picker="true"
                :format="'yyyy-MM-dd HH:mm'"
                locale="ko"
                time-picker-inline
                :action-row="{ showNow: true, showCancel: true, showSelect: true }"
                placeholder="날짜와 시간을 선택하세요"
                auto-apply
                :teleport="true"
              />
            </FormField>
            <FormField label="도착 예정 시각">
              <VueDatePicker
                v-model="formData.expectedArrival"
                :enable-time-picker="true"
                :format="'yyyy-MM-dd HH:mm'"
                locale="ko"
                time-picker-inline
                :action-row="{ showNow: true, showCancel: true, showSelect: true }"
                placeholder="날짜와 시간을 선택하세요"
                auto-apply
                :teleport="true"
              />
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
      </div>
      <!-- two-column-layout 종료 -->
    </div>
      </FormSection>
    </div>

    <!-- 출하 선택 팝업 -->
    <ShipmentSelectPopup
      v-if="showShipmentPopup"
      :show="showShipmentPopup"
      @close="closeShipmentPopup"
      @select="handleShipmentSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import { shipmentService } from '~/services/shipment.service'
import { userService } from '~/services/user.service'
import type { ShipmentListItem } from '~/services/shipment.service'
import type { UserByRole } from '~/types/user'
import { formatPhoneNumber } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import ShipmentSelectPopup from '~/components/admin/common/ShipmentSelectPopup.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 등록'
})

const router = useRouter()
const route = useRoute()

// 사용자 목록
const siteManagers = ref<UserByRole[]>([])  // SITE_MANAGER (현장소장/현장담당자)
const couriers = ref<UserByRole[]>([])       // COURIER (배송 기사)

// 선택된 사용자 ID
const selectedReceiverId = ref<number | ''>('')
const selectedDriverId = ref<number | ''>('')

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
    projectName: '',
    deliveryRequestNo: '',
    clientName: '',
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

// URL 파라미터에서 데이터 로드
onMounted(async () => {
  // 사용자 목록 로드
  try {
    // SITE_MANAGER 목록 조회 (현장소장/현장담당자)
    const managers = await userService.getUsersByRoles(['SITE_MANAGER'])
    siteManagers.value = managers

    // COURIER 목록 조회
    const courierList = await userService.getUsersByRoles(['COURIER'])
    couriers.value = courierList

    console.log('현장 담당자 목록:', siteManagers.value)
    console.log('배송 기사 목록:', couriers.value)
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
  }

  // URL 파라미터에서 데이터 로드
  if (route.query.data) {
    try {
      const data = JSON.parse(route.query.data as string)
      formData.shipmentId = data.shipmentId
      formData.projectName = data.projectName || ''
      formData.deliveryRequestNo = data.deliveryRequestNo || ''
      formData.clientName = data.clientName || ''

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
    formData.projectName = detail.projectName || ''
    formData.deliveryRequestNo = detail.deliveryRequestNo || ''
    formData.clientName = detail.client || ''

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

// 현장 인수자 선택 시 자동 입력
const handleReceiverChange = () => {
  if (selectedReceiverId.value) {
    const receiver = siteManagers.value.find(m => m.id === selectedReceiverId.value)
    if (receiver) {
      formData.receiverName = receiver.userName
      formData.siteSupervisorPhone = receiver.phone || ''
    }
  } else {
    formData.receiverName = ''
    formData.siteSupervisorPhone = ''
  }
}

// 기사 선택 시 자동 입력
const handleDriverChange = () => {
  if (selectedDriverId.value) {
    const driver = couriers.value.find(c => c.id === selectedDriverId.value)
    if (driver) {
      formData.driverName = driver.userName
      formData.carrierName = driver.companyName || ''
      formData.driverPhone = driver.phone || ''
    }
  } else {
    formData.driverName = ''
    formData.carrierName = ''
    formData.driverPhone = ''
  }
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
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section base, form actions
 * - admin-forms.css: form-input-*, info-group, info-grid, date-time-input
 * - admin-common.css: page wrapper styles
 */

/* Page-specific: Transport register layout */
.transport-register {
  padding: 0;
  margin-bottom: 0;
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

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
}
</style>
