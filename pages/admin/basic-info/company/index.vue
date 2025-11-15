<script setup lang="ts">
/**
 * /admin/basic-info/company 접근 시 자동으로 list 페이지로 리다이렉트
 */
definePageMeta({
  layout: 'admin'
})

// 즉시 리다이렉트
await navigateTo('/admin/basic-info/company/list', { replace: true })
</script>

<template>
  <div></div>
</template>
