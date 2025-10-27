<template>
  <div class="shipping-edit">
    <UiPageHeader
      title="출하 수정"
      description="출하 정보를 수정합니다."
    >
      <template #actions>
        <button
          class="btn-action btn-delete"
          @click="handleDelete"
          :disabled="!canDelete"
          :title="!canDelete ? '대기, 준비 또는 취소 상태에서만 삭제할 수 있습니다.' : ''"
        >
          <i class="fas fa-trash"></i>
          삭제
        </button>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-action"
          @click="handleRegisterTransport"
          :disabled="!canRegisterTransport"
          :title="!canRegisterTransport ? '준비 상태에서만 운송등록이 가능합니다.' : ''"
        >
          <i class="fas fa-truck"></i>
          운송등록
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
    </UiPageHeader>

    <AdminCommonLoadingSection v-if="loading" message="데이터를 불러오는 중..." />
    <AdminCommonErrorSection v-else-if="!shipmentData && !loading" message="출하 정보를 찾을 수 없습니다." />

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
                      <option value="PENDING">대기</option>
                      <option value="READY">준비</option>
                      <option value="IN_PROGRESS">진행중</option>
                      <option value="COMPLETED">완료</option>
                      <option value="CANCELLED">취소</option>
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
            <div class="items-section-header">
              <i class="fas fa-box"></i>
              <span>품목 정보</span>
            </div>
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 30px">NO</th>
                    <th style="width: 60px">품목명</th>
                    <th style="width: 60px">SKU ID</th>
                    <th style="width: 60px">SKU 품명</th>
                    <th style="width: 250px">규격</th>
                    <th style="width: 30px">단위</th>
                    <th style="width: 60px">발주수량</th>
                    <th style="width: 60px">기출하</th>
                    <th style="width: 60px">잔여수량</th>
                    <th style="width: 60px">출하수량</th>
                    <th style="width: 60px">단가</th>
                    <th style="width: 60px">금액</th>
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
                    <td>{{ item.specification }}</td>
                    <td>{{ item.unit }}</td>
                    <td class="text-right">{{ formatNumber(item.orderQuantity) }}</td>
                    <td class="text-right" :title="`다른 출하들의 합계: ${formatNumber(item.otherShipmentsQuantity)}`">
                      {{ formatNumber(item.otherShipmentsQuantity) }}
                    </td>
                    <td class="text-right">{{ formatNumber(item.remainingQuantity) }}</td>
                    <td class="text-right quantity-col">
                      <!-- 대기/준비 상태일 때만 수정 가능 -->
                      <input
                        v-if="canEditQuantity"
                        type="number"
                        v-model.number="item.shippingQuantity"
                        :min="0"
                        :max="item.maxEditableQuantity"
                        class="table-input text-right"
                        @focus="saveOriginalQuantity(item)"
                        @change="validateQuantity(item)"
                      />
                      <span v-else>{{ formatNumber(item.shippingQuantity) }}</span>
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.shippingQuantity * item.unitPrice) }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="items.length > 0">
                  <tr>
                    <td colspan="7" class="text-right"></td>
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
import { useRouter } from '#imports'
import { shipmentService } from '~/services/shipment.service'
import type { ShipmentDetailWithOrder, ShipmentItemWithOrder } from '~/services/shipment.service'
import { formatNumber, formatCurrency } from '~/utils/format'
import { useEditForm } from '~/composables/admin/useEditForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 수정'
})

const router = useRouter()

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
  goBack,
  reload
} = useEditForm<ShipmentDetailWithOrder, any, any>({
  fetchFunction: async (id) => {
    try {
      console.log('[출하 수정] fetchFunction 시작, ID:', id)

      // API 호출: GET /admin/shipments/${id}
      console.log('[출하 수정] API 호출 전')
      const data = await shipmentService.getShipmentDetail(id)
      console.log('[출하 수정] API 응답 데이터:', data)

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

// 삭제 가능 여부
const canDelete = computed(() => {
  return ['READY', 'PENDING', 'CANCELLED'].includes(formData.status)
})

// 운송등록 가능 여부
const canRegisterTransport = computed(() => {
  return formData.status === 'READY'
})

// 수량 수정 가능 여부 (대기/준비 상태만)
const canEditQuantity = computed(() => {
  return ['PENDING', 'READY'].includes(formData.status)
})

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
      `출하수량은 최대 ${formatNumber(item.maxEditableQuantity)}개까지 가능합니다.\n` +
      `(현재 출하분 ${formatNumber(item.shipmentQuantity)}개 + 잔여 ${formatNumber(item.remainingQuantity)}개)`
    )
    item.shippingQuantity = originalValue  // 원래 값으로 복원
  }
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

// 삭제 처리
const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) {
    return
  }

  try {
    await shipmentService.deleteShipment(shipmentId.value)
    alert('출하 정보가 삭제되었습니다.')
    router.push('/admin/shipping/list')
  } catch (error) {
    console.error('출하 정보 삭제 실패:', error)
    alert('출하 정보 삭제에 실패했습니다.')
  }
}

// 운송등록 화면으로 이동
const handleRegisterTransport = () => {
  const transportData = {
    shipmentId: shipmentId.value,
    projectName: formData.projectName,
    deliveryRequestNo: formData.deliveryRequestNo,
    clientName: formData.client
  }

  router.push({
    path: '/admin/transport/register',
    query: {
      data: JSON.stringify(transportData)
    }
  })
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
</style>
