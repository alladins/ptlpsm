/**
 * 계약 품목 귀속 상태 조회 + 가드 판단 (화면 공용)
 *
 * @created 2026-10-02
 * @see docs/PLAN_계약품목귀속_20261002.md «1-b단계»
 *
 * 외부 서류를 만드는 버튼(기성 청구·잔금·납품완료 서류 발행/재발행/서명 요청)은
 * 귀속 미지정이 있으면 백엔드가 400 으로 막는다. 화면은 미리 조회해서 GuardedButton 으로 이유와
 * «무엇을 하면 되는지»를 먼저 보여준다.
 *
 * ⚠ 조회 실패(네트워크·백엔드 미배포 등)는 막지 않는다(fail-open). 최종 차단은 백엔드 400 이 하고,
 *   그 메시지는 각 화면의 에러 처리가 그대로 보여준다. 조회 실패로 정상 업무까지 막히는 것을 피하기 위함.
 */
import { ref, computed } from 'vue'
import { contractAllocService } from '~/services/contract-alloc.service'
import { ApiError } from '~/services/api/client'
import type { ContractAllocStatus, UnallocatedShipmentItem } from '~/types/contract-alloc'

export function useContractAllocStatus () {
  const status = ref<ContractAllocStatus | null>(null)
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  // 권한 없음(403) — 이 역할은 귀속 API 를 못 쓴다. 패널은 조용히 숨기고 가드는 fail-open
  const forbidden = ref(false)

  // 요청 순번 — 빠르게 다시 불렀을 때 늦게 온 이전 응답이 최신 상태를 덮어쓰지 않게 한다
  let seq = 0

  async function run (fetcher: () => Promise<ContractAllocStatus>) {
    const mySeq = ++seq
    loading.value = true
    loadError.value = null
    forbidden.value = false
    try {
      const result = await fetcher()
      if (mySeq !== seq) { return }
      status.value = result
    } catch (e: unknown) {
      if (mySeq !== seq) { return }
      console.error('계약 품목 귀속 상태 조회 실패', e)
      status.value = null
      forbidden.value = e instanceof ApiError && e.status === 403
      loadError.value = e instanceof Error ? e.message : '계약 품목 귀속 상태를 불러오지 못했습니다.'
    } finally {
      if (mySeq === seq) { loading.value = false }
    }
  }

  /** 발주 기준 조회 */
  function loadByOrder (orderId: number | null | undefined) {
    if (!orderId) { reset(); return Promise.resolve() }
    return run(() => contractAllocService.getByOrder(orderId))
  }

  /** 출하 기준 조회 */
  function loadByShipment (shipmentId: number | null | undefined) {
    if (!shipmentId) { reset(); return Promise.resolve() }
    return run(() => contractAllocService.getByShipment(shipmentId))
  }

  function reset () {
    seq++
    status.value = null
    loading.value = false
    loadError.value = null
    forbidden.value = false
  }

  /** 귀속 미지정 품목 목록 (비표준 발주는 대상 아님) */
  const unallocatedItems = computed<UnallocatedShipmentItem[]>(() => {
    const s = status.value
    if (!s || s.nonStandard) { return [] }
    return (s.items || [])
      .filter(it => !it.allocated)
      .map(it => ({
        shipmentId: it.shipmentId,
        shipmentNo: it.shipmentNo,
        shipSkuId: it.shipSkuId,
        shipSkuName: it.shipSkuName,
        shipmentQuantity: it.shipmentQuantity
      }))
  })

  /** 미지정 건수 — 서버 unallocatedCount 우선, 없으면 목록 길이 */
  const unallocatedCount = computed(() => {
    const s = status.value
    if (!s || s.nonStandard) { return 0 }
    return typeof s.unallocatedCount === 'number' ? s.unallocatedCount : unallocatedItems.value.length
  })

  /** 막아야 하는가 */
  const blocked = computed(() => unallocatedCount.value > 0)

  return {
    status,
    loading,
    loadError,
    forbidden,
    unallocatedItems,
    unallocatedCount,
    blocked,
    loadByOrder,
    loadByShipment,
    reset
  }
}

/**
 * GuardedButton reason 문구 — «왜 막혔는지 + 무엇을 하면 풀리는지»
 * @param count  미지정 건수
 * @param action 막힌 동작 이름 (예: '기성 청구')
 * @param where  지정하는 곳 안내 (예: '아래 «계약 품목 귀속» 칸')
 */
export function contractAllocBlockedReason (count: number, action: string, where = '납품완료 상세(또는 출하 수정)의 «계약 품목 귀속»'): string {
  return `계약에 없는 품목으로 나간 출하 ${count}건의 계약 품목이 지정되지 않아 [${action}]을(를) 진행할 수 없습니다.\n` +
    `${where}에서 B급·합지로 채운 계약 품목을 지정하세요.\n` +
    '(계약에 없던 품목을 새로 납품한 경우에는 조달청 변경계약을 먼저 등록하세요.)'
}

/** 링크: 납품완료 상세의 귀속 지정 위치 */
export function contractAllocDeliveryDoneLink (deliveryDoneId: number | null | undefined): string | null {
  return deliveryDoneId ? `/admin/delivery-done/detail/${deliveryDoneId}#contract-alloc` : null
}

/** 링크: 출하 수정의 귀속 지정 위치 */
export function contractAllocShipmentLink (shipmentId: number | null | undefined): string | null {
  return shipmentId ? `/admin/shipping/edit/${shipmentId}#contract-alloc` : null
}
