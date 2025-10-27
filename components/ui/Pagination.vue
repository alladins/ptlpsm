<template>
  <div v-if="totalPages > 0" class="pagination">
    <!-- 이전 버튼 -->
    <button
      :disabled="currentPage === 0 || disabled"
      @click="$emit('change', currentPage - 1)"
      class="pagination-btn"
      aria-label="이전 페이지"
    >
      이전
    </button>

    <!-- 페이지 번호들 -->
    <div class="page-numbers">
      <button
        v-for="pageNum in visiblePages"
        :key="pageNum"
        @click="$emit('change', pageNum)"
        :class="['page-number', { active: pageNum === currentPage }]"
        :disabled="pageNum === currentPage || disabled"
        :aria-label="`${pageNum + 1}페이지`"
        :aria-current="pageNum === currentPage ? 'page' : undefined"
      >
        {{ pageNum + 1 }}
      </button>
    </div>

    <!-- 다음 버튼 -->
    <button
      :disabled="currentPage >= totalPages - 1 || disabled"
      @click="$emit('change', currentPage + 1)"
      class="pagination-btn"
      aria-label="다음 페이지"
    >
      다음
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PAGINATION } from '~/utils/constants'

interface Props {
  /** 현재 페이지 (0부터 시작) */
  currentPage: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 비활성화 여부 */
  disabled?: boolean
  /** 표시할 페이지 번호 개수 (현재 페이지 기준 앞뒤) */
  displayCount?: number
}

interface Emits {
  (e: 'change', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  displayCount: PAGINATION.PAGE_NUMBER_DISPLAY_COUNT
})

const emit = defineEmits<Emits>()

/**
 * 표시할 페이지 번호 배열
 */
const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(0, props.currentPage - props.displayCount)
  const end = Math.min(props.totalPages - 1, props.currentPage + props.displayCount)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem 0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(:disabled):not(.active) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.page-number.active {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  cursor: default;
}

.page-number:disabled {
  cursor: not-allowed;
}

/* 반응형 */
@media (max-width: 640px) {
  .pagination {
    gap: 0.25rem;
  }

  .pagination-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }

  .page-number {
    min-width: 2rem;
    height: 2rem;
    padding: 0.375rem;
    font-size: 0.8125rem;
  }
}
</style>
