<template>
  <div class="po-register">
    <PageHeader
      title="발주서 등록"
      description="OEM 제조사에 발주서를 등록합니다."
      icon="order"
      icon-color="blue"
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-action"
          @click="handleSaveDraft"
          :disabled="submitting"
        >
          <i class="fas fa-save"></i>
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
        <button
          class="btn-action btn-primary"
          @click="handleSaveAndIssue"
          :disabled="submitting"
        >
          <i class="fas fa-paper-plane"></i>
          {{ submitting ? '처리 중...' : '저장 후 발행' }}
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <form @submit.prevent class="register-form">
        <FormSection title="발주서 정보">
          <div class="po-info-grid">
            <!-- OEM 제조사 선택 -->
            <FormField label="OEM 제조사" required :error="errors.oemCompanyId">
              <select
                v-model="formData.oemCompanyId"
                class="form-select"
                :disabled="loadingOemCompanies"
              >
                <option :value="null">{{ loadingOemCompanies ? '로딩 중...' : '선택하세요' }}</option>
                <option
                  v-for="company in oemCompanies"
                  :key="company.id"
                  :value="company.id"
                >
                  {{ company.companyName }}
                </option>
              </select>
            </FormField>

            <!-- 발주일자 -->
            <FormField label="발주일자" :error="errors.orderDate">
              <input
                type="date"
                v-model="formData.orderDate"
                class="form-input-sm text-center"
              >
            </FormField>

            <!-- 납기 예정일 -->
            <FormField label="납기 예정일" :error="errors.expectedCompletionDate">
              <input
                type="date"
                v-model="formData.expectedCompletionDate"
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
              ></textarea>
            </FormField>
          </div>
        </FormSection>

        <!-- 품목 정보 -->
        <FormSection style="margin-top: -20px">
          <div class="items-section-wrapper">
            <div class="items-section-header">
              <div class="header-left">
                <i class="fas fa-box"></i>
                <span>품목 정보</span>
              </div>
              <div class="header-buttons">
                <button
                  type="button"
                  class="btn-import-shipment"
                  @click="openShipmentPicker"
                >
                  <i class="fas fa-truck"></i>
                  출하에서 가져오기
                </button>
                <button
                  type="button"
                  class="btn-add-item"
                  @click="openSkuSelector"
                >
                  <i class="fas fa-plus"></i>
                  품목 추가
                </button>
              </div>
            </div>

            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 40px">NO</th>
                    <th style="width: 80px">SKU ID</th>
                    <th style="width: 120px">SKU 품명</th>
                    <th style="width: 70px">출하수량</th>
                    <th style="width: 80px">추가수량</th>
                    <th style="width: 70px">합계(m²)</th>
                    <th style="width: 100px">단가</th>
                    <th style="width: 120px">금액</th>
                    <th style="width: 80px">비고</th>
                    <th style="width: 50px">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="formData.items.length === 0">
                    <td colspan="10" class="empty-message">
                      품목을 추가하세요. "품목 추가" 버튼을 클릭하여 SKU를 선택합니다.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in formData.items" :key="item.skuId">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="text-center">{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td class="text-right">
                      {{ (item.shipmentQuantity || 0) > 0 ? formatQuantity(item.shipmentQuantity!) : '-' }}
                    </td>
                    <td class="text-right">
                      <input
                        type="number"
                        :value="getAdditionalQuantity(item)"
                        @input="updateAdditionalQuantity(item, Number(($event.target as HTMLInputElement).value))"
                        :min="0"
                        step="1"
                        class="table-input text-right input-w75"
                      />
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(item.quantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <input
                        type="number"
                        v-model.number="item.unitPrice"
                        :min="0"
                        step="100"
                        class="table-input text-right input-w100"
                        @change="recalculateAmount(index)"
                      />
                    </td>
                    <td class="text-right">{{ formatCurrency(getItemAmount(item)) }}</td>
                    <td class="remark-cell text-center">
                      {{ item.quantity > 0 ? `${formatQuantity(Math.round(item.quantity / 2))} 매` : '-' }}
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-remove"
                        @click="removeItem(index)"
                        title="삭제"
                      >
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="formData.items.length > 0">
                  <tr>
                    <td colspan="3" class="text-right"><strong>합계</strong></td>
                    <td class="text-right"><strong>{{ formatQuantity(totalShipmentQuantity) }}</strong></td>
                    <td class="text-right"><strong>{{ formatQuantity(totalAdditionalQuantity) }}</strong></td>
                    <td class="text-right"><strong>{{ formatQuantity(totalQuantity) }}</strong></td>
                    <td class="text-right"><strong>총 금액</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                    <td class="text-center"><strong>{{ formatQuantity(Math.round(totalQuantity / 2)) }} 매</strong></td>
                    <td></td>
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

definePageMeta({
  layout: 'admin',
  pageTitle: '발주서 등록'
})

const router = useRouter()

// OEM 제조사 목록
const oemCompanies = ref<CompanyInfoResponse[]>([])
const loadingOemCompanies = ref(false)

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
function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 추가수량 계산 헬퍼
const getAdditionalQuantity = (item: PoItemRow): number => {
  return (item.quantity || 0) - (item.shipmentQuantity || 0)
}

// 추가수량 변경 시 총 수량 갱신
const updateAdditionalQuantity = (item: PoItemRow, additionalQty: number) => {
  item.quantity = (item.shipmentQuantity || 0) + Math.max(0, additionalQty || 0)
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

// 총 추가수량
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
  if (!newOemId) return

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
    if (!item.shipmentQuantity || item.shipmentQuantity <= 0) continue

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
  if (addedCount > 0) messages.push(`${addedCount}개 품목 추가`)
  if (mergedCount > 0) messages.push(`${mergedCount}개 품목 수량 합산`)
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
  if (!validate()) return

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
  if (!validate()) return

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
    oemCompanies.value = await companyService.getManufacturers()
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
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
