<template>
  <div class="button-section">
    <button type="button" @click="$emit('cancel')" class="btn-secondary">
      {{ cancelLabel || '취소' }}
    </button>
    <button type="submit" :disabled="submitting" class="btn-primary">
      <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
      {{ submitLabel || '저장' }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  submitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

withDefaults(defineProps<Props>(), {
  submitting: false,
  submitLabel: '저장',
  cancelLabel: '취소'
})

defineEmits<{
  cancel: []
}>()
</script>

<style scoped>
/* 스타일은 admin-common.css에서 자동 로드됨 */
</style>
