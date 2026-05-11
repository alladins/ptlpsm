<template>
  <div class="shipping-register">
    <PageHeader
      title="출하 등록"
      icon="shipping"
      icon-color="green"
      description="출하 정보를 등록하고 관리합니다."
    >
      <template #actions>
        <button class="btn-action btn-secondary" @click="goBack">
          <i class="fas fa-times" />
          취소
        </button>
        <button
          class="btn-action btn-primary"
          :disabled="submitting || !canWrite || isOemManager"
          :title="isOemManager ? 'OEM 제조사 담당자는 출하를 등록할 수 없습니다' : (!canWrite ? '등록 권한이 없습니다' : '')"
          @click="handleSubmit"
        >
          <i class="fas fa-save" />
          {{ submitting ? '저장 중...' : '저장' }}
        </button>
      </template>
    </PageHeader>
    <div class="content-section">
      <form class="register-form" @submit.prevent="handleSubmit">
        <FormSection title="출하 정보">
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
                <div class="info-grid grid-3">
                  <FormField label="납품요구번호(발주번호)" required :error="errors.deliveryRequestNo">
                    <div class="search-group">
                      <input
                        v-model="formData.deliveryRequestNo"
                        type="text"
                        class="form-input-sm"
                        placeholder="납품요구번호를 선택하세요"
                        readonly
                      >
                      <button type="button" class="btn-search" @click="openOrderSelectPopup">
                        <i class="fas fa-search" />
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
                  <i class="fas fa-truck" />
                  <span>출하 정보</span>
                </div>
                <div class="info-grid grid-4">
                  <FormField label="출하일자" required :error="errors.shippingDate">
                    <input
                      v-model="formData.shippingDate"
                      type="date"
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

                  <FormField label="배송비">
                    <input
                      v-model.number="formData.shippingCost"
                      type="number"
                      class="form-input-sm text-right"
                      placeholder="0"
                      min="0"
                      step="1000"
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
                  <i class="fas fa-building" />
                  <span>수요기관 정보</span>
                </div>
                <div class="info-grid grid-3">
                  <FormField label="수요기관명" required :error="errors.client">
                    <input
                      v-model="formData.client"
                      type="text"
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

              <!-- 4. OEM 제조사 / 건설사(시공사) -->
              <div class="info-group">
                <div class="info-group-header">
                  <i class="fas fa-industry" />
                  <span>OEM 제조사 / 건설사(시공사)</span>
                </div>
                <div class="info-grid grid-2">
                  <FormField label="공급원" required :error="errors.oemCompanyId">
                    <select
                      v-model="formData.oemCompanyId"
                      class="form-select"
                      :disabled="loadingOemCompanies"
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
                <div class="info-grid grid-1" style="margin-top: 0.5rem;">
                  <FormField label="현장담당자">
                    <select
                      v-model="formData.siteManagerId"
                      class="form-select"
                      :disabled="loadingSiteManagers"
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
                </div>
              </div>
            </div>
          </div>

          <!-- 배송지 정보는 발주서 생성 시 입력 (출하 수정 페이지에서) -->
        </FormSection>

        <FormSection style="margin-top: -20px">
          <div class="items-section-wrapper">
            <div class="items-section-header">
              <div class="header-left">
                <i class="fas fa-box" />
                <span>품목 정보</span>
              </div>
              <button
                v-if="formData.orderId"
                type="button"
                class="btn-add-item"
                @click="openSkuSelector"
              >
                <i class="fas fa-plus" />
                품목 추가
              </button>
            </div>
            <div class="items-table-wrapper">
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 20px">
                      NO
                    </th>
                    <th style="width: 80px">
                      품목명
                    </th>
                    <th style="width: 60px">
                      SKU ID
                    </th>
                    <th style="width: 100px">
                      SKU 품명
                    </th>
                    <th style="width: 350px">
                      규격
                    </th>
                    <th style="width: 20px">
                      단위
                    </th>
                    <th style="width: 70px">
                      발주수량
                    </th>
                    <th style="width: 70px">
                      추가수량
                    </th>
                    <th style="width: 60px">
                      기출하
                    </th>
                    <th style="width: 60px">
                      잔여수량
                    </th>
                    <th style="width: 80px" class="quantity-col">
                      출하수량
                    </th>
                    <th style="width: 70px">
                      단가
                    </th>
                    <th style="width: 80px">
                      금액
                    </th>
                    <th style="width: 120px">
                      비고
                    </th>
                    <th style="width: 50px">
                      삭제
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="selectedOrderItems.length === 0 && newItems.length === 0">
                    <td colspan="15" class="empty-message">
                      납품요구번호를 선택하면 품목이 표시됩니다.
                    </td>
                  </tr>
                  <!-- 기존 발주 품목 -->
                  <tr v-for="(item, index) in selectedOrderItems" :key="item.skuId" :style="getMergeGroupStyle(item.skuId)">
                    <td class="text-center">
                      {{ index + 1 }}
                    </td>
                    <td>{{ item.itemName }}</td>
                    <td>{{ item.skuId }}</td>
                    <td>{{ item.skuName }}</td>
                    <td class="specification-cell" :title="item.specification">
                      {{ item.specification }}
                    </td>
                    <td>{{ item.unit }}</td>
                    <td class="text-right">
                      {{ formatQuantity(item.quantity) }}
                    </td>
                    <td class="text-right">
                      <span v-if="item.additionalQuantity > 0" class="additional-qty">
                        +{{ formatQuantity(item.additionalQuantity) }}
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td class="text-right">
                      {{ formatQuantity(item.shippedQuantity) }}
                    </td>
                    <td class="text-right">
                      {{ formatQuantity(getCalculatedRemainingQuantity(item)) }}
                      <button
                        type="button"
                        class="btn-max-quantity"
                        :title="'전체수량 입력 (' + formatQuantity(getCalculatedRemainingQuantity(item)) + ')'"
                        :disabled="getCalculatedRemainingQuantity(item) <= 0"
                        @click="setMaxQuantity(item)"
                      >
                        ▶
                      </button>
                    </td>
                    <td class="text-right quantity-col">
                      <input
                        v-model.number="item.shippingQuantity"
                        type="number"
                        :min="0"
                        :max="item.remainingQuantity"
                        step="2"
                        class="table-input text-right input-w75"
                        @change="updateShippingQuantity(item)"
                      >
                    </td>
                    <td class="text-right">
                      {{ formatNumber(item.unitPrice) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(item.shippingQuantity * item.unitPrice) }}
                    </td>
                    <td class="remark-cell">
                      <template v-if="getMergeBadges(item.skuId).length > 0">
                        <span
                          v-for="(badge, idx) in getMergeBadges(item.skuId)"
                          :key="idx"
                          class="merge-badge"
                          :style="{ backgroundColor: badge.color }"
                        >{{ badge.label }}</span>
                      </template>
                      <template v-else>
                        {{ item.shippingQuantity > 0 ? `${formatQuantity(Math.round(item.shippingQuantity / 2))} 매` : '-' }}
                      </template>
                    </td>
                    <td class="text-center">
                      <!-- 발주 품목은 삭제 불가 (추가수량이 있는 경우만 추가수량 취소 가능) -->
                      <span class="text-muted" title="발주 품목은 삭제할 수 없습니다">-</span>
                    </td>
                  </tr>
                  <!-- 신규 추가 품목 -->
                  <tr v-for="(item, idx) in newItems" :key="'new-' + item.skuId" class="new-item-row" :style="getMergeGroupStyle(item.skuId)">
                    <td class="text-center">
                      {{ selectedOrderItems.length + idx + 1 }}
                    </td>
                    <td>{{ item.itemName }}</td>
                    <td class="text-center">
                      {{ item.skuId }}
                    </td>
                    <td>{{ item.skuName }}</td>
                    <td class="specification-cell" :title="item.specification">
                      {{ item.specification }}
                    </td>
                    <td class="text-center">
                      {{ item.unit }}
                    </td>
                    <!-- 발주수량 -->
                    <td class="text-right">
                      {{ item.quantity ? formatQuantity(item.quantity) : '-' }}
                    </td>
                    <!-- 추가수량 -->
                    <td class="text-right">
                      <span v-if="item.additionalQuantity > 0" class="additional-qty">
                        +{{ formatQuantity(item.additionalQuantity) }}
                      </span>
                      <span v-else>-</span>
                    </td>
                    <!-- 기출하 -->
                    <td class="text-right">
                      {{ item.shippedQuantity !== undefined ? formatQuantity(item.shippedQuantity) : '-' }}
                    </td>
                    <!-- 잔여수량 -->
                    <td class="text-right">
                      {{ item.remainingQuantity ? formatQuantity(item.remainingQuantity - item.shippingQuantity) : '-' }}
                      <button
                        v-if="item.remainingQuantity && (item.remainingQuantity - item.shippingQuantity) > 0"
                        type="button"
                        class="btn-max-quantity"
                        :title="'전체수량 입력 (' + formatQuantity(item.remainingQuantity) + ')'"
                        @click="item.shippingQuantity = item.remainingQuantity"
                      >
                        ▶
                      </button>
                    </td>
                    <!-- 출하수량 -->
                    <td class="text-right quantity-col">
                      <input
                        v-model.number="item.shippingQuantity"
                        type="number"
                        :min="0"
                        :max="item.remainingQuantity"
                        step="2"
                        class="table-input text-right input-w75"
                      >
                    </td>
                    <td class="text-right">
                      {{ formatNumber(item.unitPrice) }}
                    </td>
                    <td class="text-right">
                      {{ formatCurrency(item.shippingQuantity * item.unitPrice) }}
                    </td>
                    <td class="remark-cell">
                      <span class="badge-new">신규</span>
                      <template v-if="getMergeBadges(item.skuId).length > 0">
                        <span
                          v-for="(badge, bidx) in getMergeBadges(item.skuId)"
                          :key="bidx"
                          class="merge-badge"
                          :style="{ backgroundColor: badge.color }"
                        >{{ badge.label }}</span>
                      </template>
                      <template v-else-if="item.shippingQuantity > 0">
                        {{ `${formatQuantity(Math.round(item.shippingQuantity / 2))} 매` }}
                      </template>
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-remove"
                        title="삭제"
                        @click="removeNewItem(item.skuId)"
                      >
                        <i class="fas fa-trash-alt" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="selectedOrderItems.length > 0 || newItems.length > 0">
                  <tr>
                    <td colspan="6" class="text-right">
                      <strong>합계</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalOrderQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong v-if="totalAdditionalQuantity > 0" class="text-additional">+{{ formatQuantity(totalAdditionalQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalShippedQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalRemainingQuantity) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong>{{ formatQuantity(totalShippingQuantity) }}</strong>
                    </td>
                    <td class="text-right" />
                    <td class="text-right">
                      <strong>{{ formatCurrency(totalAmount) }}</strong>
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

    <!-- 발주번호 조회 팝업 -->
    <OrderSelectPopup
      v-if="showOrderSelectPopup"
      :show="showOrderSelectPopup"
      :shippable-only="false"
      @close="closeOrderSelectPopup"
      @select="handleOrderSelect"
    />

    <!-- SKU 선택 팝업 -->
    <ItemSkuSelector
      v-model="showSkuSelector"
      @sku-selected="handleSkuSelected"
    />

    <!-- 품목 합지 모달 -->
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
import { ref, computed } from 'vue'
import { useRouter } from '#imports'
import OrderSelectPopup from '~/components/admin/common/OrderSelectPopup.vue'
import ItemSkuSelector from '~/components/admin/ItemSkuSelector.vue'
import ItemMergeSelectModal from '~/components/shipment/ItemMergeSelectModal.vue'
import type { OrderDetailResponse } from '~/types/order'
import type { Item, ItemSku } from '~/services/item.service'
import { shipmentService } from '~/services/shipment.service'
import { formatNumber, formatCurrency, formatQuantity, getLocalDateString } from '~/utils/format'
import { useRegisterForm } from '~/composables/admin/useRegisterForm'
import { useFormValidation } from '~/composables/admin/useFormValidation'
import { usePermission } from '~/composables/usePermission'
import { useShippingFormData } from '~/composables/admin/useShippingFormData'
import FormField from '~/components/admin/forms/FormField.vue'
import FormSection from '~/components/admin/forms/FormSection.vue'

definePageMeta({
  layout: 'admin',
  pageTitle: '출하 등록'
})

const router = useRouter()

// 권한
const { canWrite, isOemManager } = usePermission()

// OEM 제조사 + 현장담당자 공통 데이터 (composable)
const {
  oemCompanies, loadingOemCompanies,
  siteManagers, loadingSiteManagers,
  setupBuilderAutoSet
} = useShippingFormData()

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
  shippedQuantity: number // 기출하 수량
  remainingQuantity: number
  unitPrice: number
  amount: number
  deliveryLocation?: string
  deliveryDeadline?: string
  deliveryTerms?: string
  remark?: string // 비고 (병합 사유)
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
  remark?: string // 비고 (병합 사유)
  quantity?: number // 병합 시 발주수량
  shippedQuantity?: number // 병합 시 기출하 (0)
  remainingQuantity?: number // 병합 시 잔여수량
  mergeSourceSkuIds?: string[] // 병합 출처 SKU ID 목록
}

// 합지 그룹 추적
interface MergeGroupInfo {
  id: string // 고유 ID
  targetSkuId: string // 합지 결과 품목 SKU ID
  targetSkuName: string // 합지 결과 SKU 품명
  sources: { skuId: string; skuName: string; amount: number }[]
  colorIndex: number // 색상 인덱스 (0~4)
}

const MERGE_GROUP_COLORS = [
  { border: '#3b82f6', bg: '#eff6ff' }, // 파랑
  { border: '#10b981', bg: '#ecfdf5' }, // 초록
  { border: '#f59e0b', bg: '#fffbeb' }, // 주황
  { border: '#8b5cf6', bg: '#f5f3ff' }, // 보라
  { border: '#ec4899', bg: '#fdf2f8' } // 분홍
]

// 신규 추가 품목 목록
const newItems = ref<NewItem[]>([])
const mergeGroups = ref<MergeGroupInfo[]>([])

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

  // 기존 발주 품목에 동일 SKU가 있으면 → 추가수량으로 처리 (병합이 아님)
  const existingOrderIdx = selectedOrderItems.value.findIndex(i => i.skuId === skuIdStr)
  if (existingOrderIdx !== -1) {
    const additionalQty = prompt('추가할 수량을 입력하세요.\n\n※ 추가된 수량은 해당 출하에서 전량 출하됩니다.')
    if (additionalQty === null) { return } // 취소
    const qty = parseFloat(additionalQty)
    if (isNaN(qty) || qty <= 0) {
      alert('올바른 수량을 입력하세요.')
      return
    }
    const existingItem = selectedOrderItems.value[existingOrderIdx]
    selectedOrderItems.value[existingOrderIdx] = {
      ...existingItem,
      additionalQuantity: (existingItem.additionalQuantity || 0) + qty,
      shippingQuantity: (existingItem.shippingQuantity || 0) + qty, // 추가 = 전량 출하 자동 세팅
      remainingQuantity: (existingItem.remainingQuantity || 0) // 잔여수량은 변경 없음 (출하수량이 동시에 증가했으므로)
    }
    showSkuSelector.value = false
    return
  }

  // 신규 품목에 이미 추가되었는지 확인
  const existsInNew = newItems.value.some(i => i.skuId === skuIdStr)
  if (existsInNew) {
    alert('이미 추가된 품목입니다.')
    return
  }

  // 품목명 추출: "폴리우레탄기포단열재,경질2종2호" → "기포단열재"
  // item_nm에서 쉼표 앞부분의 마지막 부분(폴리우레탄 제거)을 간단한 품목명으로 사용
  let simpleItemName = '기포단열재' // 기본값
  if (item.itemNm) {
    const parts = item.itemNm.split(',')
    if (parts.length > 0) {
      // "폴리우레탄기포단열재" → "기포단열재"
      simpleItemName = parts[0].replace('폴리우레탄', '')
    }
  }

  // 규격 문자열 생성 (형식: "폴리우레탄기포단열재,HYDRO-22-130T,1000×1000×130mm,경질2종2호")
  const specParts: string[] = []
  // 1. 품목유형 (item_nm의 첫 부분)
  if (item.itemNm) {
    const itemParts = item.itemNm.split(',')
    if (itemParts.length > 0) { specParts.push(itemParts[0]) }
  }
  // 2. SKU 이름
  if (sku.skuNm) { specParts.push(sku.skuNm) }
  // 3. 크기 (width×height×thickness mm) - 소수점 제거
  if (sku.width && sku.height && sku.thickness) {
    const w = Math.round(Number(sku.width))
    const h = Math.round(Number(sku.height))
    const t = Math.round(Number(sku.thickness))
    specParts.push(`${w}×${h}×${t}mm`)
  }
  // 4. 품목유형의 나머지 부분 (경질2종2호 등)
  if (item.itemNm) {
    const itemParts = item.itemNm.split(',')
    if (itemParts.length > 1) { specParts.push(itemParts.slice(1).join(',')) }
  }

  // 기존 품목이 있으면 병합 모달 표시
  if (selectedOrderItems.value.length > 0) {
    pendingNewItem.value = {
      skuId: skuIdStr,
      itemId: item.itemId,
      itemName: simpleItemName,
      skuName: sku.skuNm || `${sku.thickness}T`,
      specification: specParts.join(','),
      unit: 'm2',
      unitPrice: sku.unitPrice || 0
    }
    showSkuSelector.value = false
    showMergeModal.value = true
  } else {
    // 기존 품목 없으면 바로 추가 (병합 모달로 가지 않는 경우)
    newItems.value.push({
      skuId: skuIdStr,
      itemId: item.itemId,
      itemName: simpleItemName,
      skuName: sku.skuNm || `${sku.thickness}T`,
      specification: specParts.join(','),
      unit: 'm2',
      unitPrice: sku.unitPrice || 0,
      shippingQuantity: 0,
      remainingQuantity: 0,
      isNew: true
    })
    showSkuSelector.value = false
  }
}

// 기존 발주 품목 삭제 (합지 관계 체크)
const removeOrderItem = (skuId: string) => {
  const index = selectedOrderItems.value.findIndex(i => i.skuId === skuId)
  if (index === -1) { return }

  // 합지 그룹에 속해 있는지 확인
  const relatedGroups = mergeGroups.value.filter(g =>
    g.sources.some(s => s.skuId === skuId)
  )

  if (relatedGroups.length > 0) {
    const groupNames = relatedGroups.map(g => g.targetSkuName).join(', ')
    if (!confirm(`이 품목은 합지 그룹에 속해 있습니다 (→ ${groupNames}).\n삭제하면 관련 합지도 해제됩니다. 계속하시겠습니까?`)) {
      return
    }

    // 관련 합지 그룹의 타겟 품목(신규) 삭제 + 다른 소스 품목 수량 복구
    relatedGroups.forEach((group) => {
      // 타겟 신규 품목 삭제
      const targetIdx = newItems.value.findIndex(ni => ni.skuId === group.targetSkuId)
      if (targetIdx !== -1) {
        const targetItem = newItems.value[targetIdx]
        const mergeAmount = targetItem.quantity || 0

        // 다른 소스 품목들의 수량 복구 (삭제 대상 제외)
        group.sources.forEach((source) => {
          if (source.skuId === skuId) { return } // 삭제 대상은 스킵
          const srcIdx = selectedOrderItems.value.findIndex(i => i.skuId === source.skuId)
          if (srcIdx !== -1) {
            const srcItem = selectedOrderItems.value[srcIdx]
            selectedOrderItems.value[srcIdx] = {
              ...srcItem,
              quantity: srcItem.quantity + source.amount,
              remainingQuantity: srcItem.remainingQuantity + source.amount,
              remark: undefined
            }
          }
        })

        newItems.value.splice(targetIdx, 1)
      }

      // 합지 그룹 제거
      const gIdx = mergeGroups.value.findIndex(g => g.id === group.id)
      if (gIdx !== -1) { mergeGroups.value.splice(gIdx, 1) }
    })
  }

  selectedOrderItems.value.splice(index, 1)
}

// 신규 품목 삭제 (합지 품목이면 원본 수량 복구)
const removeNewItem = (skuId: string) => {
  const index = newItems.value.findIndex(item => item.skuId === skuId)
  if (index === -1) { return }

  const item = newItems.value[index]

  // 합지 품목인 경우 수량 복구
  if (item.mergeSourceSkuIds && item.mergeSourceSkuIds.length > 0) {
    if (!confirm('이 품목은 합지 품목입니다. 삭제하면 원본 품목의 수량이 복구됩니다. 계속하시겠습니까?')) {
      return
    }

    // 합지 그룹에서 차감량 정보 조회
    const group = mergeGroups.value.find(g => g.targetSkuId === skuId)

    // 원본 품목 수량 복구
    item.mergeSourceSkuIds.forEach((sourceSkuId) => {
      const srcIdx = selectedOrderItems.value.findIndex(i => i.skuId === sourceSkuId)
      if (srcIdx !== -1) {
        const srcItem = selectedOrderItems.value[srcIdx]
        // 그룹에서 차감량 조회, 없으면 합지 품목의 quantity 사용
        const deductionAmount = group
          ? (group.sources.find(s => s.skuId === sourceSkuId)?.amount || 0)
          : (item.quantity || 0)

        selectedOrderItems.value[srcIdx] = {
          ...srcItem,
          quantity: srcItem.quantity + deductionAmount,
          remainingQuantity: srcItem.remainingQuantity + deductionAmount,
          remark: undefined // 병합 비고 제거
        }
      }
    })

    // 합지 그룹 제거
    if (group) {
      const gIdx = mergeGroups.value.findIndex(g => g.id === group.id)
      if (gIdx !== -1) { mergeGroups.value.splice(gIdx, 1) }
    }
  }

  newItems.value.splice(index, 1)
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
  const mergeQuantity = result.newItem.shippingQuantity // 병합 수량
  newItems.value.push({
    ...result.newItem,
    isNew: true,
    quantity: 0,
    shippingQuantity: mergeQuantity, // 병합 = 전량 출하 자동 세팅
    shippedQuantity: 0,
    remainingQuantity: 0, // 전량 출하이므로 잔여 = 0
    remark: `합지: ${deductionSkuNames}에서 이전`,
    mergeSourceSkuIds: deductionSkuIds
  })

  // 2. 기존 품목의 발주수량(quantity) 감소 + 출하수량 조정 (인덱스 기반 업데이트로 반응성 보장)
  result.deductions.forEach((deduction) => {
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
        remark: `합지: ${result.newItem.skuName}로 ${deduction.amount} 이전`
      }
    }
  })

  // 3. 합지 그룹 등록
  mergeGroups.value.push({
    id: String(Date.now()),
    targetSkuId: result.newItem.skuId,
    targetSkuName: result.newItem.skuName,
    sources: result.deductions.map(d => ({
      skuId: d.skuId, skuName: d.skuName, amount: d.amount
    })),
    colorIndex: mergeGroups.value.length % MERGE_GROUP_COLORS.length
  })

  showMergeModal.value = false
  pendingNewItem.value = null
}

// 병합 없이 추가 (추가수량은 저장 시 delivery_done_items에 반영)
const handleMergeSkip = (quantity?: number) => {
  if (pendingNewItem.value) {
    const additionalQty = quantity || 0
    newItems.value.push({
      ...pendingNewItem.value,
      shippingQuantity: additionalQty, // 추가 = 전량 출하 자동 세팅
      additionalQuantity: additionalQty,
      remainingQuantity: 0, // 전량 출하이므로 잔여 = 0
      isNew: true,
      remark: quantity ? `품목 추가: +${quantity}` : null
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

// 합지 그룹 헬퍼: SKU가 속한 합지 그룹들 조회
const getMergeGroupsForSku = (skuId: string): MergeGroupInfo[] => {
  return mergeGroups.value.filter(g =>
    g.targetSkuId === skuId || g.sources.some(s => s.skuId === skuId)
  )
}

// 합지 그룹 스타일 (왼쪽 컬러 바 + 배경색)
const getMergeGroupStyle = (skuId: string) => {
  const groups = getMergeGroupsForSku(skuId)
  if (groups.length === 0) { return {} }
  const color = MERGE_GROUP_COLORS[groups[0].colorIndex]
  return { borderLeft: `4px solid ${color.border}`, backgroundColor: color.bg }
}

// 합지 배지 정보 (비고 컬럼용)
const getMergeBadges = (skuId: string): { label: string; color: string }[] => {
  const groups = getMergeGroupsForSku(skuId)
  if (groups.length === 0) { return [] }

  const badges: { label: string; color: string }[] = []
  groups.forEach((g) => {
    const color = MERGE_GROUP_COLORS[g.colorIndex].border
    if (g.targetSkuId === skuId) {
      // 타겟 품목: 소스들 표시
      const sourceNames = g.sources.map(s => s.skuName).join(', ')
      badges.push({ label: `← ${sourceNames}`, color })
    } else {
      // 소스 품목: 타겟 표시
      badges.push({ label: `→ ${g.targetSkuName}`, color })
    }
  })
  return badges
}

// useRegisterForm 사용
const {
  formData,
  submitting,
  submit,
  goBack
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
        additionalQuantity: item.additionalQuantity || 0,
        unitPrice: item.unitPrice,
        amount: item.shippingQuantity * item.unitPrice,
        orderId: item.orderId,
        orderItemId: item.orderItemId,
        isNew: false,
        itemMemo: item.remark || null
      }))

    // 신규 품목 중 수량이 있는 것 (출하수량 또는 추가수량)
    const newShippingItems = newItems.value
      .filter(item => (item.shippingQuantity || 0) > 0)
      .map(item => ({
        skuId: item.skuId,
        itemId: item.itemId,
        skuName: item.skuName,
        specification: item.specification,
        unit: item.unit,
        shipmentQuantity: item.shippingQuantity,
        additionalQuantity: item.additionalQuantity || 0,
        unitPrice: item.unitPrice,
        amount: item.shippingQuantity * item.unitPrice,
        isNew: true,
        itemMemo: item.remark || null,
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
      builderCompanyId: data.builderCompanyId || null,
      builderCompanyName: data.builderCompanyName || null,
      siteManagerId: data.siteManagerId || null,
      zipcode: data.zipcode || null,
      deliveryAddress: data.deliveryAddress || null,
      addressDetail: data.addressDetail || null,
      receiverName: data.receiverName || null,
      receiverPhone: data.receiverPhone || null,
      shippingCost: data.shippingCost || 0, // 배송비
      items: allItems
    }

    return await shipmentService.createShipment(shipmentData)
  },
  successRoute: '/admin/shipping/list',
  defaultValues: {
    orderId: null as number | null, // 품목 추가 버튼 표시 조건
    deliveryRequestNo: '',
    deliveryRequestDate: '',
    client: '',
    clientNo: '',
    projectName: '',
    clientManagerName: '',
    shippingDate: getLocalDateString(),
    status: 'PENDING',
    // OEM 및 배송지 정보 (신규)
    oemCompanyId: null as number | null,
    builderCompanyId: null as number | null,
    builderCompanyName: '' as string,
    siteManagerId: null as number | null,
    zipcode: '',
    deliveryAddress: '',
    addressDetail: '',
    receiverName: '',
    receiverPhone: '',
    shippingCost: 0 // 배송비
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
const { errors, validateAll, rules } = useFormValidation({
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
    formData.orderId = order.orderId // 품목 추가 버튼 표시 조건
    formData.deliveryRequestNo = order.deliveryRequestNo
    formData.deliveryRequestDate = order.deliveryRequestDate || ''
    formData.client = order.client
    formData.clientNo = order.clientNo || ''
    formData.projectName = order.projectName || ''
    formData.clientManagerName = order.clientManagerName || ''

    // 발주번호 기준 출하 현황 조회
    const shipmentStatus = await shipmentService.getShipmentStatusByOrder(order.deliveryRequestNo)
    console.log('출하 현황:', shipmentStatus)

    // 품목 정보 매핑: delivery_done_items (shipmentStatus) 기준 단일 소스
    // 발주 생성 시 delivery_done이 자동 생성되므로 항상 존재함
    selectedOrderItems.value = (shipmentStatus.items || []).map((si) => {
      const unitPrice = typeof si.unitPrice === 'string' ? parseFloat(si.unitPrice) : (si.unitPrice || 0)
      const orderQuantity = si.orderQuantity || 0

      return {
        itemId: si.itemId || '',
        itemName: si.itemName || '',
        skuId: si.skuId,
        skuName: si.skuName || '',
        specification: si.specification || '',
        unit: si.unit || si.unitCd || 'm2',
        quantity: orderQuantity,
        shippingQuantity: 0,
        additionalQuantity: si.totalAdditionalQuantity || 0,
        remainingQuantity: si.remainingQuantity || 0,
        shippedQuantity: si.totalShippedQuantity || 0,
        unitPrice,
        amount: orderQuantity * unitPrice,
        orderId: order.orderId,
        orderItemId: si.skuId
      }
    })

    console.log('매핑된 품목 목록:', selectedOrderItems.value)
  } catch (error) {
    console.error('발주 정보 매핑 실패:', error)
    alert('발주 정보를 불러오는데 실패했습니다.')
  }
}

// 실시간 잔여수량 계산 ((발주수량 + 추가수량) - 기출하 - 현재 입력된 출하수량)
// 병합 시 quantity가 감소되므로 자동으로 잔여수량도 감소됨
const getCalculatedRemainingQuantity = (item: OrderItem): number => {
  const remaining = (item.quantity + (item.additionalQuantity || 0)) - item.shippedQuantity - item.shippingQuantity
  // 부동소수점 연산 오차 방지
  return parseFloat(Math.max(0, remaining).toFixed(2))
}

// 전체수량 설정
const setMaxQuantity = (item: OrderItem) => {
  const index = selectedOrderItems.value.findIndex(i => i.skuId === item.skuId)
  if (index === -1) { return }

  // 기출하를 제외한 실제 잔여수량을 출하수량에 설정 (인덱스 기반 업데이트)
  selectedOrderItems.value[index] = {
    ...item,
    shippingQuantity: item.remainingQuantity
  }
}

// 출하수량 업데이트
const updateShippingQuantity = (item: OrderItem) => {
  const index = selectedOrderItems.value.findIndex(i => i.skuId === item.skuId)
  if (index === -1) { return }

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

// 총 발주수량
const totalOrderQuantity = computed(() => {
  return selectedOrderItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

// 총 추가수량
const totalAdditionalQuantity = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) => sum + (item.additionalQuantity || 0), 0)
  const newTotal = newItems.value.reduce((sum, item) => sum + (item.additionalQuantity || 0), 0)
  return existingTotal + newTotal
})

// 총 기출하수량
const totalShippedQuantity = computed(() => {
  return selectedOrderItems.value.reduce((sum, item) => sum + (item.shippedQuantity || 0), 0)
})

// 총 잔여수량
const totalRemainingQuantity = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) =>
    sum + getCalculatedRemainingQuantity(item), 0)
  const newTotal = newItems.value.reduce((sum, item) =>
    sum + (item.remainingQuantity || 0), 0)
  return existingTotal + newTotal
})

// 총 출하수량 (순수 출하수량만)
const totalShippingQuantity = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) =>
    sum + (item.shippingQuantity || 0), 0)
  const newTotal = newItems.value.reduce((sum, item) =>
    sum + (item.shippingQuantity || 0), 0)
  return existingTotal + newTotal
})

// 총 금액 (기존 + 신규)
const totalAmount = computed(() => {
  const existingTotal = selectedOrderItems.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
  const newTotal = newItems.value.reduce((sum, item) => sum + ((item.shippingQuantity || 0) * item.unitPrice), 0)
  return existingTotal + newTotal
})

// 현장담당자 선택 시 건설사 자동 설정 (composable)
setupBuilderAutoSet(formData)

// 제출 처리
const handleSubmit = async () => {
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
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-forms.css';

/*
 * Common styles managed by:
 * - admin-common.css: text-right, empty-message, modal-overlay, status-badge
 * - admin-buttons.css: btn-action, btn-primary, btn-secondary, btn-add-item
 * - admin-forms.css: form-input-*, form-select, info-group, info-grid, search-group
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

/* 추가수량 표시 */
.additional-qty {
  color: #059669;
  font-weight: 600;
  font-size: 0.875rem;
}

/* 추가수량 입력 필드 */
.additional-input {
  border-color: #10b981 !important;
  color: #059669;
  font-weight: 600;
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

/* 비고 셀 (말줄임 방지, 배지 줄바꿈 허용) */
.remark-cell {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
