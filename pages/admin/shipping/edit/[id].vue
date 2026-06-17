<template>
  <div class="shipping-edit">
    <PageHeader
      title="출하 수정"
      description="출하 정보를 수정합니다."
      icon="shipping"
      icon-color="green"
    >
      <template #actions>
        <!-- 출고요청 버튼 (재고부족 시 비활성화) -->
        <button
          v-if="canShowDispatchRequestButton"
          class="btn-action btn-warning"
          :disabled="checkingInventory || (inventoryPreChecked && !inventoryCanDispatch)"
          :title="inventoryPreChecked && !inventoryCanDispatch ? '재고가 부족하여 출고요청할 수 없습니다' : 'OEM 제조사에 출고요청'"
          @click="handleDispatchRequestClick"
        >
          <i v-if="checkingInventory" class="fas fa-spinner fa-spin" />
          <i v-else class="fas fa-paper-plane" />
          {{ checkingInventory ? '확인 중...' : (inventoryPreChecked && !inventoryCanDispatch ? '재고부족' : '출고요청') }}
        </button>
        <button
          class="btn-action btn-delete"
          :disabled="!canDelete"
          :title="!canDelete ? getDeleteDisabledReason : ''"
          @click="handleDelete"
        >
          <i class="fas fa-trash" />
          삭제
        </button>
        <button class="btn-action btn-secondary" @click="handleGoBack">
          <i class="fas fa-list" />
          목록
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="submitting || !canEdit"
          :title="!canEdit ? getEditDisabledReason : ''"
          @click="handleSubmit"
        >
          <i class="fas fa-save" />
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

    <LoadingSection v-if="loading" message="데이터를 불러오는 중..." />
    <ErrorSection v-else-if="!shipmentData && !loading" message="출하 정보를 찾을 수 없습니다." />

    <div v-else class="content-section">
      <form class="edit-form" @submit.prevent="handleSubmit">
        <AccordionSection title="출하 정보" :summary="shippingSummary" :default-expanded="true">
          <!-- 2열 레이아웃 컨테이너 -->
          <div class="two-column-layout">
            <!-- 좌측 컬럼 -->
            <div class="left-column">
              <!-- 1. 계약 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-file-alt" />
                  <span>계약 정보</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="납품요구번호">
                    <input
                      v-model="formData.deliveryRequestNo"
                      type="text"
                      class="form-input-sm"
                      style="width: 100%;"
                      readonly
                    >
                  </FormField>
                  <FormField label="납품요구일자">
                    <input
                      type="text"
                      :value="formData.deliveryRequestDate || '-'"
                      class="form-input-sm text-center"
                      style="width: 100%;"
                      readonly
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-1" style="margin-top: 0.5rem;">
                  <FormField label="사업명">
                    <input
                      type="text"
                      :value="formData.projectName || '-'"
                      class="form-input-xl"
                      style="width: 100%;"
                      readonly
                    >
                  </FormField>
                </div>
              </div>

              <!-- 3. 출하 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-truck" />
                  <span>출하 정보</span>
                </div>
                <!-- 가운데 열(출하상태·총출하수량) 좁게, 우측 열(현장담당자·총금액) 넓게 -->
                <div class="info-grid grid-3" style="grid-template-columns: 1fr 0.7fr 1.6fr;">
                  <FormField label="출하일자" required :error="errors.shippingDate">
                    <input
                      v-model="formData.shippingDate"
                      type="date"
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

                  <FormField label="현장담당자">
                    <select
                      v-model="formData.siteManagerId"
                      class="form-select"
                      :disabled="loadingSiteManagers || !canEditOemAndDelivery"
                    >
                      <option :value="null">
                        {{ loadingSiteManagers ? '로딩 중...' : '선택하세요' }}
                      </option>
                      <option
                        v-for="manager in siteManagers"
                        :key="manager.userId"
                        :value="manager.userId"
                      >
                        {{ manager.userName }} ({{ manager.phone }})
                        <template v-if="manager.companyName">
                          - {{ manager.companyName }}
                        </template>
                      </option>
                    </select>
                  </FormField>

                  <FormField label="배송비">
                    <input
                      v-model.number="formData.shippingCost"
                      type="number"
                      class="form-input-sm text-right"
                      placeholder="0"
                      min="0"
                      step="1000"
                      :readonly="!canEdit"
                    >
                  </FormField>

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
                </div>
              </div>

              <!-- 6. 출고요청 정보 (출고요청이 있으면 표시) -->
              <div v-if="dispatchRequest" class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-paper-plane" />
                  <span>출고요청 정보</span>
                  <span
                    class="dispatch-status-badge"
                    :class="getDispatchStatusClass(dispatchRequest.status)"
                  >
                    {{ getDispatchStatusLabel(dispatchRequest.status) }}
                  </span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="요청일시">
                    <input
                      type="text"
                      :value="formatDateTime(dispatchRequest.requestedAt)"
                      class="form-input-md"
                      readonly
                    >
                  </FormField>
                  <FormField label="도착 예정일시">
                    <input
                      type="text"
                      :value="formatDateTime(dispatchRequest.expectedArrivalDatetime)"
                      class="form-input-md"
                      readonly
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-2" style="margin-top: 0.5rem;">
                  <FormField label="배송지">
                    <input
                      type="text"
                      :value="dispatchRequest.deliveryAddress || '-'"
                      class="form-input-xl"
                      readonly
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-2" style="margin-top: 0.5rem;">
                  <FormField label="인수자">
                    <input
                      type="text"
                      :value="dispatchRequest.receiverName || '-'"
                      class="form-input-sm"
                      readonly
                    >
                  </FormField>
                  <FormField label="인수자 연락처">
                    <input
                      type="text"
                      :value="dispatchRequest.receiverPhone || '-'"
                      class="form-input-sm"
                      readonly
                    >
                  </FormField>
                </div>
                <div v-if="dispatchRequest.remarks" class="info-grid grid-1" style="margin-top: 0.5rem;">
                  <FormField label="비고">
                    <input
                      type="text"
                      :value="dispatchRequest.remarks"
                      class="form-input-xl"
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
                  <i class="fas fa-building" />
                  <span>수요기관 정보</span>
                </div>
                <div class="info-grid grid-1">
                  <FormField label="수요기관명">
                    <input
                      v-model="formData.client"
                      type="text"
                      class="form-input-md"
                      style="width: 100%;"
                      readonly
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-2" style="margin-top: 0.5rem;">
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

              <!-- 4. OEM 제조사 + 건설사(시공사) -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-industry" />
                  <span>OEM 제조사 / 건설사(시공사)</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="공급원" required :error="errors.oemCompanyId">
                    <select
                      id="oem-company-select"
                      v-model="formData.oemCompanyId"
                      class="form-select"
                      :disabled="loadingOemCompanies || !canEditOemAndDelivery"
                    >
                      <option :value="null">
                        {{ loadingOemCompanies ? '로딩 중...' : '공급원을 선택하세요' }}
                      </option>
                      <option
                        v-for="company in oemCompanies"
                        :key="company.id"
                        :value="company.id"
                      >
                        {{ company.companyName }}{{ company.companyType === 'LEADPOWER' ? ' (본사)' : '' }}
                      </option>
                    </select>
                  </FormField>
                  <FormField label="건설사">
                    <input
                      type="text"
                      :value="formData.builderCompanyName || '(현장담당자 선택 시 자동 설정)'"
                      class="form-input-md"
                      readonly
                    >
                  </FormField>
                </div>
              </div>

              <!-- 5. 배송지 정보 -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-map-marker-alt" />
                  <span>배송지 정보</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="현장 도착 예정일시">
                    <input
                      type="text"
                      :value="formatExpectedArrivalAt(formData.expectedArrivalAt)"
                      class="form-input-md"
                      placeholder="예정일시"
                      readonly
                    >
                  </FormField>
                  <FormField label="우편번호">
                    <input
                      v-model="formData.zipcode"
                      type="text"
                      class="form-input-sm text-center"
                      placeholder="우편번호"
                      maxlength="10"
                      :readonly="!canEditOemAndDelivery"
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-2" style="margin-top: 0.5rem;">
                  <FormField label="배송지 주소">
                    <input
                      v-model="formData.deliveryAddress"
                      type="text"
                      class="form-input-xl"
                      placeholder="배송지 주소"
                      :readonly="!canEditOemAndDelivery"
                    >
                  </FormField>
                  <FormField label="상세주소">
                    <input
                      v-model="formData.addressDetail"
                      type="text"
                      class="form-input-xl"
                      placeholder="상세주소"
                      :readonly="!canEditOemAndDelivery"
                    >
                  </FormField>
                </div>
                <div class="info-grid grid-2" style="margin-top: 0.5rem;">
                  <FormField label="현장 인수자">
                    <input
                      v-model="formData.receiverName"
                      type="text"
                      class="form-input-sm"
                      placeholder="인수자명"
                      :readonly="!canEditOemAndDelivery"
                    >
                  </FormField>
                  <FormField label="인수자 연락처">
                    <input
                      v-model="formData.receiverPhone"
                      type="text"
                      class="form-input-sm"
                      placeholder="010-0000-0000"
                      :readonly="!canEditOemAndDelivery"
                    >
                  </FormField>
                </div>
              </div>
            </div>
          </div>
        </AccordionSection>

        <FormSection style="margin-top: 1rem">
          <div class="items-section-wrapper">
            <!-- 품목 정보 헤더 -->
            <div class="items-section-header">
              <div class="header-left">
                <i class="fas fa-box" />
                <span>품목 정보</span>
              </div>
            </div>

            <!-- 품목 테이블 -->
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40px" />
                    <th style="width: 60px">
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
                    <th>단위</th>
                    <th>발주수량</th>
                    <th>추가수량</th>
                    <th>기출하</th>
                    <th>잔여수량</th>
                    <th>출하수량</th>
                    <th>단가</th>
                    <th>원가</th>
                    <th>금액</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="items.length === 0">
                    <td colspan="15" class="empty-message">
                      품목 정보가 없습니다.
                    </td>
                  </tr>
                  <template v-for="item in items" :key="item.skuId">
                    <!-- 원본 품목 행 -->
                    <tr>
                      <td class="text-center">
                        <span v-if="item.isNewItem" class="badge-new">신규</span>
                      </td>
                      <td>{{ item.itemId }}</td>
                      <td>{{ item.itemName || '-' }}</td>
                      <td>{{ item.skuId }}</td>
                      <td>{{ item.skuName }}</td>
                      <td>{{ item.unit }}</td>
                      <td class="text-right">
                        {{ formatQuantity(item.orderQuantity) }}
                      </td>
                      <td class="text-right">
                        <span v-if="item.additionalQuantity > 0" class="additional-qty">
                          +{{ formatQuantity(item.additionalQuantity) }}
                        </span>
                        <span v-else>-</span>
                      </td>
                      <td class="text-right" :title="`다른 출하들의 합계: ${formatQuantity(item.otherShipmentsQuantity)}`">
                        {{ formatQuantity(item.otherShipmentsQuantity) }}
                      </td>
                      <td class="text-right">
                        {{ formatQuantity(getCalculatedRemainingQuantity(item)) }}
                        <button
                          v-if="canEdit && canEditQuantity && getCalculatedRemainingQuantity(item) > 0"
                          type="button"
                          class="btn-max-quantity"
                          :title="'잔여수량 추가 (' + formatQuantity(getCalculatedRemainingQuantity(item)) + ')'"
                          @click="addRemainingQuantity(item)"
                        >
                          ▶
                        </button>
                      </td>
                      <td class="text-right quantity-col">
                        <!-- 대기/준비 상태일 때만 수정 가능 -->
                        <input
                          v-if="canEdit && canEditQuantity"
                          v-model.number="item.shippingQuantity"
                          type="number"
                          :min="0"
                          :max="item.maxEditableQuantity"
                          step="2"
                          class="table-input text-right input-w66"
                          @focus="saveOriginalQuantity(item)"
                          @change="validateQuantity(item)"
                        >
                        <span v-else>{{ formatQuantity(item.shippingQuantity) }}</span>
                      </td>
                      <td class="text-right">
                        {{ formatNumber(item.unitPrice) }}
                      </td>
                      <td class="text-right">
                        {{ formatNumber(item.costPrice) }}
                      </td>
                      <td class="text-right">
                        {{ formatCurrency(item.shippingQuantity * item.unitPrice) }}
                      </td>
                      <td class="remark-cell">
                        <template v-if="getRemarksBadges(item.remarks).length > 0">
                          <span
                            v-for="(badge, idx) in getRemarksBadges(item.remarks)"
                            :key="idx"
                            class="merge-badge"
                            :style="{ backgroundColor: badge.color }"
                          >{{ badge.label }}</span>
                        </template>
                        <template v-else>
                          {{ item.shippingQuantity > 0 ? `${formatQuantity(Math.round(item.shippingQuantity / 2))} 매` : '-' }}
                        </template>
                        <span v-if="getBgradeForSku(item.skuId)" class="bgrade-badge">
                          B급 {{ getBgradeForSku(item.skuId)?.quantity }}{{ item.unit }}
                        </span>
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot v-if="items.length > 0">
                  <tr>
                    <td colspan="6" class="text-right">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalOrderQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong v-if="totalAdditionalQuantity > 0" class="additional-qty">+{{ formatQuantity(totalAdditionalQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalOtherShipmentsQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalRemainingQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalShippingQuantity) }}</strong>
                    </td>
                    <td class="text-right" />
                    <td class="text-right" />
                    <td class="text-right">
                      <strong>{{ formatCurrency(totalAmount) }}</strong>
                    </td>
                    <td />
                  </tr>
                  <tr v-if="totalBgradeCostAdjustment > 0">
                    <td colspan="11" class="text-right bgrade-cost-label">
                      B급 원가 차감
                    </td>
                    <td class="text-right bgrade-cost-value">
                      -{{ formatCurrency(totalBgradeCostAdjustment) }}
                    </td>
                    <td colspan="2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- 재서명 안내 모달 -->
    <ResignRequiredModal
      :is-open="showResignRequiredModal"
      @close="showResignRequiredModal = false"
      @send-message="handleSendMessage"
    />

    <!-- 재고 부족 현황 모달 -->
    <InventoryShortageModal
      :is-open="showInventoryShortageModal"
      :items="inventoryStatus?.items || []"
      :message="inventoryStatus?.message || ''"
      :oem-company-name="inventoryStatus?.oemCompanyName || null"
      @close="showInventoryShortageModal = false"
    />

    <!-- 출고요청 모달 -->
    <DispatchRequestModal
      :is-open="showDispatchRequestModal"
      :shipment-id="shipmentId"
      :initial-data="{
        zipcode: formData.zipcode,
        deliveryAddress: formData.deliveryAddress,
        addressDetail: formData.addressDetail,
        siteManagerId: formData.siteManagerId,
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        oemCompanyId: formData.oemCompanyId,
        expectedArrivalDatetime: formData.expectedArrivalAt
      }"
      :site-managers="siteManagers"
      @close="showDispatchRequestModal = false"
      @created="handleDispatchRequestCreated"
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
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from '#imports'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentDetailWithOrder, ShipmentItemWithOrder, SiblingDeliveryInfo } from '~/services/shipment.service'
import { formatNumber, formatCurrency, formatQuantity, formatDateTime, utcToKstDateString, utcToKstDateTimeLocal } from '~/utils/format'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { useShippingFormData } from '~/composables/admin/useShippingFormData'
import { useCommonStatus } from '~/composables/useCommonStatus'
import { usePermission } from '~/composables/usePermission'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import AccordionSection from '~/components/admin/forms/AccordionSection.vue'
import LoadingSection from '~/components/admin/common/LoadingSection.vue'
import ErrorSection from '~/components/admin/common/ErrorSection.vue'
import ResignRequiredModal from '~/components/shipment/ResignRequiredModal.vue'
import DispatchRequestModal from '~/components/shipment/DispatchRequestModal.vue'
import InventoryShortageModal from '~/components/shipment/InventoryShortageModal.vue'
import { dispatchRequestService } from '~/services/dispatch-request.service'
import type { DispatchRequest, InventoryStatusResponse } from '~/types/dispatch-request'
import { DISPATCH_STATUS_LABELS, DISPATCH_STATUS_COLORS } from '~/types/dispatch-request'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 수정'
})

const router = useRouter()
const route = useRoute()

// 권한
const { canEdit: hasEditPermission, canDelete: hasDeletePermission, isOemManager } = usePermission()

// 상태 관리 (DB 기반)
const { getStatusLabel: getStatusLabelFromDB, getStatusBadgeClass } = useCommonStatus()

// 품목 인터페이스 (ShipmentItemWithOrder 확장)
interface OrderItem extends ShipmentItemWithOrder {
  shippingQuantity: number // shipmentQuantity의 별칭 (수정 가능)
  maxEditableQuantity: number // 최대 수정 가능 수량 (shipmentQuantity + remainingQuantity)
  orderId: number
  orderItemId: string
}

// 원본 데이터 저장
const shipmentData = ref<ShipmentDetailWithOrder | null>(null)
const items = ref<OrderItem[]>([])

// 수량 입력 시 원래 값 저장 (validation 실패 시 복원용)
const originalQuantities = ref<Map<string, number>>(new Map())

// OEM 제조사 + 현장담당자 공통 데이터 (composable)
const {
  oemCompanies, loadingOemCompanies,
  siteManagers, loadingSiteManagers,
  setupBuilderAutoSet
} = useShippingFormData()

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
          maxEditableQuantity,
          orderId: data.orderId,
          orderItemId: item.skuId,
          isNewItem: item.remarks === '신규 추가' // 신규 추가 품목 여부
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
      status: data.status,
      // OEM 및 배송지 정보 (신규)
      oemCompanyId: data.oemCompanyId || null,
      builderCompanyId: data.builderCompanyId || null,
      builderCompanyName: data.builderCompanyName || null,
      siteManagerId: data.siteManagerId || null,
      zipcode: data.zipcode || null,
      deliveryAddress: data.deliveryAddress || null,
      addressDetail: data.addressDetail || null,
      receiverName: data.receiverName || null,
      receiverPhone: data.receiverPhone || null,
      shippingCost: data.shippingCost || 0
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

    // 안전한 날짜 포맷 변환 (UTC → KST 날짜)
    let formattedDate = ''
    if (shipment.shipmentDate) {
      try {
        // UTC ISO 8601 → KST YYYY-MM-DD 변환
        formattedDate = utcToKstDateString(shipment.shipmentDate) || shipment.shipmentDate.substring(0, 10)
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
      status: shipment.status || 'PENDING',
      // OEM 및 배송지 정보 (신규)
      oemCompanyId: shipment.oemCompanyId || null,
      builderCompanyId: shipment.builderCompanyId || null,
      builderCompanyName: shipment.builderCompanyName || '',
      siteManagerId: shipment.siteManagerId || null,
      zipcode: shipment.zipcode || '',
      deliveryAddress: shipment.deliveryAddress || '',
      addressDetail: shipment.addressDetail || '',
      receiverName: shipment.receiverName || '',
      receiverPhone: shipment.receiverPhone || '',
      // 현장 도착 예정일시 (서버 필드명: expectedArrivalDatetime)
      expectedArrivalAt: shipment.expectedArrivalDatetime || shipment.expectedArrivalAt || '',
      shippingCost: shipment.shippingCost || 0
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
  status: '',
  oemCompanyId: ''
})

// 현장담당자 선택 시 건설사 자동 설정 (composable)
setupBuilderAutoSet(formData)

// 총 발주수량
const totalOrderQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.orderQuantity || 0), 0)
})

// 총 추가수량
const totalAdditionalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.additionalQuantity || 0), 0)
})

// 총 기출하수량
const totalOtherShipmentsQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.otherShipmentsQuantity || 0), 0)
})

// 총 잔여수량
const totalRemainingQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + getCalculatedRemainingQuantity(item), 0)
})

// 총 출하수량 (현재 편집 중인 수량 합계)
const totalShippingQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.shippingQuantity || 0), 0)
})

// 총 금액 (현재 편집 중인 수량 기준)
const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
})

// 출하 정보(접힘) 헤더 요약: 납품요구번호 · 출하상태
const shippingSummary = computed(() => {
  const no = formData.deliveryRequestNo || '-'
  const status = getStatusLabel(formData.status)
  return `${no} · ${status}`
})

// B급 관련 헬퍼
const getBgradeForSku = (skuId: string) => {
  return shipmentData.value?.bgradeItems?.find(bg => bg.skuId === skuId) || null
}

// 총 원가 (출하수량 * 원가)
const totalCostPrice = computed(() => {
  return items.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * (item.costPrice || 0)), 0)
})

// B급 원가 차감액 (OEM 원가 기준)
const totalBgradeCostAdjustment = computed(() => {
  return shipmentData.value?.bgradeItems?.reduce((sum, bg) => {
    return sum + (bg.originalUnitPrice - bg.adjustedUnitPrice) * bg.quantity
  }, 0) || 0
})

// 비고(remarks)에서 합지 배지 정보 추출 (SKU ID 포함)
const getRemarksBadges = (remarks: string | null | undefined): { label: string; color: string }[] => {
  if (!remarks) { return [] }

  // 합지 타겟 품목 (합지 결과물): "에서 이전" 또는 "에서 합지됨/병합됨" 또는 "추가 합지/병합" 포함
  if (remarks.includes('에서 이전') || remarks.includes('에서 합지됨') || remarks.includes('에서 병합됨') || remarks.includes('추가 합지') || remarks.includes('추가 병합')) {
    // SKU ID 추출: "24547483, 24547485에서" 패턴
    const match = remarks.match(/([\d,\s]+)에서/)
    const skuIds = match ? match[1].trim() : ''
    return [{ label: skuIds ? `합지 ← ${skuIds}` : '합지', color: '#3b82f6' }]
  }

  // 합지 소스 품목 (원본): "로" + ("이전" 또는 "합지됨/병합됨") 포함
  if ((remarks.includes('이전') || remarks.includes('합지됨') || remarks.includes('병합됨')) &&
      (remarks.includes('로 ') || remarks.includes('로\n'))) {
    // SKU ID 추출: "24547481로" 패턴
    const match = remarks.match(/(\d+)로/)
    const skuId = match ? match[1] : ''
    return [{ label: skuId ? `합지소스 → ${skuId}` : '합지 소스', color: '#8b5cf6' }]
  }

  return []
}

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
  if (isOemManager.value) { return false }
  return hasDeletePermission.value && isDeletableStatus.value
})

// 수량 수정 가능 여부 (대기 상태만 + 수정 권한)
const canEditQuantity = computed(() => {
  return hasEditPermission.value && formData.status === 'PENDING'
})

// 출하 수정 가능 여부 (권한 + 비즈니스 로직)
const canEdit = computed(() => {
  // OEM 제조사 담당자는 수정 불가 (조회만 가능)
  if (isOemManager.value) { return false }
  // 출고요청이 존재하면 수정 불가
  if (dispatchRequest.value) { return false }
  return hasEditPermission.value && isEditableStatus.value
})

// 비활성화 사유 표시 (권한 vs 상태 구분)
const getEditDisabledReason = computed(() => {
  if (isOemManager.value) { return 'OEM 제조사 담당자는 출하를 수정할 수 없습니다' }
  if (dispatchRequest.value) { return '출고요청이 완료된 출하는 수정할 수 없습니다' }
  if (!hasEditPermission.value) { return '수정 권한이 없습니다' }
  if (!isEditableStatus.value) { return '완료 또는 취소된 출하는 수정할 수 없습니다' }
  return ''
})

const getDeleteDisabledReason = computed(() => {
  if (!hasDeletePermission.value) { return '삭제 권한이 없습니다' }
  if (!isDeletableStatus.value) { return '대기 또는 취소 상태에서만 삭제할 수 있습니다' }
  return ''
})

// OEM 제조사 및 배송지 정보 수정 가능 여부
// - 기성에 포함되지 않은 경우 수정 가능
// - 납품완료계가 완료되지 않은 경우 수정 가능
// - 출하가 취소되지 않은 경우 수정 가능
// - 발주서가 생성되지 않은 경우에만 수정 가능
const canEditOemAndDelivery = computed(() => {
  // OEM 제조사 담당자는 수정 불가
  if (isOemManager.value) { return false }
  // 출고요청이 존재하면 수정 불가
  if (dispatchRequest.value) { return false }
  // 출하가 취소 상태면 불가
  if (formData.status === 'CANCELLED') { return false }
  // 기성에 포함된 경우 수정 불가
  if (shipmentData.value?.isBilled) { return false }
  // 납품완료계가 완료된 경우 수정 불가
  if (shipmentData.value?.deliveryDoneStatus === 'COMPLETED') { return false }
  return true
})

// 재서명 안내 모달 / 출고요청 모달
const showResignRequiredModal = ref(false)
const showDispatchRequestModal = ref(false)

// 재고 현황 모달
const showInventoryShortageModal = ref(false)
const inventoryStatus = ref<InventoryStatusResponse | null>(null)
const checkingInventory = ref(false)

// 재고 사전 확인 (페이지 로드 시 출고요청 버튼 비활성화 판단용)
const inventoryPreChecked = ref(false)
const inventoryCanDispatch = ref(true)

// 출고요청 데이터
const dispatchRequest = ref<DispatchRequest | null>(null)
const loadingDispatchRequest = ref(false)

// 메시지 발송 핸들러
const handleSendMessage = () => {
  // TODO: 메시지 발송 모달 열기 또는 메시지 발송 로직
  alert('메시지 발송 기능은 운송 등록 후 사용할 수 있습니다.')
}

// 현장 도착 예정일시 포맷 (UTC → KST 변환 후 표시용)
const formatExpectedArrivalAt = (dateTimeStr: string): string => {
  if (!dateTimeStr) { return '-' }
  // UTC ISO 문자열을 KST로 변환 후 사람이 읽기 좋은 형식으로 출력
  const kst = utcToKstDateTimeLocal(dateTimeStr)
  if (!kst) { return '-' }
  const [datePart, timePart] = kst.split('T')
  return `${datePart} ${timePart}`
}

// 데이터 새로고침 (출하 상세 + 출고요청)
const refreshData = async () => {
  if (!shipmentId.value) { return }

  try {
    // 출하 상세 새로고침
    const data = await shipmentService.getShipmentDetail(shipmentId.value)

    // 출고요청 데이터 새로고침
    loadDispatchRequest()
    shipmentData.value = data

    // 품목 데이터 다시 매핑
    items.value = data.items.map(item => ({
      ...item,
      shippingQuantity: item.shipmentQuantity || 0,
      maxEditableQuantity: (item.shipmentQuantity || 0) + (item.remainingQuantity || 0),
      orderId: data.orderId,
      orderItemId: item.skuId,
      isNewItem: item.remarks === '신규 추가'
    }))

    // formData 업데이트
    formData.status = data.status

    // 배송지 정보 업데이트
    formData.zipcode = data.zipcode || ''
    formData.deliveryAddress = data.deliveryAddress || ''
    formData.addressDetail = data.addressDetail || ''
    formData.expectedArrivalAt = data.expectedArrivalDatetime || data.expectedArrivalAt || ''
    formData.receiverName = data.receiverName || ''
    formData.receiverPhone = data.receiverPhone || ''

    // OEM 제조사 및 현장담당자 정보 업데이트
    formData.oemCompanyId = data.oemCompanyId || null
    formData.siteManagerId = data.siteManagerId || null
  } catch (error) {
    console.error('데이터 새로고침 실패:', error)
  }
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
    item.shippingQuantity = originalValue // 원래 값으로 복원
    return
  }

  if (item.shippingQuantity > item.maxEditableQuantity) {
    alert(
      `출하수량은 최대 ${formatQuantity(item.maxEditableQuantity)}개까지 가능합니다.\n` +
      `(현재 출하분 ${formatQuantity(item.shipmentQuantity)}개 + 잔여 ${formatQuantity(item.remainingQuantity)}개)`
    )
    item.shippingQuantity = originalValue // 원래 값으로 복원
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
  // 유효성 검사 (OEM 제조사는 출고요청 시 선택하므로 여기서는 필수 아님)
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

// 출고요청 버튼 클릭 핸들러 (재고 확인 후 분기)
const handleDispatchRequestClick = async () => {
  checkingInventory.value = true
  try {
    inventoryStatus.value = await dispatchRequestService.checkInventoryStatus(shipmentId.value)
    if (inventoryStatus.value.canDispatch) {
      // 재고 충분 → 기존 출고요청 모달 열기
      showDispatchRequestModal.value = true
    } else {
      // 재고 부족 → 부족 현황 모달 열기
      showInventoryShortageModal.value = true
    }
  } catch (error: any) {
    console.error('재고 현황 확인 실패:', error)
    const errorMessage = error?.message || '알 수 없는 오류'
    alert(`재고 현황 확인 중 오류가 발생했습니다.\n\n원인: ${errorMessage}\n\n네트워크 연결 상태를 확인하거나 관리자에게 문의하세요.`)
  } finally {
    checkingInventory.value = false
  }
}

// 출고요청 버튼 표시 조건 (출고요청이 없는 경우에만 표시)
const canShowDispatchRequestButton = computed(() => {
  // OEM 제조사 담당자는 출고요청 불가
  if (isOemManager.value) { return false }
  // 취소/완료 상태에서는 표시하지 않음
  if (['CANCELLED', 'COMPLETED'].includes(formData.status)) { return false }
  // 이미 출고요청이 있으면 표시하지 않음
  if (dispatchRequest.value) { return false }
  return true
})

// 출고요청 데이터 로드
const loadDispatchRequest = async () => {
  if (!shipmentId.value) { return }

  loadingDispatchRequest.value = true
  try {
    dispatchRequest.value = await dispatchRequestService.getDispatchRequestByShipmentId(shipmentId.value)
  } catch (error) {
    console.error('출고요청 조회 실패:', error)
    dispatchRequest.value = null
  } finally {
    loadingDispatchRequest.value = false
  }
}

/**
 * 같은 납품요구의 형제 출하에서 배송지/현장소장 정보 프리필
 * 현재 출하에 배송지 정보가 없고, 출고요청도 없는 경우에만 적용
 */
const prefillSiblingDeliveryInfo = async () => {
  if (!shipmentId.value) { return }

  // 이미 배송지 정보가 있으면 스킵
  if (formData.deliveryAddress) { return }
  // 이미 출고요청이 있으면 스킵
  if (dispatchRequest.value) { return }

  try {
    const siblingInfo = await shipmentService.getSiblingDeliveryInfo(shipmentId.value)
    if (!siblingInfo) { return }

    // 배송지 정보 프리필 (현재 값이 비어있는 필드만)
    if (!formData.zipcode && siblingInfo.zipcode) {
      formData.zipcode = siblingInfo.zipcode
    }
    if (!formData.deliveryAddress && siblingInfo.deliveryAddress) {
      formData.deliveryAddress = siblingInfo.deliveryAddress
    }
    if (!formData.addressDetail && siblingInfo.addressDetail) {
      formData.addressDetail = siblingInfo.addressDetail
    }
    if (!formData.siteManagerId && siblingInfo.siteManagerId) {
      formData.siteManagerId = siblingInfo.siteManagerId
    }
    if (!formData.receiverName && siblingInfo.receiverName) {
      formData.receiverName = siblingInfo.receiverName
    }
    if (!formData.receiverPhone && siblingInfo.receiverPhone) {
      formData.receiverPhone = siblingInfo.receiverPhone
    }
    if (!formData.oemCompanyId && siblingInfo.oemCompanyId) {
      formData.oemCompanyId = siblingInfo.oemCompanyId
    }

    console.log('[출하 수정] 형제 출하 배송지 정보 프리필 완료:', siblingInfo)
  } catch (error) {
    console.warn('[출하 수정] 형제 출하 배송지 조회 실패 (무시):', error)
  }
}

// 출하 데이터 로드 완료 시 출고요청 조회 + 형제 배송지 프리필 + 재고 사전 확인
watch(() => shipmentData.value, async (newData) => {
  if (newData && shipmentId.value) {
    await loadDispatchRequest()
    // 출고요청이 없고 배송지 정보가 비어있으면 형제 출하에서 프리필
    await prefillSiblingDeliveryInfo()
    // 출고요청 버튼 표시 조건일 때 재고 상태 사전 확인
    if (canShowDispatchRequestButton.value && formData.oemCompanyId) {
      try {
        const status = await dispatchRequestService.checkInventoryStatus(shipmentId.value)
        inventoryCanDispatch.value = status.canDispatch
        inventoryPreChecked.value = true
      } catch (error) {
        console.error('재고 사전 확인 실패:', error)
        inventoryCanDispatch.value = true // 확인 실패 시 버튼 활성 유지
      }
    }
  }
})

// 출고요청 생성 완료 핸들러
const handleDispatchRequestCreated = async () => {
  showDispatchRequestModal.value = false
  // 출고요청 데이터 새로고침
  await loadDispatchRequest()
  // 출하 정보 새로고침 (dispatchStatus 반영)
  await refreshData()
  alert('출고요청이 생성되었습니다.')
}

// 출고요청 상태 라벨
const getDispatchStatusLabel = (status: string): string => {
  return DISPATCH_STATUS_LABELS[status as keyof typeof DISPATCH_STATUS_LABELS] || status
}

// 출고요청 상태 클래스
const getDispatchStatusClass = (status: string): string => {
  return DISPATCH_STATUS_COLORS[status as keyof typeof DISPATCH_STATUS_COLORS] || 'bg-gray-100 text-gray-700'
}

// 삭제 처리
const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    await shipmentService.deleteShipment(shipmentId.value)
    alert('출하 정보가 삭제되었습니다.')
    handleGoBack() // 삭제 후에도 returnPage로 이동
  } catch (error: any) {
    console.error('출하 정보 삭제 실패:', error)
    alert(error.message || '출하 정보 삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-forms.css';

/*
 * Common styles managed by:
 * - admin-common.css: text-center, text-right, empty-message, loading-container, error-container, modal-overlay
 * - admin-buttons.css: btn-action, btn-primary, btn-secondary, btn-delete, btn-warning
 * - admin-forms.css: info-grid, info-group, form-input-*, form-select
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

/* 품목 헤더 스타일 */
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

/* 전체 너비 섹션 (배송지 정보용) */
.full-width-section {
  margin-top: 0;
}

/* 선택 배지 */
.optional-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
}

/* 그리드 1열 */
.info-grid.grid-1 {
  grid-template-columns: 1fr;
}

/* 그리드 4열 */
.info-grid.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* 그리드 5열 */
.info-grid.grid-5 {
  grid-template-columns: 100px 1fr 1fr 1fr 1fr;
}

/* 2열 스팬 */
.col-span-2 {
  grid-column: span 2;
}

/* 폼 셀렉트 스타일 */
.form-select {
  width: 100%;
  height: 32px;
  padding: 0 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.form-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 반응형 */
@media (max-width: 1200px) {
  .info-grid.grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid.grid-5 {
    grid-template-columns: 1fr 1fr;
  }

  .col-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .info-grid.grid-4 {
    grid-template-columns: 1fr;
  }

  .info-grid.grid-5 {
    grid-template-columns: 1fr;
  }
}

/* 필드 알림 메시지 */
.field-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  margin-top: 0.75rem;
}

.field-notice.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.field-notice.warning i {
  color: #d97706;
}

/* 품목 테이블 - 컴팩트 레이아웃 */
.items-table {
  table-layout: auto !important;
}

.items-table th,
.items-table td {
  padding: 0.25rem 0.5rem !important;
  white-space: nowrap !important;  /* 모든 컬럼 한 줄 표시 */
  font-size: 0.8125rem;
}

/* 출고요청 상태 배지 */
.dispatch-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.25rem;
  margin-left: auto;
}

/* 출고요청 버튼 스타일 */
.btn-warning {
  background: #f59e0b !important;
  color: white !important;
  border-color: #f59e0b !important;
}

.btn-warning:hover {
  background: #d97706 !important;
  border-color: #d97706 !important;
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

/* 비고 셀 */
.remark-cell {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 추가수량 표시 */
.additional-qty {
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
}

/* 신규 뱃지 */
.badge-new {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #10b981;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 4px;
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

/* B급 원가 차감 (tfoot) */
.bgrade-cost-label {
  color: #dc2626;
  font-weight: 600;
  font-size: 0.8125rem;
}

.bgrade-cost-value {
  color: #dc2626;
  font-weight: 600;
}
</style>
