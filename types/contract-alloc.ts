/**
 * 계약 품목 귀속 (출하 품목 → 계약 품목·수량) 타입
 *
 * @created 2026-10-02
 * @see docs/PLAN_계약품목귀속_20261002.md («0. 대전제», «1-b단계»)
 *
 * 대전제: 외부 서류(기성청구·납품확인서·완료계·인수증 등)는 품목·수량이 계약(order_items) 그대로 나간다.
 * 계약에 없는 SKU 로 나간 출하 행(B급·합지)은 «어느 계약 품목을 몇 개 채웠는지» 귀속을 지정해야
 * 외부 서류 집계에 들어간다. 지정이 없으면(= 귀속 미지정) 서류 발행이 막힌다.
 */

/** 귀속 유형 — 저장 가능한 값은 B급·합지·대체 (품목 추가는 저장 없음, 변경계약 안내) */
export const CONTRACT_ALLOC_TYPE = {
  BGRADE: 'BGRADE',
  LAMINATE: 'LAMINATE',
  /** 대체 — 다른 두께로 대신 납품하고 조달청엔 계약 품목으로 청구 (사용자 확정 2026-10-02) */
  SUBSTITUTE: 'SUBSTITUTE'
} as const

export type ContractAllocType = typeof CONTRACT_ALLOC_TYPE[keyof typeof CONTRACT_ALLOC_TYPE]

export const CONTRACT_ALLOC_TYPE_LABELS: Record<ContractAllocType, string> = {
  [CONTRACT_ALLOC_TYPE.BGRADE]: 'B급',
  [CONTRACT_ALLOC_TYPE.LAMINATE]: '합지',
  [CONTRACT_ALLOC_TYPE.SUBSTITUTE]: '대체'
}

/** 계약 품목 (order_items — 기준계약 + 변경계약 계열) */
export interface ContractAllocContractItem {
  orderItemId: number
  orderId: number
  skuId: string | null
  skuName: string | null
  productName: string | null
  specification: string | null
  /** 두께(T). 합지 검증(두께 합 = 출하 두께)에 쓴다 */
  thickness: number | null
  unit: string | null
  quantity: number
  unitPrice: number | null
}

/** 현재 저장된 귀속 1행 */
export interface ContractAllocation {
  allocId: number
  orderItemId: number
  contractSkuId: string | null
  contractSkuName: string | null
  quantity: number
}

/** 추천(자동 채움) 귀속 1행 */
export interface ContractAllocSuggestionRow {
  orderItemId: number
  quantity: number
}

/** 서버 추천 — 지금은 B급(원 SKU 가 계약 품목)만 온다 */
export interface ContractAllocSuggestion {
  allocType: ContractAllocType
  allocations: ContractAllocSuggestionRow[]
}

/** 계약 외 출하 품목 1행 (출하 × 출하 SKU) */
export interface ContractAllocShipmentItem {
  shipmentId: number
  shipmentNo: string | null
  shipmentDate: string | null
  /** 실물 SKU (내부 화면 전용 — 외부 서류에는 나가지 않는다) */
  shipSkuId: string
  shipSkuName: string | null
  shipThickness: number | null
  shipmentQuantity: number
  allocated: boolean
  allocType: ContractAllocType | null
  allocations: ContractAllocation[]
  suggestion: ContractAllocSuggestion | null
  /** 출하 금액 (실물 SKU 기준, 참고용) */
  shipAmount?: number | null
  /** 귀속 금액 = Σ 귀속 수량 × 계약 단가 (참고용) */
  allocAmount?: number | null
}

/** GET /admin/contract-alloc/orders/{orderId} · /shipments/{shipmentId} 응답 */
export interface ContractAllocStatus {
  orderId: number
  /** 비표준 발주(order_items.sku_id 전부 NULL) — 귀속 대상 아님 */
  nonStandard: boolean
  unallocatedCount: number
  contractItems: ContractAllocContractItem[]
  items: ContractAllocShipmentItem[]
}

/** PUT /admin/contract-alloc/shipments/{shipmentId}/items/{shipSkuId} 본문 */
export interface ContractAllocSaveRequest {
  allocType: ContractAllocType
  allocations: ContractAllocSuggestionRow[]
}

/**
 * 귀속 미지정 출하 품목 (가드 안내용 공통 모양)
 * - 기성 미리보기 응답의 unallocatedItems 와 같은 모양
 * - 귀속 조회 응답의 items(allocated=false) 를 이 모양으로 바꿔 쓴다
 */
export interface UnallocatedShipmentItem {
  shipmentId: number
  shipmentNo: string | null
  shipSkuId: string
  shipSkuName: string | null
  shipmentQuantity: number
}

/**
 * 기성 미리보기 — 이번 차수 청구에서 빠지는 계약 기준 수량
 * (예: 변경계약 계열의 다른 발주 품목으로 귀속된 수량). 차수 생성은 막지 않고 경고만 보여준다.
 */
export interface BaselineExcludedItem {
  skuId: string | null
  skuName: string | null
  quantity: number
  reason: string | null
}
