<template>
  <div class="shipping-register">
    <PageHeader
      title="출하 등록"
      description="출하 정보를 등록하고 관리합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times"></i>
          취소
        </button>
        <button
          class="btn-action btn-primary"
          @click="handleSubmit"
          :disabled="submitting || !canWrite"
          :title="!canWrite ? '등록 권한이 없습니다' : ''"
        >
          <i class="fas fa-save"></i>
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>

    <div class="content-section">
      <form @submit.prevent="handleSubmit" class="register-form">
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
                  <FormField label="납품요구번호(발주번호)" required :error="errors.deliveryRequestNo">
                    <div class="search-group">
                      <input
                        type="text"
                        v-model="formData.deliveryRequestNo"
                        class="form-input-sm"
                        placeholder="납품요구번호를 선택하세요"
                        readonly
                      >
                      <button type="button" class="btn-search" @click="openOrderSelectPopup">
                        <i class="fas fa-search"></i>
                        조회
                      </button>
                    </div>
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
                      placeholder="발주 선택 시 자동으로 입력됩니다"
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
                <div class="info-grid grid-4">
                  <FormField label="출하일자" required :error="errors.shippingDate">
                    <input
                      type="date"
                      v-model="formData.shippingDate"
                      class="form-input-sm text-center"
                    >
                  </FormField>

                  <FormField label="상태">
                    <input
                      type="text"
                      value="대기"
                      class="form-input-sm text-center"
                      readonly
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
                  <FormField label="수요기관명" required :error="errors.client">
                    <input
                      type="text"
                      v-model="formData.client"
                      class="form-input-md text-center"
                      placeholder="수요기관 불러오기"
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
                      placeholder="발주 선택 시 자동으로 입력됩니다"
                      readonly
                    >
                  </FormField>
                </div>
              </div>

              <!-- 4. OEM 제조사 정보 (신규) -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-industry"></i>
                  <span>OEM 제조사</span>
                </div>
                <div class="info-grid grid-1">
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
                </div>
              </div>
            </div>
          </div>

          <!-- 5. 배송지 정보 - 발주서 생성 시 입력하므로 등록 시에는 숨김 -->
          <div v-if="false" class="full-width-section">
            <div class="info-group">
              <div class="info-group-header">
                <i class="fas fa-map-marker-alt"></i>
                <span>배송지 정보</span>
                <span class="optional-badge">선택</span>
              </div>
              <div class="info-grid grid-5">
                <FormField label="우편번호">
                  <input
                    type="text"
                    v-model="formData.zipcode"
                    class="form-input-sm text-center"
                    placeholder="우편번호"
                    maxlength="10"
                  >
                </FormField>
                <FormField label="배송지 주소" class="col-span-2">
                  <input
                    type="text"
                    v-model="formData.deliveryAddress"
                    class="form-input-xl"
                    placeholder="배송지 주소"
                  >
                </FormField>
                <FormField label="상세주소" class="col-span-2">
                  <input
                    type="text"
                    v-model="formData.addressDetail"
                    class="form-input-xl"
                    placeholder="상세주소"
                  >
                </FormField>
              </div>
              <div class="info-grid grid-4" style="margin-top: 0.5rem;">
                <FormField label="현장담당자">
                  <select
                    v-model="formData.siteManagerId"
                    class="form-select"
                    :disabled="loadingSiteManagers"
                  >
                    <option :value="null">{{ loadingSiteManagers ? '로딩 중...' : '선택하세요' }}</option>
                    <option
                      v-for="manager in siteManagers"
                      :key="manager.userid"
                      :value="manager.userid"
                    >
                      {{ manager.userName }} ({{ manager.phone }})
                      <template v-if="manager.companyName"> - {{ manager.companyName }}</template>
                    </option>
                  </select>
                </FormField>
                <FormField label="현장 인수자">
                  <input
                    type="text"
                    v-model="formData.receiverName"
                    class="form-input-sm"
                    placeholder="인수자명"
                  >
                </FormField>
                <FormField label="인수자 연락처">
                  <input
                    type="text"
                    v-model="formData.receiverPhone"
                    class="form-input-sm"
                    placeholder="010-0000-0000"
                  >
                </FormField>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection style="margin-top: -20px">
          <div class="items-section-wrapper">
            <div class="items-section-header">
              <div class="header-left">
                <i class="fas fa-box"></i>
                <span>품목 정보</span>
              </div>
              <button
                v-if="formData.orderId"
                type="button"
                class="btn-add-item"
                @click="openSkuSelector"
              >
                <i class="fas fa-plus"></i>
                품목 추가
              </button>
            </div>
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 20px">NO</th>
                    <th style="width: 80px">품목명</th>
                    <th style="width: 60px">SKU ID</th>
                    <th style="width: 100px">SKU 품명</th>
                    <th style="width: 350px">규격</th>
                    <th style="width: 20px">단위</th>
                    <th style="width: 70px">발주수량</th>
                    <th style="width: 60px">기출하</th>
                    <th style="width: 60px">잔여수량</th>
                    <th style="width: 80px" class="quantity-col">출하수량</th>
                    <th style="width: 70px">단가</th>
                    <th style="width: 80px">금액</th>
                    <th style="width: 120px">비고</th>
                    <th style="width: 50px">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedOrderItems.length === 0 && newItems.length === 0">
                    <td colspan="14" class="empty-message">
                      납품요구번호를 선택하면 품목이 표시됩니다.
                    </td>
                  </tr>
                  <!-- 기존 발주 품목 -->
                  <tr v-for="item in selectedOrderItems" :key="item.itemId">
                    <td>{{ item.itemId }}</td>
                    <td>{{ item.itemName }}</td>
                    <td>{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td class="specification-cell" :title="item.specification">{{ item.specification }}</td>
                    <td>{{ item.unit }}</td>
                    <td class="text-right">{{ formatQuantity(item.quantity) }}</td>
                    <td class="text-right">{{ formatQuantity(item.shippedQuantity) }}</td>
                    <td class="text-right">
                      {{ formatQuantity(getCalculatedRemainingQuantity(item)) }}
                      <button
                        type="button"
                        class="btn-max-quantity"
                        @click="setMaxQuantity(item)"
                        :title="'전체수량 입력 (' + formatQuantity(getCalculatedRemainingQuantity(item)) + ')'"
                        :disabled="getCalculatedRemainingQuantity(item) <= 0"
                      >▶</button>
                    </td>
                    <td class="text-right quantity-col">
                      <input
                        type="number"
                        v-model.number="item.shippingQuantity"
                        :min="0"
                        :max="item.remainingQuantity"
                        class="table-input text-right input-w75"
                        @change="updateShippingQuantity(item)"
                      />
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.shippingQuantity * item.unitPrice) }}</td>
                    <td class="remark-cell" :title="item.remark || ''">{{ item.remark || '-' }}</td>
                    <td class="text-center">
                      <span class="text-muted">-</span>
                    </td>
                  </tr>
                  <!-- 신규 추가 품목 -->
                  <tr v-for="item in newItems" :key="'new-' + item.skuId" class="new-item-row">
                    <td class="text-center">
                      <span class="badge-new">신규</span>
                    </td>
                    <td>{{ item.itemName }}</td>
                    <td class="text-center">{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td class="specification-cell" :title="item.specification">{{ item.specification }}</td>
                    <td class="text-center">{{ item.unit }}</td>
                    <!-- 발주수량: 병합 시 수량 표시, 아니면 "-" -->
                    <td class="text-right">{{ item.quantity ? formatQuantity(item.quantity) : '-' }}</td>
                    <!-- 기출하 -->
                    <td class="text-right">{{ item.shippedQuantity !== undefined ? formatQuantity(item.shippedQuantity) : '-' }}</td>
                    <!-- 잔여수량 -->
                    <td class="text-right">{{ item.remainingQuantity ? formatQuantity(item.remainingQuantity - item.shippingQuantity) : '-' }}</td>
                    <td class="text-right quantity-col">
                      <input
                        type="number"
                        v-model.number="item.shippingQuantity"
                        :min="0"
                        class="table-input text-right input-w75"
                      />
                    </td>
                    <td class="text-right">{{ formatNumber(item.unitPrice) }}</td>
                    <td class="text-right">{{ formatCurrency(item.shippingQuantity * item.unitPrice) }}</td>
                    <td class="remark-cell" :title="item.remark || ''">{{ item.remark || '-' }}</td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-remove"
                        @click="removeNewItem(item.skuId)"
                        title="삭제"
                      >
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="selectedOrderItems.length > 0 || newItems.length > 0">
                  <tr>
                    <td colspan="7" class="text-right"></td>
                    <td colspan="2" class="text-right"><strong>총 출하수량</strong></td>
                    <td class="text-right"><strong>{{ formatQuantity(totalShippingQuantity) }}</strong></td>
                    <td class="text-right"><strong>총 금액</strong></td>
                    <td class="text-right"><strong>{{ formatCurrency(totalAmount) }}</strong></td>
                    <td colspan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </FormSection>
      </form>
    </div>

    <!-- 발주번호 조회 팝업 -->
    <OrderSelectPopup
      v-if="showOrderSelectPopup"
      :show="showOrderSelectPopup"
      :shippable-only="true"
      @close="closeOrderSelectPopup"
      @select="handleOrderSelect"
    />

    <!-- SKU 선택 팝업 -->
    <ItemSkuSelector
      v-model="showSkuSelector"
      @sku-selected="handleSkuSelected"
    />

    <!-- 품목 병합 모달 -->
    <ItemMergeSelectModal
      v-if="pendingNewItem"
      :is-open="showMergeModal"
      :new-item="pendingNewItem"
      :existing-items="selectedOrderItems.map(item => ({
        skuId: item.skuId,
        skuName: item.skuName,
        currentQuantity: item.shippingQuantity,
        remainingQuantity: item.remainingQuantity
      }))"
      @close="handleMergeClose"
      @confirm="handleMergeConfirm"
      @skip="handleMergeSkip"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import ItemMergeSelectModal from '~/components/shipment/ItemMergeSelectModal.vue'
import type { OrderDetailResponse } from '~/types/order'
import type { CompanyInfoResponse } from '~/types/company'
import type { UserByRole } from '~/types/user'
import type { Item, ItemSku } from '~/services/item.service'
import { shipmentService } from '~/services/shipment.service'
import { companyService } from '~/services/company.service'
import { userService } from '~/services/user.service'
import { formatNumber, formatCurrency, formatQuantity } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { usePermission } from '~/composables/usePermission'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 등록'
})

const router = useRouter()

// 권한
const { canWrite } = usePermission()

// OEM 제조사 목록
const oemCompanies = ref<CompanyInfoResponse[]>([])
const loadingOemCompanies = ref(false)

// 현장담당자 목록
const siteManagers = ref<UserByRole[]>([])
const loadingSiteManagers = ref(false)

// OEM 및 배송지/현장담당자 데이터 로드
onMounted(async () => {
  // OEM 제조사 목록 로드
  loadingOemCompanies.value = true
  try {
    const companies = await companyService.getCompanies()
    oemCompanies.value = companies
  } catch (error) {
    console.error('OEM 제조사 목록 로드 실패:', error)
  } finally {
    loadingOemCompanies.value = false
  }

  // 현장담당자 목록 로드
  loadingSiteManagers.value = true
  try {
    const users = await userService.getUsersByRoles(['SITE_MANAGER'])
    siteManagers.value = users
  } catch (error) {
    console.error('현장담당자 목록 로드 실패:', error)
  } finally {
    loadingSiteManagers.value = false
  }
})

// 상태 관리 (등록 시에는 항상 '대기' 상태로 고정)

// 품목 인터페이스
interface OrderItem {
  itemId: string
  itemName: string
  skuId: string
  skuName: string
  specification: string
  unit: string
  quantity: number
  shippingQuantity: number
  shippedQuantity: number  // 기출하 수량
  remainingQuantity: number
  unitPrice: number
  amount: number
  deliveryLocation?: string
  deliveryDeadline?: string
  deliveryTerms?: string
  remark?: string  // 비고 (병합 사유)
  optionItemNumber?: string
  itemClassificationNumber?: string
  itemIdentificationNumber?: string
  inspectionExemption?: string
  midTermCompetitionItem?: string
  sortOrder?: number
  orderId: number
  orderItemId: string
}

// 신규 추가 품목 인터페이스
interface NewItem {
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  specification: string
  unit: string
  unitPrice: number
  shippingQuantity: number
  isNew: true
  remark?: string           // 비고 (병합 사유)
  quantity?: number         // 병합 시 발주수량
  shippedQuantity?: number  // 병합 시 기출하 (0)
  remainingQuantity?: number // 병합 시 잔여수량
  mergeSourceSkuIds?: string[] // 병합 출처 SKU ID 목록
}

// 신규 추가 품목 목록
const newItems = ref<NewItem[]>([])

// SKU 선택 팝업 표시 여부
const showSkuSelector = ref(false)

// 병합 모달 관련 상태
const showMergeModal = ref(false)
const pendingNewItem = ref<{
  skuId: string
  itemId: string
  itemName: string
  skuName: string
  specification: string
  unit: string
  unitPrice: number
} | null>(null)

// SKU 선택 팝업 열기
const openSkuSelector = () => {
  showSkuSelector.value = true
}

// SKU 선택 완료 핸들러
const handleSkuSelected = (item: Item, sku: ItemSku) => {
  const skuIdStr = String(sku.skuId)

  // 기존 발주 품목에 있는지 확인
  const existsInOrder = selectedOrderItems.value.some(i => i.skuId === skuIdStr)
  if (existsInOrder) {
    alert('이미 발주 목록에 있는 품목입니다.')
    return
  }

  // 신규 품목에 이미 추가되었는지 확인
  const existsInNew = newItems.value.some(i => i.skuId === skuIdStr)
  if (existsInNew) {
    alert('이미 추가된 품목입니다.')
    return
  }

  // 규격 문자열 생성
  const specParts: string[] = []
  if (item.itemNm) specParts.push(item.itemNm)
  if (sku.skuNm) specParts.push(sku.skuNm)
  if (sku.width) specParts.push(`${sku.width}mm`)
  if (sku.height) specParts.push(`${sku.height}mm`)
  if (sku.thickness) specParts.push(`${sku.thickness}T`)

  // 기존 품목이 있으면 병합 모달 표시
  if (selectedOrderItems.value.length > 0) {
    pendingNewItem.value = {
      skuId: skuIdStr,
      itemId: item.itemId,
      itemName: item.itemNm,
      skuName: sku.skuNm || `${sku.thickness}T`,
      specification: specParts.join(', '),
      unit: 'm2',
      unitPrice: sku.unitPrice || 0
    }
    showSkuSelector.value = false
    showMergeModal.value = true
  } else {
    // 기존 품목 없으면 바로 추가
    newItems.value.push({
      skuId: skuIdStr,
      itemId: item.itemId,
      itemName: item.itemNm,
      skuName: sku.skuNm || `${sku.thickness}T`,
      specification: specParts.join(', '),
      unit: 'm2',
      unitPrice: sku.unitPrice || 0,
      shippingQuantity: 0,
      isNew: true
    })
    showSkuSelector.value = false
  }
}

// 신규 품목 삭제
const removeNewItem = (skuId: string) => {
  const index = newItems.value.findIndex(item => item.skuId === skuId)
  if (index !== -1) {
    newItems.value.splice(index, 1)
  }
}

// 병합 결과 인터페이스
interface MergeResult {
  newItem: {
    skuId: string
    itemId: string
    itemName: string
    skuName: string
    specification: string
    unit: string
    unitPrice: number
    shippingQuantity: number
  }
  deductions: { skuId: string; skuName: string; amount: number }[]
}

// 병합 확인 핸들러
const handleMergeConfirm = (result: MergeResult) => {
  // 1. 신규 품목 추가 (발주수량 = 입력한 병합 수량)
  const deductionSkuIds = result.deductions.map(d => d.skuId)
  const deductionSkuNames = result.deductions.map(d => d.skuName).join(', ')
  const mergeQuantity = result.newItem.shippingQuantity  // 입력한 병합 수량
  newItems.value.push({
    ...result.newItem,
    isNew: true,
    quantity: mergeQuantity,         // 발주수량 = 병합 수량
    shippedQuantity: 0,              // 기출하 = 0
    remainingQuantity: mergeQuantity, // 잔여수량 = 병합 수량
    remark: `병합: ${deductionSkuNames}에서 이전`,
    mergeSourceSkuIds: deductionSkuIds // 병합 출처 SKU ID 목록
  })

  // 2. 기존 품목의 발주수량(quantity) 감소 + 출하수량 조정 (인덱스 기반 업데이트로 반응성 보장)
  result.deductions.forEach(deduction => {
    const index = selectedOrderItems.value.findIndex(i => i.skuId === deduction.skuId)
    if (index !== -1) {
      const item = selectedOrderItems.value[index]

      // 새 발주수량
      const newQuantity = item.quantity - deduction.amount
      // 새 잔여수량
      const newRemainingQuantity = item.remainingQuantity - deduction.amount
      // 출하수량 조정: 발주수량 - 기출하를 초과할 수 없음
      const maxShippingQuantity = newQuantity - item.shippedQuantity
      const newShippingQuantity = Math.min(item.shippingQuantity, Math.max(0, maxShippingQuantity))

      // 새 객체로 교체하여 반응성 트리거
      selectedOrderItems.value[index] = {
        ...item,
        // 발주수량 감소 (핵심!)
        quantity: newQuantity,
        // 잔여수량도 함께 감소
        remainingQuantity: newRemainingQuantity,
        // 출하수량 조정 (발주수량 초과 방지)
        shippingQuantity: newShippingQuantity,
        // 기출하는 건드리지 않음!
        remark: `병합: ${result.newItem.skuName}로 ${deduction.amount} 이전`
      }
    }
  })

  showMergeModal.value = false
  pendingNewItem.value = null
}

// 병합 없이 추가
const handleMergeSkip = () => {
  if (pendingNewItem.value) {
    newItems.value.push({
      ...pendingNewItem.value,
      shippingQuantity: 0,
      isNew: true
    })
  }
  showMergeModal.value = false
  pendingNewItem.value = null
}

// 병합 모달 닫기
const handleMergeClose = () => {
  showMergeModal.value = false
  pendingNewItem.value = null
}

// useRegisterForm 사용
const {
  formData,
  submitting,
  submit,
  goBack,
  reset
} = useRegisterForm<any, any, any>({
  createFunction: async (data) => {
    // 기존 품목 중 출하수량이 있거나 병합 비고가 있는 것 (수량 0도 포함)
    const existingItems = selectedOrderItems.value
      .filter(item => item.shippingQuantity > 0 || item.remark)
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
        orderItemId: item.orderItemId,
        isNew: false,
        remark: item.remark || null
      }))

    // 신규 품목 중 출하수량이 있는 것
    const newShippingItems = newItems.value
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
        isNew: true,
        remark: item.remark || null,
        // 병합 출처 SKU ID 목록 (병합된 품목인 경우에만)
        mergeSourceSkuIds: item.mergeSourceSkuIds || null
      }))

    const allItems = [...existingItems, ...newShippingItems]

    if (allItems.length === 0) {
      throw new Error('출하할 품목이 없습니다. 출하수량을 입력해주세요.')
    }

    // 출하 정보 저장
    const shipmentData = {
      orderId: existingItems.length > 0 ? existingItems[0].orderId : data.orderId,
      deliveryRequestNo: data.deliveryRequestNo,
      shipmentDate: data.shippingDate,
      status: data.status,
      // OEM 및 배송지 정보 (신규)
      oemCompanyId: data.oemCompanyId,
      siteManagerId: data.siteManagerId || null,
      zipcode: data.zipcode || null,
      deliveryAddress: data.deliveryAddress || null,
      addressDetail: data.addressDetail || null,
      receiverName: data.receiverName || null,
      receiverPhone: data.receiverPhone || null,
      items: allItems
    }

    return await shipmentService.createShipment(shipmentData)
  },
  successRoute: '/admin/shipping/list',
  defaultValues: {
    orderId: null as number | null,  // 품목 추가 버튼 표시 조건
    deliveryRequestNo: '',
    deliveryRequestDate: '',
    client: '',
    clientNo: '',
    projectName: '',
    clientManagerName: '',
    shippingDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    // OEM 및 배송지 정보 (신규)
    oemCompanyId: null as number | null,
    siteManagerId: null as number | null,
    zipcode: '',
    deliveryAddress: '',
    addressDetail: '',
    receiverName: '',
    receiverPhone: ''
  },
  onCreateSuccess: () => {
    alert('출하 정보가 저장되었습니다.')
  },
  onCreateError: (error: any) => {
    console.error('출하 정보 저장 실패:', error)
    if (error.message) {
      alert(error.message)
    } else {
      alert('출하 정보 저장에 실패했습니다.')
    }
  }
})

// useFormValidation 사용
const { errors, validateField, validateAll, rules } = useFormValidation({
  deliveryRequestNo: '',
  client: '',
  shippingDate: '',
  status: '',
  oemCompanyId: ''
})

// 선택된 발주의 품목 목록
const selectedOrderItems = ref<OrderItem[]>([])

// 발주번호 조회 팝업
const showOrderSelectPopup = ref(false)

const openOrderSelectPopup = () => {
  showOrderSelectPopup.value = true
}

const closeOrderSelectPopup = () => {
  showOrderSelectPopup.value = false
}

// 발주 선택 처리
const handleOrderSelect = async (order: OrderDetailResponse) => {
  console.log('선택된 발주 정보:', order)

  try {
    // 폼 데이터 업데이트
    formData.orderId = order.orderId  // 품목 추가 버튼 표시 조건
    formData.deliveryRequestNo = order.deliveryRequestNo
    formData.deliveryRequestDate = order.deliveryRequestDate || ''
    formData.client = order.client
    formData.clientNo = order.clientNo || ''
    formData.projectName = order.projectName || ''
    formData.clientManagerName = order.clientManagerName || ''

    // 발주번호 기준 출하 현황 조회
    const shipmentStatus = await shipmentService.getShipmentStatusByOrder(order.deliveryRequestNo)
    console.log('출하 현황:', shipmentStatus)

    // 품목 정보 매핑 및 필터링
    const orderItems = order.items
      .map(item => {
        const statusItem = shipmentStatus.items.find(si => si.skuId === item.skuId)

        // 백엔드에서 계산된 잔여수량 사용 (부동소수점 오차 없음)
        const remainingQuantity = statusItem?.remainingQuantity || 0
        const shippedQuantity = statusItem?.totalShippedQuantity || 0
        // 추가변경 반영: shipmentStatus의 orderQuantity 우선 사용 (delivery_done 테이블 기준)
        const orderQuantity = statusItem?.orderQuantity || item.quantity
        const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice

        return {
          itemId: item.itemId,
          itemName: item.productName || item.itemNm || item.itemName || '',
          skuId: item.skuId,
          skuName: item.skuNm || item.skuName || '',
          specification: item.specification,
          unit: item.unit || item.unitCd,
          quantity: orderQuantity,
          shippingQuantity: 0,
          remainingQuantity,
          shippedQuantity,
          unitPrice,
          amount: orderQuantity * unitPrice,
          deliveryLocation: item.deliveryLocation,
          deliveryDeadline: item.deliveryDeadline,
          deliveryTerms: item.deliveryTerms,
          optionItemNumber: item.optionItemNumber,
          itemClassificationNumber: item.itemClassificationNumber,
          itemIdentificationNumber: item.itemIdentificationNumber,
          inspectionExemption: item.inspectionExemption || 'N',
          midTermCompetitionItem: item.midTermCompetitionItem || 'N',
          sortOrder: item.sortOrder || 0,
          orderId: order.orderId,
          orderItemId: item.skuId
        }
      })
      .filter(item => item.remainingQuantity > 0)

    selectedOrderItems.value = orderItems

    if (selectedOrderItems.value.length === 0) {
      alert('출하 가능한 품목이 없습니다. 모든 수량이 이미 출하되었습니다.')
      closeOrderSelectPopup()
    }

    console.log('매핑된 품목 목록:', selectedOrderItems.value)
  } catch (error) {
    console.error('발주 정보 매핑 실패:', error)
    alert('발주 정보를 불러오는데 실패했습니다.')
  }
}

// 실시간 잔여수량 계산 (발주수량 - 기출하 - 현재 입력된 출하수량)
// 병합 시 quantity가 감소되므로 자동으로 잔여수량도 감소됨
const getCalculatedRemainingQuantity = (item: OrderItem): number => {
  const remaining = item.quantity - item.shippedQuantity - item.shippingQuantity
  // 부동소수점 연산 오차 방지
  return parseFloat(Math.max(0, remaining).toFixed(2))
}

// 전체수량 설정
const setMaxQuantity = (item: OrderItem) => {
  const index = selectedOrderItems.value.findIndex(i => i.skuId === item.skuId)
  if (index === -1) return

  // 기출하를 제외한 실제 잔여수량을 출하수량에 설정 (인덱스 기반 업데이트)
  selectedOrderItems.value[index] = {
    ...item,
    shippingQuantity: item.remainingQuantity
  }
}

// 출하수량 업데이트
const updateShippingQuantity = (item: OrderItem) => {
  const index = selectedOrderItems.value.findIndex(i => i.skuId === item.skuId)
  if (index === -1) return

  let newShippingQuantity = item.shippingQuantity

  if (newShippingQuantity > item.remainingQuantity) {
    alert('출하수량은 잔여수량을 초과할 수 없습니다.')
    newShippingQuantity = item.remainingQuantity
  } else if (newShippingQuantity < 0) {
    newShippingQuantity = 0
  }

  // 인덱스 기반 업데이트로 반응성 보장
  selectedOrderItems.value[index] = {
    ...item,
    shippingQuantity: newShippingQuantity
  }
}

// 총 출하수량 (기존 + 신규)
const totalShippingQuantity = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) => sum + (item.shippingQuantity || 0), 0)
  const newTotal = newItems.value.reduce((sum, item) => sum + (item.shippingQuantity || 0), 0)
  return existingTotal + newTotal
})

// 총 금액 (기존 + 신규)
const totalAmount = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
  const newTotal = newItems.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
  return existingTotal + newTotal
})

// 제출 처리
const handleSubmit = async () => {
  // 유효성 검사
  const validationRules = {
    deliveryRequestNo: [rules.required('납품요구번호')],
    shippingDate: [
      rules.required('출하일자')
      // TODO: 임시로 과거 날짜 입력 허용 - 나중에 제한 복구 필요
      // (value: string) => {
      //   const today = new Date().toISOString().slice(0, 10)
      //   if (value < today) {
      //     return '출하일자는 오늘 이전 날짜로 설정할 수 없습니다'
      //   }
      //   return null
      // }
    ],
    status: [rules.required('상태')],
    oemCompanyId: [rules.required('OEM 제조사')]
  }

  if (!validateAll(formData, validationRules)) {
    return
  }

  await submit()
}
</script>

<style scoped>
/*
 * Common styles managed by:
 * - admin-edit-register.css: content-section, two-column-layout, items-table, items-section-header, items-table-wrapper.with-header, items-table tfoot
 * - admin-forms.css: form-input-*, form-select-*, info-group, info-grid, info-grid :deep(.form-field), info-grid :deep(.form-label), info-grid :deep(.required-mark), search-group
 * - admin-common.css: text-right, empty-message
 */

/* Page-specific: Shipping register page wrapper */
.shipping-register {
  padding: 0;
}

/* 삭제됨 - 기본 왼쪽 정렬 사용 */

/* Page-specific: Total quantity display (blue highlight) */
.total-quantity-display {
  background: #eff6ff;
  color: #1e40af;
  font-weight: 600;
  border-color: #3b82f6;
}

/* Page-specific: Quantity column width */
.quantity-col {
  min-width: 120px;
}

/* Page-specific: Max quantity button */
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

.btn-max-quantity:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* 규격 셀 스타일 (말줄임표) */
.specification-cell {
  max-width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 전체 너비 섹션 (배송지 정보용) */
.full-width-section {
  margin-top: 1rem;
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
  .info-grid.grid-5 {
    grid-template-columns: 1fr 1fr;
  }

  .col-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .info-grid.grid-5 {
    grid-template-columns: 1fr;
  }
}

/* 신규 품목 행 스타일 */
.new-item-row {
  background: #f0fdf4 !important;
}

.new-item-row:hover {
  background: #dcfce7 !important;
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
</style>
