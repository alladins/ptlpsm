<template>
  <div :class="{ 'is-index': $route.path === '/' }">
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M7D836N4"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    <header :class="['main-header', { 'scrolled': isScrolled }]">
      <AppHeader />
    </header>
    <main :class="{ 'page-index': route?.path === '/' }">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from '#imports'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'

const route = useRoute()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 초기 상태 체크
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style>
/* 헤더 아래 컨텐츠가 헤더에 가리지 않도록 패딩 추가 */
main {
  padding-top: 0px;
}

/* 메인 페이지는 패딩 제거 (비주얼 영역이 헤더와 겹치도록) */
main.page-index {
  padding-top: 0;
}
</style>

