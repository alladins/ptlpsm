<!--
  ContractAllocGuardNotice — 계약 품목 귀속 미지정으로 외부 서류 동작이 막혔을 때의 안내 + 바로가기

  GuardedButton 의 이유 팝업(alert)에는 링크를 넣을 수 없어서, 버튼 근처에 이 안내를 함께 둔다.
  - 핵심 한 줄은 늘 보이고(GuideNotice), 왜 막혔는지는 [자세히 보기]
  - [계약 품목 귀속 지정하러 가기] 링크 (to 가 있으면 그곳 하나, 없으면 출하별 «출하 수정» 링크)

  사용 예)
    <ContractAllocGuardNotice
      v-if="allocBlocked"
      :count="unallocatedCount"
      :items="unallocatedItems"
      action="기성 청구"
      :to="contractAllocDeliveryDoneLink(deliveryDoneId)"
      @navigate="closeModal"
    />
-->
<template>
  <div class="ca-guard">
    <GuideNotice icon="fa-link" tone="warn">
      <template #summary>
        계약 품목이 지정되지 않은 출하 품목 <b>{{ count }}건</b> — 지정해야 <b>[{{ action }}]</b>을(를) 할 수 있습니다
      </template>
      <p>
        외부 서류는 품목·수량이 <b>계약 그대로</b> 나갑니다. 계약에 없는 품목(B급·합지)으로 나간 출하는
        어느 계약 품목을 채웠는지 지정해야 서류 집계에 들어갑니다. 지정하지 않으면 그 수량이 서류에서 빠지므로 발행을 막습니다.
      </p>
      <ul v-if="items.length > 0">
        <li v-for="it in visibleItems" :key="`${it.shipmentId}-${it.shipSkuId}`">
          출하 {{ it.shipmentNo || it.shipmentId }} · {{ it.shipSkuName || it.shipSkuId }} · {{ fmtQty(it.shipmentQuantity) }}
        </li>
        <li v-if="items.length > visibleItems.length">
          외 {{ items.length - visibleItems.length }}건
        </li>
      </ul>
      <template #note>
        계약에 없던 품목을 새로 납품한 경우에는 조달청 변경계약을 먼저 등록하세요. 변경계약이 등록되면 그 품목이 계약 품목이 되어 이 안내가 사라집니다.
      </template>
    </GuideNotice>

    <div class="ca-guard-links">
      <NuxtLink v-if="to" :to="to" class="ca-guard-link" @click="emit('navigate')">
        <i class="fas fa-arrow-right" /> 계약 품목 귀속 지정하러 가기
      </NuxtLink>
      <template v-else>
        <NuxtLink
          v-for="s in shipmentLinks"
          :key="s.shipmentId"
          :to="s.to"
          class="ca-guard-link"
          @click="emit('navigate')"
        >
          <i class="fas fa-arrow-right" /> 출하 {{ s.label }} 에서 지정하기
        </NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UnallocatedShipmentItem } from '~/types/contract-alloc'
import { contractAllocShipmentLink } from '~/composables/useContractAllocStatus'

interface Props {
  /** 미지정 건수 */
  count: number
  /** 미지정 품목 목록 (없으면 건수만 표시) */
  items?: UnallocatedShipmentItem[]
  /** 막힌 동작 이름 (예: '기성 청구') */
  action: string
  /** 지정하러 갈 곳 (예: 납품완료 상세 #contract-alloc). 없으면 출하별 출하 수정 링크 */
  to?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  to: null
})

const emit = defineEmits<{
  /** 링크를 눌렀다 — 모달 안에서 쓰면 닫는 데 쓴다 */
  navigate: []
}>()

const MAX_VISIBLE = 8
const visibleItems = computed(() => props.items.slice(0, MAX_VISIBLE))

/** 출하별 «출하 수정» 링크 (중복 출하 제거) */
const shipmentLinks = computed(() => {
  const seen = new Set<number>()
  const list: { shipmentId: number; label: string; to: string }[] = []
  for (const it of props.items) {
    if (seen.has(it.shipmentId)) { continue }
    seen.add(it.shipmentId)
    const to = contractAllocShipmentLink(it.shipmentId)
    if (to) { list.push({ shipmentId: it.shipmentId, label: it.shipmentNo || String(it.shipmentId), to }) }
  }
  return list
})

const fmtQty = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
</script>

<style scoped>
.ca-guard {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0.75rem 0;
}
.ca-guard-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
/* 터치 44px */
.ca-guard-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  background: #fff;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}
.ca-guard-link:hover {
  background: #fffbeb;
}
</style>
