<template>
  <Teleport to="body">
    <div v-if="open" class="guide-overlay" role="dialog" aria-modal="true" aria-label="납품확인 사용 안내">
      <!-- 모달 카드 -->
      <div class="guide-card">
        <!-- 우상단 닫기 버튼 -->
        <button
          type="button"
          class="btn-close"
          aria-label="닫기"
          @click="handleClose"
        >
          <i class="fas fa-times" />
        </button>

        <!-- 진행 도트 -->
        <div class="step-dots" aria-label="진행 단계">
          <span
            v-for="(_, idx) in STEPS"
            :key="idx"
            class="dot"
            :class="{ active: idx === currentStep }"
          />
        </div>

        <!-- 스텝 콘텐츠 -->
        <div class="step-content">
          <i class="fas step-icon" :class="currentStepData.icon" />
          <h3 class="step-title">
            {{ currentStepData.title }}
          </h3>
          <p class="step-desc">
            {{ currentStepData.desc }}
          </p>
        </div>

        <!-- 하단 액션바 -->
        <div class="action-bar">
          <!-- 좌측: 다시 보지 않기 -->
          <label class="dont-show-label">
            <input
              v-model="dontShowAgain"
              type="checkbox"
              class="dont-show-checkbox"
            >
            다시 보지 않기
          </label>

          <!-- 우측: 이전/다음(시작하기) 버튼 -->
          <div class="nav-buttons">
            <button
              type="button"
              class="btn-prev"
              :disabled="currentStep === 0"
              aria-label="이전 단계"
              @click="prevStep"
            >
              이전
            </button>
            <button
              type="button"
              class="btn-next"
              :aria-label="isLastStep ? '시작하기' : '다음 단계'"
              @click="nextOrFinish"
            >
              {{ isLastStep ? '시작하기' : '다음' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

/**
 * 각 스텝 데이터 타입
 */
interface StepItem {
  icon: string
  title: string
  desc: string
}

// 배달기사용 4단계 매뉴얼 스텝 배열 (도입 + 4단계)
const STEPS: StepItem[] = [
  { icon: 'fa-clipboard-list', title: '납품 확인 절차', desc: '아래 4단계로 진행됩니다. 링크 유효기간 내 제출해주세요.' },
  { icon: 'fa-truck', title: '1. 운송 정보 확인', desc: '운송장 번호, 배송지, 현장소장 정보를 확인하세요.' },
  { icon: 'fa-images', title: '2. 납품 사진 첨부', desc: '납품 현장 사진을 촬영하거나 앨범에서 최대 5장까지 선택하세요.' },
  { icon: 'fa-signature', title: '3. 현장소장 서명', desc: '화면의 서명란에 현장소장 서명을 받으세요.' },
  { icon: 'fa-check', title: '4. 제출', desc: '"납품 확인 완료" 버튼을 눌러 제출합니다.' }
]

// Props 정의
interface Props {
  open: boolean
}
const props = defineProps<Props>()

// Emits 정의
const emit = defineEmits<{
  (e: 'close', remember: boolean): void
}>()

// 내부 상태
const currentStep = ref(0)
const dontShowAgain = ref(false)

// open이 false → true 로 바뀔 때 상태 초기화
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      currentStep.value = 0
      dontShowAgain.value = false
    }
  }
)

// 현재 스텝 데이터
const currentStepData = computed<StepItem>(() => STEPS[currentStep.value])

// 마지막 스텝 여부
const isLastStep = computed(() => currentStep.value === STEPS.length - 1)

// 이전 스텝 이동
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 다음 스텝 이동 또는 완료
const nextOrFinish = () => {
  if (isLastStep.value) {
    emit('close', dontShowAgain.value)
  } else {
    currentStep.value++
  }
}

// X 버튼으로 닫기
const handleClose = () => {
  emit('close', dontShowAgain.value)
}
</script>

<style scoped>
/* 오버레이 */
.guide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

/* 모달 카드 */
.guide-card {
  position: relative;
  background: white;
  border-radius: 16px;
  max-width: 92vw;
  width: 380px;
  padding: 24px;
  box-sizing: border-box;
}

/* 닫기 버튼 (우상단) */
.btn-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 진행 도트 */
.step-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  transition: background 0.2s;
}
.dot.active {
  background: #3b82f6;
}

/* 스텝 콘텐츠 */
.step-content {
  text-align: center;
  padding: 0 8px 24px;
}
.step-icon {
  font-size: 48px;
  color: #3b82f6;
  margin-bottom: 16px;
  display: block;
}
.step-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px;
}
.step-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* 하단 액션바 */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

/* 다시 보지 않기 */
.dont-show-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  min-height: 44px;
}
.dont-show-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

/* 이전/다음 버튼 그룹 */
.nav-buttons {
  display: flex;
  gap: 8px;
}
.btn-prev,
.btn-next {
  min-width: 64px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, color 0.15s;
}
.btn-prev {
  background: #f3f4f6;
  color: #374151;
}
.btn-prev:hover:not(:disabled) {
  background: #e5e7eb;
}
.btn-prev:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-next {
  background: #3b82f6;
  color: white;
}
.btn-next:hover {
  background: #2563eb;
}
</style>
