<template>
  <div v-if="modelValue" class="alert-popup">
    <div class="alert-content">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ message || '계약금액이 품목 합산금액과 다릅니다.' }}</span>
      <button class="alert-close" @click="$emit('update:modelValue', false)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '계약금액이 품목 합산금액과 다릅니다.'
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
/* 스타일은 admin-common.css에서 자동 로드됨 */
</style>
