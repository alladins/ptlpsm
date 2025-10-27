<template>
  <div class="grid md:grid-cols-3 gap-6 my-8">
    <div v-for="card in [...isoCards, ...additionalCards]" :key="card.title" class="relative">
      <div :class="[card.color, 'text-white p-4 flex justify-between items-center']">
        <h3 class="text-lg font-bold">{{ card.title }}</h3>
        <button
          @click="toggleCard(card.title)"
          class="p-1 hover:bg-white/20 rounded-full"
        >
          <PlusIcon class="w-6 h-6" />
        </button>
      </div>
      <div v-if="expandedCard === card.title" class="p-4">
        <ul class="space-y-2">
          <li v-for="(item, index) in card.items" :key="index" class="text-gray-700">
            • {{ item }}
          </li>
        </ul>
        <button class="mt-4 text-purple-600 flex items-center gap-2">
          인증문의 / 글쓰기 바로가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PlusIcon } from 'lucide-vue-next'

const expandedCard = ref(null)

const isoCards = [
  {
    title: 'ISO9001',
    color: 'bg-blue-500',
    items: [
      'ISO9001 (품질경영시스템) 인증 취득 효과',
      'ISO9001 (품질경영시스템) 인증 혜택',
      'ISO9001 (품질경영시스템) 요구 사항 구성'
    ]
  },
  {
    title: 'ISO14001',
    color: 'bg-green-500',
    items: [
      'ISO14001 (환경경영시스템) 인증 취득 효과',
      'ISO14001 (환경경영시스템) 인증 혜택',
      'ISO14001 (환경경영시스템) 요구 사항 구성'
    ]
  },
  {
    title: 'ISO45001',
    color: 'bg-yellow-500',
    items: [
      'ISO45001 (안전보건경영시스템) 필요성',
      'ISO45001 (안전보건경영시스템) 도입 효과',
      'ISO45001 (안전보건경영시스템) 세부적 수혜'
    ]
  }
]

const additionalCards = [
  {
    title: '기업부설연구소',
    color: 'bg-purple-500',
    items: ['개요', '신고방법', '연구전담 요원 자격']
  },
  {
    title: '벤처인증',
    color: 'bg-purple-500',
    items: ['벤처기업이란?', '벤처기업 확인요건', '벤처기업 확인신청 Process']
  },
  {
    title: '이노비즈인증',
    color: 'bg-purple-500',
    items: ['이노비즈란?', '이노비즈 육성종합체계 및 방향', '이노비즈 선정기준 및 절차']
  },
  {
    title: '사업장(사옥) 자금',
    color: 'bg-red-500',
    items: ['사업장(사옥) 자금 확보?', '사업장(사옥) 자금 확보를 위한 컨설팅', '자금 확보 선정기준 및 절차']
  },
  {
    title: '공장부지 자금',
    color: 'bg-red-500',
    items: ['공장부지 자금 확보?', '공장부지 자금 확보를 위한 컨설팅', '자금 확보 선정기준 및 절차']
  },
  {
    title: '시설/운영 자금',
    color: 'bg-red-500',
    items: ['시설/운영 자금 확보?', '시설/운영 자금 확보를 위한 컨설팅', '자금 확보 선정기준 및 절차']
  }
]

const toggleCard = (title) => {
  expandedCard.value = expandedCard.value === title ? null : title
}
</script>

