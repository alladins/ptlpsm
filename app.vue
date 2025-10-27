<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// 정적 메타 데이터는 nuxt.config.ts에서 관리

// Google 태그 직접 설정
useHead({
  script: [
    {
      src: 'https://www.googletagmanager.com/gtag/js?id=AW-16935488485',
      async: true
    },
    {
      innerHTML: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-16935488485');
      `,
      type: 'text/javascript'
    }
  ]
})
</script>

