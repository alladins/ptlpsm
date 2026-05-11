<template>
  <div class="po-register">
    <PageHeader
      title="발주서 등록"
      :description="isLeadpowerSelected
        ? '본사 재고를 등록합니다. 저장 후 상세 페이지에서 [바로 입고] 버튼으로 입고 처리합니다.'
        : 'OEM 제조사에 발주서를 등록 및 본사의 재고 등록합니다.'"
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times" />
          취소
        </button>
        <button
          class="btn-action"
          :disabled="submitting"
          @click="handleSaveDraft"
        >
          <i class="fas fa-save" />
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
        <button
          v-if="!isLeadpowerSelected"
          class="btn-action btn-primary"
          :disabled="submitting"
          @click="handleSaveAndIssue"
        >
          <i class="fas fa-paper-plane" />
          {{ submitting ? '처리 중...' : '저장 후 발행' }}
        </button>
      </template>
    </PageHeader>
    <div class="content-section">
      <form class="register-form" @submit.prevent>
        <FormSection title="발주서 정보">
          <div class="po-info-grid">
            <!-- 공급원 선택 (OEM 제조사 / 본사) -->
            <FormField label="공급원" required :error="errors.oemCompanyId">
              <select
                v-model="formData.oemCompanyId"
                class="form-select"
                :disabled="loadingOemCompanies || isOemManager"
              >
                <option :value="null">
                  {{ loadingOemCompanies ? '로딩 중...' : '선택하세요' }}
                </option>
                <option
                  v-for="company in oemCompanies"
                  :key="company.id"
                  :value="company.id"
                >
                  {{ company.companyName }}{{ company.companyType === 'LEADPOWER' ? ' [본사 직접입고용]' : '' }}
                </option>
              </select>
              <span v-if="isOemManager" class="form-hint">본인 소속 회사로 자동 설정됩니다.</span>
            </FormField>

            <!-- 본사(LEADPOWER) 선택 시 경고 패널 — PO 56 사고 재발 방지 가드 -->
            <div v-if="isLeadpowerSelected" class="leadpower-warning-panel">
              <div class="leadpower-warning-header">
                <i class="fas fa-exclamation-triangle" />
                <strong>선택된 제조사는 본사로 다음과 같이 처리되니 주의 바랍니다</strong>
              </div>
              <ul class="leadpower-warning-body">
                <li>발주서 상세 화면에 <b>"바로 입고"</b> 버튼이 노출됩니다.</li>
                <li>바로 입고 시 모든 품목이 본사 창고에 즉시 입고되며 <b>되돌릴 수 없습니다</b>.</li>
                <li>외부 OEM 발주라면 다른 제조사를 선택해 주세요.</li>
              </ul>
            </div>

            <!-- 발주일자 -->
            <FormField label="발주일자" required :error="errors.orderDate">
              <input
                v-model="formData.orderDate"
                type="date"
                class="form-input-sm text-center"
              >
            </FormField>

            <!-- 납기 예정일 -->
            <FormField label="납기 예정일" required :error="errors.expectedCompletionDate">
              <input
                v-model="formData.expectedCompletionDate"
                type="date"
                class="form-input-sm text-center"
              >
            </FormField>

            <!-- 비고 -->
            <FormField label="비고" :full-width="true">
              <textarea
                v-model="formData.remarks"
                class="form-textarea"
                rows="2"
                placeholder="비고 사항을 입력하세요"
              />
            </FormField>
          </div>
        </FormSection>

        <!-- 품목 정보 -->
        <FormSection style="margin-top: -20px">
          <div class="items-section-wrapper">
            <div class="items-section-header">
              <div class="header-left">
                <i class="fas fa-box" />
                <span>품목 정보</span>
              </div>
              <div class="header-buttons">
                <button
                  type="button"
                  class="btn-import-shipment"
                  @click="openShipmentPicker"
                >
                  <i class="fas fa-truck" />
                  출하에서 가져오기
                </button>
                <button
                  type="button"
                  class="btn-add-item"
                  @click="openSkuSelector"
                >
                  <i class="fas fa-plus" />
                  품목 추가
                </button>
              </div>
            </div>

            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40px">
                      NO
                    </th>
                    <th style="width: 80px">
                      SKU ID
                    </th>
                    <th style="width: 120px">
                      SKU 품명
                    </th>
                    <th style="width: 70px" class="text-right">
                      출하수량<br><small>(m²)</small>
                    </th>
                    <th style="width: 80px" class="text-right">
                      조정수량<br><small>(m²)</small>
                    </th>
                    <th style="width: 70px" class="text-right">
                      합계<br><small>(m²)</small>
                    </th>
                    <th style="width: 100px" class="text-right">
                      단가<br><small>(원)</small>
                    </th>
                    <th style="width: 120px" class="text-right">
                      금액<br><small>(원)</small>
                    </th>
                    <th style="width: 80px" class="text-center">
                      비고<br><small>(매)</small>
                    </th>
                    <th style="width: 50px">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="formData.items.length === 0">
                    <td colspan="10" class="empty-message">
                      품목을 추가하세요. "품목 추가" 버튼을 클릭하여 SKU를 선택합니다.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in formData.items" :key="item.skuId">
                    <td class="text-center">
                      {{ index + 1 }}
                    </td>
                    <td class="text-center">
                      {{ item.skuId }}
                    </td>
                    <td>{{ item.skuName }}</td>
                    <td class="text-right">
                      {{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(item.shipmentQuantity!) : '-' }}
                    </td>
                    <td class="text-right">
                      <input
                        type="number"
                        :value="getAdditionalQuantity(item)"
                        :min="-(item.shipmentQuantity || 0)"
                        step="1"
                        class="table-input text-right input-w75"
                        @input="updateAdditionalQuantity(item, Number(($event.target as HTMLInputElement).value))"
                      >
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(item.quantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <input
                        v-model.number="item.unitPrice"
                        type="number"
                        :min="0"
                        step="100"
                        class="table-input text-right input-w100"
                        @change="recalculateAmount(index)"
                      >
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(getItemAmount(item)) }}
                    </td>
                    <td class="remark-cell text-center">
                      {{ item.quantity > 0 ? `${formatQuantity(Math.round(item.quantity / 2))} 매` : '-' }}
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-remove"
                        title="삭제"
                        @click="removeItem(index)"
                      >
                        <i class="fas fa-trash-alt" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="formData.items.length > 0">
                  <tr>
                    <td colspan="3" class="text-right">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalShipmentQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalAdditionalQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>총 금액</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatCurrency(totalAmount) }}</strong>
                    </td>
                    <td class="text-center">
                      <strong>{{ formatQuantity(Math.round(totalQuantity / 2)) }} 매</strong>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- SKU 선택 팝업 -->
    <ItemSkuSelector
      v-model="showSkuSelector"
      @sku-selected="handleSkuSelected"
    />

    <!-- 출하에서 품목 가져오기 모달 -->
    <ShipmentPickerModal
      v-model="showShipmentPicker"
      :oem-company-id="formData.oemCompanyId"
      @confirm="handleShipmentsConfirm"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 발주서 등록 페이지
 * - OEM 제조사 선택, 발주일, 납기예정일, 비고
 * - SKU 품목 추가/삭제, 수량/단가 입력
 * - 저장(DRAFT) / 저장 후 발행(ISSUED)
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from '#imports'
import { purchaseOrderService } from '~/services/purchase-order.service'
import { companyService } from '~/services/company.service'
import { oemCostService } from '~/services/oem-cost.service'
import type { CompanyInfoResponse } from '~/types/company'
import type { PurchaseOrderCreateRequest, PurchaseOrderItemInput } from '~/types/purchase-order'
import type { OemCost } from '~/types/oem-cost'
import type { Item, ItemSku } from '~/services/item.service'
import { formatCurrency, formatQuantity } from '~/utils/format'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import ShipmentPickerModal from '~/components/admin/ShipmentPickerModal.vue'
import type { SelectedShipmentItem } from '~/components/admin/ShipmentPickerModal.vue'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'
import { usePermission } from '~/composables/usePermission'

const { isOemManager } = usePermission()

definePageMeta({
  layout: 'admin',
  pageTitle: '발주서 등록'
})

const router = useRouter()

// OEM 제조사 목록
const oemCompanies = ref<CompanyInfoResponse[]>([])
const loadingOemCompanies = ref(false)

// 본사 선택 여부
const isLeadpowerSelected = computed(() => {
  if (!formData.value.oemCompanyId) { return false }
  const selected = oemCompanies.value.find(c => c.id === formData.value.oemCompanyId)
  return selected?.companyType === 'LEADPOWER'
})

// OEM 원가 캐시 (skuId → costPrice)
const oemCostMap = ref<Map<string, number>>(new Map())
const loadingOemCosts = ref(false)

// 제출 상태
const submitting = ref(false)

// 유효성 검사 에러
const errors = ref<Record<string, string>>({})

// SKU 선택 팝업
const showSkuSelector = ref(false)

// 출하 선택 모달
const showShipmentPicker = ref(false)

// 연결된 출하 ID 목록 (중복 선택 방지용)
const linkedShipmentIds = ref<number[]>([])

// 품목 인터페이스 (UI용 확장)
interface PoItemRow extends PurchaseOrderItemInput {
  skuName: string
}

// 폼 데이터
const formData = ref({
  oemCompanyId: null as number | null,
  orderDate: getTodayDate(),
  expectedCompletionDate: '',
  remarks: '',
  items: [] as PoItemRow[]
})

// 오늘 날짜
function getTodayDate (): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 조정수량 계산 헬퍼 (양수 = 추가, 음수 = 차감)
const getAdditionalQuantity = (item: PoItemRow): number => {
  return (item.quantity || 0) - (item.shipmentQuantity || 0)
}

// 조정수량 변경 시 총 수량 갱신
const updateAdditionalQuantity = (item: PoItemRow, adjustQty: number) => {
  const shipQty = item.shipmentQuantity || 0
  // 조정수량: 최소 -출하수량 (합계가 0 미만 불가)
  const clampedQty = Math.max(-shipQty, adjustQty || 0)
  item.quantity = Math.max(0, shipQty + clampedQty)
}

// 품목 금액 계산
const getItemAmount = (item: PoItemRow): number => {
  return (item.quantity || 0) * (item.unitPrice || 0)
}

// 금액 재계산 (변경 이벤트 핸들러)
const recalculateAmount = (_index: number) => {
  // computed로 자동 계산되므로 별도 로직 불필요
}

// 총 출하수량
const totalShipmentQuantity = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (item.shipmentQuantity || 0), 0)
})

// 총 조정수량
const totalAdditionalQuantity = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + getAdditionalQuantity(item), 0)
})

// 총 수량
const totalQuantity = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 총 금액
const totalAmount = computed(() => {
  return formData.value.items.reduce((sum, item) => sum + getItemAmount(item), 0)
})

// OEM 제조사 변경 시 원가 조회
watch(() => formData.value.oemCompanyId, async (newOemId) => {
  oemCostMap.value.clear()
  if (!newOemId) { return }

  loadingOemCosts.value = true
  try {
    const costs: OemCost[] = await oemCostService.getByOemId(newOemId)
    for (const cost of costs) {
      oemCostMap.value.set(cost.skuId, cost.costPrice)
    }

    // 이미 추가된 품목의 단가를 OEM 원가로 갱신
    for (const item of formData.value.items) {
      const costPrice = oemCostMap.value.get(item.skuId)
      if (costPrice !== undefined) {
        item.unitPrice = costPrice
      }
    }
  } catch (error) {
    console.error('OEM 원가 조회 실패:', error)
  } finally {
    loadingOemCosts.value = false
  }
})

// 출하 선택 모달 열기
const openShipmentPicker = () => {
  if (!formData.value.oemCompanyId) {
    alert('OEM 제조사를 먼저 선택하세요.')
    return
  }
  showShipmentPicker.value = true
}

// 출하에서 품목 가져오기 확인 핸들러
const handleShipmentsConfirm = (shipmentItems: SelectedShipmentItem[], shipmentIds: number[]) => {
  // 선택된 출하 ID 누적
  for (const id of shipmentIds) {
    if (!linkedShipmentIds.value.includes(id)) {
      linkedShipmentIds.value.push(id)
    }
  }

  let addedCount = 0
  let mergedCount = 0

  for (const item of shipmentItems) {
    if (!item.shipmentQuantity || item.shipmentQuantity <= 0) { continue }

    const skuIdStr = String(item.skuId)
    const existing = formData.value.items.find(i => i.skuId === skuIdStr)

    if (existing) {
      // 같은 SKU -> 출하수량 합산, quantity도 갱신
      const oldAdditionalQty = getAdditionalQuantity(existing) // 추가수량을 shipmentQuantity 갱신 전에 계산
      existing.shipmentQuantity = (existing.shipmentQuantity || 0) + Number(item.shipmentQuantity)
      existing.quantity = existing.shipmentQuantity + Math.max(0, oldAdditionalQty)
      mergedCount++
    } else {
      // 신규 SKU 추가 (oemCostMap 단가 우선)
      const costPrice = oemCostMap.value.get(skuIdStr)
      formData.value.items.push({
        skuId: skuIdStr,
        skuName: item.skuName || skuIdStr,
        quantity: Number(item.shipmentQuantity),
        shipmentQuantity: Number(item.shipmentQuantity),
        unitPrice: costPrice !== undefined ? costPrice : Number(item.costPrice || item.unitPrice || 0)
      })
      addedCount++
    }
  }

  const messages = []
  if (addedCount > 0) { messages.push(`${addedCount}개 품목 추가`) }
  if (mergedCount > 0) { messages.push(`${mergedCount}개 품목 수량 합산`) }
  alert(messages.length > 0 ? messages.join(', ') + '되었습니다.' : '추가할 품목이 없습니다.')
}

// SKU 선택 팝업 열기
const openSkuSelector = () => {
  if (!formData.value.oemCompanyId) {
    alert('OEM 제조사를 먼저 선택하세요.')
    return
  }
  showSkuSelector.value = true
}

// SKU 선택 완료 핸들러
const handleSkuSelected = (item: Item, sku: ItemSku) => {
  const skuIdStr = String(sku.skuId)

  // 이미 추가된 SKU인지 확인
  const exists = formData.value.items.some(i => i.skuId === skuIdStr)
  if (exists) {
    alert('이미 추가된 품목입니다.')
    return
  }

  // OEM 원가 조회 (캐시에서)
  const costPrice = oemCostMap.value.get(skuIdStr)

  // 품목 추가 (OEM 원가 우선, 없으면 0)
  formData.value.items.push({
    skuId: skuIdStr,
    skuName: sku.skuNm || `${sku.thickness}T`,
    quantity: 0,
    shipmentQuantity: 0,
    unitPrice: costPrice !== undefined ? costPrice : 0
  })

  if (costPrice === undefined) {
    console.warn(`OEM 원가 미등록: SKU ${skuIdStr}`)
  }

  showSkuSelector.value = false
}

// 품목 삭제
const removeItem = (index: number) => {
  formData.value.items.splice(index, 1)
}

// 유효성 검사
const validate = (): boolean => {
  const newErrors: Record<string, string> = {}

  if (!formData.value.oemCompanyId) {
    newErrors.oemCompanyId = 'OEM 제조사를 선택하세요.'
  }

  if (!formData.value.orderDate) {
    newErrors.orderDate = '발주일자를 입력하세요.'
  }

  if (!formData.value.expectedCompletionDate) {
    newErrors.expectedCompletionDate = '납기 예정일을 입력하세요.'
  }

  if (formData.value.items.length === 0) {
    alert('품목을 최소 1개 이상 추가하세요.')
    return false
  }

  // 수량이 0인 품목 체크
  const zeroQuantityItems = formData.value.items.filter(item => !item.quantity || item.quantity <= 0)
  if (zeroQuantityItems.length > 0) {
    alert('수량이 0인 품목이 있습니다. 수량을 입력하세요.')
    return false
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// 저장 요청 데이터 생성
const buildRequestData = (): PurchaseOrderCreateRequest => {
  return {
    oemCompanyId: formData.value.oemCompanyId!,
    orderDate: formData.value.orderDate || null,
    expectedCompletionDate: formData.value.expectedCompletionDate || null,
    remarks: formData.value.remarks || null,
    items: formData.value.items.map(item => ({
      skuId: item.skuId,
      quantity: item.quantity,
      shipmentQuantity: item.shipmentQuantity || 0,
      unitPrice: item.unitPrice
    })),
    shipmentIds: linkedShipmentIds.value.length > 0 ? linkedShipmentIds.value : undefined
  }
}

// 저장 (DRAFT)
const handleSaveDraft = async () => {
  if (!validate()) { return }

  submitting.value = true
  try {
    const requestData = buildRequestData()
    await purchaseOrderService.createPurchaseOrder(requestData)
    alert('발주서가 저장되었습니다.')
    router.push('/admin/purchase-order/list')
  } catch (error: any) {
    console.error('발주서 저장 실패:', error)
    alert(error.message || '발주서 저장에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 저장 후 발행 (DRAFT -> ISSUED + PDF 생성)
const handleSaveAndIssue = async () => {
  if (!validate()) { return }

  submitting.value = true
  try {
    // 1. 먼저 DRAFT로 저장
    const requestData = buildRequestData()
    const created = await purchaseOrderService.createPurchaseOrder(requestData)

    // 2. 바로 발행 처리 (PDF 생성 포함)
    const issued = await purchaseOrderService.issuePurchaseOrder(created.poId)
    alert('발주서가 저장 및 발행되었습니다.' + (issued.pdfPath ? ' PDF가 생성되었습니다.' : ''))

    // 상세 페이지로 이동 (PDF 확인 가능)
    router.push(`/admin/purchase-order/detail/${created.poId}`)
  } catch (error: any) {
    console.error('발주서 저장/발행 실패:', error)
    alert(error.message || '발주서 저장/발행에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/admin/purchase-order/list')
}

// 초기 데이터 로드
onMounted(async () => {
  loadingOemCompanies.value = true
  try {
    // OEM 제조사 + 본사(LEADPOWER) 모두 조회
    // OEM 담당자는 백엔드 필터에 의해 본인 회사만 반환됨
    const manufacturers = await companyService.getManufacturers()
    const leadpower = await companyService.getCompanies('LEADPOWER')
    oemCompanies.value = [...leadpower, ...manufacturers]

    // OEM 담당자: 본인 회사 1건만 반환되므로 자동 선택
    if (isOemManager.value && oemCompanies.value.length === 1) {
      formData.value.oemCompanyId = oemCompanies.value[0].id
    }
  } catch (error) {
    console.error('회사 목록 로드 실패:', error)
  } finally {
    loadingOemCompanies.value = false
  }
})
</script>

<style scoped>
/*
 * 발주서 등록 페이지 스타일
 * 공통 스타일: admin-edit-register.css, admin-forms.css, admin-common.css
 */

.po-register {
  padding: 0;
}

/* 발주서 정보 그리드 (3열) */
.po-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* 비고 textarea */
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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

/* 버튼 그룹 */
.header-buttons {
  display: flex;
  gap: 0.5rem;
}

/* 출하에서 가져오기 버튼 */
.btn-import-shipment {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-import-shipment:hover {
  background: #047857;
}

/* 품목 추가 버튼 */
.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #059669;
}

/* 삭제 버튼 */
.btn-remove {
  padding: 0.25rem 0.5rem;
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fee2e2;
}

/* 테이블 입력 필드 너비 */
.input-w75 {
  width: 75px !important;
}

.input-w100 {
  width: 100px !important;
}

/* 품목 테이블 헤더 단위 표시 */
.items-table thead th small {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.7rem;
}

/* === 본사(LEADPOWER) 선택 경고 패널 (PO 56 사고 재발 방지 가드) === */
.leadpower-warning-panel {
  grid-column: 1 / -1;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  padding: 0.875rem 1rem;
  margin-top: 0.5rem;
}

.leadpower-warning-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #92400e;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.leadpower-warning-header i {
  color: #f59e0b;
  font-size: 1rem;
}

.leadpower-warning-body {
  margin: 0;
  padding-left: 1.25rem;
  color: #78350f;
  font-size: 0.8125rem;
  line-height: 1.65;
}

.leadpower-warning-body li {
  margin: 0.125rem 0;
}

/* 반응형 */
@media (max-width: 1024px) {
  .po-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .po-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
