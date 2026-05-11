<template>
  <div class="accordion-section" :class="{ expanded: isExpanded }">
    <div class="accordion-header" @click="toggle">
      <div class="accordion-header-left">
        <i class="fas" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'" />
        <span class="accordion-title">{{ title }}</span>
      </div>
      <span v-if="summary && !isExpanded" class="accordion-summary">{{ summary }}</span>
    </div>
    <div v-show="isExpanded" class="accordion-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  title: string
  summary?: string
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  summary: '',
  defaultExpanded: false
})

const isExpanded = ref(props.defaultExpanded)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}

// 외부에서 열기/닫기 제어
defineExpose({ isExpanded, toggle })
</script>

<style scoped>
.accordion-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #fff;
}

.accordion-section.expanded {
  border-color: #d1d5db;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  cursor: pointer;
  background: #f9fafb;
  transition: background-color 0.2s;
  user-select: none;
}

.accordion-header:hover {
  background: #f3f4f6;
}

.accordion-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.accordion-header-left i {
  font-size: 0.75rem;
  color: #6b7280;
  width: 1rem;
  text-align: center;
  transition: transform 0.2s;
}

.accordion-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.accordion-summary {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-left: 0.5rem;
}

.accordion-body {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
