<!--
  폼 섹션 래퍼 컴포넌트

  목적:
  - 모든 폼의 섹션 구조 통일
  - 일관된 제목 스타일
  - 그리드 레이아웃 지원

  중복 제거:
  - 섹션 HTML 구조: 8개 페이지 × 15줄 = 120줄

  사용 예시:
  title 속성으로 섹션 제목을 전달하고,
  슬롯으로 FormField 컴포넌트들을 전달합니다.
-->
<template>
  <div class="form-section">
    <h2 v-if="title" class="section-title">{{ title }}</h2>
    <p v-if="description" class="section-description">{{ description }}</p>
    <div :class="gridClass">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  /** 섹션 제목 */
  title?: string
  /** 섹션 설명 (선택) */
  description?: string
  /** 그리드 CSS 클래스 (기본: 'form-grid') */
  gridClass?: string
}>(), {
  gridClass: 'form-grid'
})
</script>

<style scoped>
.form-section {
  margin-bottom: 0.1rem; /* 2rem → 1.2rem (40% 감소) */
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.6rem; /* 1rem → 0.6rem (40% 감소) */
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
