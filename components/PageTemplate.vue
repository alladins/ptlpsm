<template>
    <div>
      <div class="page-header" :style="headerStyle">
        <div class="container mx-auto">
          <div class="header-content">
            <div class="title-wrapper">
              <div class="page-category">{{ currentPageType }}</div>
              <h1 class="text-3xl font-bold">{{ title }}</h1>
              <p v-if="description">{{ description }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="container mx-auto">
        <div class="page-content px-4 py-8">
          <slot></slot>
        </div>
      </div>
    </div>
</template>
  
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#imports'

interface Props {
  title: string
  description?: string
  pageType?: string
}

const props = defineProps<Props>()
const route = useRoute()

// 현재 경로에서 첫 번째 세그먼트를 추출하여 pageType 결정
const currentPageType = computed(() => {
  const pathSegments = route.path.split('/')
  const mainSegment = pathSegments[1] // 첫 번째 경로 세그먼트
  
  switch (mainSegment) {
    case 'about':
      return 'ABOUT'
    case 'system':
      return 'SYSTEM'
    case 'product':
      return 'PRODUCT'
    case 'management':
      return 'MANAGEMENT'
    case 'policy-funds':
      return 'POLICY FUND'
    case 'inquiry':
      return 'INQUIRY'
    case 'consultation':
      return 'INQUIRY'
    default:
      return 'HOME'
  }
})

const backgroundImages = {
  'ABOUT': '/images/common/bg_company.png',
  'SYSTEM': '/images/common/bg_system.png',
  'PRODUCT': '/images/common/bg_product.png',
  'MANAGEMENT': '/images/common/bg_management.png',
  'POLICY FUND': '/images/common/bg_inquiry.png',
  'INQUIRY': '/images/common/bg_company.png',
  'HOME': '/images/common/bg_company.png'
}

const headerStyle = computed(() => ({
  backgroundImage: `url(${backgroundImages[currentPageType.value as keyof typeof backgroundImages]})`
}))
</script>
  
<script lang="ts">
export default {
  name: 'PageTemplate'
}
</script>

<style scoped>
.page-header {
  height: 250px;
  position: relative;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  display: flex;
  align-items: center;
  width: 100vw;
}

.header-content {
  width: 100%;
  color: #fff;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 4rem 0;
}

.title-wrapper {
  text-align: center;
  margin-top: 5rem;
}

.page-category {
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  opacity: 0.9;
  letter-spacing: 0.05em;
  padding-top: 1rem;
}

.header-content h1 {
  margin: 0.5rem 0;
  color: #fff;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-content p {
  font-size: 0.875rem;
  opacity: 0.9;
  color: #fff;
  margin-top: 0.25rem;
  margin-bottom: 1rem;
}

.page-content {
  background: #fff;
}
</style>  