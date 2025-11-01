<template>
  <div class="delivery-rate-bar" :class="{ 'compact-mode': compact }">
    <!-- Compact 모드: 인라인 미니 프로그레스 바 -->
    <div v-if="compact" class="inline-progress">
      <div
        class="progress-fill"
        :class="getRateClass(rate)"
        :style="{ width: `${rate}%` }"
        :title="`납품율: ${rate.toFixed(1)}% (${completed.toLocaleString()} / ${total.toLocaleString()} ${unit})`"
      ></div>
    </div>

    <!-- Full 모드: 기존 디자인 -->
    <template v-else>
      <div class="rate-info">
        <span class="rate-label">납품율</span>
        <span class="rate-value" :class="getRateClass(rate)">
          {{ rate.toFixed(1) }}%
        </span>
        <span v-if="showLabel" class="rate-detail">
          ({{ completed.toLocaleString() }} / {{ total.toLocaleString() }} {{ unit }})
        </span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :class="getRateClass(rate)"
          :style="{ width: `${rate}%` }"
        >
          <span v-if="rate >= 15" class="progress-text">{{ rate.toFixed(0) }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rate: number          // 납품율 (0-100)
  total: number         // 전체 수량
  completed: number     // 완료 수량
  unit?: string         // 단위 (㎡, 개 등)
  showLabel?: boolean   // 라벨 표시 여부
  compact?: boolean     // 컴팩트 모드 (인라인 미니 바)
}

const props = withDefaults(defineProps<Props>(), {
  unit: '개',
  showLabel: true,
  compact: false
})

/**
 * 납품율에 따른 색상 클래스 반환
 * 0-30%: 빨강 (위험)
 * 31-60%: 주황 (주의)
 * 61-80%: 노랑 (양호)
 * 81-100%: 초록 (우수)
 */
const getRateClass = (rate: number): string => {
  if (rate <= 30) return 'rate-danger'
  if (rate <= 60) return 'rate-warning'
  if (rate <= 80) return 'rate-good'
  return 'rate-excellent'
}
</script>

<style scoped>
.delivery-rate-bar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Compact 모드: 인라인 미니 프로그레스 바 */
.delivery-rate-bar.compact-mode {
  display: inline-flex;
  width: auto;
}

.inline-progress {
  width: 80px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  cursor: help;
}

.inline-progress .progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.rate-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.rate-label {
  font-weight: 500;
  color: #6b7280;
}

.rate-value {
  font-weight: 700;
  font-size: 1rem;
}

.rate-detail {
  color: #9ca3af;
  font-size: 0.8125rem;
}

/* 납품율 색상 */
.rate-danger {
  color: #dc2626;
}

.rate-warning {
  color: #ea580c;
}

.rate-good {
  color: #ca8a04;
}

.rate-excellent {
  color: #16a34a;
}

/* 프로그레스 바 */
.progress-bar {
  width: 100%;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease, background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  position: relative;
}

.progress-fill.rate-danger {
  background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
}

.progress-fill.rate-warning {
  background: linear-gradient(90deg, #ea580c 0%, #f97316 100%);
}

.progress-fill.rate-good {
  background: linear-gradient(90deg, #ca8a04 0%, #eab308 100%);
}

.progress-fill.rate-excellent {
  background: linear-gradient(90deg, #16a34a 0%, #22c55e 100%);
}

.progress-text {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 반응형 */
@media (max-width: 768px) {
  .rate-info {
    flex-wrap: wrap;
  }

  .rate-detail {
    width: 100%;
  }

  .progress-bar {
    height: 20px;
  }

  .progress-text {
    font-size: 0.625rem;
  }

  /* Compact 모드: 모바일에서 전체 폭 사용 */
  .inline-progress {
    width: 100%;
    height: 8px;
  }
}
</style>
