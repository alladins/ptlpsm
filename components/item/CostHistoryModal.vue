<template>
  <div v-if="isOpen" class="modal-overlay" @click="closeModal">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>원가 변경 이력</h3>
        <button class="modal-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <!-- 품목 정보 -->
        <div class="item-info">
          <div class="info-row">
            <label>품목코드:</label>
            <span>{{ itemId }}</span>
          </div>
          <div class="info-row">
            <label>품목명:</label>
            <span>{{ itemName }}</span>
          </div>
          <div class="info-row">
            <label>현재 원가:</label>
            <span class="current-cost">{{ formatCurrency(currentCostPrice) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 로딩 상태 -->
        <div v-if="loading" class="loading-container">
          <i class="fas fa-spinner fa-spin"></i>
          <p>이력을 불러오는 중...</p>
        </div>

        <!-- 변경 이력 테이블 -->
        <div v-else class="history-section">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>변경일시</th>
                  <th>변경전 원가</th>
                  <th>변경후 원가</th>
                  <th>차이</th>
                  <th>변경사유</th>
                  <th>변경자</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="historyList.length === 0">
                  <td colspan="6" class="no-data">원가 변경 이력이 없습니다.</td>
                </tr>
                <tr v-else v-for="history in historyList" :key="history.historyId">
                  <td>{{ formatDateTime(history.changedAt) }}</td>
                  <td class="text-right">{{ formatCurrency(history.beforeCost) }}</td>
                  <td class="text-right">{{ formatCurrency(history.afterCost) }}</td>
                  <td class="text-right">
                    <span :class="getDiffClass(history.afterCost - history.beforeCost)">
                      {{ getDiffText(history.afterCost - history.beforeCost) }}
                    </span>
                  </td>
                  <td>{{ history.changeReason || '-' }}</td>
                  <td>{{ history.changedBy || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 원가 변동 추이 요약 -->
        <div v-if="historyList.length > 0" class="summary-section">
          <h4>변동 추이 요약</h4>
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">최초 원가</div>
              <div class="summary-value">{{ formatCurrency(firstCost) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">현재 원가</div>
              <div class="summary-value">{{ formatCurrency(currentCostPrice) }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">총 변동</div>
              <div class="summary-value" :class="getTotalChangeClass">
                {{ getTotalChangeText }}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">변경 횟수</div>
              <div class="summary-value">{{ historyList.length }}회</div>
            </div>
          </div>
        </div>
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
import { formatCurrency } from '~/utils/format'
import { itemService } from '~/services/item.service'

// Props
interface Props {
  isOpen: boolean
  itemId: string
  itemName: string
  currentCostPrice: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

// State
const loading = ref(false)

// 변경 이력 데이터 타입
interface CostHistory {
  historyId: number
  changedAt: string
  beforeCost: number
  afterCost: number
  changeReason?: string
  changedBy?: string
}

const historyList = ref<CostHistory[]>([])

// Computed
const firstCost = computed(() => {
  if (historyList.value.length === 0) return props.currentCostPrice
  return historyList.value[historyList.value.length - 1].beforeCost
})

const getTotalChangeClass = computed(() => {
  const diff = props.currentCostPrice - firstCost.value
  if (diff > 0) return 'text-danger'
  if (diff < 0) return 'text-success'
  return ''
})

const getTotalChangeText = computed(() => {
  const diff = props.currentCostPrice - firstCost.value
  if (diff > 0) return `+${formatCurrency(diff)}`
  if (diff < 0) return formatCurrency(diff)
  return '변동 없음'
})

// Methods
const closeModal = () => {
  emit('close')
}

const loadData = async () => {
  if (!props.itemId) return

  loading.value = true
  try {
    const data = await itemService.getCostHistory(props.itemId)
    historyList.value = data || []
  } catch (error) {
    console.error('원가 변경 이력 조회 실패:', error)
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
  if (diff > 0) return 'text-danger'
  if (diff < 0) return 'text-success'
  return ''
}

const getDiffText = (diff: number): string => {
  if (diff > 0) return `+${formatCurrency(diff)}`
  if (diff < 0) return formatCurrency(diff)
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
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
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

/* 품목 정보 */
.item-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row label {
  color: #6b7280;
  font-size: 0.875rem;
  min-width: 80px;
}

.info-row span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

.current-cost {
  color: #2563eb !important;
  font-weight: 600 !important;
}

.divider {
  height: 1px;
  background: #e5e7eb;
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

/* 테이블 */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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

/* 요약 섹션 */
.summary-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.summary-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.summary-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.summary-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
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

/* 반응형 */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
