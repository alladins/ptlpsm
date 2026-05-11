<template>
  <div class="transport-register">
    <!-- 페이지 헤더 -->
    <PageHeader
      title="운송장 등록"
      icon="transport"
      icon-color="orange"
      description="운송장 정보를 등록합니다."
    >
      <template #actions>
        <button class="btn-secondary" @click="goBack">
          <i class="fas fa-times" />
          취소
        </button>
        <button
          class="btn-primary"
          :disabled="submitting || !canWrite || inventoryChecking"
          :title="saveButtonDisabledReason"
          @click="handleSubmit"
        >
          <i class="fas fa-save" />
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
                <i class="fas fa-shipping-fast" />
                <span>출하 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="출하NO" required :error="errors.shipmentNo">
                  <div class="search-group">
                    <input
                      v-model="formData.shipmentNo"
                      type="text"
                      class="form-input-md"
                      placeholder="출하NO를 선택하세요"
                      readonly
                    >
                    <button type="button" class="btn-search" @click="searchShipment">
                      <i class="fas fa-search" />
                      조회
                    </button>
                  </div>
                </FormField>
                <FormField label="사업명">
                  <input
                    v-model="formData.projectName"
                    type="text"
                    class="form-input-xl"
                    placeholder="-"
                    readonly
                  >
                </FormField>
                <FormField label="납품요구번호">
                  <input
                    v-model="formData.deliveryRequestNo"
                    type="text"
                    class="form-input-md"
                    placeholder="-"
                    readonly
                  >
                </FormField>
                <FormField label="수요기관">
                  <input
                    v-model="formData.clientName"
                    type="text"
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
                <i class="fas fa-exclamation-triangle" />
                <span>재고 부족 - 운송 등록 불가</span>
                <button class="btn-refresh" :disabled="inventoryChecking" @click="checkInventory(Number(formData.shipmentId))">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': inventoryChecking }" />
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
              <i class="fas fa-info-circle" />
              <span>발주수량 확인 완료 (실제 재고는 저장 시 최종 확인됩니다)</span>
            </div>

            <!-- 2. 현장 담당자 정보 (출하에서 가져온 정보 - 읽기전용) -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-user-hard-hat" />
                <span>현장 담당자 정보</span>
                <span class="readonly-badge">출하 정보에서 자동 입력</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="현장소장">
                  <input
                    v-model="formData.siteManagerName"
                    type="text"
                    class="form-input-md readonly-field"
                    placeholder="출하 선택 시 자동 입력"
                    readonly
                  >
                </FormField>
                <FormField label="건설사">
                  <input
                    v-model="formData.constructionCompany"
                    type="text"
                    class="form-input-md readonly-field"
                    placeholder="출하 선택 시 자동 입력"
                    readonly
                  >
                </FormField>
                <FormField label="인수자명">
                  <input
                    v-model="formData.receiverName"
                    type="text"
                    class="form-input-md readonly-field"
                    placeholder="출하 선택 시 자동 입력"
                    readonly
                  >
                </FormField>
                <FormField label="인수자 연락처">
                  <input
                    v-model="formData.receiverPhone"
                    type="tel"
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
                <i class="fas fa-info-circle" />
                <span>기타 정보</span>
              </div>
              <div class="info-grid grid-1">
                <FormField label="배송 메모" full-width>
                  <input
                    v-model="formData.deliveryMemo"
                    type="text"
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
                <i class="fas fa-map-marker-alt" />
                <span>배송지 정보</span>
                <span class="readonly-badge">출하 정보에서 자동 입력</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="우편번호">
                  <input
                    v-model="formData.zipcode"
                    type="text"
                    class="form-input-sm readonly-field"
                    placeholder="출하 선택 시 자동 입력"
                    readonly
                  >
                </FormField>
                <FormField label="배송예정일" required :error="errors.deliveryDate">
                  <input
                    v-model="formData.deliveryDate"
                    type="date"
                    class="form-input-md"
                    @change="onDeliveryDateChange"
                  >
                </FormField>
                <FormField label="배송지 주소" full-width>
                  <input
                    v-model="formData.deliveryAddress"
                    type="text"
                    class="form-input-xl readonly-field"
                    placeholder="출하 선택 시 자동 입력"
                    readonly
                  >
                </FormField>
                <FormField label="상세주소" full-width>
                  <input
                    v-model="formData.addressDetail"
                    type="text"
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
                <i class="fas fa-truck" />
                <span>운송 정보</span>
              </div>
              <div class="info-grid grid-3">
                <FormField label="기사명">
                  <select
                    v-model="selectedDriverId"
                    class="form-input-md"
                    @change="handleDriverChange"
                  >
                    <option value="">
                      기사를 선택하세요
                    </option>
                    <option v-for="driver in deliveryDrivers" :key="driver.userId" :value="driver.userId">
                      {{ driver.userName }} ({{ driver.companyName || '운송사 정보 없음' }})
                    </option>
                  </select>
                </FormField>
                <FormField label="운송사명">
                  <input
                    v-model="formData.carrierName"
                    type="text"
                    class="form-input-md"
                    placeholder="직접 입력 또는 기사 선택 시 자동 입력"
                  >
                </FormField>
                <FormField label="기사 연락처" required :error="errors.driverPhone">
                  <input
                    v-model="formData.driverPhone"
                    type="tel"
                    class="form-input-md"
                    placeholder="010-0000-0000"
                    maxlength="13"
                    @input="handleDriverPhoneInput"
                  >
                </FormField>
                <FormField label="차량번호">
                  <input
                    v-model="formData.vehicleNo"
                    type="text"
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
                    model-type="yyyy-MM-dd'T'HH:mm"
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
                    model-type="yyyy-MM-dd'T'HH:mm"
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
                    v-model="formData.trackingNumber"
                    type="text"
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
import { formatPhoneNumber, formatPhoneNumberInput, getLocalDateTimeString, getLocalDateString, getDefaultDateTimeString, toUtcIsoString } from '~/utils/format'
import { calculateTransportDates, syncDatesOnDeliveryDateChange, adjustExpectedArrivalOnDispatchChange } from '~/utils/transport-date'
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
  if (!formData.shipmentId) { return true }
  if (!inventoryStatus.value) { return true }
  return inventoryStatus.value.canDispatch
})

const saveButtonDisabledReason = computed(() => {
  if (!canWrite.value) { return '등록 권한이 없습니다' }
  if (submitting.value) { return '저장 중...' }
  if (inventoryChecking.value) { return '재고 확인 중...' }
  if (!inventoryAvailable.value) { return '재고 부족으로 운송 등록이 불가합니다' }
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
const deliveryDrivers = ref<UserByRole[]>([]) // DELIVERY_DRIVER (운송기사)

// 선택된 사용자 ID
const selectedDriverId = ref<number | ''>('') // 기사

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
      // KST datetime-local → UTC ISO-8601로 변환하여 API 전송
      dispatchAt: toUtcIsoString(data.dispatchAt),
      expectedArrival: toUtcIsoString(data.expectedArrival),
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
    siteManagerId: null as number | null, // 출하에서 가져옴
    siteManagerName: '', // 출하에서 가져옴
    constructionCompany: '', // 건설사 (출하에서 가져옴)
    receiverName: '',
    receiverPhone: '',
    carrierName: '',
    driverName: '',
    driverPhone: '',
    dispatchAt: getDefaultDateTimeString(7, 0), // 오늘 07:00
    expectedArrival: getDefaultDateTimeString(7, 0), // 오늘 07:00
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
  const adjusted = adjustExpectedArrivalOnDispatchChange(newValue, formData.expectedArrival)
  if (adjusted) {
    formData.expectedArrival = adjusted
  }
}

// 배송 예정일 변경 시 배차/출차 시각, 도착 예정 시각의 날짜도 함께 변경
const onDeliveryDateChange = () => {
  const result = syncDatesOnDeliveryDateChange(
    formData.deliveryDate,
    formData.dispatchAt,
    formData.expectedArrival
  )
  if (result.dispatchAt) { formData.dispatchAt = result.dispatchAt }
  if (result.expectedArrival) { formData.expectedArrival = result.expectedArrival }
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

      // 출하 상세 조회 → expectedArrivalDatetime(납기일자) 기준으로 날짜 자동 계산
      try {
        const detail = await shipmentService.getShipmentDetail(data.shipmentId) as any
        if (detail) {
          // 출하NO
          formData.shipmentNo = detail.shipmentNo || ''

          // 배송지 정보 (출하에서 가져옴)
          formData.zipcode = detail.zipcode || ''
          formData.deliveryAddress = detail.deliveryAddress || ''
          formData.addressDetail = detail.addressDetail || ''

          // 현장담당자 정보
          formData.siteManagerId = detail.siteManagerId || null
          formData.siteManagerName = detail.siteManagerName || ''
          formData.constructionCompany = detail.builderCompanyName || detail.siteManagerCompany || ''
          formData.receiverName = detail.receiverName || detail.siteManagerName || ''
          formData.receiverPhone = formatPhoneNumber(detail.receiverPhone || detail.siteManagerPhone || '')

          // 배송 일정 - expectedArrivalDatetime(납기일자) 기준으로 자동 계산
          const arrivalSource = detail.expectedArrivalDatetime || detail.expectedArrivalAt
          const transportDates = calculateTransportDates(arrivalSource)
          if (transportDates) {
            formData.deliveryDate = transportDates.deliveryDate
            formData.expectedArrival = transportDates.expectedArrival
            formData.dispatchAt = transportDates.dispatchAt

            console.log('[운송장 등록] URL 데이터 → 배송 일정 자동 설정:', {
              expectedArrivalDatetime: arrivalSource,
              ...transportDates
            })
          }

          // 재고 현황 확인
          await checkInventory(Number(data.shipmentId))
        }
      } catch (error) {
        console.error('출하 상세 조회 실패:', error)
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
    formData.constructionCompany = detail.builderCompanyName || detail.siteManagerCompany || ''
    formData.receiverName = detail.receiverName || detail.siteManagerName || ''
    formData.receiverPhone = formatPhoneNumber(detail.receiverPhone || detail.siteManagerPhone || '')

    // 배송 일정 정보 - expectedArrivalDatetime(납기일자) 기준으로 자동 계산
    const arrivalSource = detail.expectedArrivalDatetime || detail.expectedArrivalAt
    const transportDates = calculateTransportDates(arrivalSource)
    if (transportDates) {
      formData.deliveryDate = transportDates.deliveryDate
      formData.expectedArrival = transportDates.expectedArrival
      formData.dispatchAt = transportDates.dispatchAt

      console.log('[운송장 등록] 배송 일정 자동 설정:', {
        expectedArrivalDatetime: arrivalSource,
        ...transportDates
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
    const driver = deliveryDrivers.value.find((d: UserByRole) => d.userId === selectedDriverId.value)
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
