<template>
  <div class="transport-edit">
    <!-- 페이지 헤더 (백업본 버튼 사용) -->
    <PageHeader
      title="운송장 수정"
      description="운송장 정보를 수정합니다."
    >
      <template #actions>
        <button class="btn-secondary" @click="router.back()">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-print"
          @click="printTransport"
        >
          <i class="fas fa-print"></i>
          운송장 출력
        </button>
        <button
          class="btn-primary"
          @click="saveTransport"
          :disabled="!canSave"
          :title="!canSave ? '대기 또는 진행중 상태에서만 저장할 수 있습니다.' : ''"
        >
          <i class="fas fa-save"></i>
          저장
        </button>
      </template>
    </PageHeader>

    <!-- 로딩 섹션 -->
    <LoadingSection v-if="loading" message="데이터를 불러오는 중..." />

    <div v-else class="content-section">
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
            <FormField label="출하ID" required>
              <input
                type="text"
                v-model="formData.shipmentId"
                class="form-input-md"
                readonly
                disabled
              >
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
            <FormField label="현장소장">
              <select
                v-model="selectedSupervisorId"
                @change="handleSupervisorChange"
                class="form-input-md"
              >
                <option value="">현장소장을 선택하세요</option>
                <option v-for="manager in siteManagers" :key="manager.userid" :value="manager.userid">
                  {{ manager.userName }} ({{ manager.companyName || '회사 정보 없음' }})
                </option>
              </select>
            </FormField>
            <FormField label="현장 인수자">
              <div class="input-with-select">
                <select
                  v-model="selectedReceiverId"
                  @change="handleReceiverChange"
                  class="form-input-sm"
                >
                  <option value="direct">직접 입력</option>
                  <option v-for="manager in siteManagers" :key="manager.userid" :value="manager.userid">
                    {{ manager.userName }}
                  </option>
                </select>
                <input
                  type="text"
                  v-model="formData.receiverName"
                  class="form-input-md"
                  placeholder="인수자명을 입력하세요"
                  :disabled="selectedReceiverId !== 'direct'"
                >
              </div>
            </FormField>
            <FormField label="인수자 연락처">
              <input
                type="tel"
                v-model="formData.receiverPhone"
                class="form-input-md"
                placeholder="010-0000-0000"
                @input="handleReceiverPhoneInput"
                :disabled="selectedReceiverId !== 'direct'"
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

        <!-- 4. 배송 상태 (수정 페이지 전용) -->
        <div class="info-group">
          <div class="info-group-header">
            <i class="fas fa-clipboard-check"></i>
            <span>배송 상태</span>
          </div>
          <div class="info-grid grid-1">
            <FormField label="상태">
              <input
                type="text"
                :value="statusText"
                class="form-input-md"
                readonly
                disabled
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
            <FormField label="배송예정일" required>
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
            <FormField label="운송사명">
              <input
                type="text"
                v-model="formData.carrierName"
                class="form-input-md"
                placeholder="운송사명을 입력하세요"
              >
            </FormField>
            <FormField label="차량번호" required>
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
                @input="handleDriverPhoneInput"
                class="form-input-md"
                placeholder="010-0000-0000"
                maxlength="13"
              >
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
              <div class="tracking-number-group">
                <input
                  type="text"
                  v-model="formData.trackingNumber"
                  class="form-input-md"
                  placeholder="자동 생성됨"
                  readonly
                  disabled
                >
                <button
                  class="btn-message"
                  @click="sendMessageToDriver"
                  :disabled="!canSendMessage"
                  title="기사에게 납품 안내 메시지 전송"
                >
                  <i class="fas fa-comment-dots"></i>
                  메시지 전송
                </button>
              </div>
            </FormField>
          </div>
        </div>
      </div>
      <!-- two-column-layout 종료 -->
    </div>
      </FormSection>
    </div>    
  </div>

<!-- 운송장 PDF 미리보기 모달 -->
<PdfPreviewModal
  :pdf-url="transportPdfUrl"
  :delivery-id="transportDeliveryId"
  :file-name="`운송장_${transportDeliveryId || 'unknown'}.pdf`"
  :show="showTransportPdfModal"
  @close="showTransportPdfModal = false"
/>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import { shipmentService } from '~/services/shipment.service'
import { deliveryService } from '~/services/delivery.service'
import { userService } from '~/services/user.service'
import type { UserByRole } from '~/types/user'
import { DELIVERY_ENDPOINTS } from '~/services/api/endpoints/delivery.endpoints'
import { TRANSPORT_ENDPOINTS } from '~/services/api/endpoints/transport.endpoints'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import { getApiBaseUrl } from '~/services/api'
import { useCommonStatus } from '~/composables/useCommonStatus'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'
import { formatPhoneNumberInput, formatPhoneNumber } from '~/utils/format'


definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 수정'
})

const router = useRouter()
const route = useRoute()
const loading = ref(true)

// 상태 관리 (DB 기반)
const { getStatusLabel } = useCommonStatus()

// 운송장 PDF 미리보기 모달
const showTransportPdfModal = ref(false)
const transportPdfUrl = ref<string>('')
const transportDeliveryId = ref<number | undefined>(undefined)

// 서명 이미지 URL (납품확인에서 가져옴)
const receiverSignatureUrl = ref<string | null>(null)

// 사용자 목록
const siteManagers = ref<UserByRole[]>([])  // SITE_MANAGER (현장소장/현장담당자)

// 선택된 사용자 ID
const selectedSupervisorId = ref<number | ''>('')  // 현장소장
const selectedReceiverId = ref<number | 'direct'>('direct')    // 현장 인수자 ('direct' = 직접입력)

// 운송장 정보 폼 (등록 페이지와 동일하게 formData 사용)
const formData = ref({
  transportId: 0,
  shipmentId: '',
  orderId: 0,
  deliveryRequestNo: '',
  projectName: '',
  clientName: '',
  vehicleNo: '',
  deliveryDate: '',
  zipcode: '',
  deliveryAddress: '',
  addressDetail: '',
  receiverName: '',
  receiverPhone: '',
  carrierName: '',
  driverName: '',
  driverPhone: '',
  dispatchAt: '',
  expectedArrival: '',
  deliveryMemo: '',
  status: 'PENDING',
  trackingNumber: ''
})

// 인수자 연락처 포맷팅 (공통 함수 사용)
const handleReceiverPhoneInput = () => {
  formData.value.receiverPhone = formatPhoneNumber(formData.value.receiverPhone || '')
}

// 기사 연락처 포맷팅 (공통 함수 사용)
const handleDriverPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  formData.value.driverPhone = formatPhoneNumberInput(input.value)
}

// 주소 검색
const searchAddress = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.value.zipcode = data.zonecode
      formData.value.deliveryAddress = data.address
      formData.value.addressDetail = ''
    }
  }).open()
}

// 현장소장 선택 시 인수자 기본값 자동 입력
const handleSupervisorChange = () => {
  if (selectedSupervisorId.value) {
    const supervisor = siteManagers.value.find(m => m.userid === selectedSupervisorId.value)
    if (supervisor) {
      // 인수자가 비어있으면 현장소장으로 기본값 설정
      if (!formData.value.receiverName) {
        selectedReceiverId.value = supervisor.userid
        formData.value.receiverName = supervisor.userName
        formData.value.receiverPhone = formatPhoneNumber(supervisor.phone || '')
      }
    }
  }
}

// 현장 인수자 선택 시 자동 입력
const handleReceiverChange = () => {
  if (selectedReceiverId.value === 'direct') {
    // 직접 입력 선택 시 입력창 초기화
    formData.value.receiverName = ''
    formData.value.receiverPhone = ''
  } else {
    // 현장소장 선택 시 자동 입력
    const receiver = siteManagers.value.find(m => m.userid === selectedReceiverId.value)
    if (receiver) {
      formData.value.receiverName = receiver.userName
      formData.value.receiverPhone = formatPhoneNumber(receiver.phone || '')
    }
  }
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    // 사용자 목록 로드 (SITE_MANAGER)
    const managers = await userService.getUsersByRoles(['SITE_MANAGER'])
    siteManagers.value = managers
    console.log('현장소장 목록:', siteManagers.value)

    const transportId = Number(route.params.id)
    if (!transportId) {
      alert('잘못된 접근입니다.')
      router.back()
      return
    }

    const transportDetail = await transportService.getTransportDetail(transportId)

    // 출하 상세 정보 조회 (사업명, 납품요구번호, 수요기관 정보 획득 + 현장소장 ID)
    let shipmentDetail: any = null
    if (transportDetail.shipmentId) {
      try {
        shipmentDetail = await shipmentService.getShipmentDetail(transportDetail.shipmentId)
      } catch (error) {
        console.error('출하 정보 로드 실패:', error)
      }
    }

    // formData에 데이터 매핑
    formData.value = {
      transportId: transportDetail.transportId,
      shipmentId: transportDetail.shipmentId?.toString() || '',
      orderId: transportDetail.orderId || 0,
      deliveryRequestNo: shipmentDetail?.deliveryRequestNo || transportDetail.deliveryRequestNo || '',
      projectName: shipmentDetail?.projectName || '',
      clientName: shipmentDetail?.client || '',
      vehicleNo: transportDetail.vehicleNo || '',
      deliveryDate: transportDetail.deliveryDate?.split('T')[0] || '',
      zipcode: transportDetail.zipcode || '',
      deliveryAddress: transportDetail.deliveryAddress || '',
      addressDetail: transportDetail.addressDetail || '',
      receiverName: transportDetail.receiverName || '',
      receiverPhone: formatPhoneNumber(transportDetail.receiverPhone || ''),
      carrierName: transportDetail.carrierName || '',
      driverName: transportDetail.driverName || '',
      driverPhone: formatPhoneNumber(transportDetail.driverPhone || ''),
      dispatchAt: transportDetail.dispatchAt?.slice(0, 16) || '',
      expectedArrival: transportDetail.expectedArrival?.slice(0, 16) || '',
      deliveryMemo: transportDetail.deliveryMemo || '',
      status: transportDetail.status || 'PENDING',
      trackingNumber: transportDetail.trackingNumber || ''
    }

    // 현장소장 셀렉트 박스 매핑 (운송 상세에서 siteManagerId 우선 사용)
    if (transportDetail.siteManagerId) {
      const matchedManager = siteManagers.value.find(m => m.userid === transportDetail.siteManagerId)
      if (matchedManager) {
        selectedSupervisorId.value = matchedManager.userid
      }
    } else if (shipmentDetail?.siteManagerId) {
      // 운송에 없으면 출하 상세에서 가져오기
      const matchedManager = siteManagers.value.find(m => m.userid === shipmentDetail.siteManagerId)
      if (matchedManager) {
        selectedSupervisorId.value = matchedManager.userid
      }
    }

    // 인수자 매핑: 저장된 인수자명으로 현장소장 목록에서 찾기
    if (formData.value.receiverName) {
      const matchedByName = siteManagers.value.find(m => m.userName === formData.value.receiverName)
      if (matchedByName) {
        // 현장소장 목록에 있으면 해당 ID 선택
        selectedReceiverId.value = matchedByName.userid
      } else {
        // 현장소장 목록에 없으면 직접 입력으로 설정
        selectedReceiverId.value = 'direct'
      }
    } else {
      // 인수자명이 없으면 직접 입력 모드
      selectedReceiverId.value = 'direct'
    }

    console.log('운송 정보 로드:', formData.value)
    console.log('현장소장 매핑:', { selectedSupervisorId: selectedSupervisorId.value, selectedReceiverId: selectedReceiverId.value })
  } catch (error) {
    console.error('운송 정보 로드 실패:', error)
    alert('운송 정보를 불러오는데 실패했습니다.')
    router.back()
  } finally {
    loading.value = false
  }
})

// 운송 정보 저장
const saveTransport = async () => {
  try {
    // 유효성 검사
    if (!formData.value.vehicleNo) {
      alert('차량번호를 입력해주세요.\n차량번호는 운송장번호 생성에 사용됩니다.')
      return
    }

    if (!formData.value.deliveryDate) {
      alert('배송예정일을 입력해주세요.')
      return
    }

    if (!formData.value.dispatchAt || !formData.value.expectedArrival) {
      alert('배차시각과 도착예정시각을 입력해주세요.')
      return
    }

    const transportData = {
      transportId: formData.value.transportId,
      shipmentId: Number(formData.value.shipmentId),
      vehicleNo: formData.value.vehicleNo,
      deliveryDate: formData.value.deliveryDate,
      zipcode: formData.value.zipcode,
      deliveryAddress: formData.value.deliveryAddress,
      addressDetail: formData.value.addressDetail,
      siteManagerId: selectedSupervisorId.value || null,
      receiverName: formData.value.receiverName,
      receiverPhone: formData.value.receiverPhone,
      carrierName: formData.value.carrierName,
      driverName: formData.value.driverName,
      driverPhone: formData.value.driverPhone,
      dispatchAt: formData.value.dispatchAt,
      expectedArrival: formData.value.expectedArrival,
      status: formData.value.status,
      deliveryMemo: formData.value.deliveryMemo
    }

    console.log('운송장 수정 요청:', transportData)
    await transportService.updateTransport(formData.value.transportId, transportData)
    alert('운송장이 수정되었습니다.')
    router.back()
  } catch (error) {
    console.error('운송장 수정 실패:', error)
    alert('운송장 수정에 실패했습니다.')
  }
}

// 운송장 출력 (PDF 미리보기)
const printTransport = async () => {
  try {
    // 운송장 상세 정보 조회
    const transportDetail = await transportService.getTransportDetail(formData.value.transportId)

    // ===== CASE 1: 완료 상태 - 저장된 PDF 조회만 (생성 안 함) =====
    if (transportDetail.deliveryId && transportDetail.status === 'COMPLETED') {
      // SignatureViewer 모달로 PDF 표시 (Authorization 헤더 자동 추가)
      transportPdfUrl.value = DELIVERY_ENDPOINTS.receiptPdf(transportDetail.deliveryId)
      transportDeliveryId.value = transportDetail.deliveryId
      showTransportPdfModal.value = true
      return
    }

    // ===== CASE 2: 진행중/대기 또는 PDF 없음 - PDF 생성 후 미리보기 =====
    console.log('운송장 PDF 생성 시작:', formData.value.transportId)

    // 1. 서버에 PDF 생성 요청
    const generateResponse = await fetch(TRANSPORT_ENDPOINTS.generatePdf(formData.value.transportId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!generateResponse.ok) {
      throw new Error(`PDF 생성 실패: ${generateResponse.status}`)
    }

    console.log('PDF 생성 완료, 미리보기 모달 열기')

    // 2. PDF 미리보기 모달 열기 (Authorization 헤더 자동 포함)
    transportPdfUrl.value = TRANSPORT_ENDPOINTS.receiptPdf(formData.value.transportId)
    transportDeliveryId.value = undefined // transport용이므로 deliveryId 없음
    showTransportPdfModal.value = true    

  } catch (error) {
    console.error('인수증 데이터 로드 실패:', error)
    alert('인수증 데이터를 불러오는데 실패했습니다.')
  }
}

// 상태 텍스트 변환 (DB 기반)
const statusText = computed(() => {
  return getStatusLabel(formData.value.status)
})

// 저장 가능 여부 (대기 또는 진행중일 때만)
const canSave = computed(() => {
  return ['PENDING', 'IN_PROGRESS'].includes(formData.value.status)
})

// 메시지 전송 가능 여부 체크
const canSendMessage = computed(() => {
  return formData.value.status === 'IN_PROGRESS' &&
         formData.value.trackingNumber &&
         formData.value.driverPhone
})

// 기사에게 메시지 전송 (deliveryService 사용)
const sendMessageToDriver = async () => {
  const confirmed = confirm(
    `기사에게 메시지를 전송하시겠습니까?\n\n` +
    `기사명: ${formData.value.driverName || '(미입력)'}\n` +
    `연락처: ${formData.value.driverPhone}\n` +
    `운송장번호: ${formData.value.trackingNumber}`
  )

  if (!confirmed) return

  try {
    // deliveryService로 납품 생성 및 토큰 발급
    const result = await deliveryService.createDelivery(Number(route.params.id))

    console.log('메시지 발송 결과:', result)

    // URL 팝업 표시 (임시: alert 대신 prompt로 URL 복사 가능하게)
    const copyUrl = confirm(
      `메시지가 생성되었습니다.\n\n` +
      `아래 URL을 기사에게 전달해주세요:\n` +
      `${result.mobileUrl}\n\n` +
      `만료 시간: ${new Date(result.tokenExpiresAt).toLocaleString('ko-KR')}\n\n` +
      `URL을 클립보드에 복사하시겠습니까?`
    )

    if (copyUrl) {
      // 클립보드에 URL 복사
      try {
        await navigator.clipboard.writeText(result.mobileUrl)
        alert('URL이 클립보드에 복사되었습니다.')
      } catch (err) {
        // 클립보드 API 실패 시 수동 복사
        prompt('아래 URL을 복사하세요:', result.mobileUrl)
      }
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    alert(`메시지 전송에 실패했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section base, form actions
 * - admin-receipts.css: receipt-popup, receipt-preview, receipt-document
 * - admin-forms.css: form-input-*, info-group, info-grid, info-group-header, form-select, search-group
 * - admin-common.css: btn-primary, btn-secondary, btn-print, btn-delete, btn-search, popup-overlay
 */

/* Page-specific: Transport edit layout */
.transport-edit {
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

/* 영역 구분선 (절취선) */
.receipt-separator {
  margin: 0.75rem 0;
  padding: 0.25rem 0;
  border-top: 2px dashed #999;
  border-bottom: 2px dashed #999;
  text-align: center;
  font-size: 0.75rem;
  color: #666;
  background: #f5f5f5;
}

.receipt-separator::before {
  content: '✂ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✂';
  letter-spacing: 0.1em;
}

/* @media print 블록 제거 - admin-receipts.css에서 관리 */

/* 운송장번호 + 메시지 전송 버튼 레이아웃 */
.tracking-number-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tracking-number-group input {
  flex: 1;
}

/* 메시지 전송 버튼 */
.btn-message {
  padding: 0.625rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-message:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.btn-message:active:not(:disabled) {
  transform: translateY(0);
}

.btn-message:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-message i {
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }

  .tracking-number-group {
    flex-direction: column;
    align-items: stretch;
  }

  .tracking-number-group input {
    width: 100%;
  }

  .btn-message {
    width: 100%;
    justify-content: center;
  }
}

/* 서명 이미지 스타일 */
.signature-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  background: white;
}

.signature-image {
  max-width: 100%;
  max-height: 80px;
  width: auto;
  height: auto;
  object-fit: contain;
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
</style>
