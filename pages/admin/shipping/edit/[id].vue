<template>
  <div class="shipping-edit">
    <PageHeader
      title="출하 수정"
      description="출하 정보를 수정합니다."
      icon="shipping"
      icon-color="green"
    >
      <template #actions>
        <button
          class="btn-action btn-delete"
          @click="handleDelete"
          :disabled="!canDelete"
          :title="getDeleteDisabledReason"
        >
          <i class="fas fa-trash"></i>
          삭제
        </button>
        <button class="btn-action btn-secondary" @click="handleGoBack">
          <i class="fas fa-list"></i>
          목록
        </button>
        <button
          class="btn-action btn-primary"
          @click="handleSubmit"
          :disabled="submitting || !canEdit"
          :title="getEditDisabledReason"
        >
          <i class="fas fa-save"></i>
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" message="데이터를 불러오는 중..." />
    <ErrorSection v-else-if="!shipmentData && !loading" message="출하 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <form @submit.prevent="handleSubmit" class="edit-form">
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
                  <FormField label="납품요구번호">
                    <input
                      type="text"
                      v-model="formData.deliveryRequestNo"
                      class="form-input-sm"
                      readonly
                    >
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
                <div class="info-grid grid-3">
                  <FormField label="출하일자" required :error="errors.shippingDate">
                    <input
                      type="date"
                      v-model="formData.shippingDate"
                      class="form-input-sm text-center"
                      :readonly="!canEdit"
                    >
                  </FormField>

                  <FormField label="출하상태" required :error="errors.status">
                    <input
                      type="text"
                      :value="getStatusLabel(formData.status)"
                      class="form-input-sm text-center"
                      readonly
                      :style="getStatusStyle(formData.status)"
                    >
                  </FormField>

                  <FormField label="납품완료계 상태">
                    <input
                      type="text"
                      :value="getDeliveryDoneStatusLabel(shipmentData?.deliveryDoneStatus)"
                      class="form-input-sm text-center"
                      readonly
                      :style="getDeliveryDoneStatusStyle(shipmentData?.deliveryDoneStatus)"
                    >
                  </FormField>
                </div>

                <div class="info-grid grid-3" style="margin-top: 0.25rem;">
                  <FormField label="총 출하수량">
                    <input
                      type="text"
                      :value="formatQuantity(totalShippingQuantity)"
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
                  <FormField label="기성포함">
                    <span
                      class="billing-badge"
                      :class="shipmentData?.isBilled ? 'billed' : 'not-billed'"
                    >
                      {{ shipmentData?.isBilled ? '포함' : '미포함' }}
                    </span>
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
                  <FormField label="수요기관명">
                    <input
                      type="text"
                      v-model="formData.client"
                      class="form-input-md text-center"
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
            <!-- 탭 헤더 -->
            <div class="items-section-header with-tabs">
              <div class="header-left">
                <i class="fas fa-box"></i>
                <span>품목 정보</span>
              </div>
              <div class="header-tabs">
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ active: activeTab === 'current' }"
                  @click="handleTabChange('current')"
                >
                  현재 품목
                </button>
                <button
                  type="button"
                  class="tab-btn"
                  :class="{ active: activeTab === 'history' }"
                  @click="handleTabChange('history')"
                >
                  변경 이력
                </button>
              </div>
              <div class="header-right">
                <!-- 추가변경 버튼 (항상 표시) -->
                <div class="btn-wrapper" :title="additionalChangeDisabledReason">
                  <button
                    type="button"
                    class="btn-additional-change"
                    :class="{ disabled: !canAdditionalChange }"
                    :disabled="!canAdditionalChange"
                    @click="canAdditionalChange && (showAdditionalChangeModal = true)"
                  >
                    <i class="fas fa-edit"></i>
                    추가변경
                  </button>
                </div>
              </div>
            </div>

            <!-- 현재 품목 탭 -->
            <div v-show="activeTab === 'current'" class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 20px">NO</th>
                    <th style="width: 80px">품목명</th>
                    <th style="width: 70px">SKU ID</th>
                    <th style="width: 100px">SKU 품명</th>
                    <th style="width: 420px">규격</th>
                    <th style="width: 20px">단위</th>
                    <th style="width: 80px">발주수량</th>
                    <th style="width: 60px">기출하</th>
                    <th style="width: 70px">잔여수량</th>
                    <th style="width: 80px">출하수량</th>
                    <th style="width: 80px">단가</th>
                    <th style="width: 120px">금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td colspan="12" class="empty-message">
                      품목 정보가 없습니다.
                    </td>
                  </tr>
                  <tr v-for="item in items" :key="item.skuId">
                    <td>{{ item.itemId }}</td>
                    <td>{{ item.itemName }}</td>
                    <td>{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td class="specification-cell" :title="item.specification">{{ item.specification }}</td>
                    <td>{{ item.unit }}</td>
                    <td class="text-right">{{ formatQuantity(item.orderQuantity) }}</td>
                    <td class="text-right" :title="`다른 출하들의 합계: ${formatQuantity(item.otherShipmentsQuantity)}`">
                      {{ formatQuantity(item.otherShipmentsQuantity) }}
                    </td>
                    <td class="text-right">
                      {{ formatQuantity(getCalculatedRemainingQuantity(item)) }}
                      <button
                        v-if="canEdit && canEditQuantity && getCalculatedRemainingQuantity(item) > 0"
                        type="button"
                        class="btn-max-quantity"
                        @click="addRemainingQuantity(item)"
                        :title="'잔여수량 추가 (' + formatQuantity(getCalculatedRemainingQuantity(item)) + ')'"
                      >▶</button>
                    </td>
                    <td class="text-right quantity-col">
                      <!-- 대기/준비 상태일 때만 수정 가능 -->
                      <input
                        v-if="canEdit && canEditQuantity"
                        type="number"
                        v-model.number="item.shippingQuantity"
                        :min="0"
                        :max="item.maxEditableQuantity"
                        class="table-input text-right input-w66"
                        @focus="saveOriginalQuantity(item)"
                        @change="validateQuantity(item)"
                      />
                      <span v-else>{{ formatQuantity(item.shippingQuantity) }}</span>
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.shippingQuantity * item.unitPrice) }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="items.length > 0">
                  <tr>
                    <td colspan="7" class="text-right"></td>
                    <td colspan="2" class="text-right"><strong>총 출하수량</strong></td>
                    <td class="text-right"><strong>{{ formatQuantity(totalShippingQuantity) }}</strong></td>
                    <td class="text-right"><strong>총 금액</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- 변경 이력 탭 -->
            <div v-show="activeTab === 'history'" class="history-tab-content">
              <!-- 로딩 -->
              <div v-if="loadingHistory" class="loading-container">
                <i class="fas fa-spinner fa-spin"></i>
                <p>변경 이력을 불러오는 중...</p>
              </div>

              <!-- 이력 없음 -->
              <div v-else-if="changeHistory.length === 0" class="no-history">
                <i class="fas fa-history"></i>
                <p>변경 이력이 없습니다.</p>
              </div>

              <!-- 이력 목록 -->
              <div v-else class="history-list">
                <div v-for="history in changeHistory" :key="history.groupKey" class="history-item">
                  <table class="history-table">
                    <thead>
                      <tr class="history-info-row">
                        <th colspan="4">
                          <div class="history-info-line">
                            <span class="history-info-item">
                              <span class="history-label">변경일시</span>
                              <span class="history-value">{{ formatDateTime(history.changedAt) }}</span>
                            </span>
                            <span class="history-info-item">
                              <span class="history-label">변경자</span>
                              <span class="history-value">{{ history.changedBy }}</span>
                            </span>
                            <span class="history-info-item">
                              <span class="history-label">변경사유</span>
                              <span class="history-value">{{ history.changeReason }}</span>
                            </span>
                            <button
                              type="button"
                              v-if="history.previousReceiptUrl"
                              class="btn-view-receipt"
                              @click="showPreviousReceiptsModal = true"
                            >
                              <i class="fas fa-file-pdf"></i>
                              이전 인수증
                            </button>
                          </div>
                        </th>
                      </tr>
                      <tr>
                        <th>품목명</th>
                        <th class="text-right" style="width: 120px;">변경 전</th>
                        <th class="text-right" style="width: 120px;">변경 후</th>
                        <th class="text-right" style="width: 100px;">차이</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in history.items" :key="item.skuId">
                        <td>{{ item.itemName }} ({{ item.skuName }})</td>
                        <td class="text-right">{{ formatNumber(item.beforeQuantity) }}</td>
                        <td class="text-right">{{ formatNumber(item.afterQuantity) }}</td>
                        <td class="text-right">
                          <span :class="item.afterQuantity - item.beforeQuantity > 0 ? 'text-success' : 'text-danger'">
                            {{ item.afterQuantity - item.beforeQuantity > 0 ? '+' : '' }}{{ formatNumber(item.afterQuantity - item.beforeQuantity) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- 추가변경 모달 -->
    <AdditionalChangeModal
      :is-open="showAdditionalChangeModal"
      :shipment-id="shipmentId"
      :shipment-status="formData.status"
      :items="items.map(item => ({
        skuId: item.skuId,
        itemName: item.itemName,
        specification: item.specification,
        shipmentQuantity: item.shippingQuantity
      }))"
      @close="showAdditionalChangeModal = false"
      @complete="handleAdditionalChangeComplete"
    />

    <!-- 이전 인수증 모달 -->
    <PreviousReceiptsModal
      :is-open="showPreviousReceiptsModal"
      :shipment-id="shipmentId"
      @close="showPreviousReceiptsModal = false"
    />

    <!-- 재서명 안내 모달 -->
    <ResignRequiredModal
      :is-open="showResignRequiredModal"
      @close="showResignRequiredModal = false"
      @send-message="handleSendMessage"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 출하 수정 페이지
 *
 * 주요 변경사항 (2025-01-25):
 * - 서버에서 제공하는 수량 정보를 직접 사용 (프론트엔드 계산 제거)
 * - 서버 제공 필드:
 *   * orderQuantity: 발주 수량
 *   * otherShipmentsQuantity: 다른 출하들의 합계
 *   * currentShipmentQuantity: 이번 출하 (편집 대상)
 *   * totalShippedQuantity: 총 출하 수량
 *   * remainingQuantity: 잔여 수량
 *   * maxEditableQuantity: 최대 수정 가능 수량
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from '#imports'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentDetailWithOrder, ShipmentItemWithOrder } from '~/services/shipment.service'
import type { AdditionalChangeResponse, QuantityChangeHistory } from '~/types/shipment-change'
import { formatNumber, formatCurrency, formatQuantity } from '~/utils/format'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import LoadingSection from '~/components/admin/common/LoadingSection.vue'
import ErrorSection from '~/components/admin/common/ErrorSection.vue'
import AdditionalChangeModal from '~/components/shipment/AdditionalChangeModal.vue'
import PreviousReceiptsModal from '~/components/shipment/PreviousReceiptsModal.vue'
import ResignRequiredModal from '~/components/shipment/ResignRequiredModal.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 수정'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canEdit: hasEditPermission, canDelete: hasDeletePermission } = usePermission()

// 상태 관리 (DB 기반)
const { getStatusLabel: getStatusLabelFromDB, getStatusBadgeClass } = useCommonStatus()

// 품목 인터페이스 (ShipmentItemWithOrder 확장)
interface OrderItem extends ShipmentItemWithOrder {
  shippingQuantity: number  // shipmentQuantity의 별칭 (수정 가능)
  maxEditableQuantity: number  // 최대 수정 가능 수량 (shipmentQuantity + remainingQuantity)
  orderId: number
  orderItemId: string
}

// 원본 데이터 저장
const shipmentData = ref<ShipmentDetailWithOrder | null>(null)
const items = ref<OrderItem[]>([])

// 수량 입력 시 원래 값 저장 (validation 실패 시 복원용)
const originalQuantities = ref<Map<string, number>>(new Map())

// useEditForm 사용
const {
  id: shipmentId,
  formData,
  loading,
  submitting,
  submit,
  goBack
} = useEditForm<ShipmentDetailWithOrder, any, any>({
  fetchFunction: async (id) => {
    try {
      console.log('[출하 수정] fetchFunction 시작, ID:', id)

      // API 호출: GET /admin/shipments/${id}
      console.log('[출하 수정] API 호출 전')
      const data = await shipmentService.getShipmentDetail(id)
      console.log('[출하 수정] API 응답 데이터:', data)
      console.log('[출하 수정] 🔍 기관번호 (clientNo):', data.clientNo)
      console.log('[출하 수정] 🔍 담당자 (clientManagerName):', data.clientManagerName)

      // 데이터 유효성 검증
      if (!data) {
        throw new Error('서버에서 데이터를 받지 못했습니다.')
      }

      // 발주 정보 필드 검증 (평탄화된 구조)
      if (!data.deliveryRequestNo) {
        console.error('[출하 수정] 발주 정보 누락:', data)
        throw new Error('발주 정보가 없습니다.')
      }

      if (!data.items || !Array.isArray(data.items)) {
        console.error('[출하 수정] items 데이터 누락 또는 잘못됨:', data)
        throw new Error('출하 품목 정보가 없습니다.')
      }

      console.log('[출하 수정] 데이터 검증 완료')
      shipmentData.value = data

      // 품목 데이터 매핑
      // 서버에서 받은 수량 정보를 그대로 사용:
      // - orderQuantity: 발주 수량
      // - otherShipmentsQuantity: 다른 출하들의 합계 (기출하)
      // - shipmentQuantity: 현재 출하 수량 (편집 대상)
      // - totalShippedQuantity: 총 출하 수량
      // - remainingQuantity: 잔여 수량
      console.log('[출하 수정] 품목 매핑 시작, items 개수:', data.items.length)
      items.value = data.items.map((item, index) => {
        console.log(`[출하 수정] 품목 ${index + 1} 매핑:`, {
          itemName: item.itemName,
          shipmentQuantity: item.shipmentQuantity,
          remainingQuantity: item.remainingQuantity,
          skuId: item.skuId
        })

        // maxEditableQuantity 계산: 현재 출하 수량 + 잔여 수량
        const maxEditableQuantity = (item.shipmentQuantity || 0) + (item.remainingQuantity || 0)

        return {
          ...item,
          shippingQuantity: item.shipmentQuantity || 0, // 현재 출하 수량
          maxEditableQuantity: maxEditableQuantity,
          orderId: data.orderId,
          orderItemId: item.skuId
        }
      })
      console.log('[출하 수정] 품목 매핑 완료')
      console.log('[출하 수정] 매핑된 items:', items.value)

      // 평탄화된 구조이므로 그대로 반환
      return data
    } catch (error) {
      console.error('[출하 수정] fetchFunction 에러:', error)
      console.error('[출하 수정] 에러 스택:', error instanceof Error ? error.stack : 'No stack')
      throw error
    }
  },
  updateFunction: async (id, data) => {
    // 대기/준비 상태일 때만 품목 수량 포함 (출하 등록 로직 참고)
    const updateData: any = {
      shipmentDate: data.shippingDate,
      trackingNumber: data.trackingNumber,
      status: data.status
    }

    // 수량 수정 가능한 상태일 때만 items 배열 추가
    if (canEditQuantity.value) {
      // ⚠️ 중요: 출하수량이 0보다 큰 품목만 전송
      // - 수량이 0인 품목을 보내지 않으면 → 서버에서 삭제 처리
      // - 원래 0이었던 품목의 수량을 입력하면 → 서버에서 인서트 처리
      const itemsToSend = items.value
        .filter(item => item.shippingQuantity > 0)
        .map(item => ({
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

      console.log('[출하 수정] 서버로 전송할 품목:', {
        전체품목수: items.value.length,
        전송품목수: itemsToSend.length,
        제외된품목: items.value.filter(item => item.shippingQuantity <= 0).map(item => ({
          skuId: item.skuId,
          itemName: item.itemName,
          shippingQuantity: item.shippingQuantity
        })),
        전송데이터: itemsToSend
      })

      updateData.items = itemsToSend
    }

    await shipmentService.updateShipment(id, updateData)
    return shipmentService.getShipmentDetail(id)
  },
  successRoute: '/admin/shipping/list',
  transformToForm: (shipment: ShipmentDetailWithOrder) => {
    // 발주 정보 필드 확인 (평탄화된 구조)
    if (!shipment.deliveryRequestNo) {
      console.error('[출하 수정] 발주 정보 누락:', shipment)
      throw new Error('발주 정보가 없습니다.')
    }

    // 안전한 날짜 포맷 변환
    let formattedDate = ''
    if (shipment.shipmentDate) {
      try {
        // ISO 8601 형식 (2024-01-15T10:30:00 또는 2024-01-15)
        if (shipment.shipmentDate.includes('T')) {
          formattedDate = shipment.shipmentDate.split('T')[0]
        } else if (shipment.shipmentDate.length >= 10) {
          formattedDate = shipment.shipmentDate.substring(0, 10)
        } else {
          formattedDate = shipment.shipmentDate
        }
      } catch (error) {
        console.error('[출하 수정] Date format error:', error, shipment.shipmentDate)
        formattedDate = ''
      }
    }

    return {
      deliveryRequestNo: shipment.deliveryRequestNo || '',
      deliveryRequestDate: shipment.deliveryRequestDate || '',
      projectName: shipment.projectName || '',
      client: shipment.client || '',
      clientNo: shipment.clientNo || '',
      clientManagerName: shipment.clientManagerName || '',
      shippingDate: formattedDate,
      trackingNumber: shipment.trackingNumber || '',
      status: shipment.status || 'PENDING'
    }
  },
  onUpdateSuccess: () => {
    alert('출하 정보가 수정되었습니다.')
    router.push('/admin/shipping/list')
  },
  onUpdateError: (error) => {
    console.error('출하 정보 수정 실패:', error)
    alert('출하 정보 수정에 실패했습니다.')
  },
  onFetchError: (error) => {
    console.error('[출하 수정] 데이터 로드 실패:', error)
    const errorMessage = error instanceof Error ? error.message : '출하 정보를 불러오는데 실패했습니다.'
    alert(errorMessage)
    router.push('/admin/shipping/list')
  }
})

// useFormValidation 사용
const { errors, validateAll, rules } = useFormValidation({
  deliveryRequestNo: '',
  client: '',
  shippingDate: '',
  trackingNumber: '',
  status: ''
})

// 총 출하수량 (현재 편집 중인 수량 합계)
const totalShippingQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.shippingQuantity || 0), 0)
})

// 총 금액 (현재 편집 중인 수량 기준)
const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
})

// 비즈니스 로직: 삭제 가능 상태 (대기 또는 취소 상태만)
const isDeletableStatus = computed(() => {
  return ['PENDING', 'CANCELLED'].includes(formData.status)
})

// 비즈니스 로직: 수정 가능 상태 (완료/취소 상태에서는 수정 불가)
const isEditableStatus = computed(() => {
  return !['COMPLETED', 'CANCELLED'].includes(formData.status)
})

// 삭제 가능 여부 (권한 + 비즈니스 로직)
const canDelete = computed(() => {
  return hasDeletePermission.value && isDeletableStatus.value
})

// 수량 수정 가능 여부 (대기 상태만 + 수정 권한)
const canEditQuantity = computed(() => {
  return hasEditPermission.value && formData.status === 'PENDING'
})

// 출하 수정 가능 여부 (권한 + 비즈니스 로직)
const canEdit = computed(() => {
  return hasEditPermission.value && isEditableStatus.value
})

// 비활성화 사유 표시 (권한 vs 상태 구분)
const getEditDisabledReason = computed(() => {
  if (!hasEditPermission.value) return '수정 권한이 없습니다'
  if (!isEditableStatus.value) return '완료 또는 취소된 출하는 수정할 수 없습니다'
  return ''
})

const getDeleteDisabledReason = computed(() => {
  if (!hasDeletePermission.value) return '삭제 권한이 없습니다'
  if (!isDeletableStatus.value) return '대기 또는 취소 상태에서만 삭제할 수 있습니다'
  return ''
})

// 추가변경 가능 여부
// - 출하가 취소 상태면 불가
// - 기성에 포함된 출하(isBilled=true)면 불가
// - 납품완료계가 완료 상태(deliveryDoneStatus=COMPLETED)면 불가
const canAdditionalChange = computed(() => {
  // 1. 출하가 취소 상태면 불가
  if (formData.status === 'CANCELLED') return false

  // 2. 기성에 포함된 출하면 불가
  if (shipmentData.value?.isBilled) return false

  // 3. 납품완료계가 완료 상태면 불가
  if (shipmentData.value?.deliveryDoneStatus === 'COMPLETED') return false

  return true
})

// 추가변경 비활성화 사유 (툴팁용)
const additionalChangeDisabledReason = computed(() => {
  if (formData.status === 'CANCELLED') {
    return '취소된 출하는 변경할 수 없습니다.'
  }
  if (shipmentData.value?.isBilled) {
    return '기성에 포함된 출하는 변경할 수 없습니다.'
  }
  if (shipmentData.value?.deliveryDoneStatus === 'COMPLETED') {
    return '납품완료계가 완료된 상태입니다. 새로운 발주를 등록해주세요.'
  }
  return ''
})

// ========================================
// 추가변경 관련 상태 및 메서드
// ========================================
const activeTab = ref<'current' | 'history'>('current')
const showAdditionalChangeModal = ref(false)
const showPreviousReceiptsModal = ref(false)
const showResignRequiredModal = ref(false)
const changeHistory = ref<QuantityChangeHistory[]>([])
const loadingHistory = ref(false)

// 변경 이력 로드
const loadChangeHistory = async () => {
  if (!shipmentId.value) return

  loadingHistory.value = true
  try {
    changeHistory.value = await shipmentService.getChangeHistory(shipmentId.value)
  } catch (error) {
    console.error('변경 이력 로드 실패:', error)
    changeHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

// 탭 변경 핸들러
const handleTabChange = (tab: 'current' | 'history') => {
  activeTab.value = tab
  if (tab === 'history' && changeHistory.value.length === 0) {
    loadChangeHistory()
  }
}

// 추가변경 완료 핸들러
const handleAdditionalChangeComplete = async (response: AdditionalChangeResponse) => {
  showAdditionalChangeModal.value = false

  // 데이터 새로고침
  if (shipmentId.value) {
    try {
      const data = await shipmentService.getShipmentDetail(shipmentId.value)
      shipmentData.value = data

      // 품목 데이터 다시 매핑
      items.value = data.items.map((item) => ({
        ...item,
        shippingQuantity: item.shipmentQuantity || 0,
        maxEditableQuantity: (item.shipmentQuantity || 0) + (item.remainingQuantity || 0),
        orderId: data.orderId,
        orderItemId: item.skuId
      }))

      // formData 업데이트
      formData.status = data.status
    } catch (error) {
      console.error('데이터 새로고침 실패:', error)
    }
  }

  // 변경 이력 새로고침
  await loadChangeHistory()

  // 재서명 필요한 경우 안내 모달 표시
  if (response.requiresResign) {
    showResignRequiredModal.value = true
  } else {
    alert('추가변경이 완료되었습니다.')
  }
}

// 메시지 발송 핸들러
const handleSendMessage = () => {
  // TODO: 메시지 발송 모달 열기 또는 메시지 발송 로직
  alert('메시지 발송 기능은 운송 등록 후 사용할 수 있습니다.')
}

// 변경 이력 날짜 포맷
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 상태 라벨 변환 (DB 기반)
const getStatusLabel = (status: string): string => {
  return getStatusLabelFromDB(status)
}

// 상태별 스타일 (DB 기반 badge class 활용)
const getStatusStyle = (status: string): string => {
  const badgeClass = getStatusBadgeClass(status)

  // badge class를 인라인 스타일로 변환
  const styleMap: Record<string, string> = {
    'bg-yellow-100 text-yellow-800': 'color: #92400e; font-weight: 500;',
    'bg-blue-100 text-blue-800': 'color: #1e40af; font-weight: 600;',
    'bg-green-100 text-green-800': 'color: #059669; font-weight: 600;',
    'bg-red-100 text-red-800': 'color: #dc2626; font-weight: 500;',
    'bg-orange-100 text-orange-800': 'color: #c2410c; font-weight: 500;'
  }

  return styleMap[badgeClass] || 'color: #6b7280; font-weight: 500;'
}

// 납품완료계 상태 라벨 변환
const getDeliveryDoneStatusLabel = (status?: string): string => {
  if (!status) return '-'
  const statusMap: Record<string, string> = {
    'PENDING': '대기',
    'IN_PROGRESS': '납품중',
    'PENDING_SIGNATURE': '서명대기',
    'COMPLETED': '완료',
    'CANCELLED': '취소'
  }
  return statusMap[status] || status
}

// 납품완료계 상태별 스타일
const getDeliveryDoneStatusStyle = (status?: string): string => {
  if (!status) return 'color: #6b7280; font-weight: 500;'
  const styleMap: Record<string, string> = {
    'PENDING': 'color: #6b7280; font-weight: 500;',
    'IN_PROGRESS': 'color: #2563eb; font-weight: 600;',
    'PENDING_SIGNATURE': 'color: #d97706; font-weight: 600;',
    'COMPLETED': 'color: #059669; font-weight: 600;',
    'CANCELLED': 'color: #dc2626; font-weight: 500;'
  }
  return styleMap[status] || 'color: #6b7280; font-weight: 500;'
}

// 포커스 시 원래 값 저장
const saveOriginalQuantity = (item: OrderItem) => {
  originalQuantities.value.set(item.skuId, item.shippingQuantity)
}

// 수량 검증 (validation 실패 시 원래 값으로 복원)
// 서버에서 제공하는 maxEditableQuantity 사용
const validateQuantity = (item: OrderItem) => {
  const originalValue = originalQuantities.value.get(item.skuId) || item.shippingQuantity

  if (item.shippingQuantity < 0) {
    alert('출하수량은 0 이상이어야 합니다.')
    item.shippingQuantity = originalValue  // 원래 값으로 복원
    return
  }

  if (item.shippingQuantity > item.maxEditableQuantity) {
    alert(
      `출하수량은 최대 ${formatQuantity(item.maxEditableQuantity)}개까지 가능합니다.\n` +
      `(현재 출하분 ${formatQuantity(item.shipmentQuantity)}개 + 잔여 ${formatQuantity(item.remainingQuantity)}개)`
    )
    item.shippingQuantity = originalValue  // 원래 값으로 복원
  }
}

/**
 * 실시간 잔여수량 계산
 * 최대 수정 가능 수량 - 현재 입력된 출하수량
 * (maxEditableQuantity = 원래 출하수량 + 서버에서 받은 잔여수량)
 */
const getCalculatedRemainingQuantity = (item: OrderItem): number => {
  const remaining = item.maxEditableQuantity - item.shippingQuantity
  // 부동소수점 연산 오차 방지
  return parseFloat(Math.max(0, remaining).toFixed(2))
}

/**
 * 잔여수량을 현재 출하수량에 추가
 * (출하수량을 최대 수정 가능 수량으로 설정)
 */
const addRemainingQuantity = (item: OrderItem) => {
  item.shippingQuantity = item.maxEditableQuantity
}

// 제출 처리
const handleSubmit = async () => {
  // 유효성 검사
  const validationRules = {
    deliveryRequestNo: [rules.required('납품요구번호')],
    shippingDate: [rules.required('출하일자')],
    status: [rules.required('상태')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  // 총 출하수량이 0인 경우 삭제로 처리
  const totalQty = totalShippingQuantity.value
  if (totalQty === 0) {
    const confirmed = confirm(
      '모든 품목의 출하수량이 0입니다.\n' +
      '출하 정보를 삭제하시겠습니까?'
    )
    if (confirmed) {
      await handleDelete()
    }
    return
  }

  await submit()
}

// 목록으로 이동 (returnPage 쿼리 파라미터 처리)
const handleGoBack = () => {
  const returnPage = route.query.returnPage
  if (returnPage) {
    router.push({ path: '/admin/shipping/list', query: { page: returnPage as string } })
  } else {
    router.push('/admin/shipping/list')
  }
}

// 삭제 처리
const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    await shipmentService.deleteShipment(shipmentId.value)
    alert('출하 정보가 삭제되었습니다.')
    handleGoBack()  // 삭제 후에도 returnPage로 이동
  } catch (error) {
    console.error('출하 정보 삭제 실패:', error)
    alert('출하 정보 삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, two-column-layout, items-table, items-section-wrapper, items-section-header, items-table-wrapper.with-header, items-table tfoot
 * - admin-forms.css: info-grid :deep(.form-field), info-grid :deep(.form-label), info-grid :deep(.required-mark)
 * - admin-common.css: text-center, text-right, empty-message
 */

/* Page-specific: Shipping edit page wrapper */
.shipping-edit {
  padding: 0;
}

/* Page-specific: 품목 테이블 수량 입력 */
.quantity-col {
  padding: 0.25rem !important;
}

.table-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  text-align: right;
  font-size: 0.875rem;
}

.table-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.table-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

/* 규격 셀 스타일 - 한 줄로 제한, 넘치면 ... 표시 */
.specification-cell {
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 탭 헤더 스타일 */
.items-section-header.with-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
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

.header-tabs {
  display: flex;
  gap: 0.25rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.tab-btn.active {
  background: #2563eb;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
}

.btn-additional-change {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-additional-change:hover:not(:disabled) {
  background: #d97706;
}

.btn-additional-change:disabled,
.btn-additional-change.disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-wrapper {
  display: inline-block;
}

/* 변경 이력 탭 컨텐츠 */
.history-tab-content {
  padding: 1rem;
  min-height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #9ca3af;
}

.no-history i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-history p {
  margin: 0;
}

/* 변경 이력 목록 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.history-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.history-info-row th {
  padding: 0;
  background: #f0f9ff;
  border-bottom: 1px solid #bfdbfe;
}

.history-info-line {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 0.875rem 1rem;
}

.history-info-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.history-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #3b82f6;
  background: #dbeafe;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.history-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1f2937;
}

.btn-view-receipt {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view-receipt:hover {
  background: #b91c1c;
}

.history-table th {
  padding: 0.625rem 1rem;
  text-align: left;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.75rem;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.history-table th.text-right,
.history-table td.text-right {
  text-align: right;
}

.history-table td {
  padding: 0.625rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.history-table tbody tr:last-child td {
  border-bottom: none;
}

.text-success {
  color: #059669;
  font-weight: 500;
}

.text-danger {
  color: #dc2626;
  font-weight: 500;
}

/* 기성포함 배지 스타일 */
.billing-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.9375rem;
  font-weight: 600;
  min-width: 80px;
}

.billing-badge.billed {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.billing-badge.not-billed {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* 전체수량 입력 버튼 */
.btn-max-quantity {
  display: inline-block;
  width: 20px;
  height: 20px;
  line-height: 18px;
  background: #3b82f6;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;
  border-radius: 3px;
  font-size: 10px;
  text-align: center;
  vertical-align: middle;
}

.btn-max-quantity:hover {
  background: #1d4ed8;
}

/* 출하수량 입력 폭 조절 */
.input-w66 {
  width: 66% !important;
  min-width: 70px !important;
}

/* 출하수량 컬럼 최소 너비 보장 */
.quantity-col {
  min-width: 80px !important;
}

.quantity-col input {
  min-width: 70px !important;
}
</style>
