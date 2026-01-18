<template>
  <div class="order-tree-node">
    <div class="order-card">
      <!-- 발주 헤더 - 1줄 레이아웃 (캡처 이미지 기준) -->
      <div class="order-header" @click="toggleExpand">
        <button class="expand-btn" :class="{ expanded }" @click.stop="toggleExpand">
          <i class="fas" :class="expanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
        </button>

        <i class="fas fa-file-invoice order-icon"></i>

        <span class="delivery-request-no">{{ order.deliveryRequestNo }}</span>

        <span class="date-info">
          <span class="date-label">납품요구일:</span>
          <span class="date-value">{{ formatDate(order.deliveryRequestDate) }}</span>
        </span>

        <span class="separator narrow">|</span>

        <span class="client-name">
          <i class="fas fa-building"></i>
          {{ order.client }}
        </span>

        <span class="separator">|</span>

        <span class="project-name">{{ order.projectName }}</span>

        <span class="separator">|</span>

        <span class="quantity-info">
          {{ formatQuantity(order.totalDeliveredQuantity) }} / {{ formatQuantity(order.totalOrderedQuantity) }} {{ order.unit }}
        </span>

        <span class="shipment-count-badge">
          {{ order.shipments?.length || 0 }}건
        </span>

        <span class="delivery-rate-badge" :class="getRateColorClass()">
          {{ (order.deliveryCompletionRate || 0).toFixed(1) }}%
        </span>
      </div>

      <!-- 출하 목록 (확장 시 표시) -->
      <transition name="expand">
        <div v-if="expanded" class="order-body">
          <!-- 출하가 있을 때 -->
          <div v-if="order.shipments && order.shipments.length > 0" class="shipments-container">
            <div class="shipments-header">
              <i class="fas fa-truck-loading"></i>
              <span>출하 목록 ({{ order.shipments.length }}건)</span>
            </div>

            <ShipmentTreeNode
              v-for="shipment in order.shipments"
              :key="shipment.shipmentId"
              :shipment="shipment"
              :level="level + 1"
              :default-expanded="false"
              :delivery-done-id="order.deliveryDoneId || order.orderId"
            />
          </div>

          <!-- 출하가 없을 때 -->
          <div v-else class="no-shipments">
            <i class="fas fa-box-open"></i>
            <span>출하 내역이 없습니다</span>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { OrderTreeNode } from '~/types/delivery'
import { formatDate, formatQuantity } from '~/utils/format'
import { getDeliveryRateColor } from '~/utils/delivery'

interface Props {
  order: OrderTreeNode
  level: number
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  defaultExpanded: false
})

const expanded = ref(props.defaultExpanded)

const toggleExpand = () => {
  expanded.value = !expanded.value
}

// 납품율 색상 클래스
const getRateColorClass = () => {
  return getDeliveryRateColor(props.order.deliveryCompletionRate || 0)
}
</script>

<style scoped>
.order-tree-node {
  margin-bottom: 0.75rem;  /* 기존: 1.25rem (40% 축소) */
}

.order-card {
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;  /* 기존: 0.75rem (33% 축소) */
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.order-card:hover {
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
  border-color: #2563eb;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  cursor: pointer;
  transition: background 0.2s;
  flex-wrap: wrap;
}

.order-header:hover {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.expand-btn {
  width: 28px;   /* 기존: 32px (12% 축소) */
  height: 28px;  /* 기존: 32px (12% 축소) */
  border: none;
  background: white;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.expand-btn:hover {
  background: #f9fafb;
  color: #374151;
  transform: scale(1.05);
}

.expand-btn.expanded {
  background: #3b82f6;
  color: white;
}

.expand-btn i {
  font-size: 0.875rem;  /* 폰트 크기 유지 */
}

.order-icon {
  font-size: 1.75rem;  /* 폰트 크기 유지 */
  color: #3b82f6;
  flex-shrink: 0;
}

.delivery-request-no {
  font-size: 1.5rem;
  font-weight: 800;
  color: #2563eb;
  letter-spacing: -0.025em;
  flex-shrink: 0;
}

/* 날짜 정보 */
.date-info {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  background: #f9fafb;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.date-label {
  font-size: 0.875rem;  /* 폰트 크기 유지 */
  font-weight: 600;
  color: #6b7280;
}

.date-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

/* 구분자 */
.separator {
  color: #d1d5db;
  font-weight: 300;
  font-size: 1rem;
  flex-shrink: 0;
}

/* 구분자 - 좁은 간격 (납품요구일-수요기관 사이) */
.separator.narrow {
  margin-left: -0.2rem;
  margin-right: -0.2rem;
}

/* 발주처 */
.client-name {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
}

.client-name i {
  color: #3b82f6;
  font-size: 1rem;
}

/* 프로젝트명 */
.project-name {
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 수량 정보 */
.quantity-info {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 출하 건수 뱃지 */
.shipment-count-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

/* 납품율 뱃지 */
.delivery-rate-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 1.25rem;
  font-weight: 800;
  margin-left: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.delivery-rate-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* 납품율 색상 - 높음 (80-100%) */
.delivery-rate-badge.rate-high {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #166534;
}

/* 납품율 색상 - 중간 (60-80%) */
.delivery-rate-badge.rate-medium {
  background: linear-gradient(135deg, #fef3c7 0%, #fde047 100%);
  color: #92400e;
}

/* 납품율 색상 - 낮음 (30-60%) */
.delivery-rate-badge.rate-low {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #9a3412;
}

/* 납품율 색상 - 매우 낮음 (0-30%) */
.delivery-rate-badge.rate-critical {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

/* ===== 발주 본문 (확장 시) ===== */
.order-body {
  padding: 0.75rem 1rem;  /* 기존: 1.5rem 2rem (50% 축소) */
  background: #f8fafc;
}

.shipments-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;  /* 기존: 1rem (50% 축소) */
}

.shipments-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;            /* 기존: 0.75rem (33% 축소) */
  padding: 0.5rem 0.75rem; /* 기존: 1rem 1.25rem (50% 축소) */
  background: white;
  border: 2px solid #e0e7ff;
  border-radius: 0.5rem;
  font-size: 0.9375rem;  /* 폰트 크기 유지 */
  font-weight: 700;
  color: #4338ca;
}

.shipments-header i {
  font-size: 1.125rem;  /* 폰트 크기 유지 */
  color: #7c3aed;
}

.no-shipments {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;  /* 기존: 3rem (33% 축소) */
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  color: #94a3b8;
  font-size: 0.9375rem;  /* 폰트 크기 유지 */
}

.no-shipments i {
  font-size: 2.5rem;  /* 폰트 크기 유지 */
}

/* ===== 확장/축소 애니메이션 ===== */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 3000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ===== 반응형: 태블릿 (1024px 이하) ===== */
@media (max-width: 1024px) {
  .order-header {
    gap: 0.5rem;
  }

  .separator {
    display: none;
  }

  .project-name {
    flex-basis: 100%;
  }

  .quantity-info {
    order: 10;
  }

  .delivery-rate-badge {
    order: 11;
  }
}

/* ===== 반응형: 모바일 (768px 이하) ===== */
@media (max-width: 768px) {
  .order-header {
    padding: 0.625rem 0.75rem;
    gap: 0.375rem;
  }

  .date-info {
    flex-basis: 100%;
    order: 5;
  }

  .client-name {
    flex-basis: 100%;
    order: 6;
  }

  .project-name {
    flex-basis: 100%;
    order: 7;
  }

  .quantity-info {
    flex-basis: 100%;
    order: 8;
  }

  .delivery-rate-badge {
    font-size: 1.125rem;
    padding: 0.25rem 0.625rem;
    order: 9;
  }

  .delivery-request-no {
    font-size: 1.25rem;
  }

  .order-icon {
    font-size: 1.5rem;
  }

  .order-body {
    padding: 0.5rem 0.75rem;
  }
}
</style>
