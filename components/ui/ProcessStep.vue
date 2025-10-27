<template>
  <div class="text-center">
    <div class="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">
      {{ step }}
    </div>
    <p class="text-gray-700 font-medium">{{ label }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  step: string
  label: string
}

defineProps<Props>()
</script> 