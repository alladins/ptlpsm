<!--
  데모 전용 플로팅 문의 CTA (퍼널 2-2 "약한 CTA", D2)
  - 데모 인스턴스 전 화면 우하단 상시 노출. 클릭 시 플랫트리 홈페이지 문의 페이지로 이동(새 탭).
  - D2: 데모 자체 문의 접수 기능은 없음 → 모든 CTA 는 홈페이지 문의 채널로 링크.
  - 렌더 조건(isDemoMode)은 호출부(admin.vue)에서 v-if 로 게이팅 → dev/prod 번들엔 영향 없음.
-->
<template>
  <a
    v-if="inquiryHref"
    :href="inquiryHref"
    target="_blank"
    rel="noopener noreferrer"
    class="demo-cta"
    aria-label="도입 문의하기"
  >
    <i class="fas fa-comment-dots" />
    <span class="demo-cta-label">도입 문의하기</span>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 문의 페이지 base URL(.env.demo) + UTM 파라미터(유입 경로 식별, 기획서 §4-2)
const inquiryHref = computed(() => {
  const base = String(useRuntimeConfig().public.inquiryUrl || '')
  if (!base) { return '' }
  const params = 'utm_source=ptlpsm_demo&utm_medium=floating_cta&utm_campaign=solution_demo'
  return base.includes('?') ? `${base}&${params}` : `${base}?${params}`
})
</script>

<style scoped>
.demo-cta {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 9999px;
  text-decoration: none;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.demo-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.45);
}

.demo-cta i {
  font-size: 1rem;
}

/* 모바일에서는 라벨 숨기고 아이콘 버튼만 (데모 몰입 방해 최소화) */
@media (max-width: 768px) {
  .demo-cta {
    right: 14px;
    bottom: 14px;
    padding: 0.75rem;
  }

  .demo-cta-label {
    display: none;
  }
}
</style>
