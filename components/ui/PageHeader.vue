<template>
  <div class="page-header">
    <div class="header-content">
      <div class="header-text">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
      <div v-if="slots.actions" class="header-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

interface Props {
  /** 페이지 제목 */
  title: string
  /** 페이지 설명 (선택) */
  description?: string
}

defineProps<Props>()

const slots = useSlots()
</script>

<style scoped>
/* 최적화: 헤더 영역 축소 (적당한 여백 유지) */
.page-header {
  margin-bottom: 0.75rem;     /* 적당한 간격 */
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;      /* center → flex-end (아래쪽 정렬) */
  gap: 1rem;
  min-height: 32px;
}

.header-text {
  flex: 1;
  min-width: 0; /* flex 아이템이 overflow되지 않도록 */
}

.page-title {
  font-size: 1.125rem;        /* 1.25rem → 1.125rem */
  font-weight: 700;
  color: #111827;
  margin: 0;                  /* 0.125rem → 0 */
  line-height: 1.2;
}

.page-description {
  font-size: 0.75rem;         /* 0.8125rem → 0.75rem */
  color: #6b7280;
  margin: 0;
  line-height: 1.3;           /* 가독성 유지하며 축소 */
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0; /* 액션 버튼은 축소되지 않도록 */
}

/* 반응형 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 1.125rem;      /* 1.25rem → 1.125rem (모바일 추가 축소) */
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .header-actions button {
    flex: 0 1 auto;
  }
}
</style>
