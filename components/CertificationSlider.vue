<template>
  <div class="relative w-full overflow-hidden h-[200px]">
    <div 
      class="flex transition-transform duration-500 ease-in-out h-full"
      :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
    >
      <div
        v-for="slide in slides"
        :key="slide.id"
        :class="['flex-shrink-0 w-full h-full text-white px-8 py-6', slide.bgColor]"
      >
        <div class="container mx-auto">
          <h2 class="text-3xl font-bold mb-4">{{ slide.title }}</h2>
          <p class="text-lg">{{ slide.description }}</p>
        </div>
      </div>
    </div>
    <div class="absolute top-4 right-4 flex gap-2">
      <button
        v-for="(_, index) in slides"
        :key="index"
        :class="[
          'w-3 h-3 rounded-full',
          currentSlide === index ? 'bg-white' : 'bg-white/50'
        ]"
        @click="setCurrentSlide(index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const slides = [
  {
    id: 1,
    title: 'No.1 전국 최소비용 보장',
    description: '기업규모와 특성에 맞는 최소비용제시로 비용절감 효과를 저희가 책임졌습니다.',
    bgColor: 'bg-blue-600'
  },
  {
    id: 2,
    title: 'No.1 전국 빠른인증 보장',
    description: '고객이 원하시는 날에 즉시표준 규격 ISO인증 취득을 저희가 책임졌습니다.',
    bgColor: 'bg-blue-500'
  },
  {
    id: 3,
    title: 'No.1 고객만족 최우선 !!!',
    description: '신속, 정확, 친절한 상담으로 고객만족과 무료자우편리를 저희가 책임졌습니다.',
    bgColor: 'bg-blue-400'
  }
]

const currentSlide = ref(0)
let timer

const setCurrentSlide = (index) => {
  currentSlide.value = index
}

onMounted(() => {
  timer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 5000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

