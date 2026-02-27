<template>
  <div class="transport-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="운송장 등록"
      description="운송장 정보를 등록합니다."
    >
      <template #actions>
        <button class="btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-primary"
          @click="handleSubmit"
          :disabled="submitting || !canWrite || inventoryChecking"
          :title="saveButtonDisabledReason"
        >
          <i class="fas fa-save"></i>
          {{ inventoryChecking ? '재고 확인 중...' : submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

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
            <FormField label="출하NO" required :error="errors.shipmentNo">
              <div class="search-group">
                <input
                  type="text"
                  v-model="formData.shipmentNo"
                  class="form-input-md"
                  placeholder="출하NO를 선택하세요"
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

        <!-- 재고 현황 알림 -->
        <div v-if="inventoryStatus && !inventoryStatus.canDispatch" class="inventory-warning">
          <div class="warning-header">
            <i class="fas fa-exclamation-triangle"></i>
            <span>재고 부족 - 운송 등록 불가</span>
            <button class="btn-refresh" @click="checkInventory(Number(formData.shipmentId))" :disabled="inventoryChecking">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': inventoryChecking }"></i>
              재확인
            </button>
          </div>
          <div class="warning-items">
            <div v-for="item in inventoryStatus.items.filter(i => !i.sufficient)" :key="item.skuId" class="warning-item">
              <span class="sku-name">{{ item.skuName || item.skuId }}</span>
              <span class="shortage">필요: {{ item.requiredQuantity }} / 재고: {{ item.inventoryQuantity }} (부족: {{ item.shortageQuantity }})</span>
            </div>
          </div>
        </div>
        <div v-if="inventoryStatus && inventoryStatus.canDispatch" class="inventory-info">
          <i class="fas fa-info-circle"></i>
          <span>발주수량 확인 완료 (실제 재고는 저장 시 최종 확인됩니다)</span>
        </div>

        <!-- 2. 현장 담당자 정보 (출하에서 가져온 정보 - 읽기전용) -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-user-hard-hat"></i>
            <span>현장 담당자 정보</span>
            <span class="readonly-badge">출하 정보에서 자동 입력</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="현장소장">
              <input
                type="text"
                v-model="formData.siteManagerName"
                class="form-input-md readonly-field"
                placeholder="출하 선택 시 자동 입력"
                readonly
              >
            </FormField>
            <FormField label="현장 인수자">
              <input
                type="text"
                v-model="formData.receiverName"
                class="form-input-md readonly-field"
                placeholder="출하 선택 시 자동 입력"
                readonly
              >
            </FormField>
            <FormField label="인수자 연락처">
              <input
                type="tel"
                v-model="formData.receiverPhone"
                class="form-input-md readonly-field"
                placeholder="출하 선택 시 자동 입력"
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
        <!-- 1. 배송지 정보 (출하에서 가져온 정보 - 읽기전용) -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-map-marker-alt"></i>
            <span>배송지 정보</span>
            <span class="readonly-badge">출하 정보에서 자동 입력</span>
          </div>
          <div class="info-grid grid-2">
            <FormField label="우편번호">
              <input
                type="text"
                v-model="formData.zipcode"
                class="form-input-sm readonly-field"
                placeholder="출하 선택 시 자동 입력"
                readonly
              >
            </FormField>
            <FormField label="배송예정일" required :error="errors.deliveryDate">
              <input
                type="date"
                v-model="formData.deliveryDate"
                class="form-input-md"
                @change="onDeliveryDateChange"
              >
            </FormField>
            <FormField label="배송지 주소" full-width>
              <input
                type="text"
                v-model="formData.deliveryAddress"
                class="form-input-xl readonly-field"
                placeholder="출하 선택 시 자동 입력"
                readonly
              >
            </FormField>
            <FormField label="상세주소" full-width>
              <input
                type="text"
                v-model="formData.addressDetail"
                class="form-input-lg readonly-field"
                placeholder="출하 선택 시 자동 입력"
                readonly
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
                <option v-for="driver in deliveryDrivers" :key="driver.userid" :value="driver.userid">
                  {{ driver.userName }} ({{ driver.companyName || '운송사 정보 없음' }})
                </option>
              </select>
            </FormField>
            <FormField label="운송사명">
              <input
                type="text"
                v-model="formData.carrierName"
                class="form-input-md"
                placeholder="직접 입력 또는 기사 선택 시 자동 입력"
              >
            </FormField>
            <FormField label="기사 연락처" required :error="errors.driverPhone">
              <input
                type="tel"
                v-model="formData.driverPhone"
                @input="handleDriverPhoneInput"
                class="form-input-md"
                placeholder="010-0000-0000"
                maxlength="13"
              >
            </FormField>
            <FormField label="차량번호">
              <input
                type="text"
                v-model="formData.vehicleNo"
                class="form-input-md"
                placeholder="차량번호를 입력하세요"
              >
              <template #hint>
                기사 연락처 마지막 4자리를 기준으로 운송장번호가 자동 생성됩니다.
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
                :min-date="minDispatchDate"
                :clearable="false"
                @update:model-value="onDispatchAtChange"
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
                :min-date="minExpectedArrivalDate"
                :clearable="false"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import { shipmentService } from '~/services/shipment.service'
import { dispatchRequestService } from '~/services/dispatch-request.service'
import type { InventoryStatusResponse } from '~/types/dispatch-request'
import { userService } from '~/services/user.service'
import type { ShipmentListItem } from '~/services/shipment.service'
import type { UserByRole } from '~/types/user'
import { formatPhoneNumber, formatPhoneNumberInput, getLocalDateTimeString, getLocalDateString } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { usePermission } from '~/composables/usePermission'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import ShipmentSelectPopup from '~/components/admin/common/ShipmentSelectPopup.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 등록'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canWrite } = usePermission()

// 재고 현황 확인
const inventoryStatus = ref<InventoryStatusResponse | null>(null)
const inventoryChecking = ref(false)

const inventoryAvailable = computed(() => {
  if (!formData.shipmentId) return true
  if (!inventoryStatus.value) return true
  return inventoryStatus.value.canDispatch
})

const saveButtonDisabledReason = computed(() => {
  if (!canWrite.value) return '등록 권한이 없습니다'
  if (submitting.value) return '저장 중...'
  if (inventoryChecking.value) return '재고 확인 중...'
  if (!inventoryAvailable.value) return '재고 부족으로 운송 등록이 불가합니다'
  return ''
})

const checkInventory = async (shipmentId: number) => {
  inventoryChecking.value = true
  inventoryStatus.value = null
  try {
    inventoryStatus.value = await dispatchRequestService.checkInventoryStatus(shipmentId)
  } catch (error) {
    console.error('재고 현황 확인 실패:', error)
    inventoryStatus.value = null
  } finally {
    inventoryChecking.value = false
  }
}

// 사용자 목록
const deliveryDrivers = ref<UserByRole[]>([])  // DELIVERY_DRIVER (운송기사)

// 선택된 사용자 ID
const selectedDriverId = ref<number | ''>('')      // 기사

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
      // 배송지/현장담당자는 출하에서 가져온 값 사용
      zipcode: data.zipcode,
      deliveryAddress: data.deliveryAddress,
      addressDetail: data.addressDetail,
      siteManagerId: data.siteManagerId || null,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
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
    shipmentNo: '',
    projectName: '',
    deliveryRequestNo: '',
    clientName: '',
    vehicleNo: '',
    deliveryDate: getLocalDateString(),
    zipcode: '',
    deliveryAddress: '',
    addressDetail: '',
    siteManagerId: null as number | null,  // 출하에서 가져옴
    siteManagerName: '',                    // 출하에서 가져옴
    receiverName: '',
    receiverPhone: '',
    carrierName: '',
    driverName: '',
    driverPhone: '',
    dispatchAt: getLocalDateTimeString(),           // 현재 로컬 시간
    expectedArrival: getLocalDateTimeString(60),    // 현재 시간 + 1시간
    deliveryMemo: '',
    status: 'PENDING',
    trackingNumber: ''
  },
  onCreateSuccess: (response) => {
    alert(`운송장이 등록되었습니다.\n운송장번호: ${response.trackingNumber}`)
  },
  onCreateError: (error) => {
    console.error('운송장 등록 실패:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes('재고가 부족')) {
      alert('발주수량에서 아직 생산이 완료되지 않은 수량이 있습니다.\n생산 완료 후 저장이 가능합니다.')
    } else {
      alert('운송장 등록에 실패했습니다.\n' + errorMsg)
    }
  }
})

// useFormValidation 사용
const { errors, validateAll, rules } = useFormValidation({
  shipmentNo: '',
  deliveryDate: '',
  driverPhone: ''
})

// 배차/출차 시각: 배송 예정일 - 5일 00:00 이후부터 선택 가능
const minDispatchDate = computed(() => {
  if (formData.deliveryDate) {
    const deliveryDateObj = new Date(formData.deliveryDate)
    const minDate = new Date(deliveryDateObj)
    minDate.setDate(minDate.getDate() - 5)
    minDate.setHours(0, 0, 0, 0)
    return minDate
  }
  // 배송 예정일이 없으면 현재 시간 기준
  return new Date()
})

// 도착 예정 시각: 배차/출차 시각 이후로만 선택 가능
const minExpectedArrivalDate = computed(() => {
  if (formData.dispatchAt) {
    return new Date(formData.dispatchAt)
  }
  return new Date()
})

// 배차/출차 시각 변경 시 도착 예정 시각 자동 조정
const onDispatchAtChange = (newValue: string | Date | null) => {
  if (!newValue) return

  const dispatchTime = new Date(newValue)
  const expectedTime = formData.expectedArrival ? new Date(formData.expectedArrival) : null

  // 도착 예정 시각이 배차 시각보다 이전이면 배차 시각 + 1시간으로 자동 조정
  if (!expectedTime || expectedTime <= dispatchTime) {
    const newExpectedTime = new Date(dispatchTime.getTime() + 60 * 60 * 1000) // +1시간
    const year = newExpectedTime.getFullYear()
    const month = String(newExpectedTime.getMonth() + 1).padStart(2, '0')
    const day = String(newExpectedTime.getDate()).padStart(2, '0')
    const hours = String(newExpectedTime.getHours()).padStart(2, '0')
    const minutes = String(newExpectedTime.getMinutes()).padStart(2, '0')
    formData.expectedArrival = `${year}-${month}-${day}T${hours}:${minutes}`
  }
}

// 배송 예정일 변경 시 배차/출차 시각, 도착 예정 시각의 날짜도 함께 변경
const onDeliveryDateChange = () => {
  const newDate = formData.deliveryDate
  if (!newDate) return

  // 배차/출차 시각의 날짜 부분만 변경 (시간은 유지)
  if (formData.dispatchAt) {
    const dispatchTime = new Date(formData.dispatchAt)
    const [year, month, day] = newDate.split('-').map(Number)
    dispatchTime.setFullYear(year, month - 1, day)
    const hours = String(dispatchTime.getHours()).padStart(2, '0')
    const minutes = String(dispatchTime.getMinutes()).padStart(2, '0')
    formData.dispatchAt = `${newDate}T${hours}:${minutes}`
  }

  // 도착 예정 시각의 날짜 부분만 변경 (시간은 유지)
  if (formData.expectedArrival) {
    const expectedTime = new Date(formData.expectedArrival)
    const [year, month, day] = newDate.split('-').map(Number)
    expectedTime.setFullYear(year, month - 1, day)
    const hours = String(expectedTime.getHours()).padStart(2, '0')
    const minutes = String(expectedTime.getMinutes()).padStart(2, '0')
    formData.expectedArrival = `${newDate}T${hours}:${minutes}`
  }
}

// 팝업 상태
const showShipmentPopup = ref(false)

// URL 파라미터에서 데이터 로드
onMounted(async () => {
  // 운송기사 목록 로드
  try {
    // DELIVERY_DRIVER 목록 조회 (운송기사)
    const driverList = await userService.getUsersByRoles(['DELIVERY_DRIVER'])
    deliveryDrivers.value = driverList
    console.log('운송기사 목록:', deliveryDrivers.value)
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
            receiverName: transportDetail.receiverName || '',
            receiverPhone: transportDetail.receiverPhone || '',
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
    // 출하 상세 정보 조회 (발주 정보 + 배송지 + 현장담당자 정보 포함)
    const detail = await shipmentService.getShipmentDetail(shipment.shipmentId) as any

    // 기본 정보
    formData.shipmentId = detail.shipmentId.toString()
    formData.shipmentNo = detail.shipmentNo || ''
    formData.projectName = detail.projectName || ''
    formData.deliveryRequestNo = detail.deliveryRequestNo || ''
    formData.clientName = detail.client || ''

    // 배송지 정보 (출하에서 가져옴 - 읽기전용)
    formData.zipcode = detail.zipcode || ''
    formData.deliveryAddress = detail.deliveryAddress || ''
    formData.addressDetail = detail.addressDetail || ''

    // 현장담당자 정보 (출하에서 가져옴 - 읽기전용)
    formData.siteManagerId = detail.siteManagerId || null
    formData.siteManagerName = detail.siteManagerName || ''
    formData.receiverName = detail.receiverName || detail.siteManagerName || ''
    formData.receiverPhone = formatPhoneNumber(detail.receiverPhone || detail.siteManagerPhone || '')

    // 배송 일정 정보 - expectedArrivalDatetime(현장 도착 예정일시) 기준으로 설정
    // 서버 필드명: expectedArrivalDatetime (프론트엔드 별칭: expectedArrivalAt)
    const expectedArrival = detail.expectedArrivalDatetime || detail.expectedArrivalAt
    if (expectedArrival) {
      const arrivalDateTime = new Date(expectedArrival)

      // 1. 배송예정일: 현장 도착 예정일시의 날짜 부분
      const year = arrivalDateTime.getFullYear()
      const month = String(arrivalDateTime.getMonth() + 1).padStart(2, '0')
      const day = String(arrivalDateTime.getDate()).padStart(2, '0')
      formData.deliveryDate = `${year}-${month}-${day}`

      // 2. 도착 예정 시각: 현장 도착 예정일시 그대로
      const hours = String(arrivalDateTime.getHours()).padStart(2, '0')
      const minutes = String(arrivalDateTime.getMinutes()).padStart(2, '0')
      formData.expectedArrival = `${year}-${month}-${day}T${hours}:${minutes}`

      // 3. 배차/출차 시각: 도착 예정일 하루 전 같은 시각
      const dispatchDateTime = new Date(arrivalDateTime)
      dispatchDateTime.setDate(dispatchDateTime.getDate() - 1)
      const dispatchYear = dispatchDateTime.getFullYear()
      const dispatchMonth = String(dispatchDateTime.getMonth() + 1).padStart(2, '0')
      const dispatchDay = String(dispatchDateTime.getDate()).padStart(2, '0')
      const dispatchHours = String(dispatchDateTime.getHours()).padStart(2, '0')
      const dispatchMinutes = String(dispatchDateTime.getMinutes()).padStart(2, '0')
      formData.dispatchAt = `${dispatchYear}-${dispatchMonth}-${dispatchDay}T${dispatchHours}:${dispatchMinutes}`

      console.log('[운송장 등록] 배송 일정 자동 설정:', {
        expectedArrivalDatetime: expectedArrival,
        deliveryDate: formData.deliveryDate,
        expectedArrival: formData.expectedArrival,
        dispatchAt: formData.dispatchAt
      })
    }

    // 재고 현황 확인
    await checkInventory(Number(detail.shipmentId))

    closeShipmentPopup()
  } catch (error) {
    console.error('출하 정보 조회 실패:', error)
    alert('출하 정보를 불러오는데 실패했습니다.')
  }
}

// 기사 연락처 입력 시 포맷 적용 (숫자만 허용 + 자동 포맷팅)
const handleDriverPhoneInput = () => {
  formData.driverPhone = formatPhoneNumberInput(formData.driverPhone || '')
}

// 기사 선택 시 자동 입력
const handleDriverChange = () => {
  if (selectedDriverId.value) {
    const driver = deliveryDrivers.value.find((d: UserByRole) => d.userid === selectedDriverId.value)
    if (driver) {
      formData.driverName = driver.userName
      formData.carrierName = driver.companyName || ''
      formData.driverPhone = formatPhoneNumber(driver.phone || '')
    }
  } else {
    formData.driverName = ''
    formData.carrierName = ''
    formData.driverPhone = ''
  }
}

// 제출 처리
const handleSubmit = async () => {
  // 유효성 검사 (배송지/현장담당자는 출하에서 자동 입력되므로 제외)
  const validationRules = {
    shipmentNo: [rules.required('출하NO')],
    deliveryDate: [rules.required('배송예정일')],
    driverPhone: [rules.required('기사 연락처'), rules.phone()]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  // 출하 선택 여부 확인
  if (!formData.shipmentId) {
    alert('출하를 선택해 주세요.')
    return
  }

  if (!formData.dispatchAt || !formData.expectedArrival) {
    alert('배차시각과 도착예정시각을 입력해주세요.')
    return
  }

  // 배차/출차 시각이 배송 예정일 - 5일 00:00 이전인지 체크
  const dispatchTime = new Date(formData.dispatchAt)
  const deliveryDateObj = new Date(formData.deliveryDate)
  const minDispatchTime = new Date(deliveryDateObj)
  minDispatchTime.setDate(minDispatchTime.getDate() - 5)
  minDispatchTime.setHours(0, 0, 0, 0)

  if (dispatchTime < minDispatchTime) {
    const minDateStr = `${minDispatchTime.getFullYear()}-${String(minDispatchTime.getMonth() + 1).padStart(2, '0')}-${String(minDispatchTime.getDate()).padStart(2, '0')}`
    alert(`배차/출차 시각은 ${minDateStr} 00:00 이후로 설정해주세요.\n(배송 예정일 5일 전부터 가능)`)
    return
  }

  // 도착 예정 시각이 배차/출차 시각 이전인지 체크
  const expectedTime = new Date(formData.expectedArrival)
  if (expectedTime <= dispatchTime) {
    alert('도착 예정 시각은 배차/출차 시각 이후로 설정해주세요.')
    return
  }

  // 재고 부족 시 안내 메시지 (저장 차단)
  if (inventoryStatus.value && !inventoryStatus.value.canDispatch) {
    alert('발주수량에서 아직 생산이 완료되지 않은 수량이 있습니다.\n생산 완료 후 저장이 가능합니다.')
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

/* 인수자 선택 + 입력 복합 필드 */
.input-with-select {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-with-select select {
  flex-shrink: 0;
  width: 120px;
}

.input-with-select input {
  flex: 1;
}

/* 읽기전용 배지 */
.readonly-badge {
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
}

/* 읽기전용 필드 스타일 */
.readonly-field {
  background-color: #f8fafc !important;
  color: #64748b !important;
  cursor: not-allowed !important;
}

/* 재고 부족 경고 배너 */
.inventory-warning {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #ef4444;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
}
.inventory-warning .warning-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
}
.inventory-warning .btn-refresh {
  margin-left: auto;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background: white;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  color: #dc2626;
  cursor: pointer;
}
.inventory-warning .btn-refresh:hover {
  background: #fef2f2;
}
.inventory-warning .warning-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}
.inventory-warning .warning-item {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  color: #991b1b;
}
.inventory-warning .shortage {
  font-weight: 500;
}
.inventory-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-left: 4px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
  color: #2563eb;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }

  .input-with-select {
    flex-direction: column;
  }

  .input-with-select select,
  .input-with-select input {
    width: 100%;
  }
}
</style>
