<!--
  GuardedButton — 업무 조건이 안 맞는 버튼을 "죽은 버튼"으로 두지 않는다.

  ❌ 기존 방식:  :disabled="!canConfirm(r)" :title="이유"
     → 버튼이 아예 안 눌리고, 이유는 마우스를 올려야만 보인다.
       고객은 "버튼이 클릭이 안 된다"고 전화한다(2026-09-21 실제 접수).
       터치 기기에는 마우스오버 자체가 없어 이유를 볼 방법이 없다.

  ✅ 이 컴포넌트: blocked 면 눌리긴 하되, 클릭하면 이유를 팝업으로 알려준다.
     화면상으로는 여전히 흐리게 보여 "지금은 안 되는 버튼"임을 알 수 있다.

  ⚠ blocked 와 disabled 는 다르다.
     - blocked  : 업무 조건 미충족 (재고 부족 / 원가 미등록 / 이전 단계 미완료).
                  사용자가 무언가를 하면 풀린다 → 무엇을 해야 하는지 알려줘야 한다.
     - disabled : 로딩·전송중처럼 곧 저절로 풀리는 일시 상태.
                  알려줄 것이 없으므로 기존처럼 진짜로 비활성화한다.

  reason 은 "왜 막혔는지 + 무엇을 하면 풀리는지"까지 쓸 것.
  ("원가가 0원입니다" ❌ → "원가가 0원입니다. 기초정보 > OEM 원가 관리에서 등록하세요" ✅)

  사용 예)
    <GuardedButton
      class="btn-mini primary"
      :blocked="!canConfirm(r)"
      :reason="confirmHint(r)"
      @click="handleConfirm(r)"
    >확정</GuardedButton>
-->
<template>
  <button
    v-bind="$attrs"
    :class="{ 'gb-blocked': blocked && !disabled }"
    :disabled="disabled"
    :title="blocked ? reason : undefined"
    :aria-disabled="blocked || undefined"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  /** 업무 조건 미충족 — 눌리긴 하되 클릭 시 reason 을 안내한다 */
  blocked?: boolean
  /** 막힌 이유 + 해소 방법. 클릭 시 팝업으로 보여준다 */
  reason?: string
  /** 로딩·전송중 등 일시 상태 — 진짜 비활성화 */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  blocked: false,
  reason: '',
  disabled: false
})

const emit = defineEmits<{ click: [MouseEvent] }>()

const onClick = (e: MouseEvent) => {
  if (props.disabled) { return }

  if (props.blocked) {
    // 막힌 상태에서는 원래 동작이 절대 일어나면 안 된다.
    // 상위 요소(행 클릭으로 상세 이동 등)까지 전파되는 것도 막는다.
    e.preventDefault()
    e.stopPropagation()
    alert(props.reason || '지금은 실행할 수 없습니다.')
    return
  }

  emit('click', e)
}
</script>

<style scoped>
/*
 * 비활성처럼 흐리게 보이되 커서는 손가락 — "눌러도 되는 버튼"임을 알린다.
 * :disabled 와 달리 실제로는 살아 있으므로 hover 시 살짝 진해진다.
 */
.gb-blocked {
  opacity: 0.45;
  transition: opacity 0.15s;
}

.gb-blocked:hover {
  opacity: 0.7;
}
</style>
