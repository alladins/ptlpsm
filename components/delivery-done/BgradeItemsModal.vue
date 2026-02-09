<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay">
      <div class="modal" @click.stop>
        <!-- 헤더 -->
        <div class="modal-header">
          <h3>
            <i class="fas fa-tags"></i>
            B급 제품 가격 조정
          </h3>
          <button class="modal-close" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 로딩 상태 -->
          <div v-if="loading" class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
            <span>데이터를 불러오는 중...</span>
          </div>

          <!-- 완료된 출하가 없을 때 -->
          <div v-else-if="completedShipments.length === 0" class="warning-container">
            <div class="warning-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="warning-content">
              <h4>완료된 출하가 없습니다</h4>
              <p>B급 제품 가격 조정을 위해서는 <strong>인수증 서명이 완료된 출하</strong>가 필요합니다.</p>
            </div>
          </div>

          <template v-else>
            <!-- STEP 1: 출하 선택 -->
            <div class="step-section">
              <div class="step-header">
                <span class="step-badge">1</span>
                <span class="step-title">출하 선택</span>
                <span class="step-hint">완료된 출하만 표시됩니다</span>
              </div>
              <div class="shipment-list">
                <label
                  v-for="shipment in completedShipments"
                  :key="shipment.shipmentId"
                  class="shipment-item"
                  :class="{ selected: selectedShipmentId === shipment.shipmentId }"
                >
                  <input
                    type="radio"
                    v-model="selectedShipmentId"
                    :value="shipment.shipmentId"
                    name="shipment"
                  />
                  <div class="shipment-radio"></div>
                  <div class="shipment-info">
                    <span class="shipment-no">{{ shipment.shipmentNo || `#${shipment.shipmentId}` }}</span>
                    <span class="shipment-date">{{ formatDate(shipment.shipmentDate) }}</span>
                  </div>
                </label>
              </div>
            </div>

            <!-- STEP 2: 품목 선택 & B급 입력 -->
            <div v-if="selectedShipmentId" class="step-section">
              <div class="step-header">
                <span class="step-badge">2</span>
                <span class="step-title">품목 선택 & B급 정보 입력</span>
              </div>

              <!-- 품목 로딩 중 -->
              <div v-if="loadingItems" class="loading-items">
                <i class="fas fa-spinner fa-spin"></i>
                <span>품목을 불러오는 중...</span>
              </div>

              <!-- 품목 없음 -->
              <div v-else-if="shipmentItems.length === 0" class="empty-items">
                <i class="fas fa-box-open"></i>
                <span>해당 출하에 품목이 없습니다.</span>
              </div>

              <!-- 품목 아코디언 -->
              <div v-else class="item-accordion">
                <div
                  v-for="item in shipmentItems"
                  :key="item.skuId"
                  class="accordion-item"
                  :class="{ expanded: expandedSkuId === item.skuId }"
                >
                  <!-- 품목 헤더 -->
                  <div
                    class="accordion-header"
                    :class="{ 'no-cost': !item.costPrice || item.shipmentQuantity <= 0 }"
                    @click="(item.costPrice && item.shipmentQuantity > 0) ? toggleAccordion(item) : null"
                  >
                    <i class="fas" :class="expandedSkuId === item.skuId ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
                    <span class="item-name">{{ item.skuName }}</span>
                    <span class="item-spec">{{ item.specification }}</span>
                    <span class="item-qty" :class="{ 'qty-zero': item.shipmentQuantity <= 0 }">{{ item.shipmentQuantity }}{{ item.unit }}</span>
                    <span v-if="item.costPrice" class="item-price" title="OEM 원가">@{{ formatCurrency(item.costPrice) }}</span>
                    <span v-else class="item-price cost-warning" title="OEM 원가 미설정">원가 미설정</span>
                  </div>

                  <!-- 품목 입력 폼 -->
                  <div v-if="expandedSkuId === item.skuId" class="accordion-body">
                    <div class="bgrade-form">
                      <div class="form-row">
                        <label>B급 수량 <span class="hint">(짝수만 입력)</span></label>
                        <div class="input-group">
                          <input
                            type="number"
                            v-model.number="bgradeForm.quantity"
                            placeholder="0"
                            min="0"
                            :max="item.shipmentQuantity"
                            step="2"
                          />
                          <span class="unit">{{ item.unit }}</span>
                        </div>
                        <span v-if="bgradeForm.quantity > 0 && bgradeForm.quantity % 2 !== 0" class="error-hint">
                          짝수만 입력 가능합니다
                        </span>
                      </div>
                      <div class="form-row">
                        <label>B급 단가</label>
                        <div class="input-group">
                          <input
                            type="number"
                            v-model.number="bgradeForm.adjustedUnitPrice"
                            placeholder="0"
                            min="0"
                          />
                          <span class="unit">원</span>
                        </div>
                      </div>
                      <div class="form-row full">
                        <label>사유 <span class="optional">(선택)</span></label>
                        <input
                          type="text"
                          v-model="bgradeForm.reason"
                          placeholder="예: 경미한 스크래치"
                        />
                      </div>
                    </div>

                    <!-- 미리보기 -->
                    <div v-if="bgradeForm.quantity > 0 && item.costPrice" class="preview-box">
                      <div class="preview-row">
                        <span>원래 금액</span>
                        <span>{{ formatCurrency(item.costPrice * bgradeForm.quantity) }}</span>
                      </div>
                      <div class="preview-row">
                        <span>B급 금액</span>
                        <span>{{ formatCurrency(bgradeForm.adjustedUnitPrice * bgradeForm.quantity) }}</span>
                      </div>
                      <div class="preview-row highlight">
                        <span>할인 금액</span>
                        <span class="discount">-{{ formatCurrency((item.costPrice - bgradeForm.adjustedUnitPrice) * bgradeForm.quantity) }}</span>
                      </div>
                    </div>

                    <!-- 추가 버튼 -->
                    <div class="form-actions">
                      <button
                        class="btn-add"
                        @click="addBgradeItem"
                        :disabled="!canAddBgrade || saving"
                      >
                        <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                        <i v-else class="fas fa-plus"></i>
                        {{ saving ? '저장 중...' : '추가' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 등록된 B급 품목 요약 -->
            <div v-if="bgradeItems.length > 0" class="bgrade-summary">
              <div class="summary-header">
                <span class="summary-title">
                  <i class="fas fa-list-check"></i>
                  등록된 B급 품목
                  <span class="count-badge">{{ bgradeItems.length }}</span>
                </span>
                <span class="total-discount">총 할인: <strong>-{{ formatCurrency(totalDiscount) }}</strong></span>
              </div>
              <div class="summary-list">
                <div v-for="item in bgradeItems" :key="item.id" class="summary-item">
                  <div class="item-info">
                    <span class="item-name">{{ item.itemName }},{{ item.skuName }}</span>
                    <span class="item-detail">
                      {{ item.quantity }}{{ item.unit }} × @{{ formatCurrency(item.adjustedUnitPrice) }}
                    </span>
                  </div>
                  <span class="item-discount">-{{ formatCurrency(calculateDiscount(item)) }}</span>
                  <button class="btn-delete" @click="confirmDeleteItem(item)" title="삭제">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 푸터 -->
        <div class="modal-footer">
          <div class="notice">
            <i class="fas fa-info-circle"></i>
            <span>B급 정보는 인수증에 표시되지 않습니다.</span>
          </div>
          <button class="btn-close" @click="closeModal">
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { shipmentService, type ShipmentItemWithOrder } from '~/services/shipment.service'
import { bgradeItemService } from '~/services/bgrade-item.service'
import type { BgradeItemResponse, BgradeItemCreateRequest } from '~/types/bgrade-item'
import type { FundShipmentInfo } from '~/types/fund'
import { formatCurrency as formatCurrencyUtil } from '~/utils/format'

// Props
interface Props {
  isOpen: boolean
  deliveryDoneId: number
  shipments?: FundShipmentInfo[]
}

const props = withDefaults(defineProps<Props>(), {
  shipments: () => []
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

// State
const loading = ref(false)
const loadingItems = ref(false)
const saving = ref(false)
const bgradeItems = ref<BgradeItemResponse[]>([])

// 선택된 출하
const selectedShipmentId = ref<number | null>(null)

// 현재 출하의 품목 목록
const shipmentItems = ref<ShipmentItemWithOrder[]>([])

// 아코디언 상태
const expandedSkuId = ref<string | null>(null)

// B급 입력 폼
const bgradeForm = reactive({
  quantity: 0,
  adjustedUnitPrice: 0,
  reason: ''
})

// Computed
/** 완료된 출하만 필터링 */
const completedShipments = computed(() => {
  return props.shipments.filter(s => s.status === 'COMPLETED')
})

/** 선택된 출하의 deliveryDoneId */
const selectedDeliveryDoneId = computed(() => {
  if (!selectedShipmentId.value) return null
  const shipment = completedShipments.value.find(s => s.shipmentId === selectedShipmentId.value)
  return shipment?.deliveryDoneId || null
})

/** 현재 확장된 품목 정보 */
const expandedItem = computed(() => {
  if (!expandedSkuId.value) return null
  return shipmentItems.value.find(i => i.skuId === expandedSkuId.value)
})

/** B급 추가 가능 여부 */
const canAddBgrade = computed(() => {
  return (
    selectedDeliveryDoneId.value &&
    expandedSkuId.value &&
    bgradeForm.quantity > 0 &&
    bgradeForm.quantity % 2 === 0 &&  // 짝수만 허용
    bgradeForm.adjustedUnitPrice >= 0
  )
})

/** 총 할인 금액 */
const totalDiscount = computed(() => {
  return bgradeItems.value.reduce((sum, item) => {
    return sum + calculateDiscount(item)
  }, 0)
})

// Methods
const formatCurrency = (value: number) => formatCurrencyUtil(value)

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const calculateDiscount = (item: BgradeItemResponse) => {
  return item.quantity * (item.originalUnitPrice - item.adjustedUnitPrice)
}

/** 출하 품목 로드 */
const loadShipmentItems = async (shipmentId: number) => {
  loadingItems.value = true
  try {
    const detail = await shipmentService.getShipmentDetail(shipmentId)
    shipmentItems.value = detail.items || []
    console.log('[B급 모달] 출하 품목 로드:', shipmentItems.value.length, '건')
  } catch (error) {
    console.error('출하 품목 조회 실패:', error)
    shipmentItems.value = []
  } finally {
    loadingItems.value = false
  }
}

/** B급 품목 목록 로드 */
const loadBgradeItems = async () => {
  if (!selectedDeliveryDoneId.value) {
    bgradeItems.value = []
    return
  }

  try {
    bgradeItems.value = await bgradeItemService.getBgradeItems(selectedDeliveryDoneId.value)
    console.log('[B급 모달] B급 품목 로드:', bgradeItems.value.length, '건')
  } catch (error) {
    console.error('B급 품목 목록 조회 실패:', error)
    bgradeItems.value = []
  }
}

/** 아코디언 토글 */
const toggleAccordion = (item: ShipmentItemWithOrder) => {
  // OEM 원가 미설정 품목은 B급 조정 불가
  if (!item.costPrice) return

  if (expandedSkuId.value === item.skuId) {
    // 닫기
    expandedSkuId.value = null
    resetBgradeForm()
  } else {
    // 열기
    expandedSkuId.value = item.skuId
    // 기본 20% 할인 단가 설정 (OEM 원가 기준)
    bgradeForm.quantity = 0
    bgradeForm.adjustedUnitPrice = Math.floor(item.costPrice * 0.8)
    bgradeForm.reason = ''
  }
}

/** B급 폼 초기화 */
const resetBgradeForm = () => {
  bgradeForm.quantity = 0
  bgradeForm.adjustedUnitPrice = 0
  bgradeForm.reason = ''
}

/** B급 품목 추가 */
const addBgradeItem = async () => {
  if (!canAddBgrade.value || saving.value) return
  if (!selectedDeliveryDoneId.value || !expandedItem.value) return

  saving.value = true
  try {
    // OEM 원가가 없으면 저장 불가
    if (!expandedItem.value.costPrice) {
      alert('OEM 원가가 설정되지 않은 품목은 B급 조정이 불가합니다.')
      return
    }

    const createData: BgradeItemCreateRequest = {
      deliveryDoneId: selectedDeliveryDoneId.value!,
      shipmentId: selectedShipmentId.value!,
      skuId: expandedSkuId.value!,
      quantity: bgradeForm.quantity,
      adjustedUnitPrice: bgradeForm.adjustedUnitPrice,
      originalUnitPrice: expandedItem.value.costPrice,
      unit: expandedItem.value.unit,
      reason: bgradeForm.reason || undefined
    }

    await bgradeItemService.createBgradeItem(selectedDeliveryDoneId.value, createData)

    // 목록 새로고침 및 폼 초기화
    await loadBgradeItems()
    expandedSkuId.value = null
    resetBgradeForm()
    emit('updated')
  } catch (error) {
    console.error('B급 품목 저장 실패:', error)
    alert(error instanceof Error ? error.message : 'B급 품목 저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

/** B급 품목 삭제 확인 */
const confirmDeleteItem = async (item: BgradeItemResponse) => {
  if (!confirm(`"${item.itemName}" B급 품목을 삭제하시겠습니까?`)) return
  if (!selectedDeliveryDoneId.value) return

  try {
    await bgradeItemService.deleteBgradeItem(selectedDeliveryDoneId.value, item.id)
    await loadBgradeItems()
    emit('updated')
  } catch (error) {
    console.error('B급 품목 삭제 실패:', error)
    alert(error instanceof Error ? error.message : 'B급 품목 삭제에 실패했습니다.')
  }
}

/** 모달 닫기 */
const closeModal = () => {
  selectedShipmentId.value = null
  expandedSkuId.value = null
  shipmentItems.value = []
  bgradeItems.value = []
  resetBgradeForm()
  emit('close')
}

// Watch
/** 모달 열릴 때 초기화 */
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedShipmentId.value = null
    expandedSkuId.value = null
    shipmentItems.value = []
    bgradeItems.value = []
    resetBgradeForm()

    // 완료된 출하가 1개만 있으면 자동 선택
    if (completedShipments.value.length === 1) {
      selectedShipmentId.value = completedShipments.value[0].shipmentId
    }
  }
})

/** 출하 선택 시 품목 및 B급 목록 로드 */
watch(selectedShipmentId, async (newId) => {
  if (newId) {
    expandedSkuId.value = null
    resetBgradeForm()
    await loadShipmentItems(newId)
    await loadBgradeItems()
  } else {
    shipmentItems.value = []
    bgradeItems.value = []
  }
})
</script>

<style scoped>
/* 모달 오버레이 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* 모달 컨테이너 */
.modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-bottom: 1px solid #fcd34d;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.modal-header h3 i {
  font-size: 1.25rem;
}

.modal-close {
  background: rgba(255, 255, 255, 0.5);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #92400e;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.8);
}

/* 바디 */
.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 로딩 */
.loading-container,
.loading-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #64748b;
}

.loading-container i,
.loading-items i {
  font-size: 1.25rem;
  color: #f59e0b;
}

/* 경고 */
.warning-container {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 12px;
}

.warning-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef3c7;
  border-radius: 50%;
}

.warning-icon i {
  font-size: 1.25rem;
  color: #d97706;
}

.warning-content h4 {
  margin: 0 0 0.375rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #92400e;
}

.warning-content p {
  margin: 0;
  font-size: 0.875rem;
  color: #a16207;
  line-height: 1.5;
}

/* Step 섹션 */
.step-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
}

.step-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50%;
}

.step-title {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9375rem;
}

.step-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: auto;
}

/* 출하 목록 */
.shipment-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.shipment-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.shipment-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.shipment-item.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.shipment-item input[type="radio"] {
  display: none;
}

.shipment-radio {
  width: 18px;
  height: 18px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s;
}

.shipment-item.selected .shipment-radio {
  border-color: #3b82f6;
}

.shipment-item.selected .shipment-radio::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
}

.shipment-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.shipment-no {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.shipment-date {
  font-size: 0.8125rem;
  color: #64748b;
}

/* 빈 품목 */
.empty-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #94a3b8;
}

.empty-items i {
  font-size: 2rem;
}

/* 아코디언 */
.item-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.accordion-item {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.accordion-item.expanded {
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.accordion-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.accordion-header:hover {
  background: #f8fafc;
}

.accordion-header i {
  color: #94a3b8;
  font-size: 0.75rem;
  width: 16px;
}

.accordion-item.expanded .accordion-header i {
  color: #f59e0b;
}

.item-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.item-spec {
  font-size: 0.8125rem;
  color: #64748b;
  flex: 1;
}

.item-qty {
  font-size: 0.8125rem;
  color: #64748b;
  font-feature-settings: 'tnum';
}

.item-qty.qty-zero {
  color: #dc2626;
  font-weight: 600;
}

.item-price {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #475569;
  font-feature-settings: 'tnum';
}

/* 원가 미설정 경고 */
.item-price.cost-warning {
  color: #dc2626;
  font-weight: 600;
  background: #fee2e2;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

/* 원가 미설정 품목 (클릭 불가) */
.accordion-header.no-cost {
  cursor: not-allowed;
  opacity: 0.7;
  background: #f8fafc;
}

.accordion-header.no-cost:hover {
  background: #f8fafc;
}

/* 아코디언 바디 */
.accordion-body {
  padding: 0 1rem 1rem 1rem;
  border-top: 1px solid #f1f5f9;
  background: #fffbeb;
}

/* B급 입력 폼 */
.bgrade-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-top: 1rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-row.full {
  grid-column: span 2;
}

.form-row label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.form-row .optional {
  font-weight: 400;
  color: #94a3b8;
}

.form-row .hint {
  font-weight: 400;
  color: #f59e0b;
  font-size: 0.6875rem;
}

.form-row .error-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #dc2626;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.input-group input,
.form-row > input {
  flex: 1;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.input-group input:focus,
.form-row > input:focus {
  outline: none;
  border-color: #f59e0b;
}

.input-group .unit {
  font-size: 0.8125rem;
  color: #64748b;
  white-space: nowrap;
}

/* 미리보기 */
.preview-box {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #fcd34d;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  font-size: 0.8125rem;
  color: #64748b;
}

.preview-row.highlight {
  margin-top: 0.375rem;
  padding-top: 0.375rem;
  border-top: 1px dashed #fcd34d;
  font-weight: 600;
}

.preview-row .discount {
  color: #dc2626;
}

/* 폼 액션 */
.form-actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: #d97706;
}

.btn-add:disabled {
  background: #fcd34d;
  cursor: not-allowed;
}

/* B급 품목 요약 */
.bgrade-summary {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 1rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #92400e;
  font-size: 0.875rem;
}

.summary-title i {
  font-size: 1rem;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #92400e;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 10px;
}

.total-discount {
  font-size: 0.8125rem;
  color: #92400e;
}

.total-discount strong {
  color: #dc2626;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.summary-item .item-info {
  flex: 1;
  min-width: 0;
}

.summary-item .item-name {
  display: block;
  font-weight: 500;
  color: #1e293b;
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-item .item-detail {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  font-feature-settings: 'tnum';
}

.summary-item .item-discount {
  font-weight: 600;
  color: #dc2626;
  font-size: 0.8125rem;
  font-feature-settings: 'tnum';
}

.btn-delete {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* 푸터 */
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.notice i {
  color: #3b82f6;
}

.btn-close {
  padding: 0.5rem 1.25rem;
  background: white;
  color: #475569;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* 반응형 */
@media (max-width: 480px) {
  .modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .bgrade-form {
    grid-template-columns: 1fr;
  }

  .form-row.full {
    grid-column: span 1;
  }

  .form-actions {
    grid-column: span 1;
  }

  .shipment-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .accordion-header {
    flex-wrap: wrap;
  }

  .item-spec {
    flex-basis: 100%;
    order: 10;
    padding-left: 1.625rem;
    margin-top: 0.25rem;
  }
}
</style>
