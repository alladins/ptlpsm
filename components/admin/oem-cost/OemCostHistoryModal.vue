<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="ccm-modal-overlay" @click.self="handleClose">
        <div class="ccm-modal-container history-modal">
          <!-- Modal Header -->
          <div class="ccm-modal-header">
            <div class="ccm-header-content">
              <div class="ccm-header-icon ccm-icon-blue">
                <i class="fas fa-history" />
              </div>
              <div class="ccm-header-text">
                <h2 class="ccm-modal-title">
                  원가 변경 이력
                </h2>
                <span class="ccm-modal-subtitle">{{ skuId }} - {{ oemCompanyName }}</span>
              </div>
            </div>
            <button class="ccm-close-button" @click="handleClose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="ccm-modal-body">
            <!-- 현재 원가 정보 -->
            <div v-if="currentCost" class="current-cost-card">
              <div class="current-cost-header">
                <i class="fas fa-won-sign" />
                <span>현재 원가 정보</span>
              </div>
              <div class="current-cost-body">
                <div class="cost-info-item">
                  <span class="label">원가</span>
                  <span class="value">{{ formatCurrency(currentCost.costPrice) }}</span>
                </div>
                <div class="cost-info-item">
                  <span class="label">마진율</span>
                  <span class="value margin-badge" :class="getMarginClass(currentCost)">
                    {{ getMarginRateText(currentCost) }}
                  </span>
                </div>
                <div class="cost-info-item">
                  <span class="label">적용기간</span>
                  <span class="value">{{ formatDateRange(currentCost) }}</span>
                </div>
              </div>
            </div>

            <!-- 변경 이력 테이블 -->
            <div class="history-section">
              <div class="history-header">
                <span class="history-title">변경 이력</span>
                <span class="history-count">총 {{ historyList.length }}건</span>
              </div>

              <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner" />
                <span>이력 조회 중...</span>
              </div>

              <div v-else-if="historyList.length === 0" class="empty-state">
                <i class="fas fa-inbox" />
                <span>변경 이력이 없습니다.</span>
              </div>

              <table v-else class="history-table">
                <thead>
                  <tr>
                    <th style="width: 130px">
                      공급사명
                    </th>
                    <th style="width: 70px; text-align: center">
                      유형
                    </th>
                    <th style="width: 100px" class="text-right">
                      이전 원가
                    </th>
                    <th style="width: 100px" class="text-right">
                      변경 원가
                    </th>
                    <th style="width: 90px">
                      변경자
                    </th>
                    <th style="width: 150px">
                      변경일시
                    </th>
                    <th>사유</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in historyList" :key="item.id">
                    <td class="company-cell">
                      {{ item.oemCompanyName || '-' }}
                      <span v-if="item.costSourceType === 'LEADPOWER'" class="source-badge source-leadpower">본사</span>
                    </td>
                    <td>
                      <span class="change-type-badge" :class="getChangeTypeClass(item.changeType)">
                        {{ getChangeTypeLabel(item.changeType) }}
                      </span>
                    </td>
                    <td class="text-right">
                      {{ item.oldCost ? formatCurrency(item.oldCost) : '-' }}
                    </td>
                    <td class="text-right cost-value">
                      {{ item.newCost ? formatCurrency(item.newCost) : '-' }}
                    </td>
                    <td>{{ item.changedByName || item.changedBy }}</td>
                    <td>{{ formatDateTime(item.changedAt) }}</td>
                    <td class="reason-cell">
                      {{ item.changeReason || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="ccm-modal-footer">
            <button type="button" class="ccm-btn-secondary" @click="handleClose">
              닫기
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatDateTime } from '~/utils/format'
import { oemCostService } from '~/services/oem-cost.service'
import { calculateMarginRate, getMarginRateClass, COST_CHANGE_TYPE_LABELS } from '~/types/oem-cost'
import type { OemCost, OemCostHistory, CostChangeType } from '~/types/oem-cost'

interface Props {
  isOpen: boolean
  skuId: string
  oemCompanyId: number
  oemCompanyName: string
  currentCost?: OemCost | null
  unitPrice?: number // 마진율 계산용
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 상태
const isLoading = ref(false)
const historyList = ref<OemCostHistory[]>([])

// 이력 로드
const loadHistory = async () => {
  if (!props.skuId) { return }

  try {
    isLoading.value = true
    // oemCompanyId가 0이면 SKU 전체 이력, 아니면 특정 OEM 이력
    if (props.oemCompanyId) {
      historyList.value = await oemCostService.getHistory(props.skuId, props.oemCompanyId)
    } else {
      historyList.value = await oemCostService.getHistoryBySku(props.skuId)
    }
  } catch (error) {
    console.error('이력 조회 실패:', error)
    historyList.value = []
  } finally {
    isLoading.value = false
  }
}

// 닫기
const handleClose = () => {
  emit('close')
}

// 포맷팅 함수
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) { return '-' }
  return amount.toLocaleString('ko-KR') + '원'
}

const formatDateRange = (cost: OemCost): string => {
  const start = cost.effectiveDate || '-'
  const end = cost.expiryDate || '무기한'
  return `${start} ~ ${end}`
}

// 마진율
const getMarginRateText = (cost: OemCost): string => {
  const rate = calculateMarginRate(props.unitPrice, cost.costPrice)
  if (rate === null) { return '-' }
  return `${rate.toFixed(1)}%`
}

const getMarginClass = (cost: OemCost): string => {
  const rate = calculateMarginRate(props.unitPrice, cost.costPrice)
  return getMarginRateClass(rate)
}

// 변경 유형
const getChangeTypeLabel = (type: CostChangeType): string => {
  return COST_CHANGE_TYPE_LABELS[type] || type
}

const getChangeTypeClass = (type: CostChangeType): string => {
  switch (type) {
    case 'CREATE': return 'type-create'
    case 'UPDATE': return 'type-update'
    case 'DELETE': return 'type-delete'
    default: return ''
  }
}

// 모달 열림 감지
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadHistory()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

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

.ccm-modal-container.history-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 1020px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Header */
.ccm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.ccm-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ccm-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.ccm-icon-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.ccm-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.ccm-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.ccm-modal-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
}

.ccm-close-button {
  width: 36px;
  height: 36px;
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

.ccm-close-button:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.ccm-close-button svg {
  width: 20px;
  height: 20px;
}

/* Body */
.ccm-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 180px);
}

/* 현재 원가 카드 */
.current-cost-card {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #93c5fd;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.current-cost-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.1);
  border-bottom: 1px solid #93c5fd;
  font-weight: 600;
  color: #1e40af;
}

.current-cost-body {
  display: flex;
  gap: 2rem;
  padding: 1rem;
}

.cost-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cost-info-item .label {
  font-size: 0.75rem;
  color: #6b7280;
}

.cost-info-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 마진 배지 */
.margin-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
}

.margin-high {
  background: #dcfce7;
  color: #166534;
}

.margin-normal {
  background: #dbeafe;
  color: #1e40af;
}

.margin-low {
  background: #fef3c7;
  color: #92400e;
}

.margin-negative {
  background: #fee2e2;
  color: #991b1b;
}

.margin-none {
  background: #f3f4f6;
  color: #6b7280;
}

/* 이력 섹션 */
.history-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.history-title {
  font-weight: 600;
  color: #1f2937;
}

.history-count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #9ca3af;
}

.empty-state i {
  font-size: 2rem;
}

/* 테이블 */
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.history-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.history-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.history-table tr:last-child td {
  border-bottom: none;
}

.history-table .text-right {
  text-align: right;
}

.cost-value {
  font-weight: 600;
  color: #1f2937;
}

.reason-cell {
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company-cell {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
}

.source-badge {
  display: inline-block;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  flex-shrink: 0;
}

.source-leadpower {
  background: #fce7f3;
  color: #9d174d;
}

/* 변경 유형 배지 */
.change-type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-create {
  background: #dcfce7;
  color: #166534;
}

.type-update {
  background: #dbeafe;
  color: #1e40af;
}

.type-delete {
  background: #fee2e2;
  color: #991b1b;
}

/* Footer */
.ccm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ccm-btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.ccm-btn-secondary:hover {
  background: #f3f4f6;
}

/* 트랜지션 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .history-modal,
.modal-leave-active .history-modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .history-modal,
.modal-leave-to .history-modal {
  transform: scale(0.95) translateY(-20px);
}
</style>
