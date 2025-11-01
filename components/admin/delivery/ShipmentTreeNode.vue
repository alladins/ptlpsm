<template>
  <div class="shipment-tree-node" :style="{ paddingLeft: `${level * 32}px` }">
    <div class="shipment-card">
      <!-- 출하 헤더 - 한 줄 레이아웃 -->
      <div class="shipment-header" @click="toggleExpand">
        <button class="expand-btn" :class="{ expanded }">
          <i class="fas" :class="expanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
        </button>
        <i class="fas fa-box"></i>
        <span class="shipment-id">출하 #{{ shipment.shipmentId }}</span>
        <span class="info-separator">·</span>
        <span class="shipment-date">{{ formatDate(shipment.shipmentDate) }}</span>
        <span class="info-separator">·</span>
        <span class="info-text">
          <i class="fas fa-user"></i>
          담당자: {{ shipment.shipmentResponsible || '-' }}
        </span>
        <span class="info-separator">·</span>
        <span class="info-text">
          <i class="fas fa-list"></i>
          품목: {{ shipment.itemSummary }} ({{ shipment.itemCount }}개)
        </span>
        <span class="info-separator">·</span>
        <span class="shipment-quantity">
          <i class="fas fa-boxes"></i>
          {{ shipment.shipmentQuantity.toLocaleString() }}
        </span>
        <span class="info-separator">·</span>
        <span
          class="status-badge"
          :class="getStatusClass(shipment.status)"
        >
          {{ getStatusText(shipment.status) }}
        </span>
      </div>

      <!-- 운송/납품 상세 (확장 시 표시) -->
      <transition name="expand">
        <div v-if="expanded" class="shipment-body">
          <!-- 운송 정보가 있을 때 -->
          <AdminDeliveryTransportDetailNode
            v-if="shipment.transport"
            :transport="shipment.transport"
            :level="level + 1"
          />

          <!-- 운송 정보가 없을 때 -->
          <div v-else class="no-transport">
            <i class="fas fa-truck-loading"></i>
            <span>운송 정보 없음</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ShipmentTreeNode } from '~/types/delivery'
import { formatDate } from '~/utils/format'

interface Props {
  shipment: ShipmentTreeNode
  level: number
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false
})

const expanded = ref(props.defaultExpanded)

const toggleExpand = () => {
  expanded.value = !expanded.value
}

// 상태 텍스트 변환
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'PENDING': '대기',
    'IN_TRANSIT': '운송중',
    'ARRIVED': '도착',
    'UNLOADING': '하차중',
    'COMPLETED': '완료',
    'CANCELLED': '취소'
  }
  return statusMap[status] || status
}

// 상태 클래스
const getStatusClass = (status: string) => {
  const classMap: { [key: string]: string } = {
    'PENDING': 'status-waiting',
    'IN_TRANSIT': 'status-in-transit',
    'ARRIVED': 'status-arrived',
    'UNLOADING': 'status-unloading',
    'COMPLETED': 'status-completed',
    'CANCELLED': 'status-cancelled'
  }
  return classMap[status] || 'status-default'
}
</script>

<style scoped>
.shipment-tree-node {
  margin-top: 0.75rem;
}

.shipment-card {
  background: #f5f3ff;
  border: 1px solid #e9d5ff;
  border-radius: 0.5rem;
  overflow: hidden;
}

.shipment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #f5f3ff 0%, #e9d5ff 100%);
  cursor: pointer;
  transition: background 0.2s;
}

.shipment-header:hover {
  background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
}

.expand-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: white;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.expand-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.expand-btn.expanded {
  background: #7c3aed;
  color: white;
}

.expand-btn i {
  font-size: 0.75rem;
}

.shipment-header > i.fa-box {
  font-size: 1.125rem;
  color: #7c3aed;
  flex-shrink: 0;
}

.shipment-id {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #5b21b6;
}

.shipment-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #334155;
}

.info-text i {
  color: #94a3b8;
  font-size: 0.8125rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.shipment-quantity {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: #5b21b6;
}

.shipment-quantity i {
  color: #7c3aed;
}

/* 출하 본문 (확장 시) */
.shipment-body {
  padding: 0 1rem 1rem 1rem;
  background: white;
}

/* 운송 정보 없음 */
.no-transport {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 0.5rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.no-transport i {
  font-size: 1.5rem;
}

/* 상태 배지 색상 (재사용) */
.status-waiting {
  background: #fef3c7;
  color: #92400e;
}

.status-in-transit {
  background: #dbeafe;
  color: #1e40af;
}

.status-arrived {
  background: #e0e7ff;
  color: #3730a3;
}

.status-unloading {
  background: #fce7f3;
  color: #9f1239;
}

.status-completed {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

/* 확장/축소 애니메이션 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* 반응형 */
@media (max-width: 768px) {
  .shipment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .shipment-id {
    font-size: 0.875rem;
  }

  .shipment-date {
    font-size: 0.8125rem;
  }

  .info-text {
    font-size: 0.8125rem;
  }

  .status-badge {
    margin-left: auto;
  }
}
</style>
