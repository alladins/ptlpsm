<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container recalc-modal">
          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">OEM 원가 변경 - 영향받는 주문</h2>
                <span class="ccm-modal-subtitle">선택한 주문만 현재 원가로 재계산합니다</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="handleClose" :disabled="isRecalculating">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="ccm-modal-body">
            <!-- 원가 변경 정보 -->
            <div class="cost-change-info">
              <div class="cost-change-row">
                <span class="cost-change-label">SKU</span>
                <span class="cost-change-value">{{ skuId }} / {{ oemCompanyName }}</span>
              </div>
              <div class="cost-change-row">
                <span class="cost-change-label">원가 변경</span>
                <span class="cost-change-value">
                  {{ formatCurrency(costChange?.oldCost) }} → {{ formatCurrency(costChange?.newCost) }}
                </span>
              </div>
            </div>

            <!-- 기간 필터 -->
            <div class="period-filter">
              <label class="period-label">조회 기간</label>
              <select v-model="selectedPeriod" class="period-select" @change="loadAffectedOrders">
                <option value="1">최근 1개월</option>
                <option value="3">최근 3개월</option>
                <option value="6">최근 6개월</option>
                <option value="12">최근 1년</option>
                <option value="all">전체</option>
              </select>
            </div>

            <!-- 로딩 상태 -->
            <div v-if="isLoading" class="loading-state">
              <div class="loading-spinner-large"></div>
              <p>영향받는 주문을 조회하고 있습니다...</p>
            </div>

            <!-- 영향받는 주문 없음 -->
            <div v-else-if="affectedOrders.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <p>영향받는 주문이 없습니다.</p>
              <span class="empty-hint">해당 기간에 이 SKU + OEM 조합의 출하가 없습니다.</span>
            </div>

            <!-- 주문 목록 -->
            <div v-else class="order-list-section">
              <!-- 전체 선택 -->
              <div class="select-all-row">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="toggleSelectAll"
                  />
                  <span>전체 선택</span>
                </label>
                <span class="order-count">총 {{ affectedOrders.length }}건</span>
              </div>

              <!-- 주문 목록 -->
              <div class="order-list">
                <label
                  v-for="order in affectedOrders"
                  :key="order.deliveryDoneId"
                  class="order-item"
                  :class="{ selected: selectedIds.has(order.deliveryDoneId) }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(order.deliveryDoneId)"
                    @change="toggleOrder(order.deliveryDoneId)"
                  />
                  <div class="order-info">
                    <div class="order-header">
                      <span class="order-no">{{ order.deliveryRequestNo || '-' }}</span>
                      <span v-if="order.shipmentDate" class="order-date">{{ order.shipmentDate }}</span>
                    </div>
                    <div class="order-details">
                      <span class="order-project">{{ order.projectName || '-' }}</span>
                      <span class="order-client">{{ order.client || '' }}</span>
                    </div>
                    <div class="order-amount">
                      현재: <strong>{{ formatCurrency(order.currentOemExpectedTotal) }}</strong>
                    </div>
                  </div>
                </label>
              </div>

              <!-- 재계산 결과 (실행 후) -->
              <div v-if="recalcResults.length > 0" class="recalc-results">
                <h4 class="results-title">재계산 결과</h4>
                <div
                  v-for="result in recalcResults"
                  :key="result.deliveryDoneId"
                  class="result-item"
                  :class="{ 'result-success': result.success, 'result-fail': !result.success }"
                >
                  <span class="result-id">{{ getOrderNo(result.deliveryDoneId) }}</span>
                  <span v-if="result.success" class="result-change">
                    {{ formatCurrency(result.oldAmount) }} → {{ formatCurrency(result.newAmount) }}
                    <span class="result-diff" :class="getDiffClass(result)">
                      ({{ getDiffText(result) }})
                    </span>
                  </span>
                  <span v-else class="result-error">실패: {{ result.error }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="ccm-modal-footer">
            <button
              type="button"
              class="ccm-btn-secondary"
              @click="handleClose"
              :disabled="isRecalculating"
            >
              {{ recalcResults.length > 0 ? '닫기' : '나중에' }}
            </button>
            <button
              v-if="recalcResults.length === 0"
              type="button"
              class="ccm-btn-primary ccm-btn-blue"
              @click="handleRecalculate"
              :disabled="selectedIds.size === 0 || isRecalculating"
            >
              <span v-if="isRecalculating" class="loading-spinner"></span>
              <span v-else>선택 재계산 ({{ selectedIds.size }}건)</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { oemCostService } from '~/services/oem-cost.service'
import type { AffectedOrder, RecalcResult } from '~/types/oem-cost'

interface CostChange {
  oldCost: number
  newCost: number
}

interface Props {
  isOpen: boolean
  skuId: string
  oemCompanyId: number
  skuName?: string
  oemCompanyName?: string
  costChange?: CostChange | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'recalculated'): void
}>()

// 상태
const isLoading = ref(false)
const isRecalculating = ref(false)
const selectedPeriod = ref('3')
const affectedOrders = ref<AffectedOrder[]>([])
const selectedIds = ref<Set<number>>(new Set())
const recalcResults = ref<RecalcResult[]>([])

// 전체 선택 상태
const isAllSelected = computed(() =>
  affectedOrders.value.length > 0 && selectedIds.value.size === affectedOrders.value.length
)

const isIndeterminate = computed(() =>
  selectedIds.value.size > 0 && selectedIds.value.size < affectedOrders.value.length
)

// 영향받는 주문 조회
const loadAffectedOrders = async () => {
  isLoading.value = true
  selectedIds.value = new Set()
  recalcResults.value = []

  try {
    let startDate: string | undefined
    if (selectedPeriod.value !== 'all') {
      const months = parseInt(selectedPeriod.value)
      const date = new Date()
      date.setMonth(date.getMonth() - months)
      startDate = date.toISOString().split('T')[0]
    }

    affectedOrders.value = await oemCostService.getAffectedOrders(
      props.skuId,
      props.oemCompanyId,
      startDate
    )

    // 기본적으로 전체 선택
    affectedOrders.value.forEach(order => {
      selectedIds.value.add(order.deliveryDoneId)
    })
  } catch (error) {
    console.error('영향 주문 조회 실패:', error)
    affectedOrders.value = []
  } finally {
    isLoading.value = false
  }
}

// 전체 선택/해제
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(affectedOrders.value.map(o => o.deliveryDoneId))
  }
}

// 개별 선택/해제
const toggleOrder = (deliveryDoneId: number) => {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(deliveryDoneId)) {
    newSet.delete(deliveryDoneId)
  } else {
    newSet.add(deliveryDoneId)
  }
  selectedIds.value = newSet
}

// 재계산 실행
const handleRecalculate = async () => {
  if (selectedIds.value.size === 0 || isRecalculating.value) return

  const confirmed = confirm(`선택한 ${selectedIds.value.size}건의 OEM 예정총액을 재계산합니다.\n진행하시겠습니까?`)
  if (!confirmed) return

  isRecalculating.value = true
  try {
    const ids = Array.from(selectedIds.value)
    recalcResults.value = await oemCostService.recalculateSelected(ids)
    emit('recalculated')
  } catch (error) {
    console.error('재계산 실패:', error)
    alert('재계산 중 오류가 발생했습니다.')
  } finally {
    isRecalculating.value = false
  }
}

// 주문번호 조회 (결과 표시용)
const getOrderNo = (deliveryDoneId: number): string => {
  const order = affectedOrders.value.find(o => o.deliveryDoneId === deliveryDoneId)
  return order?.deliveryRequestNo || `납품-${deliveryDoneId}`
}

// 차이 표시
const getDiffClass = (result: RecalcResult): string => {
  const diff = result.newAmount - result.oldAmount
  if (diff > 0) return 'diff-positive'
  if (diff < 0) return 'diff-negative'
  return 'diff-zero'
}

const getDiffText = (result: RecalcResult): string => {
  const diff = result.newAmount - result.oldAmount
  const prefix = diff > 0 ? '+' : ''
  return `${prefix}${diff.toLocaleString('ko-KR')}원`
}

// 금액 포맷
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '0원'
  return amount.toLocaleString('ko-KR') + '원'
}

// 닫기
const handleClose = () => {
  if (isRecalculating.value) return
  emit('close')
}

// 모달 열림 감지 → 데이터 로드
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    selectedPeriod.value = '3'
    recalcResults.value = []
    loadAffectedOrders()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';
@import '@/assets/css/admin-modals.css';

/* Modal 기본 스타일 */
.ccm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.recalc-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Header */
.ccm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ccm-header-content {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.ccm-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ccm-header-icon svg {
  width: 22px;
  height: 22px;
}

.ccm-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.ccm-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.ccm-modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.ccm-modal-subtitle {
  font-size: 0.8125rem;
  color: #6b7280;
}

.ccm-close-button {
  width: 34px;
  height: 34px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.ccm-close-button:hover { background: #e5e7eb; color: #1f2937; }
.ccm-close-button svg { width: 18px; height: 18px; }

/* Body */
.ccm-modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  max-height: calc(85vh - 160px);
}

/* 원가 변경 정보 */
.cost-change-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  margin-bottom: 1rem;
}

.cost-change-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.cost-change-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.cost-change-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
}

/* 기간 필터 */
.period-filter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.period-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.period-select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #1f2937;
  background: white;
}

.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 로딩 상태 */
.loading-state {
  text-align: center;
  padding: 2rem 0;
  color: #6b7280;
}

.loading-spinner-large {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 2rem 0;
  color: #6b7280;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #10b981;
  margin: 0 auto 0.75rem;
  display: block;
}

.empty-state p {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.empty-hint {
  font-size: 0.8125rem;
  color: #9ca3af;
}

/* 전체 선택 */
.select-all-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.order-count {
  font-size: 0.8125rem;
  color: #6b7280;
}

/* 주문 목록 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.order-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.order-item.selected {
  background: #eff6ff;
  border-color: #93c5fd;
}

.order-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
  margin-top: 2px;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.order-no {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.order-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.order-details {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.order-project {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-client {
  flex-shrink: 0;
}

.order-amount {
  font-size: 0.8125rem;
  color: #374151;
}

.order-amount strong {
  color: #1e40af;
}

/* 재계산 결과 */
.recalc-results {
  margin-top: 1rem;
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
}

.results-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
}

.result-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.result-fail {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.result-id {
  font-weight: 600;
  color: #374151;
}

.result-change {
  color: #374151;
}

.result-diff {
  font-weight: 600;
}

.diff-positive { color: #dc2626; }
.diff-negative { color: #2563eb; }
.diff-zero { color: #6b7280; }

.result-error {
  color: #dc2626;
  font-size: 0.75rem;
}

/* Footer */
.ccm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ccm-btn-secondary,
.ccm-btn-primary {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.ccm-btn-secondary {
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.ccm-btn-secondary:hover { background: #f3f4f6; }

.ccm-btn-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.ccm-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.ccm-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 로딩 스피너 */
.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .recalc-modal,
.modal-leave-active .recalc-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .recalc-modal,
.modal-leave-to .recalc-modal {
  transform: scale(0.95) translateY(-20px);
}
</style>
