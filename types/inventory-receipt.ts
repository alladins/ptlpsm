/**
 * 재고 직접 입고 타입 — 발주 없이 재고만 느는 경우
 *
 * 2026-09-21 대전제 7번: «돈을 주지 않고 재고만 늘릴 때는 발주서를 쓰지 않는다».
 * 그동안 발주서 「본사 직접입고용」 으로 우회하던 것을 이 기능이 대신한다.
 * 재고 소진의 대칭 — 작성중 → 확정, 확정해야 재고가 늘어난다.
 *
 * OEM 지급액과는 무관하다(발주가 아니므로 제조사에게 줄 돈이 생기지 않는다).
 */

/**
 * ★ 2026-09-21 고객 확정 — 유형 4종, 생산자는 모두 선택 항목
 *   «무상 입고» → «입고» (원가 직접 입력, 0원 가능), «기초 재고» → «이월 재고» (원가 기본 0)
 */
export const RECEIPT_TYPE = {
  GENERAL: 'GENERAL',
  INITIAL: 'INITIAL',
  COMPENSATION: 'COMPENSATION',
  CORRECTION: 'CORRECTION'
} as const

export type ReceiptType = typeof RECEIPT_TYPE[keyof typeof RECEIPT_TYPE]

export const RECEIPT_TYPE_LABELS: Record<ReceiptType, string> = {
  [RECEIPT_TYPE.GENERAL]: '입고',
  [RECEIPT_TYPE.INITIAL]: '이월 재고',
  [RECEIPT_TYPE.COMPENSATION]: '파손 보전',
  [RECEIPT_TYPE.CORRECTION]: '실사 보정'
}

/** 목록 표시용 — 2026-09-21 이전 유형(FREE)까지 포함 */
export const receiptTypeLabel = (t: string | null | undefined): string =>
  (t && (RECEIPT_TYPE_LABELS as Record<string, string>)[t]) || (t === 'FREE' ? '무상 입고' : (t ?? '-'))

/** 유형별 안내 — 모달에서 유형을 고르면 바로 아래에 보여준다 */
export const RECEIPT_TYPE_HINTS: Record<ReceiptType, string> = {
  [RECEIPT_TYPE.GENERAL]: '발주 없이 들어온 재고입니다(무상 제공 포함). 원가를 입력하세요 — 무상이면 0. 생산자를 고르고 원가를 비우면 입고일 시점 원가표로 채웁니다.',
  [RECEIPT_TYPE.INITIAL]: '시스템 도입 전부터 있던 재고입니다. 원가는 기본 0원이며, 실제 매입 원가를 알면 입력하세요.',
  [RECEIPT_TYPE.COMPENSATION]: '배송 파손 등으로 대체 받은 물량입니다. 파손된 물건의 원가를 입력하세요. 생산자를 고르고 비우면 입고일 시점 원가표로 채웁니다.',
  [RECEIPT_TYPE.CORRECTION]: '실사해 보니 장부보다 많았던 수량입니다. 원가를 입력하세요. 생산자를 고르고 비우면 입고일 시점 원가표로 채웁니다.'
}

/** 원가를 비우면 0 으로 들어가는 유형 (이월 재고) */
export const costDefaultsToZero = (t: ReceiptType | string | null | undefined) => t === RECEIPT_TYPE.INITIAL

/** 생산자 선택지 (리드파워 본사 + 원가 등록 회사) */
export interface ProducerOption {
  id: number
  companyName: string
  companyType: string
}

export const RECEIPT_STATUS = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
} as const

export type ReceiptStatus = typeof RECEIPT_STATUS[keyof typeof RECEIPT_STATUS]

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  [RECEIPT_STATUS.DRAFT]: '작성중',
  [RECEIPT_STATUS.CONFIRMED]: '확정',
  [RECEIPT_STATUS.CANCELLED]: '취소'
}

export interface InventoryReceipt {
  receiptId: number
  receiptNo: string
  receiptType: ReceiptType
  warehouseId: number
  warehouseName: string | null
  skuId: string
  skuName: string | null
  /** 수량(㎡) */
  quantity: number
  sheetCount: number | null
  producerCompanyId: number | null
  producerCompanyName: string | null
  /** 원가(원/㎡) */
  unitCost: number
  /** 금액 — 장부 기준값 */
  amount: number
  receiptDate: string
  remarks: string
  status: ReceiptStatus
  /** 현재고(㎡) — 확정 취소 시 이만큼 빠진다 */
  currentStock: number | null
  confirmedAt: string | null
  confirmedBy: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancelReason: string | null
  createdAt: string
  createdBy: string | null
}

export interface InventoryReceiptCreateRequest {
  receiptType: ReceiptType
  warehouseId: number
  skuId: string
  quantity: number | null
  sheetCount: number | null
  producerCompanyId: number | null
  /** 비우면 서버가 입고일 시점 원가로 채운다(무상은 0 고정) */
  unitCost: number | null
  receiptDate: string
  remarks: string
}

export interface InventoryReceiptSearchParams {
  receiptType?: string | null
  warehouseId?: number | null
  producerCompanyId?: number | null
  status?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  keyword?: string | null
  page?: number
  size?: number
}

/**
 * 확정 취소 가능 여부 — 확정 후 이 물량이 이미 나갔으면 되돌릴 수 없다.
 * (서버 InventoryService.processOutbound 가 재고 부족으로 막는다 — 같은 조건)
 */
export function canCancelConfirmed (r: InventoryReceipt): boolean {
  return (r.currentStock ?? 0) >= r.quantity
}
