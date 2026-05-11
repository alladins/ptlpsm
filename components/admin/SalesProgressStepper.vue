<template>
  <div class="progress-stepper">
    <!-- 메인 6단계 스텝퍼 -->
    <div class="stepper-track">
      <div
        v-for="(step, index) in steps"
        :key="step.value"
        class="step-item"
        :class="{
          active: currentStepIndex >= index && !isSpecialStatus,
          current: step.value === modelValue && !isSpecialStatus,
          clickable: !readonly
        }"
        @click="!readonly && selectStep(step.value)"
      >
        <div class="step-circle">
          <template v-if="currentStepIndex > index && !isSpecialStatus">
            <i class="fas fa-check" />
          </template>
          <template v-else>
            {{ index + 1 }}
          </template>
        </div>
        <div class="step-label">
          {{ step.label }}
        </div>
        <!-- 연결선 -->
        <div
          v-if="index < steps.length - 1"
          class="step-connector"
          :class="{ filled: currentStepIndex > index && !isSpecialStatus }"
        />
      </div>
    </div>

    <!-- 보류/실패 버튼 -->
    <div v-if="!readonly" class="special-status-buttons">
      <button
        type="button"
        class="special-btn hold"
        :class="{ active: modelValue === '보류' }"
        @click="selectStep('보류')"
      >
        <i class="fas fa-pause-circle" />
        보류
      </button>
      <button
        type="button"
        class="special-btn fail"
        :class="{ active: modelValue === '실패' }"
        @click="selectStep('실패')"
      >
        <i class="fas fa-times-circle" />
        실패
      </button>
    </div>

    <!-- 읽기 전용 모드에서 보류/실패 배지 -->
    <div v-if="readonly && isSpecialStatus" class="special-status-badge">
      <span class="badge" :class="modelValue === '보류' ? 'badge-hold' : 'badge-fail'">
        <i :class="modelValue === '보류' ? 'fas fa-pause-circle' : 'fas fa-times-circle'" />
        {{ modelValue }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SALES_PROGRESS_STEPS, SALES_SPECIAL_STATUSES } from '~/types/sales'

interface Props {
  modelValue?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '초기접촉',
  readonly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const steps = SALES_PROGRESS_STEPS

const isSpecialStatus = computed(() =>
  SALES_SPECIAL_STATUSES.includes(props.modelValue as any)
)

const currentStepIndex = computed(() => {
  const index = steps.findIndex(s => s.value === props.modelValue)
  return index >= 0 ? index : -1
})

const selectStep = (value: string) => {
  if (props.readonly) { return }
  emit('update:modelValue', value)
}
</script>

<style scoped>
.progress-stepper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stepper-track {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  z-index: 1;
}

.step-item.clickable {
  cursor: pointer;
}

.step-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  background: #e5e7eb;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
  position: relative;
  z-index: 2;
}

.step-item.active .step-circle {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.step-item.current .step-circle {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.step-item.clickable:hover .step-circle {
  border-color: #93c5fd;
  transform: scale(1.1);
}

.step-label {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.375rem;
  text-align: center;
  white-space: nowrap;
}

.step-item.active .step-label {
  color: #3b82f6;
  font-weight: 600;
}

.step-item.current .step-label {
  color: #2563eb;
  font-weight: 700;
}

/* 연결선 */
.step-connector {
  position: absolute;
  top: 1rem;
  left: calc(50% + 1rem);
  width: calc(100% - 2rem);
  height: 2px;
  background: #e5e7eb;
  z-index: 0;
}

.step-connector.filled {
  background: #3b82f6;
}

/* 보류/실패 버튼 */
.special-status-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.special-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s;
}

.special-btn.hold {
  color: #d97706;
  border-color: #fcd34d;
  background: #fffbeb;
}

.special-btn.hold:hover,
.special-btn.hold.active {
  background: #fef3c7;
  border-color: #f59e0b;
}

.special-btn.fail {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}

.special-btn.fail:hover,
.special-btn.fail.active {
  background: #fee2e2;
  border-color: #ef4444;
}

/* 읽기 전용 보류/실패 배지 */
.special-status-badge {
  display: flex;
  justify-content: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-hold {
  background: #fef3c7;
  color: #d97706;
}

.badge-fail {
  background: #fee2e2;
  color: #dc2626;
}

/* 반응형 */
@media (max-width: 640px) {
  .step-label {
    font-size: 0.6rem;
  }

  .step-circle {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.625rem;
  }

  .step-connector {
    top: 0.75rem;
    left: calc(50% + 0.75rem);
    width: calc(100% - 1.5rem);
  }
}
</style>
