<template>
  <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <h3 class="text-lg font-semibold mb-3 text-gray-800">{{ title }}</h3>
    <p class="text-gray-600">{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  content: string
}

defineProps<Props>()
</script> 