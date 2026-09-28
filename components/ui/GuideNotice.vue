<!--
  GuideNotice — 화면 안 설명·안내문의 공통 형태 (접었다 펴는 안내)

  ❌ 긴 안내문을 항상 펼쳐 두면 입력 칸을 밀어내고, 매번 보는 사람에게는 소음이 된다.
  ❌ 전부 접어 두면 꼭 알아야 할 한 줄까지 안 보인다.
  ✅ 핵심 한 줄(summary)은 늘 보이고, 자세한 설명은 [처리 순서 보기] 로 펼친다.

  summary 는 «이것만 알면 사고가 안 나는 한 줄» 로 쓴다.
    ("안내" ❌ → "매출원장 반영은 손실관리에서 [차감]을 눌러야 합니다" ✅)
  펼친 내용은 기본 슬롯에, 맨 아래 주의 한 줄은 #note 슬롯에 넣는다.

  사용 예)
    <GuideNotice icon="fa-route" open-label="처리 순서 보기">
      <template #summary>매출원장 반영은 손실관리에서 <b>[차감]</b>을 눌러야 합니다</template>
      <ol><li>…</li></ol>
      <template #note>[차감] 뒤에는 화면에서 수정·취소할 수 없습니다.</template>
    </GuideNotice>

  처음 쓰인 곳: components/loss/LossAdjustmentModal.vue (2026-09-28)
-->
<template>
  <div class="guide-notice" :class="`tone-${tone}`">
    <i class="fas gn-icon" :class="icon" />
    <div class="gn-body">
      <button type="button" class="gn-toggle" :aria-expanded="open" @click="open = !open">
        <span class="gn-summary">
          <slot name="summary">{{ summary }}</slot>
        </span>
        <span class="gn-toggle-label">
          {{ open ? closeLabel : openLabel }}
          <i class="fas" :class="open ? 'fa-chevron-up' : 'fa-chevron-down'" />
        </span>
      </button>
      <div v-if="open" class="gn-detail">
        <slot />
        <small v-if="$slots.note" class="gn-note"><slot name="note" /></small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  /** 늘 보이는 핵심 한 줄 (#summary 슬롯이 있으면 그쪽 우선) */
  summary?: string
  /** Font Awesome 아이콘 클래스 */
  icon?: string
  /** 색 — warn(노랑·주의), info(파랑·참고) */
  tone?: 'warn' | 'info'
  /** 처음부터 펼칠지 (기본 접힘) */
  defaultOpen?: boolean
  openLabel?: string
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  summary: '',
  icon: 'fa-circle-info',
  tone: 'warn',
  defaultOpen: false,
  openLabel: '자세히 보기',
  closeLabel: '안내 닫기'
})

const open = ref(props.defaultOpen)
</script>

<style scoped>
.guide-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid;
  border-radius: 6px;
  font-size: 0.86rem;
  line-height: 1.5;
}
.tone-warn { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.tone-info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }

.gn-icon { margin-top: 0.2rem; }
.gn-body { flex: 1; min-width: 0; }

.gn-toggle {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.gn-toggle-label {
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: underline;
}

.gn-detail :deep(ol),
.gn-detail :deep(ul) {
  margin: 0.35rem 0 0.3rem;
  padding-left: 1.2rem;
}
.gn-detail :deep(li) { margin-bottom: 0.2rem; }
.gn-detail :deep(p) { margin: 0.35rem 0; }
.gn-note { display: block; opacity: 0.85; }
</style>
