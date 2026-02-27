<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>
            재고 부족 현황
          </h3>
          <button class="modal-close" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 안내 메시지 -->
          <div class="shortage-message">
            <i class="fas fa-info-circle"></i>
            <span>{{ message }}</span>
          </div>

          <!-- OEM 제조사 정보 -->
          <div v-if="oemCompanyName" class="oem-info">
            <i class="fas fa-industry"></i>
            <span>제조사: <strong>{{ oemCompanyName }}</strong></span>
          </div>

          <!-- 품목별 재고 현황 테이블 -->
          <div class="table-wrapper">
            <table class="shortage-table">
              <thead>
                <tr>
                  <th>품목명</th>
                  <th class="text-right">필요수량</th>
                  <th class="text-right">생산수량</th>
                  <th class="text-right">기출고</th>
                  <th class="text-right">재고수량</th>
                  <th class="text-right">부족수량</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in items"
                  :key="item.skuId"
                  :class="{ 'row-shortage': !item.sufficient }"
                >
                  <td>{{ item.skuName || item.skuId }}</td>
                  <td class="text-right">{{ formatNumber(item.requiredQuantity) }}</td>
                  <td class="text-right">{{ formatNumber(item.totalProducedQuantity) }}</td>
                  <td class="text-right">{{ formatNumber(item.totalDispatchedQuantity) }}</td>
                  <td class="text-right">{{ formatNumber(item.inventoryQuantity) }}</td>
                  <td class="text-right">
                    <span v-if="item.shortageQuantity >= 0" class="badge-sufficient">
                      <i class="fas fa-check"></i> 충족
                    </span>
                    <span v-else class="badge-shortage">
                      {{ formatNumber(item.shortageQuantity) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 미입고 발주 안내 (ISSUED/IN_PRODUCTION 상태 PO가 있는 경우) -->
          <div v-if="hasPendingOrders" class="pending-order-info">
            <i class="fas fa-truck-loading"></i>
            <span>미입고 발주수량이 포함되어 있습니다. (발주 진행 중인 물량이 입고되면 재고에 반영됩니다)</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-close" @click="$emit('close')">
            <i class="fas fa-times"></i>
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryItemStatus } from '~/types/dispatch-request'

interface Props {
  isOpen: boolean
  items: InventoryItemStatus[]
  message: string
  oemCompanyName: string | null
}

const props = defineProps<Props>()
defineEmits<{ close: [] }>()

const formatNumber = (value: number): string => {
  if (value == null) return '0'
  return value.toLocaleString('ko-KR')
}

/** 미입고 발주수량이 있는 품목이 있는지 확인 */
const hasPendingOrders = computed(() =>
  props.items.some(item => item.orderedQuantity > 0)
)
</script>

<style scoped>
@import '@/assets/css/admin-common.css';

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.125rem;
  padding: 0.25rem;
}

.modal-close:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

/* 안내 메시지 */
.shortage-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.shortage-message i {
  color: #d97706;
  flex-shrink: 0;
}

/* OEM 제조사 정보 */
.oem-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.oem-info i {
  color: #3b82f6;
  flex-shrink: 0;
}

/* 테이블 */
.table-wrapper {
  overflow-x: auto;
}

.shortage-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.shortage-table th {
  background: #f9fafb;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.shortage-table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
}

.shortage-table .text-right {
  text-align: right;
}

/* 부족 행 강조 */
.row-shortage {
  background: #fef2f2;
}

/* 충족 배지 */
.badge-sufficient {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #059669;
  font-weight: 600;
  font-size: 0.8125rem;
}

/* 부족 배지 */
.badge-shortage {
  display: inline-block;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.875rem;
}

/* 미입고 발주 안내 */
.pending-order-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  margin-top: 0.75rem;
}

.pending-order-info i {
  color: #22c55e;
  flex-shrink: 0;
}

/* 닫기 버튼 */
.btn-close {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.btn-close:hover {
  background: #4b5563;
}
</style>
