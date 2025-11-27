<template>
  <!-- 컴팩트 모드: 인라인 디스플레이 -->
  <div v-if="compact" class="delivery-status-card compact">
    <div class="compact-layout">
      <!-- 수량 정보 (컴팩트) -->
      <div class="compact-quantity">
        <span class="quantity-completed">{{ formatQuantity(completed) }}</span>
        <span class="quantity-separator">/</span>
        <span class="quantity-total">{{ formatQuantity(total) }}</span>
        <span class="quantity-unit">{{ unit }}</span>
      </div>

      <!-- 진행중 정보 -->
      <div class="compact-in-progress" v-if="inProgress > 0">
        <i class="fas fa-truck-loading"></i>
        <span>{{ formatQuantity(inProgress) }} {{ unit }}</span>
      </div>

      <!-- 프로그레스 바 (컴팩트) -->
      <div class="compact-progress-bar">
        <div
          class="progress-segment completed"
          :style="{ width: `${completedPercent}%` }"
          :title="`납품완료: ${formatQuantity(completed)} ${unit} (${completedPercent.toFixed(1)}%)`"
        ></div>
        <div
          class="progress-segment in-progress"
          :style="{ width: `${inProgressPercent}%` }"
          :title="`진행중: ${formatQuantity(inProgress)} ${unit} (${inProgressPercent.toFixed(1)}%)`"
        ></div>
      </div>
    </div>
  </div>

  <!-- 일반 모드: 기존 디자인 -->
  <div v-else class="delivery-status-card">
    <!-- 수량 정보 -->
    <div class="quantity-display">
      <div class="quantity-main">
        <span class="quantity-completed">{{ formatQuantity(completed) }}</span>
        <span class="quantity-separator">/</span>
        <span class="quantity-total">{{ formatQuantity(total) }}</span>
        <span class="quantity-unit">{{ unit }}</span>
      </div>
      <div class="quantity-rate" :class="getRateColorClass()">
        {{ rate.toFixed(1) }}%
      </div>
    </div>

    <!-- 세그먼트 프로그레스 바 -->
    <div class="progress-bar-container">
      <div class="progress-bar">
        <!-- 납품완료 (녹색) -->
        <div
          class="progress-segment completed"
          :style="{ width: `${completedPercent}%` }"
          :title="`납품완료: ${formatQuantity(completed)} ${unit} (${completedPercent.toFixed(1)}%)`"
        ></div>

        <!-- 진행중 (주황색) -->
        <div
          class="progress-segment in-progress"
          :style="{ width: `${inProgressPercent}%` }"
          :title="`진행중: ${formatQuantity(inProgress)} ${unit} (${inProgressPercent.toFixed(1)}%)`"
        ></div>

        <!-- 미진행 (회색) - 자동으로 남은 공간 채움 -->
      </div>
    </div>

    <!-- 상세 정보 -->
    <div class="status-details">
      <div class="status-item completed">
        <i class="fas fa-check-circle"></i>
        <span>납품완료</span>
        <span class="status-value">{{ formatQuantity(completed) }} {{ unit }}</span>
      </div>
      <div class="status-item in-progress">
        <i class="fas fa-truck-loading"></i>
        <span>진행중</span>
        <span class="status-value">{{ formatQuantity(inProgress) }} {{ unit }}</span>
      </div>
      <div class="status-item pending">
        <i class="fas fa-clock"></i>
        <span>미진행</span>
        <span class="status-value">{{ formatQuantity(pending) }} {{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatQuantity } from '~/utils/format'
import { getDeliveryRateColor } from '~/utils/delivery'

interface Props {
  total: number          // 전체 발주 수량
  completed: number      // 납품완료 수량
  inProgress: number     // 진행중 수량
  unit: string           // 단위
  rate: number           // 납품율
  compact?: boolean      // 컴팩트 모드 (인라인 디스플레이용)
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

// 미진행 수량 계산
const pending = computed(() => {
  return Math.max(0, props.total - props.completed - props.inProgress)
})

// 각 세그먼트의 퍼센트 계산
const completedPercent = computed(() => {
  return props.total > 0 ? (props.completed / props.total) * 100 : 0
})

const inProgressPercent = computed(() => {
  return props.total > 0 ? (props.inProgress / props.total) * 100 : 0
})

// 납품율에 따른 색상 클래스
const getRateColorClass = () => {
  return getDeliveryRateColor(props.rate)
}
</script>

<style scoped>
.delivery-status-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

/* 수량 정보 디스플레이 */
.quantity-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quantity-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.quantity-completed {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

.quantity-separator {
  color: #9ca3af;
  font-weight: 400;
}

.quantity-total {
  color: #374151;
}

.quantity-unit {
  color: #6b7280;
  font-size: 1rem;
}

.quantity-rate {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
}

/* 납품율 색상 */
.quantity-rate.rate-high {
  color: #10b981;
}

.quantity-rate.rate-medium {
  color: #f59e0b;
}

.quantity-rate.rate-low {
  color: #f97316;
}

.quantity-rate.rate-critical {
  color: #ef4444;
}

/* 프로그레스 바 */
.progress-bar-container {
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.progress-segment {
  height: 100%;
  transition: width 0.3s ease, background-color 0.2s;
}

.progress-segment.completed {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.progress-segment.in-progress {
  background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
}

/* 상세 정보 */
.status-details {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-item i {
  font-size: 1rem;
}

.status-item.completed {
  color: #10b981;
}

.status-item.in-progress {
  color: #f97316;
}

.status-item.pending {
  color: #6b7280;
}

.status-value {
  font-weight: 600;
  margin-left: 0.25rem;
}

/* 반응형 - 모바일 */
@media (max-width: 768px) {
  .delivery-status-card {
    padding: 0.875rem 1rem;
    gap: 0.625rem;
  }

  .quantity-main {
    font-size: 1rem;
  }

  .quantity-completed {
    font-size: 1.25rem;
  }

  .quantity-rate {
    font-size: 1.5rem;
  }

  .progress-bar {
    height: 16px;
  }

  .status-details {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .status-item {
    font-size: 0.8125rem;
  }

  .status-item i {
    font-size: 0.875rem;
  }
}

/* 호버 효과 */
.delivery-status-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 프로그레스 바 호버 시 세그먼트 강조 */
.progress-segment:hover {
  opacity: 0.9;
  cursor: pointer;
}

/* ========================================
   컴팩트 모드 스타일 (인라인 디스플레이용)
   ======================================== */

.delivery-status-card.compact {
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  min-width: 350px;
  max-width: 400px;
}

.delivery-status-card.compact:hover {
  border-color: transparent;
  box-shadow: none;
}

.compact-layout {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

/* 컴팩트 수량 정보 */
.compact-quantity {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  font-size: 1rem;
  font-weight: 600;
  white-space: nowrap;
}

.compact-quantity .quantity-completed {
  font-size: 1.125rem;
  font-weight: 700;
  color: #10b981;
}

.compact-quantity .quantity-separator {
  color: #9ca3af;
  font-weight: 400;
}

.compact-quantity .quantity-total {
  color: #374151;
  font-size: 1rem;
}

.compact-quantity .quantity-unit {
  color: #6b7280;
  font-size: 0.875rem;
}

/* 컴팩트 진행중 정보 */
.compact-in-progress {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  color: #9a3412;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.compact-in-progress i {
  font-size: 0.875rem;
}

/* 컴팩트 프로그레스 바 */
.compact-progress-bar {
  flex: 1;
  min-width: 120px;
  height: 14px;
  background: #f3f4f6;
  border-radius: 7px;
  overflow: hidden;
  display: flex;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 컴팩트 모드 반응형 - 태블릿 */
@media (max-width: 1024px) {
  .delivery-status-card.compact {
    min-width: 0;
    max-width: 100%;
  }

  .compact-layout {
    flex-wrap: wrap;
    gap: 0.625rem;
  }

  .compact-progress-bar {
    width: 100%;
    min-width: 0;
  }
}

/* 컴팩트 모드 반응형 - 모바일 */
@media (max-width: 768px) {
  .compact-layout {
    padding: 0.375rem 0.75rem;
    gap: 0.5rem;
  }

  .compact-quantity {
    font-size: 0.875rem;
  }

  .compact-quantity .quantity-completed {
    font-size: 1rem;
  }

  .compact-in-progress {
    font-size: 0.8125rem;
    padding: 0.1875rem 0.5rem;
  }

  .compact-progress-bar {
    height: 12px;
  }
}
</style>
