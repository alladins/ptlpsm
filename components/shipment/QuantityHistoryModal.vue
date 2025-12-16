<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal modal-large" @click.stop>
      <div class="modal-header">
        <h3>수량 변경 이력</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 조회 기간 정보 -->
        <div class="period-info">
          <i class="fas fa-calendar-alt"></i>
          <span>조회 기간: {{ periodStartDate }} 이후 변경분</span>
          <span v-if="baselineName" class="baseline-name">({{ baselineName }} 확정일 기준)</span>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <p>데이터를 불러오는 중...</p>
        </div>

        <template v-else>
          <!-- 변경 이력 목록 -->
          <div class="history-section">
            <h4>변경 이력 목록</h4>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>변경일시</th>
                    <th>출하번호</th>
                    <th>품목명</th>
                    <th>변경전</th>
                    <th>변경후</th>
                    <th>차이</th>
                    <th>변경사유</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="historyList.length === 0">
                    <td colspan="7" class="no-data">수량 변경 이력이 없습니다.</td>
                  </tr>
                  <tr v-else v-for="history in historyList" :key="history.historyId">
                    <td>{{ formatDateTime(history.changedAt) }}</td>
                    <td>{{ history.shipmentNo || '-' }}</td>
                    <td>{{ history.itemName }}</td>
                    <td class="text-right">{{ formatNumber(history.beforeQuantity) }}</td>
                    <td class="text-right">{{ formatNumber(history.afterQuantity) }}</td>
                    <td class="text-right">
                      <span :class="getDiffClass(history.difference)">
                        {{ getDiffText(history.difference) }}
                      </span>
                    </td>
                    <td>{{ history.changeReason || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 품목별 변경 요약 -->
          <div class="summary-section">
            <h4>품목별 변경 요약</h4>
            <div class="table-container">
              <table class="data-table summary-table">
                <thead>
                  <tr>
                    <th>품목명</th>
                    <th>기준 수량</th>
                    <th>증가</th>
                    <th>감소</th>
                    <th>순변동</th>
                    <th>현재 수량</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="itemSummary.length === 0">
                    <td colspan="6" class="no-data">요약 데이터가 없습니다.</td>
                  </tr>
                  <tr v-else v-for="item in itemSummary" :key="item.itemId">
                    <td>{{ item.itemName }}</td>
                    <td class="text-right">{{ formatNumber(item.baseQuantity) }}</td>
                    <td class="text-right text-success">
                      <span v-if="item.increased > 0">+{{ formatNumber(item.increased) }}</span>
                      <span v-else>-</span>
                    </td>
                    <td class="text-right text-danger">
                      <span v-if="item.decreased > 0">-{{ formatNumber(item.decreased) }}</span>
                      <span v-else>-</span>
                    </td>
                    <td class="text-right">
                      <span :class="getNetChangeClass(item.netChange)">
                        {{ getNetChangeText(item.netChange) }}
                      </span>
                    </td>
                    <td class="text-right font-bold">{{ formatNumber(item.currentQuantity) }}</td>
                  </tr>
                </tbody>
                <tfoot v-if="itemSummary.length > 0">
                  <tr>
                    <td class="text-right"><strong>합계</strong></td>
                    <td class="text-right"><strong>{{ formatNumber(totalBaseQuantity) }}</strong></td>
                    <td class="text-right text-success">
                      <strong>+{{ formatNumber(totalIncreased) }}</strong>
                    </td>
                    <td class="text-right text-danger">
                      <strong>-{{ formatNumber(totalDecreased) }}</strong>
                    </td>
                    <td class="text-right">
                      <strong :class="getNetChangeClass(totalNetChange)">
                        {{ getNetChangeText(totalNetChange) }}
                      </strong>
                    </td>
                    <td class="text-right"><strong>{{ formatNumber(totalCurrentQuantity) }}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { formatNumber } from '~/utils/format'
import { baselineService } from '~/services/baseline.service'

// Props
interface Props {
  isOpen: boolean
  orderId: number
  baselineId?: number
  baselineName?: string
  periodStartDate?: string
}

const props = withDefaults(defineProps<Props>(), {
  baselineName: '',
  periodStartDate: ''
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

// State
const loading = ref(false)

// 변경 이력 데이터 타입
interface QuantityHistory {
  historyId: number
  changedAt: string
  shipmentNo?: string
  itemId: string
  itemName: string
  beforeQuantity: number
  afterQuantity: number
  difference: number
  changeReason?: string
}

interface ItemSummary {
  itemId: string
  itemName: string
  baseQuantity: number
  increased: number
  decreased: number
  netChange: number
  currentQuantity: number
}

const historyList = ref<QuantityHistory[]>([])
const itemSummary = ref<ItemSummary[]>([])

// Computed - 합계
const totalBaseQuantity = computed(() => {
  return itemSummary.value.reduce((sum, item) => sum + item.baseQuantity, 0)
})

const totalIncreased = computed(() => {
  return itemSummary.value.reduce((sum, item) => sum + item.increased, 0)
})

const totalDecreased = computed(() => {
  return itemSummary.value.reduce((sum, item) => sum + item.decreased, 0)
})

const totalNetChange = computed(() => {
  return itemSummary.value.reduce((sum, item) => sum + item.netChange, 0)
})

const totalCurrentQuantity = computed(() => {
  return itemSummary.value.reduce((sum, item) => sum + item.currentQuantity, 0)
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.orderId) return

  loading.value = true
  try {
    const data = await baselineService.getQuantityChanges(props.orderId, props.baselineId)

    historyList.value = data.historyList || []
    itemSummary.value = data.itemSummary || []
  } catch (error) {
    console.error('수량 변경 이력 조회 실패:', error)
  } finally {
    loading.value = false
  }
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDiffClass = (diff: number): string => {
  if (diff > 0) return 'text-success'
  if (diff < 0) return 'text-danger'
  return ''
}

const getDiffText = (diff: number): string => {
  if (diff > 0) return `+${formatNumber(diff)}`
  if (diff < 0) return formatNumber(diff)
  return '0'
}

const getNetChangeClass = (netChange: number): string => {
  if (netChange > 0) return 'text-success'
  if (netChange < 0) return 'text-danger'
  return ''
}

const getNetChangeText = (netChange: number): string => {
  if (netChange > 0) return `+${formatNumber(netChange)}`
  if (netChange < 0) return formatNumber(netChange)
  return '0'
}

// Watch
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadData()
  }
})
</script>

<style scoped>
@import '@/assets/css/admin-common.css';
@import '@/assets/css/admin-buttons.css';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 90%;
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* 조회 기간 정보 */
.period-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.875rem;
}

.period-info i {
  font-size: 1rem;
}

.baseline-name {
  color: #6b7280;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.loading-container i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* 섹션 */
.history-section,
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-section h4,
.summary-section h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 테이블 */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table th {
  padding: 0.75rem;
  text-align: center;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.data-table td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #f3f4f6;
}

.data-table td.text-right {
  text-align: right;
}

.data-table tfoot td {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 2rem !important;
}

.text-success {
  color: #059669;
  font-weight: 500;
}

.text-danger {
  color: #dc2626;
  font-weight: 500;
}

.font-bold {
  font-weight: 600;
}

/* 요약 테이블 */
.summary-table {
  background: #fefce8;
}

.summary-table th {
  background: #fef3c7;
}

/* 버튼 */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}
</style>
