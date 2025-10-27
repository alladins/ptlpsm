<template>
  <header 
    style="position: fixed; width: 100%; transition: all 0.3s ease; z-index: 50; background-color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); color: #1f2937;"
  >
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
        <NuxtLink to="/" style="flex-shrink: 0;">
          <img 
            src="/images/common/logo.png" 
            alt="PTPLPSM 출하관리 시스템" 
            width="100" 
            height="50" 
            style="height: auto; width: 100px; transition: all 0.3s ease; object-fit: contain;"
            loading="eager"
          />
        </NuxtLink>

        <nav class="hidden md:flex space-x-1">
          <div
            v-for="(item, index) in menuItems"
            :key="index"
            class="relative menu-item"
          >
            <NuxtLink
              :to="item.href"
              class="px-6 py-8 transition-colors duration-200 menu-link"
              :class="[
                isScrolled ? 'text-gray-800 hover:text-primary' : 
                (route.path === '/' ? 'text-white hover:text-gray-200' : 'text-gray-800 hover:text-primary')
              ]"
            >
              {{ item.title }}
            </NuxtLink>
            
            <div
              v-if="item.submenu"
              class="submenu absolute left-0 top-full w-48 bg-white shadow-lg rounded-b-lg py-2 z-[200] border border-gray-200"
            >
              <NuxtLink
                v-for="(subitem, subindex) in item.submenu"
                :key="subindex"
                :to="subitem.href"
                class="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                {{ subitem.title }}
              </NuxtLink>
            </div>
          </div>
        </nav>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <!--button 
            style="display: none; width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; color: #1f2937; border: 2px solid #1f2937; background: transparent; cursor: pointer;"
            @click="isAllMenuOpen = !isAllMenuOpen"
          >
            <span class="sr-only">사이트맵</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <button 
            style="width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; background-color: #f3f4f6; color: #374151; border: none; cursor: pointer;"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <span class="sr-only">메뉴 열기</span>
            <svg 
              v-if="!isMobileMenuOpen" 
              class="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg 
              v-else 
              class="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button-->
        </div>
      </div>

      <!-- PC 사이트맵 -->
      <!--div 
        v-show="isAllMenuOpen" 
        class="fixed inset-0 bg-black bg-opacity-50 z-[998]"
        @click.self="isAllMenuOpen = false"
      >
        <div class="site-menu-nav">
          <div class="inner">
            <div class="menu-grid">
              <div v-for="(item, index) in computedMenuItems" :key="index" class="menu-column">
                <h3>{{ item.title }}</h3>
                <ul v-if="item.submenu">
                  <li v-for="(subitem, subindex) in item.submenu" :key="subindex">
                    <NuxtLink :to="subitem.href" class="submenu-link" @click="isAllMenuOpen = false">
                      {{ subitem.title }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <button 
            class="absolute top-4 right-4 text-white"
            @click="isAllMenuOpen = false"
          >
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 모바일 메뉴 -->
      <div  
        v-show="isMobileMenuOpen" 
        class="mobile-menu-wrapper fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden"
      >
        <div class="mobile-menu-nav bg-primary h-full w-4/5 max-w-sm overflow-y-auto">
          <div class="inner p-6">
            <div class="menu-grid">
              <div v-for="(item, index) in computedMenuItems" :key="index" class="menu-column mb-6">
                <h3 class="text-xl font-bold text-white mb-3">{{ item.title }}</h3>
                <ul v-if="item.submenu" class="space-y-2">
                  <li v-for="(subitem, subindex) in item.submenu" :key="subindex">
                    <NuxtLink :to="subitem.href" class="submenu-link text-gray-200 hover:text-white block py-1" @click="isMobileMenuOpen = false">
                      {{ subitem.title }}
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <button 
            class="absolute top-4 right-4 text-white"
            @click="isMobileMenuOpen = false"
          >
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from '#imports'
import { useHead } from '#imports'

// Google 태그는 nuxt.config.ts에서 전역으로 설정됨

const hoveredIndex = ref(null)
const isMobileMenuOpen = ref(false)
const openMobileMenuIndex = ref(null)
const isScrolled = ref(false)
const isAllMenuOpen = ref(false)

const route = useRoute()

const toggleMobileSubmenu = (index) => {
  openMobileMenuIndex.value = openMobileMenuIndex.value === index ? null : index
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 초기 로드 시 스크롤 상태 확인
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const menuItems = [
  // {
  //   title: '회사소개',
  //   href: '/about/greeting',
  //   submenu: [
  //     { title: '서비스 소개', href: '/about/greeting' },
  //     { title: '연혁', href: '/about/history' },
  //     //{ title: '조직도', href: '/about/organization' },
  //     { title: '찾아오시는 길', href: '/about/location' },
  //     { title: '상담 현황', href: '/inquiry/consultation' },
  //     { title: '상담 신청', href: '/consultation' }
  //   ]
  // },
  // {
  //   title: '창업문의',
  //   href: '/inquiry/estacomp',
  //   submenu: [
  //     { title: '법인설립', href: '/inquiry/estacomp' },
  //     { title: '창업자금', href: '/inquiry/quote' },
  // //    { title: '자주하는 질문', href: '/inquiry/faq' }
  //   ]
  // },  
  // {
  //   title: 'ISO 및 제품 인증',
  //   href: '/system/iso9001',
  //   submenu: [
  //     { title: 'ISO 9001', href: '/system/iso9001' },
  //     { title: 'ISO 14001', href: '/system/iso14001' },
  //     { title: 'ISO 45001', href: '/system/iso45001' },
  // //    { title: '기타인증', href: '/system/etc_ceti' },      
  // //  { title: '인증절차', href: '/system/cert_process' },
  //     { title: 'KS 인증', href: '/product/ks' },
  //     { title: 'KC 인증', href: '/product/kc' },
  //     { title: 'CE 인증', href: '/product/ce' },
  //     { title: '단체표준', href: '/product/standard' }
  //   ]
  // },
  // {
  //   title: '경영인증',
  //   href: '/management/research-lab',
  //   submenu: [
  //     { title: '기업부설연구소', href: '/management/research-lab' },
  //     { title: '벤처기업', href: '/management/venture' },
  //     { title: '이노비즈', href: '/management/innobiz' },
  //     { title: '메인비즈', href: '/management/mainbiz' }
  //   ]
  // },
  // {
  //   title: '정책자금',
  //   href: '/policy-funds/operating',
  //   submenu: [
  //   { title: '운영자금', href: '/policy-funds/operating' },
  //   { title: '시설자금', href: '/policy-funds/facilities' }
  //   ]
  // },
  // {
  //   title: '공장 컨설팅',
  //   href: '/policy-funds/factory-consulting',
  //   submenu: [
  //   { title: '공장 컨설팅', href: '/policy-funds/factory-consulting' }
  // //    { title: '창업 컨설팅', href: '/policy-funds/estacomp-consulting' }
  //   ]
  // }
  //{
  //  title: '커뮤니티',
  //  href: '/community/notice',
  //  submenu: [
  //    { title: '공지사항', href: '/community/notice' },
  //    { title: '수행실적', href: '/community/news' },
  //    { title: '견적현황', href: '/community/resources' }
  //  ]
  //  }
]

const computedMenuItems = computed(() => {
  return menuItems.filter(item => item.title && item.href)
})
</script>

<style scoped>
.main-header {
  position: fixed;
  width: 100%;
  z-index: 50;
  transition: all 0.3s ease;
}

.main-header.scrolled {
  background-color: rgba(1, 113, 65, 0.95) !important;
}

.bg-primary {
  background-color: rgba(1, 113, 65, 0.95);
}

.bg-dark {
  background-color: #1a1a1a;
}

.text-primary {
  color: #017141;
}

.hover\:text-primary:hover {
  color: #017141;
}

.hover\:bg-primary:hover {
  background-color: rgba(1, 113, 65, 0.90);
}

.hover\:text-white:hover {
  color: #fff;
}

/* 서브메뉴 스타일 수정 */
.menu-item {
  position: relative;
}

.menu-item .submenu {
  display: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 200;
  min-width: 180px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.menu-item:hover .submenu {
  display: block !important;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* 추가 스타일 */
header {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.submenu {
  pointer-events: auto;
}

.submenu a {
  transition: all 0.2s ease;
  position: relative;
}

.submenu a:hover {
  background-color: #f3f4f6;
  padding-left: 1.25rem;
}

/* Removed unused .logo class - logo is now directly in <img> tag */

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-wrapper {
  position: fixed;
  top: 80px;
  left: 0;
  width: 100%;
  height: calc(100vh - 80px);
  z-index: 999;
  overflow-y: auto;
}

.site-menu-nav {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  z-index: 999;
  overflow-y: auto;
}

.mobile-menu-nav {
  position: fixed;
  top: 80px;
  right: 0;
  width: 100%;
  height: calc(100vh - 80px);
  background: rgba(0, 0, 0, 0.95);
  z-index: 999;
  overflow-y: auto;
}

.site-menu-nav .inner,
.mobile-menu-nav .inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 130px 50px 80px 50px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  color: #fff;
}

.menu-column h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #017141;
}

.menu-column ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.submenu-link {
  color: #fff;
  font-size: 16px;
  transition: color 0.3s;
  padding: 5px 0;
  display: block;
}

.submenu-link:hover {
  color: #017141;
}

@media (max-width: 767px) {
  .site-menu-nav .inner,
  .mobile-menu-nav .inner {
    padding: 100px 30px 60px 30px;
  }

  .menu-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .menu-column h3 {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .submenu-link {
    font-size: 15px;
  }
}
</style>

