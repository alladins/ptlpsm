<template>
  <div class="po-register">
    <PageHeader
      title="발주서 등록"
      description="원가가 등록된 공급원에 발주서를 등록합니다. 발주 없이 재고만 넣을 때는 재고현황의 [재고 직접 입고]를 쓰세요."
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
                  {{ company.companyName }}
                </option>
              </select>
              <span v-if="isOemManager" class="form-hint">본인 소속 회사로 자동 설정됩니다.</span>
            </FormField>

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

            <!-- 가공비 -->
            <FormField
              label="가공비"
              label-note="OEM 에 지불하는 가공 비용 · 발주일이 속한 달 원장에 가산"
            >
              <div class="fee-box">
                <span class="fee-currency">₩</span>
                <input
                  v-model.number="formData.processingFee"
                  type="number"
                  min="0"
                  step="1000"
                  class="fee-input"
                  placeholder="0"
                  @keydown="blockDecimalKey"
                  @paste="stripDecimalOnPaste"
                  @blur="truncateToInt($event, v => formData.processingFee = v)"
                >
              </div>
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
                      발주원가<br><small>(원/㎡)</small>
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
                        @keydown="blockDecimalKey"
                        @paste="stripDecimalOnPaste"
                        @input="updateAdditionalQuantity(item, Number(($event.target as HTMLInputElement).value))"
                        @blur="truncateToInt($event, v => updateAdditionalQuantity(item, v))"
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
                        @keydown="blockDecimalKey"
                        @paste="stripDecimalOnPaste"
                        @change="recalculateAmount(index)"
                        @blur="truncateToInt($event, v => { item.unitPrice = v; recalculateAmount(index) })"
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
import { blockDecimalKey, stripDecimalOnPaste, truncateToInt } from '~/utils/numberInput'
import type { CompanyInfoResponse } from '~/types/company'
import type { PurchaseOrderCreateRequest, PurchaseOrderItemInput } from '~/types/purchase-order'
import type { OemCost } from '~/types/oem-cost'
import type { Item, ItemSku } from '~/services/item.service'
import { formatCurrency, formatQuantity } from '~/utils/format'
import { reportValidationErrors } from '~/utils/formValidation'
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
  // 생산자 — 등록 화면에서는 입력받지 않는다(항상 null).
  // 귀속처가 명의와 다른 경우(창고이동 등)에만 값이 채워지고, 여기서는 공급원=귀속처다.
  sourceOemCompanyId: null as number | null,
  // 가공비 — 원장에 가산되는 부대비용
  processingFee: null as number | null,
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
// 원가 조회 대상 = 생산자 우선, 없으면 공급원.
// ⚠ 본사(리드파워) 명의는 원가 마스터 행이 없어 자동 조회가 비어 온다.
//   purchase_order_items.unit_price 는 원장의 2순위 원가 소스이므로,
//   본사 재고 등록 시 발주원가는 사용자가 직접 입력해야 한다.
const costLookupCompanyId = computed(
  () => formData.value.sourceOemCompanyId ?? formData.value.oemCompanyId
)

// 원가는 ★발주일 시점★ 구간으로 잡는다.
//   과거 실적을 소급 입력할 때 '지금 원가'가 들어가면 발주서 금액이 통째로 틀리고,
//   purchase_order_items.unit_price 는 매출원장 원가의 2순위 소스라 그대로 박제된다.
//   (실측: 발주일 2025-11-05 인데 2026-07-01 구간 단가가 들어가 있었다)
const reloadOemCosts = async () => {
  oemCostMap.value.clear()
  const oemId = costLookupCompanyId.value
  if (!oemId) { return }

  loadingOemCosts.value = true
  try {
    const costs: OemCost[] = await oemCostService.getByOemId(oemId, formData.value.orderDate || undefined)
    for (const cost of costs) {
      oemCostMap.value.set(cost.skuId, cost.costPrice)
    }

    // 이미 추가된 품목의 단가를 그 시점 원가로 갱신
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
}

// 공급원(또는 생산자)이 바뀔 때, 그리고 발주일이 바뀔 때 모두 다시 잡는다
watch(costLookupCompanyId, reloadOemCosts)
watch(() => formData.value.orderDate, reloadOemCosts)

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
  // 원가 마스터가 없어 단가를 채우지 못한 품목 (담당자에게 경고)
  const missingCostSkus: string[] = []

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
      // 신규 SKU 추가 — 단가는 OEM 원가 마스터 > 출하 원가 스냅샷 순으로만 채운다.
      // ★ item.unitPrice(판매단가) 폴백 금지 (2026-09-01 점검).
      //   원가 마스터가 없을 때 판매가가 발주 단가로 저장돼 왔고, 그 결과
      //   월별 매출원장에서 원가 = 매출가가 되어 마진이 0으로 계산됐다.
      //   (운영 실측: 전체 발주금액 14.97억 중 8.13억(54%)이 판매가로 입력됨)
      //   원가를 모르면 0으로 두고 담당자에게 알린다 — 잘못된 값보다 빈 값이 낫다.
      const costPrice = oemCostMap.value.get(skuIdStr)
      const resolvedCost = costPrice !== undefined ? costPrice : Number(item.costPrice || 0)
      if (!resolvedCost) {
        missingCostSkus.push(item.skuName || skuIdStr)
      }
      formData.value.items.push({
        skuId: skuIdStr,
        skuName: item.skuName || skuIdStr,
        quantity: Number(item.shipmentQuantity),
        shipmentQuantity: Number(item.shipmentQuantity),
        unitPrice: resolvedCost
      })
      addedCount++
    }
  }

  const messages = []
  if (addedCount > 0) { messages.push(`${addedCount}개 품목 추가`) }
  if (mergedCount > 0) { messages.push(`${mergedCount}개 품목 수량 합산`) }
  const summary = messages.length > 0 ? messages.join(', ') + '되었습니다.' : '추가할 품목이 없습니다.'
  const costWarning = missingCostSkus.length > 0
    ? `\n\n⚠️ 원가가 등록되지 않아 단가를 0으로 넣은 품목이 있습니다.\n- ${missingCostSkus.join('\n- ')}\n\n기초정보 > OEM 원가 관리에서 원가를 등록한 뒤 다시 불러오세요.`
    : ''
  alert(summary + costWarning)
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
//
// ★ 실패를 입력칸 아래 빨간 글씨로만 두지 않는다.
//   화면이 길어 에러가 스크롤 밖에 있으면 [저장] 을 눌러도 아무 일이 없는 것처럼 보인다.
//   reportValidationErrors 가 팝업으로 알리고 첫 문제 칸으로 스크롤·포커스까지 옮겨 준다.
const validate = async (): Promise<boolean> => {
  const newErrors: Record<string, string> = {}
  const extra: string[] = []

  if (!formData.value.oemCompanyId) {
    newErrors.oemCompanyId = '공급원(OEM 제조사)을 선택하세요.'
  }

  if (!formData.value.orderDate) {
    newErrors.orderDate = '발주일자를 입력하세요.'
  }

  if (!formData.value.expectedCompletionDate) {
    newErrors.expectedCompletionDate = '납기 예정일을 입력하세요.'
  }

  // 품목 관련은 특정 입력칸에 매달리지 않으므로 extra 로 넘긴다.
  if (formData.value.items.length === 0) {
    extra.push('품목을 최소 1개 이상 추가하세요.')
  } else if (formData.value.items.some(item => !item.quantity || item.quantity <= 0)) {
    extra.push('수량이 0인 품목이 있습니다. 수량을 입력하세요.')
  }

  // ★ 발주원가 0원 차단 — 재고 원가는 발주서에서 정해진다.
  //   0원으로 저장하면 그 물량이 입고된 뒤 출하·소진·원장이 전부 0원으로 따라간다.
  //   본사 명의는 원가 자동조회가 비어 오므로 직접 입력해야 한다.
  const zeroCost = formData.value.items.filter(item => !item.unitPrice || item.unitPrice <= 0)
  if (zeroCost.length > 0) {
    extra.push(
      `발주원가가 0원인 품목이 있습니다: ${zeroCost.map(i => i.skuName || i.skuId).join(', ')}\n`
      + '재고 원가는 발주서에서 정해지므로 0원으로 두면 이후 출하·소진·원장이 모두 0원이 됩니다.'
    )
  }

  errors.value = newErrors
  return await reportValidationErrors(newErrors, extra)
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
    shipmentIds: linkedShipmentIds.value.length > 0 ? linkedShipmentIds.value : undefined,
    sourceOemCompanyId: formData.value.sourceOemCompanyId,
    processingFee: formData.value.processingFee || 0
  }
}

// 저장 (DRAFT)
const handleSaveDraft = async () => {
  if (!await validate()) { return }

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
  if (!await validate()) { return }

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
    // ★ 공급원 = 원가가 등록된 회사 (2026-09-21 대전제 8번)
    //   회사 유형으로 고르지 않는다. 리드파워는 원가가 없어 지금은 안 나오고,
    //   자체 생산을 시작해 원가를 등록하면 코드 수정 없이 자동으로 나온다.
    //   OEM 담당자는 백엔드가 본인 회사만 돌려준다.
    oemCompanies.value = await companyService.getProducers()

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

/*
 * 가공비 입력칸
 *
 * form-input-sm 은 width 만 주는 클래스라 number 입력이 배경과 구분되지 않았다.
 * 금액이 들어가는 칸이므로 테두리와 ₩ 기호를 붙여 눈에 걸리게 한다.
 */
.fee-box {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  width: 160px;
  padding: 0.375rem 0.625rem;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.fee-box:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fee-currency {
  font-size: 0.8125rem;
  color: #94a3b8;
}

.fee-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
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
