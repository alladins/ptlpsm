<template>
  <div class="error-section">
    <i class="fas fa-exclamation-triangle"></i>
    <span>{{ message || '데이터를 찾을 수 없습니다.' }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '데이터를 찾을 수 없습니다.'
})
</script>

<style scoped>
/* 스타일은 admin-common.css에서 자동 로드됨 */
</style>
