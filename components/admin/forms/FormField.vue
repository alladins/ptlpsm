<!--
  폼 필드 래퍼 컴포넌트

  목적:
  - 라벨 + 입력 필드 + 에러 메시지 구조 통일
  - 필수 표시 자동화
  - 에러 스타일링 통일

  중복 제거:
  - 필드 HTML 구조: 8개 페이지 × 평균 20개 필드 × 8줄 = 1,280줄

  사용 예시:
  label, required, error 속성을 전달하고,
  슬롯으로 input, select 등의 폼 요소를 전달합니다.
-->
<template>
  <div class="form-field" :class="{ 'form-field--full': fullWidth, 'form-field--error': !!error }">
    <label v-if="label" class="form-label">
      <!-- ⚠ 라벨명은 반드시 span 으로 감싼다. 맨 텍스트로 두면 flex 안에서 줄바꿈되어
           "가공비" 가 "가공 / 비" 로 쪼개진다. -->
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="required-mark">*</span>
      <!-- 짧은 부연은 라벨 옆에 괄호로 붙인다. 아래 hint 로 내리면 줄이 늘어나 답답해진다 -->
      <span v-if="labelNote" class="label-note">({{ labelNote }})</span>
    </label>

    <div class="form-input-wrapper">
      <slot />
    </div>

    <p v-if="error" class="form-error">
      {{ error }}
    </p>
    <p v-else-if="hint" class="form-hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** 필드 라벨 */
  label?: string
  /** 필수 여부 (빨간 별표 표시) */
  required?: boolean
  /** 에러 메시지 */
  error?: string
  /** 도움말 메시지 (입력칸 아래에 한 줄로) */
  hint?: string
  /** 라벨 옆에 괄호로 붙는 짧은 부연 (hint 보다 짧게 쓸 것) */
  labelNote?: string
  /** 전체 너비 사용 (그리드에서 2칸 차지) */
  fullWidth?: boolean
}>()
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* 라벨명은 절대 접히지 않는다 */
.label-text {
  flex-shrink: 0;
  white-space: nowrap;
}

/* 라벨 옆 괄호 부연 — 라벨보다 한 단계 작고 흐리게. 좁으면 여기만 줄바꿈된다 */
.label-note {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94a3b8;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.required-mark {
  color: #ef4444;
  font-size: 1rem;
}

.form-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 에러 상태 */
.form-field--error :deep(input),
.form-field--error :deep(select),
.form-field--error :deep(textarea) {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.form-field--error :deep(input:focus),
.form-field--error :deep(select:focus),
.form-field--error :deep(textarea:focus) {
  outline-color: #ef4444;
  border-color: #ef4444;
}

.form-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: -0.25rem;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: -0.25rem;
}
</style>
