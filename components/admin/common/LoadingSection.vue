<template>
  <div class="loading-section">
    <i class="fas fa-spinner fa-spin"></i>
    <span>{{ message || '데이터를 불러오는 중...' }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '데이터를 불러오는 중...'
})
</script>

<style scoped>
/* 스타일은 admin-common.css에서 자동 로드됨 */
</style>
