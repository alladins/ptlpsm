<template>
  <div class="transport-edit">
    <!-- 페이지 헤더 (백업본 버튼 사용) -->
    <PageHeader
      title="운송장 수정"
      description="운송장 정보를 수정합니다."
      icon="transport"
      icon-color="orange"
    >
      <template #actions>
        <button class="btn-secondary" @click="handleGoBack">
          <i class="fas fa-list" />
          목록
        </button>
        <button
          class="btn-print"
          @click="printTransport"
        >
          <i class="fas fa-print" />
          운송장 출력
        </button>
        <button
          class="btn-primary"
          :disabled="!canSave"
          :title="!canSave ? getSaveDisabledReason : ''"
          @click="saveTransport"
        >
          <i class="fas fa-save" />
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
                <i class="fas fa-shipping-fast" />
                <span>출하 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="출하NO" required>
                  <input
                    v-model="formData.shipmentNo"
                    type="text"
                    class="form-input-md"
                    readonly
                    disabled
                  >
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

            <!-- 2. 현장 담당자 정보 (수정 페이지에서는 읽기 전용) -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-user-hard-hat" />
                <span>현장 담당자 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="현장소장">
                  <select
                    v-model="selectedSupervisorId"
                    class="form-input-md"
                    disabled
                  >
                    <option value="">
                      현장소장을 선택하세요
                    </option>
                    <option v-for="manager in siteManagers" :key="manager.userId" :value="manager.userId">
                      {{ manager.userName }} ({{ manager.companyName || '회사 정보 없음' }})
                    </option>
                  </select>
                </FormField>
                <FormField label="건설사">
                  <input
                    v-model="constructionCompany"
                    type="text"
                    class="form-input-md readonly-field"
                    placeholder=""
                    readonly
                  >
                </FormField>
                <FormField label="인수자명">
                  <input
                    v-model="formData.receiverName"
                    type="text"
                    class="form-input-md"
                    disabled
                    readonly
                  >
                </FormField>
                <FormField label="인수자 연락처">
                  <input
                    v-model="formData.receiverPhone"
                    type="tel"
                    class="form-input-md"
                    disabled
                    readonly
                  >
                </FormField>
              </div>
            </div>

            <!-- 3. 기타 정보 (배송 메모 + 상태 통합) -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-info-circle" />
                <span>기타 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="배송 메모">
                  <input
                    v-model="formData.deliveryMemo"
                    type="text"
                    class="form-input-lg"
                    placeholder="배송 관련 메모를 입력하세요"
                    disabled
                    readonly
                  >
                </FormField>
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
            <!-- 1. 배송지 정보 (수정 페이지에서는 읽기 전용) -->
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-map-marker-alt" />
                <span>배송지 정보</span>
              </div>
              <div class="info-grid grid-2">
                <FormField label="우편번호">
                  <div class="search-group">
                    <input
                      v-model="formData.zipcode"
                      type="text"
                      class="form-input-sm"
                      placeholder="우편번호"
                      readonly
                      disabled
                    >
                    <button type="button" class="btn-search" disabled>
                      <i class="fas fa-search" />
                      검색
                    </button>
                  </div>
                </FormField>
                <FormField label="배송예정일">
                  <input
                    v-model="formData.deliveryDate"
                    type="date"
                    class="form-input-md"
                    readonly
                    disabled
                  >
                </FormField>
                <FormField label="배송지 주소" full-width>
                  <input
                    v-model="formData.deliveryAddress"
                    type="text"
                    class="form-input-xl"
                    placeholder="배송지 주소를 검색하세요"
                    readonly
                    disabled
                  >
                </FormField>
                <FormField label="상세주소" full-width>
                  <input
                    v-model="formData.addressDetail"
                    type="text"
                    class="form-input-lg"
                    placeholder="상세주소를 입력하세요"
                    readonly
                    disabled
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
                <FormField label="운송사명">
                  <input
                    v-model="formData.carrierName"
                    type="text"
                    class="form-input-md"
                    placeholder="운송사명을 입력하세요"
                    :readonly="!isSavableStatus"
                  >
                </FormField>
                <FormField label="차량번호">
                  <input
                    v-model="formData.vehicleNo"
                    type="text"
                    class="form-input-md"
                    placeholder="차량번호를 입력하세요"
                    :readonly="!isSavableStatus"
                  >
                  <template #hint>
                    기사 연락처 마지막 4자리를 기준으로 운송장번호가 자동 생성됩니다.
                  </template>
                </FormField>
                <FormField label="기사명">
                  <input
                    v-model="formData.driverName"
                    type="text"
                    class="form-input-md"
                    placeholder="기사명을 입력하세요"
                    :readonly="!isSavableStatus"
                  >
                </FormField>
                <FormField label="기사 연락처" required>
                  <input
                    v-model="formData.driverPhone"
                    type="tel"
                    class="form-input-md"
                    placeholder="010-0000-0000"
                    maxlength="13"
                    :readonly="!isSavableStatus"
                    @input="handleDriverPhoneInput"
                  >
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
                    :disabled="!isSavableStatus"
                    :clearable="false"
                    :min-date="minDispatchDate"
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
                    :disabled="!isSavableStatus"
                    :clearable="false"
                    :min-date="minExpectedArrivalDate"
                  />
                </FormField>
                <FormField label="운송장번호" full-width>
                  <div class="tracking-number-group">
                    <input
                      v-model="formData.trackingNumber"
                      type="text"
                      class="form-input-md"
                      placeholder="자동 생성됨"
                      readonly
                      disabled
                    >
                    <button
                      class="btn-message"
                      :disabled="!canSendMessage"
                      title="기사에게 납품 안내 메시지 전송"
                      @click="sendMessageToDriver"
                    >
                      <i class="fas fa-comment-dots" />
                      메시지 전송
                    </button>
                    <button
                      type="button"
                      class="btn-signature-request"
                      :disabled="!canRequestSignature"
                      title="인수자에게 서명 요청 문자 발송"
                      @click="openSignatureRequestModal"
                    >
                      <i class="fas fa-signature" />
                      인수자 서명 요청
                    </button>
                  </div>
                </FormField>
              </div>
            </div>
          </div>
          <!-- two-column-layout 종료 -->
        </div>
      </FormSection>

      <!-- 품목 리스트 (읽기전용) -->
      <FormSection style="margin-top: -20px">
        <div class="items-section-wrapper">
          <div class="items-section-header">
            <div class="header-left">
              <i class="fas fa-box" />
              <span>품목 정보</span>
            </div>
          </div>

          <div class="items-table-wrapper">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px">
                    NO
                  </th>
                  <th style="width: 80px">
                    품목명
                  </th>
                  <th style="width: 80px">
                    SKU ID
                  </th>
                  <th style="width: 100px">
                    SKU 품명
                  </th>
                  <th class="col-spec">
                    규격
                  </th>
                  <th>단위</th>
                  <th>출하수량(m²)</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredItems.length === 0">
                  <td colspan="8" class="empty-message">
                    품목 정보가 없습니다.
                  </td>
                </tr>
                <tr
                  v-for="(item, index) in filteredItems"
                  :key="item.skuId"
                  :class="{ 'row-merge-source': (item.shipmentQuantity || 0) === 0 }"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.itemName || '-' }}</td>
                  <td>{{ item.skuId }}</td>
                  <td>{{ item.skuName }}</td>
                  <td class="specification-cell" :title="item.specification">
                    {{ truncateText(item.specification, 60) }}
                  </td>
                  <td>{{ item.unit }}</td>
                  <td class="text-center">
                    {{ formatQuantity(item.shipmentQuantity) }}
                  </td>
                  <td class="remark-cell">
                    <span>{{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(Math.round(item.shipmentQuantity / 2)) + ' 매' : '-' }}</span>
                    <template v-if="getRemarksBadges(item.remarks).length > 0">
                      <span
                        v-for="(badge, idx) in getRemarksBadges(item.remarks)"
                        :key="idx"
                        class="merge-badge"
                        :style="{ backgroundColor: badge.color }"
                      >{{ badge.label }}</span>
                    </template>
                    <span v-if="getBgradeForSku(item.skuId)" class="bgrade-badge">
                      B급 {{ getBgradeForSku(item.skuId)?.quantity }}{{ item.unit }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="filteredItems.length > 0">
                <tr>
                  <td colspan="6" class="text-right">
                    <strong>합계</strong>
                  </td>
                  <td class="text-center">
                    <strong>{{ formatQuantity(totalShipmentQuantity) }}</strong>
                  </td>
                  <td class="text-center">
                    <strong>{{ totalShipmentQuantity > 0 ? formatQuantity(Math.round(totalShipmentQuantity / 2)) + ' 매' : '-' }}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </FormSection>

      <!-- 납품 진행 상태 (메시지 발송 후 기사가 미완료한 경우) -->
      <div v-if="deliveryStatus.deliveryId && deliveryStatus.status !== 'COMPLETED'" class="info-group delivery-progress-section">
        <div class="info-group-header">
          <i class="fas fa-clipboard-check" />
          <span>납품 진행 상태</span>
        </div>
        <div class="delivery-progress-row">
          <!-- 서명 컬럼 -->
          <div class="progress-col">
            <div class="progress-item">
              <span class="progress-label">서명</span>
              <span v-if="deliveryStatus.hasSignature" class="progress-status status-completed">
                <i class="fas fa-check-circle" /> 완료
              </span>
              <span v-else class="progress-status status-pending">
                <i class="fas fa-clock" /> 대기
              </span>
            </div>
            <div v-if="signatureBlobUrl" class="signature-preview">
              <img :src="signatureBlobUrl" alt="서명 이미지">
            </div>
          </div>

          <!-- 사진 컬럼 -->
          <div class="progress-col">
            <div class="progress-item">
              <span class="progress-label">사진</span>
              <span v-if="tempPhotoBlobUrls.length > 0" class="progress-status status-completed">
                <i class="fas fa-check-circle" /> {{ tempPhotoBlobUrls.length }}장 업로드됨
              </span>
              <span v-else-if="tempPhotos.length > 0" class="progress-status status-completed">
                <i class="fas fa-spinner fa-spin" /> 로딩 중...
              </span>
              <span v-else class="progress-status status-pending">
                <i class="fas fa-clock" /> 없음
              </span>
            </div>
            <div class="temp-photo-grid">
              <!-- 업로드된 사진 (삭제 버튼 포함) -->
              <div
                v-for="(blobUrl, index) in tempPhotoBlobUrls"
                :key="index"
                class="temp-photo-item"
              >
                <img :src="blobUrl" :alt="`사진 ${index + 1}`">
                <button
                  class="photo-delete-btn"
                  type="button"
                  title="사진 삭제"
                  @click="handleAdminPhotoDelete(index)"
                >
                  <i class="fas fa-times" />
                </button>
              </div>
              <!-- 업로드 슬롯 (5장 미만일 때) -->
              <label
                v-if="tempPhotos.length < 5"
                class="temp-photo-upload-slot"
                :class="{ 'is-uploading': adminPhotoUploading }"
                :title="adminPhotoUploading ? '업로드 중...' : '사진 추가'"
              >
                <i v-if="adminPhotoUploading" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-plus" />
                <input
                  ref="adminPhotoInput"
                  type="file"
                  accept="image/jpeg,image/jpg"
                  style="display: none"
                  :disabled="adminPhotoUploading"
                  @change="handleAdminPhotoUpload"
                >
              </label>
            </div>
          </div>

          <!-- 대리 완료 컬럼 -->
          <div class="progress-col progress-col-action">
            <div v-if="deliveryStatus.hasSignature && tempPhotos.length > 0">
              <p class="warning-text">
                <i class="fas fa-exclamation-triangle" />
                기사가 최종 확인을 완료하지 않았습니다.
              </p>
              <button
                class="btn-primary btn-admin-confirm"
                :disabled="adminConfirming"
                type="button"
                @click="handleAdminConfirm"
              >
                <i v-if="adminConfirming" class="fas fa-spinner fa-spin" />
                <i v-else class="fas fa-check-double" />
                {{ adminConfirming ? '처리 중...' : '대리 완료 처리' }}
              </button>
            </div>
            <div v-else>
              <p class="info-text-muted">
                <i class="fas fa-info-circle" />
                서명과 사진이 모두 등록된 후 대리 완료가 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 인수자 서명 요청 확인 모달 -->
  <Teleport to="body">
    <div v-if="signatureRequestModal.open" class="modal-overlay" @click.self="closeSignatureRequestModal">
      <div class="modal-card">
        <h3><i class="fas fa-signature" /> 인수자 서명 요청</h3>
        <p class="modal-desc">
          아래 인수자에게 <strong>서명 요청 문자</strong>를 발송합니다. 번호를 반드시 확인해주세요.
        </p>
        <div class="receiver-info">
          <div class="info-row">
            <span class="label">인수자명</span>
            <span class="value">{{ formData.receiverName || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">연락처</span>
            <span class="value">{{ formData.receiverPhone || '-' }}</span>
          </div>
        </div>
        <label class="confirm-check">
          <input v-model="signatureRequestModal.confirmed" type="checkbox">
          위 번호가 정확한 것을 확인했습니다.
        </label>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="closeSignatureRequestModal">
            취소
          </button>
          <button
            type="button"
            class="btn-send"
            :disabled="!signatureRequestModal.confirmed || signatureRequestModal.sending"
            @click="confirmSendSignatureRequest"
          >
            <i v-if="signatureRequestModal.sending" class="fas fa-spinner fa-spin" />
            <i v-else class="fas fa-paper-plane" />
            {{ signatureRequestModal.sending ? '발송 중...' : '발송' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 메시지 발송 결과 모달 -->
  <MessageResultModal
    :show="showMessageResultModal"
    :result-info="messageResultInfo"
    @close="closeMessageResultModal"
  />

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
import { shipmentService, type ShipmentItemWithOrder } from '~/services/shipment.service'
import { deliveryService } from '~/services/delivery.service'
import type { TempPhotoItem } from '~/services/delivery.service'
import { userService } from '~/services/user.service'
import type { UserByRole } from '~/types/user'
import { DELIVERY_ENDPOINTS } from '~/services/api/endpoints/delivery.endpoints'
import { TRANSPORT_ENDPOINTS } from '~/services/api/endpoints/transport.endpoints'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import { getApiBaseUrl, getAuthHeaders } from '~/services/api'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'
import PdfPreviewModal from '~/components/admin/delivery/PdfPreviewModal.vue'
import MessageResultModal from '~/components/admin/transport/MessageResultModal.vue'
import type { MessageResultInfo } from '~/components/admin/transport/MessageResultModal.vue'
import { formatPhoneNumberInput, formatPhoneNumber, formatNumber, formatCurrency, formatQuantity, toUtcIsoString, utcToKstDateTimeLocal, utcToKstDateString } from '~/utils/format'
import { syncDatesOnDeliveryDateChange, adjustExpectedArrivalOnDispatchChange } from '~/utils/transport-date'
import { validatePhoneNumber } from '~/utils/validate'
import { compressImageIfNeeded } from '~/utils/image-compress'

definePageMeta({
  layout: 'admin',
  pageTitle: '운송장 수정'
})

const router = useRouter()
const route = useRoute()
const loading = ref(true)

// 권한
const { canEdit: hasEditPermission, canDelete: hasDeletePermission } = usePermission()

// 상태 관리 (DB 기반)
const { getStatusLabel } = useCommonStatus()

// 메시지 발송 결과 모달
const showMessageResultModal = ref(false)
const messageResultInfo = ref<MessageResultInfo | null>(null)

// 메시지 결과 모달 닫기
const closeMessageResultModal = () => {
  showMessageResultModal.value = false
  messageResultInfo.value = null
}

// 운송장 PDF 미리보기 모달
const showTransportPdfModal = ref(false)
const transportPdfUrl = ref<string>('')
const transportDeliveryId = ref<number | undefined>(undefined)

// 서명 이미지 URL (납품확인에서 가져옴)
const receiverSignatureUrl = ref<string | null>(null)

// 납품 진행 상태 (관리자 대리 완료용)
const deliveryStatus = ref<{
  deliveryId: number
  status: string
  hasSignature: boolean
  signatureUrl: string | null
}>({
  deliveryId: 0,
  status: '',
  hasSignature: false,
  signatureUrl: null
})
const tempPhotos = ref<TempPhotoItem[]>([])
const tempPhotoBlobUrls = ref<string[]>([])
const signatureBlobUrl = ref<string>('')
const adminConfirming = ref(false)

// 관리자 사진 업로드 상태
const adminPhotoUploading = ref(false)
const adminPhotoInput = ref<HTMLInputElement | null>(null)

// 사용자 목록
const siteManagers = ref<UserByRole[]>([]) // SITE_MANAGER (현장소장/현장담당자)

// 선택된 사용자 ID
const selectedSupervisorId = ref<number | ''>('') // 현장소장
const selectedReceiverId = ref<number | 'direct'>('direct') // 현장 인수자 ('direct' = 직접입력)

// 건설사 (현장소장의 소속 회사)
const constructionCompany = computed(() => {
  if (!selectedSupervisorId.value) { return '' }
  const manager = siteManagers.value.find(m => m.userId === selectedSupervisorId.value)
  return manager?.companyName || ''
})

// 품목 리스트 (읽기전용)
const items = ref<ShipmentItemWithOrder[]>([])

// 출하 상세 데이터 (B급 정보 접근용)
const shipmentDetailData = ref<any>(null)

// 품목 필터: 수량 있는 품목 + 합지 소스 품목(수량 0이지만 표시 필요)
const filteredItems = computed(() => items.value.filter((item) => {
  if ((item.shipmentQuantity || 0) > 0) { return true }
  // 합지 소스 품목은 수량이 0이어도 표시
  if (item.remarks && (item.remarks.includes('이전') || item.remarks.includes('병합'))) { return true }
  return false
}))

// B급 품목 헬퍼
const getBgradeForSku = (skuId: string) => {
  return shipmentDetailData.value?.bgradeItems?.find((bg: any) => bg.skuId === skuId) || null
}

// 비고(remarks)에서 합지 배지 정보 추출
const getRemarksBadges = (remarks: string | null | undefined): { label: string; color: string }[] => {
  if (!remarks) { return [] }

  // 합지 타겟 품목
  if (remarks.includes('에서 이전') || remarks.includes('에서 병합됨') || remarks.includes('추가 병합')) {
    const match = remarks.match(/([\d,\s]+)에서/)
    const skuIds = match ? match[1].trim() : ''
    return [{ label: skuIds ? `합지 ← ${skuIds}` : '합지', color: '#3b82f6' }]
  }

  // 합지 소스 품목
  if ((remarks.includes('이전') || remarks.includes('병합됨')) &&
      (remarks.includes('로 ') || remarks.includes('로\n'))) {
    const match = remarks.match(/(\d+)로/)
    const skuId = match ? match[1] : ''
    return [{ label: skuId ? `합지소스 → ${skuId}` : '합지 소스', color: '#8b5cf6' }]
  }

  return []
}

// 품목 합계
const totalShipmentQuantity = computed(() => filteredItems.value.reduce((sum, item) => sum + (item.shipmentQuantity || 0), 0))

// 텍스트 truncate (규격 등 긴 텍스트 처리)
const truncateText = (text: string, maxLength: number = 60): string => {
  if (!text) { return '' }
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 운송장 정보 폼 (등록 페이지와 동일하게 formData 사용)
const formData = ref({
  transportId: 0,
  shipmentId: '',
  shipmentNo: '',
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

// 주소 검색 팝업 열림 상태
const isAddressPopupOpen = ref(false)

// 주소 검색
const searchAddress = () => {
  // 이미 팝업이 열려있으면 무시
  if (isAddressPopupOpen.value) { return }

  isAddressPopupOpen.value = true
  new window.daum.Postcode({
    oncomplete: (data: any) => {
      formData.value.zipcode = data.zonecode
      formData.value.deliveryAddress = data.address
      formData.value.addressDetail = ''
      isAddressPopupOpen.value = false
    },
    onclose: () => {
      isAddressPopupOpen.value = false
    }
  }).open()
}

// 현장소장 선택 시 인수자 기본값 자동 입력
const handleSupervisorChange = () => {
  if (selectedSupervisorId.value) {
    const supervisor = siteManagers.value.find(m => m.userId === selectedSupervisorId.value)
    if (supervisor) {
      // 인수자가 비어있으면 현장소장으로 기본값 설정
      if (!formData.value.receiverName) {
        selectedReceiverId.value = supervisor.userId
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
    const receiver = siteManagers.value.find(m => m.userId === selectedReceiverId.value)
    if (receiver) {
      formData.value.receiverName = receiver.userName
      formData.value.receiverPhone = formatPhoneNumber(receiver.phone || '')
    }
  }
}

// 배차/출차 시각: 배송 예정일 - 5일 00:00 이후부터 선택 가능
const minDispatchDate = computed(() => {
  if (formData.value.deliveryDate) {
    const deliveryDateObj = new Date(formData.value.deliveryDate)
    const minDate = new Date(deliveryDateObj)
    minDate.setDate(minDate.getDate() - 5)
    minDate.setHours(0, 0, 0, 0)
    return minDate
  }
  return new Date()
})

// 도착 예정 시각: 배차/출차 시각 이후로만 선택 가능
const minExpectedArrivalDate = computed(() => {
  if (formData.value.dispatchAt) {
    return new Date(formData.value.dispatchAt)
  }
  return new Date()
})

// 배송 예정일 변경 시 배차/출차 시각, 도착 예정 시각의 날짜도 함께 변경
const onDeliveryDateChange = () => {
  const result = syncDatesOnDeliveryDateChange(
    formData.value.deliveryDate,
    formData.value.dispatchAt,
    formData.value.expectedArrival
  )
  if (result.dispatchAt) { formData.value.dispatchAt = result.dispatchAt }
  if (result.expectedArrival) { formData.value.expectedArrival = result.expectedArrival }
}

// 배차/출차 시각 변경 시 도착 예정 시각 자동 조정
const onDispatchAtChange = (newValue: string | Date | null) => {
  const adjusted = adjustExpectedArrivalOnDispatchChange(newValue, formData.value.expectedArrival)
  if (adjusted) {
    formData.value.expectedArrival = adjusted
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
        // 품목 리스트 매핑
        items.value = shipmentDetail.items || []
        // B급/합지 정보 접근을 위해 출하 상세 저장
        shipmentDetailData.value = shipmentDetail
      } catch (error) {
        console.error('출하 정보 로드 실패:', error)
      }
    }

    // formData에 데이터 매핑
    formData.value = {
      transportId: transportDetail.transportId,
      shipmentId: transportDetail.shipmentId?.toString() || '',
      shipmentNo: transportDetail.shipmentNo || shipmentDetail?.shipmentNo || '',
      orderId: transportDetail.orderId || 0,
      deliveryRequestNo: shipmentDetail?.deliveryRequestNo || transportDetail.deliveryRequestNo || '',
      projectName: shipmentDetail?.projectName || '',
      clientName: shipmentDetail?.client || '',
      vehicleNo: transportDetail.vehicleNo || '',
      deliveryDate: utcToKstDateString(transportDetail.deliveryDate) || '',
      zipcode: transportDetail.zipcode || '',
      deliveryAddress: transportDetail.deliveryAddress || '',
      addressDetail: transportDetail.addressDetail || '',
      receiverName: transportDetail.receiverName || '',
      receiverPhone: formatPhoneNumber(transportDetail.receiverPhone || ''),
      carrierName: transportDetail.carrierName || '',
      driverName: transportDetail.driverName || '',
      driverPhone: formatPhoneNumber(transportDetail.driverPhone || ''),
      dispatchAt: utcToKstDateTimeLocal(transportDetail.dispatchAt) || '',
      expectedArrival: utcToKstDateTimeLocal(transportDetail.expectedArrival) || '',
      deliveryMemo: transportDetail.deliveryMemo || '',
      status: transportDetail.status || 'PENDING',
      trackingNumber: transportDetail.trackingNumber || ''
    }

    // 현장소장 셀렉트 박스 매핑 (운송 상세에서 siteManagerId 우선 사용)
    if (transportDetail.siteManagerId) {
      const matchedManager = siteManagers.value.find(m => m.userId === transportDetail.siteManagerId)
      if (matchedManager) {
        selectedSupervisorId.value = matchedManager.userId
      }
    } else if (shipmentDetail?.siteManagerId) {
      // 운송에 없으면 출하 상세에서 가져오기
      const matchedManager = siteManagers.value.find(m => m.userId === shipmentDetail.siteManagerId)
      if (matchedManager) {
        selectedSupervisorId.value = matchedManager.userId
      }
    }

    // 인수자 매핑: 저장된 인수자명으로 현장소장 목록에서 찾기
    if (formData.value.receiverName) {
      const matchedByName = siteManagers.value.find(m => m.userName === formData.value.receiverName)
      if (matchedByName) {
        // 현장소장 목록에 있으면 해당 ID 선택
        selectedReceiverId.value = matchedByName.userId
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

    // 납품 진행 상태 로드 (메시지 발송 후 기사가 미완료한 경우 확인용)
    if (transportDetail.deliveryId) {
      deliveryStatus.value.deliveryId = transportDetail.deliveryId
      deliveryStatus.value.status = transportDetail.status || ''

      // 납품 상세 정보에서 서명 상태 확인
      try {
        const deliveryDetail = await deliveryService.getDeliveryDetail(transportDetail.deliveryId)
        deliveryStatus.value.hasSignature = !!deliveryDetail.managerSignaturePath
        if (deliveryDetail.managerSignaturePath) {
          deliveryStatus.value.signatureUrl = `${getApiBaseUrl()}/admin/deliveries/${transportDetail.deliveryId}/signature`
          // 서명 이미지를 인증 헤더와 함께 fetch → Blob URL
          try {
            const sigRes = await fetch(deliveryStatus.value.signatureUrl, { headers: getAuthHeaders() })
            if (sigRes.ok) {
              const blob = await sigRes.blob()
              signatureBlobUrl.value = URL.createObjectURL(blob)
            }
          } catch (sigErr) {
            console.error('서명 이미지 로드 실패:', sigErr)
          }
        }
      } catch (e) {
        console.error('납품 상세 조회 실패:', e)
      }

      // 미완료 상태면 temp 사진 조회 + Blob URL 변환
      if (transportDetail.status !== 'COMPLETED') {
        await reloadTempStatus(transportDetail.deliveryId)
      }
    }
  } catch (error) {
    console.error('운송 정보 로드 실패:', error)
    alert('운송 정보를 불러오는데 실패했습니다.')
    handleGoBack() // 로드 실패 시에도 목록으로 이동
  } finally {
    loading.value = false
  }
})

// 목록으로 이동 (returnPage 쿼리 파라미터 처리)
const handleGoBack = () => {
  const returnPage = route.query.returnPage
  if (returnPage) {
    router.push({ path: '/admin/transport/list', query: { page: returnPage as string } })
  } else {
    router.push('/admin/transport/list')
  }
}

// 운송 정보 저장 (운송 정보 섹션만 수정 가능)
const saveTransport = async () => {
  try {
    // 유효성 검사 (운송 정보만)
    if (!formData.value.driverPhone) {
      alert('기사 연락처를 입력해주세요.')
      return
    }

    // 기사 연락처 형식 검증
    if (!validatePhoneNumber(formData.value.driverPhone)) {
      alert('기사 연락처는 10자리 또는 11자리 숫자로 입력해주세요.')
      return
    }

    if (!formData.value.dispatchAt || !formData.value.expectedArrival) {
      alert('배차시각과 도착예정시각을 입력해주세요.')
      return
    }

    // 배차/출차 시각이 배송 예정일 - 5일 00:00 이전인지 체크
    if (formData.value.deliveryDate) {
      const dispatchTime = new Date(formData.value.dispatchAt)
      const deliveryDateObj = new Date(formData.value.deliveryDate)
      const minDispatchTime = new Date(deliveryDateObj)
      minDispatchTime.setDate(minDispatchTime.getDate() - 5)
      minDispatchTime.setHours(0, 0, 0, 0)

      if (dispatchTime < minDispatchTime) {
        const minDateStr = `${minDispatchTime.getFullYear()}-${String(minDispatchTime.getMonth() + 1).padStart(2, '0')}-${String(minDispatchTime.getDate()).padStart(2, '0')}`
        alert(`배차/출차 시각은 ${minDateStr} 00:00 이후로 설정해주세요.\n(배송 예정일 5일 전부터 가능)`)
        return
      }

      // 도착 예정 시각이 배차/출차 시각 이전인지 체크
      const expectedTime = new Date(formData.value.expectedArrival)
      if (expectedTime <= dispatchTime) {
        alert('도착 예정 시각은 배차/출차 시각 이후로 설정해주세요.')
        return
      }
    }

    // 운송 정보만 전송 (다른 섹션은 읽기 전용이므로 제외)
    const transportData = {
      transportId: formData.value.transportId,
      shipmentId: Number(formData.value.shipmentId),
      // 운송 정보 섹션만 수정 가능
      carrierName: formData.value.carrierName,
      vehicleNo: formData.value.vehicleNo,
      driverName: formData.value.driverName,
      driverPhone: formData.value.driverPhone,
      dispatchAt: toUtcIsoString(formData.value.dispatchAt),
      expectedArrival: toUtcIsoString(formData.value.expectedArrival),
      status: formData.value.status
    }

    console.log('운송장 수정 요청:', transportData)
    await transportService.updateTransport(formData.value.transportId, transportData)
    alert('운송장이 수정되었습니다.')
    handleGoBack() // 저장 후에도 returnPage로 이동
  } catch (error: any) {
    console.error('운송장 수정 실패:', error)

    // 서버 에러 메시지가 있으면 표시, 없으면 기본 메시지
    const message = error.serverMessage || '운송장 수정에 실패했습니다.'
    alert(message)

    // 409 Conflict인 경우 페이지 새로고침 (상태 동기화)
    if (error.status === 409) {
      location.reload()
    }
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

// 비즈니스 로직: 저장 가능 상태 (대기 또는 진행중)
const isSavableStatus = computed(() => {
  return ['PENDING', 'IN_PROGRESS'].includes(formData.value.status)
})

// 저장 가능 여부 (권한 + 비즈니스 로직)
const canSave = computed(() => {
  return hasEditPermission.value && isSavableStatus.value
})

// 비활성화 사유 표시
const getSaveDisabledReason = computed(() => {
  if (!hasEditPermission.value) { return '수정 권한이 없습니다' }
  if (!isSavableStatus.value) { return '대기 또는 진행중 상태에서만 저장할 수 있습니다' }
  return ''
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
    '기사에게 메시지를 전송하시겠습니까?\n\n' +
    `기사명: ${formData.value.driverName || '(미입력)'}\n` +
    `연락처: ${formData.value.driverPhone}\n` +
    `운송장번호: ${formData.value.trackingNumber}`
  )

  if (!confirmed) { return }

  try {
    // deliveryService로 납품 생성 및 토큰 발급
    const result = await deliveryService.createDelivery(Number(route.params.id))

    console.log('메시지 발송 결과:', result)

    // 결과 모달 표시
    showMessageResultModal.value = true
    messageResultInfo.value = {
      type: result.messageAlreadySent ? 'duplicate' : 'success',
      mobileUrl: result.mobileUrl,
      tokenExpiresAt: result.tokenExpiresAt,
      messageSentAt: result.messageSentAt
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error)
    alert(`메시지 전송에 실패했습니다.\n${error instanceof Error ? error.message : '알 수 없는 오류'}`)
  }
}

// temp 사진 상태 재로드 (업로드/삭제 후 공통 사용)
const reloadTempStatus = async (deliveryId: number) => {
  try {
    const tempResult = await deliveryService.getAdminTempStatus(deliveryId)
    tempPhotos.value = tempResult.photos || []

    // 기존 Blob URL 해제
    tempPhotoBlobUrls.value.forEach(url => URL.revokeObjectURL(url))

    const blobUrls: string[] = []
    for (const photo of tempPhotos.value) {
      try {
        const photoUrl = deliveryService.getAdminTempPhotoUrl(deliveryId, photo.tempPhotoId)
        const photoRes = await fetch(photoUrl, { headers: getAuthHeaders() })
        if (photoRes.ok) {
          const blob = await photoRes.blob()
          blobUrls.push(URL.createObjectURL(blob))
        }
      } catch (photoErr) {
        console.error('temp 사진 로드 실패:', photo.tempPhotoId, photoErr)
      }
    }
    tempPhotoBlobUrls.value = blobUrls
  } catch (e) {
    console.error('temp 사진 상태 재로드 실패:', e)
  }
}

// 관리자 사진 업로드 처리
const handleAdminPhotoUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) { return }

  const deliveryId = deliveryStatus.value.deliveryId
  if (!deliveryId) { return }

  adminPhotoUploading.value = true
  try {
    for (const rawFile of Array.from(input.files)) {
      // 5장 초과 방지
      if (tempPhotos.value.length >= 5) {
        alert('사진은 최대 5장까지 업로드 가능합니다.')
        break
      }
      const compressed = await compressImageIfNeeded(rawFile)
      await deliveryService.uploadAdminTempPhoto(deliveryId, compressed)
    }
    await reloadTempStatus(deliveryId)
  } catch (err) {
    console.error('관리자 사진 업로드 실패:', err)
    alert(`사진 업로드에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    adminPhotoUploading.value = false
    // input 초기화 (같은 파일 재선택 허용)
    if (adminPhotoInput.value) { adminPhotoInput.value.value = '' }
  }
}

// 관리자 사진 삭제 처리
const handleAdminPhotoDelete = async (index: number) => {
  const deliveryId = deliveryStatus.value.deliveryId
  if (!deliveryId) { return }

  const photo = tempPhotos.value[index]
  if (!photo) { return }

  const confirmed = confirm(`사진 ${index + 1}을 삭제하시겠습니까?`)
  if (!confirmed) { return }

  try {
    await deliveryService.deleteAdminTempPhoto(deliveryId, photo.tempPhotoId)
    await reloadTempStatus(deliveryId)
  } catch (err) {
    console.error('관리자 사진 삭제 실패:', err)
    alert(`사진 삭제에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  }
}

// 관리자 대리 납품 완료 처리
const handleAdminConfirm = async () => {
  const confirmed = confirm(
    '관리자 대리 완료 처리를 하시겠습니까?\n\n' +
    '기사 대신 납품 확인을 완료 처리합니다.\n' +
    '이 작업은 취소할 수 없습니다.'
  )
  if (!confirmed) { return }

  adminConfirming.value = true
  try {
    await deliveryService.adminConfirmDelivery(deliveryStatus.value.deliveryId)
    alert('관리자 대리 완료 처리되었습니다.')
    location.reload()
  } catch (err) {
    console.error('대리 완료 실패:', err)
    alert(`대리 완료 처리에 실패했습니다.\n${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    adminConfirming.value = false
  }
}

// ==================== 인수자 서명 요청 ====================

// 서명 요청 모달 상태
const signatureRequestModal = ref({
  open: false,
  confirmed: false,
  sending: false
})

// 서명 요청 버튼 비활성화 여부: 구조적 선행 조건 + 서명 완료 시 비활성
// 사진 미첨부는 해결 가능한 동적 조건이므로 버튼은 활성 유지하고 클릭 시 alert 로 안내
const canRequestSignature = computed(() => {
  const deliveryCreated = deliveryStatus.value.deliveryId > 0
  const phoneOk = !!(formData.value.receiverPhone && formData.value.receiverPhone.trim())
  const notDone = formData.value.status !== 'COMPLETED'
  const signaturePending = !deliveryStatus.value.hasSignature
  return deliveryCreated && phoneOk && notDone && signaturePending
})

// 서명 요청 모달 열기
const openSignatureRequestModal = () => {
  if (!deliveryStatus.value.deliveryId) {
    alert('먼저 "메시지 전송" 으로 기사에게 납품확인 링크를 1회 이상 발송해주세요.')
    return
  }
  if (!formData.value.receiverPhone || !formData.value.receiverPhone.trim()) {
    alert('인수자 연락처를 먼저 입력/저장해주세요.')
    return
  }
  if (tempPhotos.value.length === 0) {
    alert('납품 사진을 먼저 1장 이상 첨부한 뒤 서명을 요청해주세요.')
    return
  }
  if (deliveryStatus.value.hasSignature) {
    alert('이미 서명이 완료되어 요청할 필요가 없습니다.')
    return
  }
  if (formData.value.status === 'COMPLETED') {
    alert('이미 완료된 납품입니다.')
    return
  }
  signatureRequestModal.value = { open: true, confirmed: false, sending: false }
}

// 서명 요청 모달 닫기
const closeSignatureRequestModal = () => {
  if (signatureRequestModal.value.sending) { return }
  signatureRequestModal.value.open = false
}

// 서명 요청 발송 확정
const confirmSendSignatureRequest = async () => {
  if (!signatureRequestModal.value.confirmed) { return }
  signatureRequestModal.value.sending = true
  try {
    const deliveryId = deliveryStatus.value.deliveryId
    if (!deliveryId) { throw new Error('납품 ID를 찾을 수 없습니다. 메시지 전송 후 다시 시도해주세요.') }
    const result = await deliveryService.requestReceiverSignature(deliveryId)
    alert(`인수자(${result.recipientName || '-'}) ${result.recipientPhone} 로 서명 요청 문자가 발송되었습니다.`)
    signatureRequestModal.value.open = false
  } catch (err) {
    alert(`서명 요청 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
  } finally {
    signatureRequestModal.value.sending = false
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

/* 인수자 서명 요청 버튼 */
.btn-signature-request {
  padding: 0.625rem 1rem;
  background: #7c3aed;
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

.btn-signature-request:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3);
}

.btn-signature-request:active:not(:disabled) {
  transform: translateY(0);
}

.btn-signature-request:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 인수자 서명 요청 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-card h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-card h3 i {
  color: #7c3aed;
}

.modal-desc {
  font-size: 0.875rem;
  color: #4b5563;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.receiver-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  margin-bottom: 1rem;
}

.receiver-info .info-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.receiver-info .label {
  font-size: 0.8125rem;
  color: #6b7280;
  min-width: 60px;
  font-weight: 500;
}

.receiver-info .value {
  font-size: 0.9375rem;
  color: #111827;
  font-weight: 600;
}

.confirm-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  margin-bottom: 1.25rem;
}

.confirm-check input[type='checkbox'] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #7c3aed;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modal-actions .btn-cancel {
  padding: 0.5rem 1.25rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.modal-actions .btn-cancel:hover {
  background: #e5e7eb;
}

.modal-actions .btn-send {
  padding: 0.5rem 1.25rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: background 0.15s;
}

.modal-actions .btn-send:hover:not(:disabled) {
  background: #6d28d9;
}

.modal-actions .btn-send:disabled {
  background: #c4b5fd;
  cursor: not-allowed;
}

/* 품목 섹션 스타일 */
.items-section-wrapper {
  padding: 0;
}

.items-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.header-left i {
  color: #6b7280;
}

.items-table-wrapper {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.items-table th,
.items-table td {
  padding: 0.25rem 0.5rem;
  white-space: nowrap;
  font-size: 0.8125rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.items-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #d1d5db;
}

.items-table tfoot td {
  border-top: 2px solid #d1d5db;
  background: #f9fafb;
  font-weight: 600;
}

.items-table .text-right {
  text-align: right;
}

.items-table .empty-message {
  text-align: center;
  color: #9ca3af;
  padding: 2rem 0.5rem;
}

.specification-cell {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 비고 셀 */
.remark-cell {
  max-width: 200px;
  white-space: normal !important;
}

/* 합지 소스 행 (수량 이전된 원 품목) */
.row-merge-source {
  background: #f5f3ff;
  opacity: 0.75;
}

.row-merge-source td {
  color: #6b7280;
}

/* 합지 배지 */
.merge-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  margin: 1px 2px;
  white-space: nowrap;
}

/* B급 배지 */
.bgrade-badge {
  display: inline-block;
  padding: 3px 10px;
  background-color: #fef3c7;
  color: #b45309;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 4px;
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

/* 읽기 전용 필드 스타일 */
.readonly-field {
  background-color: #f9fafb !important;
  color: #6b7280;
  cursor: default;
}

/* 납품 진행 상태 섹션 */
.delivery-progress-section {
  margin-top: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fafbfc;
}

.delivery-progress-row {
  display: grid;
  grid-template-columns: 200px 1fr 250px;
  gap: 1.5rem;
  align-items: start;
}

.progress-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-col-action {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-label {
  font-weight: 600;
  color: #374151;
}

.progress-status {
  font-size: 0.875rem;
}

.progress-status.status-completed {
  color: #059669;
}

.progress-status.status-pending {
  color: #d97706;
}

.signature-preview {
  max-width: 180px;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  overflow: hidden;
  background: #fff;
}

.signature-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.temp-photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
}

.temp-photo-item {
  aspect-ratio: 1;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.temp-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 사진 삭제 버튼 */
.temp-photo-item {
  position: relative;
}

.photo-delete-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.85);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  line-height: 1;
  padding: 0;
  transition: background 0.15s;
}

.photo-delete-btn:hover {
  background: rgba(220, 38, 38, 1);
}

/* 업로드 슬롯 */
.temp-photo-upload-slot {
  aspect-ratio: 1;
  border-radius: 0.375rem;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  font-size: 1.25rem;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  background: #f9fafb;
}

.temp-photo-upload-slot:hover:not(.is-uploading) {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
}

.temp-photo-upload-slot.is-uploading {
  cursor: not-allowed;
  opacity: 0.6;
}

.warning-text {
  color: #d97706;
  font-size: 0.813rem;
  margin-bottom: 0;
  text-align: center;
  white-space: nowrap;
}

.info-text-muted {
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

.btn-admin-confirm {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.125rem;
  font-weight: 700;
}
</style>
