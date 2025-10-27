<template>
  <div class="transport-edit">
    <!-- 페이지 헤더 -->
    <UiPageHeader
      title="운송장 수정"
      description="운송장 정보를 수정합니다."
    >
      <template #actions>
        <button class="btn-secondary" @click="router.back()">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button class="btn-delete" @click="deleteTransport">
          <i class="fas fa-trash"></i>
          삭제
        </button>
        <button
          class="btn-print"
          @click="printTransport"
          :disabled="transportForm.status !== 'IN_PROGRESS'"
        >
          <i class="fas fa-print"></i>
          운송장 출력
        </button>
        <button class="btn-primary" @click="saveTransport">
          <i class="fas fa-save"></i>
          저장
        </button>
      </template>
    </UiPageHeader>

    <!-- 로딩 섹션 - 리팩토링: 공통 컴포넌트 사용 -->
    <AdminCommonLoadingSection v-if="loading" message="데이터를 불러오는 중..." />

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
              <FormField label="출하ID">
                <input
                  type="text"
                  v-model="transportForm.shipmentId"
                  class="form-input-md"
                  readonly
                  disabled
                >
              </FormField>
              <FormField label="납품요구번호">
                <input
                  type="text"
                  v-model="transportForm.deliveryRequestNo"
                  class="form-input-md"
                  readonly
                  disabled
                >
              </FormField>
              <FormField label="운송장번호">
                <input
                  type="text"
                  v-model="transportForm.trackingNumber"
                  class="form-input-md"
                  placeholder="자동 생성됨"
                  readonly
                  disabled
                >
              </FormField>
            </div>

            <!-- 2. 현장 담당자 정보 -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-user-hard-hat"></i>
                <span>현장 담당자 정보</span>
              </div>
              <div class="info-grid grid-3">
                <FormField label="현장담당자(포기공)">
                  <input
                    type="text"
                    v-model="transportForm.siteSupervisorName"
                    class="form-input-md"
                    placeholder="현장담당자명을 입력하세요"
                  >
                </FormField>
                <FormField label="현장 인수자">
                  <input
                    type="text"
                    v-model="transportForm.receiverName"
                    class="form-input-md"
                    placeholder="인수자명을 입력하세요"
                  >
                </FormField>
                <FormField label="인수자 연락처">
                  <input
                    type="tel"
                    v-model="transportForm.receiverPhone"
                    @input="handleReceiverPhoneInput"
                    class="form-input-md"
                    placeholder="010-0000-0000"
                    maxlength="13"
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
                    v-model="transportForm.deliveryMemo"
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
                      v-model="transportForm.zipcode"
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
                <FormField label="배송예정일">
                  <input
                    type="date"
                    v-model="transportForm.deliveryDate"
                    class="form-input-md"
                  >
                </FormField>
                <FormField label="배송지 주소" full-width>
                  <input
                    type="text"
                    v-model="transportForm.deliveryAddress"
                    class="form-input-lg"
                    placeholder="배송지 주소"
                    readonly
                  >
                </FormField>
                <FormField label="상세주소" full-width>
                  <input
                    type="text"
                    v-model="transportForm.addressDetail"
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
              <div class="info-grid grid-2">
                <FormField label="운송사명">
                  <input
                    type="text"
                    v-model="transportForm.carrierName"
                    class="form-input-md"
                    placeholder="운송사명을 입력하세요"
                  >
                </FormField>
                <FormField label="차량번호" required>
                  <input
                    type="text"
                    v-model="transportForm.vehicleNo"
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
                    v-model="transportForm.driverName"
                    class="form-input-md"
                    placeholder="기사명을 입력하세요"
                  >
                </FormField>
                <FormField label="기사 연락처">
                  <input
                    type="tel"
                    v-model="transportForm.driverPhone"
                    @input="handleDriverPhoneInput"
                    class="form-input-md"
                    placeholder="010-0000-0000"
                    maxlength="13"
                  >
                </FormField>
                <FormField label="배차/출차 시각">
                  <input
                    type="datetime-local"
                    v-model="transportForm.dispatchAt"
                    class="form-input-md"
                  >
                </FormField>
                <FormField label="도착 예정 시각">
                  <input
                    type="datetime-local"
                    v-model="transportForm.expectedArrival"
                    class="form-input-md"
                  >
                </FormField>
                <FormField label="운송장번호" full-width>
                  <input
                    type="text"
                    v-model="transportForm.trackingNumber"
                    class="form-input-md"
                    placeholder="자동 생성됨"
                    readonly
                    disabled
                  >
                </FormField>
              </div>
            </div>

            <!-- 3. 배송 상태 (수정 페이지 전용) -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-info-circle"></i>
                <span>배송 상태</span>
              </div>
              <div class="info-grid grid-1">
                <FormField label="상태">
                  <select
                    v-model="transportForm.status"
                    class="form-select"
                  >
                    <option value="PENDING">대기</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="COMPLETED">완료</option>
                    <option value="CANCELLED">취소</option>
                  </select>
                </FormField>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>

    <!-- 인수증 출력 팝업 -->
    <div v-if="showReceiptPopup" class="popup-overlay" @click="closeReceiptPopup">
      <div class="popup-content receipt-popup" @click.stop>
        <div class="popup-header">
          <h3>인수증 출력</h3>
          <button @click="closeReceiptPopup" class="popup-close">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="popup-body">
          <div class="receipt-preview">
            <!-- 공급/운반자 보관용 인수증 -->
            <div class="receipt-document">
              <div class="receipt-header">
                <div class="company-logo">
                  <img src="/images/common/logo.png" alt="LP LEADPOWER" class="logo-img">
                  <span class="company-name">LP LEADPOWER</span>
                </div>
                <div class="receipt-title">인 수 증</div>
                <div class="receipt-info">
                  <div class="retention-type">공급/운반자 보관용</div>
                  <div class="receipt-date">{{ receiptDate }}</div>
                </div>
              </div>

              <div class="receipt-content">
                <div class="info-table">
                  <div class="info-row">
                    <div class="info-label">거래처명</div>
                    <div class="info-value">{{ receiptData.clientName }}</div>
                    <div class="info-label">납품장소</div>
                    <div class="info-value">{{ receiptData.deliveryLocation }}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">현장담당자</div>
                    <div class="info-value">{{ receiptData.managerContact }}</div>
                    <div class="info-label">하차</div>
                    <div class="info-value">{{ receiptData.unloadingTime }}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">비고</div>
                    <div class="info-value full-width">{{ receiptData.remarks }}</div>
                  </div>
                </div>

                <div class="product-table">
                  <table>
                    <thead>
                      <tr>
                        <th>제품명</th>
                        <th>두께(t)</th>
                        <th>수량(장)</th>
                        <th>규격</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(product, index) in productList" :key="index">
                        <td>{{ product.name }}</td>
                        <td>{{ product.thickness }}</td>
                        <td>{{ product.quantity }}</td>
                        <td>{{ product.specification }}</td>
                        <td>{{ product.remarks }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="confirmation-text">
                  상기 물품의 현장인도를 확인함.
                </div>

                <div class="signature-section">
                  <div class="signature-field">
                    <span class="signature-label">물품 인수자</span>
                    <span class="signature-box">(인)</span>
                  </div>
                </div>

                <div class="driver-note">
                  *기사님 꼭 사진찍어서 운송사에 보내주세요* 안전!운전하세요
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="popup-footer">
          <button class="btn-primary" @click="printReceiptDocument">
            <i class="fas fa-print"></i>
            인수증 출력
          </button>
          <button class="btn-secondary" @click="closeReceiptPopup">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import { transportService } from '~/services/transport.service'
import type { TransportDetail, TransportUpdateRequest } from '~/services/transport.service'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentOrderStatus } from '~/services/shipment.service'
import { orderService } from '~/services/order.service'
import type { OrderDetailResponse } from '~/types/order'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 수정'
})

const router = useRouter()
const route = useRoute()
const loading = ref(true)

// 팝업 관련
const showReceiptPopup = ref(false)

// 현재 날짜
const receiptDate = ref(new Date().toISOString().split('T')[0])

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

// 운송장 정보 폼
const transportForm = ref({
  transportId: 0,                    // 배송 ID
  shipmentId: 0,                     // 출하 ID
  orderId: 0,                        // 발주 ID
  deliveryRequestNo: '',             // 납품요구번호
  zipcode: '',                       // 우편번호
  deliveryAddress: '',               // 배송지 주소
  addressDetail: '',                 // 상세주소
  siteSupervisorName: '',           // 현장담당자(포기공)
  receiverName: '',                 // 현장 인수자
  receiverPhone: '',                // 현장 인수자 연락처
  deliveryDate: '',                 // 배송예정일
  carrierName: '',                  // 운송사명
  trackingNumber: '',               // 운송장/트래킹번호
  driverName: '',                   // 기사명
  driverPhone: '',                  // 기사 연락처
  vehicleNo: '',                    // 차량번호
  dispatchAt: '',                   // 배차/출차 시각
  expectedArrival: '',              // 도착 예정 시각
  completedAt: null as string | null, // 배송 완료 시각
  status: 'PENDING',                // 상태
  deliveryMemo: '',                 // 배송 메모
})

// 전화번호 포맷팅 함수
const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '')

  // 길이에 따라 포맷 적용
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

// 인수자 연락처 포맷팅
const handleReceiverPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const formatted = formatPhoneNumber(input.value)
  transportForm.value.receiverPhone = formatted
}

// 기사 연락처 포맷팅
const handleDriverPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const formatted = formatPhoneNumber(input.value)
  transportForm.value.driverPhone = formatted
}

// 주소 검색
const searchAddress = () => {
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      transportForm.value.zipcode = data.zonecode
      transportForm.value.deliveryAddress = data.address
      transportForm.value.addressDetail = ''  // 상세주소 초기화
    }
  }).open()
}

// 폼 유효성 검사
const validateForm = (): boolean => {
  if (!transportForm.value.vehicleNo) {
    alert('차량번호를 입력해주세요.\n차량번호는 운송장번호 생성에 사용됩니다.')
    return false
  }

  if (!transportForm.value.deliveryDate) {
    alert('배송예정일을 입력해주세요.')
    return false
  }

  if (!transportForm.value.dispatchAt || !transportForm.value.expectedArrival) {
    alert('배차시각과 도착예정시각을 입력해주세요.')
    return false
  }

  return true
}

// 초기 데이터 로드
onMounted(async () => {
  try {
    const transportId = Number(route.params.id)
    if (!transportId) {
      alert('잘못된 접근입니다.')
      router.back()
      return
    }

    const transportDetail = await transportService.getTransportDetail(transportId)
    
    // datetime-local 입력을 위한 날짜/시간 포맷 변환
    transportForm.value = {
      ...transportDetail,
      dispatchAt: transportDetail.dispatchAt?.slice(0, 16) || '',
      expectedArrival: transportDetail.expectedArrival?.slice(0, 16) || '',
      completedAt: transportDetail.completedAt?.slice(0, 16) || null
    }

    console.log('운송 정보 로드:', transportForm.value)
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
    if (!validateForm()) {
      return
    }

    const transportData = {
      transportId: transportForm.value.transportId,
      shipmentId: transportForm.value.shipmentId,
      vehicleNo: transportForm.value.vehicleNo,
      deliveryDate: transportForm.value.deliveryDate,
      zipcode: transportForm.value.zipcode,
      deliveryAddress: transportForm.value.deliveryAddress,
      addressDetail: transportForm.value.addressDetail,
      siteSupervisorName: transportForm.value.siteSupervisorName,
      receiverName: transportForm.value.receiverName,
      receiverPhone: transportForm.value.receiverPhone,
      carrierName: transportForm.value.carrierName,
      driverName: transportForm.value.driverName,
      driverPhone: transportForm.value.driverPhone,
      dispatchAt: transportForm.value.dispatchAt,
      expectedArrival: transportForm.value.expectedArrival,
      status: transportForm.value.status,
      deliveryMemo: transportForm.value.deliveryMemo
    }

    console.log('운송장 수정 요청:', transportData)
    await transportService.updateTransport(transportForm.value.transportId, transportData)
    alert('운송장이 수정되었습니다.')
    router.back()
  } catch (error) {
    console.error('운송장 수정 실패:', error)
    alert('운송장 수정에 실패했습니다.')
  }
}

// 운송장 출력
const printTransport = async () => {
  if (transportForm.value.status !== 'IN_PROGRESS') {
    alert('진행중 상태일 때만 운송장을 출력할 수 있습니다.')
    return
  }

  try {
    // 운송장 상세 정보 조회
    const transportDetail = await transportService.getTransportDetail(transportForm.value.transportId)

    // 발주 ID로 발주 상세 정보 조회
    const orderDetail: OrderDetailResponse = await orderService.getOrderDetail(transportDetail.orderId)

    // 인수증 데이터 업데이트 - 발주 정보 기반
    receiptData.value = {
      clientName: orderDetail.client || '',
      deliveryLocation: transportForm.value.deliveryAddress || '',
      managerContact: `${transportForm.value.siteSupervisorName || ''} ${transportForm.value.receiverPhone || ''}`.trim(),
      unloadingTime: transportForm.value.expectedArrival?.slice(11, 16) || '',
      remarks: transportForm.value.deliveryMemo || ''
    }

    // 품목 목록 업데이트 - 발주의 품목 정보 기반
    productList.value = orderDetail.items.map(item => ({
      name: item.itemNm || item.itemName || '',
      thickness: item.specification || '',
      quantity: item.quantity.toString(),
      specification: `${item.skuNm || item.skuName || ''}`,
      remarks: `단위: ${item.unitCd || ''}`
    }))

    // 팝업 열기
    showReceiptPopup.value = true
  } catch (error) {
    console.error('인수증 데이터 로드 실패:', error)
    alert('인수증 데이터를 불러오는데 실패했습니다.')
  }
}

// 팝업 닫기
const closeReceiptPopup = () => {
  showReceiptPopup.value = false
}

// 인수증 문서 출력
const printReceiptDocument = () => {
  console.log('인수증 문서 출력')
  window.print()
  closeReceiptPopup()
}

// 운송장 삭제
const deleteTransport = async () => {
  if (!confirm('운송장을 삭제하시겠습니까?')) {
    return
  }

  try {
    await transportService.deleteTransport(transportForm.value.transportId)
    alert('운송장이 삭제되었습니다.')
    router.back()
  } catch (error) {
    console.error('운송장 삭제 실패:', error)
    alert('운송장 삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section base, two-column-layout, left-column, right-column
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

/* Responsive */
@media (max-width: 768px) {
  .content-section {
    padding: 1rem;
  }
}
</style>
